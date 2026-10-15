export function createAccountDeletionHandler({cancelWebRenewal,removeAccount}){
 return async(req,res)=>{
  if(req.body?.confirmation!=="DELETE")return res.status(400).json({code:'deletion_confirmation_required'});
  try{
   await cancelWebRenewal(req.account.userId);
   await removeAccount(req.account.userId);
   res.set('Cache-Control','no-store');return res.json({deleted:true});
  }catch{return res.status(503).json({code:'deletion_unavailable',error:'Could not complete deletion. Your request may be retried or sent to privacy support.'});}
 };
}
