(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const select = (selector, context = document) => context.querySelector(selector);
  const selectAll = (selector, context = document) => [...context.querySelectorAll(selector)];
  let heroMotionActive = false;


  function setupTheme() {
    const button = select('#tgl');
    const themeColor = select('meta[name="theme-color"]');
    const storageKey = 'redskill-site-theme';
    const applyTheme = (theme) => {
      root.dataset.theme = theme;
      const isLight = theme === 'light';
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('aria-label', isLight ? 'Ativar tema escuro' : 'Ativar tema claro');
      themeColor.setAttribute('content', isLight ? '#faf9f8' : '#07070a');
    };

    let initialTheme = root.dataset.theme || 'dark';
    try {
      const savedTheme = localStorage.getItem(storageKey);
      if (savedTheme === 'light' || savedTheme === 'dark') initialTheme = savedTheme;
    } catch (_) {}
    applyTheme(initialTheme);

    button.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
      try { localStorage.setItem(storageKey, root.dataset.theme); } catch (_) {}
    });
  }

  function setupHeroMotionState() {
    const hero = select('.hero');
    const bounds = hero.getBoundingClientRect();
    let intersects = bounds.bottom > 0 && bounds.top < innerHeight;
    const sync = () => {
      const active = intersects && !document.hidden && !reduceMotion.matches && !root.classList.contains('fox-scene-open');
      if (active === heroMotionActive) return;
      heroMotionActive = active;
      hero.classList.toggle('is-motion-active', active);
      document.dispatchEvent(new Event('redskill:hero-motion'));
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        intersects = entry.isIntersecting;
        sync();
      }, { rootMargin: '80px 0px', threshold: .01 });
      observer.observe(hero);
    }
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('redskill:scene', sync);
    reduceMotion.addEventListener('change', sync);
    sync();
  }

  function setupTyping() {
    const phrases = [
      'pentest --alvo sua-empresa.com.br',
      'red-team --objetivo validar-defesas',
      'resposta-incidentes --preservar-evidencias',
      'compliance --lgpd --seguranca-aplicada',
    ];
    const output = select('#typed');
    if (reduceMotion.matches) {
      output.textContent = phrases[0];
      return;
    }

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timer = 0;
    const queue = (delay) => {
      window.clearTimeout(timer);
      if (heroMotionActive) timer = window.setTimeout(typeNext, delay);
    };
    function typeNext() {
      if (!heroMotionActive) return;
      const phrase = phrases[phraseIndex];
      output.textContent = phrase.slice(0, characterIndex);
      if (!deleting) {
        characterIndex += 1;
        if (characterIndex > phrase.length) {
          deleting = true;
          queue(1700);
          return;
        }
      } else {
        characterIndex -= 1;
        if (characterIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      queue(deleting ? 26 : 55);
    }
    document.addEventListener('redskill:hero-motion', () => {
      window.clearTimeout(timer);
      if (heroMotionActive) typeNext();
    });
    if (heroMotionActive) typeNext();
  }

  function setupTerminal() {
    const terminal = select('#mterm');
    const lines = [
      ['p', '➜', ' pentest --escopo aplicacao'],
      ['d', '', 'superfície mapeada · hipóteses priorizadas'],
      ['p', '➜', ' validar --impacto --seguro'],
      ['ok', '[✓]', ' evidências prontas para decisão'],
    ];

    const appendLine = ([className, prefix, text]) => {
      const row = document.createElement('div');
      const marker = document.createElement('span');
      marker.className = className;
      marker.textContent = prefix;
      row.append(marker, document.createTextNode(text));
      terminal.append(row);
      return row;
    };

    if (reduceMotion.matches) {
      lines.forEach(appendLine);
      return;
    }

    let index = 0;
    let timer = 0;
    const queue = (callback, delay) => {
      window.clearTimeout(timer);
      if (heroMotionActive) timer = window.setTimeout(callback, delay);
    };
    function cycle() {
      if (!heroMotionActive) return;
      if (index >= lines.length) {
        queue(() => {
          terminal.replaceChildren();
          index = 0;
          cycle();
        }, 2600);
        return;
      }
      const row = appendLine(lines[index]);
      index += 1;
      row.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'both' });
      queue(cycle, 700);
    }
    document.addEventListener('redskill:hero-motion', () => {
      window.clearTimeout(timer);
      if (heroMotionActive) cycle();
    });
    if (heroMotionActive) cycle();
  }


  function setupCardLighting() {
    if (!finePointer.matches || reduceMotion.matches) return;
    selectAll('.tc, .b, .cert-card').forEach((card) => {
      let frame = 0;
      card.addEventListener('pointermove', (event) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width;
          const y = (event.clientY - bounds.top) / bounds.height;
          card.style.setProperty('--mx', `${x * 100}%`);
          card.style.setProperty('--my', `${y * 100}%`);
          if (card.classList.contains('tc')) {
            card.style.transform = `rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg)`;
          }
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        if (card.classList.contains('tc')) card.style.transform = '';
      });
    });
  }

  function setupAimCursor() {
    const cursor = select('.aim-cursor');
    let targetX = 0;
    let targetY = 0;
    let drawX = 0;
    let drawY = 0;
    let frame = 0;
    let visible = false;

    const paint = () => {
      drawX += (targetX - drawX) * .68;
      drawY += (targetY - drawY) * .68;
      cursor.style.transform = `translate3d(${drawX - 24}px, ${drawY - 24}px, 0)`;
      if (visible && (Math.abs(targetX - drawX) > .1 || Math.abs(targetY - drawY) > .1)) {
        frame = requestAnimationFrame(paint);
      } else {
        frame = 0;
      }
    };

    const hide = () => {
      visible = false;
      cursor.classList.remove('is-visible', 'is-link', 'is-down');
      root.classList.remove('aim-enabled');
      cancelAnimationFrame(frame);
      frame = 0;
    };

    document.addEventListener('pointermove', (event) => {
      const editing = event.target.closest('input, textarea, select, label, [contenteditable="true"]');
      if (!finePointer.matches || reduceMotion.matches || root.classList.contains('fox-scene-open') || event.pointerType === 'touch' || editing) {
        hide();
        return;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        drawX = targetX;
        drawY = targetY;
      }
      visible = true;
      root.classList.add('aim-enabled');
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-link', Boolean(event.target.closest('a, button')));
      if (!frame) frame = requestAnimationFrame(paint);
    }, { passive: true });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', hide);
    document.addEventListener('keydown', (event) => { if (event.key === 'Tab') hide(); });
    window.addEventListener('blur', hide);
    document.addEventListener('redskill:scene', hide);
    finePointer.addEventListener('change', hide);
    reduceMotion.addEventListener('change', hide);
  }

  function setupScrollEffects() {
    const timeline = select('#tl');
    const fill = select('#tlfill');
    const progress = select('#prog');
    const timelineItems = selectAll('.tli');
    let frame = 0;

    const update = () => {
      frame = 0;
      const pageHeight = document.documentElement.scrollHeight - innerHeight;
      const timelineBounds = timeline.getBoundingClientRect();
      const timelineProgress = Math.min(Math.max((innerHeight * .6 - timelineBounds.top) / timelineBounds.height, 0), 1);
      const activeItems = timelineItems.map((item) => item.getBoundingClientRect().top < innerHeight * .6);
      // Finish layout reads before applying styles during scroll.
      progress.style.transform = `scaleX(${pageHeight ? Math.min(1, Math.max(0, scrollY / pageHeight)) : 0})`;
      fill.style.transform = `scaleY(${timelineProgress})`;
      timelineItems.forEach((item, index) => item.classList.toggle('on', activeItems[index]));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
  }

  function setupReveals() {
    // Content already on screen must paint immediately, without an entrance delay.
    const elements = selectAll('.reveal').filter((element) => {
      if (element.getBoundingClientRect().top < innerHeight) {
        element.classList.remove('reveal');
        return false;
      }
      return true;
    });
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.remove('reveal'));
      return;
    }

    const stagger = (selector, step, cap = Infinity) => {
      selectAll(selector).forEach((element, index) => {
        element.style.setProperty('--reveal-delay', `${Math.min(index * step, cap)}ms`);
      });
    };
    const gridStagger = (selector, columns, step) => {
      selectAll(selector).forEach((element, index) => {
        element.style.setProperty('--reveal-delay', `${(index % columns) * step}ms`);
      });
    };

    stagger('.hero-intro > .reveal', 65, 195);
    stagger('.bento > .reveal', 60, 240);
    stagger('.services .sec-top > .reveal, .timeline .sec-top > .reveal', 85, 85);
    const serviceColumns = innerWidth <= 560 ? 1 : innerWidth <= 860 ? 2 : 3;
    gridStagger('.tilt-grid > .reveal', serviceColumns, 60);
    stagger('.cert-heading > .reveal', 90, 180);
    const certificateColumns = innerWidth <= 370 ? 1 : innerWidth <= 920 ? 2 : 4;
    gridStagger('.cert-list > .reveal', certificateColumns, 70);

    root.classList.add('anim');
    let observer;
    const show = (element) => {
      if (!element.classList.contains('reveal') || element.classList.contains('in')) return;
      element.classList.add('in');
      observer?.unobserve(element);
      const delay = parseFloat(element.style.getPropertyValue('--reveal-delay')) || 0;
      window.setTimeout(() => {
        element.classList.remove('reveal', 'in');
        element.style.removeProperty('--reveal-delay');
      }, 800 + delay);
    };
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
      });
    }, { threshold: .03, rootMargin: '60px 0px' });
    elements.forEach((element) => observer.observe(element));
  }

  function setupGlitch() {
    const title = select('.hero-title');
    const lines = selectAll('.glitch-line', title);
    const symbols = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'A', 'B', 'C', 'D', 'E', 'F', '/', '\\', '[', ']', '{', '}',
      '<', '>', '#', '@', '%', '?', '|', '+', '-', '_', '^', '~',
      '░', '▒', '▓', '█', '▄', '▀', '▌', '▐', '■', '□', '╳', '┼', '┤', '├',
    ];
    const bitSymbols = ['0', '1', '0', '1', '░', '▒', '▓', '█'];
    const timers = new Set();
    let sequence = 0;

    const random = () => {
      if (window.crypto?.getRandomValues) {
        const value = new Uint32Array(1);
        window.crypto.getRandomValues(value);
        return value[0] / 4294967296;
      }
      return Math.random();
    };
    const between = (minimum, maximum) => minimum + random() * (maximum - minimum);
    const integer = (minimum, maximum) => Math.floor(between(minimum, maximum + 1));
    const pick = (items) => items[integer(0, items.length - 1)];
    const later = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    };
    const shuffled = (items) => {
      const result = [...items];
      for (let index = result.length - 1; index > 0; index -= 1) {
        const target = integer(0, index);
        [result[index], result[target]] = [result[target], result[index]];
      }
      return result;
    };

    const restoreLine = (line) => {
      if (!line.dataset.original) return;
      line.textContent = line.dataset.original;
      delete line.dataset.original;
    };

    const buildGlyphs = (line) => {
      const original = line.textContent;
      line.dataset.original = original;
      line.replaceChildren();
      let wordIndex = 0;
      [...original].forEach((character) => {
        const glyph = document.createElement('span');
        glyph.className = 'glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.dataset.character = character;
        if (character === ' ') wordIndex += 1;
        else glyph.dataset.word = String(wordIndex);
        glyph.textContent = character;
        line.append(glyph);
      });
      const glyphs = selectAll('.glyph', line);
      const widths = glyphs.map(glyph => glyph.getBoundingClientRect().width);
      glyphs.forEach((glyph, index) => {
        glyph.style.display = 'inline-block';
        glyph.style.width = `${widths[index]}px`;
      });
      return glyphs;
    };

    const clearVisual = () => {
      title.removeAttribute('data-glitch-mode');
      lines.forEach((line) => {
        line.classList.remove('is-line-glitch');
        line.style.removeProperty('--gd');
        restoreLine(line);
      });
      title.style.removeProperty('width');
    };

    const stop = () => {
      sequence += 1;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      clearVisual();
    };

    const mutate = (glyph, characterSet, minimum = 45, maximum = 190) => {
      const original = glyph.dataset.character;
      const mutations = integer(1, 3);
      for (let index = 0; index < mutations; index += 1) {
        later(() => {
          if (glyph.isConnected) glyph.textContent = pick(characterSet);
        }, index * between(22, 68));
      }
      later(() => {
        if (glyph.isConnected) glyph.textContent = original;
      }, between(minimum, maximum));
    };

    const burst = () => {
      clearVisual();
      title.style.width = `${title.getBoundingClientRect().width}px`;
      const mode = pick([
        'character', 'character', 'character',
        'word', 'word', 'line', 'bit-run', 'bit-run',
      ]);
      const line = pick(lines);
      title.dataset.glitchMode = mode;
      line.style.setProperty('--gd', `${integer(130, 520)}ms`);

      if (mode === 'line') {
        line.classList.add('is-line-glitch');
        return;
      }

      const glyphs = buildGlyphs(line);
      const candidates = glyphs.filter((glyph) => glyph.dataset.word);

      if (mode === 'word') {
        const wordIds = [...new Set(candidates.map((glyph) => glyph.dataset.word))];
        const selectedWord = pick(wordIds);
        const wordGlyphs = candidates.filter((glyph) => glyph.dataset.word === selectedWord);
        wordGlyphs.forEach((glyph) => glyph.classList.add('is-word-glitch'));
        shuffled(wordGlyphs).slice(0, integer(1, Math.min(3, wordGlyphs.length))).forEach((glyph) => {
          mutate(glyph, symbols, 80, 260);
        });
        return;
      }

      if (mode === 'bit-run') {
        const start = integer(0, Math.max(0, candidates.length - 2));
        const amount = integer(2, Math.min(8, candidates.length - start));
        candidates.slice(start, start + amount).forEach((glyph, index) => {
          glyph.classList.add('is-bit-glitch');
          later(() => mutate(glyph, bitSymbols, 70, 240), index * integer(8, 35));
        });
        return;
      }

      shuffled(candidates).slice(0, integer(1, Math.min(6, candidates.length))).forEach((glyph, index) => {
        glyph.classList.add('is-char-glitch');
        later(() => mutate(glyph, symbols, 55, 230), index * integer(5, 42));
      });
    };

    const schedule = (initial = false) => {
      if (reduceMotion.matches || document.hidden || !heroMotionActive) return;
      const currentSequence = sequence;
      later(() => {
        if (currentSequence !== sequence || reduceMotion.matches || document.hidden || !heroMotionActive) return;

        const bursts = integer(1, 4);
        let offset = 0;
        for (let index = 0; index < bursts; index += 1) {
          offset += index === 0 ? 0 : integer(55, 310);
          later(() => {
            if (currentSequence === sequence) burst();
          }, offset);
        }

        later(() => {
          if (currentSequence !== sequence) return;
          clearVisual();
          schedule();
        }, offset + integer(220, 820));
      }, initial ? integer(450, 2400) : integer(1800, 7200));
    };

    const restart = () => {
      stop();
      schedule(true);
    };

    document.addEventListener('redskill:hero-motion', restart);
    reduceMotion.addEventListener('change', restart);
    if (heroMotionActive) schedule(true);
  }

  setupTheme();
  // Let the HTML paint, then initialize enhancements in separate short tasks.
  const afterPaint = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  async function enhance() {
    await afterPaint();
    setupHeroMotionState();
    setupReveals();
    await afterPaint();
    setupScrollEffects();
    setupTyping();
    setupTerminal();
    await afterPaint();
    setupCardLighting();
    setupAimCursor();
    setupGlitch();
  }
  enhance();
})();
