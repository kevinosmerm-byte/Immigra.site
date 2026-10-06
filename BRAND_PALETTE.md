# Paleta oficial de CitizenshipAI

Paleta proporcionada por el usuario el 5 de octubre de 2026, actualizada con el fondo blanco, los botones translúcidos y Public Sans solicitados el 6 de octubre. Fuente técnica: `src/BrandPalette.css`; presentación: `src/WhiteStyle.css`.

| Uso | Variable CSS | HEX |
| --- | --- | --- |
| Navy institucional: títulos e iconos | --color-navy | #123A63 |
| Azul federal: acciones principales | --color-primary | #2563A6 |
| Azul AI: foco, progreso y acentos | --color-ai | #4DA3E6 |
| Rojo patriótico: acentos y alertas | --color-red | #C92A3A |
| Rojo suave: acentos decorativos y hover | --color-red-soft | #E45A65 |
| Blanco principal: tarjetas y superficies | --color-white | #FFFFFF |
| Blanco suave: final del degradado superior | --color-white-soft | #F1F5F8 |
| Blanco simple: fondo de la aplicación | --color-background | #FFFFFF |
| Gris borde: bordes y divisores | --color-border | #D8E2EC |
| Texto principal | --color-text | #172B3D |

Usar estas variables en todas las pantallas nuevas y modificadas. Mantener títulos navy, texto principal oscuro y acciones principales navy con texto blanco. El azul luminoso y rojo suave son acentos: no usarlos como texto pequeño sobre blanco. Mantener estados semánticos de éxito/error y contraste legible. El fondo de la página es blanco simple, sin imagen ni degradado; conservar fotos, videos y las imágenes de las tarjetas. Las barras superiores usan el degradado de blancos solicitado: blanco a una mezcla de blanco al 65 % y gris borde al 35 %, con sombra navy al 6 %. Mantener las separaciones y dimensiones de la interfaz existente.

## Estilo presidencial / luxury
Aplicar a todos los botones navy y azul federal, bordes finos y la geometría existente. Usar Public Sans del U.S. Web Design System en títulos, texto y controles, con archivos WOFF2 locales en pesos 400, 600 y 700; procedencia y licencia en `public/fonts/public-sans/`. Conservar iconos, estados activos, grabación, deshabilitado y foco accesible. No reducir el tamaño táctil ni recortar etiquetas para conseguir el efecto visual.

## Temas
El modo claro con fondo blanco es el predeterminado. La actualización aplica este diseño una sola vez a las preferencias anteriores; el marcador `citizenshipai.appearance.v2` evita repetir la migración. Después se respeta cualquier elección explícita de claro, oscuro o sistema en Ajustes. Las superficies claras se limitan a `html:not([data-theme="dark"])`. Las dimensiones de videos e imágenes son independientes del tema.

### Profundidad de los botones claros
Los botones usan degradados con canal alfa de `src/BrandPalette.css`. `--button-primary-gradient` mezcla navy al 94 % y azul federal al 96 %, con texto blanco; `--button-secondary-gradient` mezcla azul federal al 4 % y azul AI al 15 %, con texto navy; `--button-selected-gradient` aumenta las intensidades al 16 % y 28 %. La transparencia corresponde al fondo; texto e iconos conservan su opacidad para mantener el contraste. Los estados de grabación, éxito y error conservan sus colores semánticos.

Los destinos de Inicio tienen tratamientos propios: N-400 azul federal, Civismo azul AI, Ayuda migratoria navy, Escritura azul a rojo suave y Podcast rojizo. Usar sus variables `--button-*-gradient`, sin seleccionar por posición ni alterar etiquetas. Podcast mantiene borde e icono rojo patriótico y texto navy; su hover aumenta suavemente la intensidad del degradado. Las superficies de la página son blancas; el degradado de blancos se limita a los encabezados superiores. Aplicar estos tratamientos solo al tema claro.

### Verificación de contraste
`src/ThemeConsistency.css` mantiene pares de fondo y texto para ambos temas. La capa CSS `white-appearance` de `src/WhiteStyle.css` aplica el diseño blanco sobre las reglas antiguas sin modificar la distribución. No fijar letras blancas sin fijar también una superficie oscura. Botones secundarios claros con texto navy; acciones principales navy y acciones de voz/revisión rojo patriótico. Verificar el color calculado, la fuente realmente cargada y las vistas móviles después de modificar reglas antiguas.
