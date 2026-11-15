const card = document.querySelector('[data-starter-card]');
if (card) {
  const es = document.documentElement.lang === 'es';
  const choices = card.querySelector('.starter-choices');
  const feedback = card.querySelector('[role="status"]');
  const next = card.querySelector('.starter-next');
  choices.hidden = false;
  document.querySelector('a[href="#first-question"]')?.addEventListener('click', event => {
    event.preventDefault();
    card.scrollIntoView({block: 'center'});
    choices.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  });

  choices.addEventListener('click', event => {
    const button = event.target.closest('button[data-choice]');
    if (!button || !next.hidden) return;
    const index = Number(card.dataset.correct);
    const correctButton = choices.querySelector('[data-choice="' + index + '"]');
    const correct = button === correctButton;
    correctButton.dataset.result = 'correct';
    if (!correct) button.dataset.result = 'review';
    for (const option of choices.children) option.disabled = true;
    const lead = correct ? (es ? '¡Correcto!' : 'Correct!') : (es ? 'Para repasar.' : 'Worth reviewing.');
    feedback.textContent = lead + ' ' + (es ? 'Respuesta en inglés: ' : 'Answer: ') + card.dataset.answer;
    try { localStorage.setItem('immigra.civics.sample.v1', JSON.stringify({review: !correct, time: Date.now()})); } catch {}
    next.hidden = false;
    next.querySelector('a').focus();
    document.dispatchEvent(new Event('immigra:sample-completed'));
  });
}
