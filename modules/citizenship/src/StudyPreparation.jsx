import { EducationNotice } from "./EducationNotice.jsx";
import { CONVERSATION_TOPICS } from "./conversationFlow.js";
import { safePreparationChecklists, studyGoal } from "../shared/studyPreparation.js";
import { getDailyStudyPlan } from "./brain.js";
import "./StudyPreparation.css";

const STEPS = [
  { id: "official-source", en: "Review the official source and your own notices", es: "Revisar la fuente oficial y tus propios avisos",
    enDetail: "Confirm instructions with the issuing agency and a qualified professional. This guide does not calculate legal deadlines or list required evidence.",
    esDetail: "Confirma las instrucciones con la agencia que emitió el aviso y un profesional autorizado. Esta guía no calcula plazos legales ni determina pruebas requeridas." },
  { id: "own-information", en: "Identify what you can explain and what you do not know", es: "Identificar qué puedes explicar y qué desconoces",
    enDetail: "Use your own confirmed information. It is okay not to remember; do not invent dates or events. Keep private documents outside this guide.",
    esDetail: "Usa tu propia información confirmada. Está bien no recordar; no inventes fechas o eventos. Mantén tus documentos privados fuera de esta guía." },
  { id: "practice-communication", en: "Practice speaking, asking for clarification and taking a break", es: "Practicar hablar, pedir aclaraciones y tomar una pausa",
    enDetail: "Choose your language and Sarah or Kevin. You may skip any prompt, correct an answer or use fictional examples.",
    esDetail: "Elige tu idioma y Sarah o Kevin. Puedes omitir cualquier pregunta, corregir una respuesta o usar ejemplos ficticios." },
  { id: "professional-questions", en: "Prepare questions for an authorized professional", es: "Preparar preguntas para un profesional autorizado",
    enDetail: "Use the worksheet below. A licensed attorney or accredited representative can advise about your circumstances within their authorized scope.",
    esDetail: "Usa la hoja de abajo. Un abogado autorizado o representante acreditado puede orientar sobre tus circunstancias dentro de su autorización." },
  { id: "review-learning", en: "Review what you want to practice next", es: "Revisar qué quieres practicar después",
    enDetail: "Mark only activities you reviewed. These checks are your study notes, not an assessment of eligibility or interview readiness.",
    esDetail: "Marca solo las actividades que repasaste. Estas marcas son notas de estudio, no una evaluación de elegibilidad ni preparación legal para la entrevista." },
];

export function StudyPreparation({ context, language = "en", onUpdate, onLanguageChange, onPractice, onNavigate, onBack, sessionOnly = false }) {
  const es = language === "es";
  const t = (en, spanish) => es ? spanish : en;
  const goal = studyGoal(context.preferences?.studyGoal);
  const checklists = safePreparationChecklists(context.preferences?.preparationChecklists);
  const checked = checklists[goal];
  const plan = getDailyStudyPlan(context);
  const budget = context.preferences.availableStudyMinutes;
  const budgets = [...new Set([5, 8, 10, 15, 30, budget])].sort((a, b) => a - b);
  const questions = es ? [
    "¿Cómo puedo verificar tus credenciales y el alcance de tu autorización?",
    "¿Qué información necesitas revisar para orientarme sobre mi caso?",
    "¿Qué instrucciones y fechas de mis avisos debo confirmar contigo?",
    "¿Qué dudas sobre formularios, requisitos o evidencia debo revisar con un profesional?",
    "¿Cómo puedo prepararme si no entiendo una pregunta o necesito asistencia de idioma?",
  ] : [
    "How can I verify your credentials and the scope of your authorization?",
    "What information do you need to review to advise about my case?",
    "Which instructions and dates in my notices should I confirm with you?",
    "Which questions about forms, requirements or evidence should I review with a professional?",
    "How can I prepare if I do not understand a question or need language assistance?",
  ];
  const toggle = id => {
    const next = checked.includes(id) ? checked.filter(item => item !== id) : [...checked, id];
    onUpdate({ preferences: { preparationChecklists: { ...checklists, [goal]: next } } });
  };
  return <div className="app study-preparation">
    <header className="practice-header study-no-print">
      <button className="back-button" onClick={onBack}>← {t("Back", "Volver")}</button>
      <div className="practice-brand">IMMIGRATION <span>AI</span></div>
    </header>
    <main className="study-preparation-content">
      <h1>{t("My preparation guide", "Mi guía de preparación")}</h1>
      <p>{t("Choose what you want to study. A short plan helps you practice communication and organize questions for professional help.", "Elige qué quieres estudiar. Un plan corto te ayuda a practicar cómo expresarte y organizar preguntas para pedir ayuda profesional.")}</p>
      <EducationNotice language={language} compact />
      <section className="study-choices study-no-print" aria-label={t("Study preferences", "Preferencias de estudio")}>
        <label>{t("My study goal", "Mi objetivo de estudio")}<select aria-label={t("My study goal", "Mi objetivo de estudio")} value={goal} onChange={event => onUpdate({ preferences: { studyGoal: event.target.value } })}>
          {Object.entries(CONVERSATION_TOPICS).map(([key, topic]) => <option key={key} value={key}>{topic.label[es ? 1 : 0]}</option>)}
        </select></label>
        <label>{t("My language", "Mi idioma")}<select aria-label={t("My language", "Mi idioma")} value={language} onChange={event => onLanguageChange(event.target.value)}><option value="es">Español</option><option value="en">English</option></select></label>
        <label>{t("Study time today", "Tiempo de estudio de hoy")}<select aria-label={t("Study time today", "Tiempo de estudio de hoy")} value={budget} onChange={event => onUpdate({ preferences: { availableStudyMinutes: Number(event.target.value) } })}>
          {budgets.map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}
        </select></label>
      </section>
      <p className="study-goal-summary">{CONVERSATION_TOPICS[goal].label[es ? 1 : 0]} · {language === "es" ? "Español" : "English"} · {budget} min</p>
      <p role="status">{sessionOnly ? t("Your browser could not save these preferences. They last only for this session.", "Tu navegador no pudo guardar estas preferencias. Solo duran durante esta sesión.") : t("Your study goal and checklist are saved on this device for this account. No case narrative is stored here.", "Tu objetivo y lista de estudio se guardan en este dispositivo para esta cuenta. Aquí no se guarda un relato del caso.")}</p>
      {goal === "asylum" && <p className="study-care-note">{t("You do not need to describe traumatic events to practice. You may use a simple fictional example, pause or skip.", "No necesitas describir eventos traumáticos para practicar. Puedes usar un ejemplo ficticio sencillo, pausar u omitir.")}</p>}
      {goal === "citizenship" && <p>{t("Civics uses the official study bank. English practice is available; choosing Spanish support does not change official interview requirements.", "Civismo usa el banco oficial de estudio. Puedes practicar inglés; elegir apoyo en español no cambia los requisitos oficiales de la entrevista.")}</p>}
      <section className="study-card">
        <h2>{t("Today's study plan", "Mi plan de estudio de hoy")}</h2>
        <p>{t("Suggested time for study, not a filing or appointment schedule.", "Tiempo sugerido de estudio; no es un calendario de presentación ni de citas.")}</p>
        <ol className="study-task-list">{plan.items.map(item => <li key={item.id}>
          <div><strong>{item.label}</strong><span>{item.minutes} min</span></div><p>{item.detail}</p>
          <button className="primary-button study-no-print" onClick={() => onPractice(item)}>{t("Start this activity", "Comenzar esta actividad")}</button>
        </li>)}</ol>
        <button className="secondary-button study-no-print" onClick={() => onPractice({ module: "coach" })}>{t("Talk with Sarah or Kevin", "Conversar con Sarah o Kevin")}</button>
      </section>
      <section className="study-card">
        <h2>{t("My study checklist", "Mi lista de estudio")}</h2>
        <p>{checked.length} / {STEPS.length} {t("activities reviewed by you", "actividades revisadas por ti")}</p>
        <p>{t("Checking a box does not mean your legal case is ready or eligible.", "Marcar una casilla no significa que tu caso legal esté listo ni que seas elegible.")}</p>
        {STEPS.map(step => <label className="study-check-item" key={step.id}>
          <input type="checkbox" checked={checked.includes(step.id)} onChange={() => toggle(step.id)} />
          <span><strong>{es ? step.es : step.en}</strong><small>{es ? step.esDetail : step.enDetail}</small></span>
        </label>)}
      </section>
      <section className="study-card study-professional-worksheet">
        <h2>{t("Questions to take to a professional", "Preguntas para llevar a un profesional")}</h2>
        <p>{t("Print this blank worksheet or note your questions privately. The app does not record your answers to these questions.", "Imprime esta hoja en blanco o anota tus preguntas en privado. La app no registra tus respuestas a estas preguntas.")}</p>
        <ol>{questions.map(question => <li key={question}><p>{question}</p><div className="study-writing-lines" aria-hidden="true" /></li>)}</ol>
        <div className="study-actions study-no-print"><button className="primary-button" onClick={() => window.print()}>{t("Print my preparation guide", "Imprimir mi guía de preparación")}</button><button className="secondary-button" onClick={() => onNavigate("immigrationHelp")}>{t("Official resources and professional help", "Recursos oficiales y ayuda profesional")}</button></div>
      </section>
    </main>
  </div>;
}
