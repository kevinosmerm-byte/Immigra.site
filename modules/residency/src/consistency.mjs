// Deterministic local date-review prototype. Never labels a user dishonest.
export const dateTopics=Object.freeze(['wedding','travel','household']);
export function findDateMentions(turns){
 const found=[];
 const re=/\b(?:20\d{2}|19\d{2})\b/g;
 for(const t of turns){
  if(t.speaker!=='applicant'||!t.questionId)continue;
  const years=[...t.text.matchAll(re)].map(m=>m[0]);
  if(years.length===1)found.push({questionId:t.questionId,year:years[0]});
 }
 return found;
}
export function neutralReview(turns,questionMap){
 const labels={wedding:['la boda','the wedding'],travel:['los viajes','travel'],household:['la vivienda','housing']};
 const grouped=new Map();
 for(const v of findDateMentions(turns)){
  const q=questionMap.get(v.questionId);
  if(!q||!dateTopics.includes(q.category))continue;
  const key=q.category;
  if(!grouped.has(key))grouped.set(key,new Set());
  grouped.get(key).add(v.year);
 }
 return [...grouped].filter(([_,years])=>years.size>1).map(([topic])=>({
  topic,kind:'clarification',severity:'unverified',
  prompt_es:`¿Podría describir la cronología de ${labels[topic][0]} con sus propias palabras? Puede referirse a eventos diferentes.`,
  prompt_en:`Could you describe the timeline of ${labels[topic][1]} in your own words? The dates may refer to different events.`
 }));
}
