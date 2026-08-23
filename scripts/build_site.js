const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const rootFiles = [
  '.nojekyll', 'CNAME', 'apple-touch-icon.png', 'comparison-og.png',
  'comparison.css', 'favicon-192x192.png', 'favicon-512x512.png',
  'favicon-96x96.png', 'favicon.ico', 'feed.xml', 'index.html', 'robots.txt',
  'rss.xml', 'site.webmanifest', 'sitemap.xml'
];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /phoneB64|obf-phone|href\s*=\s*["']tel:/i
];
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.txt', '.webmanifest', '.xml']);

const assertInside = (candidate, parent) => {
  const relative = path.relative(parent, candidate);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Unsafe build path: ${candidate}`);
  }
};

const copyFile = (source, destination) => {
  assertInside(source, root);
  assertInside(destination, output);
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Refusing non-file asset: ${source}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
};

const copyTree = (source, destination, exclusions = new Set()) => {
  fs.readdirSync(source, { withFileTypes: true }).forEach((entry) => {
    if (exclusions.has(entry.name)) return;
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${sourcePath}`);
    if (entry.isDirectory()) copyTree(sourcePath, destinationPath, exclusions);
    else if (entry.isFile()) copyFile(sourcePath, destinationPath);
  });
};

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
rootFiles.forEach((name) => copyFile(path.join(root, name), path.join(output, name)));
copyTree(path.join(root, 'Codex'), path.join(output, 'Codex'));
copyTree(path.join(root, 'Antigravity'), path.join(output, 'Antigravity'), new Set(['md-loader.js']));

const postsPath = path.join(root, 'Blog', 'posts.json');
const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
if (!Array.isArray(posts) || posts.length === 0) throw new Error('Blog/posts.json is invalid');
const ids = new Set();
posts.forEach((post) => {
  if (!post || typeof post.id !== 'string' || !/^[a-z0-9_-]+$/i.test(post.id) || ids.has(post.id)) {
    throw new Error('Blog index contains an unsafe or duplicate post ID');
  }
  ids.add(post.id);
  copyFile(
    path.join(root, 'Blog', post.id, 'article.md'),
    path.join(output, 'Blog', post.id, 'article.md')
  );
});
copyFile(postsPath, path.join(output, 'Blog', 'posts.json'));
copyFile(path.join(root, 'Blog', 'rss.xml'), path.join(output, 'Blog', 'rss.xml'));

const auditOutput = (directory) => {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return auditOutput(item);
    const extension = path.extname(entry.name).toLowerCase();
    if (textExtensions.has(extension) || entry.name === 'CNAME' || entry.name === '.nojekyll') {
      const content = fs.readFileSync(item, 'utf8');
      if (secretPatterns.some((pattern) => pattern.test(content))) {
        throw new Error(`Sensitive pattern blocked from deployment: ${path.relative(output, item)}`);
      }
    }
  });
};

auditOutput(output);
console.log(`Secure Pages artifact built with ${ids.size} validated blog posts.`);
