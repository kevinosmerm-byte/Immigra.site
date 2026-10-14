import { INTERVIEWERS } from './interviewer-media.mjs';

const colors = { citizenship: '#175CD3', asylum: '#7944C6', residency: '#168464' };

export default function InterviewerPicker({ value, onChange, lang = 'es', moduleId = 'citizenship', disabled = false }) {
  return <fieldset disabled={disabled} className="min-w-0! border-0! p-0! my-4!">
    <legend className="mb-3! text-lg! font-semibold!">{lang === 'es' ? '¿Con quién quieres hablar?' : 'Who would you like to talk with?'}</legend>
    <div className="grid! grid-cols-3! gap-2!" role="group">
      {INTERVIEWERS.map(person => <button key={person.id} type="button" aria-pressed={value === person.id || (value === 'sahara' && person.id === 'sarah')} onClick={() => onChange(person.id)} style={{ backgroundColor: value === person.id || (value === 'sahara' && person.id === 'sarah') ? colors[moduleId] : '#15151e' }} className="flex! min-h-16! min-w-0! flex-col! items-center! justify-center! gap-1! rounded-2xl! border! border-white/20! px-2! py-3! text-base! font-semibold! text-white! shadow-sm! focus-visible:outline-2! focus-visible:outline-offset-4! focus-visible:outline-sky-300! disabled:opacity-50!">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6! w-6!"><circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/></svg>
        {person.name}
      </button>)}
    </div>
  </fieldset>;
}
