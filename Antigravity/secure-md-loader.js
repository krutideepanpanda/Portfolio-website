/** Repository-backed Markdown rendering with strict article and DOM validation. */
const MARKED_URL = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
const MARKED_INTEGRITY = 'sha384-zbcZAIxlvJtNE3Dp5nxLXdXtXyxwOdnILY1TDPVmKFhl4r4nSUG1r8bcFXGVa4Te';
const POST_ID_PATTERN = /^[a-z0-9_-]+$/i;
const FRONTMATTER_KEYS = new Set([
  'title', 'date', 'readTime', 'category', 'author', 'role', 'tags',
  'series', 'seriesTitle', 'chapter', 'experimentResult'
]);
const ALLOWED_MARKDOWN_TAGS = new Set([
  'a', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'p', 'pre', 'strong', 'table',
  'tbody', 'td', 'th', 'thead', 'tr', 'ul'
]);
const DROP_WITH_CONTENT = new Set([
  'audio', 'base', 'button', 'canvas', 'embed', 'form', 'iframe', 'input',
  'link', 'math', 'meta', 'noscript', 'object', 'option', 'script', 'select',
  'source', 'style', 'svg', 'template', 'textarea', 'track', 'video'
]);

const asText = (value, fallback = '', maxLength = 300) => {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : fallback;
};

const makeElement = (tag, className = '', text = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const fetchFirst = async (paths, type = 'text') => {
  for (const path of paths) {
    try {
      const response = await fetch(path, {
        headers: { Accept: type === 'json' ? 'application/json' : 'text/markdown, text/plain' }
      });
      if (response.ok) return type === 'json' ? response.json() : response.text();
    } catch (error) {
      console.warn(`Could not load ${path}:`, error);
    }
  }
  throw new Error('The requested portfolio content could not be loaded.');
};

const parseFrontmatter = (markdown) => {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { metadata: Object.create(null), body: markdown };
  const metadata = Object.create(null);
  match[1].split(/\r?\n/).forEach((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) return;
    const key = line.slice(0, separator).trim();
    if (!FRONTMATTER_KEYS.has(key)) return;
    let value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    if (key === 'tags') {
      value = value.replace(/^\[|\]$/g, '').split(',')
        .map((tag) => tag.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
        .slice(0, 12);
    }
    metadata[key] = value;
  });
  return { metadata, body: match[2] };
};

const normalizeTags = (tags) => (
  Array.isArray(tags)
    ? tags.map((tag) => asText(tag, '', 40)).filter(Boolean).slice(0, 12)
    : []
);

const normalizeMetadata = (indexPost, frontmatter) => ({
  title: asText(frontmatter.title, asText(indexPost.title, 'Technical Article', 160), 160),
  date: asText(frontmatter.date, asText(indexPost.date, '2026', 60), 60),
  readTime: asText(frontmatter.readTime, asText(indexPost.readTime, '5 min read', 40), 40),
  category: asText(frontmatter.category, asText(indexPost.category, 'VLSI Engineering', 80), 80),
  author: asText(frontmatter.author, 'Kruti Deepan Panda', 100),
  role: asText(frontmatter.role, 'Silicon Design Engineer', 100),
  seriesTitle: asText(frontmatter.seriesTitle, asText(indexPost.seriesTitle, '', 100), 100),
  chapter: asText(frontmatter.chapter, asText(indexPost.chapter, '1', 8), 8),
  experimentResult: asText(
    frontmatter.experimentResult,
    asText(indexPost.experimentResult, '', 12),
    12
  ).toUpperCase(),
  tags: normalizeTags(frontmatter.tags?.length ? frontmatter.tags : indexPost.tags)
});

const showState = (container, title, message) => {
  const state = makeElement('div', 'callout');
  const returnLink = makeElement('a', '', 'Return to Blog Hub');
  returnLink.href = 'blog.html';
  state.append(makeElement('h4', '', title), makeElement('p', '', message), returnLink);
  container.replaceChildren(state);
};

const renderHeader = (container, metadata) => {
  const badges = makeElement('div', 'article-badges');
  if (metadata.seriesTitle) {
    badges.append(makeElement('span', 'series-badge', `${metadata.seriesTitle} — Chapter ${metadata.chapter}`));
  }
  if (metadata.experimentResult === 'PASS' || metadata.experimentResult === 'FAIL') {
    const passed = metadata.experimentResult === 'PASS';
    badges.append(makeElement(
      'span',
      `experiment-badge ${passed ? 'experiment-pass' : 'experiment-fail'}`,
      passed ? 'EXPERIMENT: SUCCESS' : 'EXPERIMENT: FAILED'
    ));
  }
  const articleMeta = makeElement('div', 'article-meta');
  articleMeta.append(
    makeElement('span', 'category-tag', metadata.category),
    makeElement('span', '', metadata.date),
    makeElement('span', '', metadata.readTime)
  );
  const author = makeElement('div', 'article-author');
  const authorInfo = makeElement('div', 'author-info');
  authorInfo.append(makeElement('h4', '', metadata.author), makeElement('span', '', metadata.role));
  author.append(authorInfo);
  container.replaceChildren(badges, articleMeta, makeElement('h1', 'article-title', metadata.title), author);
};

const safeLink = (rawValue) => {
  const value = asText(rawValue, '', 2048);
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'https:' || url.protocol === 'mailto:' ? url : null;
  } catch {
    return null;
  }
};

const copyAllowedAttributes = (source, target, tag) => {
  if (tag === 'a') {
    const url = safeLink(source.getAttribute('href'));
    if (url) {
      target.href = url.href;
      const title = asText(source.getAttribute('title'), '', 200);
      if (title) target.title = title;
      if (url.protocol === 'https:' && url.origin !== window.location.origin) {
        target.target = '_blank';
        target.rel = 'noopener noreferrer';
        target.referrerPolicy = 'no-referrer';
      }
    }
  }
  if (tag === 'code') {
    const languageClass = [...source.classList].find((name) => /^language-[a-z0-9_-]+$/i.test(name));
    if (languageClass) target.className = languageClass;
  }
  if (tag === 'ol') {
    const start = Number.parseInt(source.getAttribute('start'), 10);
    if (Number.isInteger(start) && start > 0 && start < 10000) target.start = start;
  }
  if (tag === 'td' || tag === 'th') {
    ['colspan', 'rowspan'].forEach((attribute) => {
      const value = Number.parseInt(source.getAttribute(attribute), 10);
      if (Number.isInteger(value) && value > 0 && value <= 20) target.setAttribute(attribute, String(value));
    });
  }
};

const sanitizeNode = (node) => {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
  if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();
  const tag = node.tagName.toLowerCase();
  if (DROP_WITH_CONTENT.has(tag)) return document.createDocumentFragment();
  if (!ALLOWED_MARKDOWN_TAGS.has(tag)) {
    const flattened = document.createDocumentFragment();
    [...node.childNodes].forEach((child) => flattened.append(sanitizeNode(child)));
    return flattened;
  }
  const clean = document.createElement(tag);
  copyAllowedAttributes(node, clean, tag);
  [...node.childNodes].forEach((child) => clean.append(sanitizeNode(child)));
  return clean;
};

const sanitizeMarkdown = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = document.createDocumentFragment();
  [...template.content.childNodes].forEach((node) => fragment.append(sanitizeNode(node)));
  return fragment;
};

const loadScript = (src, integrity) => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = src;
  script.integrity = integrity;
  script.crossOrigin = 'anonymous';
  script.referrerPolicy = 'no-referrer';
  script.onload = resolve;
  script.onerror = () => reject(new Error('The verified Markdown parser could not be loaded.'));
  document.head.append(script);
});

document.addEventListener('DOMContentLoaded', async () => {
  const contentContainer = document.getElementById('markdown-content');
  const headerContainer = document.getElementById('article-header');
  if (!contentContainer) return;
  try {
    if (typeof marked === 'undefined') await loadScript(MARKED_URL, MARKED_INTEGRITY);
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id') || params.get('post') || '';
    if (!POST_ID_PATTERN.test(postId)) {
      showState(contentContainer, 'Article Not Found', 'The requested article ID is invalid.');
      return;
    }
    const posts = await fetchFirst(['../Blog/posts.json', '/Blog/posts.json'], 'json');
    if (!Array.isArray(posts)) throw new Error('The blog index is invalid.');
    const indexPost = posts.find((post) => post && post.id === postId);
    if (!indexPost) {
      showState(contentContainer, 'Article Not Found', 'The requested article is not listed.');
      return;
    }
    const encodedId = encodeURIComponent(postId);
    const markdown = await fetchFirst([`../Blog/${encodedId}/article.md`, `/Blog/${encodedId}/article.md`]);
    const parsed = parseFrontmatter(markdown);
    const metadata = normalizeMetadata(indexPost, parsed.metadata);
    document.title = `${metadata.title} | Kruti Deepan Panda`;
    if (headerContainer) renderHeader(headerContainer, metadata);
    marked.setOptions({ gfm: true, breaks: true });
    contentContainer.replaceChildren(sanitizeMarkdown(marked.parse(parsed.body)));
    const footer = document.getElementById('article-footer-tags');
    if (footer) footer.replaceChildren(...metadata.tags.map((tag) => makeElement('span', 'tag', `#${tag}`)));
  } catch (error) {
    console.error(error);
    showState(contentContainer, 'Article Unavailable', 'The article could not be loaded safely.');
  }
});
