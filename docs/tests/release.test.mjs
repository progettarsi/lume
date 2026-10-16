import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as core from '../release-core.mjs';
const snapshot = JSON.parse(fs.readFileSync(new URL('../release-fallback.json',import.meta.url))).release;
const copy = () => structuredClone(snapshot);
const memory = () => {const map=new Map();return {getItem:k=>map.get(k) ?? null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};
test('release metadata and universal APK are selected together',()=>{
  const r=core.normalizeRelease(snapshot);assert.equal(r.tag,'v0.2.4');assert.match(r.apk.url,/Lume-0\.2\.4\.apk$/);
  const raw=copy();raw.tag_name='v0.3.0';raw.name='New release';raw.body='<img onerror=alert(1)>';raw.assets[0].name='Lume-universal.apk';
  assert.equal(core.normalizeRelease(raw).body,raw.body);
  raw.assets.push({...raw.assets[0],name:'Lume-arm64.apk'});assert.equal(core.normalizeRelease(raw).apk.name,'Lume-universal.apk');
});
test('missing or ambiguous APKs fall back to the release',()=>{
  const raw=copy();raw.assets=[];assert.equal(core.normalizeRelease(raw).apk,null);
  raw.assets=[{...snapshot.assets[0],name:'arm64.apk'},{...snapshot.assets[0],name:'x86.apk'}];assert.equal(core.normalizeRelease(raw).apk,null);
});
test('unpublished releases and foreign links are rejected',()=>{
  for(const override of [{draft:true},{prerelease:true},{published_at:'oops'},{tag_name:''},{html_url:'javascript:alert(1)'},{html_url:'https://github.com.evil.test/progettarsi/lume/releases/tag/v1'}])assert.throws(()=>core.normalizeRelease({...copy(),...override}));
  const raw=copy();raw.assets[0].browser_download_url='https://evil.test/app.apk';assert.equal(core.normalizeRelease(raw).apk,null);
});
test('cache expires after seven days and tolerates corruption and blocked storage',()=>{
  const storage=memory(), now=Date.now();core.writeCache(storage,snapshot,now);
  assert.equal(core.readCache(storage,now+core.FRESH_MS).release.tag,snapshot.tag_name);
  assert.equal(core.readCache(storage,now+core.MAX_AGE_MS+1),null);assert.equal(core.readCache(storage,now-1),null);
  storage.setItem(core.CACHE_KEY,'{broken');assert.equal(core.readCache(storage),null);
  assert.equal(core.readCache(null),null);assert.doesNotThrow(()=>core.writeCache(null,snapshot));
});
test('rate limits respect reset headers with a bounded wait',()=>{
  const now=Date.now();assert.equal(core.retryTime(new Headers({'retry-after':'120'}),now),now+120000);
  assert.equal(core.retryTime(new Headers({'x-ratelimit-reset':String((now+3600000)/1000)}),now),now+3600000);
  assert.equal(core.retryTime(new Headers({'retry-after':'9999999'}),now),now+86400000);
});
async function browser({raw=copy(),storage=memory(),fail=false,timeout=false,statusCode=200,badJson=false,snapshotFail=false}={}) {
  const elements = Object.fromEntries(['[data-apk-link]','[data-download-label]','[data-apk-name]','[data-release-link]','[data-release-title]','[data-release-body]'].map(k=>[k,[{textContent:'',href:'',setAttribute(k,v){this[k]=v;}}]]));
  const status={textContent:''},events={},calls=[];
  const context={...core,Date,URL,AbortController,console,setInterval:()=>0,clearTimeout:()=>{},setTimeout:(f,ms)=>{if(timeout && ms===7000)queueMicrotask(f);return 1;},window:{get localStorage(){if(storage==='blocked')throw Error('Denied');return storage;},addEventListener:(k,f)=>events[k]=f},document:{hidden:false,getElementById:()=>status,querySelectorAll:k=>elements[k]||[],addEventListener:(k,f)=>events[k]=f},fetch:async(url,options)=>{
    calls.push(url);
    if(url.startsWith('./')) {if(snapshotFail)throw Error('Missing fallback');return {ok:true,json:async()=>({release:snapshot})};}
    if(timeout)return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('Timeout'))));
    if(fail)throw Error('Offline');
    return {ok:statusCode===200,status:statusCode,headers:new Headers({'retry-after':'120'}),json:async()=>{if(badJson)throw Error('Invalid JSON');return raw;}};
  }};
  const code=fs.readFileSync(new URL('../release.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
  await vm.runInNewContext('(async()=>{'+code+'\n})()',context);
  await new Promise(r=>setImmediate(r));
  return {elements,status,calls,events};
}
test('browser updates CTA, version and notes from the same new release safely',async()=>{
  const raw=copy();raw.tag_name='v9.0.0';raw.name='<b>Release 9</b>';raw.body='<script>alert(1)</script>';raw.assets[0].name='Lume-9.apk';raw.assets[0].browser_download_url='https://github.com/progettarsi/lume/releases/download/v9/Lume-9.apk';
  const r=await browser({raw});assert.equal(r.elements['[data-download-label]'][0].textContent,'Scarica Lume 9.0.0');assert.match(r.elements['[data-apk-link]'][0].href,/Lume-9.apk$/);assert.equal(r.elements['[data-release-body]'][0].textContent,raw.body);assert.match(r.status.textContent,/Ultima release stabile/);
});
test('fresh cache avoids a GitHub request',async()=>{
  const storage=memory();core.writeCache(storage,snapshot);const r=await browser({storage});assert.equal(r.calls.filter(x=>x===core.API).length,0);
});
for(const scenario of [{fail:true},{timeout:true},{statusCode:403},{statusCode:429},{badJson:true},{storage:'blocked',fail:true}])test('browser retains fallback on '+JSON.stringify(scenario),async()=>{
  const r=await browser(scenario);assert.match(r.status.textContent,/non disponibile/);assert.equal(r.elements['[data-release-title]'][0].textContent,snapshot.name);assert.ok(r.elements['[data-apk-link]'][0].href.startsWith('https://github.com/progettarsi/lume/releases/'));
});
test('stale cache is shown when API and snapshot fail',async()=>{
  const storage=memory();core.writeCache(storage,snapshot,Date.now()-core.FRESH_MS-1000);const r=await browser({storage,fail:true,snapshotFail:true});assert.match(r.status.textContent,/ultima verifica/);
});
test('missing APK makes CTA open release rather than guess a filename',async()=>{
  const raw=copy();raw.assets=[];const r=await browser({raw});assert.equal(r.elements['[data-apk-link]'][0].href,raw.html_url);assert.equal(r.elements['[data-download-label]'][0].textContent,'Apri la release Android');
});
test('persisted rate-limit cooldown avoids repeated API requests',async()=>{
  const storage=memory();storage.setItem(core.CACHE_KEY+':retry',String(Date.now()+120000));const r=await browser({storage});assert.equal(r.calls.filter(x=>x===core.API).length,0);assert.match(r.status.textContent,/limitata/);
});
