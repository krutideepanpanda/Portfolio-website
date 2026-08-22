(async function loadBlog() {
  const root = document.getElementById('blog-root');
  if (!root) return;

  try {
    const response = await fetch('../Blog/posts.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Blog index returned ${response.status}`);
    const posts = await response.json();
    if (!Array.isArray(posts) || posts.length === 0) throw new Error('The blog index is empty');

    const groups = new Map();
    posts.forEach((post) => {
      const series = typeof post.seriesTitle === 'string' ? post.seriesTitle : 'Standalone notes';
      if (!groups.has(series)) groups.set(series, []);
      groups.get(series).push(post);
    });

    root.replaceChildren();
    groups.forEach((seriesPosts, seriesTitle) => {
      const section = document.createElement('section');
      section.className = 'blog-series';

      const heading = document.createElement('div');
      heading.className = 'series-header';
      const title = document.createElement('h2');
      title.textContent = seriesTitle;
      const count = document.createElement('span');
      count.textContent = `${seriesPosts.length} ${seriesPosts.length === 1 ? 'entry' : 'entries'}`;
      heading.append(title, count);

      const list = document.createElement('div');
      list.className = 'post-list';
      seriesPosts.forEach((post, index) => {
        if (!post || typeof post.id !== 'string' || !/^[a-z0-9_-]+$/i.test(post.id)) return;
        const link = document.createElement('a');
        link.className = 'post-card';
        link.href = `article.html?id=${encodeURIComponent(post.id)}`;

        const chapter = document.createElement('span');
        chapter.className = 'post-chapter';
        chapter.textContent = String(post.chapter || index + 1).padStart(2, '0');

        const copy = document.createElement('span');
        const postTitle = document.createElement('strong');
        postTitle.className = 'post-title';
        postTitle.textContent = post.title || 'Untitled field note';
        const summary = document.createElement('span');
        summary.className = 'post-summary';
        summary.textContent = post.summary || '';
        copy.append(postTitle, summary);

        const meta = document.createElement('span');
        meta.className = 'post-meta';
        const date = document.createElement('span');
        date.textContent = post.date || '';
        meta.append(date, document.createElement('br'), document.createTextNode(post.readTime || 'Read article'));
        link.append(chapter, copy, meta);
        list.append(link);
      });

      section.append(heading, list);
      root.append(section);
    });
  } catch (error) {
    const state = document.createElement('div');
    state.className = 'empty-state';
    state.textContent = 'The field notes could not be loaded right now. Please try again later or use the RSS feed.';
    root.replaceChildren(state);
    console.error(error);
  }
})();
