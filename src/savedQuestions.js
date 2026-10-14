import { DEFAULT_TEST_VERSION } from "./civicsVersions.js";
import { civicsQuestionBank } from "./civicsQuestionBank.js";
const running = new Map();
const key = user => `citizenshipai.saved-pending.v1:${user}`;
function read(user) { try { return JSON.parse(localStorage.getItem(key(user)) || "{}"); } catch { return {}; } }
function write(user, value) { try { localStorage.setItem(key(user), JSON.stringify(value)); } catch { /* Local array remains the fallback. */ } }
export function queueSavedQuestion(user, questionId, saved) {
  if (user === "guest") return;
  write(user, { ...read(user), [questionId]: { saved, revision: crypto.randomUUID() } });
}
export function syncSavedQuestions(session) {
  if (!session?.access_token) return Promise.resolve(null);
  const user = session.user.id;
  const next = (running.get(user) || Promise.resolve()).catch(() => {}).then(() => performSync(session));
  running.set(user, next);
  const cleanup = () => { if (running.get(user) === next) running.delete(user); };
  next.then(cleanup, cleanup);
  return next;
}
async function performSync(session) {
  if (!session?.access_token) return null;
  const user = session.user.id;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` };
  for (const [id, change] of Object.entries(read(user))) {
    const response = await fetch(apiUrl(`/account/saved-questions/${id}`), { method: "PUT", headers, signal: AbortSignal.timeout(15000), body: JSON.stringify({ testVersion: DEFAULT_TEST_VERSION, saved: change.saved }) });
    if (!response.ok) throw new Error("Cloud sync unavailable");
    const current = read(user);
    if (current[id]?.revision === change.revision) { delete current[id]; write(user, current); }
  }
  const response = await fetch(apiUrl("/account/saved-questions"), { headers, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Cloud sync unavailable");
  const records = await response.json();
  const indexFor = id => civicsQuestionBank.findIndex(question => question.questionId === Number(id));
  const saved = new Set(records.filter(record => record.test_version === DEFAULT_TEST_VERSION && record.saved).map(record => indexFor(record.question_id)));
  for (const [id, change] of Object.entries(read(user))) { if (change.saved) saved.add(indexFor(id)); else saved.delete(indexFor(id)); }
  return [...saved].filter(index => index >= 0);
}
import { apiUrl } from "./api.js";
