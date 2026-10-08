export function comparePracticeReports(reports=[]){
 const valid=reports.filter(r=>r?.engine==='residency'&&r.educationalOnly===true);
 return {sessions:valid.length,trend:valid.map((r,index)=>({session:index+1,answered:r.answered||0,clarifications:r.observations?.length||0})),notice:'Counts describe practice activity, not eligibility or credibility.'};
}
