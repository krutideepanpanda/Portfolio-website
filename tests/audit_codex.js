const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const CODEX_PAGES = [
  'Codex/index.html',
  'Codex/about.html',
  'Codex/experience.html',
  'Codex/projects.html',
  'Codex/skills.html',
  'Codex/leadership.html',
  'Codex/contact.html',
  'Codex/blog.html'
];
const VIEWPORTS = [
  { name: 'phone', width: 320, height: 568 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'desktop', width: 1440, height: 1000 }
];

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8'
};

function createServer() {
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(ROOT, relativePath);
    if (!filePath.startsWith(ROOT + path.sep) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(response);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function audit() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    for (const viewport of VIEWPORTS) {
      for (const route of CODEX_PAGES) {
        const page = await browser.newPage();
        const runtimeErrors = [];
        page.on('pageerror', (error) => runtimeErrors.push(error.message));
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.goto(`${base}/${route}`, { waitUntil: 'networkidle0' });
        if (route.endsWith('blog.html')) await page.waitForSelector('.post-card', { timeout: 10000 });

        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          h1Count: document.querySelectorAll('h1').length,
          title: document.title,
          emptyLinks: [...document.querySelectorAll('a[href]')].filter((link) => !link.getAttribute('href').trim()).length,
          unsafeExternalLinks: [...document.querySelectorAll('a[target="_blank"]')].filter((link) => !link.rel.split(/\s+/).includes('noopener')).length
        }));
        assert(!result.overflow, `${route} overflows at ${viewport.name} (${viewport.width}px)`);
        assert(result.h1Count === 1, `${route} must contain exactly one h1`);
        assert(result.title && !result.title.startsWith('http'), `${route} is missing a descriptive title`);
        assert(result.emptyLinks === 0, `${route} contains an empty link`);
        assert(result.unsafeExternalLinks === 0, `${route} contains an unsafe external link`);
        assert(runtimeErrors.length === 0, `${route} has runtime errors: ${runtimeErrors.join('; ')}`);
        await page.close();
      }
    }

    const blogPage = await browser.newPage();
    await blogPage.goto(`${base}/Codex/blog.html`, { waitUntil: 'networkidle0' });
    await blogPage.waitForSelector('.post-card', { timeout: 10000 });
    assert(await blogPage.$$eval('.post-card', (cards) => cards.length) === 5, 'Blog must render all five shared posts');
    await blogPage.close();

    const articlePage = await browser.newPage();
    await articlePage.goto(`${base}/Codex/article.html?id=google-antigravity-initial-impressions`, { waitUntil: 'networkidle0' });
    await articlePage.waitForSelector('.article-content p', { timeout: 15000 });
    assert(await articlePage.$eval('.article-header h1', (heading) => heading.textContent.includes('Initial impressions')), 'Known article did not render');
    await articlePage.goto(`${base}/Codex/article.html?id=..%2F..%2Findex`, { waitUntil: 'networkidle0' });
    await articlePage.waitForSelector('.article-error', { timeout: 5000 });
    await articlePage.close();

    const motionPage = await browser.newPage();
    await motionPage.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await motionPage.goto(`${base}/Codex/index.html`, { waitUntil: 'networkidle0' });
    assert(await motionPage.$eval('.reveal', (element) => getComputedStyle(element).opacity === '1'), 'Reduced-motion content must remain visible');
    await motionPage.close();

    const projectsPage = await browser.newPage();
    await projectsPage.goto(`${base}/Codex/projects.html`, { waitUntil: 'networkidle0' });
    const projectHeadings = await projectsPage.$$eval(
      '.project-group-heading h2, .github-heading h2',
      (headings) => headings.map((heading) => heading.textContent.trim())
    );
    assert(
      JSON.stringify(projectHeadings) === JSON.stringify(['Industry projects.', 'Academic projects.', 'Open-source work.']),
      'Projects must keep industry, academic, and public repository sections separate'
    );
    assert(await projectsPage.$$eval('.repo-card h2', (headings) => headings.every((heading) => !heading.textContent.includes('_'))), 'Repository titles must be human-readable');
    assert(await projectsPage.$$eval('.repo-card h2', (headings) => headings.every((heading) => heading.textContent.trim().toLowerCase() !== 'krutideepanpanda.github.io')), 'Obsolete GitHub Pages repository must stay excluded');
    await projectsPage.close();

    const contactPage = await browser.newPage();
    await contactPage.goto(`${base}/Codex/contact.html`, { waitUntil: 'networkidle0' });
    assert(await contactPage.$('a[href^="mailto:krutideepan123@gmail.com"]'), 'Contact page must use the verified email address');
    assert(!(await contactPage.$('a[href*="contact@krutideepanpanda.com"]')), 'Contact page contains the retired email address');
    await contactPage.close();

    const aboutTabletPage = await browser.newPage();
    for (const width of [761, 768, 900]) {
      await aboutTabletPage.setViewport({ width, height: 900 });
      await aboutTabletPage.goto(`${base}/Codex/about.html`, { waitUntil: 'networkidle0' });
      const interestColumns = await aboutTabletPage.$eval(
        '.content-grid:last-of-type .personal-grid',
        (grid) => getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length
      );
      assert(interestColumns === 1, `About interests must use one readable column at ${width}px`);
    }
    await aboutTabletPage.close();

    const portalPage = await browser.newPage();
    for (const viewport of VIEWPORTS) {
      await portalPage.setViewport({ width: viewport.width, height: viewport.height });
      await portalPage.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
      assert(
        !(await portalPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
        `Comparison portal overflows at ${viewport.name} (${viewport.width}px)`
      );
    }
    assert(await portalPage.$('a[href="Codex/index.html"]'), 'Comparison portal is missing the Codex portfolio link');
    assert(await portalPage.$('a[href="Codex/blog.html"]'), 'Comparison portal is missing the Codex blog link');
    assert(await portalPage.$('a[href="Antigravity/index.html"]'), 'Comparison portal is missing the Antigravity portfolio link');
    assert(await portalPage.$('a[href="Antigravity/landing.html"]'), 'Comparison portal is missing the previous Antigravity landing link');
    const previousLandingSource = fs.readFileSync(path.join(ROOT, 'Antigravity', 'landing.html'), 'utf8');
    assert(previousLandingSource.includes('href="index.html"'), 'Previous landing is missing the Antigravity portfolio link');
    assert(previousLandingSource.includes('href="../index.html"'), 'Previous landing is missing the current landing link');
    assert(previousLandingSource.includes('badge-ongoing') && previousLandingSource.includes('Ongoing'), 'Previous landing must keep Codex marked Ongoing');
    const antigravitySource = fs.readFileSync(path.join(ROOT, 'Antigravity', 'index.html'), 'utf8');
    assert(antigravitySource.includes('href="../index.html"'), 'Antigravity landing is missing its return-to-portal link');
    const codexStatus = await portalPage.$eval('.build-active .status', (element) => element.textContent.trim());
    assert(codexStatus === 'Ongoing', 'OpenAI Codex must remain marked Ongoing');
    const statusReadability = await portalPage.$$eval('.status', (statuses) => statuses.every((status) => {
      const statusBox = status.getBoundingClientRect();
      const railBox = status.parentElement.getBoundingClientRect();
      return getComputedStyle(status).writingMode === 'horizontal-tb'
        && Number.parseFloat(getComputedStyle(status).fontSize) >= 12
        && statusBox.left >= railBox.left
        && statusBox.right <= railBox.right;
    }));
    assert(statusReadability, 'Comparison status labels must remain horizontal, legible, and inside their rails');
    assert(await portalPage.$eval('.build-queued', (card) => getComputedStyle(card).opacity === '1'), 'Queued comparison card must retain readable contrast');
    const queuedContrastPass = await portalPage.$$eval(
      '.build-queued .status-queued, .build-queued h3, .build-queued .build-body > p, .build-queued .button-disabled, .build-queued .muted',
      (elements) => {
        const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = (value) => rgb(value).map((channel) => {
          const normalized = channel / 255;
          return normalized <= .03928 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
        }).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
        const background = (element) => {
          for (let node = element; node; node = node.parentElement) {
            const color = getComputedStyle(node).backgroundColor;
            const parts = color.match(/[\d.]+/g)?.map(Number) || [];
            if (parts.length === 3 || (parts.length === 4 && parts[3] > 0)) return color;
          }
          return 'rgb(255, 255, 255)';
        };
        return elements.every((element) => {
          const foregroundLuminance = luminance(getComputedStyle(element).color);
          const backgroundLuminance = luminance(background(element));
          return (Math.max(foregroundLuminance, backgroundLuminance) + .05)
            / (Math.min(foregroundLuminance, backgroundLuminance) + .05) >= 4.5;
        });
      }
    );
    assert(queuedContrastPass, 'Queued comparison text must meet WCAG AA contrast');
    assert(await portalPage.$('a[href="mailto:krutideepan123@gmail.com"]'), 'Comparison portal must use the verified email address');
    await portalPage.close();

    console.log('Codex portfolio audit passed: routes, responsive layouts, project grouping, contact details, blog rendering, safe article IDs, links, and reduced motion.');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

audit().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
