// In-memory session vault only. Never use localStorage for immigration documents.
export function createVault(ownerId){if(!ownerId)throw Error('Owner required');return {ownerId,records:[]}}
export function addVaultRecord(vault,{ownerId,record}){
 if(!vault||vault.ownerId!==ownerId||record?.engine!=='residency')throw Error('Access denied');
 if(vault.records.length>=20)throw Error('Document limit');
 return {...vault,records:[...vault.records,{...structuredClone(record),id:`doc-${vault.records.length+1}`}]};
}
export function listVault(vault,ownerId){if(!vault||!ownerId||vault.ownerId!==ownerId)throw Error('Access denied');return vault.records.map(({id,type,name,verified})=>({id,type,name,verified}))}
export function deleteVault(vault,ownerId){if(!vault||!ownerId||vault.ownerId!==ownerId)throw Error('Access denied');return createVault(ownerId)}
