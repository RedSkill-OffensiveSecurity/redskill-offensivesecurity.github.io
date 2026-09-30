(() => {
  'use strict';


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
  let lastPaint = 0;
  let elapsed = 0;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  const animate = (time) => {
    // Subtle idle motion does not need to repaint at the display's full refresh rate.
    if (lastPaint && time - lastPaint < 32) {
      frame = requestAnimationFrame(animate);
      return;
    }
    lastPaint = time;
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
  const canBlink = () => blinkReady && mascot.classList.contains('is-active');
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
    const scene = mascot.closest('.fox-terminal');
    const allowed = scene ? scene.open : !document.documentElement.classList.contains('fox-scene-open');
    const active = !document.hidden && !reducedMotion.matches && mascot.dataset.visible === 'true' && allowed;
    mascot.classList.toggle('is-active', active);
    if (active) loadBlinkFrame();
    cancelAnimationFrame(frame);
    lastTime = 0;
    lastPaint = 0;
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
  document.addEventListener('redskill:scene', updatePlayback);

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
