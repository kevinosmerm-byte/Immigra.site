/* Blank form reference pages reviewed 2026-11-05. Acceptance must be checked with USCIS. */
const completeFormGuides = {
  "asylum": {
    "name": "Solicitud de asilo",
    "form": "I-589",
    "edition": "07/28/26",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-589.pdf",
    "official": "https://www.uscis.gov/i-589",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/i-589instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/i589-01.webp",
        "page": 1,
        "title": "Identidad, domicilios e historial de entradas",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            139,
            540,
            105,
            "Identificadores y nombre",
            "Distingue A-Number, número de Seguro Social y número de cuenta USCIS. Copia los datos de tus documentos cuando existan; no inventes identificadores.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si todavía no tienes A-Number, las instrucciones indican que USCIS te asignará uno. No lo confundas con otro identificador."
            }
          ],
          [
            36,
            245,
            540,
            195,
            "Domicilio físico y dirección postal",
            "La residencia física indica dónde vives; la dirección postal es donde recibes correspondencia. Completa la diferencia cuando corresponda.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si recibes correo en un apartado postal, indícalo en la pregunta 9 y conserva tu domicilio físico en la pregunta 8. Si otra persona recoge tu correo, puedes identificarla en “In Care Of”."
            }
          ],
          [
            36,
            445,
            540,
            105,
            "Datos personales y procesos en corte",
            "Revisa nacimiento, nacionalidad, idioma y tu historial real de procesos. Tener una cuenta USCIS no determina la jurisdicción del asilo.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Para la pregunta 13, usa el nombre actual del país, no nombres históricos, étnicos, provinciales o locales. Si desconoces un dato, las instrucciones permiten indicarlo como “unknown” en lugar de inventarlo."
            }
          ],
          [
            36,
            552,
            540,
            172,
            "Salidas, entradas y documento de viaje",
            "Organiza las entradas desde la más reciente. Distingue fecha de entrada, estatus al entrar, número I-94 y pasaporte; usa tus registros reales.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si recibiste un I-94, revisa allí el número, la fecha y el estatus solicitados. Si no recibiste ese documento, las instrucciones indican escribir “None”; si entraste sin inspección, indican “No Inspection” en el campo de estatus de la pregunta 19c."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-02.webp",
        "page": 2,
        "title": "Cónyuge e hijos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            48,
            540,
            55,
            "Sección reservada a EOIR",
            "El área que dice “For EOIR use only” está reservada a la agencia. No la completes como si fuera información del solicitante."
          ],
          [
            36,
            120,
            540,
            290,
            "Información del cónyuge",
            "La sección corresponde a tu cónyuge. Revisa matrimonio, identidad, ubicación y datos migratorios. Indicar al cónyuge no confirma que pueda ser incluido como derivado.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si incluyes a tu cónyuge en la solicitud, adjunta copia del acta de matrimonio y prueba de terminación de matrimonios anteriores. Si no puedes obtener esa prueba primaria, revisa las alternativas y explica su ausencia."
            }
          ],
          [
            36,
            422,
            540,
            300,
            "Lista de hijos e información del primer hijo",
            "El formulario pide enumerar todos los hijos, cualquiera que sea su edad, ubicación o estado civil. La pregunta sobre incluirlos en la solicitud se revisa por separado y tiene requisitos.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "La lista debe incluir también hijastros, hijos fallecidos, adoptados y adultos, aunque no estén en Estados Unidos o presenten su propia solicitud. Esa obligación de enumerarlos es distinta de incluirlos como beneficiarios."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-03.webp",
        "page": 3,
        "title": "Continuación de los datos de hijos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            46,
            540,
            220,
            "Datos del siguiente hijo",
            "Usa este bloque para un hijo distinto. Comprueba identidad, nacimiento, ubicación y entradas; no copies automáticamente los datos del solicitante.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si incluyes a un hijo en la solicitud, las instrucciones piden copia de su acta de nacimiento. Revisa por separado los requisitos para incluirlo, sin deducirlos solo por aparecer en esta lista."
            }
          ],
          [
            36,
            280,
            540,
            220,
            "Otro hijo y su situación",
            "Completa el bloque con los datos reales de esta persona. Que un hijo figure en la lista no significa que pueda incluirse como derivado.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si no puedes conseguir la prueba primaria de parentesco y aportas pruebas secundarias o declaraciones juradas, explica por qué falta el documento primario. Puedes adjuntar esa explicación en el Suplemento B o en hojas adicionales."
            }
          ],
          [
            36,
            514,
            540,
            220,
            "Último bloque de esta página",
            "Continúa sin omitir hijos. Si necesitas espacio para más de cuatro hijos, revisa el Suplemento A y las instrucciones.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si tienes más de cuatro hijos, continúa en el Suplemento A o en hojas adicionales con la misma información que pide la Parte A.II. No omitas a un hijo por falta de espacio."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-04.webp",
        "page": 4,
        "title": "Residencias, estudios, empleo y familiares",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            70,
            540,
            250,
            "Domicilios antes de llegar y en los últimos cinco años",
            "Distingue el último domicilio antes de venir de la tabla de residencias de cinco años. Sigue el orden solicitado y utiliza fechas reales o estimaciones identificadas como tales.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "En el historial de residencias, empieza por la actual y retrocede en el tiempo. Atiende además el alcance propio de cada pregunta, incluido el último domicilio antes de venir."
            }
          ],
          [
            36,
            327,
            540,
            125,
            "Educación",
            "Enumera los estudios comenzando por la institución más reciente y revisa nombres, ubicación y periodos.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "En la tabla de educación, comienza por los estudios más recientes y retrocede en el tiempo. Si necesitas más espacio, identifica la pregunta en una hoja adicional."
            }
          ],
          [
            36,
            460,
            540,
            107,
            "Empleo de los últimos cinco años",
            "Empieza por el empleo actual y organiza los periodos. No cambies hechos para que parezcan coincidir con otras secciones.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "En el historial laboral, empieza por el empleo actual o más reciente y retrocede en el tiempo. Mantén las fechas y los lugares correspondientes a cada empleo."
            }
          ],
          [
            36,
            574,
            540,
            150,
            "Padres y hermanos",
            "Incluye la información solicitada de tus padres y hermanos y señala la situación de cada persona según lo que sabes.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si un dato familiar no aplica o no lo sabes, usa la indicación que corresponda: “none”, “not applicable” o “unknown”. No sustituyas un dato desconocido por una suposición."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-05.webp",
        "page": 5,
        "title": "Motivo de protección, hechos y temor futuro",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            48,
            540,
            192,
            "Instrucciones para una explicación completa",
            "Lee las instrucciones de esta edición antes de responder. Presenta hechos propios y detallados; no confíes en poder completar todo más adelante en una entrevista.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Completa las respuestas en inglés. Si falta espacio, usa los suplementos o hojas adicionales e identifica el número de la pregunta; la solicitud puede decidirse sin entrevista ni solicitud de pruebas adicionales."
            }
          ],
          [
            36,
            244,
            540,
            102,
            "Bases de la solicitud",
            "La protección tiene fundamentos legales específicos. Describe tu situación real y consulta a un profesional para identificar qué base corresponde; no elijas una casilla para mejorar artificialmente tu caso.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "La pregunta 1 permite marcar la casilla o casillas de los motivos por los que presentas la solicitud. Si tienes dudas sobre su alcance jurídico, busca orientación individual antes de seleccionar una base."
            }
          ],
          [
            36,
            352,
            540,
            204,
            "Daño, amenazas o maltrato pasados",
            "Explica qué ocurrió, cuándo, quién lo causó y por qué crees que ocurrió. Distingue conocimiento directo de información recibida de otras personas.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si te cuesta recordar o hablar de experiencias pasadas, las instrucciones sugieren buscar apoyo de un abogado, representante acreditado o profesional de salud. Ese apoyo puede ayudarte a explicar tus propias experiencias, sin sustituirlas por un relato modelo."
            }
          ],
          [
            36,
            562,
            540,
            170,
            "Temor al regresar",
            "Explica el daño que temes, quién podría causarlo y por qué. Sustenta tu temor con tus hechos y la información disponible; no uses relatos ajenos.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si una prueba que apoya tu temor no está razonablemente disponible o no la aportas ahora, explica por qué en el Suplemento B o en hojas adicionales. Relaciona la explicación con la prueba concreta que falta."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-06.webp",
        "page": 6,
        "title": "Detenciones, organizaciones y temor de tortura",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            76,
            540,
            160,
            "Acusaciones y detenciones fuera de Estados Unidos",
            "Lee el alcance completo de la pregunta y explica los hechos que correspondan, sin ocultar antecedentes ni tratar una acusación como si fuera una condena.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si respondes “Yes”, añade la explicación detallada que pide la pregunta. Si no cabe, continúa en el Suplemento B o en hojas adicionales identificadas."
            }
          ],
          [
            36,
            244,
            540,
            177,
            "Participación en organizaciones",
            "Identifica organizaciones, funciones, fechas y nivel de participación propios o de familiares según la pregunta. No exageres responsabilidades.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si la respuesta es “Yes”, explica en detalle la participación que corresponda a la pregunta. Puedes ampliar en el Suplemento B sin reemplazar los datos propios por ejemplos genéricos."
            }
          ],
          [
            36,
            430,
            540,
            154,
            "Participación que continúa",
            "Distingue la actividad pasada de la actual. Explica qué continúa y qué cambió con hechos propios.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si indicas que la participación continúa, desarrolla la explicación y usa hojas adicionales si hace falta. Identifica la pregunta para distinguir esta respuesta de la participación pasada."
            }
          ],
          [
            36,
            592,
            540,
            140,
            "Temor de tortura",
            "Describe el temor real y sus razones si corresponde. Esta pregunta tiene un alcance específico; una respuesta no determina por sí sola elegibilidad.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si solicitas protección bajo la Convención contra la Tortura, revisa también la casilla correspondiente al inicio del formulario y la explicación detallada de la Parte B, pregunta 4. Las instrucciones piden abordar el maltrato o las amenazas vinculados a un gobierno, si los hubo; no determinan por sí solas tu elegibilidad."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-07.webp",
        "page": 7,
        "title": "Solicitudes anteriores, otros países y participación en daños",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            132,
            540,
            200,
            "Solicitudes previas de protección",
            "Revisa solicitudes propias y de familiares mencionados, decisiones y si fuiste incluido en otra solicitud. Explica cambios relevantes cuando la pregunta lo pida.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Responde “Yes” o “No” a cada pregunta de la Parte C. Si la respuesta es afirmativa, desarrolla la explicación detallada y usa el Suplemento B cuando no alcance el espacio."
            }
          ],
          [
            36,
            340,
            540,
            238,
            "Tránsito, residencia y estatus en otros países",
            "Distingue viajar por un país, vivir allí y tener o solicitar estatus. Explica por persona los periodos, el estatus, la posibilidad de regresar y las solicitudes de protección según lo requerido.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Revisa cada pregunta de esta sección por separado y explica en detalle cualquier respuesta afirmativa. Si continúas en otra hoja, indica la pregunta a la que pertenece la información de viajes o residencia."
            }
          ],
          [
            36,
            586,
            540,
            146,
            "Participación en daño a otras personas",
            "Lee toda la pregunta sobre ordenar, incitar, ayudar o participar en daños. Responde con veracidad y busca revisión profesional si puede aplicar.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "La Parte C requiere una respuesta “Yes” o “No” y explicación detallada de las afirmativas. Si dudas sobre el alcance de los hechos preguntados, busca revisión individual antes de firmar."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-08.webp",
        "page": 8,
        "title": "Regresos al país, plazo y antecedentes en Estados Unidos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            70,
            540,
            202,
            "Regresos al país de temor",
            "Si regresaste, describe fechas, propósito y duración de cada viaje conforme a la pregunta. No omitas viajes porque creas que perjudican tu solicitud.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si respondes afirmativamente sobre un regreso, agrega la explicación completa solicitada. Puedes usar el Suplemento B y señalar la pregunta para mantener juntos los detalles de cada viaje."
            }
          ],
          [
            36,
            280,
            540,
            231,
            "Presentación después de un año",
            "Revisa fecha de última llegada y fecha de presentación. Si corresponde explicar demora, documenta tus circunstancias reales; esta guía no decide si existe una excepción al plazo.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si respondes “Yes” a la pregunta 5, explica de manera completa y detallada por qué no solicitaste asilo durante el primer año. No asumas que mencionar una circunstancia basta para que se acepte una excepción."
            }
          ],
          [
            36,
            520,
            540,
            212,
            "Antecedentes en Estados Unidos",
            "Revisa cada incidente que abarque la pregunta para las personas incluidas. Describe hechos y resultados, y aporta registros o explica su ausencia conforme a las instrucciones.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si adjuntas registros en otro idioma, incluye traducción completa al inglés y la certificación del traductor exigida por las instrucciones. Esto se aplica también a documentos que uses para explicar antecedentes."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-09.webp",
        "page": 9,
        "title": "Declaración, firma y ayuda del preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            48,
            540,
            260,
            "Certificación y advertencias",
            "Lee íntegramente la certificación antes de firmar. La información debe ser verdadera; la ayuda de un preparador no elimina tu responsabilidad de revisar el contenido.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "07/28/26",
              "addition": "Tu firma acredita que conoces el contenido de la solicitud, aun si alguien te ayudó. Revisa respuestas y anexos antes de firmar; las declaraciones se hacen bajo pena de perjurio."
            }
          ],
          [
            36,
            313,
            540,
            160,
            "Nombre, ayuda recibida y firma del solicitante",
            "Identifica la ayuda realmente recibida. Firma y fecha siguiendo las instrucciones aplicables; no firmes un formulario en blanco o que no comprendes.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "07/28/26",
              "addition": "Firma la Parte D después de completar y revisar la solicitud. Responde también las preguntas sobre la ayuda que recibiste y proporciona los datos pedidos."
            }
          ],
          [
            36,
            480,
            540,
            249,
            "Declaración del preparador",
            "Esta parte corresponde al preparador cuando aplica, no a un segundo solicitante. Revisa quién debe completarla y la declaración que esa persona certifica.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si te ayudó una persona distinta de tu cónyuge, padre, madre o hijo, las instrucciones requieren que firme la Parte E y proporcione sus datos. La falta de esa firma puede causar la devolución por solicitud incompleta."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-10.webp",
        "page": 10,
        "title": "Secciones para entrevista o audiencia",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            48,
            540,
            221,
            "Parte F: entrevista de asilo, si corresponde",
            "La propia página indica que esta parte se completa cuando te lo soliciten en el examen ante el oficial. No la firmes por adelantado ni completes la firma del oficial.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "07/28/26",
              "addition": "No firmes la Parte F antes de presentar la solicitud. Si hay entrevista, te pedirán firmar allí al terminarla; la Parte D sí debe ir firmada al presentar."
            }
          ],
          [
            36,
            276,
            540,
            232,
            "Parte G: audiencia de remoción, si corresponde",
            "Esta parte se utiliza ante el juez cuando corresponde. Sigue las indicaciones de la autoridad; no completes por tu cuenta la firma del juez.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "07/28/26",
              "addition": "No firmes la Parte G antes de presentar la solicitud. Si corresponde una audiencia, te pedirán firmar allí ante el juez; esto no sustituye la firma inicial de la Parte D."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-11.webp",
        "page": 11,
        "title": "Suplemento A: hijos adicionales",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            105,
            540,
            107,
            "Identificación del suplemento",
            "Relaciona el suplemento con el solicitante y revisa fecha y firma. Úsalo cuando haga falta espacio para hijos adicionales según las instrucciones.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si usas el suplemento, incluye tu nombre exactamente como aparece en la Parte A.I., tu A-Number si tienes, firma y fecha. Comprueba que la hoja pueda relacionarse con tu solicitud."
            }
          ],
          [
            36,
            221,
            540,
            225,
            "Primer hijo adicional",
            "Incluye información real del hijo y revisa por separado si será incluido en la solicitud. Enumerarlo no establece elegibilidad como derivado.",
            {
              "instructionPages": [
                12
              ],
              "instructionEdition": "07/28/26",
              "addition": "El Suplemento A continúa la Parte A.II. Si necesitas usarlo para otro hijo, conserva el mismo nivel de detalle que en los bloques del formulario principal."
            }
          ],
          [
            36,
            454,
            540,
            245,
            "Segundo hijo adicional",
            "Usa este bloque para otra persona. Si necesitas más hojas, conserva la identificación y el orden que exigen las instrucciones.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "07/28/26",
              "addition": "Si necesitas más espacio para otros hijos, puedes adjuntar páginas con la misma información solicitada en la Parte A.II. Identifica cada hoja con tus datos y no mezcles información de personas distintas."
            }
          ]
        ]
      },
      {
        "image": "forms/i589-12.webp",
        "page": 12,
        "title": "Suplemento B: continuación de respuestas",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            102,
            540,
            86,
            "Identificación y firma",
            "Identifica a quién pertenece la hoja y revisa los campos de fecha y firma conforme a las instrucciones.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "07/28/26",
              "addition": "Cada hoja adicional debe llevar tu nombre tal como figura en la Parte A.I., A-Number si tienes, firma y fecha. Revisa estos datos también si añades varias hojas."
            }
          ],
          [
            36,
            197,
            540,
            45,
            "Parte y pregunta correspondiente",
            "Señala exactamente la parte y la pregunta que amplías para que la respuesta se pueda relacionar con el formulario.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "07/28/26",
              "addition": "Indica el número de la pregunta cuya respuesta continúas. Añade la parte correspondiente para evitar que la explicación se asocie con otra pregunta."
            }
          ],
          [
            36,
            244,
            540,
            480,
            "Información adicional de tu solicitud",
            "Continúa la respuesta con hechos verdaderos y específicos. Mantén coherencia con el formulario y referencias claras a las pruebas; esta hoja no es una historia modelo.",
            {
              "instructionPages": [
                12
              ],
              "instructionEdition": "07/28/26",
              "addition": "El Suplemento B sirve para ampliar las Partes B y C y también cualquier otra parte. Si aportas una declaración o pruebas adicionales, mantén claras sus referencias a las preguntas que explican."
            }
          ]
        ]
      }
    ]
  },
  "adjust": {
    "name": "Ajuste de estatus",
    "form": "I-485",
    "edition": "09/18/26",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf",
    "official": "https://www.uscis.gov/i-485",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/i-485instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/i485-01.webp",
        "page": 1,
        "title": "Identidad y espacios oficiales",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            249.95,
            113.74,
            115.1,
            16.61,
            "Uso exclusivo de USCIS",
            "Este bloque corresponde a USCIS, no a las respuestas del solicitante."
          ],
          [
            155.68,
            289.28,
            299.65,
            13.84,
            "Representante",
            "Espacio para abogado o representante acreditado, si lo hay."
          ],
          [
            36,
            484.28,
            248.38,
            13.84,
            "Nombre legal",
            "Identifica el nombre legal actual del solicitante; los otros nombres y las fechas de nacimiento aparecen debajo.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "09/18/26",
              "addition": "Para acompañar los datos de identidad, las instrucciones piden una fotocopia de un documento oficial con fotografía; entre sus ejemplos figuran el pasaporte, incluso vencido, y la licencia de conducir."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-02.webp",
        "page": 2,
        "title": "Identificación e historial de entrada",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            35.99,
            94.22,
            254.79,
            13.84,
            "Número A",
            "Pregunta por el número de registro de extranjero y por otros números A utilizados o asignados.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "09/18/26",
              "addition": "No confundas el número A con el número de cuenta en línea de USCIS: las instrucciones aclaran que son identificadores distintos."
            }
          ],
          [
            60,
            381.44,
            112.77,
            13.47,
            "Entrada más reciente",
            "Solicita datos del pasaporte, visa, lugar y fecha de llegada, y forma de admisión o permiso de ingreso.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si tu categoría requiere prueba de inspección y admisión o parole, la evidencia debe corresponder a la llegada más reciente. La página 8 enumera categorías exentas de presentar esa documentación; no supone que todas las personas deban aportar lo mismo."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-03.webp",
        "page": 3,
        "title": "Registro I-94 y direcciones",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60,
            94.44,
            494.07,
            13.47,
            "Registro I-94",
            "Esta sección solicita la información del I-94 más reciente, si se emitió, y continúa con preguntas de estatus migratorio.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si tu I-94 es electrónico, las instrucciones indican que puedes obtener una versión para imprimir en www.cbp.gov/i94. Si no se puede obtener allí, revisa la alternativa I-102 descrita en esa misma página, incluidos sus costos."
            }
          ],
          [
            60.01,
            370.28,
            130.83,
            13.84,
            "Domicilio físico",
            "Indica la vivienda actual y la fecha desde la que se reside allí.",
            {
              "instructionPages": [
                14
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si cambia tu domicilio físico o postal, las instrucciones requieren avisar a USCIS dentro de 10 días. Si también estás en procedimientos ante la corte de inmigración, revisa su aviso separado y el plazo de cinco días en esa página."
            }
          ],
          [
            60.01,
            562.28,
            321.65,
            13.84,
            "Dirección postal",
            "Es distinta del domicilio físico cuando la correspondencia se recibe en otro lugar; contempla una dirección segura o alternativa.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si la correspondencia llega a nombre de otra persona, incluye su nombre en “In Care Of Name”. Puede usarse un apartado postal si allí recibes el correo; las instrucciones también contemplan direcciones seguras o alternativas en los casos que describen."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-04.webp",
        "page": 4,
        "title": "Domicilios anteriores y Seguro Social",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60.01,
            142.28,
            60.27,
            13.84,
            "Domicilios anteriores",
            "La página pregunta por los domicilios de los últimos cinco años cuando corresponde y sus fechas."
          ],
          [
            60.01,
            352.28,
            204.7,
            13.84,
            "Dirección fuera de EE. UU.",
            "Solicita el domicilio físico más reciente fuera del país donde se vivió más de un año, si aún no se indicó."
          ],
          [
            36.01,
            550.29,
            106.77,
            13.84,
            "Seguro Social",
            "Preguntas sobre una tarjeta previa, solicitud de tarjeta y consentimiento de divulgación a la SSA. Son decisiones separadas que deben revisarse en el formulario.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "09/18/26",
              "addition": "Solicitar una tarjeta de Seguro Social mediante este I-485 es opcional. Si eliges pedir una tarjeta nueva o de reemplazo, revisa conjuntamente la solicitud y el consentimiento de divulgación que las instrucciones exigen para ese trámite."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-05.webp",
        "page": 5,
        "title": "Tipo de solicitud y categoría familiar",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60,
            159.28,
            215.8,
            13.84,
            "Solicitante principal o derivado",
            "Distingue la solicitud principal de la derivada; esta última pide datos de la persona principal.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "09/18/26",
              "addition": "Cada solicitante presenta su propio I-485, sea principal o derivado. Incluir a un familiar en tus respuestas no sustituye la solicitud individual de esa persona."
            }
          ],
          [
            36,
            364.28,
            81.78,
            13.84,
            "Categorías familiares",
            "Presenta categorías basadas en parentesco. Esta guía identifica el apartado, sin determinar cuál corresponde al caso.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si solicitas como beneficiario de una petición de visa de inmigrante, normalmente se adjunta copia del aviso I-797 de la petición base. Las instrucciones distinguen qué aviso corresponde según la petición esté pendiente, aprobada o presentada junto al I-485."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-06.webp",
        "page": 6,
        "title": "Categorías laborales y especiales",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            94.28,
            109.28,
            13.84,
            "Base laboral",
            "Agrupa opciones relacionadas con empleo o inversión y preguntas condicionales sobre familiares vinculados a la petición.",
            {
              "instructionPages": [
                10
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si la solicitud laboral depende de una oferta de empleo, revisa cuándo corresponde el Suplemento J. Las instrucciones distinguen un I-140 aprobado de uno pendiente o presentado conjuntamente y describen excepciones; no se exige de igual manera a todas las categorías laborales."
            }
          ],
          [
            60,
            502.28,
            82.22,
            13.84,
            "Inmigrante especial",
            "Lista categorías de inmigrante especial. Las opciones no constituyen una evaluación de elegibilidad.",
            {
              "instructionPages": [
                17
              ],
              "instructionEdition": "09/18/26",
              "addition": "Revisa tanto las instrucciones generales como las adicionales de tu categoría específica. Los documentos y condiciones de una categoría de inmigrante especial no deben trasladarse automáticamente a otra."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-07.webp",
        "page": 7,
        "title": "Otras categorías y preguntas relacionadas",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60,
            94.28,
            79.14,
            13.84,
            "Asilo o refugio",
            "Distingue estas dos categorías y pide la fecha correspondiente si se selecciona una de ellas.",
            {
              "instructionPages": [
                29
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si la base es asilo, las instrucciones piden evidencia del estatus de asilado tanto para solicitantes principales como derivados, por ejemplo el aviso de aprobación o la orden judicial. Esta indicación es para asilo; no sustituye las instrucciones separadas para refugiados."
            }
          ],
          [
            36,
            262.28,
            230.67,
            13.84,
            "Programas especiales",
            "Lista opciones establecidas por leyes específicas; continúa con otras bases de solicitud.",
            {
              "instructionPages": [
                17
              ],
              "instructionEdition": "09/18/26",
              "addition": "Consulta las instrucciones adicionales del programa elegido junto con las generales. Si una categoría no aparece desarrollada en esa sección, el documento aclara que no tiene instrucciones adicionales allí; no significa que deje de necesitar las instrucciones generales."
            }
          ],
          [
            36,
            640.28,
            533.23,
            25.63,
            "Protección de edad CSPA",
            "Pregunta específica sobre clasificación como hijo bajo CSPA; su aplicación requiere revisar las instrucciones.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "09/18/26",
              "addition": "Las instrucciones advierten que cumplir 21 años no resuelve por sí solo si se conserva la clasificación de hijo para inmigración. Revisa la referencia oficial a CSPA antes de decidir qué respuesta corresponde; esta guía no calcula ni determina esa protección."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-08.webp",
        "page": 8,
        "title": "Patrocinio económico e historial",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            38.16,
            70.54,
            523.31,
            31.01,
            "Exención del patrocinio económico",
            "Parte 3: opciones relativas a la declaración de patrocinio económico I-864/I-864EZ. No confundir con la sección de carga pública.",
            {
              "instructionPages": [
                13
              ],
              "instructionEdition": "09/18/26",
              "addition": "En esta edición, quienes antes solicitaban la exención mediante I-864W lo hacen completando la parte 3 del I-485. Esto no elimina el I-864 o I-864EZ cuando sí se exige patrocinio económico."
            }
          ],
          [
            38.16,
            317.74,
            217.34,
            16.61,
            "Información adicional",
            "Parte 4: visas de inmigrante previas, solicitudes anteriores y residencia permanente rescindida."
          ],
          [
            36,
            526.29,
            162.52,
            13.84,
            "Empleo y estudios",
            "Solicita historial laboral y educativo de los últimos cinco años, incluidos períodos sin empleo o de retiro según las instrucciones."
          ]
        ]
      },
      {
        "image": "forms/i485-09.webp",
        "page": 9,
        "title": "Empleo y progenitor 1",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60,
            94.44,
            173.04,
            13.47,
            "Dirección de empleo o escuela",
            "Continúa la información del empleo o centro educativo indicado en la página anterior."
          ],
          [
            36,
            297.44,
            433.11,
            14.68,
            "Empleo o escuela en el extranjero",
            "Pide el más reciente fuera de EE. UU. si no se indicó antes, con dirección, fechas y datos relacionados."
          ],
          [
            38.6,
            569.74,
            207.31,
            16.61,
            "Progenitores",
            "Comienza los datos del progenitor 1: nombre legal, nombre al nacer y fecha de nacimiento.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "09/18/26",
              "addition": "Al reunir la documentación de nacimiento, verifica que el acta identifique al menos un progenitor. Las instrucciones remiten al registro de documentos civiles del Departamento de Estado y a posibles reglas específicas de cada categoría."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-10.webp",
        "page": 10,
        "title": "Progenitor 2 y matrimonio actual",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            38.16,
            138.03,
            166.7,
            16.07,
            "Progenitor 2",
            "Identificación del segundo progenitor, incluida fecha y país de nacimiento.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "09/18/26",
              "addition": "La evidencia de nacimiento debe cumplir los requisitos de las instrucciones, que exigen que el acta identifique al menos un progenitor. Esto es un requisito documental, no una indicación para omitir datos del segundo progenitor que el formulario solicite."
            }
          ],
          [
            38.16,
            341.74,
            251.98,
            16.61,
            "Historial matrimonial",
            "Pregunta por estado civil y número de matrimonios; luego pide datos del cónyuge actual cuando corresponde.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si una pregunta realmente no aplica, las instrucciones indican “N/A”, salvo que el formulario dé otra indicación. Su propio ejemplo es el nombre del cónyuge actual de una persona que nunca se casó; sigue primero cualquier salto específico impreso."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-11.webp",
        "page": 11,
        "title": "Matrimonio actual y matrimonios anteriores",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            94.22,
            170.36,
            13.84,
            "Lugar del matrimonio actual",
            "Continúa con lugar y fecha del matrimonio y pregunta si el cónyuge solicita también.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si presentas el I-485 como cónyuge derivado, normalmente se pide copia del certificado de matrimonio emitido por la autoridad civil del lugar de celebración. Las instrucciones contemplan excepciones y requisitos por categoría, por lo que no debe aplicarse esa regla sin revisar la base de solicitud."
            }
          ],
          [
            38.16,
            234.03,
            215.03,
            16.07,
            "Matrimonios anteriores",
            "Identifica al cónyuge anterior y las fechas, lugares y forma en que terminó el matrimonio.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "09/18/26",
              "addition": "Cuando corresponda acreditar el matrimonio y cualquiera de los cónyuges se haya casado antes, reúne también prueba de la terminación legal de los matrimonios anteriores, como la sentencia de divorcio o certificado de defunción."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-12.webp",
        "page": 12,
        "title": "Hijos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            93.28,
            522.26,
            13.84,
            "Total de hijos vivos",
            "Este I-485 incluye hijos vivos de cualquier edad, conforme a la definición impresa; no se limita a menores de edad.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si la respuesta numérica es cero o ninguno, las instrucciones generales de esta edición indican escribir “None”, salvo una indicación específica diferente. No apliques esa regla si el campo o sus instrucciones establecen otro formato."
            }
          ],
          [
            36,
            190.28,
            56.23,
            13.84,
            "Datos de cada hijo",
            "Solicita identidad, nacimiento, parentesco y si presenta su propio I-485. La parte 14 permite continuar si faltan espacios.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "09/18/26",
              "addition": "Enumerar a un hijo en esta parte no presenta una solicitud por él. Si ese hijo solicita ajuste de estatus, las instrucciones requieren su propio I-485, incluso cuando sea solicitante derivado."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-13.webp",
        "page": 13,
        "title": "Datos biográficos y organizaciones",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            38.16,
            71.74,
            160,
            16.61,
            "Datos biográficos",
            "Etnicidad, raza, estatura, peso y colores de ojos y cabello; las casillas indican si se admite una o varias selecciones."
          ],
          [
            38.16,
            293.74,
            283.06,
            16.61,
            "Elegibilidad e inadmisibilidad",
            "Comienza la parte 9 con preguntas sobre organizaciones y afiliaciones. Las explicaciones adicionales se vinculan a la parte 14.",
            {
              "instructionPages": [
                12
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si alguna respuesta plantea una posible causal de inadmisibilidad, las instrucciones señalan que una exención u otra solución depende de la causal y de la categoría migratoria. No supongas que una respuesta afirmativa se corrige con el mismo trámite en todos los casos."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-14.webp",
        "page": 14,
        "title": "Historial migratorio y antecedentes",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            166.29,
            381.74,
            13.84,
            "Organización adicional",
            "Continúa con actividades, función y fechas de participación en la segunda organización."
          ],
          [
            36,
            280.29,
            272.03,
            13.84,
            "Antecedentes migratorios",
            "Preguntas sobre entrada, visas, empleo autorizado, estatus y procedimientos migratorios.",
            {
              "instructionPages": [
                12
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si tuviste estatus J-1 o J-2, revisa el apartado documental específico: pide los IAP-66/DS-2019 pertinentes disponibles y otros registros de visas y entradas. Si te aplicaba el requisito de residencia de dos años, también explica qué prueba de cumplimiento o exención corresponde."
            }
          ],
          [
            36,
            574.28,
            542.23,
            109.63,
            "Antecedentes penales",
            "El texto explica el alcance de las preguntas 22–41 y qué situaciones deben declararse, incluso ciertos registros sellados o borrados.",
            {
              "instructionPages": [
                11
              ],
              "instructionEdition": "09/18/26",
              "addition": "Además de contestar las preguntas, revisa los documentos policiales y judiciales exigidos para cada situación. Las instrucciones distinguen arrestos sin cargos, cargos, condenas y registros anulados o sellados; no basta con reunir solo la sentencia final en todos los casos."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-15.webp",
        "page": 15,
        "title": "Delitos, sustancias y trata",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60,
            93.28,
            413.8,
            25.63,
            "Conductas y condenas",
            "Las preguntas distinguen conductas, condenas y restricciones impuestas por un juez; no se limitan a arrestos.",
            {
              "instructionPages": [
                12
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si no consigues copias certificadas de una resolución judicial, revisa las tres clases de evidencia alternativa exigidas en la página 12: explicación de indisponibilidad, declaración del solicitante y evidencia secundaria o declaraciones admisibles. No omitas el hecho solo porque falta el registro."
            }
          ],
          [
            36,
            237.29,
            533.23,
            25.63,
            "Sustancias controladas",
            "Pregunta sobre infracciones a leyes de sustancias controladas; las preguntas siguientes abordan tráfico y beneficios relacionados."
          ],
          [
            60,
            567.28,
            415.73,
            25.63,
            "Trata de personas",
            "Sección sobre participación en trata; la nota impresa explica términos utilizados en estas preguntas."
          ]
        ]
      },
      {
        "image": "forms/i485-16.webp",
        "page": 16,
        "title": "Seguridad y actividades relacionadas",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            93.28,
            533.23,
            25.63,
            "Trata y lavado de dinero",
            "Continúan preguntas sobre participación, beneficios vinculados a trata y lavado de dinero."
          ],
          [
            36,
            279.28,
            533.23,
            25.62,
            "Seguridad",
            "Inicia preguntas sobre espionaje, sabotaje, exportaciones y otras actividades; las notas indican cuándo añadir una explicación."
          ]
        ]
      },
      {
        "image": "forms/i485-17.webp",
        "page": 17,
        "title": "Armas, grupos y daños a personas",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60,
            154.28,
            419.12,
            25.84,
            "Armas",
            "Pregunta por venta, suministro o transporte de armas y asistencia relacionada."
          ],
          [
            60,
            255.29,
            421.31,
            25.63,
            "Servicio militar o policial",
            "Pregunta sobre participación en unidades militares o policiales y continúa con grupos armados."
          ],
          [
            36,
            400.28,
            501.67,
            13.84,
            "Daños a personas",
            "Agrupa preguntas sobre tortura, genocidio, muerte y lesiones graves; también aparecen preguntas sobre menores en hostilidades."
          ]
        ]
      },
      {
        "image": "forms/i485-18.webp",
        "page": 18,
        "title": "Carga pública: categorías de exención",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            38.16,
            96.03,
            71.68,
            16.07,
            "Carga pública",
            "Esta sección identifica quién debe responder las preguntas 57–64 según las instrucciones del formulario.",
            {
              "instructionPages": [
                13
              ],
              "instructionEdition": "09/18/26",
              "addition": "Las instrucciones distinguen contestar estas preguntas de adjuntar evidencia inicial de carga pública: por regla general no exigen esa evidencia, con la excepción que describen sobre institucionalización contraria a ley federal. Si USCIS necesita más pruebas, puede emitir un requerimiento; revisa la página 13 antes de enviar documentación adicional."
            }
          ],
          [
            60,
            214.28,
            413.78,
            13.84,
            "Categorías de exención",
            "La pregunta 56 lista exenciones y continúa en la página siguiente. La guía no decide si existe una exención en el caso particular.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si efectivamente corresponde una de las exenciones enumeradas en la pregunta 56, las instrucciones indican seleccionar esa categoría y omitir 57–64. Primero verifica la categoría aplicable; esta guía no determina una exención personal."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-19.webp",
        "page": 19,
        "title": "Carga pública: hogar, recursos y formación",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            159.28,
            538.2,
            37.84,
            "Ruta condicional",
            "Este texto indica cuándo completar 57–64 y cuándo pasar a la pregunta 65.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si no solicitas bajo una de las categorías exentas de la pregunta 56, las instrucciones requieren la opción que lo indica y completar 57–64. No omitas estas preguntas basándote solo en no haber recibido beneficios públicos."
            }
          ],
          [
            36,
            205.29,
            278.95,
            13.84,
            "Hogar y recursos",
            "Preguntas sobre composición familiar, ingresos, activos y deudas del hogar.",
            {
              "instructionPages": [
                6,
                7
              ],
              "instructionEdition": "09/18/26",
              "addition": "Mantén coherencia entre el tamaño del hogar y las personas cuyos ingresos, activos y deudas incluyes. Las instrucciones limitan las deudas a las de miembros del hogar y, para ingresos, excluyen beneficios públicos sujetos a recursos e ingresos de actividades ilegales."
            }
          ],
          [
            36,
            454.28,
            517.52,
            13.84,
            "Habilidades y beneficios",
            "Solicita habilidades y certificaciones; la pregunta siguiente consulta beneficios públicos sujetos a evaluación de recursos.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "09/18/26",
              "addition": "La lista de habilidades no se limita a títulos universitarios: puede incluir capacitación, licencias profesionales, idiomas y certificados de oficios o aprendizaje. Para beneficios públicos, revisa por separado el alcance de 63–64, que abarca beneficios sujetos a evaluación de recursos, pasados o actuales."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-20.webp",
        "page": 20,
        "title": "Beneficios e infracciones migratorias",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36.01,
            93.28,
            524.69,
            25.63,
            "Detalle de beneficios",
            "Tabla condicional para la respuesta afirmativa a la pregunta 63: beneficio, fechas, monto si corresponde y motivo.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si corresponde completar esta tabla, las instrucciones piden beneficio, fechas, valor o monto cuando aplique y una explicación detallada del motivo de recepción. No se limita a beneficios que continúes recibiendo al presentar la solicitud."
            }
          ],
          [
            38.16,
            234.03,
            243.73,
            16.07,
            "Infracciones migratorias",
            "Preguntas sobre procedimientos, documentos, declaraciones, ciudadanía y asistencia a entradas ilegales."
          ],
          [
            38.16,
            504.03,
            431.04,
            16.07,
            "Remoción y presencia ilegal",
            "Preguntas sobre expulsión, entradas y presencia ilegal; las notas indican dónde ampliar respuestas.",
            {
              "instructionPages": [
                12
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si existen antecedentes de remoción o una posible causal de inadmisibilidad, las instrucciones remiten a I-601 e I-212 para conocer las posibles vías y sus requisitos. Esa remisión no significa que debas presentar ambos ni que una exención esté disponible en tu caso."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-21.webp",
        "page": 21,
        "title": "Reingreso y otras conductas",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            171.28,
            519.64,
            25.63,
            "Reingreso",
            "Preguntas condicionales sobre reingreso o intento de reingreso tras presencia ilegal o remoción."
          ],
          [
            38.16,
            294.03,
            116.35,
            16.07,
            "Otras conductas",
            "Incluye preguntas sobre poligamia, custodia, voto, ciudadanía y servicio militar; cada una tiene un alcance propio."
          ]
        ]
      },
      {
        "image": "forms/i485-22.webp",
        "page": 22,
        "title": "Firma del solicitante e intérprete",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            38.16,
            71.74,
            361.32,
            16.61,
            "Solicitante",
            "Parte 10: contacto, certificación y firma del solicitante o de quien esté autorizado según las instrucciones.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "09/18/26",
              "addition": "La firma no puede sustituirse por un nombre mecanografiado o un sello. Las instrucciones permiten, en los casos que describen, la firma de un progenitor o tutor y aceptan copia de una firma manuscrita original para presentación."
            }
          ],
          [
            38.16,
            365.74,
            371.62,
            16.61,
            "Intérprete",
            "Parte 11: si hubo interpretación, identifica al intérprete, idioma, contacto, certificación, firma y fecha. No sustituye la firma del solicitante.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si alguien te interpretó las instrucciones y preguntas, esa persona debe completar su sección, firmar y fechar. Ayudar con la interpretación no elimina la certificación y firma que correspondan al solicitante."
            }
          ]
        ]
      },
      {
        "image": "forms/i485-23.webp",
        "page": 23,
        "title": "Preparador y firma en entrevista",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            38.16,
            70.54,
            525.97,
            31.01,
            "Preparador",
            "Parte 12 para quien preparó la solicitud si no fue el solicitante; incluye contacto, certificación y firma.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si una misma persona interpretó y preparó la solicitud, debe completar ambas partes, 11 y 12. Un nombre mecanografiado o estampado no sustituye su firma."
            }
          ],
          [
            102.74,
            445.28,
            413.02,
            13.84,
            "Esperar a la entrevista",
            "No completar la parte 13 hasta que el oficial de USCIS lo indique durante la entrevista."
          ],
          [
            324,
            663.94,
            157.62,
            13.47,
            "Firma del oficial",
            "Campo reservado al oficial de USCIS, distinto de la firma del solicitante."
          ]
        ]
      },
      {
        "image": "forms/i485-24.webp",
        "page": 24,
        "title": "Información adicional",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            93.44,
            542.4,
            49.68,
            "Continuaciones",
            "Explica cómo añadir respuestas, identificar páginas adicionales y firmarlas y fecharlas según las instrucciones.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "09/18/26",
              "addition": "Si el espacio no alcanza, puedes usar la parte 14 o una hoja adicional. Identifica cada hoja con nombre y número A si lo tienes, y fírmala y féchala."
            }
          ],
          [
            36,
            184.28,
            209.6,
            13.84,
            "Referencia de la respuesta",
            "Cada continuación identifica número de página, parte y pregunta; así queda vinculada al campo original.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "09/18/26",
              "addition": "En cada continuación identifica la página, parte y pregunta originales, no solo el tema de la explicación. Las hojas adicionales deben llevar firma y fecha."
            }
          ]
        ]
      }
    ]
  },
  "citizenship": {
    "name": "Naturalización",
    "form": "N-400",
    "edition": "01/20/25",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/n-400.pdf",
    "official": "https://www.uscis.gov/n-400",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/n-400instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/n400-01.webp",
        "page": 1,
        "title": "Elegibilidad e identidad",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            39.27,
            106.28,
            34.45,
            49.84,
            "Uso exclusivo de USCIS",
            "El área superior de sellos, recibo y actuación es para USCIS."
          ],
          [
            39.6,
            276.84,
            379.33,
            30.16,
            "Base de la solicitud",
            "Parte 1: permite seleccionar una base para solicitar naturalización; esta guía no determina elegibilidad.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "01/20/25",
              "addition": "Seleccionar varias bases o no seleccionar ninguna puede causar demora o rechazo. Revisa las instrucciones de la base concreta antes de marcarla; el tiempo de residencia por sí solo no resume todos los requisitos."
            }
          ],
          [
            39.6,
            587.74,
            337.31,
            16.61,
            "Identidad",
            "Parte 2: nombre legal actual y otros nombres utilizados desde el nacimiento.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si tu nombre legal cambió, reúne la documentación del cambio, por ejemplo certificado de matrimonio, sentencia de divorcio u orden judicial. Entre otros nombres usados, las instrucciones incluyen variantes ortográficas y nombres utilizados en trámites migratorios o penales."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-02.webp",
        "page": 2,
        "title": "Datos personales y Seguro Social",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            76.28,
            107.22,
            13.84,
            "Cambio de nombre opcional",
            "Pregunta si se solicita un cambio legal de nombre y pide el nuevo nombre cuando corresponde.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "01/20/25",
              "addition": "No necesitas pedir aquí un cambio que ya ocurrió legalmente por matrimonio, divorcio u orden judicial. Un cambio solicitado en el N-400 no se hace definitivo hasta la naturalización por el tribunal, según estas instrucciones."
            }
          ],
          [
            36,
            459.28,
            429.77,
            37.63,
            "Excepción por discapacidad",
            "Pregunta sobre una condición que impida demostrar los conocimientos requeridos; el texto remite al formulario N-648.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si solicitas la excepción médica al examen, las instrucciones exigen presentar el N-648 completado junto con el N-400. Presentarlo no garantiza que USCIS conceda la excepción; tampoco debe confundirse con pedir una adaptación de accesibilidad."
            }
          ],
          [
            39.6,
            552.03,
            112.67,
            16.07,
            "Seguro Social",
            "Preguntas sobre tarjeta, actualización de estatus ante SSA, número y consentimiento de divulgación. Revisar cada opción por separado.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "01/20/25",
              "addition": "Pedir una tarjeta mediante el N-400 es opcional. Si la solicitas, las instrucciones vinculan 12.a con el consentimiento en 12.c; para reemplazo, piden el número de la tarjeta en 12.b, y la actualización se efectúa después de aprobación y juramento."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-03.webp",
        "page": 3,
        "title": "Biografía y domicilios",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            39.6,
            53.74,
            412.85,
            16.61,
            "Datos biográficos",
            "Etnicidad, raza, estatura, peso y colores de ojos y cabello.",
            {
              "instructionPages": [
                10
              ],
              "instructionEdition": "01/20/25",
              "addition": "La estatura se expresa en pies y pulgadas, y el peso en libras, no en unidades métricas. Para peso desconocido, inferior a 30 libras o superior a 699, esta edición indica “000”."
            }
          ],
          [
            39.6,
            299.74,
            222.31,
            16.61,
            "Domicilios",
            "Dirección física actual e historial de residencia. El período depende de la base de solicitud, según el texto impreso.",
            {
              "instructionPages": [
                10
              ],
              "instructionEdition": "01/20/25",
              "addition": "El período depende de la base: cinco años para la disposición general, tres para cónyuge de ciudadano o VAWA y solo domicilio actual para las bases 1.D y 1.E que describen las instrucciones. Revisa la base exacta antes de preparar el historial; no uses automáticamente cinco años para todos."
            }
          ],
          [
            36.01,
            712.28,
            291.44,
            13.84,
            "Dirección postal",
            "Pregunta si coincide con el domicilio físico y señala cuándo continuar con la dirección postal en la siguiente página.",
            {
              "instructionPages": [
                11
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si el domicilio postal es distinto, o el domicilio físico no se proporcionó completo, debes indicar una dirección postal vigente y completa. USCIS la utilizará para los avisos; una dirección inválida puede causar rechazo."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-04.webp",
        "page": 4,
        "title": "Dirección postal y matrimonio",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            76.28,
            277.58,
            13.84,
            "Dirección postal",
            "Dirección para recibir correspondencia, incluida una dirección segura cuando corresponda.",
            {
              "instructionPages": [
                11
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si no es seguro recibir correspondencia en tu dirección actual, las instrucciones permiten una dirección segura, como apartado postal o dirección de una persona u organización de confianza donde recibas avisos a tiempo. No es necesario revelar la dirección confidencial de un refugio de violencia doméstica en las condiciones que describe la página 11."
            }
          ],
          [
            39.6,
            251.74,
            254.98,
            16.61,
            "Historial matrimonial",
            "Estado civil y matrimonios. El formulario indica que quienes nunca se casaron pasan a la parte 6.",
            {
              "instructionPages": [
                11
              ],
              "instructionEdition": "01/20/25",
              "addition": "Cuenta por separado cada matrimonio, incluso si fue más de una vez con la misma persona. Las instrucciones incluyen matrimonios en otros países, anulados, civiles, consuetudinarios o religiosos, estén o no registrados ante un gobierno."
            }
          ],
          [
            60,
            405.28,
            334.62,
            13.84,
            "Datos condicionales del cónyuge",
            "Las preguntas 4.a–8 se solicitan para las bases de naturalización indicadas aquí; no son una sección universal.",
            {
              "instructionPages": [
                12
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si solicitas naturalización por matrimonio con ciudadano estadounidense, revisa el paquete de pruebas de esa base: ciudadanía del cónyuge, matrimonio y terminación de matrimonios anteriores cuando corresponda. Las instrucciones también describen evidencia de vida en unión matrimonial; no basta con el nombre del cónyuge."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-05.webp",
        "page": 5,
        "title": "Cónyuge, hijos y empleo",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            60,
            183.29,
            479.11,
            25.84,
            "Empleo del cónyuge",
            "La pregunta 8 solo se contesta para la categoría indicada de cónyuge de ciudadano con empleo cualificado fuera de EE. UU.",
            {
              "instructionPages": [
                14
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si corresponde la base de cónyuge con empleo cualificado fuera de EE. UU., reúne pruebas de ese empleo, no solo el nombre de la empresa. Las instrucciones detallan naturaleza del negocio, trabajo desempeñado, tipo de entidad y otros documentos del empleo."
            }
          ],
          [
            39.6,
            227.74,
            220,
            16.61,
            "Hijos menores de 18",
            "Este N-400 solicita el total y los datos de hijos menores de 18 años, incluidos residencia, parentesco y apoyo.",
            {
              "instructionPages": [
                15
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si tienes hijos dependientes que viven aparte, las instrucciones piden pruebas del apoyo y del cumplimiento de obligaciones de manutención. Si existe orden judicial, reúne la orden y evidencia de cumplimiento; se dan ejemplos como recibos y constancias de pagos."
            }
          ],
          [
            39.6,
            503.74,
            378.67,
            16.61,
            "Empleo y estudios",
            "Historial de trabajo y estudios con direcciones, fechas y ocupación. El período aplicable se explica en el texto de esta sección.",
            {
              "instructionPages": [
                15,
                16
              ],
              "instructionEdition": "01/20/25",
              "addition": "Prepara el historial según la base de la parte 1: tres años para 1.B, 1.C y 1.D; un año para 1.E; cinco años para 1.A, 1.F y 1.G. Se incluyen trabajo o estudios tanto a tiempo completo como parcial."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-06.webp",
        "page": 6,
        "title": "Viajes y antecedentes",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            39.6,
            53.74,
            413.45,
            16.61,
            "Viajes fuera de EE. UU.",
            "Tabla de salidas, regresos y países visitados durante el período indicado según la base de solicitud.",
            {
              "instructionPages": [
                16
              ],
              "instructionEdition": "01/20/25",
              "addition": "La tabla de viajes no tiene el mismo período para todos: cinco años para 1.A, 1.F y 1.G; tres para 1.B y 1.C. Las instrucciones eximen de listar viajes bajo 1.D y 1.E; verifica tu base antes de completar u omitir la tabla."
            }
          ],
          [
            36,
            352.28,
            522.43,
            49.84,
            "Alcance de EVER",
            "La palabra EVER abarca hechos ocurridos en cualquier lugar y momento, salvo que la pregunta limite el alcance."
          ],
          [
            36,
            466.31,
            534.19,
            13.84,
            "Impuestos",
            "Preguntas sobre impuestos vencidos y declaraciones como extranjero no residente; las demás preguntas de la página cubren ciudadanía, voto y afiliaciones.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "01/20/25",
              "addition": "Las transcripciones fiscales no se exigen en todos los casos. Si tienes impuestos vencidos, revisa las pruebas específicas de la página 20: transcripciones del período aplicable, acuerdo de pago firmado y constancia del estado actual del plan."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-07.webp",
        "page": 7,
        "title": "Seguridad y participación en grupos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            37.42,
            76.7,
            513.23,
            25.63,
            "Asistencia a grupos",
            "Pregunta por afiliación, participación o apoyo a grupos vinculados a las conductas enumeradas."
          ],
          [
            36,
            351.28,
            534.31,
            25.63,
            "Servicio militar o policial",
            "Solicita antecedentes de servicio o participación y continúa con grupos armados y lugares de detención."
          ],
          [
            59.72,
            669.28,
            413.8,
            37.63,
            "Menores en grupos armados",
            "Preguntas específicas sobre personas menores de 15 años y participación en grupos u hostilidades."
          ]
        ]
      },
      {
        "image": "forms/n400-08.webp",
        "page": 8,
        "title": "Delitos y resultados judiciales",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            76.7,
            539.11,
            61.63,
            "Alcance de la declaración",
            "El texto explica cuándo completar la tabla y aborda registros sellados, eliminados o aclarados.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "01/20/25",
              "addition": "Las instrucciones incluyen hechos ocurridos antes de los 18 años y antecedentes borrados o indultados. No omitas un hecho solo por esas razones; distingue entre la obligación de declararlo y los documentos que deben acompañarlo."
            }
          ],
          [
            39.1,
            394.29,
            118.87,
            97.84,
            "Detalle de cada hecho",
            "La tabla pide delito, fechas, lugar, resultado y sentencia, cuando corresponda.",
            {
              "instructionPages": [
                21
              ],
              "instructionEdition": "01/20/25",
              "addition": "Para los antecedentes descritos, pueden enviarse fotocopias con la solicitud, pero a la entrevista deben llevarse originales o copias certificadas por el tribunal. La tabla de las páginas 21–22 distingue los documentos necesarios según el resultado de cada incidente."
            }
          ],
          [
            36,
            645.28,
            534.19,
            25.63,
            "Cumplimiento de sentencia",
            "Pregunta si se completó la sentencia suspendida, libertad condicional o supervisión mencionada.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si hubo libertad condicional o sentencia suspendida, reúne evidencia judicial de que terminó. Las instrucciones indican que USCIS no aprobará la naturalización mientras continúe esa situación."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-09.webp",
        "page": 9,
        "title": "Conductas, migración y Servicio Selectivo",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            76.28,
            72.21,
            13.84,
            "Conductas anteriores",
            "Las preguntas siguientes cubren distintas conductas y obligaciones; revisar cada pregunta individualmente.",
            {
              "instructionPages": [
                15
              ],
              "instructionEdition": "01/20/25",
              "addition": "En la pregunta sobre manutención, revisa también la evidencia de cumplimiento de obligaciones para hijos o cónyuge. Las instrucciones citan órdenes judiciales y comprobantes de pagos, entre otros ejemplos; responder la pregunta no sustituye esas pruebas cuando corresponden."
            }
          ],
          [
            36,
            346.7,
            540.81,
            37.63,
            "Procedimientos migratorios",
            "Las preguntas 20–21 y su nota abordan procedimientos de remoción o deportación y explicaciones adicionales.",
            {
              "instructionPages": [
                22
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si estuviste en esos procedimientos o fuiste removido o deportado, revisa los detalles que exigen las instrucciones: nombre, puerto de entrada de remoción, si saliste en avión o por frontera terrestre y motivo de la remoción. La explicación debe identificar lo ocurrido, no limitarse a marcar la casilla."
            }
          ],
          [
            36,
            453.28,
            534.19,
            25.63,
            "Servicio Selectivo",
            "Pregunta condicional sobre residencia en EE. UU. entre edades específicas y registro; contiene excepciones y remisiones a instrucciones.",
            {
              "instructionPages": [
                22
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si no te registraste en el Servicio Selectivo, revisa la tabla de la página 22 antes de reunir documentos: el paso siguiente depende de tu edad y de la base de naturalización. En ciertos casos exige una explicación y carta de situación; no se solicita la misma documentación a todos."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-10.webp",
        "page": 10,
        "title": "Servicio militar y juramento",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            94.28,
            534.19,
            13.85,
            "Servicio militar",
            "Preguntas condicionales para miembros actuales o anteriores de las fuerzas armadas, con saltos indicados en la página.",
            {
              "instructionPages": [
                24
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si solicitas por servicio militar y ya te separaste de las fuerzas armadas, las instrucciones piden copias del DD-214, NGB-22 u otro documento oficial de baja de todos los períodos. Para miembros actuales, revisa el N-426 y las órdenes militares que correspondan; no envíes originales cuando se piden copias."
            }
          ],
          [
            36,
            340.24,
            537.38,
            25.68,
            "Títulos de nobleza",
            "Pregunta por títulos hereditarios u órdenes de nobleza y, cuando corresponde, disposición a renunciar a ellos.",
            {
              "instructionPages": [
                25
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si tienes un título hereditario u orden de nobleza, las instrucciones explican la renuncia durante la ceremonia y la disposición que se declara en 30.b. La mayoría de las personas no tiene estos títulos; revisa el significado antes de contestar."
            }
          ],
          [
            59.74,
            478.28,
            411.56,
            13.84,
            "Juramento de Lealtad",
            "Preguntas sobre comprensión del juramento, capacidad para prestarlo y compromisos relacionados. No es la firma del juramento.",
            {
              "instructionPages": [
                25
              ],
              "instructionEdition": "01/20/25",
              "addition": "Las instrucciones permiten solicitar una afirmación solemne en lugar de “on oath” y omitir “so help me God”, sin documentación. Distinguen esa afirmación de las modificaciones por objeción religiosa o de conciencia y de una exención por discapacidad; son situaciones diferentes."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-11.webp",
        "page": 11,
        "title": "Reducción de tarifa y firma",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            39.6,
            53.74,
            413.45,
            16.61,
            "Reducción de tarifa",
            "Parte 10: solicitud condicional con ingresos y composición del hogar; las tarifas y pruebas se revisan en las instrucciones vigentes.",
            {
              "instructionPages": [
                26
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si solicitas reducción de tarifa, reúne la prueba de ingresos del hogar. Si una declaración fiscal falta o ya no refleja los ingresos actuales, las instrucciones permiten los comprobantes alternativos que enumeran, como recibos consecutivos de pago de al menos el último mes."
            }
          ],
          [
            39.6,
            317.74,
            364.32,
            16.61,
            "Contacto y firma del solicitante",
            "Parte 11: teléfonos, correo, certificación y firma del solicitante o persona autorizada según las instrucciones.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "01/20/25",
              "addition": "Antes de presentar, incluye todas las páginas del N-400 aunque algunas queden en blanco. Las firmas deben ser manuscritas; las instrucciones no aceptan un nombre mecanografiado o sello como sustituto."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-12.webp",
        "page": 12,
        "title": "Intérprete y preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            39.6,
            53.74,
            413.45,
            16.61,
            "Intérprete",
            "Parte 12 para quien interpretó: identidad, contacto, idioma, certificación, firma y fecha.",
            {
              "instructionPages": [
                26
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si hubo interpretación de las preguntas e instrucciones, el intérprete debe completar, firmar y fechar su parte. Esta certificación de interpretación del formulario es distinta de la certificación de traducción de documentos en otro idioma."
            }
          ],
          [
            39.6,
            394.54,
            528.97,
            31.01,
            "Preparador",
            "Parte 13 para quien preparó la solicitud si no es el solicitante. Tiene su propia certificación y firma; si cumple ambos roles, se revisan ambas partes.",
            {
              "instructionPages": [
                26
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si la misma persona interpretó y preparó, debe completar tanto la parte 12 como la 13. Un nombre mecanografiado o estampado no sustituye su firma."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-13.webp",
        "page": 13,
        "title": "Información adicional",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36.06,
            76.38,
            539.35,
            49.47,
            "Continuaciones",
            "Espacio para ampliar respuestas con identificación y referencia a página, parte y pregunta; el texto explica las hojas adicionales.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "01/20/25",
              "addition": "Identifica cada hoja adicional con nombre, número A si lo tienes y la página, parte y pregunta a la que responde. Firma y fecha cada hoja para que la continuación quede vinculada a la solicitud."
            }
          ],
          [
            64.86,
            683.85,
            482.28,
            16.61,
            "Firmas posteriores",
            "No completar las partes 15 y 16 hasta recibir instrucciones del oficial de USCIS en la entrevista.",
            {
              "instructionPages": [
                26
              ],
              "instructionEdition": "01/20/25",
              "addition": "Las instrucciones reservan la firma de las partes 15 y 16 para cuando el oficial lo indique en la entrevista. Esto no sustituye la firma de la solicitud en la parte 11 que corresponda al presentar."
            }
          ]
        ]
      },
      {
        "image": "forms/n400-14.webp",
        "page": 14,
        "title": "Firma en entrevista y juramento",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            39.6,
            53.74,
            164.98,
            16.61,
            "Firma en entrevista",
            "Parte 15: completar solo cuando lo indique USCIS; distingue la firma del solicitante de los campos del oficial.",
            {
              "instructionPages": [
                26
              ],
              "instructionEdition": "01/20/25",
              "addition": "No firmes esta parte por anticipado. Se completa cuando lo solicite el oficial en la entrevista; los campos del oficial son distintos de los del solicitante."
            }
          ],
          [
            39.72,
            215.73,
            144.98,
            16.61,
            "Juramento de Lealtad",
            "Parte 16: no completar hasta que lo indique USCIS en la entrevista. Según las instrucciones, firmar aquí expresa que no hay objeción al juramento; no significa haber prestado el juramento ni haberse naturalizado. Si se aprueba, el juramento se presta en la ceremonia.",
            {
              "instructionPages": [
                26
              ],
              "instructionEdition": "01/20/25",
              "addition": "La firma de esta parte solo indica que no objetas prestar el juramento: no significa que ya lo prestaste ni que ya eres ciudadano. Si se aprueba la solicitud, las instrucciones señalan que aún debes asistir a la ceremonia y prestar el juramento."
            }
          ]
        ]
      }
    ]
  },
  "family": {
    "name": "Petición familiar",
    "form": "I-130",
    "edition": "04/01/24",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-130.pdf",
    "official": "https://www.uscis.gov/i-130",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/i-130instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/i130-01.webp",
        "page": 1,
        "title": "Relación familiar y datos del peticionario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            102,
            540,
            206,
            "Uso exclusivo de USCIS",
            "Este recuadro es para sellos, clasificación y anotaciones de USCIS; no corresponde al peticionario."
          ],
          [
            36,
            318,
            540,
            63,
            "Representación legal",
            "Datos del abogado o representante acreditado, si interviene; no son los datos del familiar beneficiario.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si el abogado o representante acreditado actúa más allá de preparar el formulario, las instrucciones indican que puede corresponder presentar también el G-28."
            }
          ],
          [
            36,
            448,
            260,
            282,
            "Parte 1: parentesco",
            "Distingue al peticionario, que presenta la petición, del beneficiario, su familiar. Las preguntas sobre adopción o tipo de filiación dependen de la relación indicada.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las instrucciones requieren documentos que demuestren el parentesco. La evidencia varía según se trate de cónyuge, hijo, padre, madre o hermano; revisa la categoría correspondiente antes de reunirla."
            }
          ],
          [
            318,
            448,
            258,
            229,
            "Parte 2: peticionario",
            "Identificadores y nombre de quien presenta el I-130. El número A, la cuenta de USCIS y el Seguro Social son identificadores distintos.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "El número de cuenta USCIS no es el mismo que el número A; no intercambies ambos identificadores."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-02.webp",
        "page": 2,
        "title": "Nombres, domicilios y estado civil del peticionario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            95,
            260,
            270,
            "Otros nombres y nacimiento",
            "Información del peticionario: nombres utilizados, lugar y fecha de nacimiento y sexo.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las fechas se expresan como mes/día/año. Si no puedes proporcionar una fecha exacta, las instrucciones permiten una aproximada en el mismo formato con explicación en la Parte 9."
            }
          ],
          [
            36,
            377,
            260,
            315,
            "Dirección postal",
            "Dirección para recibir correspondencia y pregunta que la compara con la residencia física."
          ],
          [
            318,
            53,
            258,
            572,
            "Historial de domicilios",
            "Residencias físicas de los últimos cinco años, dentro o fuera de Estados Unidos, con fechas. El formulario indica cuándo incluir aquí el domicilio actual."
          ],
          [
            318,
            635,
            258,
            104,
            "Estado civil",
            "Número de matrimonios y estado civil actual del peticionario.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "En una petición de cónyuge, si cualquiera estuvo casado antes, se requieren copias de documentos que acrediten la terminación legal de cada matrimonio anterior."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-03.webp",
        "page": 3,
        "title": "Matrimonios, padres y ciudadanía del peticionario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            86,
            260,
            466,
            "Matrimonios del peticionario",
            "Fecha y lugar del matrimonio actual, si existe, y nombres de cónyuges actuales o anteriores con las fechas de terminación correspondientes.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "En una petición de cónyuge, si cualquiera estuvo casado antes, se requieren copias de documentos que acrediten la terminación legal de cada matrimonio anterior."
            }
          ],
          [
            36,
            563,
            260,
            175,
            "Primer progenitor",
            "Nombre y datos personales del primer progenitor del peticionario; la información continúa arriba en la columna derecha.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las fechas se expresan como mes/día/año. Si no puedes proporcionar una fecha exacta, las instrucciones permiten una aproximada en el mismo formato con explicación en la Parte 9."
            }
          ],
          [
            318,
            50,
            258,
            379,
            "Información de los padres",
            "Continúa el primer progenitor y registra los datos del segundo, incluidos nacimiento y residencia.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las fechas se expresan como mes/día/año. Si no puedes proporcionar una fecha exacta, las instrucciones permiten una aproximada en el mismo formato con explicación en la Parte 9."
            }
          ],
          [
            318,
            437,
            258,
            313,
            "Ciudadanía o residencia",
            "Distingue ciudadanía estadounidense de residencia permanente. Las preguntas sobre adquisición de ciudadanía y certificados solo se completan cuando corresponden.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si el peticionario es ciudadano estadounidense, revisa la lista de documentos para acreditar ciudadanía; incluye, según corresponda, acta de nacimiento estadounidense, certificado de naturalización o ciudadanía, informe consular de nacimiento o pasaporte vigente."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-04.webp",
        "page": 4,
        "title": "Residencia, empleo y datos biográficos del peticionario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            86,
            260,
            213,
            "Datos de residente permanente",
            "Si el peticionario es residente permanente, esta sección solicita su clase, fecha y lugar de admisión y cómo obtuvo ese estatus.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si el peticionario es residente permanente, las instrucciones piden copia del frente y reverso de su tarjeta. Si aún no la recibió, describen evidencia alternativa de ese estatus."
            }
          ],
          [
            36,
            311,
            260,
            394,
            "Empleo del peticionario",
            "Historial laboral de los últimos cinco años: empleador, dirección, ocupación y fechas. La instrucción contempla desempleo actual.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Usa mes/día/año para las fechas de empleo. Si una fecha exacta no está disponible, las instrucciones permiten una aproximada acompañada de explicación en la Parte 9."
            }
          ],
          [
            318,
            51,
            258,
            315,
            "Segundo empleador",
            "Continúa el historial laboral del peticionario con otro empleador y sus fechas.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Usa mes/día/año para las fechas de empleo. Si una fecha exacta no está disponible, las instrucciones permiten una aproximada acompañada de explicación en la Parte 9."
            }
          ],
          [
            318,
            377,
            258,
            318,
            "Parte 3: datos biográficos",
            "Estos datos son del peticionario, no del beneficiario. Incluye etnia, raza, estatura en pies/pulgadas, peso en libras y ojos.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La estatura se expresa en pies y pulgadas, no en metros o centímetros."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-05.webp",
        "page": 5,
        "title": "Identidad y domicilios del beneficiario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            53,
            260,
            88,
            "Cabello del peticionario",
            "Esta breve sección todavía pertenece a la Parte 3 y describe al peticionario.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "La instrucción pide seleccionar la casilla que mejor describa el color de cabello; esta parte todavía corresponde al peticionario."
            }
          ],
          [
            36,
            155,
            260,
            583,
            "Parte 4: beneficiario",
            "Aquí cambia la persona: identificadores, nombre, otros nombres, nacimiento, sexo y peticiones anteriores del familiar beneficiario.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "El número de cuenta USCIS y el número A son diferentes. Evita copiar un identificador en el espacio del otro."
            }
          ],
          [
            318,
            53,
            258,
            233,
            "Residencia del beneficiario",
            "Dirección física actual. El propio formulario incluye una excepción para ciertas viviendas en el extranjero sin nombre o número de calle."
          ],
          [
            318,
            305,
            258,
            401,
            "Otros domicilios y teléfono",
            "Domicilio previsto en Estados Unidos, domicilio en el extranjero y teléfono del beneficiario. Las instrucciones impresas distinguen direcciones iguales o diferentes."
          ]
        ]
      },
      {
        "image": "forms/i130-06.webp",
        "page": 6,
        "title": "Matrimonios y familiares del beneficiario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            86,
            260,
            65,
            "Contacto del beneficiario",
            "Teléfono móvil y correo electrónico, si existen."
          ],
          [
            36,
            167,
            260,
            285,
            "Matrimonio actual",
            "Número de matrimonios, estado civil y fecha y lugar del matrimonio actual del beneficiario, según corresponda.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "En una petición de cónyuge, si cualquiera estuvo casado antes, se requieren copias de documentos que acrediten la terminación legal de cada matrimonio anterior."
            }
          ],
          [
            36,
            473,
            260,
            277,
            "Cónyuges del beneficiario",
            "Identifica cónyuge actual y anteriores. La fecha del segundo matrimonio terminado continúa arriba a la derecha, en la pregunta 24.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "En una petición de cónyuge, si cualquiera estuvo casado antes, se requieren copias de documentos que acrediten la terminación legal de cada matrimonio anterior."
            }
          ],
          [
            318,
            83,
            258,
            598,
            "Cónyuge e hijos",
            "Información sobre el cónyuge y los hijos del beneficiario: nombre, relación, nacimiento y país de nacimiento. Continúa en la página siguiente.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "Para ciertas categorías, el cónyuge y los hijos solteros menores de 21 años del beneficiario pueden ser beneficiarios derivados. Esa regla depende de la categoría: anotarlos aquí no demuestra por sí solo que estén incluidos ni evita una petición separada cuando se exige."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-07.webp",
        "page": 7,
        "title": "Entrada, empleo y procesos del beneficiario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            87,
            260,
            354,
            "Familiares: continuación",
            "Personas 4 y 5 de la lista de cónyuge e hijos del beneficiario; cada una tiene relación y datos de nacimiento.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "Para ciertas categorías, el cónyuge y los hijos solteros menores de 21 años del beneficiario pueden ser beneficiarios derivados. Esa regla depende de la categoría: anotarlos aquí no demuestra por sí solo que estén incluidos ni evita una petición separada cuando se exige."
            }
          ],
          [
            36,
            455,
            260,
            279,
            "Entrada a Estados Unidos",
            "Preguntas sobre presencia previa y, si actualmente está en el país, clase de admisión, I-94, llegada y vencimiento de estadía. El pasaporte y documento de viaje continúan arriba a la derecha.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si se emitió un I-94, las instrucciones piden su número y la fecha de vencimiento de la estadía autorizada que figura en ese registro. No confundas esa fecha con la del pasaporte."
            }
          ],
          [
            318,
            167,
            258,
            312,
            "Empleo actual",
            "Empleador y dirección actuales del beneficiario, incluso si trabaja fuera de Estados Unidos, y fecha de inicio.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Usa mes/día/año para las fechas de empleo. Si una fecha exacta no está disponible, las instrucciones permiten una aproximada acompañada de explicación en la Parte 9."
            }
          ],
          [
            318,
            503,
            258,
            213,
            "Procedimientos migratorios",
            "Pregunta si el beneficiario alguna vez tuvo procedimientos migratorios. Los detalles de tipo, lugar y fecha dependen de la respuesta.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si el matrimonio se celebró mientras el cónyuge estaba en determinados procedimientos migratorios, las instrucciones describen un requisito especial de prueba de buena fe. Esa situación requiere revisar la regla aplicable antes de presentar."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-08.webp",
        "page": 8,
        "title": "Domicilio compartido, trámite y otras peticiones",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            87,
            260,
            265,
            "Nombre y dirección en escritura original",
            "Solo corresponde cuando el idioma escrito del beneficiario no utiliza letras romanas."
          ],
          [
            36,
            362,
            260,
            269,
            "Último domicilio compartido",
            "Para una petición de cónyuge: última dirección donde vivieron juntos y fechas. El formulario también contempla que nunca hayan convivido.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "04/01/24",
              "addition": "Para una petición de cónyuge, las instrucciones mencionan un contrato de alquiler que muestre residencia compartida como un ejemplo de evidencia matrimonial. No es el único tipo de prueba posible."
            }
          ],
          [
            318,
            51,
            258,
            211,
            "Trámite consular",
            "La pregunta 62 identifica consulado si el beneficiario solicitará visa en el extranjero. La alternativa de ajuste de estatus aparece en la pregunta 61, abajo a la izquierda; esta guía no determina cuál vía procede.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "La aprobación del I-130 no concede automáticamente residencia permanente ni permiso para inmigrar inmediatamente. La etapa consular o de ajuste y la disponibilidad de visa se evalúan por separado."
            }
          ],
          [
            318,
            275,
            258,
            405,
            "Parte 5: otras peticiones",
            "Peticiones anteriores y sus resultados; familiares para quienes se presentan peticiones separadas. La lista continúa en la página siguiente.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "La regla general para peticionarios ciudadanos es una petición por familiar elegible. Las instrucciones también contienen excepciones para ciertos beneficiarios derivados; no debe asumirse que una sola petición cubre a toda la familia."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-09.webp",
        "page": 9,
        "title": "Declaración y firma del peticionario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            53,
            260,
            289,
            "Otras peticiones y advertencias",
            "Continúa la lista de familiares de la Parte 5 y muestra advertencias sobre relaciones falsas y documentos.",
            {
              "instructionPages": [
                10
              ],
              "instructionEdition": "04/01/24",
              "addition": "La información y los documentos deben ser veraces. Las instrucciones advierten consecuencias por falsificar u ocultar hechos materiales."
            }
          ],
          [
            36,
            351,
            260,
            313,
            "Declaración del peticionario",
            "Indica comprensión del inglés, uso de intérprete y ayuda de un preparador según lo ocurrido. Los roles se desarrollan en las Partes 7 y 8.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Indica la ayuda que realmente recibiste: interpretación y preparación son funciones distintas. Si una persona cumplió ambas, las instrucciones contemplan completar ambas secciones."
            }
          ],
          [
            318,
            53,
            258,
            126,
            "Contacto del peticionario",
            "Teléfonos y correo de quien presenta la petición, no del beneficiario.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las instrucciones piden teléfono diurno y, si existen, teléfono móvil y correo del peticionario."
            }
          ],
          [
            318,
            191,
            258,
            453,
            "Certificación y firma",
            "Declaraciones y autorizaciones del peticionario. La firma y su fecha están en 6.a–6.b; conviene leer toda la certificación antes de firmar.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las instrucciones aceptan una fotocopia, fax o escaneo de una solicitud original que contenga firma manuscrita. Escribir un nombre a máquina no sustituye esa firma."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-10.webp",
        "page": 10,
        "title": "Intérprete y preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            52,
            260,
            545,
            "Datos del intérprete",
            "Parte 7, si se utilizó intérprete: nombre, organización, domicilio y contacto de esa persona.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si se utilizó intérprete, esa persona debe proporcionar sus datos, firmar y fechar la petición. Su certificación corresponde a la interpretación, no reemplaza la del peticionario."
            }
          ],
          [
            318,
            53,
            258,
            230,
            "Certificación del intérprete",
            "Idioma utilizado, certificación, firma y fecha del intérprete. No sustituye la firma del peticionario.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si se utilizó intérprete, esa persona debe proporcionar sus datos, firmar y fechar la petición. Su certificación corresponde a la interpretación, no reemplaza la del peticionario."
            }
          ],
          [
            318,
            297,
            258,
            405,
            "Datos del preparador",
            "Parte 8 para quien prepara la petición, si es una persona distinta del peticionario; registra nombre, organización y domicilio.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si la misma persona fue intérprete y preparador, las instrucciones indican completar tanto la Parte 7 como la Parte 8."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-11.webp",
        "page": 11,
        "title": "Declaración y firma del preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            107,
            260,
            127,
            "Contacto del preparador",
            "Teléfonos y correo de la persona que ayudó a preparar la petición.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si la misma persona fue intérprete y preparador, las instrucciones indican completar tanto la Parte 7 como la Parte 8."
            }
          ],
          [
            36,
            245,
            260,
            197,
            "Condición del preparador",
            "Distingue preparador no abogado de abogado o representante acreditado y el alcance de su representación.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Para representación legal que vaya más allá de preparar el formulario, revisa si también corresponde presentar un G-28."
            }
          ],
          [
            36,
            449,
            260,
            137,
            "Certificación del preparador",
            "Certifica preparación con información proporcionada o autorizada por el peticionario y revisión con este.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si la misma persona fue intérprete y preparador, las instrucciones indican completar tanto la Parte 7 como la Parte 8."
            }
          ],
          [
            36,
            593,
            260,
            87,
            "Firma del preparador",
            "Firma y fecha de quien preparó la petición. Si también fue intérprete, las instrucciones contemplan ambas partes.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si la misma persona fue intérprete y preparador, las instrucciones indican completar tanto la Parte 7 como la Parte 8."
            }
          ]
        ]
      },
      {
        "image": "forms/i130-12.webp",
        "page": 12,
        "title": "Información adicional del I-130",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            53,
            260,
            123,
            "Cómo añadir información",
            "La Parte 9 permite continuar respuestas. Cada hoja adicional identifica a la persona, la página, parte y pregunta; las instrucciones piden firmar y fechar las hojas.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "En hojas de continuación, incluye nombre y número A si existe, identifica página, parte y pregunta, y firma y fecha cada hoja."
            }
          ],
          [
            36,
            177,
            260,
            96,
            "Identificación",
            "Nombre y número A, si existe, de la persona a quien corresponde esta petición o formulario.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "En hojas de continuación, incluye nombre y número A si existe, identifica página, parte y pregunta, y firma y fecha cada hoja."
            }
          ],
          [
            36,
            279,
            260,
            465,
            "Respuestas adicionales: izquierda",
            "Indica página, parte y número de pregunta antes de ampliar la respuesta; no es una sección para iniciar otro trámite.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "En hojas de continuación, incluye nombre y número A si existe, identifica página, parte y pregunta, y firma y fecha cada hoja."
            }
          ],
          [
            318,
            51,
            258,
            693,
            "Respuestas adicionales: derecha",
            "Más espacios de continuación, cada uno con referencia a la página, parte y pregunta originales.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "En hojas de continuación, incluye nombre y número A si existe, identifica página, parte y pregunta, y firma y fecha cada hoja."
            }
          ]
        ]
      }
    ]
  },
  "familySupplement": {
    "name": "Información del cónyuge beneficiario",
    "form": "I-130A",
    "edition": "04/01/24",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-130a.pdf",
    "official": "https://www.uscis.gov/i-130",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/i-130instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/i130a-01.webp",
        "page": 1,
        "title": "Identidad y domicilios del cónyuge beneficiario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            103,
            540,
            62,
            "Representante legal",
            "Recuadro reservado al abogado o representante acreditado, si corresponde."
          ],
          [
            36,
            192,
            540,
            53,
            "Quién completa el I-130A",
            "Este suplemento corresponde al cónyuge beneficiario del I-130. La nota indica que quien reside en el extranjero debe completarlo, pero no necesita firmarlo.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "El I-130A se presenta junto con el I-130 del cónyuge. Si el beneficiario reside en el extranjero, debe completarlo, pero las instrucciones expresamente dispensan su firma."
            }
          ],
          [
            36,
            250,
            260,
            485,
            "Beneficiario y domicilio actual",
            "Identificadores y nombre del cónyuge beneficiario, seguidos del historial de domicilios de cinco años. No son datos del peticionario del I-130."
          ],
          [
            318,
            252,
            258,
            486,
            "Fechas y domicilios anteriores",
            "Fechas del primer domicilio, segundo domicilio y última residencia fuera de Estados Unidos por más de un año. Las fechas de esta última continúan en la página 2.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La guía conjunta I-130/I-130A utiliza el formato mes/día/año para las fechas; revisa ese orden al trasladar tus registros."
            }
          ]
        ]
      },
      {
        "image": "forms/i130a-02.webp",
        "page": 2,
        "title": "Padres y empleo del cónyuge beneficiario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            84,
            260,
            43,
            "Fechas del domicilio en el extranjero",
            "Completa el período correspondiente al último domicilio exterior de la página anterior.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La guía conjunta I-130/I-130A utiliza el formato mes/día/año para las fechas; revisa ese orden al trasladar tus registros."
            }
          ],
          [
            36,
            137,
            260,
            602,
            "Progenitores del beneficiario",
            "Datos de ambos padres del cónyuge beneficiario: nombres, nacimiento y residencia. El primer apellido solicitado para Parent 1 está rotulado Maiden Name.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La guía conjunta I-130/I-130A utiliza el formato mes/día/año para las fechas; revisa ese orden al trasladar tus registros."
            }
          ],
          [
            318,
            47,
            258,
            449,
            "Historial laboral",
            "Empleos de los últimos cinco años, dentro o fuera de Estados Unidos, comenzando por el actual. Incluye ocupación y fechas.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La guía conjunta I-130/I-130A utiliza el formato mes/día/año para las fechas; revisa ese orden al trasladar tus registros."
            }
          ],
          [
            318,
            507,
            258,
            232,
            "Segundo empleador",
            "Otro empleador del cónyuge beneficiario. Su ocupación y fechas continúan en la página 3.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La guía conjunta I-130/I-130A utiliza el formato mes/día/año para las fechas; revisa ese orden al trasladar tus registros."
            }
          ]
        ]
      },
      {
        "image": "forms/i130a-03.webp",
        "page": 3,
        "title": "Empleo exterior, declaración y firma del beneficiario",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            86,
            260,
            83,
            "Continuación del segundo empleo",
            "Ocupación y fechas del empleador 2 indicado en la página anterior.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La guía conjunta I-130/I-130A utiliza el formato mes/día/año para las fechas; revisa ese orden al trasladar tus registros."
            }
          ],
          [
            36,
            184,
            260,
            387,
            "Último empleo fuera de Estados Unidos",
            "Parte 3: último empleo en el extranjero si no aparece antes. Si nunca trabajó fuera del país, la nota remite a la Parte 7.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "La guía conjunta I-130/I-130A utiliza el formato mes/día/año para las fechas; revisa ese orden al trasladar tus registros."
            }
          ],
          [
            318,
            50,
            258,
            279,
            "Intérprete, preparador y contacto",
            "Continúa la declaración de la Parte 4 iniciada abajo a la izquierda. Identifica ayuda recibida y datos de contacto del cónyuge beneficiario."
          ],
          [
            318,
            341,
            258,
            295,
            "Certificación y firma del beneficiario",
            "Certificación, firma y fecha del cónyuge beneficiario. La excepción para beneficiarios residentes en el extranjero figura en la página 1.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "El I-130A se presenta junto con el I-130 del cónyuge. Si el beneficiario reside en el extranjero, debe completarlo, pero las instrucciones expresamente dispensan su firma."
            }
          ]
        ]
      },
      {
        "image": "forms/i130a-04.webp",
        "page": 4,
        "title": "Intérprete y preparador del suplemento",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            52,
            260,
            548,
            "Datos del intérprete",
            "La nota del I-130A pide estos datos si el intérprete utilizado es distinto del que intervino en el I-130."
          ],
          [
            318,
            53,
            258,
            230,
            "Certificación y firma del intérprete",
            "Identifica el idioma y certifica la interpretación al cónyuge beneficiario; incluye firma y fecha."
          ],
          [
            318,
            297,
            258,
            432,
            "Datos del preparador",
            "La nota solicita estos datos cuando el preparador del I-130A es distinto del que preparó el I-130. Es un rol diferente del cónyuge beneficiario."
          ]
        ]
      },
      {
        "image": "forms/i130a-05.webp",
        "page": 5,
        "title": "Certificación del preparador del I-130A",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            113,
            260,
            123,
            "Contacto del preparador",
            "Teléfonos y correo del preparador identificado en la Parte 6."
          ],
          [
            36,
            251,
            260,
            197,
            "Declaración del preparador",
            "Condición profesional y alcance de la representación, si corresponde."
          ],
          [
            36,
            455,
            260,
            136,
            "Certificación",
            "Describe preparación a solicitud del cónyuge beneficiario y revisión de la información con esa persona."
          ],
          [
            36,
            599,
            260,
            85,
            "Firma y fecha",
            "Firma del preparador, distinta de la del beneficiario y de la certificación del intérprete."
          ]
        ]
      },
      {
        "image": "forms/i130a-06.webp",
        "page": 6,
        "title": "Información adicional del I-130A",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            53,
            260,
            123,
            "Cómo añadir información",
            "La Parte 7 permite continuar respuestas. Cada hoja adicional identifica a la persona, la página, parte y pregunta; las instrucciones piden firmar y fechar las hojas."
          ],
          [
            36,
            177,
            260,
            97,
            "Identificación",
            "Nombre y número A, si existe, de la persona a quien corresponde esta petición o formulario."
          ],
          [
            36,
            280,
            260,
            464,
            "Respuestas adicionales: izquierda",
            "Indica página, parte y número de pregunta antes de ampliar la respuesta; no es una sección para iniciar otro trámite."
          ],
          [
            318,
            51,
            258,
            693,
            "Respuestas adicionales: derecha",
            "Más espacios de continuación, cada uno con referencia a la página, parte y pregunta originales."
          ]
        ]
      }
    ]
  },
  "conditions": {
    "name": "Eliminar condiciones por matrimonio",
    "form": "I-751",
    "edition": "04/01/24",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-751.pdf",
    "official": "https://www.uscis.gov/i-751",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/i-751instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/i751-01.webp",
        "page": 1,
        "title": "Residente condicional y datos del matrimonio",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            103,
            540,
            153,
            "Uso exclusivo de USCIS",
            "Sellos, acciones y anotaciones oficiales. No es un bloque para que lo complete el residente condicional."
          ],
          [
            36,
            260,
            540,
            43,
            "Representación legal",
            "Datos del abogado o representante acreditado, si existe.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las instrucciones indican que, si quien ayudó a preparar la petición es abogado o representante acreditado, también debe presentar el G-28."
            }
          ],
          [
            36,
            334,
            260,
            403,
            "Identidad del residente condicional",
            "La Parte 1 corresponde a quien solicita eliminar condiciones: nombre, otros nombres y fecha de nacimiento.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "Este formulario corresponde a residencia condicional obtenida por matrimonio. No es el formulario general para renovar cualquier tarjeta de residente."
            }
          ],
          [
            318,
            333,
            258,
            407,
            "Identificadores, matrimonio y vencimiento",
            "Países de nacimiento y ciudadanía, identificadores y estado civil. Distingue fecha de matrimonio, terminación si aplica y vencimiento de residencia condicional.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si la presentación es conjunta con el cónyuge, las instrucciones fijan los 90 días inmediatamente anteriores al vencimiento de la residencia condicional. Las modalidades individuales o con exención tienen reglas distintas."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-02.webp",
        "page": 2,
        "title": "Domicilios, antecedentes y datos biográficos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            95,
            260,
            383,
            "Dirección postal y física",
            "Domicilio para correspondencia y, si es diferente, lugar de residencia física del residente condicional.",
            {
              "instructionPages": [
                7
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las instrucciones indican que se necesita una dirección en Estados Unidos para presentar esta petición. Revisa por separado las disposiciones especiales para residentes en el extranjero por órdenes militares o gubernamentales."
            }
          ],
          [
            36,
            485,
            260,
            231,
            "Antecedentes y explicaciones",
            "Preguntas sobre procedimientos, pagos a terceros y antecedentes penales. La pregunta 20 remite a explicación y documentación cuando la respuesta es afirmativa.",
            {
              "instructionPages": [
                6,
                7
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si hubo arresto o detención, incluso sin cargos, las instrucciones describen documentos oficiales que pueden ser necesarios. Las páginas 6–7 distinguen incidentes sin cargos, con cargos y condenas; revisa la categoría real."
            }
          ],
          [
            318,
            50,
            258,
            184,
            "Matrimonio, domicilios anteriores y servicio exterior",
            "Preguntas condicionales sobre otro matrimonio, cambios de domicilio desde la residencia permanente y servicio del cónyuge en el extranjero.",
            {
              "instructionPages": [
                5
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si resides en el extranjero por órdenes militares o gubernamentales, las instrucciones establecen requisitos especiales de fotografías, huellas y copia de las órdenes. No se aplican automáticamente a cualquier persona que esté fuera del país."
            }
          ],
          [
            318,
            251,
            258,
            347,
            "Datos biográficos",
            "Etnia, raza, estatura en pies y pulgadas, peso en libras, ojos y cabello del residente condicional.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "La estatura se indica en pies y pulgadas. No conviertas el campo en metros o centímetros."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-03.webp",
        "page": 3,
        "title": "Base de la petición, cónyuge e hijos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            53,
            260,
            472,
            "Parte 3: base de la petición",
            "Distingue presentación conjunta de exención o presentación individual. Cada opción tiene condiciones jurídicas específicas; esta guía explica la ubicación, no elige una base para el caso.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si presentas individualmente porque terminó el matrimonio, las instrucciones piden la sentencia final de divorcio o documento de terminación o anulación, además de evidencia de la relación. Otras bases tienen requisitos distintos."
            }
          ],
          [
            36,
            539,
            260,
            158,
            "Relación con la persona de la Parte 4",
            "Identifica si se trata del cónyuge o excónyuge, o del cónyuge o excónyuge del progenitor cuando el hijo presenta por separado.",
            {
              "instructionPages": [
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si el hijo presenta por separado, las instrucciones piden explicar el motivo y adjuntar documentación de respaldo."
            }
          ],
          [
            318,
            53,
            258,
            394,
            "Datos de la persona de la Parte 4",
            "Nombre, nacimiento, identificadores y dirección del cónyuge o padrastro/madrastra por quien se obtuvo la residencia condicional.",
            {
              "instructionPages": [
                5,
                6
              ],
              "instructionEdition": "04/01/24",
              "addition": "Además de identificar al cónyuge o excónyuge, las instrucciones exigen evidencia de que el matrimonio se celebró de buena fe. Los ejemplos de prueba de la relación aparecen en las páginas 5–6."
            }
          ],
          [
            318,
            467,
            258,
            262,
            "Hijos: primera entrada",
            "La Parte 5 pide información de todos los hijos. Distingue si cada hijo vive con el solicitante y si solicita junto con él; no son preguntas equivalentes.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "La inclusión de un hijo depende de cuándo obtuvo la residencia condicional: las instrucciones distinguen el mismo día o dentro de los 90 días siguientes frente a otros casos. Anotar al hijo y pedir que se eliminen sus condiciones no son automáticamente equivalentes."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-04.webp",
        "page": 4,
        "title": "Información de hijos: continuación",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            95,
            260,
            186,
            "Dirección del hijo 1",
            "Continúa la entrada del primer hijo iniciada en la página 3.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si falta espacio para los datos del hijo, usa la Parte 11 o una hoja adicional identificada con página, parte y pregunta, y firma y fecha cada hoja."
            }
          ],
          [
            36,
            303,
            260,
            394,
            "Hijo 2",
            "Nombre, nacimiento, número A, convivencia, participación en la petición y dirección.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "La inclusión de un hijo depende de cuándo obtuvo la residencia condicional: las instrucciones distinguen el mismo día o dentro de los 90 días siguientes frente a otros casos. Anotar al hijo y pedir que se eliminen sus condiciones no son automáticamente equivalentes."
            }
          ],
          [
            318,
            51,
            258,
            395,
            "Hijo 3",
            "Entrada separada del tercer hijo, con las mismas preguntas y su domicilio.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "La inclusión de un hijo depende de cuándo obtuvo la residencia condicional: las instrucciones distinguen el mismo día o dentro de los 90 días siguientes frente a otros casos. Anotar al hijo y pedir que se eliminen sus condiciones no son automáticamente equivalentes."
            }
          ],
          [
            318,
            465,
            258,
            199,
            "Hijo 4",
            "Datos del cuarto hijo. Su domicilio continúa en la página siguiente.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "La inclusión de un hijo depende de cuándo obtuvo la residencia condicional: las instrucciones distinguen el mismo día o dentro de los 90 días siguientes frente a otros casos. Anotar al hijo y pedir que se eliminen sus condiciones no son automáticamente equivalentes."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-05.webp",
        "page": 5,
        "title": "Hijos y adaptaciones por discapacidad",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            95,
            260,
            186,
            "Dirección del hijo 4",
            "Continúa la información del cuarto hijo de la página anterior.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si falta espacio para los datos del hijo, usa la Parte 11 o una hoja adicional identificada con página, parte y pregunta, y firma y fecha cada hoja."
            }
          ],
          [
            36,
            303,
            260,
            394,
            "Hijo 5",
            "Identidad, convivencia, inclusión en la petición y domicilio del quinto hijo. La Parte 11 ofrece espacio adicional.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "04/01/24",
              "addition": "La inclusión de un hijo depende de cuándo obtuvo la residencia condicional: las instrucciones distinguen el mismo día o dentro de los 90 días siguientes frente a otros casos. Anotar al hijo y pedir que se eliminen sus condiciones no son automáticamente equivalentes."
            }
          ],
          [
            318,
            55,
            258,
            198,
            "Quién solicita una adaptación",
            "La Parte 6 distingue necesidades del solicitante, cónyuge e hijos incluidos.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "04/01/24",
              "addition": "Para solicitar una adaptación, las instrucciones remiten también al aviso de cita y a uscis.gov/accommodationsinfo. Revisa esas indicaciones para la cita concreta."
            }
          ],
          [
            318,
            255,
            258,
            344,
            "Descripción de la adaptación",
            "Si corresponde, identifica discapacidad o impedimento y adaptación solicitada. Incluye opciones auditivas, visuales y otras necesidades.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "04/01/24",
              "addition": "Para solicitar una adaptación, las instrucciones remiten también al aviso de cita y a uscis.gov/accommodationsinfo. Revisa esas indicaciones para la cita concreta."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-06.webp",
        "page": 6,
        "title": "Declaración y contacto del residente condicional",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            55,
            260,
            592,
            "Declaración del peticionario",
            "En el I-751, el peticionario es el residente condicional. Declara comprensión, uso de intérprete y ayuda del preparador. La nota distingue las firmas de cónyuge e hijos menores.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Marca según hayas leído el formulario o recibido interpretación del inglés, e indica si otra persona lo preparó. Son funciones distintas."
            }
          ],
          [
            318,
            53,
            258,
            128,
            "Contacto del peticionario",
            "Teléfonos y correo del residente condicional.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Las instrucciones piden teléfono diurno y, si existen, móvil y correo del peticionario."
            }
          ],
          [
            318,
            193,
            258,
            429,
            "Reconocimiento de la cita biométrica",
            "Explica la reafirmación de veracidad en una cita del ASC. Es una declaración para leer, no un espacio para programar una cita.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si USCIS determina que se requiere una cita biométrica, enviará un aviso con fecha, hora y lugar. Este reconocimiento no reemplaza ese aviso."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-07.webp",
        "page": 7,
        "title": "Firma del residente y declaración del cónyuge",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            125,
            260,
            207,
            "Certificación del peticionario",
            "Certifica documentos, autorizaciones y veracidad de la petición del residente condicional.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "04/01/24",
              "addition": "En general se presentan copias legibles, salvo que las instrucciones soliciten un original. Algunos documentos de antecedentes penales tienen requisitos específicos."
            }
          ],
          [
            36,
            341,
            260,
            184,
            "Firma del peticionario",
            "Firma y fecha del residente condicional. Las notas explican consecuencias de omisiones y una excepción a la firma de la persona de la Parte 4 en ciertos casos.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "04/01/24",
              "addition": "Se admite copia, fax o escaneo de un documento original con firma manuscrita. Un nombre mecanografiado no reemplaza la firma requerida."
            }
          ],
          [
            36,
            540,
            260,
            154,
            "Parte 8, si corresponde",
            "Comienza la declaración del cónyuge o persona identificada en la Parte 4. Su aplicabilidad depende de la modalidad de presentación.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Cuando corresponde la Parte 8, esa persona debe confirmar que leyó y comprendió el reconocimiento ASC, o que se lo leyeron y lo comprendió."
            }
          ],
          [
            318,
            53,
            258,
            552,
            "Declaración y contacto de la persona de la Parte 4",
            "Comprensión del formulario, intérprete o preparador y datos de contacto de esa persona, no del residente condicional.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Cuando corresponde la Parte 8, esa persona debe confirmar que leyó y comprendió el reconocimiento ASC, o que se lo leyeron y lo comprendió."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-08.webp",
        "page": 8,
        "title": "Certificación del cónyuge e identidad del intérprete",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            139,
            260,
            387,
            "Reconocimiento de la cita ASC",
            "Texto para la persona de la Parte 4 cuando la Parte 8 corresponde; describe la reafirmación biométrica.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Cuando corresponde la Parte 8, esa persona debe confirmar que leyó y comprendió el reconocimiento ASC, o que se lo leyeron y lo comprendió."
            }
          ],
          [
            36,
            533,
            260,
            207,
            "Certificación de la persona de la Parte 4",
            "Declaraciones sobre documentos, autorizaciones y veracidad.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Cuando corresponde la Parte 8, esa persona debe confirmar que leyó y comprendió el reconocimiento ASC, o que se lo leyeron y lo comprendió."
            }
          ],
          [
            318,
            53,
            258,
            142,
            "Firma de cónyuge u otra persona",
            "Firma y fecha de la persona de la Parte 4, si procede. No reemplaza la firma del residente condicional.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Cuando corresponde esta parte, la persona de la Parte 4 firma, fecha y proporciona sus propios datos de contacto."
            }
          ],
          [
            318,
            211,
            258,
            487,
            "Parte 9: intérprete",
            "Nombre, organización, domicilio y contacto de quien interpretó; la certificación y firma siguen en la página 9.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "El intérprete también certifica haber leído el reconocimiento ASC en el idioma que comprende el peticionario, y debe firmar y fechar."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-09.webp",
        "page": 9,
        "title": "Certificación del intérprete y datos del preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            95,
            260,
            375,
            "Certificación y firma del intérprete",
            "Idioma utilizado, lectura de preguntas y del reconocimiento ASC, firma y fecha del intérprete.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "El intérprete también certifica haber leído el reconocimiento ASC en el idioma que comprende el peticionario, y debe firmar y fechar."
            }
          ],
          [
            36,
            484,
            260,
            216,
            "Parte 10: preparador",
            "Nombre y organización de quien preparó la petición, si no fue el propio peticionario.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si una misma persona actuó como intérprete y preparador, las instrucciones indican que debe completar las Partes 9 y 10."
            }
          ],
          [
            318,
            53,
            258,
            336,
            "Domicilio y contacto del preparador",
            "Dirección, teléfono, fax y correo de la persona preparadora.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si el preparador está vinculado a una empresa u organización, las instrucciones piden también el nombre y dirección de esa entidad."
            }
          ],
          [
            318,
            401,
            258,
            196,
            "Declaración del preparador",
            "Distingue preparador no abogado y representante legal, y el alcance de la representación. La nota trata el Formulario G-28.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si quien ayudó a preparar la petición es abogado o representante acreditado, las instrucciones indican presentar además el G-28."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-10.webp",
        "page": 10,
        "title": "Certificación y firma del preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            119,
            260,
            172,
            "Certificación del preparador",
            "Declara preparación con consentimiento del peticionario, revisión de respuestas y lectura del reconocimiento ASC.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "El preparador certifica además que leyó al peticionario el reconocimiento ASC y que este manifestó comprenderlo."
            }
          ],
          [
            36,
            299,
            260,
            88,
            "Firma y fecha del preparador",
            "Firma de quien preparó la petición. Si también actuó como intérprete, las instrucciones contemplan completar ambas partes.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "04/01/24",
              "addition": "Si una misma persona actuó como intérprete y preparador, las instrucciones indican que debe completar las Partes 9 y 10."
            }
          ]
        ]
      },
      {
        "image": "forms/i751-11.webp",
        "page": 11,
        "title": "Información adicional del I-751",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            53,
            260,
            132,
            "Cómo añadir información",
            "La Parte 11 permite continuar respuestas. Cada hoja adicional identifica a la persona, la página, parte y pregunta; las instrucciones piden firmar y fechar las hojas.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "Identifica cada hoja adicional con nombre y número A si existe, página, parte y pregunta. Las instrucciones piden firmar y fechar cada hoja."
            }
          ],
          [
            36,
            186,
            260,
            130,
            "Identificación",
            "Nombre y número A, si existe, de la persona a quien corresponde esta petición o formulario.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "Identifica cada hoja adicional con nombre y número A si existe, página, parte y pregunta. Las instrucciones piden firmar y fechar cada hoja."
            }
          ],
          [
            36,
            322,
            260,
            422,
            "Respuestas adicionales: izquierda",
            "Indica página, parte y número de pregunta antes de ampliar la respuesta; no es una sección para iniciar otro trámite.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "Identifica cada hoja adicional con nombre y número A si existe, página, parte y pregunta. Las instrucciones piden firmar y fechar cada hoja."
            }
          ],
          [
            318,
            51,
            258,
            693,
            "Respuestas adicionales: derecha",
            "Más espacios de continuación, cada uno con referencia a la página, parte y pregunta originales.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "04/01/24",
              "addition": "Identifica cada hoja adicional con nombre y número A si existe, página, parte y pregunta. Las instrucciones piden firmar y fechar cada hoja."
            }
          ]
        ]
      }
    ]
  },
  "card": {
    "name": "Renovar o reemplazar tarjeta",
    "form": "I-90",
    "edition": "01/20/25",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-90.pdf",
    "official": "https://www.uscis.gov/i-90",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/i-90instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/i90-01.webp",
        "page": 1,
        "title": "Identidad y direcciones",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            102,
            540,
            126,
            "Reservado para USCIS",
            "No complete los espacios de entrevista, recibo, clasificación y observaciones del bloque de uso oficial."
          ],
          [
            36,
            252,
            258,
            214,
            "Identificadores y nombre",
            "La Parte 1 pide A-Number, cuenta USCIS si la tiene y nombre completo. La nota indica que la tarjeta se emitirá con ese nombre; contraste los datos con sus documentos.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "01/20/25",
              "addition": "El número de cuenta USCIS no es el A-Number. Si presentó por internet, el número de cuenta está en su perfil; si presentó por correo, revise el aviso de acceso a la cuenta."
            }
          ],
          [
            36,
            471,
            258,
            240,
            "Cambio legal de nombre",
            "Siga el recorrido de la pregunta 4. Si corresponde el cambio legal, las preguntas 5.a a 5.c piden el nombre de la tarjeta actual y se requiere evidencia del cambio.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "01/20/25",
              "addition": "La evidencia de cambio legal de nombre debe estar registrada ante la autoridad civil correspondiente. Las instrucciones dan como ejemplos acta de matrimonio, sentencia de divorcio, decreto de adopción u otro documento judicial."
            }
          ],
          [
            318,
            252,
            258,
            471,
            "Dirección postal y física",
            "La dirección postal es para correspondencia. Complete la dirección física únicamente si es distinta; conserve separados apartamento, ciudad, estado y código postal.",
            {
              "instructionPages": [
                3
              ],
              "instructionEdition": "01/20/25",
              "addition": "USCIS no envía la tarjeta a una dirección postal extranjera. Si tiene estatus commuter, revise las instrucciones específicas sobre domicilio extranjero y recogida de la tarjeta en el puerto de entrada."
            }
          ]
        ]
      },
      {
        "image": "forms/i90-02.webp",
        "page": 2,
        "title": "Datos personales y motivo del I-90",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            84,
            258,
            363,
            "Datos personales y admisión",
            "Complete nacimiento, nombres de pila de madre y padre, clase y fecha de admisión, y SSN si lo tiene. Verifique clase y fecha de admisión en sus documentos.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "01/20/25",
              "addition": "La clase de admisión es el código de tres caracteres de la categoría de inmigrante, que aparece en la tarjeta. La fecha de admisión es cuando se le concedió residencia permanente o condicional, no necesariamente la última fecha de viaje."
            }
          ],
          [
            36,
            455,
            258,
            190,
            "Estatus y sección correcta",
            "Seleccione un solo estatus: residente permanente o commuter pasa a la Sección A; residente condicional pasa a la B. I-90 no elimina condiciones ni sirve para renovar residencia condicional.",
            {
              "instructionPages": [
                1,
                4
              ],
              "instructionEdition": "01/20/25",
              "addition": "Las instrucciones distinguen el reemplazo de una tarjeta condicional de la eliminación de condiciones. Para condiciones basadas en matrimonio remiten al I-751; para inversión empresarial, al I-829, según corresponda."
            }
          ],
          [
            318,
            54,
            258,
            584,
            "Sección A: motivo",
            "Para residentes permanentes o en estatus commuter: elija un solo motivo que realmente corresponda y revise su evidencia específica. Pérdida, falta de entrega, error, cambio de datos y vencimiento no son intercambiables.",
            {
              "instructionPages": [
                4
              ],
              "instructionEdition": "01/20/25",
              "addition": "Para tarjeta emitida pero no recibida, compruebe si USCIS la recibió de vuelta como no entregable. Las instrucciones distinguen ese supuesto de una tarjeta enviada a la dirección proporcionada y no devuelta; revise la nota antes de elegir 2.a o 2.b."
            }
          ]
        ]
      },
      {
        "image": "forms/i90-03.webp",
        "page": 3,
        "title": "Trámite, datos biométricos y adaptaciones",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            54,
            258,
            171,
            "Sección B: residencia condicional",
            "Esta sección es solo para reemplazo de tarjeta de residente condicional por los motivos indicados. Según estas instrucciones, no use I-90 si la tarjeta condicional venció o vencerá en 90 días; revise el trámite de eliminación de condiciones aplicable.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "01/20/25",
              "addition": "Para residentes condicionales, las instrucciones excluyen el I-90 si la tarjeta ya venció o vencerá dentro de 90 días, cualquiera que sea el motivo del reemplazo. Revise el trámite de eliminación de condiciones aplicable antes de continuar."
            }
          ],
          [
            36,
            239,
            258,
            403,
            "Historial del trámite",
            "Indique oficinas y lugares del trámite original. Las preguntas 3.a y 3.a.1 se completan si ingresó con visa de inmigrante. Responda con exactitud sobre procedimientos migratorios y abandono de residencia; un sí en 4 o 5 requiere explicación en la Parte 8.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si responde sí sobre procedimientos de exclusión, deportación o remoción, debe dar una explicación detallada en la Parte 8. La pregunta sobre abandono de residencia también requiere explicación cuando la respuesta es sí."
            }
          ],
          [
            318,
            54,
            258,
            352,
            "Información biográfica",
            "Responda etnia, raza, estatura, peso, ojos y cabello según las instrucciones de cada campo. La raza permite varias casillas; observe las unidades de pies, pulgadas y libras.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "01/20/25",
              "addition": "No escriba estatura en metros o centímetros ni peso en kilogramos. Si no conoce su peso, o es inferior a 30 o superior a 699 libras, las instrucciones indican escribir “000”."
            }
          ],
          [
            318,
            413,
            258,
            280,
            "Adaptaciones por discapacidad",
            "La Parte 4 permite solicitar adaptaciones necesarias. Si responde sí, describa la ayuda solicitada; las opciones continúan en la página 4.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "01/20/25",
              "addition": "Para solicitar una adaptación, revise también las instrucciones de su aviso de cita o la página de adaptaciones de USCIS."
            }
          ]
        ]
      },
      {
        "image": "forms/i90-04.webp",
        "page": 4,
        "title": "Adaptaciones y firma del solicitante",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            53,
            258,
            271,
            "Continúan las adaptaciones",
            "Aquí se describen solicitudes relacionadas con ceguera, baja visión u otras discapacidades o limitaciones. Complete lo que corresponda a la solicitud de adaptación.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "01/20/25",
              "addition": "Para solicitar una adaptación, revise también las instrucciones de su aviso de cita o la página de adaptaciones de USCIS."
            }
          ],
          [
            36,
            336,
            258,
            345,
            "Idioma y preparación",
            "Indique si comprendió el formulario en inglés o recibió ayuda de intérprete, y si otra persona lo preparó. El intérprete va en la Parte 6 y el preparador en la Parte 7.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si alguien le ayudó a completar la solicitud, marque la opción que indica que utilizó preparador. Esto es independiente de haber necesitado intérprete."
            }
          ],
          [
            318,
            54,
            258,
            125,
            "Contacto del solicitante",
            "Estos teléfonos y correo pertenecen al solicitante, no al intérprete ni al preparador.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "01/20/25",
              "addition": "Debe proporcionar un teléfono diurno. El teléfono móvil y el correo electrónico se indican si los tiene."
            }
          ],
          [
            318,
            192,
            258,
            467,
            "Certificación y firma",
            "Lea la certificación completa y revise las respuestas antes de firmar en tinta y fechar. No sustituya la firma válida por un nombre mecanografiado. Un padre o tutor solo puede firmar cuando las instrucciones lo permiten.",
            {
              "instructionPages": [
                1
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si el solicitante es menor de 14 años, puede firmar su padre, madre o tutor legal según las instrucciones. Para otros casos de firma por tutor, revise el supuesto específico previsto; no presuponga que cualquier familiar puede firmar."
            }
          ]
        ]
      },
      {
        "image": "forms/i90-05.webp",
        "page": 5,
        "title": "Intérprete y preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            54,
            258,
            534,
            "Datos del intérprete",
            "La Parte 6 se completa si alguien interpretó las preguntas e instrucciones. Identifique a esa persona e incluya su dirección y contacto.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "01/20/25",
              "addition": "El intérprete debe proporcionar su nombre, datos de la organización si corresponde y datos de contacto. Su teléfono móvil y correo se incluyen si los tiene."
            }
          ],
          [
            36,
            597,
            258,
            151,
            "Certificación del intérprete",
            "El idioma debe coincidir con el indicado en la declaración del solicitante. El intérprete certifica su trabajo y la comprensión manifestada por el solicitante.",
            {
              "instructionPages": [
                8,
                9
              ],
              "instructionEdition": "01/20/25",
              "addition": "Esta parte corresponde a quien leyó las instrucciones y preguntas en un idioma que usted domina. Si esa persona también preparó el formulario, debe completar además la Parte 7."
            }
          ],
          [
            318,
            54,
            258,
            82,
            "Firma del intérprete",
            "La firma y fecha del intérprete aparecen arriba a la derecha, aunque su certificación esté en la columna izquierda. No las confunda con la firma del preparador.",
            {
              "instructionPages": [
                8
              ],
              "instructionEdition": "01/20/25",
              "addition": "El intérprete debe firmar y fechar la solicitud, además de completar sus datos."
            }
          ],
          [
            318,
            152,
            258,
            551,
            "Datos del preparador",
            "La Parte 7 corresponde a la persona que preparó la solicitud si no fue el solicitante. Si también interpretó, complete ambas partes. La declaración y firma del preparador están en la página 6.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si la misma persona interpretó y preparó, debe completar ambas partes. Si está vinculada con una organización, las instrucciones piden su nombre y dirección."
            }
          ]
        ]
      },
      {
        "image": "forms/i90-06.webp",
        "page": 6,
        "title": "Responsabilidad del preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            120,
            258,
            206,
            "Declaración del preparador",
            "Indique si es abogado o representante acreditado y el alcance de la representación. La nota explica cuándo podría corresponder presentar G-28.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "01/20/25",
              "addition": "Cuando el abogado o representante acreditado actúa más allá de preparar el formulario, las instrucciones advierten que puede ser necesario un G-28."
            }
          ],
          [
            36,
            340,
            258,
            144,
            "Certificación del preparador",
            "El preparador certifica que trabajó a petición del solicitante y con información autorizada, y que el solicitante revisó el formulario. Debe leer la declaración completa.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "01/20/25",
              "addition": "Revise su copia completa antes de una cita biométrica. Allí deberá poder confirmar de buena fe que la información es completa, verdadera y correcta."
            }
          ],
          [
            36,
            498,
            258,
            80,
            "Firma y fecha",
            "Si una persona distinta del solicitante preparó la solicitud, firma y fecha aquí. Su firma no sustituye la del solicitante ni la del intérprete.",
            {
              "instructionPages": [
                9
              ],
              "instructionEdition": "01/20/25",
              "addition": "Quien ayudó a preparar la solicitud debe firmar y fechar; una firma estampada o un nombre mecanografiado no son aceptables como sustituto."
            }
          ]
        ]
      },
      {
        "image": "forms/i90-07.webp",
        "page": 7,
        "title": "Explicaciones y respuestas adicionales",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            54,
            258,
            259,
            "Identificación y uso de anexos",
            "La Parte 8 permite ampliar respuestas. Incluya nombre y A-Number, si lo tiene. Las hojas adicionales deben identificar la pregunta y llevar firma y fecha según las instrucciones.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si utiliza hojas separadas, identifique cada una con nombre y A-Number, si lo tiene; indique página, parte y pregunta, y firme y feche cada hoja."
            }
          ],
          [
            36,
            322,
            258,
            420,
            "Vincular cada explicación",
            "Indique número de página, parte y pregunta antes de escribir cada ampliación. Use este espacio, por ejemplo, para explicaciones requeridas por las respuestas de la Parte 3.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si utiliza hojas separadas, identifique cada una con nombre y A-Number, si lo tiene; indique página, parte y pregunta, y firme y feche cada hoja."
            }
          ],
          [
            318,
            52,
            258,
            689,
            "Continuación de respuestas",
            "La columna derecha ofrece más bloques con sus propias referencias. Mantenga cada explicación vinculada a su pregunta; no añada respuestas supuestas ni información ajena al trámite.",
            {
              "instructionPages": [
                2
              ],
              "instructionEdition": "01/20/25",
              "addition": "Si utiliza hojas separadas, identifique cada una con nombre y A-Number, si lo tiene; indique página, parte y pregunta, y firme y feche cada hoja."
            }
          ]
        ]
      }
    ]
  },
  "ead": {
    "name": "Permiso de trabajo",
    "form": "I-765",
    "edition": "08/21/25",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf",
    "official": "https://www.uscis.gov/i-765",
    "instructions": "https://www.uscis.gov/sites/default/files/document/forms/i-765instr.pdf",
    "referenceVerified": "blank-upload-reviewed",
    "draft": false,
    "slides": [
      {
        "image": "forms/i765-01.webp",
        "page": 1,
        "title": "Motivo de la solicitud e identidad",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            89,
            540,
            211,
            "Uso oficial y representación",
            "El bloque superior es para USCIS; el bloque de abogado o representante acreditado corresponde a esa persona, si participa. No son datos del solicitante.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si participa un abogado o representante acreditado, revise también si debe acompañar un G-28. Esa representación no elimina las firmas que correspondan al solicitante, intérprete y preparador."
            }
          ],
          [
            36,
            330,
            258,
            242,
            "Parte 1: motivo",
            "Seleccione un solo motivo que corresponda: autorización inicial, reemplazo o renovación. La corrección por error de USCIS tiene indicaciones distintas; revise la nota y las instrucciones antes de elegir.",
            {
              "instructionPages": [
                18
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si solicita renovación en la casilla 1.c, adjunte una copia de su EAD anterior. Seleccione solo el motivo que describa esta solicitud."
            }
          ],
          [
            36,
            588,
            258,
            123,
            "Nombre legal",
            "Aquí comienza la Parte 2: escriba el nombre legal completo del solicitante, respetando los campos de apellidos, nombre y segundo nombre.",
            {
              "instructionPages": [
                18
              ],
              "instructionEdition": "08/21/25",
              "addition": "Use el nombre legal completo que aparece en su acta de nacimiento o en el documento de cambio legal de nombre."
            }
          ],
          [
            318,
            330,
            258,
            301,
            "Otros nombres usados",
            "Incluya los demás nombres que haya usado. Si necesita más espacio, identifique la respuesta en la Parte 6. No invente nombres ni datos.",
            {
              "instructionPages": [
                18
              ],
              "instructionEdition": "08/21/25",
              "addition": "Las instrucciones piden evidencia de los otros nombres usados, por ejemplo acta de nacimiento o matrimonio, documentos de divorcio, identificación oficial o página de identidad del pasaporte."
            }
          ]
        ]
      },
      {
        "image": "forms/i765-02.webp",
        "page": 2,
        "title": "Direcciones e información personal",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            84,
            258,
            358,
            "Correo y domicilio",
            "Indique dónde recibe correspondencia. La pregunta 6 distingue esa dirección del lugar donde vive; complete la dirección física si responde que son diferentes.",
            {
              "instructionPages": [
                18
              ],
              "instructionEdition": "08/21/25",
              "addition": "El EAD se enviará a esta dirección. Si la correspondencia llega a nombre de otra persona, incluya su nombre en “In Care Of Name”; revise las indicaciones especiales sobre dirección segura si corresponden a su caso."
            }
          ],
          [
            318,
            54,
            258,
            223,
            "Identificadores y antecedentes",
            "Incluya A-Number y cuenta USCIS si los tiene; responda sobre sexo, estado civil y solicitudes I-765 anteriores. El SSN se pide si se conoce; no confunda estos números.",
            {
              "instructionPages": [
                18
              ],
              "instructionEdition": "08/21/25",
              "addition": "El estado civil debe corresponder a la fecha en que presenta el I-765. Si ya solicitó autorización de empleo, marque sí en la pregunta 12 y aporte copias de EAD anteriores si están disponibles."
            }
          ],
          [
            318,
            286,
            258,
            148,
            "Ciudadanía o nacionalidad",
            "Liste todos los países de ciudadanía o nacionalidad actuales. Use la Parte 6 para información adicional si el espacio no alcanza.",
            {
              "instructionPages": [
                19
              ],
              "instructionEdition": "08/21/25",
              "addition": "La ciudadanía no necesariamente coincide con el país de nacimiento. Si no tiene ciudadanía de ningún país, las instrucciones indican escribir “stateless” y explicarlo en la Parte 6."
            }
          ]
        ]
      },
      {
        "image": "forms/i765-03.webp",
        "page": 3,
        "title": "Entrada a Estados Unidos y categoría",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            84,
            258,
            182,
            "Nacimiento",
            "Registre lugar y fecha de nacimiento del solicitante. Las fechas siguen el formato mes/día/año indicado en el formulario.",
            {
              "instructionPages": [
                19
              ],
              "instructionEdition": "08/21/25",
              "addition": "Para el país de nacimiento, use el nombre que tenía cuando nació, aunque después haya cambiado o el país ya no exista."
            }
          ],
          [
            36,
            280,
            258,
            441,
            "Última entrada y estatus",
            "Use sus documentos para identificar I-94, pasaporte, última llegada y estatus. El estatus al entrar y el estatus actual son preguntas diferentes; SEVIS se indica si corresponde.",
            {
              "instructionPages": [
                19
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si utilizó pasaporte o documento de viaje para entrar, indique sus datos en el espacio correspondiente aunque ahora esté vencido. No confunda la última entrada con la fecha de emisión del documento."
            }
          ],
          [
            318,
            54,
            258,
            103,
            "Categoría de elegibilidad",
            "La pregunta 27 requiere una sola categoría, respaldada por las instrucciones y su situación real. Esta guía no selecciona una categoría ni confirma que pueda solicitar autorización.",
            {
              "instructionPages": [
                1,
                19
              ],
              "instructionEdition": "08/21/25",
              "addition": "No deduzca la categoría solamente del nombre de un trámite pendiente: las instrucciones distinguen entre beneficios solicitados y ya concedidos. Verifique la sección “Who May File Form I-765” antes de escribir una sola categoría."
            }
          ],
          [
            318,
            160,
            258,
            589,
            "Preguntas según la categoría",
            "Complete las preguntas 28 a 31 solo según la categoría indicada: STEM OPT, cónyuge H-1B, asilo pendiente u otras categorías señaladas. Las preguntas sobre arrestos o condenas y los documentos exigidos dependen de esos apartados.",
            {
              "instructionPages": [
                19,
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si corresponde STEM OPT (c)(3)(C), se pide el nivel y especialidad del título y los datos del empleador en E-Verify. Para (c)(8), una respuesta afirmativa sobre arrestos o condenas remite a las instrucciones especiales de documentos judiciales."
            }
          ]
        ]
      },
      {
        "image": "forms/i765-04.webp",
        "page": 4,
        "title": "Declaración y firma del solicitante",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            156,
            258,
            236,
            "Idioma y ayuda recibida",
            "Indique si leyó y comprendió el formulario en inglés o si un intérprete se lo leyó. Si otra persona lo preparó, identifíquela. Estas opciones deben reflejar lo ocurrido.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si otra persona le ayudó a completar la solicitud, indique que utilizó preparador. Si la misma persona también interpretó, deberá completar ambas partes correspondientes."
            }
          ],
          [
            36,
            402,
            258,
            170,
            "Contacto y casilla específica",
            "Proporcione los datos de contacto del solicitante. La casilla 6 sobre el acuerdo ABC es específica y no debe marcarse sin verificar que corresponda.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "La casilla ABC exige además haber indicado la categoría (c)(8) en la pregunta 27 y cumplir los requisitos del acuerdo; ser salvadoreño o guatemalteco por sí solo no basta."
            }
          ],
          [
            318,
            54,
            258,
            474,
            "Certificación y firma",
            "Lea la certificación completa antes de firmar y fechar. En una presentación en papel, un nombre mecanografiado no sustituye una firma válida. La firma del preparador no reemplaza la del solicitante o autoridad de firma permitida.",
            {
              "instructionPages": [
                16
              ],
              "instructionEdition": "08/21/25",
              "addition": "Las instrucciones aceptan una copia escaneada, fotocopiada o enviada por fax de una solicitud original con firma manuscrita; no una firma sustituida por un nombre mecanografiado."
            }
          ],
          [
            318,
            547,
            258,
            193,
            "Comienza la Parte 4: intérprete",
            "Si utilizó un intérprete, aquí se identifica esa persona; su dirección, certificación y firma continúan en la página 5. No son datos del solicitante.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si alguien interpretó las preguntas e instrucciones en un idioma que usted domina, esa persona debe completar la Parte 4 con sus propios datos y firmarla."
            }
          ]
        ]
      },
      {
        "image": "forms/i765-05.webp",
        "page": 5,
        "title": "Intérprete y preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            54,
            258,
            389,
            "Datos del intérprete",
            "Si hubo intérprete, esta columna continúa sus datos de dirección y contacto. Deben pertenecer a la persona que interpretó.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si alguien interpretó las preguntas e instrucciones en un idioma que usted domina, esa persona debe completar la Parte 4 con sus propios datos y firmarla."
            }
          ],
          [
            36,
            450,
            258,
            229,
            "Certificación y firma del intérprete",
            "El intérprete declara el idioma utilizado y certifica que leyó las preguntas, instrucciones y respuestas. Debe firmar y fechar su propia sección.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "El intérprete debe firmar y fechar la solicitud. Su firma no reemplaza la del solicitante."
            }
          ],
          [
            318,
            54,
            258,
            553,
            "Datos del preparador",
            "La Parte 5 corresponde a quien preparó la solicitud si es distinto del solicitante. Si la misma persona interpretó y preparó, debe completar ambas secciones; su firma continúa en la página 6.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si una misma persona fue intérprete y preparador, debe completar tanto la Parte 4 como la Parte 5. Si trabaja para una organización, incluya los datos de esa organización según las instrucciones."
            }
          ]
        ]
      },
      {
        "image": "forms/i765-06.webp",
        "page": 6,
        "title": "Declaración y firma del preparador",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            120,
            258,
            181,
            "Función del preparador",
            "El preparador identifica si es abogado o representante acreditado y el alcance de su representación. Revise la nota sobre el formulario G-28 cuando corresponda.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si el preparador es abogado o representante acreditado, revise si también debe presentar un G-28 junto con la solicitud."
            }
          ],
          [
            36,
            312,
            258,
            135,
            "Certificación del preparador",
            "Quien preparó la solicitud declara que lo hizo a petición del solicitante y con información autorizada, que el solicitante revisó. Esta certificación no confirma elegibilidad.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Antes de presentar, imprima o guarde una copia del formulario completo para revisarlo en el futuro y conservarlo en sus archivos."
            }
          ],
          [
            36,
            456,
            258,
            82,
            "Firma del preparador",
            "La persona que preparó el formulario, si es distinta del solicitante, firma y fecha aquí. Esta firma es adicional a la del solicitante y a la del intérprete, si lo hubo.",
            {
              "instructionPages": [
                20
              ],
              "instructionEdition": "08/21/25",
              "addition": "Cualquier persona que haya ayudado a completar la solicitud debe firmar y fechar su sección; un nombre estampado o mecanografiado no sustituye la firma."
            }
          ]
        ]
      },
      {
        "image": "forms/i765-07.webp",
        "page": 7,
        "title": "Información adicional",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            54,
            258,
            219,
            "Identificación de las hojas",
            "Use la Parte 6 si necesita espacio adicional. Incluya nombre y A-Number, si lo tiene; las instrucciones piden identificar, firmar y fechar las hojas adicionales.",
            {
              "instructionPages": [
                17
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si agrega hojas, escriba nombre y A-Number, si lo tiene, en cada una; identifique página, parte y pregunta, y firme y feche cada hoja."
            }
          ],
          [
            36,
            280,
            258,
            459,
            "Referencias a la pregunta",
            "En cada bloque indique página, parte y número de pregunta a la que corresponde la respuesta. Escriba la ampliación en el espacio vinculado, sin cambiar la pregunta original.",
            {
              "instructionPages": [
                17
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si agrega hojas, escriba nombre y A-Number, si lo tiene, en cada una; identifique página, parte y pregunta, y firme y feche cada hoja."
            }
          ],
          [
            318,
            52,
            258,
            619,
            "Más bloques de continuación",
            "Los bloques de la derecha continúan la misma función. Use solo el espacio necesario y mantenga clara la relación de cada respuesta con su pregunta.",
            {
              "instructionPages": [
                17
              ],
              "instructionEdition": "08/21/25",
              "addition": "Si agrega hojas, escriba nombre y A-Number, si lo tiene, en cada una; identifique página, parte y pregunta, y firme y feche cada hoja."
            }
          ]
        ]
      }
    ]
  },
  "addressPaper": {
    "name": "Cambio de dirección en papel (alternativa)",
    "form": "AR-11",
    "edition": "11/02/22",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/ar-11.pdf",
    "official": "https://www.uscis.gov/ar-11",
    "instructions": "https://www.uscis.gov/addresschange",
    "referenceVerified": "blank-upload-reviewed",
    "currentEditionVerified": false,
    "draft": false,
    "slides": [
      {
        "image": "forms/ar11-01.webp",
        "page": 1,
        "title": "AR-11 en papel: identidad, domicilios y firma",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            123,
            540,
            72,
            "Identidad y A-Number",
            "Escribe tu nombre y fecha de nacimiento. Incluye el A-Number si tienes uno; no lo confundas con el número de recibo ni con el número de cuenta USCIS."
          ],
          [
            36,
            233,
            540,
            96,
            "Domicilio físico actual",
            "Indica dónde vives ahora, con apartamento, ciudad, estado y ZIP. Este bloque no acepta apartados postales (PO Boxes)."
          ],
          [
            36,
            331,
            540,
            85,
            "Domicilio físico anterior",
            "Este bloque corresponde al domicilio anterior. No lo confundas con el lugar donde recibirás la correspondencia."
          ],
          [
            36,
            426,
            540,
            96,
            "Dirección postal",
            "El formulario identifica esta dirección como opcional. Si corresponde completarla, usa el lugar donde recibes el correo y sigue las instrucciones específicas de tu caso."
          ],
          [
            36,
            528,
            540,
            56,
            "Firma y fecha",
            "Revisa la información y firma y fecha el formulario antes del envío. Esta imagen es una referencia educativa; no presenta un cambio de dirección."
          ]
        ]
      },
      {
        "image": "forms/ar11-02.webp",
        "page": 2,
        "title": "AR-11 en papel: instrucciones y avisos",
        "crop": [
          0,
          0,
          612,
          792
        ],
        "imageWidth": 612,
        "imageHeight": 792,
        "spots": [
          [
            36,
            54,
            540,
            114,
            "Plazo y alcance del aviso",
            "La página indica un plazo de 10 días para quienes están sujetos al requisito de registro. Confirma las excepciones y el procedimiento aplicable en la página oficial de USCIS. Este formulario no acredita identidad ni estatus."
          ],
          [
            36,
            172,
            540,
            26,
            "La corte se actualiza por separado",
            "El AR-11 no cambia tu dirección ante la corte de inmigración. Para corte o BIA, revisa EOIR-33/IC o EOIR-33/BIA y su plazo de cinco días laborables."
          ],
          [
            36,
            216,
            540,
            116,
            "Antes de enviar por correo",
            "Comprueba la edición aceptada y la dirección de envío actual en USCIS. No uses automáticamente la dirección impresa si tu caso tiene un procedimiento especial. Conserva una copia y el comprobante de envío."
          ],
          [
            36,
            348,
            540,
            195,
            "Aviso de privacidad",
            "Lee cómo DHS usa y puede compartir la información y las consecuencias que explica este aviso. No publiques datos personales en la guía ni compartas el formulario completado innecesariamente."
          ]
        ]
      }
    ]
  },
  "travel": {
    "name": "Documentos de viaje y parole",
    "form": "I-131",
    "edition": "01/20/25",
    "source": "https://www.uscis.gov/sites/default/files/document/forms/i-131.pdf",
    "official": "https://www.uscis.gov/i-131",
    "instructions": "https://www.uscis.gov/i-131",
    "instructionsStatus": "not-supplied",
    "referenceVerified": "blank-upload-reviewed",
    "currentEditionVerified": false,
    "draft": false,
    "referenceWarnings": [
      "Referencia de la edición adjunta, no confirmación de edición actualmente aceptada.",
      "El archivo incluye el formulario y avisos breves, no el documento separado de instrucciones.",
      "La presencia de un programa en esta edición no acredita que esté actualmente disponible.",
      "Esta guía no determina elegibilidad ni autoriza salir, trabajar o entrar a Estados Unidos. Revise las instrucciones y advertencias vigentes antes de actuar."
    ],
    "slides": [
      {
        "page": 1,
        "title": "Elegir el tipo de documento",
        "image": "forms/i131-01.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            106,
            540,
            214,
            "Uso oficial y representación",
            "El bloque superior es para USCIS y, donde se indica, para abogado o representante. No lo confunda con la Parte 1 que completa el solicitante."
          ],
          [
            36,
            384,
            540,
            130,
            "Reingreso o documento de refugiado",
            "Las opciones 1 a 3 distinguen permiso de reingreso de documento de viaje para refugiados o asilados. La residencia permanente por sí sola no equivale a residencia obtenida directamente por refugio o asilo; verifique cuál descripción corresponde."
          ],
          [
            36,
            521,
            540,
            95,
            "Autorización de viaje TPS",
            "La opción 4 se refiere a beneficiarios TPS dentro de Estados Unidos y pide el recibo del último I-821 aprobado. No es la misma opción que una solicitud inicial de TPS pendiente."
          ],
          [
            36,
            623,
            540,
            109,
            "Advance parole",
            "La opción 5 comienza aquí y continúa en la página 2. Un I-485 pendiente es una de las bases listadas; indique el recibo cuando se presente por separado. Esta guía no confirma elegibilidad ni autoriza salir o regresar."
          ]
        ]
      },
      {
        "page": 2,
        "title": "Continuación de categorías y parole inicial",
        "image": "forms/i131-02.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            60,
            76,
            516,
            216,
            "Bases de advance parole",
            "Estas opciones continúan la pregunta 5: asilo pendiente, TPS inicial pendiente, DED, DACA aprobado y categorías T o U aprobadas. Lea cuidadosamente si el formulario exige trámite pendiente o aprobado; no son equivalentes."
          ],
          [
            60,
            298,
            516,
            259,
            "Otras bases y explicación",
            "Las opciones restantes incluyen parole actual, unidad familiar y CNMI, entre otras. Si utiliza “Other”, explique la base real; no use esta casilla para suponer elegibilidad."
          ],
          [
            36,
            570,
            540,
            101,
            "Parole inicial desde fuera del país",
            "La pregunta 6 es para la primera solicitud de parole de una persona que está fuera de Estados Unidos, presentada por ella o por otra persona. Los programas específicos continúan en la página 3; su presencia en este PDF no confirma que sigan disponibles."
          ]
        ]
      },
      {
        "page": 3,
        "title": "Parole desde el exterior y parole in place",
        "image": "forms/i131-03.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            60,
            82,
            516,
            237,
            "Programas de parole inicial",
            "Continúa la pregunta 6 con programas y procesos específicos. Complete nombres, números y datos de agencia solo cuando correspondan a la solicitud real; confirme la disponibilidad actual del programa."
          ],
          [
            36,
            327,
            540,
            42,
            "Parole inicial sin programa específico",
            "La pregunta 7 corresponde a una primera solicitud para una persona fuera de Estados Unidos que no se presenta bajo un programa específico. No es una categoría de advance parole para quien ya está dentro."
          ],
          [
            36,
            377,
            540,
            193,
            "Parole in place bajo un programa",
            "La pregunta 8 se refiere a una persona dentro de Estados Unidos y distingue los programas indicados. Observe que el apartado militar especifica presentación en nombre propio."
          ],
          [
            36,
            579,
            540,
            42,
            "Parole in place sin programa específico",
            "La pregunta 9 se refiere a una solicitud inicial de parole in place dentro de Estados Unidos sin programa específico. No trate esta solicitud como permiso para viajar."
          ]
        ]
      },
      {
        "page": 4,
        "title": "Nuevo período de parole e identidad",
        "image": "forms/i131-04.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            83,
            540,
            365,
            "Re-parole bajo un programa",
            "La pregunta 10 es para pedir un nuevo período de parole desde dentro de Estados Unidos bajo los procesos listados. Verifique las condiciones y disponibilidad actuales; esta edición del formulario no prueba que un programa esté abierto."
          ],
          [
            36,
            454,
            540,
            86,
            "Re-parole y fecha del I-94",
            "La pregunta 11 contempla un nuevo período sin programa específico. Si seleccionó 10 u 11, la pregunta 12 pide la fecha de admisión autorizada o parole que figura en el I-94, no una fecha calculada por cuenta propia."
          ],
          [
            36,
            552,
            540,
            52,
            "Condición de refugiado",
            "Responda la pregunta 13 conforme al estatus real y a cómo se obtuvo la residencia, si corresponde. No confunda refugio con una solicitud de asilo pendiente."
          ],
          [
            36,
            618,
            540,
            76,
            "Comienza la Parte 2",
            "Escriba el nombre completo de quien presenta la solicitud en los campos separados. El formulario reserva más adelante una sección distinta si se pide parole para otra persona."
          ]
        ]
      },
      {
        "page": 5,
        "title": "Nombres, direcciones y datos personales",
        "image": "forms/i131-05.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            76,
            540,
            68,
            "Otros nombres",
            "Indique los otros nombres usados si corresponde. Mantenga separados apellidos, nombre y segundo nombre."
          ],
          [
            36,
            166,
            540,
            317,
            "Dirección postal y domicilio",
            "La pregunta 3 pide la dirección postal actual o segura, si corresponde. La pregunta 4 pide la dirección física si es distinta; no confunda dónde recibe correo con dónde vive."
          ],
          [
            36,
            499,
            540,
            159,
            "Datos e identificadores",
            "Incluya los datos de nacimiento, nacionalidad y los identificadores que tenga. A-Number, SSN y cuenta USCIS son campos distintos; no invente números ni use uno en lugar de otro."
          ],
          [
            36,
            663,
            540,
            75,
            "Datos de entrada según el trámite",
            "La indicación aplica a personas dentro de Estados Unidos que solicitan los trámites enumerados en las preguntas 4, 5, 8, 9, 10 u 11 de la Parte 1. Complete clase de admisión e I-94 según corresponda a sus documentos."
          ]
        ]
      },
      {
        "page": 6,
        "title": "Cuando se solicita parole para otra persona",
        "image": "forms/i131-06.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            76,
            540,
            34,
            "Vencimiento e identificador eMedical",
            "Estos campos continúan los datos de la página anterior: fecha de vencimiento de estancia autorizada en el I-94 e identificador USPID, si los tiene. No confunda el vencimiento del I-94 con el del pasaporte."
          ],
          [
            36,
            120,
            540,
            281,
            "Identidad de la otra persona",
            "Complete las preguntas 16 a 27 solo si pide parole en nombre de otra persona. El formulario indica no completar esta sección cuando presenta para sí mismo."
          ],
          [
            36,
            406,
            540,
            153,
            "Dirección postal de esa persona",
            "La pregunta 24 corresponde a la dirección postal de la persona para quien se pide parole, no automáticamente a la del presentador."
          ],
          [
            36,
            568,
            540,
            155,
            "Domicilio de esa persona",
            "La pregunta 25 pide el domicilio físico actual de esa persona. Los datos adicionales continúan al inicio de la página 7."
          ]
        ]
      },
      {
        "page": 7,
        "title": "Biografía e historial de documentos",
        "image": "forms/i131-07.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            85,
            540,
            54,
            "Últimos datos de la otra persona",
            "Las preguntas 26 y 27 siguen la sección para solicitudes en nombre de otra persona: clase de admisión e I-94, si los tiene."
          ],
          [
            36,
            158,
            540,
            227,
            "Datos de quien recibirá el documento",
            "La Parte 3 se refiere a la persona que recibirá el documento o registro. Respete las selecciones únicas o múltiples indicadas y las unidades de pies, pulgadas y libras."
          ],
          [
            36,
            402,
            540,
            179,
            "Procedimientos y documentos anteriores",
            "Responda sobre procedimientos migratorios y documentos anteriores. Si responde sí a 2.a o 3.a, indique la fecha y qué ocurrió con el último documento de ese tipo."
          ],
          [
            36,
            586,
            540,
            59,
            "Saltos y reemplazo",
            "Si solicita parole desde fuera, parole in place o re-parole desde dentro, el formulario indica pasar a la Parte 8. Para los documentos de viaje enumerados, la pregunta 4 consulta si pide un reemplazo."
          ]
        ]
      },
      {
        "page": 8,
        "title": "Reemplazos, correcciones y entrega",
        "image": "forms/i131-08.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            81,
            540,
            122,
            "Motivo del reemplazo",
            "Si respondió sí a reemplazo, distinga falta de recepción, pérdida o daño, error propio o cambio de datos y error ajeno. Siga la indicación para continuar con 6.a y 6.b."
          ],
          [
            36,
            207,
            540,
            272,
            "Qué dato debe corregirse",
            "Marque los datos afectados, explique qué está incorrecto y adjunte copias de documentos de respaldo. No suponga que todos los errores tienen el mismo tratamiento."
          ],
          [
            36,
            489,
            540,
            44,
            "Recibo del documento anterior",
            "La pregunta 6.b pide el recibo del I-131 relacionado con el documento que desea reemplazar, no cualquier recibo migratorio."
          ],
          [
            36,
            538,
            540,
            155,
            "Destino de entrega",
            "Para advance parole, pase a la Parte 7. Si pide permiso de reingreso o documento de refugiado, indique dónde enviarlo; para entrega en otro país, el formulario prevé recogida en la oficina estadounidense correspondiente."
          ]
        ]
      },
      {
        "page": 9,
        "title": "Aviso de recogida y secciones específicas",
        "image": "forms/i131-09.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            82,
            540,
            248,
            "Dónde recibir el aviso",
            "Si pidió envío del permiso de reingreso o documento de refugiado a una oficina estadounidense en el exterior, indique dónde enviar el aviso para recogerlo. Este domicilio de aviso es distinto del lugar de recogida."
          ],
          [
            36,
            348,
            540,
            130,
            "Solo permiso de reingreso",
            "La Parte 5 corresponde únicamente a la opción 1 de la Parte 1. Indique el tiempo total fuera de Estados Unidos desde que obtuvo residencia o durante los últimos cinco años, el período que sea menor."
          ],
          [
            36,
            492,
            540,
            201,
            "Solo documento de refugiado",
            "La Parte 6 corresponde a las opciones 2 o 3. Identifique el país del que es refugiado o asilado y responda sobre viajes, pasaportes y beneficios. Los sí en las preguntas 2 a 6.c requieren explicación en la Parte 13."
          ]
        ]
      },
      {
        "page": 10,
        "title": "Documento de refugiado y viaje propuesto",
        "image": "forms/i131-10.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            56,
            540,
            126,
            "Nacionalidad y protección en otro país",
            "Continúa la Parte 6 para documento de refugiado: responda sobre recuperación o adquisición de nacionalidad y refugio o asilo concedido en otro país. No deduzca las respuestas de la ciudadanía actual solamente."
          ],
          [
            36,
            184,
            540,
            151,
            "Presentación antes o después de salir",
            "La pregunta 5 determina el recorrido: si presenta antes de salir y responde sí, puede omitir 6.a a 6.c; si responde no, debe contestarlas. Estas preguntas no constituyen autorización para salir."
          ],
          [
            36,
            356,
            540,
            253,
            "Viaje propuesto para advance parole",
            "La Parte 7 es solo para advance parole de la pregunta 5 de la Parte 1. Indique salida prevista, propósito y países a visitar; use la Parte 13 si falta espacio."
          ],
          [
            36,
            616,
            540,
            58,
            "Número de viajes y duración",
            "Indique si pretende uno o varios viajes y la duración estimada en días. Solicitar varias entradas no significa que USCIS las haya autorizado ni garantiza la entrada al regresar."
          ]
        ]
      },
      {
        "page": 11,
        "title": "Parole, posible EAD y firma del solicitante",
        "image": "forms/i131-11.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            56,
            540,
            285,
            "Solo parole inicial, in place o re-parole",
            "La Parte 8 corresponde a las opciones 6 a 11. Explique los fundamentos reales y aporte respaldo; indique la duración prevista. Los datos de llegada y oficina de notificación se piden si la persona beneficiaria está fuera de Estados Unidos."
          ],
          [
            36,
            362,
            540,
            67,
            "EAD vinculado a re-parole",
            "La Parte 9 se refiere exclusivamente a la solicitud de EAD al aprobarse un nuevo período de parole de las opciones 10 u 11. Marcar la casilla no otorga autorización laboral ni confirma que corresponda en su caso."
          ],
          [
            36,
            446,
            540,
            155,
            "Contacto del solicitante",
            "Antes de completar la Parte 10, el formulario pide leer las advertencias de viaje y penalidades de las instrucciones. Proporcione los datos de contacto del solicitante."
          ],
          [
            36,
            612,
            540,
            130,
            "Certificación y firma",
            "Lea la certificación completa y revise las respuestas antes de firmar y fechar. La firma certifica información bajo pena de perjurio; no debe sustituirse por una firma inventada ni por la del intérprete o preparador."
          ]
        ]
      },
      {
        "page": 12,
        "title": "Intérprete, si se utilizó",
        "image": "forms/i131-12.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            56,
            540,
            134,
            "Identificación del intérprete",
            "La Parte 11 corresponde a quien interpretó las preguntas e instrucciones. Si no hubo intérprete, el formulario indica pasar a la Parte 12."
          ],
          [
            36,
            204,
            540,
            87,
            "Contacto del intérprete",
            "Incluya los teléfonos y correo de esa persona según lo solicitado, no los datos del solicitante."
          ],
          [
            36,
            306,
            540,
            99,
            "Idioma, certificación y firma",
            "El intérprete identifica el idioma, certifica su intervención y firma con fecha. Esta sección no sustituye la certificación del solicitante."
          ]
        ]
      },
      {
        "page": 13,
        "title": "Persona que preparó la solicitud",
        "image": "forms/i131-13.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            56,
            540,
            134,
            "Quién preparó el formulario",
            "La Parte 12 corresponde a quien preparó la solicitud si es distinto del solicitante. Indique nombre y organización, conforme corresponda."
          ],
          [
            36,
            204,
            540,
            87,
            "Contacto del preparador",
            "Estos datos pertenecen al preparador. Si esa persona también interpretó, son funciones distintas con secciones separadas."
          ],
          [
            36,
            306,
            540,
            105,
            "Certificación y firma del preparador",
            "El preparador certifica que actuó a petición y con consentimiento expreso del solicitante y que este revisó la información. Esa persona firma y fecha su sección."
          ]
        ]
      },
      {
        "page": 14,
        "title": "Información adicional",
        "image": "forms/i131-14.webp",
        "imageWidth": 612,
        "imageHeight": 792,
        "crop": [
          0,
          0,
          612,
          792
        ],
        "spots": [
          [
            36,
            54,
            540,
            131,
            "Identificar cada hoja",
            "Use la Parte 13 si falta espacio. Escriba nombre y A-Number, si lo tiene; si añade hojas, identifique a qué pregunta responden y firme y feche cada hoja."
          ],
          [
            36,
            189,
            540,
            181,
            "Referencias y ampliaciones",
            "En cada bloque indique página, parte y pregunta antes de la explicación. Mantenga cada respuesta vinculada al apartado original."
          ],
          [
            36,
            381,
            540,
            277,
            "Más espacio de continuación",
            "Los bloques restantes sirven para continuar respuestas o explicaciones requeridas. Puede copiar esta página o añadir hojas siguiendo las indicaciones superiores; no añada información supuesta."
          ]
        ]
      }
    ]
  }
};
