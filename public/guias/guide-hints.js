/* Explain existing guide annotations without collecting data or changing the route. */
(function () {
  const tooltip = document.createElement('div');
  tooltip.id = 'guide-zone-tooltip';
  tooltip.className = 'guide-zone-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.append(tooltip);
  let active = null;
  let pinned = false;
  function close() {
    if (active) active.removeAttribute('aria-describedby');
    active = null;
    pinned = false;
    tooltip.hidden = true;
  }
  function show(target, pin = false) {
    if (!target) return;
    if (active !== target) close();
    active = target;
    pinned = pin;
    tooltip.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = target.dataset.guideHintTitle;
    const text = document.createElement('p');
    text.textContent = target.dataset.guideHintText;
    tooltip.append(title, text);
    tooltip.hidden = false;
    target.setAttribute('aria-describedby', tooltip.id);
    const rect = target.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, innerWidth - box.width - 8));
    const top = rect.bottom + box.height + 10 < innerHeight
      ? rect.bottom + 8 : Math.max(8, rect.top - box.height - 8);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  function annotate(target, title, text) {
    target.dataset.guideHintTitle = title;
    target.dataset.guideHintText = text;
    target.setAttribute('aria-label', `Explicar: ${title}`);
  }
  function help(figure, wholeScreen = false) {
    const caption = figure.querySelector('figcaption');
    if (!caption || caption.querySelector('.guide-hint-help')) return;
    const text = document.createElement('span');
    text.className = 'guide-hint-help';
    text.textContent = wholeScreen ? 'Pasa el cursor sobre la imagen o tócala para saber qué muestra. También puedes usar el botón de ayuda con Tab y Escape para cerrar.' : 'Pasa el cursor sobre la imagen: cada zona explicada muestra su descripción. En móvil, tócala. No necesitas buscar los números. Usa Tab para recorrer las zonas y Escape para cerrar.';
    caption.append(text);
  }
  function screenHint(figure, title, text) {
    close();
    if (!figure) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'guide-screen-hint';
    button.textContent = 'ⓘ ¿Qué muestra esta pantalla?';
    annotate(button, title, text);
    figure.append(button);
    const image = figure.querySelector('.native-crop') || figure.querySelector('img');
    if (image) annotate(image, title, text);
    help(figure, true);
  }
  const renderForms = renderVisual;
  renderVisual = function () {
    close();
    renderForms();
    const g = visualGuides[visualKey], s = g.slides[visualPage];
    const p = s.spots[visualSpot], c = s.crop;
    const v = visualFocus ? [Math.max(c[0], p[0]-30), Math.max(c[1], p[1]-30), Math.min(c[2], p[2]+60), Math.min(c[3], p[3]+60)] : c;
    const figure = document.querySelector('.real-document');
    const box = figure?.querySelector('.native-crop');
    if (!box) return;
    annotate(box, `${g.form}: ${s.title}`, `Imagen de referencia del formulario, página ${s.page}, edición ${g.edition}. Pasa sobre una zona explicada para identificarla. Consulta la versión vigente antes de presentar.`);
    s.spots.forEach((q, i) => {
      const region = document.createElement('button');
      region.type = 'button';
      region.className = 'guide-zone-region';
      const visible = q[0] < v[0]+v[2] && q[0]+q[2] > v[0] && q[1] < v[1]+v[3] && q[1]+q[3] > v[1];
      region.hidden = !visible;
      region.style.cssText = `left:${(q[0]-v[0])/v[2]*100}%;top:${(q[1]-v[1])/v[3]*100}%;width:${q[2]/v[2]*100}%;height:${q[3]/v[3]*100}%`;
      annotate(region, q[4], q[5]);
      box.append(region);
      const number = box.querySelectorAll('.native-spot')[i];
      if (number) {
        annotate(number, q[4], q[5]);
        const numberVisible = q[0]+15 >= v[0] && q[0]+15 <= v[0]+v[2] && q[1]+15 >= v[1] && q[1]+15 <= v[1]+v[3];
        number.tabIndex = numberVisible ? 0 : -1;
      }
    });
    help(figure);
  };
  const renderEad = renderEadLesson;
  renderEadLesson = function () {
    renderEad();
    const s = eadLessons[eduScreen];
    screenHint(document.querySelector('.screen-frame'), s[2], s[3]);
  };
  const renderPortal = renderFriendlyPortal;
  renderFriendlyPortal = function () {
    renderPortal();
    const s = friendlyPortal[mapProcess][friendlyPortalStep];
    screenHint(document.querySelector('.screen-frame'), s[1], s[2]);
  };
  function target(event) { return event.target.closest?.('[data-guide-hint-title]'); }
  document.addEventListener('pointerover', event => {
    if (event.pointerType !== 'touch' && !pinned) show(target(event));
  });
  document.addEventListener('pointerout', event => {
    if (!pinned && active && !active.contains(event.relatedTarget) && !tooltip.contains(event.relatedTarget)) close();
  });
  document.addEventListener('focusin', event => { const el = target(event); if (el) show(el); });
  document.addEventListener('focusout', event => { if (!pinned && target(event)) close(); });
  document.addEventListener('click', event => {
    const el = target(event);
    if (el) { if (active === el && pinned) close(); else show(el, true); }
    else if (!tooltip.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', close);
  window.addEventListener('scroll', close, true);
  new MutationObserver(() => { if (active && !active.isConnected) close(); }).observe(app, {childList:true});
})();
