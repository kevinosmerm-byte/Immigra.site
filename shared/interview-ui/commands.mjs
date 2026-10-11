// Commands are deliberately exact; a narrative containing these words is an answer.
export function isNextQuestionCommand(value=''){
 const text=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?¡!.,]/g,'').trim().replace(/\s+/g,' ');
 return /^(?:(?:por favor|please) )?(?:siguiente(?: pregunta)?|(?:pasa|pasar|pasemos) (?:a )?(?:la )?siguiente(?: pregunta)?|(?:omitir|saltar|salta)(?: (?:esta|la))?(?: pregunta)?|next(?: question)?|skip(?: (?:this|the))?(?: question)?)(?: (?:por favor|please))?$/.test(text);
}
