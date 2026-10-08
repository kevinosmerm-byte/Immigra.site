export function detectBrowserCapabilities(env={}){
 return {secureContext:env.isSecureContext===true,microphone:!!env.mediaDevices?.getUserMedia,webRTC:typeof env.RTCPeerConnection==='function',speechRecognition:!!(env.SpeechRecognition||env.webkitSpeechRecognition),speechSynthesis:!!env.speechSynthesis};
}
export function readinessChecklist(){
 return ['Verify iOS Safari microphone permission and audio routing','Verify Android Chrome and Capacitor permissions','Test network drop/reconnect without duplicate sessions','Test accessibility keyboard, screen reader and reduced motion','Test server auth, entitlements and durable rate limits','Confirm privacy policy, retention and provider data handling','Run security review and real-provider E2E tests'];
}
