document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.querySelector('.card-overlay');
  const modal = document.querySelector('.card-modal');
  const flipFront = document.querySelector('.flip-front');
  const nameEl = document.querySelector('.modal-name');
  const ageEl = document.querySelector('.modal-age');
  const bioEl = document.querySelector('.modal-bio');
  const closeBtn = document.querySelector('.modal-close');
  const triggers = document.querySelectorAll('.card-trigger');
  let lastFocused = null;

  function openCard(trigger) {
    if (!overlay || !modal || !flipFront) return;
    const card = trigger.closest('.person-card');
    const first = card?.dataset.firstname || '';
    const last = card?.dataset.lastname || '';
    const age = card?.dataset.age || '';
    const bio = card?.dataset.bio || '';
    const img = trigger.querySelector('img');
    const bg = img?.getAttribute('src') || '';

    if (nameEl) nameEl.textContent = `${first} ${last}`.trim();
    if (ageEl) ageEl.textContent = age ? `Starost: ${age}` : '';
    if (bioEl) bioEl.textContent = bio;
    flipFront.style.backgroundImage = `url('${bg}')`;

    overlay.hidden = false;
    overlay.style.opacity = '';
    overlay.style.pointerEvents = '';
    void overlay.offsetWidth;
    overlay.classList.add('show');
    lastFocused = document.activeElement;
    closeBtn?.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeCard() {
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    document.body.style.overflow = '';
    window.setTimeout(() => {
      overlay.hidden = true;
      overlay.style.pointerEvents = '';
      overlay.style.opacity = '';
    }, 320);
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', () => openCard(btn));
    btn.addEventListener('keyup', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openCard(btn);
    });
  });

  closeBtn?.addEventListener('click', closeCard);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeCard(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay && !overlay.hidden) closeCard(); });
});