(() => {
  'use strict';

  const fronts = [
    ['Infraestrutura', 'Servidores, endpoints, Active Directory, redes internas e exposição de serviços.', '<rect x="4" y="4" width="24" height="9" rx="2"/><rect x="4" y="19" width="24" height="9" rx="2"/><path d="M9 8.5h1m-1 15h1M20 8.5h3m-3 15h3"/>'],
    ['Web', 'Aplicações web e APIs, autenticação, lógica de negócio e controle de acesso.', '<circle cx="16" cy="16" r="13"/><ellipse cx="16" cy="16" rx="6" ry="13"/><path d="M3 16h26M6 8h20M6 24h20"/>'],
    ['Wi-Fi', 'Redes sem fio corporativas, 802.1X, segmentação e superfície de ataque wireless.', '<path d="M2 9a21 21 0 0 1 28 0M6 15a15 15 0 0 1 20 0M11 21a8 8 0 0 1 10 0"/><circle cx="16" cy="27" r="2"/>'],
    ['Mobile App', 'Aplicativos Android e iOS, armazenamento local, APIs e engenharia reversa.', '<rect x="8" y="2" width="16" height="28" rx="3"/><path d="M13 6h6m-5 20h4"/>'],
    ['Físico', 'Acesso físico, áreas restritas, dispositivos expostos e validações in loco.', '<rect x="5" y="14" width="22" height="16" rx="3"/><path d="M9 14V9a7 7 0 0 1 14 0v5m-7 9v3"/><circle cx="16" cy="21" r="2"/>'],
    ['Phishing', 'Simulações de engenharia social, credenciais, e-mails e páginas de captura.', '<rect x="2" y="6" width="28" height="20" rx="3"/><path d="m3 8 13 10L29 8"/>'],
  ];
  if (document.body.dataset.serviceCount === '9') fronts.push(
    ['IA', 'Segurança de aplicações e agentes de IA: prompt injection, dados e abuso de fluxos.', '<rect x="7" y="7" width="18" height="18" rx="4"/><path d="M11 2v5m5-5v5m5-5v5M11 25v5m5-5v5m5-5v5M2 11h5m-5 5h5m-5 5h5m18-10h5m-5 5h5m-5 5h5M12 12l8 0-4 8-4-8Zm0 0 4 8"/>'],
    ['Forense', 'Coleta e análise de evidências digitais para reconstruir eventos e orientar decisões.', '<path d="M6 3h13l7 7v7M19 3v7h7M6 3v26h12"/><circle cx="21" cy="22" r="5"/><path d="m25 26 4 4M10 14h7m-7 5h5"/>'],
    ['Purple-Team', 'Ataque e defesa juntos para validar controles, telemetria, detecção e resposta.', '<path d="M16 3 27 7v8c0 7-4.6 11.7-11 14-6.4-2.3-11-7-11-14V7l11-4Z"/><path d="m9 11 5 5-5 5m14-10-5 5 5 5M14 16h4"/>'],
  );
  const grid = document.querySelector('#grid');
  while (grid.children.length < fronts.length) {
    grid.insertAdjacentHTML('beforeend', '<article class="tc" data-service-added><span class="num"></span><h3></h3><p></p><span class="ln" aria-hidden="true"><i></i></span></article>');
  }
  // Keep the existing card elements and their lighting/tilt event listeners.
  document.querySelectorAll('#grid .tc').forEach((card, index) => {
    const [title, description, icon] = fronts[index];
    card.querySelector('.num').outerHTML = `<svg class="service-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;
    card.querySelector('h3').textContent = title;
    card.querySelector('p').textContent = description;
  });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    grid.querySelectorAll('[data-service-added]').forEach(card => {
      let frame = 0;
      card.addEventListener('pointermove', event => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width;
          const y = (event.clientY - bounds.top) / bounds.height;
          card.style.setProperty('--mx', `${x * 100}%`);
          card.style.setProperty('--my', `${y * 100}%`);
          card.style.transform = `rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg)`;
        });
      }, {passive:true});
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        card.style.transform = '';
      });
    });
  }
  const serviceSelect = document.querySelector('#service');
  serviceSelect.replaceChildren(...[...fronts.map(([title]) => `Pentest — ${title}`), 'Quero orientação para definir'].map((label) => new Option(label, label)));

  const mascots = [...document.querySelectorAll('.red-stage')];
  if (!mascots.length) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  mascots.forEach((mascot) => {
  const blinkFrame = mascot.querySelector('.red-blink');
  let blinkReady = false;
  let blinkLoadStarted = false;
  let blinkTimer = 0;
  let openTimer = 0;
  let firstBlink = true;
  const rig = mascot.querySelector('.red-rig');
  const tail = mascot.querySelector('.red-tail');
  const portrait = mascot.querySelector('.red-portrait');
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  const animate = (time) => {
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    elapsed += delta;
    const easing = 1 - Math.exp(-7 * delta);
    currentX += (targetX - currentX) * easing;
    currentY += (targetY - currentY) * easing;
    rig.style.transform = `translate3d(${currentX * 10}px,${currentY * 6}px,0) rotateX(${-currentY * 3}deg) rotateY(${currentX * 5}deg)`;
    // Independent waves keep the tail moving through pointer entry and exit.
    const swing = Math.sin(elapsed * 1.12) * 3.2 + Math.sin(elapsed * 1.87 + .6) * .65;
    const flex = Math.sin(elapsed * 1.12 - .65) * .9;
    tail.style.transform = `rotate(${swing}deg) skewY(${flex}deg) scaleX(${1 + Math.sin(elapsed * 1.12 - .9) * .012})`;
    portrait.style.transform = `translate3d(${currentX * 3}px,${Math.sin(elapsed * 1.3) * 1.3}px,0)`;
    frame = requestAnimationFrame(animate);
  };
  const canBlink = () => blinkReady && !document.hidden && !reducedMotion.matches && mascot.dataset.visible === 'true';
  const loadBlinkFrame = () => {
    if (blinkLoadStarted || !blinkFrame?.dataset.src) return;
    blinkLoadStarted = true;
    const start = () => {
      if (blinkFrame.dataset.srcset) blinkFrame.srcset = blinkFrame.dataset.srcset;
      blinkFrame.src = blinkFrame.dataset.src;
      blinkFrame.decode().then(() => {
        blinkReady = true;
        scheduleBlink();
      }).catch(() => {});
    };
    const afterLoad = () => {
      setTimeout(() => {
        if ('requestIdleCallback' in window) requestIdleCallback(start, {timeout: 1200});
        else start();
      }, 1800);
    };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, {once:true});
  };
  const scheduleBlink = () => {
    clearTimeout(blinkTimer);
    if (!canBlink()) return;
    blinkTimer = setTimeout(() => blink(false), firstBlink ? 900 : 2400 + Math.random() * 3200);
  };
  const blink = (second) => {
    if (!canBlink()) return;
    firstBlink = false;
    mascot.classList.add('is-blinking');
    openTimer = setTimeout(() => {
      mascot.classList.remove('is-blinking');
      if (!second && Math.random() < .18) {
        blinkTimer = setTimeout(() => blink(true), 160 + Math.random() * 150);
      } else scheduleBlink();
    }, 170 + Math.random() * 60);
  };

  const updatePlayback = () => {
    const active = !document.hidden && !reducedMotion.matches && mascot.dataset.visible === 'true';
    mascot.classList.toggle('is-active', active);
    if (active) loadBlinkFrame();
    cancelAnimationFrame(frame);
    lastTime = 0;
    if (active) frame = requestAnimationFrame(animate);
    else {
      targetX = targetY = currentX = currentY = 0;
      rig.style.transform = portrait.style.transform = '';
      if (reducedMotion.matches) tail.style.transform = '';
    }
    clearTimeout(openTimer);
    mascot.classList.remove('is-blinking');
    scheduleBlink();
  };
  document.addEventListener('visibilitychange', updatePlayback);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      mascot.dataset.visible = String(entry.isIntersecting);
      updatePlayback();
    }, { rootMargin: '120px 0px', threshold: .05 });
    observer.observe(mascot);
  } else {
    mascot.dataset.visible = 'true';
    updatePlayback();
  }

  const resetPose = () => {
    targetX = targetY = 0;
  };

  mascot.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || !precisePointer.matches) return;
    const bounds = mascot.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    targetX = Math.max(-1, Math.min(1, x * 2));
    targetY = Math.max(-1, Math.min(1, y * 2));
  });
  mascot.addEventListener('pointerleave', resetPose);
  mascot.addEventListener('pointercancel', resetPose);
  reducedMotion.addEventListener('change', () => {
    resetPose();
    updatePlayback();
  });
  });
})();
