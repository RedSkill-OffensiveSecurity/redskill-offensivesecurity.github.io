(() => {
  'use strict';

  const emailButton = document.querySelector('.email-reveal');

  if (emailButton) {
    emailButton.addEventListener('click', () => {
      const reverse = value => Array.from(value).reverse().join('');
      const address = `${reverse(emailButton.dataset.user || '')}@${reverse(emailButton.dataset.host || '')}`;
      const link = document.createElement('a');
      const label = document.createElement('b');

      link.href = `mailto:${address}`;
      link.setAttribute('aria-label', `Enviar e-mail para ${address}`);
      label.textContent = address;
      link.append(label);
      emailButton.replaceWith(link);
      link.focus();
    }, {once: true});
  }

  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitButton = document.getElementById('contact-submit');
  const statusElement = document.getElementById('form-status');
  const apiUrl = 'https://redskill-contact.pedro-araujo-730.workers.dev';

  function setStatus(message, type = '') {
    statusElement.textContent = message;
    statusElement.classList.remove('success', 'error');
    if (type) statusElement.classList.add(type);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('');

    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!turnstileToken) {
      setStatus('Confirme a verificação de segurança.', 'error');
      return;
    }

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('service').value.trim(),
      message: document.getElementById('message').value.trim(),
      website: document.getElementById('website').value.trim(),
      turnstileToken,
    };

    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (_) {}

      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível enviar sua solicitação.');
      }

      form.reset();
      setStatus('Solicitação enviada com sucesso. Entraremos em contato em breve.', 'success');
      if (window.turnstile) window.turnstile.reset();
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setStatus(error.message || 'Não foi possível enviar sua solicitação.', 'error');
      if (window.turnstile) window.turnstile.reset();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
})();
