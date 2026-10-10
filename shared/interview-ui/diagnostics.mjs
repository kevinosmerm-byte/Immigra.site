const phases=new Set(['SPEAKING_QUESTION','LISTENING','USER_SPEAKING','TURN_COMPLETE','TRANSCRIBING','EVALUATING','SPEAKING_FEEDBACK','SPEAKING_NEXT_QUESTION','MIC_PERMISSION_GRANTED','MIC_AUDIO_CAPTURED','OPENAI_SESSION_CREATED','REALTIME_CONNECTED','USER_AUDIO_RECEIVED','USER_TURN_COMPLETED','AI_RESPONSE_RECEIVED','AI_AUDIO_PLAYING','EVALUATION_REQUESTED','EVALUATION_COMPLETED','INTERVIEW_ERROR']);
const codes=new Set(['STALE_QUESTION','INTERVIEW_COMPLETE','AUTHENTICATION_REQUIRED','GUEST_SESSION_EXPIRED','MICROPHONE_TIMEOUT','MICROPHONE_DENIED','MICROPHONE_DISCONNECTED','VOICE_UNSUPPORTED','PLAYBACK_BLOCKED','CONNECTION_LOST','CONNECTION_TIMEOUT','CONNECTION_FAILED','TRANSCRIPTION_FAILED','PROVIDER_UNAVAILABLE','PROVIDER_LIMIT','PROVIDER_AUTH_FAILED','PROVIDER_ACCESS_DENIED','PROVIDER_BAD_REQUEST','INVALID_PROVIDER_SESSION','INVALID_EVALUATION','UNGROUNDED_EVALUATION','INCOMPLETE_EVALUATION','AI_NOT_CONFIGURED','DAILY_LIMIT','QUOTA_UNAVAILABLE','SESSION_EXPIRED','SESSION_LIMIT','TURN_IN_PROGRESS','INVALID_INPUT','INVALID_SETTINGS','UNKNOWN_ERROR','HANGUP_FAILED']);
export function safeDiagnostic(phase,metadata={}){
 if(!phases.has(phase))return null;
 const result={phase};
 if(['citizenship','asylum','residency'].includes(metadata.module))result.module=metadata.module;
 if(['text','voice'].includes(metadata.transport))result.transport=metadata.transport;
 if(codes.has(metadata.code))result.code=metadata.code;
 if(Number.isInteger(metadata.status)&&metadata.status>=100&&metadata.status<=599)result.status=metadata.status;
 return result;
}
export function logDiagnostic(phase,metadata){const value=safeDiagnostic(phase,metadata);if(value)console.info('[interview]',JSON.stringify(value));}
