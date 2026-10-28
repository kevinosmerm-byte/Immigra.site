import {interviewTestingEnabled} from '../../shared/interview-ui/access-policy.mjs';
// Testing removes the personal allowance, never the shared paid-usage ceiling.
export async function reserveInterviewAccess({id,bucket,limit,globalLimit,reserve,env={}}){
 const testing=interviewTestingEnabled(env);
 if((testing||id.startsWith('guest:'))&&!await reserve('public-interviews-global',bucket+'-public',globalLimit))return false;
 return testing?true:reserve(id,bucket,limit);
}
