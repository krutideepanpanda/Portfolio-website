(async function loadBlog() {
  const root = document.getElementById('blog-root');
  if (!root) return;

  const chapterFor = (post) => {
    const signals = [post.id, post.title, post.series, ...(post.tags || [])].join(' ').toLowerCase();
    if (signals.includes('codex')) return 'Codex chapter';
    if (signals.includes('antigravity') || signals.includes('gemini')) return 'Antigravity chapter';
    return post.seriesTitle || 'Engineering notes';
  };

  const renderChapter = (titleText, posts) => {
    const section = document.createElement('section');
    section.className = 'blog-series';
    const heading = document.createElement('div');
    heading.className = 'series-header';
    const title = document.createElement('h2');
    title.textContent = titleText;
    const count = document.createElement('span');
    count.textContent = posts.length ? `${posts.length} ${posts.length === 1 ? 'entry' : 'entries'}` : 'Ongoing';
    heading.append(title, count);
    section.append(heading);

    if (!posts.length) {
      const state = document.createElement('div');
      state.className = 'chapter-empty';
      const stateTitle = document.createElement('strong');
      stateTitle.textContent = 'The Codex chapter is being written.';
      const stateCopy = document.createElement('span');
      stateCopy.textContent = 'New entries will appear here as the portfolio build progresses.';
      state.append(stateTitle, stateCopy);
      section.append(state);
      return section;
    }

    const list = document.createElement('div');
    list.className = 'post-list';
    posts
      .slice()
      .sort((a, b) => Number(a.chapter || 0) - Number(b.chapter || 0))
      .forEach((post, index) => {
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
        postTitle.textContent = post.title || 'Untitled article';
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
    section.append(list);
    return section;
  };

  try {
    const response = await fetch('../Blog/posts.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Blog index returned ${response.status}`);
    const posts = await response.json();
    if (!Array.isArray(posts)) throw new Error('The blog index is invalid');

    const groups = new Map([['Codex chapter', []], ['Antigravity chapter', []]]);
    posts.forEach((post) => {
      const chapter = chapterFor(post);
      if (!groups.has(chapter)) groups.set(chapter, []);
      groups.get(chapter).push(post);
    });

    root.replaceChildren(...Array.from(groups, ([title, chapterPosts]) => renderChapter(title, chapterPosts)));
  } catch (error) {
    const state = document.createElement('div');
    state.className = 'empty-state';
    state.textContent = 'The blog could not be loaded right now. Please try again later or use the RSS feed.';
    root.replaceChildren(state);
    console.error(error);
  }
})();
