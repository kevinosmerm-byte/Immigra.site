### 🧠 Advanced AI Brain Diagnostic Ledger

* **Target File / Component:** `src/main.jsx`, `modules/residency/src/ResidencyPracticeSetup.jsx`; revisión transversal de Inicio, Cuenta, Ajustes, Ayuda, Preparación, Perfil y los tres módulos.
* **Deep User Experience Impact (Pros & Cons):**
  * *Pros:* Las 56 combinaciones de pantalla, idioma y tamaño cargaron sin errores JavaScript, imágenes rotas visibles ni desbordamiento horizontal. Se conserva la selección de entrevistador, parentesco, duración, consentimientos y apertura de casos.
  * *Friction Points:* Bloquear localStorage producía una pantalla vacía al arrancar. Las tres vistas previas de Residencia ignoraban Reducir movimiento de la app. El mensaje de recuperación podía usar el idioma HTML inicial antes de aplicar la preferencia guardada.
* **Root-Cause Architectural Failure:** SessionApp leía localStorage sin proteger la lectura durante su primer render, antes del límite de errores. Las vistas previas consultaban solamente prefers-reduced-motion del sistema. La recuperación dependía del idioma DOM que App todavía no había actualizado.
* **Production-Grade Implementation:** Lectura protegida del idioma al arrancar y al recuperar sesión. Las vistas previas consumen useGlass y sincronizan reproducción con las preferencias de la app y del sistema, visibilidad de pestaña e intersección con pantalla. Se limpian listeners, observador y videos al desmontar.

Lectura segura utilizada por App y SessionApp:

```js
function readLanguage() {
  try {
    return localStorage.getItem('citizenshipai.language') === 'en' ? 'en' : 'es';
  } catch {
    return document.documentElement.lang === 'en' ? 'en' : 'es';
  }
}
```

Vista previa implementada:

```jsx
function InterviewerPreview({person}){
 const {preferences}=useGlass();
 const video=useRef(null);
 useEffect(()=>{
  const element=video.current,media=matchMedia('(prefers-reduced-motion: reduce)');let visible=false;
  const sync=()=>{element.muted=true;if(preferences.reduceMotion||media.matches||document.hidden||!visible)element.pause();else element.play().catch(()=>{});};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});observer.observe(element);
  media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
  return()=>{element.pause();observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
 },[preferences.reduceMotion]);
 return <video ref={video} src={`${interviewerMediaBase(person.id)}listening.mp4`} poster={`/interviewer/portraits/${person.id==='sarah'?'sahara':person.id}.jpg`} muted loop playsInline preload="metadata" tabIndex={-1} aria-hidden="true" className="h-full! w-full! object-cover! object-[50%_20%]!"/>;
}
```

Verificación: 198 pruebas raíz y 299 de Ciudadanía, compilaciones, lint y verificadores de móvil, iOS y metadatos de tienda. Lint termina sin errores y mantiene 34 advertencias previas. El compilador advierte sobre tamaño de algunos chunks. Navegador: español e inglés a 375 y 1280 px; almacenamiento denegado, cambios de accesibilidad, siete países y apertura del flujo local de escenarios. Las cuentas y proveedores de estas pruebas usan fixtures controlados.

Servidor público: cuenta configurada, política de práctica disponible y entrevistas ready=true con autenticación requerida. Uso y exportación sin identidad devuelven 401; recuperación sin cookie devuelve sesión nula y Cache-Control: no-store. Stripe devuelve billing_status_unavailable: la consulta no permite confirmar Checkout y tampoco demuestra por sí sola que una compra falle. Pendiente: verificación por correo y compra completa con una cuenta autorizada en el proveedor. No se enviaron correos, crearon pagos ni consumió IA de producción.

Alcance: esta revisión no sustituye auditoría legal profesional, prueba de penetración completa ni comprobación administrativa de políticas de la base de datos. Los verificadores de tiendas son estáticos, no equivalen a aprobación de Apple/Google; faltan pruebas y configuración externas de publicación nativa. Evidencia: `docs/audit-evidence-2026-10-15/general-audit.json`.
