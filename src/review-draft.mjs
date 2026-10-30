// Draft-only until a server-owned moderation workflow is authorized and deployed.
export function reviewDraft({rating,comment,language='es',name=''}){
 const stars=Number(rating),body=String(comment||'').trim(),displayName=String(name||'').trim();
 if(!Number.isInteger(stars)||stars<1||stars>5||!body||body.length>500||displayName.length>40)return null;
 return {rating:stars,comment:body,language:['es','en','fr','pt','de'].includes(language)?language:'es',name:displayName};
}
