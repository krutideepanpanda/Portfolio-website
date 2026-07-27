/* ==========================================================================
   KRUTI DEEPAN PANDA — AI TOOL COMPARISON EXPERIMENT
   Minimalist, Neutral Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Clean, subtle fade-in transition for cards on page load
  const cards = document.querySelectorAll('.tool-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100 * (index + 1));
  });
});
