export function createFamilyProfile({ownerId,profileId,consent=false}={}){
 if(!ownerId||!profileId||consent!==true)throw Error('Owner, profile and consent required');
 return {ownerId,profileId,engine:'residency',sharing:false};
}
export function canShareProfile(profile,{requesterId,recipientConsented=false}={}){
 return !!requesterId&&profile?.engine==='residency'&&profile.ownerId===requesterId&&profile.sharing===true&&recipientConsented===true;
}
