# Paleta oficial de CitizenshipAI

Paleta proporcionada por el usuario el 5 de octubre de 2026. Fuente técnica: `src/BrandPalette.css`.

| Uso | Variable CSS | HEX |
| --- | --- | --- |
| Navy institucional: títulos e iconos | --color-navy | #123A63 |
| Azul federal: acciones principales | --color-primary | #2563A6 |
| Azul AI: foco, progreso y acentos | --color-ai | #4DA3E6 |
| Rojo patriótico: acentos y alertas | --color-red | #C92A3A |
| Rojo suave: acentos decorativos y hover | --color-red-soft | #E45A65 |
| Blanco principal: tarjetas y superficies | --color-white | #FFFFFF |
| Blanco azulado: superficies secundarias | --color-background | #F4F8FC |
| Gris borde: bordes y divisores | --color-border | #D8E2EC |
| Texto principal | --color-text | #172B3D |

Usar estas variables en todas las pantallas nuevas y modificadas. Mantener títulos navy, texto principal oscuro y botones primarios azul federal con texto blanco. El azul luminoso y rojo suave son acentos: no usarlos como texto pequeño sobre blanco. Mantener estados semánticos de éxito/error y contraste legible. No recolorear fotos, videos ni el fondo proporcionado por el usuario. Mantener las separaciones de 16 px entre tarjetas y objetivos táctiles de al menos 44 px.

## Estilo presidencial / luxury
Aplicar a todos los botones una apariencia institucional elegante: navy y azul federal, bordes finos, sombras suaves y geometría consistente. Títulos de tarjetas en Georgia; etiquetas de acción legibles en sans serif. Evitar neones, dorados añadidos, efectos excesivos y mezcla de colores fuera de la paleta. Conservar iconos, estados activos, grabación, deshabilitado y foco accesible. No reducir el tamaño táctil ni recortar etiquetas para conseguir el efecto visual.

## Temas
El modo claro es el predeterminado para usuarios nuevos. Respetar siempre la preferencia guardada (claro, oscuro o sistema). Las superficies claras deben estar limitadas a `html:not([data-theme="dark"])`; no imponerlas sobre el modo oscuro. En oscuro usar texto claro sobre superficies navy; conservar la paleta oficial para acentos. Las dimensiones de videos e imágenes deben ser independientes del tema.

### Profundidad de los botones claros
Mantener superficies blancas con un degradado azul pálido hacia los bordes, brillo interior blanco y sombra azul suave. Usar navy para accesos institucionales, azul AI para estudio/progreso y una línea roja discreta para entrevista cívica/plan diario. No convertir toda la tarjeta en un color saturado. En hover, intensificar suavemente el azul; conservar foco visible y texto oscuro. Aplicar estos tratamientos claros solo al tema claro.
