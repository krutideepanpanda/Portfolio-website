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

  window.addEventListener('resize', resize);
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
      if (navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
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
        if (filterValue === 'all' || category.includes(filterValue)) {
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
    });
  });
}

/* ==========================================================================
   5. Subtle 3D Card Tilt Effect on Hover
   ========================================================================== */
function initCardTilt() {
  const cards = document.querySelectorAll('.project-card, .timeline-card, .skill-category');

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -5; // max 5 deg
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
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

  // Re-initialize scroll reveal for new blog cards if reveal observer is active
  if (typeof initScrollReveal === 'function') {
    setTimeout(initScrollReveal, 100);
  }
}

