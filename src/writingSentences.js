const NON_ESSENTIAL_WORDS = new Set(["a", "an", "and", "are", "can", "has", "have", "in", "is", "of", "the", "to", "was", "we"]);

function contentWords(sentence) {
  return sentence.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word && !NON_ESSENTIAL_WORDS.has(word));
}

const WRITING_SENTENCE_SOURCE = [
  {
    english: "Adams was President.",
    spanish: "Adams fue Presidente."
  },
  {
    english: "Lincoln was President.",
    spanish: "Lincoln fue Presidente."
  },
  {
    english: "Washington was President.",
    spanish: "Washington fue Presidente."
  },
  {
    english: "Washington was the Father of Our Country.",
    spanish: "Washington fue el Padre de Nuestro País."
  },
  {
    english: "The President lives in the White House.",
    spanish: "El Presidente vive en la Casa Blanca."
  },
  {
    english: "The President lives in Washington.",
    spanish: "El Presidente vive en Washington."
  },
  {
    english: "Citizens can vote.",
    spanish: "Los ciudadanos pueden votar."
  },
  {
    english: "Citizens have rights.",
    spanish: "Los ciudadanos tienen derechos."
  },
  {
    english: "Citizens pay taxes.",
    spanish: "Los ciudadanos pagan impuestos."
  },
  {
    english: "People have the right to vote.",
    spanish: "Las personas tienen el derecho de votar."
  },
  {
    english: "People are free.",
    spanish: "Las personas son libres."
  },
  {
    english: "We have freedom of speech.",
    spanish: "Tenemos libertad de expresión."
  },
  {
    english: "Congress meets in Washington.",
    spanish: "El Congreso se reúne en Washington."
  },
  {
    english: "Senators work in Congress.",
    spanish: "Los senadores trabajan en el Congreso."
  },
  {
    english: "The United States is a country.",
    spanish: "Los Estados Unidos es un país."
  },
  {
    english: "The United States has fifty states.",
    spanish: "Los Estados Unidos tiene cincuenta estados."
  },
  {
    english: "Washington is the capital.",
    spanish: "Washington es la capital."
  },
  {
    english: "The capital is Washington, D.C.",
    spanish: "La capital es Washington, D.C."
  },
  {
    english: "The American flag is red, white, and blue.",
    spanish: "La bandera estadounidense es roja, blanca y azul."
  },
  {
    english: "The flag is red, white, and blue.",
    spanish: "La bandera es roja, blanca y azul."
  },
  {
    english: "The Civil War was a war.",
    spanish: "La Guerra Civil fue una guerra."
  },
  {
    english: "The Civil War was during Lincoln's time.",
    spanish: "La Guerra Civil fue durante la época de Lincoln."
  },
  {
    english: "American Indians lived here.",
    spanish: "Los indígenas americanos vivieron aquí."
  },
  {
    english: "The United States is north of Mexico.",
    spanish: "Los Estados Unidos está al norte de México."
  },
  {
    english: "Canada is north of the United States.",
    spanish: "Canadá está al norte de los Estados Unidos."
  },
  {
    english: "Mexico is south of the United States.",
    spanish: "México está al sur de los Estados Unidos."
  },
  {
    english: "Washington is in the United States.",
    spanish: "Washington está en los Estados Unidos."
  },
  {
    english: "California is a state.",
    spanish: "California es un estado."
  },
  {
    english: "Alaska is a state.",
    spanish: "Alaska es un estado."
  },
  {
    english: "Delaware is a state.",
    spanish: "Delaware es un estado."
  },
  {
    english: "New York City is a city.",
    spanish: "Nueva York es una ciudad."
  },
  {
    english: "The President can vote.",
    spanish: "El Presidente puede votar."
  },
  {
    english: "People can vote.",
    spanish: "Las personas pueden votar."
  },
  {
    english: "People want freedom.",
    spanish: "Las personas quieren libertad."
  },
  {
    english: "Citizens want freedom.",
    spanish: "Los ciudadanos quieren libertad."
  },
  {
    english: "The government is here.",
    spanish: "El gobierno está aquí."
  },
  {
    english: "The government can help people.",
    spanish: "El gobierno puede ayudar a las personas."
  },
  {
    english: "The President is elected.",
    spanish: "El Presidente es elegido."
  },
  {
    english: "The President was elected.",
    spanish: "El Presidente fue elegido."
  },
  {
    english: "We elect the President.",
    spanish: "Elegimos al Presidente."
  },
  {
    english: "We vote for the President.",
    spanish: "Votamos por el Presidente."
  },
  {
    english: "People vote in November.",
    spanish: "Las personas votan en noviembre."
  },
  {
    english: "The first President was Washington.",
    spanish: "El primer Presidente fue Washington."
  },
  {
    english: "Lincoln was the second President.",
    spanish: "Lincoln fue el segundo Presidente."
  },
  {
    english: "The largest state is Alaska.",
    spanish: "El estado más grande es Alaska."
  },
  {
    english: "The dollar bill is money.",
    spanish: "El billete de dólar es dinero."
  },
  {
    english: "The United States has one hundred Senators.",
    spanish: "Los Estados Unidos tiene cien senadores."
  },
  {
    english: "We celebrate Independence Day.",
    spanish: "Celebramos el Día de la Independencia."
  },
  {
    english: "We celebrate Thanksgiving.",
    spanish: "Celebramos el Día de Acción de Gracias."
  },
  {
    english: "We celebrate Presidents' Day.",
    spanish: "Celebramos el Día de los Presidentes."
  },
  {
    english: "We celebrate Memorial Day.",
    spanish: "Celebramos el Día de los Caídos."
  }
];

/** Canonical source used by writing practice and deterministic evaluation. */
export const writingSentences = Object.freeze(WRITING_SENTENCE_SOURCE.map((sentence, index) => Object.freeze({
  sentenceId: index + 1,
  ...sentence,
  essentialWords: Object.freeze([...new Set(contentWords(sentence.english))]),
})));

export function getWritingSentence(sentenceId) {
  return writingSentences.find((sentence) => sentence.sentenceId === Number(sentenceId)) || null;
}

export function findWritingSentence(expectedText) {
  const expected = String(expectedText || "").trim();
  return writingSentences.find((sentence) => sentence.english === expected) || null;
}
