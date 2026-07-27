/**
 * KRUTI DEEPAN PANDA — MARKDOWN ARTICLE ENGINE
 * Dynamically fetches and renders .md files inside Blog subfolders
 * Supports YAML Frontmatter, Marked.js parsing, and Syntax Highlighting
 */

document.addEventListener('DOMContentLoaded', async () => {
  const contentContainer = document.getElementById('markdown-content');
  const headerContainer = document.getElementById('article-header');
  
  if (!contentContainer) return;

  // 1. Load Marked.js for markdown parsing dynamically if not already present
  if (typeof marked === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js');
  }

  // 2. Determine article subfolder ID from URL parameter (?id= or ?post=)
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id') || urlParams.get('post') || 'ml-cad-automation';

  let mdText = '';
  const pathsToTry = [
    `../Blog/${postId}/article.md`,
    `/Blog/${postId}/article.md`,
    `./${postId}/article.md`,
    `../Blog/${postId}/article.html`,
    `/Blog/${postId}/article.html`
  ];
  let loadedPath = '';

  for (const path of pathsToTry) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        mdText = await res.text();
        loadedPath = path;
        break;
      }
    } catch (e) {
      console.warn(`Failed to fetch ${path}`, e);
    }
  }

  if (!mdText) {
    contentContainer.innerHTML = `
      <div class="callout" style="border-color: #ef4444; background: rgba(239, 68, 68, 0.1);">
        <h4 style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Article Not Found</h4>
        <p>Could not locate Markdown file for article ID: <strong>${postId}</strong> inside /Blog repository.</p>
        <p style="margin-top: 1rem;"><a href="index.html#blog" style="color: var(--accent-cyan); text-decoration: underline;">Return to Blog Hub</a></p>
      </div>
    `;
    return;
  }

  // 3. Parse YAML Frontmatter (--- ... ---)
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = mdText.match(frontmatterRegex);
  
  let metadata = {};
  let bodyMd = mdText;

  if (match) {
    const rawYaml = match[1];
    bodyMd = match[2];
    
    // Simple YAML key: value parser
    rawYaml.split(/\r?\n/).forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join(':').trim();
        // Remove quotes if present
        val = val.replace(/^["']|["']$/g, '');
        if (key === 'tags') {
          val = val.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
        }
        metadata[key] = val;
      }
    });
  }

  // 4. Fallback to posts.json if metadata is incomplete
  if (!metadata.title || !metadata.date) {
    try {
      const postsPaths = ['../Blog/posts.json', '/Blog/posts.json'];
      for (const pPath of postsPaths) {
        const postsRes = await fetch(pPath);
        if (postsRes.ok) {
          const posts = await postsRes.json();
          const found = posts.find(p => p.id === postId || (p.url && p.url.includes(postId)));
          if (found) {
            metadata = { ...found, ...metadata };
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch fallback metadata from posts.json', e);
    }
  }

  // Set default metadata values if still missing
  metadata.title = metadata.title || 'Technical Article';
  metadata.date = metadata.date || 'July 2026';
  metadata.readTime = metadata.readTime || '5 min read';
  metadata.category = metadata.category || 'VLSI Engineering';
  metadata.author = metadata.author || 'Kruti Deepan Panda';
  metadata.role = metadata.role || 'Silicon Design Engineer';

  // Update Page Title
  document.title = `${metadata.title} | Kruti Deepan Panda`;

  // 5. Render Header
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="article-meta">
        <span class="category-tag">${metadata.category}</span>
        <span><i class="fa-regular fa-calendar" style="margin-right:0.3rem;"></i> ${metadata.date}</span>
        <span><i class="fa-regular fa-clock" style="margin-right:0.3rem;"></i> ${metadata.readTime}</span>
      </div>
      
      <h1 class="article-title">${metadata.title}</h1>
      
      <div class="article-author">
        <div class="author-info">
          <h4>${metadata.author}</h4>
          <span>${metadata.role}</span>
        </div>
      </div>
    `;
  }

  // 6. Configure Marked.js renderer for custom callouts, code blocks, and tables
  const renderer = new marked.Renderer();
  
  // Custom blockquote styling (converts > [!NOTE] or > [!TIP] to GitHub style alerts/callouts)
  const originalBlockquote = renderer.blockquote.bind(renderer);
  renderer.blockquote = (token) => {
    // Robust token vs string handling across Marked versions
    const quote = typeof token === 'string' ? token : (token.text || token.raw || '');
    if (quote.includes('[!NOTE]') || quote.includes('[!TIP]') || quote.includes('[!IMPORTANT]') || quote.includes('[!WARNING]') || quote.includes('[!CAUTION]')) {
      let icon = 'fa-lightbulb';
      let title = 'Key Insight';
      let color = 'var(--accent-cyan)';
      let bg = 'rgba(0, 242, 254, 0.1)';
      
      if (quote.includes('[!WARNING]') || quote.includes('[!CAUTION]')) {
        icon = 'fa-triangle-exclamation';
        title = 'Critical Warning';
        color = '#f59e0b';
        bg = 'rgba(245, 158, 11, 0.1)';
      } else if (quote.includes('[!TIP]')) {
        icon = 'fa-wand-magic-sparkles';
        title = 'Optimization Tip';
        color = 'var(--accent-indigo)';
        bg = 'rgba(99, 102, 241, 0.12)';
      }

      const cleanText = quote.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/g, '').replace(/^<p>|<\/p>$/g, '');
      return `
        <div class="callout" style="border-left-color: ${color}; background: ${bg};">
          <h4 style="color: ${color};"><i class="fa-solid ${icon}" style="margin-right: 0.5rem;"></i> ${title}</h4>
          <div style="margin-top: 0.5rem;">${cleanText}</div>
        </div>
      `;
    }
    return originalBlockquote(token);
  };

  // Responsive table wrapper
  const originalTable = renderer.table.bind(renderer);
  renderer.table = (token) => {
    const tableHtml = originalTable(token);
    return `<div style="overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; margin: 2rem 0;">${tableHtml}</div>`;
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true
  });

  // 7. Render Markdown body to HTML
  contentContainer.innerHTML = marked.parse(bodyMd);

  // 8. Render Tags Footer
  const footerContainer = document.getElementById('article-footer-tags');
  if (footerContainer && Array.isArray(metadata.tags)) {
    footerContainer.innerHTML = metadata.tags.map(t => `<span class="tag">#${t}</span>`).join('');
  }

  // 9. Trigger MathJax / KaTeX rendering if math expressions exist
  if (window.renderMathInElement) {
    renderMathInElement(contentContainer, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '\\[', right: '\\]', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false}
      ]
    });
  }
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
