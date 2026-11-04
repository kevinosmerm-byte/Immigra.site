import '../../../shared/design-system/citizenship-source-note.css';

export function StudyCardSource({ source, language = 'es' }) {
  return <aside className="citizenship-card-source" aria-label={language === 'es' ? 'Fuente de la pregunta' : 'Question source'}>
    {source ? <><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a><p>{source.note}</p></>
      : <p>{language === 'es' ? 'Fuente específica pendiente de verificación.' : 'Specific source pending verification.'}</p>}
  </aside>;
}
