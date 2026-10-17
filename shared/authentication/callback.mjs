export function authCallbackKind({hash='',search=''}={}) {
  const fragment = new URLSearchParams(hash.startsWith('#/') ? '' : hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  if (fragment.has('error') || fragment.has('error_code') || query.has('error') || query.has('error_code')) return 'error';
  if (fragment.has('access_token') || fragment.has('refresh_token')) return 'session';
  if (query.has('code')) return 'code';
  return null;
}
