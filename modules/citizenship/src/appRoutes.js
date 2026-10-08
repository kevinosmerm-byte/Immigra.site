export const APP_SCREENS = Object.freeze([
  "home", "practice", "uscisTracker", "immigrationHelp", "profile", "settings",
  "civicProfile", "pro", "podcasts", "civicsGuide", "quiz", "vocabulary",
  "choose", "connect", "civics", "english", "reading", "writing", "coach",
  "uscisSandbox", "progress", "interview",
]);

export function readAppRoute(hash = "") {
  const [path, query = ""] = String(hash).replace(/^#/, "").split("?");
  const screen = path === "privacy" ? "settings" : APP_SCREENS.includes(path) ? path : "home";
  const mode = new URLSearchParams(query).get("mode");
  return {screen, interviewMode: ["n400", "civics", "full"].includes(mode) ? mode : "full"};
}

export function appRouteHash(screen, mode) {
  const safeScreen = APP_SCREENS.includes(screen) ? screen : "home";
  return "#" + safeScreen + (safeScreen === "interview" && ["n400", "civics", "full"].includes(mode) ? "?mode=" + mode : "");
}
