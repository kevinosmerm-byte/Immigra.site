import {seoNavigation} from '../shared/seo-pages.mjs';

// Critical, scoped styles travel with the HTML: the first paint must not depend
// on downloading the application CSS or evaluating the full module graph.
export const initialShellStyles = `<style id="immigra-boot-styles">
body{margin:0}
#immigra-boot{--color-navy:#123A63;--color-primary:#2563A6;--color-text:#172B3D;--color-border:#D8E2EC;background:#fff;color:var(--color-text);font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center}
#immigra-boot *{box-sizing:border-box}
#immigra-boot .immigra-boot-intro{min-height:100vh;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;gap:16px}
#immigra-boot h1{color:var(--color-navy);font:700 clamp(32px,7vw,64px)/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:-.04em;margin:0}
#immigra-boot p{max-width:600px;margin:0;color:var(--color-text)}
#immigra-boot [role="status"]{font-size:14px;min-height:3.2em;max-width:440px}
#immigra-boot a{color:var(--color-primary);text-decoration:underline;text-underline-offset:4px}
#immigra-boot a,#immigra-boot button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 12px}
#immigra-boot button{font:inherit;border:1px solid var(--color-border);border-radius:12px;background:#fff;color:var(--color-navy);cursor:pointer}
#immigra-boot [hidden]{display:none!important}
#immigra-boot :focus-visible{outline:3px solid var(--color-primary);outline-offset:4px}
#immigra-boot .immigra-boot-guides{max-width:800px;margin:auto;padding:32px 24px 48px;border-top:1px solid var(--color-border)}
#immigra-boot h2{color:var(--color-navy);font-size:24px;margin:0 0 16px}
#immigra-boot ul{list-style:none;margin:16px 0;padding:0}
#immigra-boot .immigra-boot-guides p{margin:16px auto}
</style>`;

export function initialShellHtml() {
  return `<main id="immigra-boot"><section class="immigra-boot-intro" aria-labelledby="immigra-boot-title"><h1 id="immigra-boot-title">IMMIGRA.site</h1><p>Prepárate antes de tu entrevista.</p><p>Simulaciones con IA para ciudadanía, asilo y residencia, en un solo lugar.</p><p id="immigra-boot-status" role="status" aria-live="polite">Puedes consultar nuestras guías de preparación mientras accedes a la experiencia interactiva.</p><button id="immigra-boot-retry" type="button" hidden>Reintentar la carga</button><a href="/fuentes">Consultar fuentes oficiales</a><noscript><p>JavaScript está desactivado. Puedes leer las guías siguientes; activa JavaScript para usar la práctica interactiva.</p></noscript></section><section id="immigra-boot-guides" class="immigra-boot-guides" aria-labelledby="immigra-boot-guides-title"><h2 id="immigra-boot-guides-title">Herramientas de preparación</h2><p>Explora material de estudio, preguntas de práctica y entrevistas simuladas. La práctica es educativa, no asesoría legal ni garantía de aprobación. IMMIGRA no está afiliada al gobierno.</p>${seoNavigation('es')}<p><a href="/fuentes">Fuentes oficiales e independencia</a> · <a href="/privacidad">Privacidad</a> · <a href="/soporte">Soporte</a></p></section></main>`;
}

export function injectInitialShell(html) {
  // Fail the build rather than quietly shipping an empty or duplicated shell.
  const emptyRoot = /(<div id="root"[^>]*>)(<\/div>)/;
  if (!emptyRoot.test(html)) throw new Error('Expected one empty application root before adding the initial shell');
  return html.replace(emptyRoot, (_match, start, end) => start + initialShellHtml() + end)
    .replace(/(<head>)(<meta charset="[^"]+"\s*\/?>)?/i, (_match, head, charset = '') => head + charset + initialShellStyles + '<script defer src="/app-boot.js"></script>');
}
