(function defineMarkdownRenderer() {
  function appendInline(target, text) {
    const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`)/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      target.append(document.createTextNode(text.slice(cursor, match.index)));
      if (match[2] && match[3]) {
        const link = document.createElement('a');
        link.textContent = match[2];
        try {
          const url = new URL(match[3], window.location.href);
          if (['http:', 'https:', 'mailto:'].includes(url.protocol)) link.href = url.href;
          else link.append(document.createTextNode(` (${match[3]})`));
        } catch {
          link.append(document.createTextNode(` (${match[3]})`));
        }
        target.append(link);
      } else if (match[4]) {
        const strong = document.createElement('strong');
        strong.textContent = match[4];
        target.append(strong);
      } else if (match[5]) {
        const code = document.createElement('code');
        code.textContent = match[5];
        target.append(code);
      }
      cursor = pattern.lastIndex;
    }
    target.append(document.createTextNode(text.slice(cursor).replace(/\\([.\-*])/g, '$1')));
  }

  window.renderSafeMarkdown = (markdown) => {
    const fragment = document.createDocumentFragment();
    let list = null;
    let listType = '';
    const closeList = () => { list = null; listType = ''; };

    markdown.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) { closeList(); return; }
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        closeList();
        if (heading[1].length === 1) return;
        const element = document.createElement(heading[1].length === 2 ? 'h2' : 'h3');
        appendInline(element, heading[2]);
        fragment.append(element);
        return;
      }
      const ordered = line.match(/^\d+[.)]\s+(.+)$/);
      const unordered = line.match(/^[-*]\s+(.+)$/);
      if (ordered || unordered) {
        const type = ordered ? 'ol' : 'ul';
        if (!list || listType !== type) {
          list = document.createElement(type);
          listType = type;
          fragment.append(list);
        }
        const item = document.createElement('li');
        appendInline(item, (ordered || unordered)[1]);
        list.append(item);
        return;
      }
      closeList();
      const paragraph = document.createElement('p');
      appendInline(paragraph, line);
      fragment.append(paragraph);
    });
    return fragment;
  };
})();

(async function loadArticle() {
  const header = document.getElementById('article-header');
  const content = document.getElementById('article-content');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '';

  const fail = (message) => {
    const box = document.createElement('div');
    box.className = 'article-error';
    const title = document.createElement('h1');
    title.textContent = 'Article unavailable';
    const copy = document.createElement('p');
    copy.textContent = message;
    const link = document.createElement('a');
    link.href = 'blog.html';
    link.textContent = 'Return to the blog';
    box.append(title, copy, link);
    header.replaceChildren(box);
    content.replaceChildren();
  };

  if (!/^[a-z0-9_-]+$/i.test(id)) {
    fail('The article address is missing or invalid.');
    return;
  }

  try {
    const indexResponse = await fetch('../Blog/posts.json', { headers: { Accept: 'application/json' } });
    if (!indexResponse.ok) throw new Error('Blog index unavailable');
    const posts = await indexResponse.json();
    const post = Array.isArray(posts) ? posts.find((item) => item && item.id === id) : null;
    if (!post) {
      fail('This article is not listed in the public blog archive.');
      return;
    }

    const articleResponse = await fetch(`../Blog/${encodeURIComponent(id)}/article.md`, { headers: { Accept: 'text/markdown,text/plain' } });
    if (!articleResponse.ok) throw new Error(`Article returned ${articleResponse.status}`);
    const raw = await articleResponse.text();
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    const body = match ? match[2] : raw;

    const labels = document.createElement('div');
    labels.className = 'article-labels';
    [post.category, post.experimentResult ? `Experiment: ${post.experimentResult}` : null].filter(Boolean).forEach((value) => {
      const label = document.createElement('span');
      label.className = 'tag';
      label.textContent = value;
      labels.append(label);
    });
    const title = document.createElement('h1');
    title.textContent = post.title || 'Blog article';
    const summary = document.createElement('p');
    summary.className = 'article-summary';
    summary.textContent = post.summary || '';
    const byline = document.createElement('div');
    byline.className = 'article-byline';
    [post.date, post.readTime, 'Kruti Deepan Panda'].filter(Boolean).forEach((value) => {
      const item = document.createElement('span');
      item.textContent = value;
      byline.append(item);
    });
    header.replaceChildren(labels, title, summary, byline);
    content.replaceChildren(window.renderSafeMarkdown(body));
    content.querySelectorAll('a[href]').forEach((link) => {
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    });

    document.title = `${post.title || 'Blog Article'} — Kruti Deepan Panda`;
    const description = post.summary || 'Technical blog article by Kruti Deepan Panda.';
    document.querySelector('meta[name="description"]').setAttribute('content', description);
    document.getElementById('og-title').setAttribute('content', post.title || 'Blog Article');
    document.getElementById('og-description').setAttribute('content', description);
    document.getElementById('canonical-link').setAttribute('href', `https://krutideepanpanda.com/Codex/article.html?id=${encodeURIComponent(id)}`);
  } catch (error) {
    console.error(error);
    fail('The article could not be loaded right now. Please try again later.');
  }
})();
