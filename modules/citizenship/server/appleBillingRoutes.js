import {Router} from 'express';
import {requireAccount,requireVerifiedAccount,isPracticePolicyReady} from './accountService.js';
import {appleBillingConfiguration,syncAppleSubscription,handleAppleNotification} from './appleBilling.js';
const router=Router();
router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/status',(_req,res)=>res.json(appleBillingConfiguration()));
router.post('/notifications',async(req,res)=>{
  try{return res.json(await handleAppleNotification(req.body?.signedPayload));}
  catch(error){return res.status(error.status===400?400:503).json({code:'apple_notification_unavailable'});}
});
router.post('/sync',requireAccount,requireVerifiedAccount,async(req,res)=>{
  try {
    if (!await isPracticePolicyReady()) return res.status(503).json({code:'access_policy_unavailable'});
    return res.json(await syncAppleSubscription(req.account.userId,req.body?.signedTransaction));
  } catch(error) {
    return res.status([400,403,409,503].includes(error.status)?error.status:503).json({code:error.code || 'apple_verification_unavailable'});
  }
});
export default router;
