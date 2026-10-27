// Original educational prompts for IMMIGRA.site. NOT a USCIS or EOIR question list.
// Append only: question indices are used by v1 per-user seen-question memory.
// Reviewed 2026-10-27 against USCIS Affirmative Asylum Procedures and EOIR Model Hearing Program.
const source = [
  [
    "asylum",
    "all",
    "opening",
    "What would you like the interviewer to understand about the reason you left your country?",
    "¿Qué le gustaría que el entrevistador entendiera sobre la razón por la que salió de su país?"
  ],
  [
    "asylum",
    "all",
    "opening",
    "When did you first begin to feel unsafe in your country?",
    "¿Cuándo comenzó a sentirse inseguro en su país?"
  ],
  [
    "asylum",
    "all",
    "opening",
    "How would you describe your circumstances before the problems began?",
    "¿Cómo describiría su situación antes de que comenzaran los problemas?"
  ],
  [
    "asylum",
    "all",
    "opening",
    "Which event do you remember as the beginning of the difficulties you described?",
    "¿Qué acontecimiento recuerda como el inicio de las dificultades que describió?"
  ],
  [
    "asylum",
    "all",
    "opening",
    "Are there parts of your written statement that you would like to clarify?",
    "¿Hay partes de su declaración escrita que le gustaría aclarar?"
  ],
  [
    "asylum",
    "all",
    "opening",
    "Did you prepare your application yourself or receive help understanding the questions?",
    "¿Preparó su solicitud por su cuenta o recibió ayuda para comprender las preguntas?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "Can you describe the first incident in chronological order?",
    "¿Puede describir el primer incidente en orden cronológico?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "What happened immediately before the incident you described?",
    "¿Qué ocurrió inmediatamente antes del incidente que describió?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "What happened immediately after that incident?",
    "¿Qué sucedió inmediatamente después de ese incidente?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "Where were you when the event occurred?",
    "¿Dónde se encontraba cuando ocurrió el hecho?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "Who was present and what did each person do?",
    "¿Quiénes estaban presentes y qué hizo cada persona?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "What exact words do you remember hearing, if any?",
    "¿Qué palabras exactas recuerda haber escuchado, si hubo alguna?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "What did you personally see, and what did you learn from someone else?",
    "¿Qué vio personalmente y qué supo por otras personas?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "How long did the incident last, to the best of your recollection?",
    "¿Cuánto duró el incidente, según lo que recuerda?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "What helps you remember the approximate date of that event?",
    "¿Qué le ayuda a recordar la fecha aproximada de ese acontecimiento?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "Did a similar event occur again? If so, what was different?",
    "¿Volvió a ocurrir algo similar? Si fue así, ¿qué fue diferente?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "Were there periods when the problems stopped or changed?",
    "¿Hubo períodos en los que los problemas se detuvieron o cambiaron?"
  ],
  [
    "asylum",
    "all",
    "timeline",
    "What steps did you take in response to those events?",
    "¿Qué medidas tomó como respuesta a esos acontecimientos?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "Why do you believe you were personally targeted?",
    "¿Por qué cree que usted fue objeto de esas acciones?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "Did anyone explain why they were treating you that way?",
    "¿Alguien le explicó por qué lo trataban de esa manera?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "What did the people involved know or believe about you?",
    "¿Qué sabían o creían sobre usted las personas involucradas?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "Did anyone refer to your political views, religion, nationality, family, or social group?",
    "¿Alguien hizo referencia a sus opiniones políticas, religión, nacionalidad, familia o grupo social?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "How did other people become aware of your activities or beliefs?",
    "¿Cómo llegaron otras personas a conocer sus actividades o creencias?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "Were other people in similar circumstances treated the same way?",
    "¿Otras personas en circunstancias parecidas recibieron el mismo trato?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "Do you distinguish between what was said explicitly and what you inferred?",
    "¿Distingue entre lo que se dijo expresamente y lo que usted dedujo?"
  ],
  [
    "asylum",
    "all",
    "motivation",
    "Were you ever accused of holding views that you did not actually hold?",
    "¿Alguna vez lo acusaron de tener opiniones que en realidad no compartía?"
  ],
  [
    "asylum",
    "all",
    "actors",
    "How did you identify the people who confronted or threatened you?",
    "¿Cómo identificó a las personas que lo confrontaron o amenazaron?"
  ],
  [
    "asylum",
    "all",
    "actors",
    "Did those people identify themselves or wear uniforms or insignia?",
    "¿Esas personas se identificaron o llevaban uniformes o insignias?"
  ],
  [
    "asylum",
    "all",
    "actors",
    "What makes you believe the same people were involved in separate incidents?",
    "¿Qué le hace creer que las mismas personas participaron en incidentes diferentes?"
  ],
  [
    "asylum",
    "all",
    "actors",
    "Did the people involved appear to act on behalf of an organization or authority?",
    "¿Parecía que las personas involucradas actuaban en nombre de alguna organización o autoridad?"
  ],
  [
    "asylum",
    "all",
    "actors",
    "What do you know directly about the identity of the people involved?",
    "¿Qué sabe de primera mano sobre la identidad de las personas involucradas?"
  ],
  [
    "asylum",
    "all",
    "actors",
    "Was anyone else present who might independently describe the event?",
    "¿Había alguien más presente que pudiera describir el hecho de manera independiente?"
  ],
  [
    "asylum",
    "all",
    "protection",
    "Did you seek help from police or another authority?",
    "¿Buscó ayuda de la policía o de alguna otra autoridad?"
  ],
  [
    "asylum",
    "all",
    "protection",
    "If you did not report an incident, what influenced that decision?",
    "Si no denunció un incidente, ¿qué influyó en esa decisión?"
  ],
  [
    "asylum",
    "all",
    "protection",
    "If you reported an incident, what response did you receive?",
    "Si denunció un incidente, ¿qué respuesta recibió?"
  ],
  [
    "asylum",
    "all",
    "protection",
    "Did you have access to any other means of protection?",
    "¿Tenía acceso a alguna otra forma de protección?"
  ],
  [
    "asylum",
    "all",
    "protection",
    "Were there reasons you believed asking authorities for help could create additional risks?",
    "¿Había motivos por los que pensaba que pedir ayuda a las autoridades podía crear riesgos adicionales?"
  ],
  [
    "asylum",
    "all",
    "protection",
    "Did any organization or individual attempt to help you?",
    "¿Alguna organización o persona intentó ayudarlo?"
  ],
  [
    "asylum",
    "all",
    "future",
    "What do you believe could happen to you if you returned now?",
    "¿Qué cree que podría sucederle si regresara ahora?"
  ],
  [
    "asylum",
    "all",
    "future",
    "Why do you believe that risk would apply to you personally?",
    "¿Por qué cree que ese riesgo le afectaría personalmente?"
  ],
  [
    "asylum",
    "all",
    "future",
    "What has happened, if anything, since your departure that affects your concern?",
    "¿Qué ha sucedido, si ha ocurrido algo, desde su salida que influya en su preocupación?"
  ],
  [
    "asylum",
    "all",
    "future",
    "Have you learned of any recent incidents involving people connected to your situation?",
    "¿Ha sabido de incidentes recientes relacionados con personas vinculadas a su situación?"
  ],
  [
    "asylum",
    "all",
    "future",
    "What information about current conditions have you personally verified?",
    "¿Qué información sobre las condiciones actuales ha verificado personalmente?"
  ],
  [
    "asylum",
    "all",
    "future",
    "What remains uncertain to you about the situation in your home country?",
    "¿Qué aspectos de la situación de su país siguen siendo inciertos para usted?"
  ],
  [
    "asylum",
    "all",
    "future",
    "Have any circumstances changed that might affect the risk you describe?",
    "¿Ha cambiado alguna circunstancia que pueda afectar el riesgo que describe?"
  ],
  [
    "asylum",
    "all",
    "future",
    "What makes you believe the people involved would still be interested in you?",
    "¿Qué le hace creer que las personas involucradas seguirían interesadas en usted?"
  ],
  [
    "asylum",
    "all",
    "relocation",
    "Did you consider living in a different part of your country?",
    "¿Consideró vivir en otra región de su país?"
  ],
  [
    "asylum",
    "all",
    "relocation",
    "Did you ever try to relocate within your country?",
    "¿Alguna vez intentó trasladarse a otra región de su país?"
  ],
  [
    "asylum",
    "all",
    "relocation",
    "What happened when you stayed somewhere else, if you did?",
    "¿Qué ocurrió cuando permaneció en otro lugar, si lo hizo?"
  ],
  [
    "asylum",
    "all",
    "relocation",
    "What concerns would you have about returning to a different city?",
    "¿Qué preocupaciones tendría respecto a regresar a una ciudad diferente?"
  ],
  [
    "asylum",
    "all",
    "relocation",
    "What practical circumstances would affect your ability to live elsewhere in your country?",
    "¿Qué circunstancias prácticas afectarían su posibilidad de vivir en otra región de su país?"
  ],
  [
    "asylum",
    "all",
    "family",
    "How did the events you described affect your household or family?",
    "¿Cómo afectaron a su hogar o familia los hechos que describió?"
  ],
  [
    "asylum",
    "all",
    "family",
    "Did any relative experience something related to your situation?",
    "¿Algún familiar vivió algo relacionado con su situación?"
  ],
  [
    "asylum",
    "all",
    "family",
    "What do you know firsthand about the circumstances of relatives who remained?",
    "¿Qué sabe de primera mano sobre la situación de los familiares que permanecieron allí?"
  ],
  [
    "asylum",
    "all",
    "family",
    "Has anyone contacted your relatives to ask about you since you left?",
    "¿Alguien ha contactado a sus familiares para preguntar por usted desde que se fue?"
  ],
  [
    "asylum",
    "all",
    "family",
    "Were any family members included in your application, and is that information accurate?",
    "¿Incluyó a familiares en su solicitud y es correcta esa información?"
  ],
  [
    "asylum",
    "all",
    "travel",
    "When did you depart your country, as best you can remember?",
    "¿Cuándo salió de su país, según lo que recuerda?"
  ],
  [
    "asylum",
    "all",
    "travel",
    "Which countries did you pass through before reaching the United States?",
    "¿Por qué países pasó antes de llegar a Estados Unidos?"
  ],
  [
    "asylum",
    "all",
    "travel",
    "Did you return to the country you say you fear after the events you described?",
    "¿Regresó al país al que teme volver después de los hechos que describió?"
  ],
  [
    "asylum",
    "all",
    "travel",
    "If you returned, what were the circumstances and what happened?",
    "Si regresó, ¿cuáles fueron las circunstancias y qué ocurrió?"
  ],
  [
    "asylum",
    "all",
    "travel",
    "Have you sought protection or immigration status in another country?",
    "¿Ha solicitado protección o estatus migratorio en otro país?"
  ],
  [
    "asylum",
    "all",
    "travel",
    "What did you understand about your immigration status during your journey?",
    "¿Qué entendía sobre su situación migratoria durante su viaje?"
  ],
  [
    "asylum",
    "all",
    "application",
    "Are the events in your declaration based on personal experiences or information reported to you?",
    "¿Los hechos de su declaración se basan en experiencias personales o información que le contaron?"
  ],
  [
    "asylum",
    "all",
    "application",
    "Is any date in your declaration an estimate rather than an exact date?",
    "¿Alguna fecha de su declaración es aproximada y no exacta?"
  ],
  [
    "asylum",
    "all",
    "application",
    "Would you like to correct any detail that you now remember differently?",
    "¿Le gustaría corregir algún detalle que ahora recuerda de otra manera?"
  ],
  [
    "asylum",
    "all",
    "application",
    "Do you understand every part of the written statement submitted in your name?",
    "¿Comprende todas las partes de la declaración escrita presentada a su nombre?"
  ],
  [
    "asylum",
    "all",
    "application",
    "Has your application been amended or supplemented since it was first submitted?",
    "¿Se ha corregido o complementado su solicitud desde que se presentó inicialmente?"
  ],
  [
    "asylum",
    "all",
    "application",
    "Can you explain any difference between the dates or descriptions in two documents?",
    "¿Puede explicar alguna diferencia entre las fechas o descripciones de dos documentos?"
  ],
  [
    "asylum",
    "all",
    "application",
    "Is there information you were unable to provide when you first applied?",
    "¿Hay información que no pudo aportar cuando presentó la solicitud inicialmente?"
  ],
  [
    "asylum",
    "all",
    "evidence",
    "What documents or records, if any, relate to the incident you described?",
    "¿Qué documentos o registros, si existen, se relacionan con el incidente que describió?"
  ],
  [
    "asylum",
    "all",
    "evidence",
    "Who created a document that you submitted, and how did you obtain it?",
    "¿Quién creó un documento que presentó y cómo lo obtuvo?"
  ],
  [
    "asylum",
    "all",
    "evidence",
    "What can a witness personally confirm about the events?",
    "¿Qué puede confirmar personalmente un testigo sobre los hechos?"
  ],
  [
    "asylum",
    "all",
    "evidence",
    "Are there facts you remember but cannot independently document?",
    "¿Hay hechos que recuerda pero que no puede documentar de manera independiente?"
  ],
  [
    "asylum",
    "all",
    "evidence",
    "What do the photographs or messages you provided actually show?",
    "¿Qué muestran realmente las fotografías o los mensajes que aportó?"
  ],
  [
    "asylum",
    "all",
    "evidence",
    "How do you know the date or origin of a record you submitted?",
    "¿Cómo conoce la fecha o el origen de un documento que presentó?"
  ],
  [
    "asylum",
    "all",
    "evidence",
    "Does your written account clearly distinguish events you witnessed from secondhand reports?",
    "¿Su relato escrito distingue claramente entre hechos que presenció e información de terceros?"
  ],
  [
    "asylum",
    "all",
    "difficult_questions",
    "Is there a part of your story that is difficult to recall or discuss?",
    "¿Hay alguna parte de su historia que le resulte difícil recordar o comentar?"
  ],
  [
    "asylum",
    "all",
    "difficult_questions",
    "If you are uncertain about a detail, how would you explain that uncertainty honestly?",
    "Si no está seguro de un detalle, ¿cómo explicaría honestamente esa incertidumbre?"
  ],
  [
    "asylum",
    "all",
    "difficult_questions",
    "How would you ask an interviewer to repeat or clarify a difficult question?",
    "¿Cómo le pediría al entrevistador que repita o aclare una pregunta difícil?"
  ],
  [
    "asylum",
    "all",
    "difficult_questions",
    "What would you do if you noticed a mistake in your own answer?",
    "¿Qué haría si detectara un error en su propia respuesta?"
  ],
  [
    "asylum",
    "all",
    "difficult_questions",
    "Is there a reason a particular incident was not mentioned in an earlier account?",
    "¿Hay alguna razón por la que un incidente específico no apareció en un relato anterior?"
  ],
  [
    "asylum",
    "all",
    "security",
    "Have you ever been involved in an organization that carried weapons?",
    "¿Ha participado alguna vez en una organización que portara armas?"
  ],
  [
    "asylum",
    "all",
    "security",
    "Have you ever received training involving weapons or military activities?",
    "¿Ha recibido alguna vez entrenamiento relacionado con armas o actividades militares?"
  ],
  [
    "asylum",
    "all",
    "security",
    "Have you ever been detained, questioned, or accused of a crime in any country?",
    "¿Alguna vez fue detenido, interrogado o acusado de un delito en algún país?"
  ],
  [
    "asylum",
    "all",
    "security",
    "Have you ever participated in harming or threatening another person?",
    "¿Ha participado alguna vez en causar daño o amenazar a otra persona?"
  ],
  [
    "asylum",
    "all",
    "security",
    "What was your actual role in any political or community organization you joined?",
    "¿Cuál fue su función real en cualquier organización política o comunitaria a la que se unió?"
  ],
  [
    "asylum",
    "all",
    "security",
    "Did your responsibilities or activities change over time within that organization?",
    "¿Cambiaron con el tiempo sus responsabilidades o actividades dentro de esa organización?"
  ],
  [
    "asylum",
    "affirmative",
    "affirmative_process",
    "Do you understand the purpose of today's practice interview with an asylum officer?",
    "¿Comprende el propósito de esta práctica de entrevista con un oficial de asilo?"
  ],
  [
    "asylum",
    "affirmative",
    "affirmative_process",
    "Would you like to review any corrected or additional information in your I-589?",
    "¿Le gustaría revisar algún dato corregido o adicional de su I-589?"
  ],
  [
    "asylum",
    "affirmative",
    "affirmative_process",
    "Can you describe how you first learned that you could apply for asylum?",
    "¿Puede describir cómo supo por primera vez que podía solicitar asilo?"
  ],
  [
    "asylum",
    "affirmative",
    "affirmative_process",
    "Do you remember approximately when you submitted your initial asylum application?",
    "¿Recuerda aproximadamente cuándo presentó su solicitud inicial de asilo?"
  ],
  [
    "asylum",
    "affirmative",
    "affirmative_process",
    "If the interviewer asks a question you do not understand, what will you say?",
    "Si el entrevistador le hace una pregunta que no entiende, ¿qué dirá?"
  ],
  [
    "asylum",
    "affirmative",
    "affirmative_process",
    "Have you reviewed the translations of documents submitted with your application?",
    "¿Ha revisado las traducciones de los documentos presentados con su solicitud?"
  ],
  [
    "asylum",
    "affirmative",
    "affirmative_process",
    "Is there something you want to clarify before the officer finishes the interview?",
    "¿Hay algo que desee aclarar antes de que el oficial finalice la entrevista?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "How would you explain the main events to an immigration judge in chronological order?",
    "¿Cómo explicaría los hechos principales ante un juez de inmigración en orden cronológico?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "How would you distinguish something you personally witnessed from something you heard?",
    "¿Cómo distinguiría algo que presenció personalmente de algo que escuchó?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "What would you do if a government attorney asked you to clarify an earlier statement?",
    "¿Qué haría si un abogado del gobierno le pidiera aclarar una declaración anterior?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "How would you answer if you genuinely could not recall an exact date?",
    "¿Cómo respondería si realmente no pudiera recordar una fecha exacta?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "Can you explain the difference between a fact you know and a conclusion you reached?",
    "¿Puede explicar la diferencia entre un hecho que conoce y una conclusión a la que llegó?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "How would you ask the judge for clarification if you did not understand a question?",
    "¿Cómo pediría una aclaración al juez si no comprendiera una pregunta?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "What would you do if you needed a break while answering questions?",
    "¿Qué haría si necesitara un descanso mientras responde preguntas?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "How would you explain why a later statement includes details omitted earlier?",
    "¿Cómo explicaría por qué una declaración posterior incluye detalles omitidos antes?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "How would you describe the evidence you personally recognize?",
    "¿Cómo describiría las pruebas que reconoce personalmente?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "If two documents appear inconsistent, how would you explain what you actually remember?",
    "Si dos documentos parecen contradictorios, ¿cómo explicaría lo que realmente recuerda?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "What do you believe is the most important fact you have not yet explained clearly?",
    "¿Cuál cree que es el hecho más importante que todavía no ha explicado claramente?"
  ],
  [
    "asylum",
    "court",
    "court_process",
    "How would you correct an inaccurate statement without guessing a replacement fact?",
    "¿Cómo corregiría una afirmación inexacta sin adivinar un dato para reemplazarla?"
  ]
];
export const asylumPracticeQuestions = Object.freeze(source.map(([topic, track, category, en, es], index) => Object.freeze({ id: `ASY-${String(index+1).padStart(4,"0")}`, topic, track, category, en, es, provenance: "original-educational" })));
