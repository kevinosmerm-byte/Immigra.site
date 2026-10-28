export const createNavigationHistory = (initialScreen = "home") => ({
  current: initialScreen,
  entries: [],
});

export const navigateForward = (state, nextScreen, { replace = false } = {}) => {
  if (!nextScreen || nextScreen === state.current) return state;
  return {
    current: nextScreen,
    entries: replace ? [...state.entries] : [...state.entries, state.current],
  };
};

export const navigateBack = (state, fallbackScreen = "home") => {
  const entries = [...state.entries];
  let previous = entries.pop();
  while (previous === state.current) previous = entries.pop();
  return {
    current: previous || fallbackScreen,
    entries,
  };
};
