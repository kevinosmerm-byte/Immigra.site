// Original encouragement from IMMIGRA, not testimonials or user submissions.
export const messageLanguages=Object.freeze({es:{label:'Español',flag:'🇪🇸'},en:{label:'English',flag:'🇺🇸'},pt:{label:'Português',flag:'🇵🇹'},fr:{label:'Français',flag:'🇫🇷'},de:{label:'Deutsch',flag:'🇩🇪'},it:{label:'Italiano',flag:'🇮🇹'},ht:{label:'Kreyòl ayisyen',flag:'🇭🇹'}});
const copy={
 es:[
 'Una pregunta a la vez: hoy puedes empezar por la que más curiosidad te dé.',
 'No necesitas estudiar todo hoy. Un repaso breve también cuenta.',
 'Haz una pausa cuando la necesites; las preguntas seguirán aquí al volver.',
 'Prueba leer una pregunta en voz alta y después explicarla con tus palabras.',
 'Si una palabra es nueva para ti, dale un momento y vuelve a leerla con calma.',
 'Tu ritmo de estudio puede ser distinto al de otras personas. Encuentra el tuyo.',
 'Revisar algo que ya conoces también es una buena forma de practicar.',
 'Elige un pequeño objetivo para hoy y celebra el tiempo que le dediques.',
 ],
 en:[
 'Start with one question that interests you. There is no need to rush through the whole set.',
 'A short study break can help you return with fresh attention.',
 'Try saying the question aloud, then put its meaning into your own words.',
 'You can revisit the same card as often as you find useful.',
 'Give unfamiliar words a little extra time. Learning does not have to be a race.',
 'Choose a small study goal that fits the time you have today.',
 'Welcome back to your practice. Pick up with a question you want to explore.',
 ],
 pt:[
 'Comece por uma pergunta e leia com calma. Não é preciso fazer tudo de uma vez.',
 'Uma pausa também faz parte de uma rotina de estudo que respeita o seu ritmo.',
 'Experimente explicar a pergunta com suas próprias palavras.',
 'Reserve alguns minutos para uma palavra que você ainda está aprendendo.',
 'Você pode voltar às mesmas perguntas sempre que quiser revisar.',
 'Escolha um objetivo pequeno para hoje e valorize o tempo dedicado ao estudo.',
 'Seja bem-vindo ao seu momento de prática. Por qual tema você quer começar?',
 ],
 fr:[
 'Commencez par une question et prenez le temps de la lire tranquillement.',
 'Une courte pause peut vous aider à reprendre votre étude avec plus d’attention.',
 'Essayez de reformuler la question avec vos propres mots.',
 'Un mot nouveau mérite parfois une deuxième lecture, sans vous presser.',
 'Vous pouvez revenir sur les mêmes cartes pour les revoir à votre rythme.',
 'Choisissez un petit objectif adapté au temps dont vous disposez aujourd’hui.',
 'Bienvenue dans votre espace de préparation. Explorez le thème qui vous intéresse.',
 ],
 de:[
 'Beginne mit einer Frage und lies sie in Ruhe. Du musst nicht alles auf einmal lernen.',
 'Eine kurze Pause gehört zu einer Lernroutine, die zu dir passt.',
 'Versuche, die Frage mit deinen eigenen Worten zu erklären.',
 'Nimm dir für ein neues Wort etwas Zeit und lies den Satz noch einmal.',
 'Du kannst dieselbe Karte jederzeit zum Wiederholen öffnen.',
 'Setze dir für heute ein kleines Lernziel, das in deinen Alltag passt.',
 'Willkommen in deiner Lernzeit. Wähle ein Thema, das dich interessiert.',
 ],
 it:[
 'Inizia da una domanda e leggila con calma. Non devi affrontare tutto insieme.',
 'Una breve pausa può aiutarti a tornare allo studio con nuova attenzione.',
 'Prova a spiegare il significato della domanda con parole tue.',
 'Dedica un momento alle parole nuove e rileggi la frase senza fretta.',
 'Puoi tornare sulla stessa scheda ogni volta che vuoi ripassare.',
 'Scegli un piccolo obiettivo di studio adatto al tempo che hai oggi.',
 'Benvenuto nel tuo spazio di preparazione. Da quale argomento vuoi cominciare?',
 ],
 ht:[
 'Kòmanse ak yon sèl kesyon. Pran tan ou pou li l avèk kalm.',
 'Ou pa bezwen etidye tout bagay jodi a. Kèk minit pratik konte tou.',
 'Eseye esplike kesyon an ak pwòp mo pa ou.',
 'Si yon mo nouvo pou ou, pran yon ti tan epi li fraz la ankò.',
 'Ou ka retounen sou menm kesyon an nenpòt lè ou vle revize l.',
 'Chwazi yon ti objektif etid ki mache ak tan ou genyen jodi a.',
 'Byenveni nan espas pratik ou a. Chwazi sijè ou ta renmen etidye a.',
 ],
};
// Interleave languages instead of making a reader wait through one long language block.
export const studyMessages=Object.freeze(Array.from({length:8},(_,index)=>Object.entries(copy).flatMap(([language,items])=>items[index]?[Object.freeze({id:`immigra-${language}-${index+1}`,language,text:items[index],author:'IMMIGRA'})]:[])).flat());
export function messageCycleSeconds(width,pixelsPerSecond=28){const value=Number(width),speed=Number(pixelsPerSecond);if(!Number.isFinite(value)||value<=0)return 600;return Math.max(35,value/(Number.isFinite(speed)&&speed>0?speed:28));}
