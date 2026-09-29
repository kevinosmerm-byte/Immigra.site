import { useEffect } from "react";

const categoryIcon = {
  document: "▤",
  institution: "⌂",
  person: "●",
  map: "⌖",
};

export function CivicsStudyCard({
  question,
  questionSpanish,
  answers,
  image,
  imageAlt,
  imageFit = "cover",
  imagePosition = "50% 50%",
  sourceName,
  sourceLabel,
  sourceUrl,
  sourceCategory,
  questionNumber,
  totalQuestions,
  favorite,
  mastered,
  answerVisible,
  audioEnabled,
  preloadImages = [],
  touchRef,
  onToggleAnswer,
  onToggleFavorite,
  onPlayAudio,
  onNavigate,
  copy,
}) {
  useEffect(() => {
    const preloaded = preloadImages.filter(Boolean).map((src) => {
      const asset = new Image();
      asset.decoding = "async";
      asset.src = src;
      return asset;
    });
    return () => preloaded.forEach((asset) => { asset.src = ""; });
  }, [preloadImages]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleAnswer();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNavigate(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onNavigate(1);
    }
  };

  const handleTouchEnd = (event) => {
    const start = touchRef.current;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      touchRef.current = { swiped: true };
      onNavigate(dx < 0 ? 1 : -1);
      return;
    }
    touchRef.current = null;
  };

  return (
    <article
      className={`civics-study-card ${answerVisible ? "answer-visible" : ""} ${mastered ? "is-mastered" : ""}`}
      role="button"
      tabIndex="0"
      aria-label={answerVisible ? `${copy.answer}: ${answers.join(", ")}` : `${copy.question}: ${question}. ${copy.reveal}`}
      onClick={() => {
        if (touchRef.current?.swiped) {
          touchRef.current = null;
          return;
        }
        onToggleAnswer();
      }}
      onKeyDown={handleKeyDown}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchRef.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`civics-study-media ${image ? "has-photo" : "is-pending"} ${imageFit === "contain" ? "full-artwork" : ""}`}>
        {image ? (
          <img src={image} alt={imageAlt} style={{ objectFit: imageFit, objectPosition: imagePosition }} loading="eager" decoding="async" fetchPriority="high" />
        ) : (
          <div className="civics-study-media-placeholder" aria-hidden="true">
            <span>128</span>
            <strong>CIVICS</strong>
          </div>
        )}
        <div className="civics-study-media-gradient" aria-hidden="true"></div>
        <span className="civics-study-counter">{questionNumber} / {totalQuestions}</span>
        {mastered && <span className="civics-study-mastered" aria-label={copy.mastered}>✓</span>}
        <button
          type="button"
          className={`civics-study-favorite ${favorite ? "active" : ""}`}
          aria-pressed={favorite}
          aria-label={favorite ? copy.removeFavorite : copy.addFavorite}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
        >
          <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
        </button>
      </div>

      <div className="civics-study-body">
        <div className="civics-study-content" aria-live="polite">
          {answerVisible ? (
            <section className="civics-study-answer">
              <span className="civics-study-eyebrow">{copy.answer}</span>
              <h2>{question}</h2>
              <div className="civics-study-answer-list">
                {answers.map((answer, index) => <p key={`${answer}-${index}`}>{answer}</p>)}
              </div>
            </section>
          ) : (
            <section className="civics-study-question">
              <span className="civics-study-eyebrow">{copy.question}</span>
              <h2>{question}</h2>
              <p lang="es">{questionSpanish}</p>
            </section>
          )}
        </div>

        <div className="civics-study-reveal">
          <button
            type="button"
            aria-label={copy.playAudio}
            aria-disabled={!audioEnabled}
            disabled={!audioEnabled}
            onClick={(event) => {
              event.stopPropagation();
              if (audioEnabled) onPlayAudio();
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Zm11.5.5a4 4 0 0 1 0 5M18.8 7a7 7 0 0 1 0 10" /></svg>
          </button>
          <span>{answerVisible ? copy.backToQuestion : copy.reveal}</span>
        </div>
      </div>

      <a
        className="civics-study-source"
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        aria-label={`${copy.source}: ${sourceName}`}
      >
        <span aria-hidden="true">{categoryIcon[sourceCategory] ?? "↗"}</span>
        <span>{copy.source}: <strong>{sourceName}</strong></span>
        <em>{sourceLabel}</em>
        <b aria-hidden="true">↗</b>
      </a>
    </article>
  );
}
