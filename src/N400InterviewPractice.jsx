import { useEffect, useRef, useState } from "react";
import sarahImage from "./assets/sarah.png";
import sarahSpeakingImage from "./assets/sarah-speaking.png";
import n400Bank from "./data/n400InterviewBank.json";
import { startAudioRecording, transcribeRecording } from "./audio";
import { speakAppText, stopAppSpeech } from "./speech";
import {
  createN400FollowUpPrompt,
  createN400InterviewState,
  getContextualN400FollowUps,
  parseYesNo,
  recordN400Answer,
  recordN400FollowUpAnswer,
  selectNextN400Question,
} from "./n400InterviewEngine.js";
import {
  emitCompanionState,
  getCompanionVisibility,
  setCompanionSessionVisibility,
} from "./companionEvents.js";

function createInitialFlow() {
  const initialState = createN400InterviewState(n400Bank);
  const selection = selectNextN400Question(n400Bank, initialState);
  return { ...selection, followUpQueue: [] };
}

const SUB_BLOCK_LABELS = {
  IDENTITY: "Identity",
  BIRTH: "Birth information",
  PERMANENT_RESIDENCE: "Permanent residence",
  CURRENT_ADDRESS: "Current address",
  ADDRESS_HISTORY: "Address history",
  MARITAL_HISTORY: "Marital history",
  CHILDREN: "Children",
  PARENTS: "Parents",
  EMPLOYMENT_SCHOOL: "Work and school",
  TRAVEL: "Travel history",
  CITIZENSHIP_VOTING: "Citizenship and voting",
  TAXES: "Taxes",
  ORGANIZATIONS_IDEOLOGY: "Organizations",
  SECURITY_VIOLENCE: "Security questions",
  PERSECUTION_HARM: "Conduct and harm",
  MILITARY_ARMED_GROUPS: "Military and armed groups",
  CRIMINAL_HISTORY: "Criminal history",
  GOOD_MORAL_CHARACTER: "Good moral character",
  IMMIGRATION_GOVERNMENT: "Immigration history",
  SELECTIVE_SERVICE: "Selective Service",
  MILITARY_SERVICE: "U.S. military service",
  OATH_CONSTITUTION: "Constitution and Oath",
};
const N400_FORM_EDITION = n400Bank.formEdition;

export function N400InterviewPractice({ onExit, onComplete, onRestart }) {
  const [flow, setFlow] = useState(createInitialFlow);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [answer, setAnswer] = useState("");
  const [answerStatus, setAnswerStatus] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [skipped, setSkipped] = useState(0);
  const [interviewer, setInterviewer] = useState("sarah");
  const recorderRef = useRef(null);
  const speechRequestRef = useRef(0);
  const completionReportedRef = useRef(false);
  const initialQuestionRef = useRef(flow.question.english);

  const isKevin = interviewer === "kevin";
  const interviewerName = isKevin ? "Kevin" : "Sarah";
  const reviewedCount = flow.state.askedConceptIDs.length;
  const totalConcepts = n400Bank.questions.length;
  const progress = Math.round((reviewedCount / totalConcepts) * 100);

  const speakQuestion = async (text, onFinished, selectedInterviewer = interviewer) => {
    const requestId = ++speechRequestRef.current;
    const voiceIsKevin = selectedInterviewer === "kevin";
    const finishSpeaking = () => {
      if (requestId !== speechRequestRef.current) return;
      setIsSpeaking(false);
      onFinished?.();
    };
    setIsSpeaking(true);
    await speakAppText(text, {
      profile: voiceIsKevin ? "male" : "female",
      onEnd: finishSpeaking,
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpeaking(true);
      speakAppText(`Welcome. We will review your Form N-400 in two parts. First, I will ask about your personal information. ${initialQuestionRef.current}`, {
        profile: "female",
        onEnd: () => setIsSpeaking(false),
      });
    }, 500);
    return () => {
      clearTimeout(timer);
      stopAppSpeech();
      setCompanionSessionVisibility(getCompanionVisibility());
    };
  }, []);

  useEffect(() => {
    if (!isComplete || completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete?.({ score: null, outcome: "completed" });
    emitCompanionState("celebration", { message: "You completed the N-400 practice review." });
  }, [isComplete, onComplete]);

  const resetQuestionUi = () => {
    setAnswer("");
    setAnswerStatus("");
  };

  const finishInterview = (state) => {
    setFlow({ state, question: null, transition: "", followUpQueue: [] });
    setIsComplete(true);
    setIsSpeaking(true);
    speakQuestion("Thank you. That concludes this Form N-400 practice review.");
  };

  const advanceToNextConcept = (state) => {
    const selection = selectNextN400Question(n400Bank, state);
    if (!selection.question) {
      finishInterview(selection.state);
      return;
    }
    resetQuestionUi();
    setFlow({ ...selection, followUpQueue: [] });
    const script = [selection.transition, selection.question.english].filter(Boolean).join(" ");
    setTimeout(() => speakQuestion(script), 250);
  };

  const continueFollowUps = (state, currentFlow) => {
    const [nextFollowUp, ...remaining] = currentFlow.followUpQueue;
    if (!nextFollowUp) {
      advanceToNextConcept(state);
      return;
    }
    resetQuestionUi();
    setFlow({ ...currentFlow, state, question: nextFollowUp, followUpQueue: remaining });
    setTimeout(() => speakQuestion(nextFollowUp.english), 250);
  };

  const acceptResponse = (transcript) => {
    const activeQuestion = flow.question;
    if (!activeQuestion) return;

    if (activeQuestion.kind === "concept" && activeQuestion.answerType === "yes_no" && parseYesNo(transcript) === null) {
      setAnswer(transcript);
      setAnswerStatus("incomplete");
      emitCompanionState("support", { message: "Take your time. Answer yes or no." });
      speakQuestion(`Please answer yes or no. ${activeQuestion.english}`);
      return;
    }

    setAnswer(transcript);
    setAnswerStatus("recorded");
    emitCompanionState("progress", { message: "Response recorded. Keep going." });

    if (activeQuestion.kind === "followup") {
      const state = recordN400FollowUpAnswer(flow.state, activeQuestion, transcript);
      continueFollowUps(state, flow);
      return;
    }

    const state = recordN400Answer(flow.state, activeQuestion, transcript);
    const followUps = getContextualN400FollowUps(activeQuestion, transcript)
      .map((text, index) => createN400FollowUpPrompt(activeQuestion, text, index + 1));
    if (followUps.length) {
      const [first, ...remaining] = followUps;
      resetQuestionUi();
      setFlow({ state, question: first, transition: "", followUpQueue: remaining });
      setTimeout(() => speakQuestion(`Thank you. ${first.english}`), 250);
      return;
    }
    advanceToNextConcept(state);
  };

  const startListening = async () => {
    try {
      recorderRef.current = await startAudioRecording();
      setIsListening(true);
      setIsSpeaking(false);
      setAnswerStatus("");
      emitCompanionState("thinking", { message: "I'm listening. Take your time." });
    } catch (error) {
      console.error("Microphone error:", error);
      setAnswerStatus("error");
    }
  };

  const stopListening = async () => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setIsListening(false);
    if (!recorder) return;
    try {
      const transcript = await transcribeRecording(await recorder.stop());
      if (!transcript) throw new Error("No speech was detected.");
      acceptResponse(transcript);
    } catch (error) {
      console.error("N-400 transcription error:", error);
      setAnswerStatus("error");
    }
  };

  const skipQuestion = () => {
    const activeQuestion = flow.question;
    if (!activeQuestion) return;
    setSkipped((count) => count + 1);
    if (activeQuestion.kind === "followup") {
      continueFollowUps(recordN400FollowUpAnswer(flow.state, activeQuestion, ""), flow);
      return;
    }
    advanceToNextConcept(recordN400Answer(flow.state, activeQuestion, ""));
  };

  if (isComplete) {
    return (
      <div className="interview-screen">
        <div className="results-card n400-results-card">
          <div className="results-eyebrow">FORM N-400 · EDITION {N400_FORM_EDITION}</div>
          <h1>Practice Review Complete</h1>
          <div className="n400-results-total"><strong>{reviewedCount}</strong><span>concepts reviewed</span></div>
          <p className="results-message">Your responses were recorded for this practice session without deciding eligibility or providing legal conclusions.</p>
          <div className="results-stats">
            <div className="result-stat correct"><span>✓</span><strong>{reviewedCount}</strong><small>Reviewed</small></div>
            <div className="result-stat incorrect"><span>—</span><strong>{skipped}</strong><small>Skipped</small></div>
          </div>
          <button className="results-focus-button" onClick={onRestart}>PRACTICE N-400 AGAIN</button>
          <button className="results-secondary-button" onClick={onExit}>BACK TO HOME</button>
        </div>
      </div>
    );
  }

  const question = flow.question;
  return (
    <div className={`interview-screen live-interview-screen interviewer-${interviewer} ${isSpeaking ? "sarah-speaking-live" : isListening ? "sarah-listening-live" : "sarah-waiting-live"}`}>
      <header className="interview-header">
        <button className="back-button interview-exit-button" onClick={onExit} aria-label="Exit N-400 practice"><span aria-hidden="true">×</span></button>
        <div className="interview-brand"><strong>CITIZENSHIP <span>AI</span></strong><small>INTERACTIVE N-400 PRACTICE</small></div>
        <button className="more-button interview-repeat-button" onClick={() => speakQuestion(question.english)} aria-label={`Repeat ${interviewerName}'s question`} title="Repeat question">↻</button>
      </header>

      <main className="interview-content">
        <section className="sarah-live-stage" aria-label={`${interviewerName}, AI practice interviewer`}>
          <div className="live-stage-media" aria-hidden="true">
            <div className={`live-stage-motion-frame sarah-video-frame ${isKevin ? "kevin-motion-frame" : ""}`}>
              {isKevin ? <><video src="/kevin-listening.mp4" className="live-sarah-video live-sarah-resting" autoPlay muted loop playsInline /><video src="/kevin-speaking.mp4" className="live-sarah-video live-sarah-speaking" autoPlay muted loop playsInline /></> : <><video src="/sarah-listening.mp4" poster={sarahImage} className="live-sarah-video live-sarah-resting" autoPlay muted loop playsInline /><video src="/sarah-speaking.mp4" poster={sarahSpeakingImage} className="live-sarah-video live-sarah-speaking" autoPlay muted loop playsInline /></>}
            </div>
            <div className="live-stage-mask"></div>
          </div>

          <div className="live-stage-topbar">
            <div className="live-agent-badge"><span className="live-dot"></span><div><strong>{interviewerName} AI</strong><small>Practice interviewer</small></div></div>
            <div className="live-interviewer-selector" role="group" aria-label="Choose your interview officer">
              <button type="button" className={!isKevin ? "active" : ""} aria-pressed={!isKevin} onClick={() => { setInterviewer("sarah"); speakQuestion(question.english, undefined, "sarah"); }}>Sarah</button>
              <button type="button" className={isKevin ? "active" : ""} aria-pressed={isKevin} onClick={() => { setInterviewer("kevin"); speakQuestion(question.english, undefined, "kevin"); }}>Kevin</button>
            </div>
            <span className="live-practice-badge">FORM {N400_FORM_EDITION}</span>
          </div>

          <div className="live-stage-presence"><span>N-400 INTERVIEW PRACTICE</span><strong>{interviewerName}</strong><small>{isSpeaking ? "Speaking with you" : isListening ? "Listening to your answer" : "Ready for your response"}</small></div>

          <section className="live-question-card n400-question-card" aria-live="polite">
            <div className="live-question-header">
              <div className="ai-turn-indicator"><span className="live-sound-icon">⌁</span>{isSpeaking ? `${interviewerName.toUpperCase()} IS SPEAKING` : isListening ? `${interviewerName.toUpperCase()} IS LISTENING` : "YOUR TURN"}</div>
              <span>{flow.state.currentBlock} · {SUB_BLOCK_LABELS[flow.state.currentSubBlock] || flow.state.currentSubBlock}</span>
            </div>
            <h2 className="question">{question.english}</h2>
            <div className="n400-session-progress" aria-label={`${reviewedCount} of ${totalConcepts} concepts reviewed`}><span style={{ width: `${progress}%` }}></span></div>
            <small className="n400-progress-label">{reviewedCount} concepts reviewed · {question.kind === "followup" ? "Contextual follow-up" : "One wording per concept"}</small>
          </section>

          <div className="live-voice-status" aria-live="polite"><div className="live-voice-bars" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index}></span>)}</div><span>{isSpeaking ? `${interviewerName} is speaking…` : isListening ? "Listening… tap again when you finish" : "Tap the microphone when you are ready"}</span></div>
        </section>

        <section className="live-answer-feedback" aria-live="polite">
          {answer && <div className={`answer-preview ${answerStatus}`}><span>YOUR INPUT</span><p>{answer}</p><div className="answer-result">{answerStatus === "recorded" && "✓ Response recorded"}{answerStatus === "incomplete" && "Please answer yes or no"}{answerStatus === "error" && "Recording error — please try again"}</div></div>}
        </section>

        <section className="live-interview-controls" aria-label="Interview controls">
          <button className={`premium-action-button live-mic-button ${isListening ? "listening" : ""}`} onClick={isListening ? stopListening : startListening} disabled={isSpeaking} aria-label={isListening ? "Stop recording answer" : "Start recording answer"}>
            <span className="premium-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="13" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg></span>
            <span className="premium-action-copy"><small>{isListening ? "RECORDING" : "YOUR TURN"}</small><strong>{isListening ? "Finish answer" : "Answer"}</strong></span>
            <span className="premium-action-arrow" aria-hidden="true">{isListening ? "■" : "→"}</span>
          </button>
          <button className="premium-action-button live-skip-button" onClick={skipQuestion} disabled={isSpeaking || isListening}>
            <span className="premium-action-icon" aria-hidden="true">?</span><span className="premium-action-copy"><small>NOT SURE</small><strong>Skip this question</strong></span><span className="premium-action-arrow" aria-hidden="true">→</span>
          </button>
          <div className="live-score-summary n400-session-summary" aria-label="N-400 session progress"><span><i className="correct-dot"></i>{reviewedCount} reviewed</span><span><i className="incorrect-dot"></i>{skipped} skipped</span></div>
        </section>
      </main>
    </div>
  );
}
