export const ENGINES=Object.freeze({
 citizenship:{id:'citizenship',status:'native_integrated_development',accent:'#173D76',capabilities:['civics','n400'],dataBoundary:'citizenship'},
 asylum:{id:'asylum',status:'native_integrated_development',accent:'#6741A5',capabilities:['asylum_interview'],dataBoundary:'asylum'},
 residency:{id:'residency',status:'prototype',accent:'#176B4D',capabilities:['written','realtime','report'],dataBoundary:'residency'}
});
export function engineStatus(id){return Object.hasOwn(ENGINES,id)?ENGINES[id]:null}
export function assertEngineScope(engine,record){if(!Object.hasOwn(ENGINES,engine)||record?.engine!==engine)throw Error('Cross-engine access denied');return true}
export function routeFor(engine){return Object.hasOwn(ENGINES,engine)?'/'+engine:null}
