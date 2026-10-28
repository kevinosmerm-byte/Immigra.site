// Recover a missing deployment stylesheet without deleting study progress or reloading a session.
export async function recoverStyles() {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  const missing = links.filter(link => !link.sheet);
  if (!missing.length) return;
  try {
    const response = await fetch('/index.html', { cache: 'no-store' });
    if (!response.ok) return;
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    for (const source of page.querySelectorAll('link[rel="stylesheet"]')) {
      const url = new URL(source.getAttribute('href'), location.origin);
      if (url.origin !== location.origin) continue;
      url.searchParams.set('style-recovery', Date.now().toString());
      const style = await fetch(url, { cache: 'no-store' });
      if (!style.ok || !(style.headers.get('content-type') || '').includes('text/css')) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url.href;
      link.onload = () => missing.forEach(old => old.remove());
      document.head.append(link);
    }
  } catch { /* Leave the page available when offline; retry on the next online event. */ }
}
