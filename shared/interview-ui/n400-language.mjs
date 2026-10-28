import promptsEs from './n400-prompts.es.json' with {type:'json'};
import followupsEs from './n400-followups.es.json' with {type:'json'};
export function n400PracticeBank(bank,locale){
 return locale==='es'?{...bank,interviewArchitecture:{...bank.interviewArchitecture,transitionScripts:{}},questions:bank.questions.map(q=>({...q,canonicalPracticePrompt:promptsEs[q.id],alternatePhrasings:[],followUps:q.followUps.map(text=>followupsEs[text])}))}:bank;
}
