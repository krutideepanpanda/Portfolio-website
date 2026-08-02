/**
 * KRUTI DEEPAN PANDA - PORTFOLIO INTERACTIVITY & CIRCUIT SIMULATION
 * Futuristic Silicon & Semiconductor Dark Mode
 */

document.addEventListener('DOMContentLoaded', () => {
  initCircuitCanvas();
  initNavigation();
  initScrollReveal();
  initProjectFilters();
  initCardTilt();
  initBlogLoader();
  initPIIDecoder();
  initGitHubRepos();
});

/* ==========================================================================
   1. Interactive HTML5 Canvas - Semiconductor Circuit & Data Pulse Simulation
   ========================================================================== */
function initCircuitCanvas() {
  const canvas = document.getElementById('circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let nodes = [];
  let pulses = [];
  const mouse = { x: null, y: null, radius: 180 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createNodes();
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (resizeTimeout) cancelAnimationFrame(resizeTimeout);
    resizeTimeout = requestAnimationFrame(resize);
  });
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Node Class representing VLSI Gates / Pads
  class Node {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.baseRadius = Math.random() * 2 + 1.5;
      this.radius = this.baseRadius;
      this.color = Math.random() > 0.3 ? '#00f0ff' : '#00ff88';
      this.connections = [];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse Probing Interaction
      if (mouse.x && mouse.y) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 1.5;
          this.y -= (dy / dist) * force * 1.5;
          this.radius = this.baseRadius + force * 3;
        } else {
          this.radius = this.baseRadius;
        }
      } else {
        this.radius = this.baseRadius;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Data Pulse Class representing signal propagation across circuit paths
  class DataPulse {
    constructor(startNode, endNode) {
      this.start = startNode;
      this.end = endNode;
      this.progress = 0;
      this.speed = Math.random() * 0.02 + 0.015;
      this.color = '#ffffff';
    }

    update() {
      this.progress += this.speed;
      return this.progress < 1;
    }

    draw() {
      const x = this.start.x + (this.end.x - this.start.x) * this.progress;
      const y = this.start.y + (this.end.y - this.start.y) * this.progress;

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function createNodes() {
    nodes = [];
    const count = Math.min(Math.floor((width * height) / 14000), 110);
    for (let i = 0; i < count; i++) {
      nodes.push(new Node());
    }
  }

  function connectNodes() {
    const maxDist = 140;
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].connections = [];
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          nodes[i].connections.push(nodes[j]);
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          // Orthogonal circuit wiring aesthetics (Manhattan routing)
          if (Math.random() > 0.5) {
            ctx.lineTo(nodes[j].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
          } else {
            ctx.lineTo(nodes[i].x, nodes[j].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
          }
          const alpha = (1 - dist / maxDist) * 0.22;
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Randomly spawn data pulses
          if (Math.random() < 0.0015 && pulses.length < 25) {
            pulses.push(new DataPulse(nodes[i], nodes[j]));
          }
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    nodes.forEach((node) => {
      node.update();
      node.draw();
    });

    connectNodes();

    pulses = pulses.filter((pulse) => {
      const active = pulse.update();
      if (active) pulse.draw();
      return active;
    });

    requestAnimationFrame(animate);
  }

  resize();
  animate();
}

/* ==========================================================================
   2. Navigation Bar & Mobile Menu
   ========================================================================== */
function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const spans = menuToggle.querySelectorAll('span');
      if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Active page highlighting
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const href = item.getAttribute('href');
    if (href && (href === currentPath || (currentPath === 'index.html' && href === '#'))) {
      item.style.color = 'var(--accent-cyan)';
      item.style.fontWeight = '700';
      item.style.textShadow = '0 0 10px rgba(0, 240, 255, 0.4)';
    }
  });
}


/* ==========================================================================
   3. Scroll Reveal Animations
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  revealElements.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   4. Project Filtering System
   ========================================================================== */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card-wrapper');

  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || (category && category.includes(filterValue))) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });

      // Update tier header visibility dynamically based on filter
      setTimeout(() => {
        document.querySelectorAll('.tier-section').forEach((section) => {
          const matchingCards = Array.from(section.querySelectorAll('.project-card-wrapper')).filter((card) => {
            const cat = card.getAttribute('data-category');
            return filterValue === 'all' || (cat && cat.includes(filterValue));
          });
          const header = section.querySelector('.tier-section-header');
          if (header) {
            header.style.display = matchingCards.length > 0 ? 'block' : 'none';
          }
          section.style.display = matchingCards.length > 0 ? 'block' : 'none';
        });
      }, 310);
    });
  });
}

/* ==========================================================================
   5. Card Tilt Effect - DISABLED (interfered with text selection/copy)
   ========================================================================== */
function initCardTilt() {
  // Intentionally disabled: the 3D tilt made it difficult to select and copy text.
}

/* ==========================================================================
   6. Dynamic Blog Loader (Picks up posts from D:\Deepan\Portfolio website\Blog)
   ========================================================================== */
async function initBlogLoader() {
  const blogGrid = document.getElementById('blog-grid');
  if (!blogGrid) return;

  // Try fetching from relative path first, then absolute root path
  const pathsToTry = ['../Blog/posts.json', '/Blog/posts.json'];
  let posts = null;

  for (const path of pathsToTry) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        posts = await response.json();
        break;
      }
    } catch (e) {
      console.warn(`Could not load blog posts from ${path}:`, e);
    }
  }

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    blogGrid.innerHTML = `
      <div class="blog-loading" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
        <i class="fa-solid fa-triangle-exclamation"></i> No technical blog posts found in /Blog repository.
      </div>
    `;
    return;
  }

  // Render Blog Cards
  blogGrid.innerHTML = '';
  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'blog-card reveal';
    
    const tagsHtml = (post.tags || []).map(tag => `<span class="blog-tag">#${tag}</span>`).join('');
    
    card.innerHTML = `
      <div>
        <div class="blog-top">
          <span class="blog-category">${post.category || 'VLSI Engineering'}</span>
          <span><i class="fa-regular fa-clock" style="margin-right: 0.3rem;"></i>${post.readTime || '5 min read'}</span>
        </div>
        <h3 class="blog-title">${post.title}</h3>
        <p class="blog-summary">${post.summary}</p>
        <div class="blog-tags">${tagsHtml}</div>
      </div>
      <div class="blog-footer">
        <span style="font-size: 0.82rem; color: var(--text-tertiary);"><i class="fa-regular fa-calendar" style="margin-right:0.3rem;"></i>${post.date}</span>
        <a href="${post.url}" class="blog-btn">
          <span>Read Article</span>
          <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    `;
    
    blogGrid.appendChild(card);
  });

  // Dynamically populate top navigation dropdown menu with loaded blog posts
  const blogNavMenu = document.getElementById('blog-nav-menu');
  if (blogNavMenu) {
    blogNavMenu.innerHTML = `
      <li><a href="blog.html" class="dropdown-item"><i class="fa-solid fa-layer-group" style="margin-right: 0.6rem; color: var(--accent-cyan);"></i>All Blog Articles</a></li>
      <li><a href="rss.xml" target="_blank" class="dropdown-item"><i class="fa-solid fa-rss" style="margin-right: 0.6rem; color: #f97316;"></i>Subscribe via RSS</a></li>
    `;
    posts.forEach((post) => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${post.url}" class="dropdown-item"><i class="fa-solid fa-file-code" style="margin-right: 0.6rem; color: var(--accent-indigo);"></i>${post.title}</a>`;
      blogNavMenu.appendChild(li);
    });
  }

  // Re-initialize scroll reveal for new blog cards if reveal observer is active
  if (typeof initScrollReveal === 'function') {
    setTimeout(initScrollReveal, 100);
  }
}

/* ==========================================================================
   9. PII Obfuscation Decoder (Security)
   ========================================================================== */
function initPIIDecoder() {
  const emailB64 = "a3J1dGlkZWVwYW4xMjNAZ21haWwuY29t"; // Base64 for [OBFUSCATED_EMAIL]
  const phoneB64 = "KzkxNzAyMjIwNjIwMw==";             // Base64 for [OBFUSCATED_PHONE]
  
  let email = "";
  let phone = "";
  try {
    email = atob(emailB64);
    phone = atob(phoneB64);
  } catch (e) {
    return; // graceful failure
  }

  // Obfuscate Email Links & Text
  document.querySelectorAll('.obf-email').forEach(el => {
    if (el.tagName === 'A') el.href = `mailto:${email}`;
  });
  document.querySelectorAll('.obf-email-btn').forEach(el => {
    if (el.tagName === 'A') el.href = `mailto:${email}?subject=Opportunity%20/%20Inquiry%20via%20Portfolio`;
  });
  document.querySelectorAll('.obf-email-text').forEach(el => {
    el.textContent = email;
  });

  // Obfuscate Phone Links & Text
  document.querySelectorAll('.obf-phone').forEach(el => {
    if (el.tagName === 'A') el.href = `tel:${phone}`;
  });
  document.querySelectorAll('.obf-phone-text').forEach(el => {
    el.textContent = `(+91) ${phone.substring(3)}`;
  });
}

/* ==========================================================================
   10. Live GitHub Repository Fetcher (24-hour localStorage Cache)
   ========================================================================== */
const GITHUB_USERNAME = 'krutideepanpanda';
const GITHUB_CACHE_KEY = 'kdp_github_repos';
const GITHUB_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

// GitHub language colors (subset covering common languages)
const LANG_COLORS = {
  'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Python': '#3572A5',
  'Verilog': '#b2b7f8', 'SystemVerilog': '#dae1c2', 'C': '#555555',
  'C++': '#f34b7d', 'HTML': '#e34c26', 'CSS': '#563d7c',
  'Shell': '#89e051', 'Jupyter Notebook': '#DA5B0B', 'Tcl': '#e4cc98',
  'Makefile': '#427819', 'Rust': '#dea584', 'Go': '#00ADD8',
  'Java': '#b07219', 'VHDL': '#adb2cb', 'Scala': '#c22d40'
};

async function initGitHubRepos() {
  const grid = document.getElementById('github-repo-grid');
  if (!grid) return;

  let repos = null;

  // 1. Check localStorage cache
  try {
    const cached = localStorage.getItem(GITHUB_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < GITHUB_CACHE_TTL) {
        repos = data;
      }
    }
  } catch (e) {
    console.warn('GitHub cache read error:', e);
  }

  // 2. Fetch from API if cache is stale or missing
  if (!repos) {
    try {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&direction=desc&per_page=30`
      );
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const allRepos = await res.json();

      // Guard against non-array responses (e.g. rate-limit error objects)
      if (!Array.isArray(allRepos)) throw new Error('GitHub API returned non-array response');

      // Filter: only source repos (not forks), take top 6
      repos = allRepos
        .filter(r => !r.fork)
        .slice(0, 6);

      // Cache the result
      try {
        localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify({
          data: repos,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('GitHub cache write error:', e);
      }
    } catch (err) {
      console.error('GitHub API fetch error:', err);
      grid.innerHTML = `
        <div class="github-error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Could not load GitHub repositories. The feed will refresh automatically on your next visit.
        </div>
      `;
      return;
    }
  }

  // 3. Render repo cards
  grid.innerHTML = '';

  if (!repos || repos.length === 0) {
    grid.innerHTML = `
      <div class="github-error">
        <i class="fa-solid fa-inbox"></i>
        No public repositories found.
      </div>
    `;
    return;
  }

  repos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'github-repo-card';

    const langColor = LANG_COLORS[repo.language] || '#8b949e';
    const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    // Build topics HTML
    const topicsHtml = (repo.topics || []).slice(0, 4)
      .map(t => `<span class="github-topic-tag">${t}</span>`)
      .join('');

    card.innerHTML = `
      <div>
        <div class="github-repo-header">
          <div class="github-repo-icon">
            <i class="fa-solid fa-code-branch"></i>
          </div>
          <a href="${repo.html_url}" target="_blank" class="github-repo-link" title="View on GitHub">
            <i class="fa-brands fa-github"></i>
          </a>
        </div>
        <h3 class="github-repo-name">
          <a href="${repo.html_url}" target="_blank">${repo.name}</a>
        </h3>
        <p class="github-repo-desc">${repo.description || 'No description provided.'}</p>
      </div>
      <div>
        <div class="github-repo-stats">
          ${repo.language ? `
            <span class="github-stat">
              <span class="github-lang-dot" style="background: ${langColor};"></span>
              ${repo.language}
            </span>
          ` : ''}
          <span class="github-stat">
            <i class="fa-regular fa-star" style="color: #fbbf24;"></i> ${repo.stargazers_count}
          </span>
          <span class="github-stat">
            <i class="fa-solid fa-code-fork" style="color: #818cf8;"></i> ${repo.forks_count}
          </span>
          <span class="github-stat">
            <i class="fa-regular fa-clock"></i> ${updatedDate}
          </span>
        </div>
        ${topicsHtml ? `<div class="github-repo-footer">${topicsHtml}</div>` : ''}
      </div>
    `;

    grid.appendChild(card);
  });
}
