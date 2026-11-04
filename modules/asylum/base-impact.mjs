import expansion from './card-expansion.json' with {type:'json'};
export const baseImpactIds=new Set(['IMMIGRA_ASYLUM_REFLECT_107','IMMIGRA_ASYLUM_REFLECT_108_V2'].flatMap(id=>expansion[id]||[id]));
export const impactWarning={es:'La siguiente pregunta trata sobre efectos físicos o emocionales y puede resultar difícil. No necesitas compartir diagnósticos ni detalles íntimos. Puedes omitirla y continuar la entrevista. Continuar solo autoriza esta pregunta; después también puedes omitir o pausar.',en:'The next question concerns physical or emotional effects and may be difficult. You do not need to share diagnoses or intimate details. You can skip it and continue the interview. Continuing only allows this question; you can still skip or pause afterward.'};
export function gateBaseImpact(selection,locale){
 const q=selection.question;
 if(!q||!baseImpactIds.has(q.conceptId||q.id))return selection;
 return {...selection,question:{...q,kind:'impact_consent',english:impactWarning[locale==='es'?'es':'en'],pendingImpact:q}};
}
