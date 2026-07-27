/* ==========================================================================
   ANTIGRAVITY SHOWCASE HOMEPAGE (ROOT SCRIPT)
   Gravity-Defying Floating Particle Field & Mouse Interactive Effects
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAntigravityCanvas();
  initCard3D();
});

/* --------------------------------------------------------------------------
   1. Gravity-Defying Floating Particle Field
   -------------------------------------------------------------------------- */
function initAntigravityCanvas() {
  const canvas = document.getElementById('antigravity-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];
  const particleCount = Math.min(window.innerWidth / 12, 100);

  const mouse = {
    x: null,
    y: null,
    radius: 180
  };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  class FloatingOrbs {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 20;
      this.size = Math.random() * 3 + 1;
      // Upward velocity (defying gravity!)
      this.vy = -(Math.random() * 0.7 + 0.3);
      this.vx = (Math.random() - 0.5) * 0.4;
      
      const colors = [
        'rgba(0, 242, 254, ',   // cyan
        'rgba(255, 42, 133, ',  // pink
        'rgba(138, 43, 226, ',  // purple
        'rgba(255, 255, 255, '  // white
      ];
      this.baseColor = colors[Math.floor(Math.random() * colors.length)];
      this.alpha = Math.random() * 0.7 + 0.2;
    }

    update() {
      this.y += this.vy;
      this.x += this.vx;

      // Slight horizontal oscillation
      this.x += Math.sin(this.y * 0.01) * 0.2;

      // Wrap around when floating off top
      if (this.y < -20) {
        this.reset();
      }
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;

      // Mouse repulsion / swirling effect
      if (mouse.x != null && mouse.y != null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          this.x -= (dx / distance) * force * 4;
          this.y -= (dy / distance) * force * 4;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.baseColor + this.alpha + ')';
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.baseColor + '0.8)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function init() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new FloatingOrbs());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    requestAnimationFrame(animate);
  }

  init();
  animate();
}

/* --------------------------------------------------------------------------
   2. Gentle 3D Tilt Effect on Showcase Card
   -------------------------------------------------------------------------- */
function initCard3D() {
  const card = document.querySelector('.creation-card');
  if (!card) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  });
}
