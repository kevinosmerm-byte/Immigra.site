import test from 'node:test';
import assert from 'node:assert/strict';
import {createInterviewAIEngine} from '../shared/interview-ui/InterviewAIEngine.mjs';
const settings={module:'asylum',locale:'es',consent:true,transport:'voice'};
function fixture({evaluateTurn,disconnectGraceMs}={}){
 const tracks=[{enabled:true,stop(){this.stopped=true;}}],stream={getTracks:()=>tracks,getAudioTracks:()=>tracks},states=[],captions=[],reviews=[],requests=[],errors=[],diagnostics=[];let peer,micCalls=0;
 class Peer{constructor(){peer=this;}addTrack(){}createDataChannel(){this.channel={readyState:'open',sent:[],send(s){this.sent.push(JSON.parse(s));},close(){}};return this.channel;}async createOffer(){return {sdp:'v=0\r\noffer'};}async setLocalDescription(){}async setRemoteDescription(){this.channel.onopen();}close(){this.closed=true;}}
 class Audio{play(){return Promise.resolve();}pause(){}}
 const env={RTCPeerConnection:Peer,Audio,navigator:{mediaDevices:{getUserMedia:async()=>{micCalls++;return stream;}}}};
 const fetchImpl=async(url,options)=>{requests.push({url,options});return options.method==='DELETE'?new Response(null,{status:204}):Response.json(url.endsWith('/turn')?{suggested_follow_up:'Which year?',educational_feedback:'Please clarify.',provider:'OpenAI'}:{id:'test',sdp:'v=0\r\nanswer',expires_at:Date.now()+600000});};
 const engine=createInterviewAIEngine({env,fetchImpl,evaluateTurn,disconnectGraceMs,onState:x=>states.push(x),onCaption:x=>captions.push(x),onEvaluation:x=>reviews.push(x),onError:x=>errors.push(x),onDiagnostic:(phase,data)=>diagnostics.push({phase,...data})});
 return {engine,env,fetchImpl,tracks,stream,states,captions,reviews,requests,errors,diagnostics,peer:()=>peer,micCalls:()=>micCalls};
}
const drain=()=>new Promise(resolve=>setImmediate(resolve));
test('consent precedes microphone and paid network access',async()=>{const f=fixture();assert.equal(await f.engine.start({...settings,consent:false}),false);assert.equal(f.micCalls(),0);assert.equal(f.requests.length,0);});
test('automatic voice uses server SDP, active mic, interruption, and real event states',async()=>{const f=fixture();await f.engine.start(settings);const dc=f.peer().channel;assert.equal(f.tracks[0].enabled,false);assert.equal(f.requests[0].url,'/api/interview/sessions');assert.ok(!f.requests.some(r=>r.url.includes('openai.com')));dc.onmessage({data:JSON.stringify({type:'output_audio_buffer.started'})});assert.equal(f.states.at(-1),'speaking');dc.onmessage({data:JSON.stringify({type:'input_audio_buffer.speech_started',item_id:'u'})});assert.equal(f.states.at(-1),'listening');f.engine.close();assert.equal(f.tracks[0].stopped,true);assert.ok(f.requests.some(r=>r.options.method==='DELETE'));});
test('delayed transcription is evaluated against the question at speech start',async()=>{const f=fixture();await f.engine.start(settings);await drain();const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});emit({type:'response.output_audio_transcript.done',item_id:'q1',transcript:'When?'});emit({type:'input_audio_buffer.speech_started',item_id:'u1'});emit({type:'response.output_audio_transcript.done',item_id:'q2',transcript:'Where?'});emit({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'2022'});emit({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'2022'});await drain();const requests=f.requests.filter(r=>r.url.endsWith('/turn'));assert.equal(requests.length,2);assert.equal(JSON.parse(requests[1].options.body).question,'Which year?');f.engine.close();});
test('text mode never requests microphone and uses same session for each turn',async()=>{const f=fixture();await f.engine.start({...settings,transport:'text'});assert.equal(f.micCalls(),0);assert.equal(f.engine.sendText('My son'),true);await drain();assert.equal(f.requests.filter(r=>r.url==='/api/interview/sessions').length,1);assert.equal(f.reviews.at(-1).answer,'My son');f.engine.close();});
test('late permission resolution after close releases tracks without connecting',async()=>{const f=fixture();let release;f.env.navigator.mediaDevices.getUserMedia=()=>new Promise(r=>release=r);const pending=f.engine.start(settings);f.engine.close();release(f.stream);assert.equal(await pending,false);assert.equal(f.tracks[0].stopped,true);assert.equal(f.requests.length,0);});
test('pause stops mic and output and blocks text; resumed microphone preserves mute',async()=>{const f=fixture();await f.engine.start(settings);await drain();f.peer().channel.onmessage({data:JSON.stringify({type:'output_audio_buffer.stopped'})});f.engine.pause(true);assert.equal(f.tracks[0].enabled,false);assert.equal(f.engine.sendText('No'),false);f.engine.pause(false);assert.equal(f.tracks[0].enabled,true);f.engine.toggleMic();f.engine.pause(true);f.engine.pause(false);assert.equal(f.tracks[0].enabled,false);f.engine.close();});

test('phase logs require provider evidence, not just an open microphone',async()=>{
 const f=fixture();await f.engine.start(settings);
 assert.ok(f.diagnostics.some(x=>x.phase==='MIC_PERMISSION_GRANTED'));
 assert.ok(!f.diagnostics.some(x=>x.phase==='MIC_AUDIO_CAPTURED'));
 const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 emit({type:'input_audio_buffer.speech_started',item_id:'u'});
 assert.ok(f.diagnostics.some(x=>x.phase==='USER_AUDIO_RECEIVED'));
 assert.ok(!f.diagnostics.some(x=>x.phase==='AI_AUDIO_PLAYING'));
 emit({type:'input_audio_buffer.committed',item_id:'u'});
 emit({type:'conversation.item.input_audio_transcription.completed',item_id:'u',transcript:'Fictional detail'});
 await drain();assert.ok(f.diagnostics.some(x=>x.phase==='EVALUATION_COMPLETED'));
 assert.ok(!JSON.stringify(f.diagnostics).includes('Fictional detail'));
 f.engine.close();
});
test('streamless remote audio track is attached and playback rejection is reported',async()=>{
 const f=fixture();let played,remote;
 f.env.MediaStream=class{constructor(tracks){this.tracks=tracks;}};
 f.env.Audio=class{constructor(){remote=this;}play(){played=true;return Promise.reject(Error('blocked'));}pause(){}};
 await f.engine.start(settings);const track={kind:'audio'};f.peer().ontrack({streams:[],track});await drain();
 assert.equal(played,true);assert.equal(remote.srcObject.tracks[0],track);assert.ok(f.errors.includes('PLAYBACK_BLOCKED'));
 assert.ok(!f.diagnostics.some(x=>x.phase==='AI_AUDIO_PLAYING'));f.engine.close();
});

test('one microphone stream; only final transcripts evaluate once; feedback precedes next question without echo',async()=>{
 let evaluations=0;
 const f=fixture({evaluateTurn:async({answer})=>{if(answer)evaluations++;return {educational_feedback:answer?'Correct.':'',next_question:'Next official question?',suggested_follow_up:'Next official question?',question_id:'2',provider:'official-bank'};}});
 await f.engine.start({...settings,module:'citizenship',domain:'civics'});await drain();
 const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 emit({type:'output_audio_buffer.started'});assert.equal(f.tracks[0].enabled,false);
 emit({type:'output_audio_buffer.stopped'});assert.equal(f.tracks[0].enabled,true);
 emit({type:'input_audio_buffer.speech_started',item_id:'answer1'});
 emit({type:'conversation.item.input_audio_transcription.delta',item_id:'answer1',delta:'The'});await drain();assert.equal(evaluations,0);
 emit({type:'input_audio_buffer.committed',item_id:'answer1'});
 const final={type:'conversation.item.input_audio_transcription.completed',item_id:'answer1',transcript:'The Constitution.'};emit(final);emit(final);await drain();
 assert.equal(evaluations,1);assert.equal(f.micCalls(),1);assert.equal(f.tracks[0].enabled,false);
 emit({type:'output_audio_buffer.started'});assert.ok(f.diagnostics.some(d=>d.phase==='SPEAKING_FEEDBACK'));
 emit({type:'output_audio_buffer.stopped'});assert.equal(f.tracks[0].enabled,false);
 emit({type:'output_audio_buffer.started'});assert.ok(f.diagnostics.some(d=>d.phase==='SPEAKING_NEXT_QUESTION'));
 emit({type:'output_audio_buffer.stopped'});assert.equal(f.tracks[0].enabled,true);
 assert.equal(f.requests.filter(r=>r.url.endsWith('/turn')).length,0);
 f.engine.close();
});

test('recovered provider error clears while an unresolved evaluation remains visible',async()=>{
 let fail=false;
 const f=fixture({evaluateTurn:async()=>{if(fail)throw Error('EVALUATION_UNAVAILABLE');return {next_question:'Your name?',suggested_follow_up:'Your name?'};}});
 await f.engine.start({...settings,module:'citizenship'});await drain();
 const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 emit({type:'error',error:{code:'temporary_error'}});
 assert.equal(f.errors.at(-1),'AI_SPEECH_FAILED');
 emit({type:'response.done',response:{status:'completed'}});
 assert.equal(f.errors.at(-1),'');
 fail=true;
 emit({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'Test'});await drain();
 assert.equal(f.errors.at(-1),'EVALUATION_UNAVAILABLE');
 emit({type:'response.done',response:{status:'completed'}});
 assert.equal(f.errors.at(-1),'EVALUATION_UNAVAILABLE');
 fail=false;f.engine.retryEvaluation();await drain();
 assert.equal(f.errors.at(-1),'');assert.equal(f.reviews.length,1);
 f.engine.close();
});

test('successful transcription does not conceal blocked audio; playing clears it',async()=>{
 const f=fixture();let remote;
 f.env.Audio=class{constructor(){remote=this;}play(){return Promise.reject(Error('blocked'));}pause(){}};
 await f.engine.start(settings);await drain();
 const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 f.peer().ontrack({streams:[f.stream]});await drain();
 emit({type:'conversation.item.input_audio_transcription.failed'});
 assert.equal(f.errors.at(-1),'TRANSCRIPTION_FAILED');
 emit({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'Test'});await drain();
 assert.equal(f.errors.at(-1),'PLAYBACK_BLOCKED');
 remote.onplaying();assert.equal(f.errors.at(-1),'');f.engine.close();
});

test('N400 speech failure releases microphone and retries speech without repeating evaluation',async()=>{
 let calls=0;
 const f=fixture({evaluateTurn:async({answer})=>{calls++;return {next_question:answer?'Have you used another name?':'What name do you use legally?',suggested_follow_up:'Continue',educational_feedback:answer?'Your answer is clear.':''};}});
 await f.engine.start({...settings,module:'citizenship'});await drain();
 const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 emit({type:'output_audio_buffer.stopped'});
 emit({type:'conversation.item.input_audio_transcription.completed',item_id:'u1',transcript:'Ana Example'});await drain();
 assert.equal(f.reviews.length,1);assert.equal(f.tracks[0].enabled,false);
 emit({type:'response.done',response:{status:'failed'}});
 assert.equal(f.tracks[0].enabled,true);assert.equal(f.errors.at(-1),'AI_SPEECH_FAILED');
 f.engine.retryEvaluation();assert.equal(calls,2);assert.equal(f.tracks[0].enabled,false);
 emit({type:'response.done',response:{status:'completed'}});emit({type:'output_audio_buffer.stopped'});
 const speech=f.peer().channel.sent.filter(m=>m.type==='response.create').at(-1);
 assert.match(speech.response.instructions,/Have you used another name/);
 emit({type:'output_audio_buffer.stopped'});assert.equal(f.tracks[0].enabled,true);
 assert.equal(f.errors.at(-1),'');assert.equal(f.reviews.length,1);f.engine.close();
});


test('cleared audio reopens mic except while an evaluation is pending',async()=>{
 let release;const f=fixture({evaluateTurn:async({answer})=>answer?new Promise(r=>release=r):{next_question:'Name?',suggested_follow_up:'Name?'}});
 await f.engine.start({...settings,module:'citizenship'});await drain();const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 emit({type:'output_audio_buffer.cleared'});assert.equal(f.tracks[0].enabled,true);
 emit({type:'conversation.item.input_audio_transcription.completed',item_id:'u',transcript:'Ana Example'});await drain();
 emit({type:'output_audio_buffer.cleared'});assert.equal(f.tracks[0].enabled,false);
 release({next_question:'Another name?',suggested_follow_up:'Another name?'});await drain();
 emit({type:'response.done',response:{status:'completed',output:[]}});assert.equal(f.tracks[0].enabled,true);assert.equal(f.errors.at(-1),'AI_SPEECH_FAILED');
 f.engine.close();
});

test('mobile transient disconnect preserves the session and microphone',async()=>{
 const f=fixture({disconnectGraceMs:20});await f.engine.start(settings);await drain();
 const peer=f.peer();peer.connectionState='disconnected';peer.onconnectionstatechange();
 assert.equal(peer.closed,undefined);assert.ok(!f.errors.includes('CONNECTION_LOST'));
 peer.connectionState='connected';peer.onconnectionstatechange();
 await new Promise(r=>setTimeout(r,30));assert.equal(peer.closed,undefined);assert.equal(f.micCalls(),1);f.engine.close();
});
test('sustained disconnect still reports a real error and releases audio',async()=>{
 const f=fixture({disconnectGraceMs:10});await f.engine.start(settings);await drain();
 f.peer().connectionState='disconnected';f.peer().onconnectionstatechange();
 await new Promise(r=>setTimeout(r,20));assert.equal(f.errors.at(-1),'CONNECTION_LOST');assert.equal(f.tracks[0].stopped,true);
});
test('confirmed new output clears stale speech failure without hiding evaluation errors',async()=>{
 const f=fixture();await f.engine.start(settings);await drain();const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 emit({type:'response.done',response:{status:'failed'}});assert.equal(f.errors.at(-1),'AI_SPEECH_FAILED');
 emit({type:'output_audio_buffer.started'});assert.equal(f.errors.at(-1),'');f.engine.close();
});

test('late second VAD fragment cannot evaluate the next question or block further answers',async()=>{
 const calls=[];let release;
 const f=fixture({evaluateTurn:async request=>{calls.push(request);if(!request.answer)return {next_question:'First?',question_id:'q1'};if(request.answer==='first fragment')await new Promise(r=>release=r);return {next_question:'Second?',question_id:'q2',educational_feedback:'Clear.'};}});
 await f.engine.start(settings);await drain();const emit=m=>f.peer().channel.onmessage({data:JSON.stringify(m)});
 emit({type:'output_audio_buffer.stopped'});
 for(const id of ['a','b'])emit({type:'input_audio_buffer.speech_started',item_id:id});
 emit({type:'input_audio_buffer.committed',item_id:'a'});assert.equal(f.tracks[0].enabled,false);
 emit({type:'conversation.item.input_audio_transcription.completed',item_id:'a',transcript:'first fragment'});await drain();
 emit({type:'conversation.item.input_audio_transcription.completed',item_id:'b',transcript:'late fragment'});
 release();await drain();await drain();
 assert.equal(calls.filter(x=>x.answer).length,1);assert.equal(f.reviews.length,1);assert.ok(!f.errors.includes('STALE_QUESTION'));
 emit({type:'output_audio_buffer.stopped'});emit({type:'output_audio_buffer.stopped'});
 assert.equal(f.tracks[0].enabled,true);assert.equal(f.engine.sendText('answer to second'),true);await drain();assert.equal(calls.at(-1).questionId,'q2');f.engine.close();
});
