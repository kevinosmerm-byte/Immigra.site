/* Small independent recovery controller. No app imports, storage, redirects or
 * automatic reloads. It is an external script to respect the production CSP. */
(() => {
  const shell = document.getElementById('immigra-boot');
  if (!shell) return;
  const status = document.getElementById('immigra-boot-status');
  const retry = document.getElementById('immigra-boot-retry');
  status.textContent = 'Cargando IMMIGRA.site…';
  const reload = () => window.location.reload();
  retry.addEventListener('click', reload);
  const timeout = window.setTimeout(() => {
    if (!shell.isConnected) return;
    status.textContent = 'La carga está tardando más de lo esperado. Puedes reintentar o consultar las guías de preparación.';
    retry.hidden = false;
  }, 12000);
  const observer = new MutationObserver(() => {
    if (shell.isConnected) return;
    window.clearTimeout(timeout);
    retry.removeEventListener('click', reload);
    observer.disconnect();
  });
  observer.observe(document.getElementById('root'), {childList: true});
})();
