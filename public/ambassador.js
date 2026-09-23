const qs = selector => document.querySelector(selector);

function addNavLink() {
  const nav = qs('.nav-left');
  const philosophy = [...nav?.querySelectorAll('a') || []].find(link => link.textContent.trim().toLowerCase() === 'our philosophy');
  if (!nav || !philosophy || nav.querySelector('a[href="#ambassador"]')) return;
  const link = document.createElement('a');
  link.href = '#ambassador';
  link.textContent = 'Ambassador Program';
  philosophy.insertAdjacentElement('afterend', link);
}

function addMobileMenuLink() {
  const menu = qs('#menu-dialog nav');
  const philosophy = [...menu?.querySelectorAll('a') || []].find(link => link.textContent.toLowerCase().includes('our philosophy'));
  if (!menu || !philosophy || menu.querySelector('a[href="#ambassador"]')) return;
  const link = document.createElement('a');
  link.href = '#ambassador';
  link.textContent = 'Ambassador Program ↗';
  philosophy.insertAdjacentElement('afterend', link);
  link.addEventListener('click', () => qs('#menu-dialog')?.close());
}

function addFooterLink() {
  const footerColumns = document.querySelectorAll('.footer-top > div');
  const navColumn = footerColumns[0];
  if (!navColumn || navColumn.querySelector('a[href="#ambassador"]')) return;
  const link = document.createElement('a');
  link.href = '#ambassador';
  link.textContent = 'Ambassador Program';
  const faqLink = navColumn.querySelector('a[href="#faq"]');
  if (faqLink) faqLink.insertAdjacentElement('beforebegin', link);
  else navColumn.append(link);
}

function buildSection() {
  if (qs('#ambassador')) return;
  const faq = qs('#faq');
  if (!faq) return;

  const section = document.createElement('section');
  section.className = 'ambassador-section section-pad';
  section.id = 'ambassador';
  section.setAttribute('aria-labelledby', 'ambassador-title');
  section.innerHTML = `
    <div class="ambassador-shell">
      <div class="ambassador-copy reveal">
        <span class="eyebrow">THE PURACLEAR COMMUNITY</span>
        <h2 id="ambassador-title">Grow with PuraClear.</h2>
        <p>We’re looking to connect with creators, students, and community leaders who want to share PuraClear and help grow the brand.</p>
      </div>
      <div class="ambassador-form-wrap reveal">
        <h3>Represent PuraClear</h3>
        <form class="ambassador-form" id="ambassador-form" action="https://formsubmit.co/puraclear@gmail.com" method="POST">
          <input type="hidden" name="_subject" value="New PuraClear Ambassador Application">
          <input type="hidden" name="_captcha" value="false">
          <div class="ambassador-honeypot" aria-hidden="true"><label>Leave this field empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>

          <div class="ambassador-field">
            <label for="ambassador-name">Name</label>
            <input id="ambassador-name" name="name" type="text" autocomplete="name" required>
          </div>
          <div class="ambassador-field">
            <label for="ambassador-email">Email</label>
            <input id="ambassador-email" name="email" type="email" autocomplete="email" required>
          </div>
          <div class="ambassador-field">
            <label for="ambassador-platform">Primary Social Platform</label>
            <select id="ambassador-platform" name="primary_social_platform" required>
              <option value="" selected disabled>Select platform</option>
              <option>Instagram</option>
              <option>TikTok</option>
              <option>YouTube</option>
              <option>X</option>
              <option>Other</option>
            </select>
          </div>
          <div class="ambassador-field">
            <label for="ambassador-handle">Handle</label>
            <input id="ambassador-handle" name="handle" type="text" placeholder="@yourhandle or profile link" required>
          </div>
          <div class="ambassador-field">
            <label for="ambassador-additional-handle">Additional Handle <span aria-hidden="true">(optional)</span></label>
            <input id="ambassador-additional-handle" name="additional_handle" type="text" placeholder="@yourhandle or profile link">
          </div>
          <div class="ambassador-field">
            <label for="ambassador-school">School <span aria-hidden="true">(optional)</span></label>
            <input id="ambassador-school" name="school" type="text" autocomplete="organization">
          </div>
          <div class="ambassador-field full">
            <label for="ambassador-why">Why represent PuraClear?</label>
            <textarea id="ambassador-why" name="why_represent_puraclear" required></textarea>
          </div>
          <div class="ambassador-field full">
            <label for="ambassador-community">How do you connect with your community?</label>
            <textarea id="ambassador-community" name="community_connection" required></textarea>
          </div>
          <button class="button primary ambassador-submit" type="submit"><span>Submit Application</span><span aria-hidden="true">↗</span></button>
          <p class="ambassador-status" id="ambassador-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>`;

  faq.insertAdjacentElement('beforebegin', section);
}

function wireForm() {
  const form = qs('#ambassador-form');
  const status = qs('#ambassador-status');
  if (!form || !status) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>Submitting...</span>';
    status.className = 'ambassador-status';
    status.textContent = '';

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('https://formsubmit.co/ajax/puraclear@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      status.className = 'ambassador-status success';
      status.textContent = 'Thanks for reaching out. The PuraClear team will review your application.';
    } catch {
      status.className = 'ambassador-status error';
      status.textContent = 'Something went wrong. Please try again in a moment.';
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  });
}

addNavLink();
addMobileMenuLink();
addFooterLink();
buildSection();
wireForm();
