import {readAppRoute as originalRead,appRouteHash as originalHash} from './src/appRoutes.js';
export const readAppRoute=hash=>originalRead(String(hash||'').replace(/^#\/citizenship\/?/,'#'));
export const appRouteHash=(screen,mode)=>'#/citizenship/'+originalHash(screen,mode).slice(1);
