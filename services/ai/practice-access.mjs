import { randomUUID } from 'node:crypto';
import { isVerifiedPracticeAccess } from '../../modules/citizenship/shared/trialPolicy.js';

// This authority is the Immigra account database, never another application's PRO flag.
export function createPracticeAccess({ getPracticeAccess, startAiSession, finishAiSession }) {
  return async (req, res, next) => {
    try {
      let access = await getPracticeAccess(req.account.userId);
      if (access?.status === 'not_started') {
        const result = await startAiSession({userId:req.account.userId, feature:'realInterview', idempotencyKey:randomUUID()});
        access = result?.access;
        if (result?.sessionId) await finishAiSession({userId:req.account.userId,sessionId:result.sessionId,outcome:'auto'});
      }
      if (!isVerifiedPracticeAccess(access)) return res.status(403).json({error:'TRIAL_EXPIRED',code:'trial_expired'});
      req.practiceAccess = access;
      return next();
    } catch { return res.status(503).json({error:'ACCESS_UNAVAILABLE',code:'access_check_unavailable'}); }
  };
}
