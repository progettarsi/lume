export const API = 'https://api.github.com/repos/progettarsi/lume/releases/latest';
export const RELEASES = 'https://github.com/progettarsi/lume/releases/latest';
export const CACHE_KEY = 'lume:progettarsi/lume:release:v1';
export const FRESH_MS = 15 * 60 * 1000;
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const releasePrefix = 'https://github.com/progettarsi/lume/releases/';
export function normalizeRelease(raw) {
  if (!raw || raw.draft !== false || raw.prerelease !== false || typeof raw.tag_name !== 'string' || !raw.tag_name.trim() || raw.tag_name.length > 80 || !Number.isFinite(Date.parse(raw.published_at))) throw Error('Invalid release');
  if (typeof raw.html_url !== 'string' || !raw.html_url.startsWith(releasePrefix + 'tag/') || new URL(raw.html_url).origin !== 'https://github.com') throw Error('Invalid release URL');
  const assets = (Array.isArray(raw.assets) ? raw.assets : []).filter(a => a && a.state === 'uploaded' && typeof a.name === 'string' && /\.apk$/i.test(a.name) && a.size > 0 && typeof a.browser_download_url === 'string' && a.browser_download_url.startsWith(releasePrefix + 'download/') && new URL(a.browser_download_url).origin === 'https://github.com');
  const universal = assets.filter(a => /universal/i.test(a.name));
  const apk = universal.length === 1 ? universal[0] : assets.length === 1 ? assets[0] : null;
  return {tag:raw.tag_name, title:typeof raw.name === 'string' && raw.name.trim() ? raw.name.slice(0,200) : raw.tag_name, body:typeof raw.body === 'string' ? raw.body.slice(0,50000) : 'Le note sono disponibili sulla pagina della release.', publishedAt:raw.published_at, url:raw.html_url, apk:apk ? {name:apk.name,url:apk.browser_download_url,size:apk.size} : null};
}
export function readCache(storage, now = Date.now()) {
  try {
    const entry = JSON.parse(storage.getItem(CACHE_KEY));
    if (!entry || entry.schema !== 1 || !Number.isFinite(entry.checkedAt) || entry.checkedAt > now || now-entry.checkedAt > MAX_AGE_MS) return null;
    return {raw:entry.raw, release:normalizeRelease(entry.raw), checkedAt:entry.checkedAt};
  } catch { return null; }
}
export function writeCache(storage, raw, now = Date.now()) {
  try { normalizeRelease(raw); storage.setItem(CACHE_KEY, JSON.stringify({schema:1,raw,checkedAt:now})); } catch {}
}
export function retryTime(headers, now = Date.now()) {
  const after = headers.get('retry-after');
  const seconds = after && /^\d+$/.test(after) ? Number(after) * 1000 + now : Date.parse(after || '');
  const reset = Number(headers.get('x-ratelimit-reset')) * 1000;
  const candidate = Number.isFinite(seconds) && seconds > now ? seconds : reset > now ? reset : now + 60 * 1000;
  return Math.min(candidate, now + 24 * 60 * 60 * 1000);
}
