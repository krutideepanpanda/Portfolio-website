document.documentElement.classList.add('js-ready');

const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  const portalLink = document.createElement('a');
  portalLink.className = 'nav-portal';
  portalLink.href = '../index.html';
  portalLink.textContent = 'All builds';
  siteNav.prepend(portalLink);

  const blogLink = siteNav.querySelector('a[href="blog.html"]');
  if (blogLink) blogLink.textContent = 'Blog';

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    siteNav.classList.toggle('is-open', !isOpen);
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navToggle.setAttribute('aria-expanded', 'false');
      siteNav.classList.remove('is-open');
    }
  });
}

const footerLead = document.querySelector('.site-footer > p:first-child');
if (footerLead && footerLead.textContent.includes('Designed and built')) {
  footerLead.textContent = 'Silicon, systems & software.';
}

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.site-nav a').forEach((link) => {
  if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page');
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
