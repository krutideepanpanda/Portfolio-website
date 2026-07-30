/* ==========================================================================
   KRUTI DEEPAN PANDA — PERSONAL EXPERIMENT BENCH (SCRIPT)
   Subtle Architectural Geometric Grid Canvas & Card Micro-Animations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initArchitecturalCanvas();
  initCardAnimations();
});

/* --------------------------------------------------------------------------
   1. Subtle Architectural Geometric Grid & Nodes
   -------------------------------------------------------------------------- */
function initArchitecturalCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let nodes = [];
  const nodeCount = Math.min(window.innerWidth / 20, 50);

  const mouse = {
    x: null,
    y: null,
    radius: 140
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

  class GeoNode {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.size = Math.random() * 2 + 1.5;
      this.baseColor = 'rgba(37, 99, 235, ';
      this.alpha = Math.random() * 0.35 + 0.1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x != null && mouse.y != null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 1.5;
          this.y -= (dy / dist) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.baseColor + this.alpha + ')';
      ctx.fill();
    }
  }

  function init() {
    nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new GeoNode());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw subtle architectural grid in background
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw nodes and connecting lines
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].update();
      nodes[i].draw();

      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(37, 99, 235, ${0.15 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.7;
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }

  init();
  animate();
}

/* --------------------------------------------------------------------------
   2. Card Staggered Entry Transitions
   -------------------------------------------------------------------------- */
function initCardAnimations() {
  const elements = document.querySelectorAll('.tool-item, .experiment-card');
  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(15px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 120 * (index + 1));
  });
}
