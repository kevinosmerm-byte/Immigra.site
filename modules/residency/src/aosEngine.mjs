import bank from '../data/preguntas_ajuste_estatus_300.json' with {type:'json'};
export const aosQuestions=bank.preguntas;
export const aosRoutes={MATRIMONIO:'Cónyuge',HIJO_A_PADRES:'Hijo/a ciudadano/a pide a padre o madre',PADRES_A_HIJOS:'Padre o madre pide a hijo/a'};
export function difficulty(q){return q.dificultad==='Fácil'?0:q.dificultad==='Moderada'?1:2;}
export function selectAosQuestions({route,count=12,petitionerStatus='unknown',age='unknown',marital='unknown',random=Math.random}){
 if(!aosRoutes[route]||!Number.isInteger(count)||count<3||count>100)throw Error('Invalid setup');
 const pool=aosQuestions.filter(q=>q.ruta===route&&!(petitionerStatus==='resident'&&/Cómo obtuvo.*ciudadanía|prueba de ciudadanía/i.test(q.pregunta_es)));
 // Round-robin topics within each difficulty, then reserve questions from all levels.
 const levels=[0,1,2].map(level=>{
  const blocks=new Map();for(const q of pool.filter(q=>difficulty(q)===level)){if(!blocks.has(q.bloque))blocks.set(q.bloque,[]);blocks.get(q.bloque).push(q);}
  const relevance=group=>{const text=group[0].bloque;return (age!=='unknown'&&/Identidad|categoría/.test(text)?2:0)+(marital!=='unknown'&&/civil|Matrimonio/.test(text)?1:0);};
  const groups=[...blocks.values()].sort((a,b)=>relevance(b)-relevance(a));const offset=(level*3)%groups.length;const rotated=[...groups.slice(offset),...groups.slice(0,offset)];
  const ordered=[];while(rotated.some(a=>a.length))for(const group of rotated)if(group.length)ordered.push(group.splice(Math.floor(random()*group.length),1)[0]);return ordered;
 });
 const quota=[Math.ceil(count/3),Math.floor(count/3),Math.floor(count/3)];quota[2]=count-quota[0]-quota[1];
 const chosen=levels.map((level,i)=>level.slice(0,quota[i]));
 let missing=Math.min(count,pool.length)-chosen.flat().length;
 for(let i=0;i<3&&missing;i++){const extra=levels[i].slice(chosen[i].length,chosen[i].length+missing);chosen[i].push(...extra);missing-=extra.length;}
 return chosen.flat();
}
export function isUncertain(text){return /no recuerdo|no estoy segur|necesito revisar|no sé|no se\b|not sure|don't remember/i.test(text);}
