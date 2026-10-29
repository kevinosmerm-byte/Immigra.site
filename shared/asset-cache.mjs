// Vite's generated JS/CSS have content hashes. Stable public URLs, even images
// with dates in their filenames, must still revalidate after a deployment.
export function isImmutableAsset(relative){
 return /^assets\/[^/]+-[A-Za-z0-9_-]{8}\.(?:js|css)$/.test(relative);
}
