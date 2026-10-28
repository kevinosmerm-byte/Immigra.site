import translations from './ui.en.json' with {type:'json'};
// Translate only author-written template segments. Interpolated user content is untouched.
const escapeRegExp=text=>text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp(Object.keys(translations).sort((a,b)=>b.length-a.length).map(escapeRegExp).join('|'),'g');
export function translateAsylumStatic(text,locale){return locale==='en'?text.replace(pattern,key=>translations[key]):text;}
export function createAsylumHtml(getLocale){return (parts,...values)=>parts.reduce((out,part,i)=>out+translateAsylumStatic(part,getLocale())+(i<values.length?values[i]:''),'');}
