const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const body = document.body;

// Pointer and keyboard entry get the same interface without unnecessary key-driven motion.
document.addEventListener('keydown', () => body.classList.add('keyboard-mode'));
document.addEventListener('pointerdown', () => body.classList.remove('keyboard-mode'));

const ribbon = $('.club-ribbon');
const ribbonButton = $('#ribbon-toggle');
let pausedByUser = false;
function updateRibbon() {
  const paused = pausedByUser || reducedMotion.matches;
  ribbon.classList.toggle('paused', paused);
  ribbonButton.setAttribute('aria-pressed', String(paused));
  ribbonButton.setAttribute('aria-label', reducedMotion.matches ? 'Banner motion disabled by your motion preference' : paused ? 'Play moving banner' : 'Pause moving banner');
  ribbonButton.textContent = paused ? '▶' : 'Ⅱ';
  ribbonButton.disabled = reducedMotion.matches;
}
ribbonButton.addEventListener('click', () => { pausedByUser = !pausedByUser; updateRibbon(); });
reducedMotion.addEventListener('change', updateRibbon);
updateRibbon();

const moves = {
  career: { number: '01', headline: 'GOOD HANDSHAKE. BETTER PREP.', copy: 'Research the company. Charge your phone. Do your usual skincare routine. Arrive like you meant to be there.', aside: 'The GPA question is still your problem.' },
  night: { number: '02', headline: 'CLEAN SHIRT. CLEAR PLANS.', copy: 'Pick the spot. Text the group. Stick with your usual skincare routine before you head out. Your face is part of getting ready.', aside: '“You up?” is not a skincare routine.' },
  quiet: { number: '03', headline: 'NO PLANS. STILL YOUR FACE.', copy: 'Taking care of yourself counts on the nights nobody sees it. Keep your routine. Keep the sweatpants. Excellent calendar management.', aside: 'You do not need a guest list to take care of yourself.' }
};
let moveAnimation;
$$('[data-move]').forEach(button => button.addEventListener('click', event => {
  if (button.getAttribute('aria-pressed') === 'true') return;
  const move = moves[button.dataset.move];
  if (!move) return;
  $$('[data-move]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $('#move-number').textContent = move.number;
  $('#move-headline').textContent = move.headline;
  $('#move-copy').textContent = move.copy;
  $('#move-aside').textContent = move.aside;
  moveAnimation?.cancel();
  if (!reducedMotion.matches && event.detail !== 0) {
    moveAnimation = $('#move-response').animate([
      { opacity: .3, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 180, easing: 'cubic-bezier(.23, 1, .32, 1)' });
  }
}));

const checks = $$('input[name="routine"]');
const verdicts = ['YOUR FACE WOULD LIKE A WORD.', 'CLEAN START. STRONG OPENING.', 'LOOK AT YOU, HAVING A ROUTINE.', 'HOUSE RULES: UNDERSTOOD.'];
function updateRoutine() {
  const checked = checks.filter(input => input.checked).length;
  $('#routine-progress').style.transform = `scaleX(${checked / checks.length})`;
  $('#routine-verdict').textContent = `${checked} / ${checks.length} — ${verdicts[checked]}`;
}
checks.forEach(input => input.addEventListener('change', updateRoutine));
updateRoutine();

let imageAnimation;
$('#gallery-main').addEventListener('load', () => {
  imageAnimation?.cancel();
  if (!reducedMotion.matches && !body.classList.contains('keyboard-mode')) {
    imageAnimation = $('#gallery-main').animate([{ opacity: .65 }, { opacity: 1 }], { duration: 180, easing: 'ease' });
  }
});

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) { moveAnimation?.cancel(); imageAnimation?.cancel(); }
});
