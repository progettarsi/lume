import {API, RELEASES, CACHE_KEY, FRESH_MS, normalizeRelease, readCache, writeCache, retryTime} from './release-core.mjs';
const status = document.getElementById('release-status');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let current = null, checkedAt = 0, busy = false, nextAttempt = 0;
try { const n = Number(storage?.getItem(CACHE_KEY + ':retry')); if (n > Date.now() && n <= Date.now()+86400000) nextAttempt=n; } catch {}
function render(release, message) {
  current = release;
  document.querySelectorAll('[data-apk-link]').forEach(a => {
    a.href=release.apk?.url || release.url;
    a.setAttribute('aria-label',release.apk ? `Scarica Lume ${release.tag.replace(/^v/,'')} APK` : 'Apri la release ufficiale di Lume');
  });
  document.querySelectorAll('[data-download-label]').forEach(el => { el.textContent=release.apk ? `Scarica Lume ${release.tag.replace(/^v/,'')}` : 'Apri la release Android'; });
  document.querySelectorAll('[data-apk-name]').forEach(el => { el.textContent=release.apk?.name || 'APK dalla pagina della release'; });
  document.querySelectorAll('[data-release-link]').forEach(a => { a.href=release.url; });
  document.querySelectorAll('[data-release-title]').forEach(el => { el.textContent=release.title; });
  document.querySelectorAll('[data-release-body]').forEach(el => { el.textContent=release.body; });
  status.textContent=message;
}
const date = time => new Date(time).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});
const cached = readCache(storage);
if (cached) { checkedAt=cached.checkedAt; render(cached.release,`Dati salvati · verificati il ${date(checkedAt)}.`); }
async function loadFallback() {
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),3000);
  try {
    const response=await fetch('./release-fallback.json',{signal:controller.signal});
    if(!response.ok) return;
    const snapshot=await response.json(), release=normalizeRelease(snapshot.release);
    if(!current) render(release,`Dati inclusi nel sito · ${release.tag}. Verifica gli aggiornamenti su GitHub.`);
  } catch {} finally {clearTimeout(timer);}
}
async function refresh() {
  if(busy || Date.now()-checkedAt < FRESH_MS) return;
  if(Date.now()<nextAttempt) { status.textContent='Verifica GitHub temporaneamente limitata. Mostriamo i dati disponibili; puoi controllare le release ufficiali.'; return; }
  busy=true;
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),7000);
  try {
    const response=await fetch(API,{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:controller.signal});
    if(!response.ok) {
      nextAttempt=(response.status===403 || response.status===429) ? retryTime(response.headers) : Date.now()+60000;
      try { storage?.setItem(CACHE_KEY+':retry',String(nextAttempt)); } catch {}
      throw Error('Release request failed');
    }
    const raw=await response.json(), release=normalizeRelease(raw);
    checkedAt=Date.now(); nextAttempt=0;
    writeCache(storage,raw,checkedAt);
    try { storage?.removeItem(CACHE_KEY+':retry'); } catch {}
    render(release,`Ultima release stabile · ${release.tag} · pubblicata il ${new Date(release.publishedAt).toLocaleDateString('it-IT')}.`);
  } catch {
    nextAttempt=Math.max(nextAttempt,Date.now()+60000);
    status.textContent=current ? `Aggiornamento non disponibile. ${current.tag}: ${checkedAt ? 'ultima verifica '+date(checkedAt) : 'dati inclusi nel sito'}. Controlla le release ufficiali per la versione più recente.` : 'Aggiornamento non disponibile. Controlla le release ufficiali per la versione più recente.';
    if(!current) {
      document.querySelectorAll('[data-apk-link]').forEach(a => {a.href=RELEASES;a.setAttribute('aria-label','Apri le release ufficiali di Lume');});
      document.querySelectorAll('[data-download-label]').forEach(el => {el.textContent='Apri la release Android';});
      document.querySelectorAll('[data-apk-name]').forEach(el => {el.textContent='APK dalla pagina della release';});
    }
  } finally {clearTimeout(timer);busy=false;}
}
// The snapshot never overwrites a live or cached response.
await loadFallback();
void refresh();
window.addEventListener('online',()=>{nextAttempt=0;void refresh();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden) void refresh();});
setInterval(()=>{if(!document.hidden) void refresh();},FRESH_MS);
