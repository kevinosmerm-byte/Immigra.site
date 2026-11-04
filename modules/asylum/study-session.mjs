import {SEQUENCE_VERSION,sequenceQuestions,topicForQuestion} from './question-sequence.mjs';
export const STUDY_KEY = 'immigra.asylum-study.v1';
export const LEGACY_STUDY_KEY = 'immigra.asylum-study.legacy-backup.v1';
export function eligibleIds(bank, country) {
  return [...new Set(sequenceQuestions(bank).filter(q => !q.country || q.country === country).map(q => q.id))];
}
export function newSession(bank, country, random = Math.random) {
  const order = eligibleIds(bank, country);
  return {version: 1, sequence: SEQUENCE_VERSION, country, order, index: 0};
}
export function restoreSession(storage, bank, countries) {
  try {
    const s = JSON.parse(storage.getItem(STUDY_KEY));
    if (!s || s.version !== 1 || !countries.includes(s.country)) return null;
    const ids = eligibleIds(bank, s.country);
    if (!Array.isArray(s.order) || !s.order.length || new Set(s.order).size !== s.order.length || !s.order.every(id => typeof id === 'string') || !Number.isInteger(s.index) || s.index < 0 || s.index >= s.order.length || !ids.length) return null;
    if (s.sequence !== SEQUENCE_VERSION) return {...newSession(bank,s.country), previousBankSession:s, migration:{reordered:true,added:ids.filter(id=>!s.order.includes(id)),retired:s.order.filter(id=>!ids.includes(id)),retained:s.order.filter(id=>ids.includes(id))}};
    if (s.order.length === ids.length && s.order.every(id => ids.includes(id))) return s;
    const eligible = new Set(ids), oldIds = new Set(s.order);
    const retained = s.order.filter(id => eligible.has(id));
    const added = ids.filter(id => !oldIds.has(id));
    const order = [...retained, ...added];
    // Resume at the same surviving card, or first surviving unseen card.
    // All newly introduced cards follow, with no inherited completion.
    const anchor = s.order.slice(s.index).find(id => eligible.has(id)) || added[0];
    const index = anchor ? order.indexOf(anchor) : Math.max(0, retained.length - 1);
    // Retain the full old session inside the saved value. This survives denied
    // secondary-key writes and allows recovery without erasing legacy progress.
    return {...s, order, index, previousBankSession: s,
      migration: {added, retired: s.order.filter(id => !eligible.has(id)), retained}};
  } catch { return null; }
}
export function saveSession(storage, session, previousBankSession = session?.previousBankSession) {
  try {
    // A failed backup must also protect the old session when the UI resets or
    // clears the current deck before storage becomes available again.
    if (previousBankSession && !storage.getItem(LEGACY_STUDY_KEY)) storage.setItem(LEGACY_STUDY_KEY, JSON.stringify(previousBankSession));
    if (session) {
      // Archive before replacing the old value. If the backup cannot be saved,
      // do not overwrite the previous stored session; study still runs in memory.
      storage.setItem(STUDY_KEY, JSON.stringify(session));
    } else storage.removeItem(STUDY_KEY);
  } catch { /* Storage can be unavailable; study still works in memory. */ }
}
export function advanceSession(session, delta) {
  return {...session, index: Math.max(0, Math.min(session.order.length - 1, session.index + delta))};
}

export function skipStudyTopic(session){
 const topic=topicForQuestion(session.order[session.index]);
 if(!topic)return session;
 const index=session.order.findIndex((id,i)=>i>session.index&&topicForQuestion(id)!==topic);
 return index<0?{...session,completed:true}:{...session,index};
}

export function skipStudyQuestion(session){
 if(session.completed)return session;
 return session.index<session.order.length-1?advanceSession(session,1):{...session,completed:true};
}
