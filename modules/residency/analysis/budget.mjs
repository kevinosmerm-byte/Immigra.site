export const LIMITS=Object.freeze({maxSessionSeconds:600,maxTurns:150,maxCaptionChars:200000,maxConcurrentSessionsPerUser:1});
export function withinBudget({elapsedSeconds=0,turns=0,captionChars=0}={}){return [elapsedSeconds,turns,captionChars].every(n=>Number.isFinite(n)&&n>=0)&&elapsedSeconds<LIMITS.maxSessionSeconds&&turns<LIMITS.maxTurns&&captionChars<LIMITS.maxCaptionChars}
// Contract only: not wired to the local demo gateway. Not production authentication.
export function validateAccess({authenticated=false,entitled=false,consented=false}={}){return authenticated===true&&entitled===true&&consented===true}
