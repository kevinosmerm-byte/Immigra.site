// Temporary production access requested by the owner. Does not grant account or billing access.
export const TEMPORARY_PUBLIC_INTERVIEWS = true;

// Temporary owner-requested testing; server can restore personal quotas immediately.
export const TEMPORARY_INTERVIEW_TESTING = true;
export const interviewTestingEnabled = (env={}) => TEMPORARY_INTERVIEW_TESTING && env.INTERVIEW_TEST_ACCESS !== "false";
