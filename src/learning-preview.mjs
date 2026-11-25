import {getCivicsQuestion} from '../modules/citizenship/src/civicsQuestionBank.js';
import {resolveCivicsQuestion} from '../modules/citizenship/src/dynamicCivicsData.js';
// Educational study cards. These are not personal interview answers.
// Civics English wording and answers remain sourced from the versioned USCIS bank.
const glossary = 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/glossary.html';
const lessons = {
  asylum: [
    {
      id:'asylum-approximate-date',
      es:'¿Una fecha aproximada es lo mismo que una fecha inventada?',
      en:'Is an approximate date the same as an invented date?',
      answerEs:'No. Una aproximación refleja lo que sí recuerdas y deja clara la incertidumbre. Inventar un día exacto añade un dato que no conoces. Practica distinguir entre recordar el mes y recordar el día.',
      answerEn:'No. An estimate reflects what you remember and makes the uncertainty clear. Inventing an exact day adds a detail you do not know. Practice distinguishing between remembering the month and remembering the day.',
      kind:'communication',
    },
    {
      id:'asylum-source-of-knowledge',
      es:'¿Qué diferencia hay entre presenciar algo y enterarte después?',
      en:'What is the difference between witnessing something and hearing about it later?',
      answerEs:'Presenciar es observar directamente. Enterarte después significa recibir información de otra persona o fuente. Distinguir ambas cosas ayuda a explicar qué sabes y cómo lo sabes, sin convertir lo que te contaron en algo que viste.',
      answerEn:'Witnessing means observing something directly. Hearing about it later means receiving information from another person or source. Separating the two helps explain what you know and how you know it, without presenting a report as something you saw.',
      kind:'communication',
    },
    {
      id:'asylum-sequence',
      es:'¿Contar más detalles siempre hace más clara una explicación?',
      en:'Do more details always make an explanation clearer?',
      answerEs:'No necesariamente. Una secuencia clara permite entender qué ocurrió primero y qué pasó después. Practica ordenar los hechos que conoces y separar las dudas, sin añadir detalles para llenar vacíos.',
      answerEn:'Not necessarily. A clear sequence helps someone understand what happened first and what happened next. Practice ordering the facts you know and identifying uncertainties, without adding details to fill gaps.',
      kind:'communication',
    },
  ],
  residency: [
    {
      id:'residency-petitioner-beneficiary',
      es:'¿“Petitioner” y “beneficiary” son la misma persona?',
      en:'Do “petitioner” and “beneficiary” mean the same person?',
      answerEs:'Son funciones distintas: el petitioner presenta la petición; el beneficiary es la persona para quien se solicita el beneficio. En una petición familiar, distinguir esos términos ayuda a saber de quién habla cada pregunta.',
      answerEn:'They describe different roles: the petitioner files the petition; the beneficiary is the person for whom the benefit is requested. In a family petition, knowing these terms helps you understand whom a question refers to.',
      kind:'glossary',source:glossary,
    },
    {
      id:'residency-permanent-resident',
      es:'¿Tener una Green Card significa tener ciudadanía estadounidense?',
      en:'Does having a Green Card mean being a U.S. citizen?',
      answerEs:'No. La Green Card acredita la residencia permanente; residencia y ciudadanía son condiciones distintas. Aprender esta diferencia ayuda a comprender el vocabulario de los formularios.',
      answerEn:'No. A Green Card documents permanent residence; permanent residence and citizenship are different statuses. Knowing the difference helps you understand the language used in forms.',
      kind:'glossary',source:glossary,
    },
    {
      id:'residency-document-dates',
      es:'¿“Date of issue” y “expiration date” indican lo mismo?',
      en:'Do “date of issue” and “expiration date” mean the same thing?',
      answerEs:'No. Date of issue es la fecha de emisión; expiration date es la fecha de vencimiento. Lee la etiqueta completa antes de copiar una fecha. Este ejercicio explica vocabulario, no determina tu estatus migratorio.',
      answerEn:'No. Date of issue means the date a document was issued; expiration date means its stated end date. Read the full label before copying a date. This exercise explains vocabulary, not your immigration status.',
      kind:'vocabulary',
    },
  ],
};

export function learningPreview(category, civics) {
  if (category === 'citizenship') return civics.questions.map(official => {
    const resolved = resolveCivicsQuestion(getCivicsQuestion(official.id));
    const answers = [...(resolved.acceptedAnswers.length ? resolved.acceptedAnswers : official.answers)];
    const answer = answers.join(' · ');
    return {
      id:`civics-${official.id}`, es:official.spanish, en:official.question,
      answers, answerEs:answer, answerEn:answer, answerLanguage:'en', kind:'civics',
      currentAnswerSource:resolved.isDynamic && resolved.acceptedAnswers.length ? resolved.officialSource : null,
      source:'/modules/citizenship/study-guides/uscis-2025-civics-test-study-guide.pdf',
    };
  });
  return (lessons[category] || []).map(lesson => ({...lesson}));
}
