import { REGULAR_PRICE, MAX_QUANTITY, priceFor, lineKey, money, restoreCart } from './commerce.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clubEdition = document.body.dataset.angle === 'frat';
const imageBase = clubEdition ? '/images/frat' : '/images';
const packName = pack => clubEdition ? (pack === 2 ? 'The roommate duo' : 'The solo') : (pack === 2 ? 'The shelf duo' : 'The everyday');
const storageKey = 'puraclear-demo-bag-v1';
const form = $('#product-form');
let cart = [];
try { cart = restoreCart(localStorage.getItem(storageKey)); } catch { /* Private browsers can block storage. */ }

function announce(message) {
  const region = $('dialog[open] .dialog-status') || $('#status');
  region.textContent = message;
}
function saveCart() {
  try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch { announce('Your demo bag is available for this visit. Browser storage is unavailable.'); }
}
function selection() {
  return { pack: Number(form.elements.pack.value), plan: form.elements.plan.value, cadence: Number(form.elements.cadence.value) };
}
function updateOffer() {
  const selected = selection();
  const price = money(priceFor(selected));
  $('#once-price').textContent = money(priceFor({ ...selected, plan: 'once' }));
  $('#subscribe-price').textContent = money(priceFor({ ...selected, plan: 'subscribe' }));
  $('#recurring-price').textContent = price;
  $('#button-price').textContent = price;
  $('#sticky-price').textContent = price;
  $('#sticky-plan').textContent = `${selected.pack} ${selected.pack === 1 ? 'jar' : 'jars'} · ${selected.plan === 'subscribe' ? `Every ${selected.cadence} days` : 'One-time purchase'}`;
  $('#subscription-detail').hidden = selected.plan !== 'subscribe';
  $('#cadence').disabled = selected.plan !== 'subscribe';
  $('#duo-savings').textContent = selected.plan === 'subscribe' ? 'save 15%' : 'save 10%';
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog || dialog.open) return;
  if (id === 'bag-dialog') renderCart();
  dialog.showModal();
  document.body.classList.add('modal-open');
}
$$('[data-open]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.open)));
$$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => {
    if (!$('dialog[open]')) document.body.classList.remove('modal-open');
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
$$('#menu-dialog a').forEach(link => link.addEventListener('click', () => $('#menu-dialog').close()));

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function renderCart() {
  const container = $('#cart-items');
  container.replaceChildren();
  $('#order-preview').hidden = true;
  const count = cart.reduce((total, line) => total + line.pack * line.quantity, 0);
  $$('.bag-count').forEach(node => { node.textContent = `(${count})`; });
  $('.bag-trigger').setAttribute('aria-label', `Open bag, ${count} ${count === 1 ? 'item' : 'items'}`);
  $('#cart-summary').hidden = cart.length === 0;
  if (!cart.length) {
    const empty = element('div', undefined, 'empty-cart');
    const photo = element('img'); photo.src = `${imageBase}/hero-thumb.webp`; photo.alt = '';
    empty.append(photo, element('h3', clubEdition ? 'No face gear. Yet.' : 'A little space for you.'), element('p', clubEdition ? 'Big plans start with a little maintenance.' : 'Find your everyday. Add PuraClear to your demo bag.'));
    container.append(empty);
    return;
  }
  cart.forEach(line => {
    const key = lineKey(line);
    const row = element('article', undefined, 'cart-item');
    const photo = element('img'); photo.src = `${imageBase}/${line.pack === 2 ? 'duo' : 'hero'}-thumb.webp`; photo.alt = `${line.pack} PuraClear ${line.pack === 1 ? 'jar' : 'jars'}`;
    const content = element('div');
    content.append(element('h3', packName(line.pack)));
    content.append(element('p', `${line.pack} ${line.pack === 1 ? 'jar' : 'jars'} · 118 mL each`));
    content.append(element('p', line.plan === 'subscribe' ? `Subscription · Every ${line.cadence} days` : 'One-time purchase'));
    content.append(element('p', `${money(priceFor(line) * line.quantity)}${line.plan === 'subscribe' ? ' per delivery' : ''}`, 'line-price'));
    const controls = element('div', undefined, 'cart-line-controls');
    const quantity = element('div', undefined, 'quantity');
    const description = `${line.pack === 2 ? 'duo' : 'single jar'}, ${line.plan === 'subscribe' ? `every ${line.cadence} days` : 'one time'}`;
    for (const [label, delta, symbol] of [['Decrease', -1, '−'], ['Increase', 1, '+']]) {
      const button = element('button', symbol);
      button.setAttribute('aria-label', `${label} quantity of ${description}`);
      button.disabled = delta === -1 ? line.quantity === 1 : line.quantity === MAX_QUANTITY;
      button.addEventListener('click', () => changeQuantity(key, delta, label));
      if (delta === 1) quantity.append(element('span', String(line.quantity)));
      quantity.append(button);
    }
    const remove = element('button', 'Remove', 'remove-item');
    remove.setAttribute('aria-label', `Remove ${description}`);
    remove.addEventListener('click', () => {
      cart = cart.filter(item => lineKey(item) !== key); saveCart(); renderCart();
      $('#bag-dialog [data-close]').focus(); announce('Item removed from your demo bag.');
    });
    controls.append(quantity, remove); content.append(controls); row.append(photo, content); container.append(row);
  });
  const subtotal = cart.reduce((total, line) => total + priceFor(line) * line.quantity, 0);
  const regular = cart.reduce((total, line) => total + REGULAR_PRICE * line.pack * line.quantity, 0);
  $('#cart-subtotal').textContent = money(subtotal);
  $('#cart-saved').textContent = regular > subtotal ? `You save ${money(regular - subtotal)} compared with regular one-time pricing.` : '';
}
function changeQuantity(key, delta, label) {
  const index = cart.findIndex(line => lineKey(line) === key);
  if (index < 0) return;
  cart[index].quantity = Math.max(1, Math.min(MAX_QUANTITY, cart[index].quantity + delta));
  saveCart(); renderCart();
  const row = $$('.cart-item')[index];
  const preferred = row?.querySelector(`button[aria-label^="${label}"]`);
  (preferred && !preferred.disabled ? preferred : row?.querySelector('.remove-item'))?.focus();
  announce(`Quantity updated. Subtotal ${$('#cart-subtotal').textContent}.`);
}
function addToBag() {
  const selected = selection();
  if (selected.plan === 'once') selected.cadence = 0;
  const existing = cart.find(line => lineKey(line) === lineKey(selected));
  if (existing?.quantity === MAX_QUANTITY) {
    openDialog('bag-dialog'); announce('This demo allows up to 10 of each selection.'); return;
  }
  if (existing) existing.quantity += 1;
  else cart.push({ ...selected, quantity: 1 });
  saveCart(); openDialog('bag-dialog'); announce(`${packName(selected.pack)} added to your demo bag.`);
}
form.addEventListener('change', updateOffer);
form.addEventListener('submit', event => { event.preventDefault(); addToBag(); });
$('#sticky-add').addEventListener('click', addToBag);
$$('[data-subscribe]').forEach(link => link.addEventListener('click', () => {
  form.elements.plan.value = 'subscribe'; updateOffer();
}));
$$('[data-duo]').forEach(link => link.addEventListener('click', () => {
  form.elements.pack.value = '2'; form.elements.plan.value = 'once'; updateOffer();
}));
$('#preview-order').addEventListener('click', () => {
  $('#order-preview').hidden = false;
  $('#order-preview').scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  announce('Preview only. No order has been placed and no subscription has started.');
});
$('#clear-bag').addEventListener('click', () => {
  cart = []; saveCart(); renderCart(); announce('Your demo bag has been cleared.');
  $('#clear-bag').textContent = 'Demo bag cleared';
});
window.addEventListener('storage', event => {
  if (event.key === storageKey || event.key === null) { cart = restoreCart(event.key === null ? null : event.newValue); renderCart(); }
});

const images = clubEdition ? [
  ['hero', 'PuraClear jar on a maroon locker-room bench with a cream towel', 'DAILY MAINTENANCE. BIG PLANS.'],
  ['texture', 'A white moisturizer swipe on a maroon surface', 'THE CREAM. NO LECTURE.'],
  ['open', 'Open PuraClear jar and cosmetic spatula on a maroon bench', 'GOOD STUFF INSIDE.'],
  ['hand', 'An adult hand holding the 118 mL PuraClear jar for scale', 'BIG ENOUGH FOR THE PLAYBOOK.'],
  ['ritual', 'An adult man applying moisturizer at a bathroom mirror', 'THE PRE-GAME BEFORE THE PRE-GAME.']
] : [
  ['hero', 'PuraClear Acne Moisturizer jar on a blue ledge in morning sunlight', 'YOUR EVERYDAY, RECONSIDERED.'],
  ['texture', 'A tactile white cream swipe on a blue surface', 'A LITTLE CLOSER TO THE TEXTURE.'],
  ['open', 'Open PuraClear jar showing the cream, with its lid and a cosmetic spatula', 'A CLOSER LOOK AT YOUR EVERYDAY.'],
  ['hand', 'The PuraClear 118 mL jar in an adult hand for scale', 'ONE JAR. IN YOUR CORNER.'],
  ['ritual', 'PuraClear on a blue tiled bathroom counter beside a cotton towel', 'MAKE A LITTLE ROOM ON YOUR SHELF.']
];
let imageIndex = 0;
function showImage(index) {
  imageIndex = (index + images.length) % images.length;
  const [name, alt, caption] = images[imageIndex];
  $('#gallery-main').src = `${imageBase}/${name}.webp`; $('#gallery-main').alt = alt;
  $('#lightbox-image').src = `${imageBase}/${name}.webp`; $('#lightbox-image').alt = alt;
  $('#image-caption').textContent = caption;
  $('#gallery-stage').classList.toggle('alternate', imageIndex !== 0);
  $('#lightbox-count').textContent = `${imageIndex + 1} / ${images.length}`;
  $$('[data-image]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.image) === imageIndex)));
}
$$('[data-image]').forEach(button => button.addEventListener('click', () => showImage(Number(button.dataset.image))));
['gallery', 'lightbox'].forEach(prefix => {
  $(`#${prefix}-prev`).addEventListener('click', () => showImage(imageIndex - 1));
  $(`#${prefix}-next`).addEventListener('click', () => showImage(imageIndex + 1));
});
$('#zoom-image').addEventListener('click', () => { showImage(imageIndex); openDialog('image-dialog'); });
$('#image-dialog').addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showImage(imageIndex + (event.key === 'ArrowLeft' ? -1 : 1)); }
});
let touchStart;
$('#gallery-stage').addEventListener('touchstart', event => {
  if (event.touches.length !== 1) { touchStart = undefined; return; }
  const touch = event.changedTouches[0]; touchStart = [touch.clientX, touch.clientY];
}, { passive: true });
$('#gallery-stage').addEventListener('touchend', event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0], dx = touch.clientX - touchStart[0], dy = touch.clientY - touchStart[1];
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) showImage(imageIndex + (dx < 0 ? 1 : -1));
  touchStart = undefined;
}, { passive: true });

const sticky = $('#sticky-buy');
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    const visible = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
    sticky.classList.toggle('visible', visible); sticky.inert = !visible; sticky.setAttribute('aria-hidden', String(!visible));
  }).observe(form);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('awaiting'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px 30px 0px', threshold: 0.05 });
    $$('.reveal').forEach(node => { if (node.getBoundingClientRect().top > innerHeight) node.classList.add('awaiting'); observer.observe(node); });
    document.body.classList.add('motion-ready');
  }
}
updateOffer(); renderCart();
