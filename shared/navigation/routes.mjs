export const moduleFromHash=hash=>String(hash||'').replace(/^#\//,'').split('/')[0];
export const moduleHash=id=>'#/'+(['citizenship','asylum','residency','account','preparation','help','profile','settings'].includes(id)?id:'');
