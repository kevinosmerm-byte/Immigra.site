### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `index.html`, `public/social/immigra-preview-20261015.png`.
* **Deep User Experience Impact (Pros & Cons):** Se utiliza la imagen elegida por el propietario para la vista previa de enlaces, manteniendo los iconos de instalación y navegación. La vista previa anterior utilizaba el icono cuadrado de la app.
* **Root-Cause Architectural Failure:** Las etiquetas sociales apuntaban a `share-icon.png`, declaraban dimensiones cuadradas y no tenían una imagen social independiente. Faltaban metadatos generales de Immigra en el HTML principal.
* **Production-Grade Implementation:** Se extrajo sin modificación la imagen RGB de 1731 × 909 píxeles del PDF `immigra_site_social_preview.pdf`. PNG de 1.442.950 bytes, SHA-256 `41487bd0746007c4fa4b2ddd995fb2d2567ce24c0614289fcf3bea3a8728932e`. Open Graph y Twitter apuntan al nuevo recurso HTTPS con dimensiones, tipo y texto alternativo; Twitter solicita summary_large_image. Se identifican el sitio y URL canónica de Immigra. El recurso lleva nombre con fecha para distinguirlo del icono anterior.

```html
<meta property="og:image" content="https://immigra.site/social/immigra-preview-20261015.png" />
<meta property="og:image:width" content="1731" />
<meta property="og:image:height" content="909" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://immigra.site/social/immigra-preview-20261015.png" />
```

Verificación: compilación de producción, etiquetas únicas en el HTML compilado, dimensiones declaradas frente al encabezado PNG, igualdad exacta con el PNG extraído y rutas de favicon/apple-touch-icon conservadas. Petición HTTP con agente facebookexternalhit devuelve el PNG sin autenticación, Content-Type image/png y tamaño correcto. La comprobación en la web pública se realiza tras el despliegue. No se cambiaron entrevistadores, datos legales ni lógica de cuenta. No se ejecutó de nuevo la suite funcional para este cambio estático. Cada red social controla su propio recorte y caché; no se afirma que una conversación existente actualice su miniatura automáticamente.
