// The module root is its dashboard. Explicit deep links keep their existing meaning.
export function readAsylumRoute(hash=''){
 const match=String(hash).match(/^#\/asylum(?:\/([^/?#]+))?\/?(?:\?.*)?$/);
 return match?match[1]||'app':null;
}
