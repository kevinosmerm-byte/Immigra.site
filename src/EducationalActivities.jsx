export function RetrievalPracticeCard({ title, prompt, hint, onStart }) {
  return (
    <article className="learning-activity">
      <span>RETRIEVAL PRACTICE</span>
      <h3>{title}</h3>
      <p>{prompt}</p>
      <details><summary>Show a hint</summary><p>{hint}</p></details>
      <button type="button" onClick={onStart}>Practice now <span aria-hidden="true">→</span></button>
    </article>
  );
}

export function CategoryMastery({ metrics = {} }) {
  const rows = [
    ["Consistency", metrics.consistency], ["Category mastery", metrics.categoryMastery],
    ["Pace", metrics.pace], ["Spaced review", metrics.spacedRepetition],
  ];
  return <div className="mastery-grid" aria-label="Readiness factors">{rows.map(([label, value]) => (
    <div key={label}><span>{label}</span><strong>{Number.isFinite(value) ? `${value}%` : "—"}</strong></div>
  ))}</div>;
}
