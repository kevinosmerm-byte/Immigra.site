import { useProgressGate } from "./progressGateContext.js";
import { useEffect, useMemo, useState } from "react";
import { getModuleProgress, saveModuleProgress } from "./progress.js";
import { resolveCivicsQuestion } from "./dynamicCivicsData.js";
import { civicsQuestionBank } from "./civicsQuestionBank.js";
import {
  buildAnswerChoices, buildQuizQuestionModels, createQuizSession, evaluateQuizResponse,
  getQuizProgress, QUIZ_LEVELS, recordQuizAttempt, summarizeQuizProgress,
} from "./quizLearning.js";
import { emitCompanionResult, emitCompanionState } from "./companionEvents.js";

const COPY = {
  en: {
    back: "128 Questions", eyebrow: "ADAPTIVE CIVICS QUIZ", title: "Build mastery step by step.",
    intro: "Move from key words to independent recall. Every official acceptable answer remains valid.",
    progress: "Your progress", practiced: "questions practiced", mastered: "questions mastered", recommended: "Recommended next",
    quick: "Quick challenge · 10 questions", question: "Question", continue: "Continue",
    check: "Check answer", placeholder: "Type any official acceptable answer…", correct: "Correct",
    incorrect: "That answer does not match an official answer.", compare: "Compare your answer with the official USCIS answers.", review: "Review this one", incomplete: "Add the remaining official answer.", preferred: "Recommended answer to memorize",
    accepted: "Other official acceptable answers", dynamic: "This answer changes. Verify the current official answer before practicing.",
    finish: "Session complete", finishBody: "Your per-question progress has been saved.", path: "Return to learning path",
    modes: {
      vocabulary: ["Vocabulary", "Learn the words"], choose: ["Choose", "Recognize the answer"],
      connect: ["Connect", "Match the concepts"], recall: ["Recall", "Answer without choices"],
      challenge: ["Challenge", "Test independent mastery"],
    },
    category: { principles: "Principles", government: "Government", rights: "Rights", history: "History", symbols: "Symbols" },
  },
  es: {
    back: "128 Preguntas", eyebrow: "QUIZ CÍVICO ADAPTATIVO", title: "Domina cada paso.",
    intro: "Avanza desde palabras clave hasta recordar sin ayuda. Todas las respuestas oficiales aceptables siguen siendo válidas.",
    progress: "Tu progreso", practiced: "preguntas practicadas", mastered: "preguntas dominadas", recommended: "Siguiente recomendado",
    quick: "Desafío rápido · 10 preguntas", question: "Pregunta", continue: "Continuar",
    check: "Comprobar respuesta", placeholder: "Escribe cualquier respuesta oficial aceptable…", correct: "Correcto",
    incorrect: "Esa respuesta no coincide con una respuesta oficial.", compare: "Compara tu respuesta con las respuestas oficiales de USCIS.", review: "Repasa esta pregunta", incomplete: "Agrega la respuesta oficial que falta.", preferred: "Respuesta recomendada para memorizar",
    accepted: "Otras respuestas oficiales aceptables", dynamic: "Esta respuesta cambia. Verifica la respuesta oficial actual antes de practicar.",
    finish: "Sesión completada", finishBody: "Tu progreso por pregunta quedó guardado.", path: "Volver a la ruta de aprendizaje",
    modes: {
      vocabulary: ["Vocabulario", "Aprende las palabras"], choose: ["Elegir", "Reconoce la respuesta"],
      connect: ["Conectar", "Relaciona los conceptos"], recall: ["Recordar", "Responde sin opciones"],
      challenge: ["Desafío", "Demuestra dominio independiente"],
    },
    category: { principles: "Principios", government: "Gobierno", rights: "Derechos", history: "Historia", symbols: "Símbolos" },
  },
};


export default function QuizLearningPath({ language = "en", userKey = "guest", initialMode = null, preferredQuestionIds = [], sessionSize = 10, checkpointModule = null, civicProfile, onBack, onPracticeComplete, onQuestionResult }) {
  const QUESTIONS = useMemo(() => buildQuizQuestionModels(civicsQuestionBank.map(question => resolveCivicsQuestion(question, { profile: civicProfile }))), [civicProfile]);
  const copy = COPY[language === "es" ? "es" : "en"];
  const [progress, setProgress] = useState(() => getQuizProgress(userKey));
  const { runTransition } = useProgressGate();
  const moduleKey = ["quiz", "vocabulary", "choose", "connect"].includes(checkpointModule) ? checkpointModule : ["vocabulary", "choose", "connect"].includes(initialMode) ? initialMode : "quiz";
  const [checkpoint] = useState(() => {
    const saved = getModuleProgress(userKey)[moduleKey];
    return saved && !saved.isComplete && saved.mode && saved.questionIds.length && saved.questionIds.every(id => QUESTIONS.some(q => q.questionId === id && (saved.mode === "vocabulary" || q.acceptedAnswers.length))) ? saved : null;
  });
  const [mode, setMode] = useState(checkpoint?.mode || initialMode);
  const [session, setSession] = useState(() => checkpoint ? checkpoint.questionIds.map(id => QUESTIONS.find(q => q.questionId === id)) : initialMode ? createQuizSession(QUESTIONS, progress, initialMode, sessionSize, undefined, preferredQuestionIds) : []);
  const [questionIndex, setQuestionIndex] = useState(checkpoint?.questionIndex || 0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(checkpoint?.resultStatus ? { status: checkpoint.resultStatus } : null);
  const [sessionScore, setSessionScore] = useState(checkpoint?.score || 0);
  useEffect(() => {
    if (!mode || !session.length) return;
    saveModuleProgress(moduleKey, { completed: mode === "complete" ? session.length : questionIndex, total: session.length, questionIndex, questionIds: session.map(q => q.questionId), mode, score: sessionScore, resultStatus: result?.status }, userKey);
  }, [moduleKey, mode, session, questionIndex, userKey, sessionScore, result?.status]);
  const summary = useMemo(() => summarizeQuizProgress(progress, QUESTIONS.length), [progress, QUESTIONS.length]);
  const question = session[questionIndex];

  const startMode = (nextMode) => {
    setMode(nextMode);
    setSession(createQuizSession(QUESTIONS, progress, nextMode, sessionSize, undefined, preferredQuestionIds));
    setQuestionIndex(0); setAnswer(""); setResult(null); setSessionScore(0);
    emitCompanionState(nextMode === "vocabulary" ? "explain" : "determined");
  };

  const saveAttempt = (correct, score, helpUsed = []) => {
    const next = recordQuizAttempt({ userKey, question, mode, correct, score, helpUsed });
    setProgress(next);
    if (mode !== "vocabulary") onQuestionResult?.(question.questionId, correct);
    if (correct) setSessionScore((value) => value + 1);
  };

  const nextQuestion = (scoreOverride = sessionScore) => runTransition({ module: moduleKey, completed: questionIndex + 1, total: session.length }, () => {
    if (questionIndex + 1 >= session.length) {
      onPracticeComplete?.({ score: session.length ? Math.round((scoreOverride / session.length) * 100) : 0, outcome: mode });
      emitCompanionState("celebration");
      setMode("complete");
      return;
    }
    setQuestionIndex((value) => value + 1); setAnswer(""); setResult(null);
  });

  if (!mode) {
    return (
      <div className="quiz-path-screen">
        <header className="practice-header quiz-path-header">
          <button className="back-button" onClick={onBack}>← {copy.back}</button>
          
        </header>
        <main className="quiz-path-content">
          <section className="quiz-path-intro">
            <span>{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.intro}</p>
          </section>
          <section className="quiz-path-progress liquid-glass" aria-label={copy.progress}>
            <div><span>{copy.progress}</span><strong>{summary.attempted} / 128</strong><small>{copy.practiced} · {summary.mastered} {copy.mastered}</small></div>
            <div className="quiz-path-progress-ring" style={{ "--quiz-progress": `${summary.attemptedPercent * 3.6}deg` }}><b>{summary.attemptedPercent}%</b></div>
          </section>
          <div className="quiz-level-list">
            {QUIZ_LEVELS.map((level) => {
              const labels = copy.modes[level.id];
              const recommended = summary.recommended === level.id;
              return (
                <button key={level.id} className={`quiz-level-card liquid-glass${recommended ? " recommended" : ""}`} onClick={() => startMode(level.id)}>
                  <span className="quiz-level-icon">{level.icon}</span>
                  <span className="quiz-level-copy"><small>{language === "es" ? "NIVEL" : "LEVEL"} {level.level}</small><strong>{labels[0]}</strong><em>{labels[1]}</em></span>
                  <span className="quiz-level-state">{recommended ? copy.recommended : `${summary.averages[level.id]}%`}<b>→</b></span>
                </button>
              );
            })}
          </div>
          <button className="quiz-quick-button" onClick={() => startMode("challenge")}>{copy.quick}<span>→</span></button>
        </main>
      </div>
    );
  }

  if (mode === "complete") {
    return (
      <div className="quiz-path-screen"><main className="quiz-path-complete">
        <div className="quiz-complete-mark">✓</div><span>{copy.eyebrow}</span><h1>{copy.finish}</h1>
        <strong>{sessionScore} / {session.length}</strong><p>{copy.finishBody}</p>
        <button onClick={() => setMode(null)}>{copy.path}</button>
      </main></div>
    );
  }

  const labels = copy.modes[mode];
  const choices = mode === "choose" || mode === "connect" ? buildAnswerChoices(question, QUESTIONS) : [];
  const submitAnswer = (value, helpUsed = []) => {
    if (!String(value || "").trim() || result) return;
    const evaluation = evaluateQuizResponse(question, value);
    const correct = evaluation.status === "correct";
    const score = correct ? 100 : evaluation.status === "incomplete" || evaluation.status === "review" ? 50 : 0;
    setAnswer(value); setResult(evaluation); saveAttempt(correct, score, helpUsed);
    emitCompanionResult(correct, { message: correct ? copy.correct : copy.review });
  };

  return (
    <div className="quiz-path-screen">
      <header className="practice-header quiz-session-header">
        <button className="back-button" onClick={() => setMode(null)}>← {copy.path}</button>
        <div className="quiz-session-title"><span>{labels[0]}</span><small>{questionIndex + 1} / {session.length}</small></div>
      </header>
      <div className="quiz-session-track"><i style={{ width: `${((questionIndex + 1) / session.length) * 100}%` }} /></div>
      <main className="quiz-session-content">
        <section className="quiz-question-card liquid-glass">
          <div className="quiz-question-meta"><span>{copy.category[question.category]}</span><em>#{question.questionId}</em></div>
          {mode === "vocabulary" ? (
            <>
              <h1>{labels[1]}</h1><p className="quiz-context-question">{question.question}</p>
              <div className="quiz-vocabulary-grid">{question.vocabulary.map((item) => <div key={item.word}><strong>{item.word}</strong>{item.translation && <span>{item.translation}</span>}</div>)}</div>
              <div className="quiz-preferred-answer"><small>{copy.preferred}</small><strong>{question.preferredAnswer || copy.dynamic}</strong></div>
              <button className="quiz-primary-action" onClick={() => {
                const completedScore = sessionScore + 1;
                saveAttempt(true, 100, ["vocabulary"]);
                emitCompanionResult(true);
                nextQuestion(completedScore);
              }}>{copy.continue}</button>
            </>
          ) : (
            <>
              <small className="quiz-question-label">{copy.question}</small><h1>{question.question}</h1>
              <p className="quiz-question-spanish">{question.questionSpanish}</p>
              {(mode === "choose" || mode === "connect") && <div className={`quiz-choice-list ${mode}`}>
                {choices.map((choice, index) => <button key={choice} disabled={Boolean(result)} className={answer === choice ? (result?.status === "correct" ? "correct" : "incorrect") : ""} onClick={() => submitAnswer(choice, [mode === "choose" ? "choices" : "matching"])}><span>{mode === "connect" ? "↔" : String.fromCharCode(65 + index)}</span>{choice}</button>)}
              </div>}
              {(mode === "recall" || mode === "challenge") && <>
                <textarea value={answer} disabled={Boolean(result)} onChange={(event) => setAnswer(event.target.value)} placeholder={copy.placeholder} />
                {!result && <button className="quiz-primary-action" disabled={!answer.trim()} onClick={() => submitAnswer(answer)}>{copy.check}</button>}
              </>}
              {result && <QuizFeedback result={result} question={question} copy={copy} onNext={nextQuestion} />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function QuizFeedback({ result, question, copy, onNext }) {
  const correct = result.status === "correct";
  return (
    <div className={`quiz-feedback ${correct ? "correct" : "review"}`} role="status">
      <strong>{correct ? `✓ ${copy.correct}` : copy.review}</strong>
      {!correct && <p>{result.status === "incomplete" ? copy.incomplete : result.status === "review" ? copy.compare : copy.incorrect}</p>}
      <div><small>{copy.preferred}</small><b>{question.preferredAnswer || copy.dynamic}</b></div>
      {question.acceptedAnswers.length > 1 && <details><summary>{copy.accepted}</summary><ul>{question.acceptedAnswers.slice(question.minimumAnswersRequired || 1).map((item) => <li key={item}>{item}</li>)}</ul></details>}
      <button onClick={() => onNext()}>{copy.continue} →</button>
    </div>
  );
}
