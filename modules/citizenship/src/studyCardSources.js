import official from './data/uscis2025Civics.json' with { type: 'json' };

export const CIVICS_OFFICIAL_PDF = 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf';

// IDs, never filtered deck positions, identify the original USCIS question.
export function civicsCardSource(questionId, language = 'es') {
  const item = official.questions.find(question => question.id === Number(questionId));
  if (!item) return null;
  const es = language === 'es';
  return {
    url: `${CIVICS_OFFICIAL_PDF}#page=${item.page}`,
    label: `USCIS · ${official.source.edition} · ${es ? 'pregunta' : 'question'} ${item.id} · ${es ? 'página' : 'page'} ${item.page}`,
    note: es
      ? 'Pregunta en inglés del banco oficial de 128 (2025). Español: traducción de apoyo no oficial. Las respuestas sobre cargos públicos o tu localidad deben verificarse para tu entrevista.'
      : 'English question from the official 128-question bank (2025). Spanish: unofficial support translation. Answers about officeholders or your location must be checked for your interview.',
  };
}

export function n400CardSource(question, bank, language = 'es') {
  if (!question?.sourceUrl || !question?.page || !question?.item) return null;
  const es = language === 'es';
  const wording = question.isAdaptedForCard
    ? (es ? 'Adaptación de lectura: combina el enunciado y el ítem del formulario.' : 'Reading adaptation: combines the form’s stem and item.')
    : (es ? 'Pregunta en inglés del formulario.' : 'English question from the form.');
  return {
    url: `${question.sourceUrl}#page=${question.page}`,
    label: `USCIS · N-400 (${bank.formEdition}) · ${es ? 'Parte 9, ítem' : 'Part 9, item'} ${question.item} · ${es ? 'página' : 'page'} ${question.page}`,
    note: `${wording} ${es ? 'Español: traducción de apoyo no oficial. Cotejo de texto indexado; verificación visual del PDF pendiente. Consulta la edición vigente.' : 'Spanish: unofficial support translation. Indexed-text comparison; visual PDF verification pending. Check the current edition.'}`,
  };
}

export function n400InterviewSource(question, bank, language = 'es') {
  const es = language === 'es';
  const derived = question?.derivedSource;
  const source = bank.sources.find(item => item.id === (derived?.sourceRef || 'USCIS_N400_2025'));
  if (!source) return null;
  return {
    url: `${source.url}${derived ? '#page=1' : ''}`,
    label: derived ? `USCIS · ${source.title} · ${es ? 'página 1, inglés' : 'page 1, English'}` : `USCIS · N-400 (${bank.formEdition})`,
    note: derived
      ? (es ? 'Pregunta de práctica creada por IMMIGRA a partir de la guía sobre revisión de exactitud del N-400. No es una pregunta textual de USCIS. Fuente cotejada mediante texto oficial indexado.' : 'Practice question authored by IMMIGRA from guidance on reviewing N-400 accuracy. Not a verbatim USCIS question. Source checked through official indexed text.')
      : (es ? 'Práctica de entrevista basada en temas del N-400; redacción y traducción educativas, no preguntas textuales ni un guion oficial. Responde según tus circunstancias reales.' : 'Interview practice based on N-400 topics; educational wording and translation, not verbatim questions or an official script. Answer according to your actual circumstances.'),
  };
}
