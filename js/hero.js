(() => {
  const intro = document.querySelector(".hero-intro");
  const mascot = intro?.querySelector("#red-mascot");
  if (!mascot) return;
  // Text remains selectable and links clickable while the artwork follows the pointer.
  for (const type of ["pointermove", "pointerleave", "pointercancel"]) {
    intro.addEventListener(type, event => {
      mascot.dispatchEvent(new PointerEvent(type, {
        clientX:event.clientX, clientY:event.clientY, pointerType:event.pointerType,
      }));
    }, {passive:true});
  }
})();
