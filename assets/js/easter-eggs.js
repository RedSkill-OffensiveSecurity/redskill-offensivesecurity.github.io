(() => {
  'use strict';
  // There is no spoon. There is a fox. Follow the Red Fox.
  const fox = document.getElementById('red-contact');
  const dialog = document.getElementById('fox-terminal');
  if (!fox || !dialog || typeof dialog.showModal !== 'function') return;
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = dialog.querySelector('canvas');
  const output = dialog.querySelector('.fox-lines');
  const status = dialog.querySelector('.fox-scene-status');
  const finale = dialog.querySelector('.fox-finale');
  const hint = document.getElementById('red-fox-hint');
  const room = dialog.querySelector('.fox-den');
  const log = room.querySelector('.fox-log');
  const input = room.querySelector('#fox-command');
  const title = dialog.querySelector('#fox-terminal-title');
  const eyebrow = dialog.querySelector('.fox-eyebrow');
  const description = dialog.querySelector('#fox-terminal-description');
  const introDescription = description.textContent;
  const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let phase = 'intro', introComplete = false, denStarted = false;
  let history = [], historyIndex = 0;
  const cues = ['A raposa percebeu você.', 'Tem algo do outro lado…', 'Siga a raposa vermelha.', 'Mais um toque. Faça sua escolha.'];
  const script = [
    ['command', '$ wake_up --guide red_fox'],
    ['', '[ok] Você encontrou uma passagem fora do radar.'],
    ['', '[ok] Carregando visão adversarial…'],
    ['red', '> Nem toda superfície conta a história inteira.'],
    ['command', '$ choose --pill redskill'],
    ['', '[ok] Contexto. Evidência. Clareza para agir.'],
    ['red', '> A toca da raposa vai além do óbvio.'],
    ['command', '$ follow --red-fox'],
    ['', '[ok] Bem-vindo ao outro lado. Bem-vindo à RedSkill.'],
  ];
  const alphabet = 'REDSKILL0101アイウエオカキクケコ';
  let taps = 0, hintTimer = 0, tapTimer = 0, frame = 0, lastPaint = 0, run = 0;
  let context = null, drops = [], width = 0, height = 0, cell = 18;
  let returnFocus = null, pending = null, visibilityResume = null;

  console.info('%c REDSKILL %c Wake up. Follow the Red Fox.',
    'background:#e10600;color:white;padding:6px 10px;font-weight:bold',
    'color:#78dc91;font-family:monospace');
  console.info('A raposa sabe o caminho. Cinco toques nela, ou followTheRedFox() no console.\nOutra porta: digite REDSKILL fora dos campos do formulário.');

  function sceneState(active) {
    root.classList.toggle('fox-scene-open', active);
    document.dispatchEvent(new Event('redskill:scene'));
  }
  function heading(lead, accent) {
    const em = document.createElement('em'); em.textContent = accent;
    title.replaceChildren(document.createTextNode(lead), em);
  }
  function resetScroll() {
    dialog.querySelector('.fox-content').scrollTop = 0;
    dialog.querySelector('.fox-console').scrollTop = 0;
  }
  function write(text, kind = '') {
    const line = document.createElement(kind === 'ascii' ? 'pre' : 'p');
    line.className = `fox-log-line ${kind}`;
    line.textContent = text;
    if (kind === 'ascii') {line.setAttribute('role', 'img'); line.setAttribute('aria-label', 'Raposa em arte ASCII');}
    log.append(line);
    while (log.children.length > 40) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function enterDen() {
    phase = 'den'; run += 1; clearPending(); dialog.classList.add('is-den'); syncViewport();
    output.hidden = status.hidden = finale.hidden = true;
    room.hidden = false;
    heading('Dentro da ', 'toca.');
    eyebrow.textContent = 'CANAL ENCONTRADO · RED/01';
    description.textContent = 'Terminal interativo da RedSkill. Digite help ou use os comandos rápidos. Explore os arquivos e as pistas da raposa. Sair fecha a experiência.';
    if (!denStarted) {
      denStarted = true; log.replaceChildren(); input.value = '';
      write('red@toca:~$ connect', 'command');
      write('[ok] A toca está aberta. A raposa estava esperando.');
      write('A toca vai além do que aparece na superfície.', 'red');
      write('Há arquivos, histórias e pistas escondidas. Comece com help ou ls.');
      write('Digite help ou toque em um comando.');
    }
    resetScroll();
    (precisePointer.matches ? input : room.querySelector('#fox-room-title')).focus({preventScroll:true});
  }
  function leaveDen() {
    phase = 'intro'; room.hidden = true; dialog.classList.remove('is-den'); syncViewport();
    output.hidden = status.hidden = false; finale.hidden = false;
    heading('Follow the ', 'Red Fox.');
    eyebrow.textContent = 'TRANSMISSÃO ENCONTRADA · 05:05';
    description.textContent = introDescription;
    finale.scrollIntoView({block:'nearest', behavior:'instant'});
    dialog.querySelector('.fox-enter').focus({preventScroll:true});
  }
  const files = {
    'readme.txt': 'REDSKILL / A TOCA\n\nVocê seguiu a raposa. Agora siga as perguntas.\nLeia manifesto.txt. O Red também deixou algo em red.log.',
    'manifesto.txt': 'EVIDÊNCIA ANTES DE OPINIÃO\n\nContexto para entender.\nProfundidade para encontrar.\nClareza para agir.\n\nO risco existe. A vantagem é saber antes.',
    'red.log': '[05:05] Um guia vermelho atravessou a superfície.\n[05:06] Nenhuma colher encontrada.\n[05:07] O próximo passo atende por follow.\n[05:08] Há um arquivo oculto na toca. Use ls -a para encontrá-lo.',
    '.white-rabbit': 'Pista encontrada. O coelho aponta. A raposa guia.\n\nExperimente knock knock. O Red deixou uma resposta para quem insiste.',
    '/etc/passwd': 'root:x:0:0:Arquiteto da simulação:/root:/bin/false\nred:x:1337:1337:Guia da toca:/home/red:/bin/redsh\nneo:x:101:101:Ainda procurando a colher:/home/neo:/bin/sh\nagent:x:404:404:Usuário não encontrado:/dev/null:/usr/sbin/nologin',
    '/etc/motd': 'BEM-VINDO AO REDOS\n\nÚltimo login: em alguma outra realidade.\nA colher continua desaparecida. A raposa está de plantão.',
    '/etc/hosts': '127.0.0.1       localhost toca\n198.51.100.42   redskill.com.br rabbit-hole\n\n# Todos os caminhos desta realidade passam pela raposa.',
  };
  const commands = ['help', 'whoami', 'pwd', 'id', 'ls', 'ls -a', 'ls /etc', ...Object.keys(files).map(file => `cat ${file}`), 'sudo', 'sudo -l', 'sudo whoami', 'sudo make coffee', 'ping redskill.com.br', 'ping localhost', 'uname -a', 'ps aux', 'top', 'uptime', 'echo $USER', 'echo $HOME', 'man red', 'neofetch', 'follow', 'matrix', 'thereisnospoon', 'knock knock', 'date', 'history', 'clear', 'exit'];
  function revealFox() {
    write(String.raw`  R3D
 ^   ^
/ \_/ \
\ X X /
 \___/
  \_/`, 'ascii');
    write('There is no spoon. There is a fox.', 'red');
    write('A curiosidade abriu a porta. A evidência mostrou o caminho.');
  }
  // A fictional filesystem, not a shell. Follow the story, not the host machine.
  function command(value) {
    const raw = value.trim().slice(0, 100);
    if (!raw || phase !== 'den') return;
    history.push(raw); if (history.length > 30) history.shift(); historyIndex = history.length;
    input.value = '';
    write(`red@toca:~$ ${raw}`, 'command');
    const normalized = raw.toLowerCase().replace(/\s+/g, ' ');
    if (normalized.startsWith('cat ')) {
      const filename = normalized.slice(4);
      write(Object.hasOwn(files, filename) ? files[filename] : 'Arquivo não encontrado. Veja os caminhos com ls.');
      return;
    }
    if (normalized === 'ping' || normalized.startsWith('ping ')) {
      if (normalized === 'ping') {write('Uso: ping redskill.com.br\nO Red responde mais rápido que a sua dúvida.'); return;}
      const target = raw.split(/\s+/).at(-1);
      const address = ['localhost', '127.0.0.1'].includes(target.toLowerCase()) ? '127.0.0.1' : '198.51.100.42';
      write(`PING ${target} (${address}): 56 bytes de curiosidade\n64 bytes: icmp_seq=1 ttl=64 time=0.05 ms\n64 bytes: icmp_seq=2 ttl=64 time=0.05 ms\n64 bytes: icmp_seq=3 ttl=64 time=0.05 ms\n\n3 perguntas enviadas, 3 pistas recebidas, 0% de curiosidade perdida.`);
      return;
    }
    if (normalized === 'sudo' || normalized.startsWith('sudo ')) {
      if (normalized === 'sudo -l') write('O usuário red pode executar na toca:\n  (red) NOPASSWD: curiosity, ask-better-questions, make coffee');
      else if (normalized === 'sudo whoami') write('red\nPrivilégios elevados. Ego mantido no nível recomendado.', 'red');
      else if (normalized === 'sudo make coffee') write('☕ Café pronto.\n[ok] Energia +10. Paranoia no nível saudável.');
      else if (normalized.startsWith('sudo rm')) write('O Red colocou a pata no teclado.\nApagar a toca não resolve o mistério. Tente sudo make coffee.', 'red');
      else write('[sudo] A raposa não pede sua senha. Pede uma boa pergunta.\nExperimente sudo -l, sudo whoami ou sudo make coffee.');
      return;
    }
    if (normalized === 'echo' || normalized.startsWith('echo ')) {
      const message = raw.slice(4).trim().replaceAll('$USER', 'red').replaceAll('$HOME', '/home/red/toca');
      write(message || '…o eco também sabe ficar em silêncio.'); return;
    }
    switch (normalized) {
      case 'help':
        write('help      mapa dos comandos\nwhoami    conheça o Red\npwd / id  seu lugar nesta realidade\nls        arquivos da toca\nls /etc   arquivos do RedOS\ncat       leia: cat /etc/passwd\nsudo      privilégios com humor\nping      teste o eco: ping redskill.com.br\nuname -a  conheça o RedOS\nps / top  processos da imaginação\nuptime    quanto tempo dura a curiosidade\necho      devolve sua mensagem\nman red   manual da raposa\nneofetch  retrato do sistema\nfollow    siga a raposa\nmatrix    acorde do outro lado\ndate      horário desta realidade\nhistory   seus passos até aqui\nclear     limpe o terminal\nexit      volte ao mundo real');
        write('Dica: nem todo arquivo aparece à primeira vista.', 'red'); break;
      case 'whoami': write('RED / GUIA DA TOCA\n\nFarejador de contexto. Curioso por natureza.\nEu sigo rastros. Você faz as perguntas certas.'); break;
      case 'pwd': write('/home/red/toca'); break;
      case 'id': write('uid=1337(red) gid=1337(redskill) groups=1337(redskill),42(curiosos)'); break;
      case 'ls': write('readme.txt    manifesto.txt    red.log'); break;
      case 'ls -a': write('.white-rabbit    readme.txt    manifesto.txt    red.log'); break;
      case 'ls /etc': write('passwd    hosts    motd'); break;
      case 'uname':
      case 'uname -a': write('RedOS toca 5.05 fox64 GNU/Curiosity\nKernel compilado com evidência e uma dose de café.'); break;
      case 'ps':
      case 'ps aux': write('USER  PID   PROCESSO\nred   1337  follow-the-fox\nneo   0101  find-the-spoon\nred   0042  ask-better-questions'); break;
      case 'top': write('RedOS / CPU: tranquila | Curiosidade: 100%\n\n1337  red  seguindo rastros\n0101  neo  procurando a colher\n0042  red  fazendo perguntas melhores'); break;
      case 'uptime': write('up desde a primeira pergunta\nload average: 0.00, 0.00, 42.00\nA curiosidade não entra em modo de repouso.'); break;
      case 'man red': write('RED(1) — MANUAL DA RAPOSA\n\nNOME\n  red — fareja contexto antes de tirar conclusões\n\nUSO\n  follow\n\nNOTAS\n  Se parecer óbvio, olhe outra vez.\n\nBUGS\n  A localização da colher continua desconhecida.'); break;
      case 'neofetch': revealFox(); write('OS: RedOS 5.05\nHost: A toca\nShell: redsh\nTema: evidência antes de opinião\nMemória: suficiente para lembrar das boas perguntas'); break;
      case 'follow': revealFox(); break;
      case 'matrix':
        write('WAKE UP. THE FOX HAS YOU.', 'red');
        write('Você pode fechar a janela. Ou olhar entre as linhas.\nO Red deixou um arquivo que começa com um ponto.'); break;
      case 'thereisnospoon': write('Exatamente. A colher era uma distração.\nA raposa continua aqui. Experimente follow.', 'red'); break;
      case 'knock knock':
        write('ACCESS GRANTED / CURIOSIDADE CONFIRMADA', 'red');
        write('O Red responde:\n“Se você chegou até aqui, já entendeu: a melhor ferramenta é uma boa pergunta.”');
        revealFox(); break;
      case 'date': write(new Date().toLocaleString('pt-BR')); break;
      case 'history': write(history.map((item, index) => `${String(index + 1).padStart(2, '0')}  ${item}`).join('\n')); break;
      case 'clear': log.replaceChildren(); write('Canal limpo. A curiosidade continua.'); break;
      case 'exit': close(); break;
      default: write('Comando não encontrado. Digite help para explorar a toca.');
    }
  }
  room.querySelector('.fox-prompt').addEventListener('submit', event => {event.preventDefault(); command(input.value);});
  room.querySelectorAll('[data-fox-command]').forEach(button => {
    button.addEventListener('click', () => command(button.dataset.foxCommand));
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Tab' && input.value.trim()) {
      const matches = commands.filter(item => item.startsWith(input.value.toLowerCase().trim()));
      if (matches.length) {
        event.preventDefault();
        if (matches.length === 1) input.value = matches[0];
        else {write(matches.join('    ')); input.value = matches.reduce((prefix, item) => {while (!item.startsWith(prefix)) prefix = prefix.slice(0, -1); return prefix;});}
      }
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'l') {event.preventDefault(); command('clear'); return;}
    if (!['ArrowUp', 'ArrowDown'].includes(event.key) || !history.length) return;
    event.preventDefault();
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    input.value = history[historyIndex] || '';
    input.setSelectionRange(input.value.length, input.value.length);
  });
  function syncViewport() {
    const viewport = window.visualViewport;
    dialog.classList.toggle('is-compact', dialog.open && phase === 'den' && (viewport?.height || innerHeight) < 520);
    if (dialog.open && phase === 'den' && viewport && viewport.scale <= 1.05) {
      dialog.style.setProperty('--fox-height', `${viewport.height}px`);
      dialog.style.setProperty('--fox-top', `${viewport.offsetTop}px`);
    } else {dialog.style.removeProperty('--fox-height'); dialog.style.removeProperty('--fox-top');}
  }
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);
  room.querySelector('.fox-den-back').addEventListener('click', leaveDen);
  room.querySelector('.fox-den-exit').addEventListener('click', close);
  function resizeRain() {
    if (!dialog.open) return;
    const rect = dialog.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#030806'; context.fillRect(0, 0, width, height);
    cell = width < 600 ? 20 : 22;
    drops = Array.from({length:Math.ceil(width / cell)}, () => -Math.random() * height / cell);
    context.font = `14px "JetBrains Mono", monospace`;
  }
  function paint(time) {
    frame = 0;
    if (!dialog.open || document.hidden || reduced.matches || !context) return;
    if (!lastPaint || time - lastPaint >= 40) {
      const step = lastPaint ? Math.min((time - lastPaint) / 40, 2) : 1;
      lastPaint = time;
      context.fillStyle = 'rgba(3,8,6,.12)'; context.fillRect(0, 0, width, height);
      drops.forEach((drop, index) => {
        context.fillStyle = index % 13 === 0 ? '#ff4545' : '#56d279';
        context.fillText(alphabet[Math.floor(Math.random() * alphabet.length)], index * cell, drop * cell);
        drops[index] += step * .6;
        if (drop * cell > height && Math.random() > .975) drops[index] = -Math.random() * 20;
      });
    }
    frame = requestAnimationFrame(paint);
  }
  function playback() {
    cancelAnimationFrame(frame); frame = 0; lastPaint = 0;
    if (dialog.open && !document.hidden && !reduced.matches) frame = requestAnimationFrame(paint);
  }
  function clearPending() {
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve(false);
      pending = null;
    }
    if (visibilityResume) { visibilityResume(false); visibilityResume = null; }
  }
  async function wait(ms, sequence) {
    if (run !== sequence || !dialog.open) return false;
    if (document.hidden) {
      const visible = await new Promise(resolve => {visibilityResume = resolve;});
      if (!visible || run !== sequence || !dialog.open) return false;
    }
    return new Promise(resolve => {
      const timer = setTimeout(() => {pending = null; resolve(run === sequence && dialog.open);}, ms);
      pending = {timer, resolve};
    });
  }
  async function cutscene() {
    clearPending();
    phase = 'intro'; introComplete = false; room.hidden = true; dialog.classList.remove('is-den'); syncViewport();
    output.hidden = status.hidden = false;
    heading('Follow the ', 'Red Fox.'); eyebrow.textContent = 'TRANSMISSÃO ENCONTRADA · 05:05';
    description.textContent = introDescription;
    const sequence = ++run;
    output.replaceChildren(); finale.hidden = true;
    status.textContent = 'Conexão com a raposa estabelecida.';
    for (const [kind, text] of script) {
      if (run !== sequence || !dialog.open) return;
      const line = document.createElement('p');
      line.className = `fox-line ${kind}`;
      output.append(line);
      if (reduced.matches) line.textContent = text;
      else {
        line.classList.add('is-typing');
        for (let index = 0; index < text.length; index += 3) {
          if (!await wait(20, sequence)) return;
          line.textContent = text.slice(0, index + 3);
        }
        line.classList.remove('is-typing');
        line.scrollIntoView({block:'nearest', behavior:'instant'});
        if (!await wait(kind === 'red' ? 550 : 280, sequence)) return;
      }
    }
    introComplete = true; finale.hidden = false;
    status.textContent = 'Passagem concluída. Você encontrou o easter egg da RedSkill.';
    finale.scrollIntoView({block:'nearest', behavior:reduced.matches ? 'instant' : 'smooth'});
  }
  function open() {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    denStarted = false; history = []; historyIndex = 0;
    taps = 0; clearTimeout(hintTimer); clearTimeout(tapTimer);
    fox.removeAttribute('data-hint'); hint.textContent = '';
    dialog.querySelectorAll('.fox-guide source[data-srcset]').forEach(source => {
      if (!source.hasAttribute('srcset')) source.srcset = source.dataset.srcset;
    });
    dialog.querySelectorAll('.fox-guide img[data-src]:not(.red-blink)').forEach(img => {
      if (!img.hasAttribute('src')) img.src = img.dataset.src;
    });
    dialog.showModal(); sceneState(true); resizeRain(); playback();
    dialog.querySelector('.fox-exit').focus({preventScroll:true});
    cutscene();
  }
  function releaseScene() {
    if (!root.classList.contains('fox-scene-open')) return;
    run += 1; clearPending(); cancelAnimationFrame(frame); frame = 0;
    context?.clearRect(0, 0, canvas.width, canvas.height);
    sceneState(false); dialog.classList.remove('is-den'); syncViewport();
    if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
  }
  function close() { if (dialog.open) dialog.close(); releaseScene(); }
  dialog.addEventListener('close', () => {if (!dialog.open) releaseScene();});
  dialog.addEventListener('cancel', event => {event.preventDefault(); close();});
  dialog.querySelector('.fox-exit').addEventListener('click', close);
  dialog.querySelector('.fox-return').addEventListener('click', close);
  dialog.querySelector('.fox-enter').addEventListener('click', enterDen);
  fox.addEventListener('click', () => {
    taps += 1; clearTimeout(hintTimer); clearTimeout(tapTimer);
    if (taps >= 5) {open(); return;}
    fox.dataset.hint = cues[taps - 1]; hint.textContent = cues[taps - 1];
    if (!reduced.matches) fox.querySelector('.red-body').animate([
      {transform:'scale(1)'}, {transform:'scale(.96) rotate(-1deg)'}, {transform:'scale(1)'},
    ], {duration:340,easing:'cubic-bezier(.22,.68,.16,1)'});
    // The clue is brief; the visitor still has time to follow the fox.
    hintTimer = setTimeout(() => {fox.removeAttribute('data-hint'); hint.textContent = '';}, 1500);
    tapTimer = setTimeout(() => {taps = 0;}, 8000);
  });
  let code = '';
  document.addEventListener('keydown', event => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.key.length !== 1) {code = ''; return;}
    code = (code + event.key.toLowerCase()).slice(-8);
    if (code === 'redskill') {code = ''; open();}
  });
  window.followTheRedFox = open;
  window.addEventListener('resize', resizeRain, {passive:true});
  document.addEventListener('visibilitychange', () => {
    playback();
    if (!document.hidden && visibilityResume) {const resume = visibilityResume; visibilityResume = null; resume(true);}
  });
  reduced.addEventListener('change', () => {
    playback();
    if (dialog.open && phase === 'intro' && !introComplete) cutscene();
  });
})();
