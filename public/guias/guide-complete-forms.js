/* Add complete, unfilled reference forms without changing submission or account flows. */
(() => {
  'use strict';
  Object.assign(visualGuides, completeFormGuides);
  const imageWidths = new Map(Object.values(completeFormGuides).flatMap(g => g.slides.map(s => [s.image, s.imageWidth])));
  nativeScreen = function (image, crop, alt) {
    const [x,y,w,h] = crop;
    const width = imageWidths.get(image) || 1363;
    return `<div class="native-crop" style="aspect-ratio:${w}/${h}"><img src="assets/${esc(image)}" alt="${esc(alt)}" decoding="async" style="width:${width/w*100}%;left:${-x/w*100}%;top:${-y/h*100}%"></div>`;
  };
  function addAddressPaperOption() {
    if (mapProcess !== 'address' || !completeFormGuides.addressPaper || document.querySelector('.address-method-options')) return;
    const panel = document.createElement('section'); panel.className = 'card address-method-options';
    const heading = document.createElement('h3'); heading.textContent = 'Cambio de dirección: en línea o en papel';
    const intro = document.createElement('p');
    intro.textContent = 'Para la mayoría de las personas, USCIS recomienda myUSCIS/E-COA. También sirve para casos presentados por correo: incluye cada recibo pendiente que deba actualizarse. El papel no está reservado a expedientes antiguos.';
    const online = document.createElement('a'); online.href = 'https://www.uscis.gov/addresschange'; online.target = '_blank'; online.rel = 'noopener'; online.textContent = 'Consultar cambio en línea y procedimientos actuales de USCIS';
    const note = document.createElement('p');
    note.textContent = 'El AR-11 por correo cumple el aviso de cambio, pero no automatiza la actualización de los sistemas de USCIS. VAWA, visas T/U, I-765V, I-751 por maltrato y otras situaciones tienen indicaciones especiales: revísalas antes de elegir el método.';
    const separate = document.createElement('p'); separate.textContent = 'USPS no actualiza USCIS. Si tu caso está ante una corte de inmigración o la BIA, el aviso a EOIR es separado: EOIR-33/IC o EOIR-33/BIA dentro de cinco días laborables, por cada persona afectada.';
    const eoir = document.createElement('a'); eoir.href = 'https://www.justice.gov/eoir/update-respondent-or-alien-information'; eoir.target = '_blank'; eoir.rel = 'noopener'; eoir.textContent = 'Consultar cambio de dirección ante EOIR';
    const paper = document.createElement('button'); paper.type = 'button'; paper.textContent = 'Ver alternativa en papel: AR-11'; paper.addEventListener('click', () => startVisual('addressPaper'));
    panel.append(heading, intro, online, note, separate, eoir, paper); document.querySelector('#app')?.append(panel);
  }
  const previousMapView = mapView;
  mapView = function () { previousMapView(); addAddressPaperOption(); };
  const previousMapStage = mapStage;
  mapStage = function (index) { previousMapStage(index); if ([0,1,3].includes(index)) addAddressPaperOption(); };
  const previousMethodLesson = eadMethodLesson;
  eadMethodLesson = function () {
    previousMethodLesson();
    const note = document.querySelector('.reference-note');
    if (note) note.textContent = `Puedes explorar todas las páginas del PDF de referencia I-765, edición ${completeFormGuides.ead.edition}. No es una confirmación de la edición aceptada ni una copia para presentar.`;
  };
  const previousRender = renderVisual;
  renderVisual = function () {
    previousRender();
    const g = visualGuides[visualKey];
    const s = g.slides[visualPage];
    const figure = document.querySelector('.real-document');
    const aside = document.querySelector('.visual-explanation');
    if (!figure || !aside) return;
    if (g.instructionsStatus === 'not-supplied') {
      const warning = document.createElement('p'); warning.className = 'reference-note';
      warning.textContent = 'Esta explicación identifica los campos del formulario adjunto. No se aportó el documento separado de instrucciones. Verifica categorías y programas vigentes en USCIS antes de actuar: presentar I-131 no autoriza viajar, entrar ni trabajar.';
      aside.append(warning);
    }
    const advice = s.spots[visualSpot]?.[6];
    if (advice) {
      const guidance = document.createElement('section');
      guidance.className = 'form-instruction-guidance';
      guidance.setAttribute('aria-label', 'Orientación de las instrucciones oficiales');
      const heading = document.createElement('strong');
      heading.textContent = 'Cómo completarlo según las instrucciones';
      const text = document.createElement('p'); text.textContent = advice.addition;
      const citation = document.createElement('a');
      citation.href = g.instructions + '#page=' + advice.instructionPages[0];
      citation.target = '_blank'; citation.rel = 'noopener';
      citation.textContent = `Fuente: instrucciones USCIS ${g.form}, edición ${advice.instructionEdition}, página${advice.instructionPages.length > 1 ? 's' : ''} ${advice.instructionPages.join(', ')}.`;
      const qualification = document.createElement('small');
      qualification.textContent = 'Resumen educativo de la edición de referencia. Comprueba las instrucciones vigentes y si esta condición aplica a tu situación.';
      guidance.append(heading, text, citation, qualification);
      const next = aside.querySelector('.primary');
      if (next) next.before(guidance); else aside.append(guidance);
    }
    const nav = document.createElement('div');
    nav.className = 'form-page-picker';
    const label = document.createElement('label');
    label.htmlFor = 'form-reference-page';
    label.textContent = 'Ir a una página del formulario';
    const select = document.createElement('select');
    select.id = 'form-reference-page';
    for (const [index, slide] of g.slides.entries()) {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `Página ${slide.page} · ${slide.title}`;
      option.selected = index === visualPage;
      select.append(option);
    }
    select.addEventListener('change', () => {
      const next = Number(select.value);
      if (!Number.isInteger(next) || next < 0 || next >= g.slides.length) return;
      visualPage = next; visualSpot = 0; visualFocus = false; renderVisual();
    });
    const hint = document.createElement('p');
    hint.textContent = `${g.slides.length} páginas de referencia en orden. Las secciones condicionales, suplementos y espacios de la autoridad se explican por separado; no todo se completa por todas las personas.`;
    nav.append(label, select, hint);
    if (visualKey === 'family' || visualKey === 'familySupplement') {
      const related = document.createElement('button');
      related.type = 'button';
      related.textContent = visualKey === 'family' ? 'Ver I-130A · Solo para cónyuge beneficiario' : 'Volver a la guía I-130';
      related.addEventListener('click', () => startVisual(visualKey === 'family' ? 'familySupplement' : 'family'));
      nav.append(related);
    }
    document.querySelector('.visual-workspace').before(nav);
    const readyKey = 'ready-form-' + visualKey;
    const notice = aside.querySelector('.capture-required');
    if (notice) {
      const reopen = document.createElement('button');
      reopen.type = 'button';
      reopen.className = 'form-ready-reopen';
      reopen.textContent = `Ver aviso del formulario ${g.form}`;
      const syncReady = () => { notice.hidden = !!saved[readyKey]; reopen.hidden = !saved[readyKey]; };
      reopen.addEventListener('click', () => { saved[readyKey] = false; persist(); renderVisual(); });
      notice.querySelector('input[type="checkbox"]')?.addEventListener('change', event => {
        saved[readyKey] = event.target.checked; persist(); syncReady();
      });
      notice.before(reopen);
      syncReady();
    }
    const sources = aside.querySelector('details');
    if (sources && completeFormGuides[visualKey]) {
      sources.replaceChildren();
      const summary = document.createElement('summary'); summary.textContent = 'Edición de referencia e instrucciones';
      const explanation = document.createElement('p');
      explanation.textContent = `Estas imágenes se renderizaron del PDF en blanco aportado para la guía, edición ${g.edition}. No son capturas de tu cuenta ni certifican que esta edición siga aceptándose. Consulta USCIS antes de preparar o presentar. Las explicaciones cubren zonas destacadas, no sustituyen las instrucciones completas.`;
      const official = document.createElement('a'); official.href = g.official; official.target = '_blank'; official.rel = 'noopener'; official.textContent = 'Verificar edición aceptada en USCIS';
      const instructions = document.createElement('a'); instructions.href = g.instructions; instructions.target = '_blank'; instructions.rel = 'noopener'; instructions.textContent = 'Leer instrucciones oficiales';
      sources.append(summary, explanation, official, document.createElement('br'), instructions);
    }
    figure.querySelector('img')?.addEventListener('error', () => {
      if (figure.querySelector('.image-error')) return;
      const error = document.createElement('p'); error.className = 'image-error'; error.setAttribute('role','alert');
      error.textContent = 'No se pudo cargar esta página. Vuelve a intentarlo o consulta el formulario oficial.'; figure.append(error);
    }, {once:true});
  };
})();
