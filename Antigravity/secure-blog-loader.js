(() => {
  const ID_PATTERN = /^[a-z0-9_-]+$/i;
  const text = (value, fallback = '', limit = 240) => (
    typeof value === 'string' || typeof value === 'number'
      ? (String(value).trim().slice(0, limit) || fallback)
      : fallback
  );
  const element = (tag, className = '', value = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value) node.textContent = value;
    return node;
  };
  const normalize = (post) => {
    if (!post || typeof post.id !== 'string' || !ID_PATTERN.test(post.id)) return null;
    const chapter = Number.parseInt(post.chapter, 10);
    const result = text(post.experimentResult, '', 12).toUpperCase();
    return {
      id: post.id,
      title: text(post.title, 'Technical article', 160),
      summary: text(post.summary, '', 400),
      category: text(post.category, 'VLSI Engineering', 80),
      readTime: text(post.readTime, '5 min read', 40),
      date: text(post.date, '', 60),
      seriesTitle: text(post.seriesTitle, 'Standalone Articles', 100),
      chapter: Number.isInteger(chapter) && chapter > 0 && chapter < 1000 ? chapter : null,
      result: result === 'PASS' || result === 'FAIL' ? result : '',
      tags: Array.isArray(post.tags)
        ? post.tags.map((tag) => text(tag, '', 40)).filter(Boolean).slice(0, 12)
        : []
    };
  };

  const makeCard = (post) => {
    const card = element('article', 'blog-card reveal');
    const body = element('div');
    const top = element('div', 'blog-top');
    top.append(element('span', 'blog-category', post.category), element('span', '', post.readTime));
    body.append(top);
    if (post.chapter) body.append(element('div', 'chapter-badge', `Chapter ${post.chapter}`));
    if (post.result) {
      const passed = post.result === 'PASS';
      body.append(element(
        'div',
        `experiment-badge ${passed ? 'experiment-pass' : 'experiment-fail'}`,
        passed ? 'EXPERIMENT: SUCCESS' : 'EXPERIMENT: FAILED'
      ));
    }
    body.append(element('h3', 'blog-title', post.title), element('p', 'blog-summary', post.summary));
    const tags = element('div', 'blog-tags');
    post.tags.forEach((tag) => tags.append(element('span', 'blog-tag', `#${tag}`)));
    body.append(tags);

    const footer = element('div', 'blog-footer');
    footer.append(element('span', 'blog-date', post.date));
    const link = element('a', 'blog-btn', 'Read Article →');
    link.href = `article.html?id=${encodeURIComponent(post.id)}`;
    footer.append(link);
    card.append(body, footer);
    return card;
  };

  window.secureInitBlogLoader = async () => {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    try {
      const response = await fetch('../Blog/posts.json', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Blog index returned ${response.status}`);
      const rawPosts = await response.json();
      if (!Array.isArray(rawPosts)) throw new Error('Blog index is invalid');
      const posts = rawPosts.map(normalize).filter(Boolean);
      const visiblePosts = window.location.pathname.includes('blog.html') ? posts : posts.slice(0, 3);
      const groups = new Map();
      visiblePosts.forEach((post) => {
        if (!groups.has(post.seriesTitle)) groups.set(post.seriesTitle, []);
        groups.get(post.seriesTitle).push(post);
      });
      grid.replaceChildren();
      grid.className = '';
      groups.forEach((groupPosts, seriesTitle) => {
        const heading = element('div', 'series-heading');
        heading.append(element('h2', '', seriesTitle));
        grid.append(heading);
        const strictSeries = groupPosts.some((post) => post.chapter);
        const container = element('div', strictSeries ? 'series-timeline' : 'blog-grid');
        groupPosts.forEach((post) => {
          if (strictSeries) {
            const timelineNode = element('div', 'timeline-node');
            timelineNode.append(makeCard(post));
            container.append(timelineNode);
          } else {
            container.append(makeCard(post));
          }
        });
        grid.append(container);
      });

      const menu = document.getElementById('blog-nav-menu');
      if (menu) {
        menu.replaceChildren();
        const allItem = element('li');
        const allLink = element('a', 'dropdown-item', 'All Blog Articles');
        allLink.href = 'blog.html';
        allItem.append(allLink);
        const rssItem = element('li');
        const rssLink = element('a', 'dropdown-item', 'Subscribe via RSS');
        rssLink.href = 'rss.xml';
        rssLink.target = '_blank';
        rssLink.rel = 'noopener noreferrer';
        rssItem.append(rssLink);
        menu.append(allItem, rssItem);
        posts.forEach((post) => {
          const item = element('li');
          const link = element('a', 'dropdown-item', post.title);
          link.href = `article.html?id=${encodeURIComponent(post.id)}`;
          item.append(link);
          menu.append(item);
        });
      }
      if (typeof initScrollReveal === 'function') setTimeout(initScrollReveal, 100);
    } catch (error) {
      console.error(error);
      grid.replaceChildren(element('div', 'blog-loading', 'Blog posts are temporarily unavailable.'));
    }
  };
})();
