const form = document.querySelector('#contact-form');
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('#contact-status');
  if (button.disabled) return;
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    const data = Object.fromEntries(new FormData(form));
    data._subject = 'PuraClear website contact';
    data._replyto = data.email;
    const response = await fetch('https://formsubmit.co/ajax/puraclear@gmail.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(15000)
    });
    const result = await response.json();
    if (!response.ok || ![true, 'true'].includes(result.success)) throw new Error();
    form.reset();
    status.textContent = 'Your message was submitted. Thank you for contacting PuraClear.';
  } catch {
    status.textContent = 'Your message could not be sent. Please try again or email puraclear@gmail.com.';
  } finally { button.disabled = false; }
});
