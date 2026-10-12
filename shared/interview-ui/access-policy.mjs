// Legacy flags disabled: all premium practice uses the first-use account trial.
export const TEMPORARY_PUBLIC_INTERVIEWS = false;

// Unlimited practice is time-based; technical burst protection remains.
export const TEMPORARY_INTERVIEW_TESTING = false;
export const interviewTestingEnabled = (env={}) => TEMPORARY_INTERVIEW_TESTING && env.INTERVIEW_TEST_ACCESS !== "false";
