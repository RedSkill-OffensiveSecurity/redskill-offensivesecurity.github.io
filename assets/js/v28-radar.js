(() => {
  'use strict';
  const radar = document.querySelector('.radar');
  if (!radar) return;
  const card = radar.closest('.b');
  const sweep = radar.querySelector('.sweep');
  const target = radar.querySelector('.radar-target');
  const state = card.querySelector('.radar-state');
  const bearing = card.querySelector('.radar-bearing');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const signals = [...radar.querySelectorAll('.blip')].map(element => {
    const style = getComputedStyle(element);
    return {element, x:parseFloat(style.left) / radar.clientWidth - .5, y:parseFloat(style.top) / radar.clientHeight - .5, strength:.35};
  });
  let angle = 0, desired = 0, x = 0, y = 0, tracking = false, visible = true;
  let frame = 0, previous = 0;
  const difference = (a,b) => ((a-b+540)%360+360)%360-180;
  function draw(dt) {
    if (tracking) angle += difference(desired,angle) * (reduced.matches ? 1 : 1-Math.exp(-8*dt));
    else if (!reduced.matches) angle += dt*42;
    angle = (angle+360)%360;
    sweep.style.transform = `rotate(${angle}deg)`;
    bearing.textContent = `${Math.round(angle)%360}`.padStart(3,'0')+'°';
    for (const signal of signals) {
      const direction = (Math.atan2(signal.x,-signal.y)*180/Math.PI+360)%360;
      const near = tracking && Math.hypot(x-signal.x,y-signal.y)<.12;
      const scanned = Math.abs(difference(direction,angle))<9;
      signal.strength = near || scanned ? 1 : Math.max(.28,signal.strength-dt*.55);
      signal.element.style.setProperty('--signal',signal.strength.toFixed(3));
      signal.element.classList.toggle('is-near',near);
    }
  }
  function tick(time) {
    const dt = previous ? Math.min((time-previous)/1000,.05) : 1/60;
    previous = time;
    draw(dt);
    frame = requestAnimationFrame(tick);
  }
  function playback() {
    cancelAnimationFrame(frame); previous = 0;
    if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    else draw(0);
  }
  function aim(nx,ny) {
    const length = Math.hypot(nx,ny);
    const factor = length>.43 ? .43/length : 1;
    x=nx*factor; y=ny*factor;
    desired=(Math.atan2(x,-y)*180/Math.PI+360)%360;
    tracking=true; radar.classList.add('is-tracking');
    target.style.left=`${(x+.5)*100}%`; target.style.top=`${(y+.5)*100}%`;
    state.textContent='EXPLORANDO A SUPERFÍCIE';
    if(reduced.matches) draw(0);
  }
  function reset(){tracking=false;radar.classList.remove('is-tracking');state.textContent='VARREDURA ATIVA';if(reduced.matches)draw(0);}
  card.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    const rect=radar.getBoundingClientRect();
    aim((event.clientX-rect.left)/rect.width-.5,(event.clientY-rect.top)/rect.height-.5);
  },{passive:true});
  card.addEventListener('pointerleave',reset);
  card.addEventListener('pointercancel',reset);
  radar.addEventListener('focus',()=>aim(.2,-.2));
  radar.addEventListener('blur',reset);
  radar.addEventListener('keydown',event=>{
    const steps={ArrowLeft:[-.06,0],ArrowRight:[.06,0],ArrowUp:[0,-.06],ArrowDown:[0,.06]};
    if(event.key==='Escape'){reset();return;}
    if(!steps[event.key])return;
    event.preventDefault();const [dx,dy]=steps[event.key];aim(x+dx,y+dy);
  });
  if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;playback();},{threshold:.01}).observe(radar);
  document.addEventListener('visibilitychange',playback);
  reduced.addEventListener('change',playback);
  playback();
})();
