/** CitizenshipAI Companion — framework-independent Web Component. */
const PHRASES = {
  great: { es: "¡Vas muy bien!", en: "You're doing great!" },
  oneMore: { es: "¡Un paso más!", en: "One more step!" },
  keepGoing: { es: "¡Sigue así!", en: "Keep it up!" },
  effort: { es: "¡Buen esfuerzo!", en: "Great effort!" },
  happening: { es: "¡Lo estás logrando!", en: "You're making it happen!" },
  believe: { es: "¡Confía en ti!", en: "Believe in yourself!" },
  everyTry: { es: "¡Cada intento cuenta!", en: "Every try counts!" },
  together: { es: "¡Vamos juntos!", en: "Let's do this together!" },
  time: { es: "¡Tómate tu tiempo!", en: "Take your time!" },
  retry: { es: "¡Puedes intentarlo otra vez!", en: "You can try again!" },
  learned: { es: "¡Aprendiste algo nuevo!", en: "You learned something new!" },
  progress: { es: "¡Mira cuánto avanzaste!", en: "Look how far you've come!" },
  answer: { es: "¡Gran respuesta!", en: "Great answer!" },
  streak: { es: "¡Qué buena racha!", en: "What a great streak!" },
};
const MESSAGES = {
  idle: [PHRASES.great, PHRASES.oneMore, PHRASES.keepGoing, PHRASES.effort, PHRASES.believe],
  thinking: [PHRASES.time, PHRASES.believe],
  correct: [PHRASES.answer, PHRASES.great, PHRASES.happening],
  incorrect: [PHRASES.retry, PHRASES.everyTry, PHRASES.learned],
  streak: [PHRASES.streak, PHRASES.keepGoing],
  reading: [PHRASES.time, PHRASES.together],
  coach: [PHRASES.together, PHRASES.believe],
  celebration: [PHRASES.progress, PHRASES.happening],
  welcome: [PHRASES.together, PHRASES.great],
  explain: [PHRASES.learned],
  curious: [PHRASES.learned],
  surprised: [PHRASES.learned],
  determined: [PHRASES.oneMore, PHRASES.believe, PHRASES.retry],
  support: [PHRASES.effort, PHRASES.everyTry, PHRASES.together],
  progress: [PHRASES.progress, PHRASES.happening],
  sleepy: [PHRASES.time],
  approved: [PHRASES.answer, PHRASES.keepGoing],
  denied: [PHRASES.retry, PHRASES.everyTry],
  studying: [PHRASES.learned, PHRASES.together, PHRASES.time],
  love: [PHRASES.great, PHRASES.effort, PHRASES.believe],
  goal: [PHRASES.oneMore, PHRASES.keepGoing, PHRASES.happening, PHRASES.progress],
};
const STATES = new Set(Object.keys(MESSAGES));
const DEFAULT_DURATION = { thinking: 0, idle: 0, correct: 3400, incorrect: 4600, streak: 4200, reading: 0, coach: 0, celebration: 6000, welcome: 3500, explain: 0, curious: 3500, surprised: 3000, determined: 3500, support: 4000, progress: 4200, sleepy: 0, approved: 3400, denied: 4600, studying: 0, love: 4000, goal: 4200 };
const KEY = "citizenshipai-companion-visible-v1";
const BASE_IMAGE = "/citizenship-companion.png";
const REACTION_IMAGES = {
  thinking: "/companion-studying-cutout.png",
  correct: "/companion-approved-cutout.png",
  incorrect: "/companion-denied-cutout.png",
  streak: "/companion-goal-cutout.png",
  reading: "/companion-studying-cutout.png",
  celebration: "/companion-goal-cutout.png",
  explain: "/companion-studying-cutout.png",
  curious: "/companion-studying-cutout.png",
  determined: "/companion-goal-cutout.png",
  support: "/companion-love-cutout.png",
  progress: "/companion-goal-cutout.png",
  sleepy: "/companion-sleeping-cutout.png",
  approved: "/companion-approved-cutout.png",
  denied: "/companion-denied-cutout.png",
  studying: "/companion-studying-cutout.png",
  love: "/companion-love-cutout.png",
  goal: "/companion-goal-cutout.png",
};

export class CitizenshipCompanion extends HTMLElement {
  #timer;
  #count = 0;
  #onLearning = (event) => {
    const detail = event.detail || {};
    this.react(detail.state, { message: detail.message, duration: detail.duration, silent: detail.silent });
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
          <button class="figure" type="button" aria-label="Ocultar acompañante de estudio" title="Ocultar acompañante">
            <img class="mascot-image" src="${BASE_IMAGE}" alt="" draggable="false" />
            <span class="state-symbol" aria-hidden="true"></span>
            <span class="celebration-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
            <svg class="fallback-vector" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="shell" x1=".12" y1="0" x2=".82" y2="1"><stop stop-color="#fffdfd"/><stop offset=".42" stop-color="#f7fbff"/><stop offset=".76" stop-color="#dcecff"/><stop offset="1" stop-color="#a8c9e8"/></linearGradient>
                <linearGradient id="visor" x1=".18" y1="0" x2=".85" y2="1"><stop stop-color="#172141"/><stop offset=".42" stop-color="#050817"/><stop offset="1" stop-color="#01030b"/></linearGradient>
                <linearGradient id="blue" x1="0" x2="1" y2="1"><stop stop-color="#00dfff"/><stop offset=".45" stop-color="#138cff"/><stop offset="1" stop-color="#2455ff"/></linearGradient>
                <radialGradient id="ear" cx="50%" cy="50%" r="55%"><stop stop-color="#12326c"/><stop offset=".58" stop-color="#06132d"/><stop offset=".72" stop-color="#0ddfff"/><stop offset="1" stop-color="#1759ff"/></radialGradient>
                <radialGradient id="thruster" cx="50%" cy="20%" r="75%"><stop stop-color="#eaffff"/><stop offset=".3" stop-color="#00efff"/><stop offset="1" stop-color="#126dff"/></radialGradient>
                <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
                <filter id="cyanGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="shellShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#174c91" flood-opacity=".28"/></filter>
              </defs>
              <ellipse class="shadow" cx="100" cy="222" rx="57" ry="9" fill="#167bdb" opacity=".22" filter="url(#soft)"/>
              <g class="robot" filter="url(#shellShadow)">
                <g class="flight">
                  <ellipse class="thruster-glow" cx="100" cy="198" rx="28" ry="25" fill="#00dfff" opacity=".28" filter="url(#soft)"/>
                  <path class="thruster" d="M75 181 Q100 174 125 181 Q120 215 100 220 Q80 215 75 181Z" fill="url(#thruster)" stroke="#59efff" stroke-width="2"/>
                  <path d="M82 183 Q100 191 118 183" fill="none" stroke="#d8ffff" stroke-width="3" opacity=".8"/>
                </g>

                <path class="neck" d="M77 111 Q100 103 123 111 L121 127 Q100 135 79 127Z" fill="#07101f"/>
                <path class="body" d="M55 119 Q100 101 145 119 Q157 141 146 174 Q137 198 100 202 Q63 198 54 174 Q43 141 55 119Z" fill="url(#shell)" stroke="#b8d8f5" stroke-width="2"/>
                <path class="body-shine" d="M66 125 Q95 112 126 122 Q103 122 72 145Z" fill="#fff" opacity=".62"/>
                <path d="M100 119 V196" stroke="#91b6dc" stroke-width="1" opacity=".45"/>

                <g class="arm left">
                  <ellipse cx="54" cy="132" rx="11" ry="15" fill="#07101f"/>
                  <path d="M53 126 Q31 122 25 144 Q22 163 39 173 Q52 171 58 154 Q62 138 53 126Z" fill="url(#shell)" stroke="#b8d8f5" stroke-width="2"/>
                  <ellipse class="hand" cx="35" cy="166" rx="12" ry="10" fill="#07101f" transform="rotate(24 35 166)"/>
                  <path d="M31 159 Q37 155 42 160" fill="none" stroke="#37506f" stroke-width="2" opacity=".8"/>
                </g>
                <g class="arm right">
                  <ellipse cx="146" cy="132" rx="11" ry="15" fill="#07101f"/>
                  <path d="M147 126 Q169 122 175 144 Q178 163 161 173 Q148 171 142 154 Q138 138 147 126Z" fill="url(#shell)" stroke="#b8d8f5" stroke-width="2"/>
                  <ellipse class="hand" cx="165" cy="166" rx="12" ry="10" fill="#07101f" transform="rotate(-24 165 166)"/>
                  <path d="M158 160 Q163 155 169 159" fill="none" stroke="#37506f" stroke-width="2" opacity=".8"/>
                </g>

                <circle class="badge" cx="100" cy="158" r="21" fill="url(#blue)" stroke="#fff" stroke-width="2"/>
                <path class="star" d="M100 143 L104.5 152.2 L115 153.7 L107.5 161 L109.3 171.5 L100 166.5 L90.7 171.5 L92.5 161 L85 153.7 L95.5 152.2Z" fill="#fff"/>

                <g class="head">
                  <ellipse class="ear left-ear" cx="34" cy="78" rx="13" ry="27" fill="url(#ear)" stroke="#46eaff" stroke-width="2"/>
                  <ellipse class="ear right-ear" cx="166" cy="78" rx="13" ry="27" fill="url(#ear)" stroke="#46eaff" stroke-width="2"/>
                  <path class="head-shell" d="M39 35 Q100 6 161 35 Q181 49 176 83 Q174 113 150 127 Q100 145 50 127 Q26 113 24 83 Q19 49 39 35Z" fill="url(#shell)" stroke="#c6e5ff" stroke-width="2.5"/>
                  <path class="head-highlight" d="M46 39 Q91 16 139 31 Q111 28 74 48 Q53 59 38 79 Q34 53 46 39Z" fill="#fff" opacity=".72"/>
                  <path class="visor" d="M42 53 Q100 30 158 53 Q168 67 163 94 Q158 116 139 122 Q100 134 61 122 Q42 116 37 94 Q32 67 42 53Z" fill="url(#visor)" stroke="#26385e" stroke-width="2"/>
                  <path class="visor-shine" d="M51 56 Q90 41 130 49 Q92 49 60 70Z" fill="#fff" opacity=".09"/>

                  <g class="face face-happy" fill="none" stroke="#49edff" stroke-width="9" stroke-linecap="round" filter="url(#cyanGlow)"><path d="M63 84 Q73 70 83 84"/><path d="M117 84 Q127 70 137 84"/></g>
                  <g class="face face-thinking" fill="none" stroke="#49edff" stroke-width="8" stroke-linecap="round" filter="url(#cyanGlow)"><circle cx="75" cy="80" r="5" fill="#49edff"/><circle cx="126" cy="78" r="10"/></g>
                  <g class="face face-surprised" fill="#49edff" filter="url(#cyanGlow)"><circle cx="75" cy="80" r="10"/><circle cx="126" cy="80" r="10"/></g>
                  <g class="face face-determined" fill="none" stroke="#49edff" stroke-width="8" stroke-linecap="round" filter="url(#cyanGlow)"><path d="M62 76 L82 84"/><path d="M118 84 L138 76"/></g>
                  <g class="face face-support" fill="none" stroke="#49edff" stroke-width="8" stroke-linecap="round" filter="url(#cyanGlow)"><path d="M63 86 Q73 76 83 86"/><path d="M117 86 Q127 76 137 86"/></g>
                  <g class="face face-sleepy" fill="none" stroke="#49edff" stroke-width="7" stroke-linecap="round" filter="url(#cyanGlow)"><path d="M63 84 Q73 91 83 84"/><path d="M117 84 Q127 91 137 84"/></g>
                  <g class="face face-stars" fill="#fff" stroke="#49edff" stroke-width="2" filter="url(#cyanGlow)"><path d="M74 67l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/><path d="M126 67l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/></g>
                </g>

                <g class="tablet">
                  <rect x="61" y="144" width="78" height="50" rx="9" fill="#0a2b67" stroke="#36caff" stroke-width="2"/>
                  <rect x="69" y="151" width="62" height="34" rx="5" fill="#1166c7" opacity=".72"/>
                  <path d="M78 161h44M78 170h35M78 179h27" stroke="#9af5ff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
                </g>
              </g>

              <g class="question-mark" fill="#168cff" font-family="system-ui,sans-serif" font-size="34" font-weight="800"><text x="158" y="47">?</text></g>
              <g class="sleep-marks" fill="#168cff" font-family="system-ui,sans-serif" font-weight="800"><text x="151" y="52" font-size="17">Z</text><text x="169" y="35" font-size="24">Z</text></g>
              <g class="sparkles" fill="#18ccff"><path d="M19 63l3-8 3 8 8 3-8 3-3 8-3-8-8-3z"/><path d="M177 117l3-8 3 8 8 3-8 3-3 8-3-8-8-3z"/><path d="M162 38l2-6 2 6 6 2-6 2-2 6-2-6-6-2z"/></g>
              <g class="confetti"><path d="M22 106l7 5" stroke="#ffbd16" stroke-width="5"/><path d="M172 78l7-4" stroke="#ff5b6c" stroke-width="5"/><path d="M26 39l5-7" stroke="#34d87b" stroke-width="5"/><path d="M175 145l6 6" stroke="#795dff" stroke-width="5"/></g>
            </svg>
          </button>
        </div>
      </div>`;
    this.#setMessage(this.#localizedMessage(MESSAGES.idle[0]));
    const mascotImage = this.shadowRoot.querySelector(".mascot-image");
    mascotImage.addEventListener("load", () => {
      mascotImage.hidden = false;
      this.shadowRoot.querySelector(".fallback-vector").classList.remove("visible");
    });
    mascotImage.addEventListener("error", () => {
      if (mascotImage.getAttribute("src") !== BASE_IMAGE) {
        mascotImage.src = BASE_IMAGE;
        return;
      }
      mascotImage.hidden = true;
      this.shadowRoot.querySelector(".fallback-vector").classList.add("visible");
    });
    this.shadowRoot.querySelector(".figure").addEventListener("click", () => this.setVisible(false));
    this.shadowRoot.querySelector(".restore").addEventListener("click", () => this.setVisible(true));
    [...new Set(Object.values(REACTION_IMAGES))].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
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

  #localizedMessage(message) {
    if (typeof message === "string") return message;
    let language = "en";
    try { language = localStorage.getItem("citizenshipai.language") === "es" ? "es" : "en"; } catch { /* storage can be unavailable */ }
    return message[language];
  }

  setVisible(visible) {
    const host = this.shadowRoot.querySelector(".host");
    host.dataset.visible = String(Boolean(visible));
    host.dataset.sessionHidden = "false";
    try { localStorage.setItem(KEY, String(Boolean(visible))); } catch { /* storage can be unavailable */ }
    this.dispatchEvent(new CustomEvent("companion:visibility", {
      detail: { visible: Boolean(visible) },
      bubbles: true,
      composed: true,
    }));
  }

  setSessionVisible(visible) {
    this.shadowRoot.querySelector(".host").dataset.sessionHidden = String(!visible);
  }

  /** Set emotion and optional safe plain-text message. Duration 0 keeps the state until another event. */
  react(state, { message, duration, silent = false } = {}) {
    if (!STATES.has(state)) return false;
    clearTimeout(this.#timer);
    this.#count += 1;
    const host = this.shadowRoot.querySelector(".host");
    host.dataset.state = state;
    host.dataset.silent = String(Boolean(silent));
    const reactionImage = REACTION_IMAGES[state] || BASE_IMAGE;
    host.dataset.reactionArtwork = String(reactionImage !== BASE_IMAGE);
    const mascotImage = this.shadowRoot.querySelector(".mascot-image");
    if (mascotImage.getAttribute("src") !== reactionImage) mascotImage.src = reactionImage;
    const choices = MESSAGES[state];
    const safeMessage = typeof message === "string" && message.trim()
      ? message.trim().slice(0, 180)
      : this.#localizedMessage(choices[(this.#count - 1) % choices.length]);
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
  .figure { position:relative; width:164px; height:174px; margin-top:0; pointer-events:auto; filter:drop-shadow(0 12px 18px #006cff30); }
  .mascot-image { display:block; width:100%; height:100%; object-fit:contain; user-select:none; transform-origin:50% 68%; animation:mascotFloat 3.2s ease-in-out infinite; }
  .fallback-vector { display:none; }
  .fallback-vector.visible { display:block; }
  .state-symbol { position:absolute; top:8px; right:3px; min-width:34px; text-align:center; color:#168cff; font-size:30px; font-weight:900; line-height:1; filter:drop-shadow(0 3px 6px #fff); opacity:0; transform:scale(.65); transition:opacity .2s ease,transform .2s ease; }
  .state-symbol::before { content:""; }
  .celebration-burst { position:absolute; inset:4px; opacity:0; }
  .celebration-burst i { position:absolute; width:7px; height:14px; border-radius:5px; background:#00cfff; }
  .celebration-burst i:nth-child(1) { left:8%; top:28%; background:#ffc126; transform:rotate(-36deg); }
  .celebration-burst i:nth-child(2) { left:21%; top:5%; background:#32d481; transform:rotate(18deg); }
  .celebration-burst i:nth-child(3) { left:47%; top:0; background:#7a5cff; transform:rotate(-12deg); }
  .celebration-burst i:nth-child(4) { right:20%; top:8%; background:#ff5a70; transform:rotate(32deg); }
  .celebration-burst i:nth-child(5) { right:5%; top:32%; background:#16a8ff; transform:rotate(55deg); }
  .celebration-burst i:nth-child(6) { left:2%; top:58%; background:#ff6f48; transform:rotate(72deg); }
  svg { width:100%; height:100%; overflow:visible; }
  button { pointer-events:auto; font:inherit; cursor:pointer; border:1px solid #b6dce9; color:#183452; background:#fff; box-shadow:0 4px 14px #18345222; }
  button:focus-visible { outline:3px solid #277cc8; outline-offset:3px; }
  button.figure { display:block; padding:0; border:0; color:inherit; background:transparent; box-shadow:none; }
  .restore { display:none; width:44px; height:44px; margin-left:auto; border-radius:50%; color:#116aab; font-size:25px; }
  [data-visible="false"] .panel { display:none; }
  [data-visible="false"] .restore { display:block; }
  [data-session-hidden="true"] .panel, [data-session-hidden="true"] .restore { display:none; }
  [data-silent="true"] .bubble { display:none; }
  [data-reaction-artwork="true"] .state-symbol { display:none; }
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
  [data-state="thinking"] .mascot-image, [data-state="curious"] .mascot-image { animation:mascotThink 1.6s ease-in-out infinite; }
  [data-state="thinking"] .state-symbol, [data-state="curious"] .state-symbol { opacity:1; transform:scale(1); }
  [data-state="thinking"] .state-symbol::before, [data-state="curious"] .state-symbol::before { content:"?"; }
  [data-state="correct"] .mascot-image, [data-state="streak"] .mascot-image, [data-state="celebration"] .mascot-image { animation:mascotCelebrate .62s ease-in-out 3; }
  [data-state="correct"] .state-symbol { opacity:1; transform:scale(1); color:#18bd72; }
  [data-state="correct"] .state-symbol::before { content:"✓"; }
  [data-state="streak"] .celebration-burst, [data-state="celebration"] .celebration-burst { opacity:1; animation:burst 1s ease-in-out 3; }
  [data-state="streak"] .state-symbol, [data-state="celebration"] .state-symbol { opacity:1; transform:scale(1); color:#ffb100; }
  [data-state="streak"] .state-symbol::before { content:"★"; }
  [data-state="celebration"] .state-symbol::before { content:"✦"; }
  [data-state="incorrect"] .mascot-image, [data-state="support"] .mascot-image { animation:mascotComfort 1.15s ease-in-out 2; }
  [data-state="incorrect"] .state-symbol, [data-state="support"] .state-symbol { opacity:1; transform:scale(1); color:#ff5f7d; }
  [data-state="incorrect"] .state-symbol::before, [data-state="support"] .state-symbol::before { content:"♥"; }
  [data-state="welcome"] .mascot-image { animation:mascotWave .75s ease-in-out 4; }
  [data-state="reading"] .mascot-image, [data-state="coach"] .mascot-image, [data-state="explain"] .mascot-image { animation:mascotListen 2s ease-in-out infinite; }
  [data-state="reading"] .state-symbol, [data-state="coach"] .state-symbol, [data-state="explain"] .state-symbol { opacity:1; transform:scale(1); color:#00bde8; }
  [data-state="reading"] .state-symbol::before { content:"•••"; font-size:18px; letter-spacing:1px; }
  [data-state="coach"] .state-symbol::before { content:"♪"; }
  [data-state="explain"] .state-symbol::before { content:"i"; font-size:24px; }
  [data-state="progress"] .state-symbol { opacity:1; transform:scale(1); color:#18bd72; }
  [data-state="progress"] .state-symbol::before { content:"↗"; }
  [data-state="surprised"] .mascot-image { animation:mascotPop .7s ease-in-out 2; }
  [data-state="surprised"] .state-symbol { opacity:1; transform:scale(1); }
  [data-state="surprised"] .state-symbol::before { content:"!"; }
  [data-state="determined"] .mascot-image { animation:mascotReady 1.4s ease-in-out infinite; }
  [data-state="sleepy"] .mascot-image { animation:mascotSleep 4.8s ease-in-out infinite; opacity:.9; }
  [data-state="sleepy"] .state-symbol { opacity:1; transform:scale(1); }
  [data-state="sleepy"] .state-symbol::before { content:"Zz"; font-size:21px; }
  @keyframes float { 50% { transform:translateY(-7px); } }
  @keyframes blink { 0%,93%,100% { transform:scaleY(1); } 96% { transform:scaleY(.12); } }
  @keyframes think { 50% { transform:translate(2px,-3px); } }
  @keyframes bounce { 50% { transform:translateY(-16px) rotate(5deg); } }
  @keyframes comfort { 50% { transform:rotate(-6deg); } }
  @keyframes wave { 50% { transform:rotate(-22deg); } }
  @keyframes pulse { 50% { transform:scale(1.18); opacity:.65; } }
  @keyframes twinkle { 50% { opacity:.25; transform:scale(.85); } }
  @keyframes mascotFloat { 50% { transform:translateY(-7px); } }
  @keyframes mascotThink { 25% { transform:translateY(-5px) rotate(-3deg); } 75% { transform:translateY(-8px) rotate(3deg); } }
  @keyframes mascotCelebrate { 45% { transform:translateY(-18px) rotate(5deg) scale(1.05); } 75% { transform:translateY(-4px) rotate(-3deg); } }
  @keyframes mascotComfort { 45% { transform:translateY(-5px) rotate(-5deg) scale(.98); } }
  @keyframes mascotWave { 35% { transform:translateY(-8px) rotate(-4deg); } 65% { transform:translateY(-8px) rotate(4deg); } }
  @keyframes mascotListen { 50% { transform:translateY(-6px) scale(1.025); filter:brightness(1.08); } }
  @keyframes mascotPop { 50% { transform:translateY(-12px) scale(1.08); } }
  @keyframes mascotReady { 50% { transform:translateY(-7px) scale(1.035); } }
  @keyframes mascotSleep { 50% { transform:translateY(-3px) rotate(-2deg) scale(.97); } }
  @keyframes burst { 0%,100% { transform:scale(.7); opacity:0; } 35%,70% { transform:scale(1.08); opacity:1; } }
  @media (max-width:600px) { :host { right:8px; bottom:calc(72px + env(safe-area-inset-bottom)); } .host { width:124px; } .bubble { max-width:124px; font-size:11px; line-height:1.3; min-height:0; padding:7px 8px; } .figure { width:102px; height:108px; } .state-symbol { right:0; top:1px; font-size:22px; } }
  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } }
`;
