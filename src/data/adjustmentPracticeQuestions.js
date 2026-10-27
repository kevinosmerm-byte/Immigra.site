// Original bilingual educational prompts; not an official USCIS interview question bank.
// Append-only ordering protects historical practice references.
const source = [
  [
    "adjustment",
    "all",
    "identity",
    "Can you confirm your legal name as shown on your application?",
    "¿Puede confirmar su nombre legal tal como aparece en su solicitud?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "Have you used any other names on official documents?",
    "¿Ha utilizado otros nombres en documentos oficiales?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "How would you explain a difference in the spelling of your name across documents?",
    "¿Cómo explicaría una diferencia en la escritura de su nombre entre documentos?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "Where were you born?",
    "¿Dónde nació?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "What is your current marital status?",
    "¿Cuál es su estado civil actual?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "What is your current address?",
    "¿Cuál es su dirección actual?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "How long have you lived at your current residence?",
    "¿Cuánto tiempo lleva viviendo en su domicilio actual?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "What was your previous address?",
    "¿Cuál fue su domicilio anterior?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "Have you reviewed your I-485 for accuracy before this practice?",
    "¿Ha revisado su I-485 para comprobar que es correcta antes de esta práctica?"
  ],
  [
    "adjustment",
    "all",
    "identity",
    "Is there any information on your application you would like to update or correct?",
    "¿Hay alguna información de su solicitud que quiera actualizar o corregir?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "When did you most recently enter the United States?",
    "¿Cuándo ingresó por última vez a Estados Unidos?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "Where did you most recently enter the United States?",
    "¿Por dónde ingresó por última vez a Estados Unidos?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "What documents did you present during your most recent entry?",
    "¿Qué documentos presentó durante su ingreso más reciente?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "Do you remember the type of immigration status or admission you received?",
    "¿Recuerda qué tipo de estatus o admisión migratoria recibió?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "Have you traveled outside the United States since filing your application?",
    "¿Ha viajado fuera de Estados Unidos desde que presentó su solicitud?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "Have you ever applied for a visa or immigration benefit before?",
    "¿Alguna vez solicitó una visa o beneficio migratorio antes?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "Have you ever had a prior immigration interview?",
    "¿Ha tenido alguna entrevista migratoria anteriormente?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "Have you ever been in immigration court proceedings?",
    "¿Alguna vez estuvo en un proceso ante la corte de inmigración?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "Have you ever been told that you had violated a condition of immigration status?",
    "¿Alguna vez le informaron que había incumplido una condición de su estatus migratorio?"
  ],
  [
    "adjustment",
    "all",
    "entry",
    "What documents could help you confirm your entry and travel history?",
    "¿Qué documentos podrían ayudarlo a confirmar su historial de entradas y viajes?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "Where have you worked during the period covered by your application?",
    "¿Dónde ha trabajado durante el período que abarca su solicitud?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "How would you describe your current work or studies?",
    "¿Cómo describiría su empleo o estudios actuales?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "Have you had any periods without employment?",
    "¿Ha tenido períodos sin empleo?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "Which addresses have you lived at during the relevant period?",
    "¿En qué direcciones ha vivido durante el período correspondiente?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "Have you lived in another country for an extended period?",
    "¿Ha vivido en otro país durante un período prolongado?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "What information do you remember about previous immigration applications?",
    "¿Qué información recuerda sobre solicitudes migratorias anteriores?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "How would you explain an approximate date when you do not remember it exactly?",
    "¿Cómo explicaría una fecha aproximada cuando no la recuerda exactamente?"
  ],
  [
    "adjustment",
    "all",
    "history",
    "Is there a mistake in an earlier answer that you would like to correct?",
    "¿Existe algún error en una respuesta anterior que quiera corregir?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever been arrested, cited, charged, or detained by law enforcement?",
    "¿Alguna vez fue arrestado, citado, acusado o detenido por las autoridades?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever been convicted of an offense?",
    "¿Alguna vez fue condenado por alguna infracción o delito?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever been ordered removed or deported from a country?",
    "¿Alguna vez recibió una orden de expulsión o deportación de algún país?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever given inaccurate information on an immigration application?",
    "¿Alguna vez proporcionó información inexacta en una solicitud migratoria?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever used a document that did not belong to you?",
    "¿Alguna vez utilizó un documento que no le pertenecía?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever claimed to be a United States citizen?",
    "¿Alguna vez afirmó ser ciudadano de Estados Unidos?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever been refused entry to the United States?",
    "¿Alguna vez le negaron la entrada a Estados Unidos?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you ever worked without authorization in the United States?",
    "¿Alguna vez trabajó sin autorización en Estados Unidos?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Have you reviewed the complete yes-or-no eligibility questions on your I-485?",
    "¿Ha revisado todas las preguntas de elegibilidad de sí o no en su I-485?"
  ],
  [
    "adjustment",
    "all",
    "eligibility",
    "Is there an answer that requires you to explain the circumstances in more detail?",
    "¿Hay alguna respuesta para la cual necesite explicar las circunstancias con mayor detalle?"
  ],
  [
    "adjustment",
    "all",
    "support",
    "Who is the petitioner or sponsor in your case?",
    "¿Quién es el peticionario o patrocinador de su caso?"
  ],
  [
    "adjustment",
    "all",
    "support",
    "What is your relationship to the person who petitioned for you?",
    "¿Qué relación tiene con la persona que presentó la petición a su favor?"
  ],
  [
    "adjustment",
    "all",
    "support",
    "Has your household composition changed since the forms were submitted?",
    "¿Ha cambiado la composición de su hogar desde que se presentaron los formularios?"
  ],
  [
    "adjustment",
    "all",
    "support",
    "What documents have you prepared to verify your personal information?",
    "¿Qué documentos preparó para verificar su información personal?"
  ],
  [
    "adjustment",
    "all",
    "support",
    "Do you understand which form or petition your application is based on?",
    "¿Comprende en qué formulario o petición se basa su solicitud?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "Where and when did you first meet your spouse?",
    "¿Dónde y cuándo conoció por primera vez a su cónyuge?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "Who introduced you to your spouse, if anyone?",
    "¿Quién le presentó a su cónyuge, si alguien lo hizo?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "How did your relationship develop after your first meeting?",
    "¿Cómo evolucionó su relación después del primer encuentro?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "When did you decide to become a couple?",
    "¿Cuándo decidieron iniciar una relación de pareja?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "What did you do together during the early months of your relationship?",
    "¿Qué actividades hacían juntos durante los primeros meses de la relación?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "When did you first meet the family of your spouse?",
    "¿Cuándo conoció por primera vez a la familia de su cónyuge?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "How did you decide to get married?",
    "¿Cómo decidieron casarse?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "Was there a proposal, and what do you remember about it?",
    "¿Hubo una propuesta de matrimonio y qué recuerda de ella?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "Where and when did you get married?",
    "¿Dónde y cuándo se casaron?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "Who attended your wedding or marriage ceremony?",
    "¿Quién asistió a su boda o ceremonia matrimonial?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "Did you celebrate your marriage with family or friends?",
    "¿Celebraron su matrimonio con familiares o amigos?"
  ],
  [
    "adjustment",
    "marriage",
    "relationship",
    "What do you remember doing on your most recent anniversary?",
    "¿Qué recuerda haber hecho en su aniversario más reciente?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "When did you begin living together?",
    "¿Cuándo comenzaron a vivir juntos?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "Where do you and your spouse currently live?",
    "¿Dónde viven actualmente usted y su cónyuge?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "How many bedrooms are in your home?",
    "¿Cuántas habitaciones hay en su vivienda?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "How do you and your spouse divide regular household responsibilities?",
    "¿Cómo reparten usted y su cónyuge las responsabilidades habituales del hogar?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "Who usually prepares meals in your household?",
    "¿Quién suele preparar las comidas en su hogar?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "Who generally takes care of grocery shopping?",
    "¿Quién suele encargarse de las compras de alimentos?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "How do you usually spend weekends together?",
    "¿Cómo suelen pasar los fines de semana juntos?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "At what time does your spouse usually leave for work or daily activities?",
    "¿A qué hora suele salir su cónyuge para ir al trabajo o realizar sus actividades?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "What does your spouse normally do after returning home?",
    "¿Qué suele hacer su cónyuge cuando regresa a casa?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "What television shows or activities do you enjoy together?",
    "¿Qué programas de televisión o actividades disfrutan juntos?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "Who generally wakes up first on weekdays?",
    "¿Quién suele despertarse primero entre semana?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "What did you and your spouse do together yesterday?",
    "¿Qué hicieron juntos usted y su cónyuge ayer?"
  ],
  [
    "adjustment",
    "marriage",
    "household",
    "How do you handle household tasks when one person is away?",
    "¿Cómo organizan las tareas del hogar cuando una persona está fuera?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "Do you and your spouse have any shared bank accounts?",
    "¿Tienen usted y su cónyuge cuentas bancarias compartidas?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "How do you generally pay rent or a mortgage?",
    "¿Cómo suelen pagar la renta o la hipoteca?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "Whose name appears on your lease or property records?",
    "¿A nombre de quién está el contrato de alquiler o la propiedad?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "How do you divide responsibility for utility bills?",
    "¿Cómo dividen la responsabilidad por los servicios públicos?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "Do you have any insurance policies that include both of you?",
    "¿Tienen pólizas de seguro que incluyan a ambos?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "Have you filed any tax returns together?",
    "¿Han presentado alguna declaración de impuestos conjuntamente?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "Do you share any vehicles or vehicle-related expenses?",
    "¿Comparten algún vehículo o gastos asociados?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "How do you handle unexpected household expenses?",
    "¿Cómo manejan los gastos inesperados del hogar?"
  ],
  [
    "adjustment",
    "marriage",
    "financial",
    "What financial records reflect your shared household, if any?",
    "¿Qué documentos financieros reflejan su hogar compartido, si existen?"
  ],
  [
    "adjustment",
    "marriage",
    "family",
    "What is the name of your spouse's closest family member?",
    "¿Cómo se llama el familiar más cercano de su cónyuge?"
  ],
  [
    "adjustment",
    "marriage",
    "family",
    "When did you last spend time with your spouse's family?",
    "¿Cuándo fue la última vez que compartió tiempo con la familia de su cónyuge?"
  ],
  [
    "adjustment",
    "marriage",
    "family",
    "Have you traveled together to visit family members?",
    "¿Han viajado juntos para visitar familiares?"
  ],
  [
    "adjustment",
    "marriage",
    "family",
    "Do either of you have children from a previous relationship?",
    "¿Alguno de ustedes tiene hijos de una relación anterior?"
  ],
  [
    "adjustment",
    "marriage",
    "family",
    "How do you make decisions about family gatherings?",
    "¿Cómo toman decisiones sobre las reuniones familiares?"
  ],
  [
    "adjustment",
    "marriage",
    "family",
    "How do you celebrate birthdays or holidays together?",
    "¿Cómo celebran juntos los cumpleaños o días festivos?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "How do you usually communicate during the day?",
    "¿Cómo se comunican normalmente durante el día?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "What languages do you use when speaking with each other?",
    "¿Qué idiomas utilizan cuando hablan entre ustedes?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "How do you decide what to do during vacations?",
    "¿Cómo deciden qué hacer durante las vacaciones?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "If you disagree, how do you normally resolve the issue?",
    "Si están en desacuerdo, ¿cómo suelen resolver la situación?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "What interests or hobbies do you share?",
    "¿Qué intereses o pasatiempos comparten?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "What is one activity your spouse enjoys that you do not?",
    "¿Qué actividad disfruta su cónyuge y usted no?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "How have your routines changed since you married?",
    "¿Cómo han cambiado sus rutinas desde que se casaron?"
  ],
  [
    "adjustment",
    "marriage",
    "communication",
    "What changes are you planning for your household, if any?",
    "¿Qué cambios tienen planeados para su hogar, si los hay?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "Do you recognize the people shown in your wedding photographs?",
    "¿Reconoce a las personas que aparecen en las fotografías de su boda?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "Where were the photographs you submitted taken?",
    "¿Dónde fueron tomadas las fotografías que presentó?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "How did you collect the documents submitted to show your shared life?",
    "¿Cómo reunió los documentos presentados para mostrar su vida en común?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "Has either of you lived at a separate address during the marriage?",
    "¿Alguno de ustedes ha vivido en una dirección diferente durante el matrimonio?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "If you lived apart, what were the circumstances?",
    "Si vivieron separados, ¿cuáles fueron las circunstancias?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "Has either spouse been married before?",
    "¿Alguno de los cónyuges ha estado casado anteriormente?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "Were all prior marriages legally ended before your marriage?",
    "¿Terminaron legalmente todos los matrimonios anteriores antes de su matrimonio?"
  ],
  [
    "adjustment",
    "marriage",
    "records",
    "Is there any document that needs correction or an explanation?",
    "¿Hay algún documento que necesite una corrección o explicación?"
  ],
  [
    "adjustment",
    "marriage",
    "separate_practice",
    "What did you and your spouse eat together most recently?",
    "¿Qué comieron juntos usted y su cónyuge más recientemente?"
  ],
  [
    "adjustment",
    "marriage",
    "separate_practice",
    "Who was the last person to visit your home?",
    "¿Quién fue la última persona que visitó su casa?"
  ],
  [
    "adjustment",
    "marriage",
    "separate_practice",
    "Where do you usually keep important household documents?",
    "¿Dónde suelen guardar los documentos importantes del hogar?"
  ],
  [
    "adjustment",
    "marriage",
    "separate_practice",
    "How did you celebrate the most recent birthday in your household?",
    "¿Cómo celebraron el cumpleaños más reciente en su hogar?"
  ],
  [
    "adjustment",
    "marriage",
    "separate_practice",
    "Who usually pays for groceries?",
    "¿Quién suele pagar las compras de alimentos?"
  ],
  [
    "adjustment",
    "marriage",
    "separate_practice",
    "What was the last place you visited together outside your home?",
    "¿Cuál fue el último lugar al que fueron juntos fuera de casa?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "What is your relationship to the petitioner or beneficiary?",
    "¿Cuál es su relación con el peticionario o beneficiario?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "Where and when was your child born?",
    "¿Dónde y cuándo nació su hijo o hija?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "Have you and your child ever lived in the same household?",
    "¿Usted y su hijo o hija han vivido en el mismo hogar?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "What documents establish the parent-child relationship?",
    "¿Qué documentos establecen la relación entre padre o madre e hijo?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "Has your name or your child's name changed since birth?",
    "¿Ha cambiado su nombre o el de su hijo desde el nacimiento?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "Are there any legal adoption or guardianship records relevant to your relationship?",
    "¿Hay registros legales de adopción o tutela relacionados con su parentesco?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "When did you last see your child in person?",
    "¿Cuándo vio por última vez a su hijo o hija en persona?"
  ],
  [
    "adjustment",
    "parent",
    "parent_child",
    "What information on the birth certificate needs clarification, if any?",
    "¿Qué información del certificado de nacimiento requiere aclaración, si la hay?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "Which family member petitioned for you?",
    "¿Qué familiar presentó la petición a su favor?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "How would you describe your relationship with that parent?",
    "¿Cómo describiría su relación con ese padre o madre?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "Have you ever changed your legal name?",
    "¿Alguna vez cambió legalmente su nombre?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "Where have you lived with your parent, if applicable?",
    "¿Dónde ha vivido con su padre o madre, si corresponde?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "What documents reflect your parent-child relationship?",
    "¿Qué documentos reflejan su relación entre padre o madre e hijo?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "Have there been any corrections to your birth record?",
    "¿Se han hecho correcciones a su acta de nacimiento?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "Are there adoption or step-parent relationships relevant to your case?",
    "¿Hay relaciones de adopción o de padrastro o madrastra relevantes para su caso?"
  ],
  [
    "adjustment",
    "child",
    "child_parent",
    "What information about your parent can you confirm from your own experience?",
    "¿Qué información sobre su padre o madre puede confirmar por experiencia propia?"
  ],
  [
    "adjustment",
    "other_family",
    "other_family",
    "Which qualifying family relationship forms the basis of your petition?",
    "¿Qué relación familiar elegible constituye la base de su petición?"
  ],
  [
    "adjustment",
    "other_family",
    "other_family",
    "What records demonstrate the relationship claimed in the petition?",
    "¿Qué registros demuestran el parentesco indicado en la petición?"
  ],
  [
    "adjustment",
    "other_family",
    "other_family",
    "Have there been any changes in your family relationship since filing?",
    "¿Ha habido cambios en su relación familiar desde la presentación?"
  ],
  [
    "adjustment",
    "other_family",
    "other_family",
    "Can you explain any name differences across the family records?",
    "¿Puede explicar las diferencias de nombres entre los registros familiares?"
  ],
  [
    "adjustment",
    "other_family",
    "other_family",
    "Where does your petitioner currently live?",
    "¿Dónde vive actualmente su peticionario?"
  ],
  [
    "adjustment",
    "other_family",
    "other_family",
    "What information about your shared family history can you describe?",
    "¿Qué información de su historia familiar compartida puede describir?"
  ]
];
export const adjustmentPracticeQuestions = Object.freeze(source.map(([topic, track, category, en, es], index) => Object.freeze({ id: `AOS-${String(index+1).padStart(4,"0")}`, topic, track, category, en, es, provenance: "original-educational" })));
