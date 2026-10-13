// User-approved higher-quality Sahara videos, shared across all interview modules.
export function interviewerMediaBase(name,requestedBase,baseUrl='/'){
 return /^(sarah|sahara)$/i.test(name)?`${baseUrl}interviewer/`:requestedBase||`${baseUrl}interviewer/`;
}
