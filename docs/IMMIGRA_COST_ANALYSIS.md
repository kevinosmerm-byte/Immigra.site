# Immigra: costos y propuesta de precios

Fecha: 14 de octubre de 2026. Moneda: USD. El propietario indicó que utiliza planes gratuitos o básicos; no se revisaron facturas ni consumo real. Los precios externos no pudieron verificarse en vivo desde este entorno. Se guardaron los destinos públicos de consulta en el borrador de configuración de red, pendiente de activación; eso todavía no concede acceso ni verifica precios. Las cifras de proveedores siguientes son **supuestos de presupuesto**, que deben sustituirse por las tarifas vigentes de la cuenta. No son una cotización ni un pronóstico de beneficio.

## Qué consume la app

El código usa `gpt-4o-mini` para conversación/evaluación de lectura y escritura, salvo override de `OPENAI_TEXT_MODEL`, y `gpt-4o-mini-transcribe` para transcripción. La voz usa síntesis del navegador/dispositivo; el flujo principal no compra TTS de OpenAI ni LiveKit. La evaluación cívica es determinista y no consume un modelo. D-ID es una integración opcional separada y queda fuera del presupuesto base; si se habilita debe añadirse su factura.

La suscripción a ChatGPT no incluye automáticamente el consumo de la API OpenAI de Immigra. No hay una IA privada de este asistente que sirva gratis las conversaciones de la app: se usa el proyecto API configurado en Render.

## Costos fijos propuestos

| Concepto | Supuesto de costo | Observación |
| --- | --- | --- |
| Cloudflare Pages | $0/mes inicialmente | Dentro de cuotas gratuitas; Workers/Functions/tráfico adicional puede cambiar el costo. |
| Supabase | $0 gratis; $25/mes en escenario Pro | Confirmar tarifas, tamaño, uso y si el proyecto necesita disponibilidad/respaldos de pago. |
| Render | $0 gratis; $7/mes en escenario básico | Confirmar la instancia real. Un servicio gratuito puede suspenderse y afectar el inicio de entrevistas. |
| Dominio | $20/año de presupuesto = $1.67/mes | Sustituir por renovación real de immigra.site. |
| Apple Developer | $99/año de presupuesto = $8.25/mes | Solo al distribuir iOS; comprobar elegibilidad y tarifa local. |
| Google Play Console | $25 una vez de presupuesto | No es una cuota mensual; confirmar el importe de registro vigente. |

Totales amortizados: **$9.92/mes** con alojamiento gratis y publicación iOS; **$16.92/mes** con Render básico + Supabase gratis; **$41.92/mes** con Render básico + Supabase Pro. Sin iOS todavía contratado, restar $8.25; si el dominio ya está pagado, sigue existiendo su costo económico aunque no se cobre mensualmente. OpenAI, pagos, impuestos, soporte, desarrollo, marketing, correo transaccional y sobreconsumos son adicionales.

## Costo variable de práctica

Supuestos de cálculo: texto a $0.15/millón de tokens de entrada y $0.60/millón de salida; transcripción a $0.003/minuto de audio enviado. Usamos 2 intercambios por minuto de conversación, 6,000 tokens de entrada y 500 de salida por intercambio, y audio enviado durante la mitad del tiempo. Son parámetros conservadores para comparar escenarios; no representan una medición de usuarios.

Costo estimado por minuto de conversación = `2 × (6000 × 0.15 + 500 × 0.60) / 1,000,000 + 0.5 × 0.003` = **$0.0039**. Un minuto de conversación no equivale a un minuto de audio facturado. Contextos más largos, fallos/reintentos, modelos distintos o síntesis de pago cambian el resultado.

| Uso por usuario | Minutos de conversación al mes | IA estimada |
| --- | ---: | ---: |
| Ligero | 120 | $0.47 |
| Habitual | 300 | $1.17 |
| Frecuente | 900 | $3.51 |
| Intensivo | 1,800 | $7.02 |

La prueba gratuita también cuesta. Si una persona usa 70 minutos en siete días, cuesta aproximadamente $0.273 de IA. Con conversión del 20%, adquirir un suscriptor consume $1.365 en pruebas gratuitas. Distribuido en tres meses de permanencia, supone $0.455 por suscriptor y mes. Si convierte el 5%, sube a $1.82 por mes. Son hipótesis, no datos existentes. Esta amortización presupone permanencia y cobros futuros; la salida de dinero por pruebas al lanzar puede ser mayor que el costo mensual repartido. El acceso ilimitado no permite garantizar un costo máximo por cuenta; conservar protección contra automatización y observar consumos reales, sin alterar la política de siete días.

## Precio mínimo bajo estos supuestos

Punto de equilibrio nativo = `(fijos/suscriptores + IA + adquisición de pruebas + soporte) / (1 - comisión)`.

Para comparar incluimos $0.50/usuario/mes como reserva de soporte, conversión del 20%, tres meses de permanencia y comisión de tienda del 15% **solo si corresponde al programa/tipo de suscripción aplicable**. Apple puede requerir elegibilidad/inscripción; también calcular con 30%. No se incluyen salarios, publicidad pagada ni impuestos. No se divide el costo fijo entre usuarios gratuitos: el denominador son suscriptores de pago.

| Escenario | Suscriptores | Uso mensual | Equilibrio con comisión 15% |
| --- | ---: | ---: | ---: |
| Fijos $16.92 | 10 | 300 min | $4.49/mes |
| Fijos $16.92 | 50 | 300 min | $2.90/mes |
| Fijos $41.92 | 10 | 300 min | $7.43/mes |
| Fijos $41.92 | 50 | 300 min | $3.49/mes |
| Fijos $16.92 | 10 | 900 min | $7.24/mes |
| Fijos $41.92 | 50 | 900 min | $6.24/mes |

En web, usar la comisión Stripe efectiva. Un ejemplo de presupuesto es 2.9% + $0.30 por cobro, más 0.7% si el plan de Stripe Billing contratado cobra ese porcentaje. No dar esas tarifas por universales; tarjetas internacionales, divisas, impuestos y el contrato concreto pueden variar.

## Recomendación

- **$4.99/mes**: piso comercial de lanzamiento solo con costos básicos y uso ligero/habitual. No es un precio sostenible garantizado para práctica ilimitada o diez suscriptores con infraestructura Pro.
- **$7.99/mes y $69.99/año**: propuesta inicial para Immigra con entrevistas y práctica de IA. El anual equivale a $5.83/mes y descuento aproximado del 27%; revisarlo si predomina voz intensiva o baja la conversión. No cambiar precios ya aceptados por suscriptores sin comunicarlo y respetar las reglas del proveedor.
- El precio web actual del código, **$5.99/mes y $49.99/año**, puede funcionar con planes básicos y uso moderado; el anual equivale a $4.17/mes y deja poco margen ante uso frecuente. No se cambió en este trabajo.
- La IA y los costos fijos solos no son el precio de negocio completo. Medir 30 días: minutos enviados, tokens, gasto por usuario, conversión, permanencia, soporte y reembolsos. Recalcular con el promedio y percentiles de consumo; un promedio bajo no protege frente a cuentas extremadamente intensivas.

## Competencia y posicionamiento

| Alternativa | Precio que podemos afirmar aquí | Implicación para Immigra |
| --- | --- | --- |
| Material oficial USCIS | Recursos educativos oficiales gratuitos | Cobrar solo por preguntas estáticas ofrece poca diferenciación. Mantener estudio local gratis. |
| Citizen Now y otras apps de examen | Precio actual de compra/suscripción no verificado | Comparar la oferta de pago de cada plataforma/región, no solo la descarga gratuita. |
| Cursos y simuladores de naturalización | Precios actuales no verificados | Comparar si incluyen conversación en vivo, feedback, N-400 e idiomas. No equiparar un curso completo con una app de tarjetas. |
| Duolingo y apps de idiomas | Oferta gratuita/planes comerciales; precio actual no verificado | Competencia parcial en inglés; no sustituyen necesariamente práctica migratoria guiada. |

No se encontró evidencia accesible para afirmar que un competidor cobra hoy un importe concreto. **$7.99 es una recomendación basada en costos y utilidad, no un promedio de mercado verificado.** La comparación pendiente debe registrar tienda/país, fecha, moneda, período, promociones y funciones incluidas; no mezclar precio único con mensual o anual.

El argumento de valor es conversación guiada con Sarah/Kevin, práctica en el idioma elegido, continuidad sin preguntas repetitivas, feedback y preparación de ciudadanía/asilo/ajuste. Nunca anunciar estrategia legal, representación, garantía de aprobación o sustitución de un abogado.

## Fuentes para reconfirmar antes de fijar precios

- OpenAI: https://openai.com/api/pricing/
- Render: https://render.com/pricing
- Supabase: https://supabase.com/pricing
- Cloudflare: https://www.cloudflare.com/plans/developer-platform/
- Stripe: https://stripe.com/pricing y https://stripe.com/billing/pricing
- Apple: https://developer.apple.com/programs/ y https://developer.apple.com/app-store/small-business-program/
- Google: https://play.google.com/console/about/ y https://developer.android.com/google/play/billing
- USCIS: https://www.uscis.gov/citizenship/find-study-materials-and-resources

El simulador `reports/immigra-cost-calculator.html` permite reemplazar fijos, minutos, conversión y comisión. Sus resultados son estimaciones de equilibrio antes de impuestos y trabajo del desarrollador, no tarifas publicadas ni ingresos asegurados.
