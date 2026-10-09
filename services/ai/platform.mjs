import {app as citizenship} from '../../modules/citizenship/server/server.js';
import {requireAccount,getUsageSnapshot} from '../../modules/citizenship/server/accountService.js';
import {createPlatformRouter} from './router.mjs';
export const app=createPlatformRouter({citizenship,requireAccount,getUsageSnapshot,env:process.env});
