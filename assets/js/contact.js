(() => {
  'use strict';

  const emailSlot = document.getElementById('contact-email');

  if (emailSlot) {
    const encodedAddress = [56, 7, 27, 246, 238, 232, 198, 246, 177, 181, 185, 153, 156, 109, 125, 114, 5, 91, 42, 63, 113, 14, 11];
    const address = String.fromCharCode(
      ...encodedAddress.map((value, index) => value ^ ((91 + index * 13) & 255)),
    );
    const link = document.createElement('a');
    const label = document.createElement('b');

    link.className = 'contact-email-link';
    link.href = `mailto:${address}`;
    link.setAttribute('aria-label', `Enviar e-mail para ${address}`);
    label.textContent = address;
    link.append(label);
    emailSlot.replaceWith(link);
  }

  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitButton = document.getElementById('contact-submit');
  const statusElement = document.getElementById('form-status');
  const turnstileContainer = document.getElementById('turnstile-widget');
  const turnstileStatus = document.getElementById('turnstile-status');
  const apiUrl = 'https://redskill-contact.pedro-araujo-730.workers.dev';
  const turnstileApiUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  let turnstileWidgetId = null;
  let turnstileToken = '';
  let turnstileStarted = false;

  function setStatus(message, type = '') {
    statusElement.textContent = message;
    statusElement.classList.remove('success', 'error');
    if (type) statusElement.classList.add(type);
  }

  function setTurnstileStatus(message, type = '') {
    turnstileStatus.textContent = message;
    turnstileStatus.classList.remove('success', 'error');
    if (type) turnstileStatus.classList.add(type);
  }

  function setVerification(token, message = '') {
    turnstileToken = token;
    submitButton.disabled = !turnstileToken;
    setTurnstileStatus(message, turnstileToken ? 'success' : 'error');
  }

  function resetTurnstile(message) {
    turnstileToken = '';
    submitButton.disabled = true;
    setTurnstileStatus(message);
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  }

  function renderTurnstile() {
    if (!turnstileContainer || !turnstileStatus) return;

    if (!window.turnstile) {
      setVerification('', 'A verificação foi bloqueada. Libere challenges.cloudflare.com e recarregue a página.');
      return;
    }

    const compact = window.matchMedia('(max-width: 360px)').matches;
    turnstileContainer.classList.toggle('is-compact', compact);

    try {
      turnstileWidgetId = window.turnstile.render(turnstileContainer, {
        sitekey: turnstileContainer.dataset.sitekey,
        theme: 'auto',
        size: compact ? 'compact' : 'flexible',
        appearance: 'always',
        action: 'contact',
        retry: 'auto',
        'retry-interval': 8000,
        callback: token => setVerification(token, 'Verificação concluída.'),
        'expired-callback': () => resetTurnstile('Verificação expirada. Gerando uma nova…'),
        'timeout-callback': () => resetTurnstile('A verificação expirou. Tentando novamente…'),
        'error-callback': code => {
          setVerification('', `Não foi possível carregar a verificação (${code}). Verifique bloqueadores e DNS.`);
        },
        'unsupported-callback': () => {
          setVerification('', 'Este navegador não é compatível com a verificação de segurança.');
        },
      });

      window.setTimeout(() => {
        if (!turnstileToken && !turnstileContainer.querySelector('iframe')) {
          setVerification('', 'A verificação não carregou. Libere challenges.cloudflare.com no navegador ou DNS.');
        }
      }, 10000);
    } catch (error) {
      console.error('Erro ao iniciar Turnstile:', error);
      setVerification('', 'Não foi possível iniciar a verificação de segurança. Recarregue a página.');
    }
  }

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${turnstileApiUrl}"]`);
      if (existing) {
        existing.addEventListener('load', resolve, {once:true});
        existing.addEventListener('error', reject, {once:true});
        return;
      }

      const script = document.createElement('script');
      script.src = turnstileApiUrl;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', resolve, {once:true});
      script.addEventListener('error', reject, {once:true});
      document.head.append(script);
    });
  }

  function startTurnstile() {
    if (turnstileStarted) return;
    turnstileStarted = true;
    setTurnstileStatus('Carregando verificação de segurança…');
    loadTurnstile()
      .then(renderTurnstile)
      .catch(() => setVerification('', 'A verificação foi bloqueada. Libere challenges.cloudflare.com e recarregue a página.'));
  }

  const contactSection = form.closest('.contact') || form;
  if ('IntersectionObserver' in window) {
    const turnstileObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      turnstileObserver.disconnect();
      startTurnstile();
    }, {rootMargin:'500px 0px', threshold:0});
    turnstileObserver.observe(contactSection);
  } else {
    startTurnstile();
  }
  form.addEventListener('focusin', startTurnstile, {once:true});
  form.addEventListener('pointerdown', startTurnstile, {once:true, passive:true});

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('');

    if (!turnstileToken) {
      setStatus('Aguarde ou libere a verificação de segurança.', 'error');
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
        const reference = result.requestId ? ` Referência: ${result.requestId}` : '';
        throw new Error(`${result.error || 'Não foi possível enviar sua solicitação.'}${reference}`);
      }

      form.reset();
      setStatus('Solicitação enviada com sucesso. Entraremos em contato em breve.', 'success');
      resetTurnstile('Gerando uma nova verificação…');
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      setStatus(error.message || 'Não foi possível enviar sua solicitação.', 'error');
      resetTurnstile('Gerando uma nova verificação…');
    } finally {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = !turnstileToken;
    }
  });
})();
