const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function harness(){
 const elements=Object.fromEntries(['master-answer','voice-status','mic-start','voice-repeat','voice-stop'].map(id=>[id,{value:'',textContent:'',setAttribute(){},dispatchEvent(){}}]));
 const spoken=[],recognizers=[];let aborted=0;
 class Recognition{constructor(){recognizers.push(this)}start(){this.onstart?.()}abort(){aborted++}stop(){this.onend?.()}}
 const win={SpeechRecognition:Recognition,addEventListener(){},speechSynthesis:{speak(u){spoken.push(u);u.onstart?.()},cancel(){}}};
 const doc={getElementById:id=>elements[id],addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(fs.readFileSync('apps/web/interview-voice.js','utf8'),{window:win,document:doc,SpeechSynthesisUtterance:class{constructor(text){this.text=text}},Event:class{},setTimeout:()=>1,clearTimeout(){}});
 return {win,elements,spoken,recognizers,aborted:()=>aborted};
}
test('question reads automatically then microphone starts only after speech ends',()=>{const h=harness();h.win.AsiloVoice.mount({question:'Pregunta',language:'es',microphone:true,video(){}});assert.equal(h.spoken.length,1);assert.equal(h.recognizers.length,0);h.spoken[0].onend();assert.equal(h.recognizers.length,1);assert.equal(h.recognizers[0].lang,'es-ES')});
test('no microphone consent means no recognition',()=>{const h=harness();h.win.AsiloVoice.mount({question:'Question',language:'en',microphone:false,video(){}});h.spoken[0].onend();h.elements['mic-start'].onclick();assert.equal(h.recognizers.length,0)});
test('final transcript is editable text and late results cannot cross navigation',()=>{const h=harness();h.win.AsiloVoice.mount({question:'Question',language:'en',microphone:true,video(){}});h.spoken[0].onend();const r=h.recognizers[0];const handler=r.onresult;const result=[{transcript:'A fictional answer'}];result.isFinal=true;handler({resultIndex:0,results:[result]});assert.equal(h.elements['master-answer'].value,'A fictional answer');h.win.AsiloVoice.mount(null);assert.equal(h.aborted(),1);h.elements['master-answer'].value='';handler({resultIndex:0,results:[result]});assert.equal(h.elements['master-answer'].value,'')});
test('repeating cancels old speech callbacks and stop prevents microphone start',()=>{const h=harness();h.win.AsiloVoice.mount({question:'Question',language:'en',microphone:true,video(){}});h.elements['voice-repeat'].onclick();h.spoken[0].onend();assert.equal(h.recognizers.length,0);h.elements['voice-stop'].onclick();h.spoken[1].onend();assert.equal(h.recognizers.length,0)});
