import { useEffect, useRef, useState } from "react";

// Give learners time to read feedback, with a review pause and no transitions
// while recording, saving, hidden, or after the screen has been left.
export function useAutomaticAdvance({ enabled, turnKey, busy = false, onAdvance, delay = 2500 }) {
  const callback = useRef(onAdvance);
  const [pausedTurn, setPausedTurn] = useState(null);
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => { callback.current = onAdvance; });
  const paused = pausedTurn === turnKey;
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!enabled || busy || paused || !visible) return;
    const timer = setTimeout(() => { if (!document.hidden) callback.current(); }, delay);
    return () => clearTimeout(timer);
  }, [enabled, turnKey, busy, paused, visible, delay]);
  return { paused, pause: () => setPausedTurn(turnKey) };
}
