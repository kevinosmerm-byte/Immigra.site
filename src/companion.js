/** CitizenshipAI Companion — framework-independent Web Component. */
const MESSAGES = {
  idle: ["Estoy aquí para practicar contigo.", "Un paso a la vez."],
  thinking: ["Tómate tu tiempo. Piensa en la pregunta."],
  correct: ["¡Muy bien! Sigue así.", "¡Lo lograste!"],
  incorrect: ["No pasa nada. Revisemos la explicación."],
  streak: ["¡Qué buena racha! Sigamos practicando."],
  reading: ["Escucha o lee con calma; puedes repetirla."],
  coach: ["Practiquemos como en una entrevista real."],
  celebration: ["¡Terminaste esta práctica! Celebremos tu esfuerzo."],
  welcome: ["¡Hola! Practiquemos juntos."],
  explain: ["Veamos la explicación paso a paso."],
  curious: ["Buena pregunta. Exploremos la respuesta."],
  surprised: ["¡Eso es nuevo! Vamos a descubrirlo."],
  determined: ["Puedes intentarlo otra vez."],
  support: ["Estoy contigo. Avanza a tu propio ritmo."],
  progress: ["Mira cuánto has avanzado."],
  sleepy: ["Podemos tomar un descanso cuando quieras."],
};
const STATES = new Set(Object.keys(MESSAGES));
const DEFAULT_DURATION = { thinking: 0, idle: 0, correct: 3400, incorrect: 4600, streak: 4200, reading: 0, coach: 0, celebration: 6000, welcome: 3500, explain: 0, curious: 3500, surprised: 3000, determined: 3500, support: 4000, progress: 4200, sleepy: 0 };
const KEY = "citizenshipai-companion-visible-v1";

export class CitizenshipCompanion extends HTMLElement {
  #timer;
  #count = 0;
  #onLearning = (event) => {
    const detail = event.detail || {};
    this.react(detail.state, { message: detail.message, duration: detail.duration });
  };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const initialVisible = this.#storedVisibility();
    this.shadowRoot.innerHTML = `
      <style>${CSS}</style>
      <div class="host" data-state="idle" data-visible="${initialVisible}">
        <button class="restore" type="button" aria-label="Mostrar acompañante de estudio" title="Mostrar acompañante">✦</button>
        <div class="panel">
          <div class="bubble" role="status" aria-live="polite" aria-atomic="true"></div>
          <div class="figure" role="img" aria-label="Robot acompañante de CitizenshipAI">
            <svg viewBox="0 0 180 218" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="shell" x1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".55" stop-color="#eaf7fb"/><stop offset="1" stop-color="#a9d6e5"/></linearGradient>
                <linearGradient id="glow" x1="0" x2="1"><stop stop-color="#15c6d7"/><stop offset="1" stop-color="#4778ff"/></linearGradient>
                <filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
              </defs>
              <ellipse class="shadow" cx="90" cy="202" rx="53" ry="9" fill="#73c9df" opacity=".28" filter="url(#soft)"/>
              <g class="robot">
                <path class="thruster" d="M71 179 Q90 202 109 179 Q106 211 90 212 Q74 211 71 179Z" fill="url(#glow)" opacity=".85"/>
                <path class="arm left" d="M39 114 Q14 112 15 135 Q17 150 31 146 L48 127Z" fill="url(#shell)" stroke="#9dcbdc" stroke-width="2"/>
                <path class="arm right" d="M141 114 Q166 112 165 135 Q163 150 149 146 L132 127Z" fill="url(#shell)" stroke="#9dcbdc" stroke-width="2"/>
                <path d="M49 109 Q90 93 131 109 Q151 131 137 165 Q126 186 90 188 Q54 186 43 165 Q29 131 49 109Z" fill="url(#shell)" stroke="#9dcbdc" stroke-width="2"/>
                <ellipse cx="29" cy="85" rx="10" ry="24" fill="#14223f" stroke="#32b7fa" stroke-width="5"/>
                <ellipse cx="151" cy="85" rx="10" ry="24" fill="#14223f" stroke="#32b7fa" stroke-width="5"/>
                <path d="M39 49 Q90 26 141 49 Q156 60 151 91 Q149 112 128 120 Q90 132 52 120 Q31 112 29 91 Q24 60 39 49Z" fill="url(#shell)" stroke="#9dcbdc" stroke-width="2"/>
                <path d="M42 64 Q90 49 138 64 Q146 78 139 99 Q90 121 41 99 Q34 78 42 64Z" fill="#14223f"/>
                <path class="eye eye-left" d="M66 81 Q72 74 79 81" fill="none" stroke="#67e9f4" stroke-width="7" stroke-linecap="round"/>
                <path class="eye eye-right" d="M101 81 Q108 74 115 81" fill="none" stroke="#67e9f4" stroke-width="7" stroke-linecap="round"/>
                <circle cx="90" cy="146" r="18" fill="#1675e8"/>
                <path class="star" d="M90 132 L94 141 L104 142 L97 149 L99 159 L90 154 L81 159 L83 149 L76 142 L86 141Z" fill="#fff"/>
                <circle cx="53" cy="112" r="3" fill="#51d8e5"/><circle cx="127" cy="112" r="3" fill="#51d8e5"/>
              </g>
              <g class="sparkles" fill="#27c8df"><path d="M19 63l3-8 3 8 8 3-8 3-3 8-3-8-8-3z"/><path d="M156 40l2-6 2 6 6 2-6 2-2 6-2-6-6-2z"/></g>
            </svg>
          </div>
          <div class="controls"><span class="name">Tu compañero de práctica</span><button class="hide" type="button" aria-label="Ocultar acompañante" title="Ocultar acompañante">×</button></div>
        </div>
      </div>`;
    this.#setMessage(MESSAGES.idle[0]);
    this.shadowRoot.querySelector(".hide").addEventListener("click", () => this.setVisible(false));
    this.shadowRoot.querySelector(".restore").addEventListener("click", () => this.setVisible(true));
    window.addEventListener("citizenshipai:learning", this.#onLearning);
  }

  disconnectedCallback() {
    window.removeEventListener("citizenshipai:learning", this.#onLearning);
    clearTimeout(this.#timer);
  }

  #storedVisibility() {
    try { return localStorage.getItem(KEY) !== "false"; } catch { return true; }
  }

  #setMessage(message) {
    this.shadowRoot.querySelector(".bubble").textContent = message;
  }

  setVisible(visible) {
    this.shadowRoot.querySelector(".host").dataset.visible = String(Boolean(visible));
    try { localStorage.setItem(KEY, String(Boolean(visible))); } catch { /* storage can be unavailable */ }
    this.dispatchEvent(new CustomEvent("companion:visibility", {
      detail: { visible: Boolean(visible) },
      bubbles: true,
      composed: true,
    }));
  }

  /** Set emotion and optional safe plain-text message. Duration 0 keeps the state until another event. */
  react(state, { message, duration } = {}) {
    if (!STATES.has(state)) return false;
    clearTimeout(this.#timer);
    this.#count += 1;
    this.shadowRoot.querySelector(".host").dataset.state = state;
    const choices = MESSAGES[state];
    const safeMessage = typeof message === "string" && message.trim() ? message.trim().slice(0, 180) : choices[(this.#count - 1) % choices.length];
    this.#setMessage(safeMessage);
    const ms = Number.isFinite(duration) ? Math.max(0, Math.min(duration, 12000)) : DEFAULT_DURATION[state];
    if (ms) this.#timer = setTimeout(() => this.react("idle"), ms);
    return true;
  }
}

if (!customElements.get("citizenship-companion")) customElements.define("citizenship-companion", CitizenshipCompanion);

const CSS = `
  :host { position:fixed; right:18px; bottom:18px; z-index:1000; pointer-events:none; font:500 14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif; color:#183452; }
  * { box-sizing:border-box; }
  .host { width:190px; }
  .panel { display:flex; flex-direction:column; align-items:center; }
  .bubble { max-width:190px; min-height:48px; padding:11px 14px; pointer-events:none; background:linear-gradient(145deg,#fff,#f4fbff); border:1px solid #a8dfff; border-radius:18px 18px 5px 18px; box-shadow:0 12px 34px #0b35752b; text-align:center; }
  .figure { width:155px; height:187px; margin-top:-2px; pointer-events:none; filter:drop-shadow(0 12px 18px #006cff30); }
  .figure svg path[fill="#14223f"] { filter:drop-shadow(0 0 5px #00e5ff88); }
  svg { width:100%; height:100%; overflow:visible; }
  .controls { display:flex; align-items:center; gap:5px; width:100%; justify-content:center; }
  .name { font-size:11px; font-weight:700; background:#eaf7fb; padding:5px 8px; border-radius:12px; }
  button { pointer-events:auto; font:inherit; cursor:pointer; border:1px solid #b6dce9; color:#183452; background:#fff; box-shadow:0 4px 14px #18345222; }
  button:focus-visible { outline:3px solid #277cc8; outline-offset:3px; }
  .hide { width:30px; height:30px; border-radius:50%; font-size:21px; line-height:1; }
  .restore { display:none; width:44px; height:44px; margin-left:auto; border-radius:50%; color:#116aab; font-size:25px; }
  [data-visible="false"] .panel { display:none; }
  [data-visible="false"] .restore { display:block; }
  .robot { transform-origin:90px 140px; animation:float 3.2s ease-in-out infinite; }
  .eye { transform-origin:center; animation:blink 5s ease-in-out infinite; }
  .star { transform-origin:90px 146px; animation:pulse 2.5s ease-in-out infinite; }
  .sparkles { opacity:0; }
  [data-state="thinking"] .eye { animation:think 1.4s ease-in-out infinite; }
  [data-state="thinking"] .robot { animation:float 2s ease-in-out infinite; }
  [data-state="correct"] .robot, [data-state="streak"] .robot, [data-state="celebration"] .robot { animation:bounce .6s ease-in-out 3; }
  [data-state="correct"] .sparkles, [data-state="streak"] .sparkles, [data-state="celebration"] .sparkles { opacity:1; animation:twinkle .55s ease-in-out 4; }
  [data-state="streak"] .star, [data-state="celebration"] .star { animation:pulse .45s ease-in-out infinite; }
  [data-state="incorrect"] .robot { animation:comfort .7s ease-in-out 2; }
  [data-state="incorrect"] .eye { transform:translateY(3px); animation:none; }
  [data-state="reading"] .star, [data-state="coach"] .star { animation:pulse 1.1s ease-in-out infinite; }
  [data-state="welcome"] .arm.right { animation:wave .7s ease-in-out 4; transform-origin:140px 118px; }
  [data-state="explain"] .star, [data-state="progress"] .star { animation:pulse 1.1s ease-in-out infinite; }
  [data-state="curious"] .robot, [data-state="surprised"] .robot { animation:comfort .65s ease-in-out 2; }
  [data-state="determined"] .eye { animation:none; transform:translateY(-2px); }
  [data-state="support"] .robot { animation:comfort 1.4s ease-in-out 2; }
  [data-state="sleepy"] .eye { animation:none; transform:scaleY(.15); }
  [data-state="sleepy"] .robot { animation:float 5s ease-in-out infinite; }
  @keyframes float { 50% { transform:translateY(-7px); } }
  @keyframes blink { 0%,93%,100% { transform:scaleY(1); } 96% { transform:scaleY(.12); } }
  @keyframes think { 50% { transform:translate(2px,-3px); } }
  @keyframes bounce { 50% { transform:translateY(-16px) rotate(5deg); } }
  @keyframes comfort { 50% { transform:rotate(-6deg); } }
  @keyframes wave { 50% { transform:rotate(-22deg); } }
  @keyframes pulse { 50% { transform:scale(1.18); opacity:.65; } }
  @keyframes twinkle { 50% { opacity:.25; transform:scale(.85); } }
  @media (max-width:600px) { :host { right:8px; bottom:calc(72px + env(safe-area-inset-bottom)); } .host { width:124px; } .bubble { max-width:124px; font-size:11px; line-height:1.3; min-height:0; padding:7px 8px; } .figure { width:94px; height:114px; } .name { display:none; } .controls { justify-content:flex-end; margin-top:-8px; } .hide { width:28px; height:28px; } }
  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } }
`;
