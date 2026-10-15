import {authCallbackKind} from '../authentication/callback.mjs';
export const moduleFromHash=(hash,search='')=>authCallbackKind({hash:String(hash||''),search})?'account':String(hash||'').replace(/^#\//,'').split('/')[0];
export const moduleHash=id=>'#/'+(['citizenship','asylum','residency','account','preparation','help','profile','settings'].includes(id)?id:'');
