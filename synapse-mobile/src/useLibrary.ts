import {useEffect,useRef,useState,useMemo} from 'react';
import * as Network from 'expo-network';
import {AppState} from 'react-native';
import {Wikipedia,WikiError} from './content/wikipedia';
import {categoryOrder} from './content/categories';
import {rankLocal,generalAudienceScore} from './content/text';
import {DEFAULT_SETTINGS,type Article,type Settings} from './content/types';
import * as storage from './storage';
import seeds from './content/seeds.json';
import {mergeArticle,serialWrites} from './content/articleState';
import {feedTrimCount} from './content/paging';
import {emptyLearning,learn,discoveryAnchor,seenArticle,identity,rankRecommendations,personalizedCategories,type Learning} from './content/recommendations';
import {ReserveScheduler,reserveArticles,reserveContext,appendDiscoveries,previewOnly,refreshFuture,REFILL_AHEAD,RESERVE_TARGET,PREVIEW_BYTES} from './content/reserve';
import {articleBytes} from './content/cache';
import {AIPreparation,DwellGate} from './content/aiPreparation';
import {simplify} from './content/simplifier';
import {continuation} from './content/text';
import {BookmarkWriter} from './content/bookmark';
import {LibraryViews} from './content/libraryViews';
import {recoverFeed,offlineReserve,offlineContinuation,repeatedArticle,categoryDisabled,canRecheck,type FeedState} from './content/feedAvailability';

// Overrides are dependency injection for the isolated native QA, never settings.
export function useLibrary(options:{wikipedia?:Wikipedia;onlineOverride?:boolean;aiGenerator?:(a:Article,key:string,s:AbortSignal)=>Promise<string[]|undefined>}={}){
  const [ready,setReady]=useState(false),[settings,setSettings]=useState(DEFAULT_SETTINGS),[cache,setCache]=useState<Article[]>([]),[online,setOnline]=useState(true),[error,setError]=useState('');
  const [feeds,setFeeds]=useState<Record<string,Article[]>>({}),[loading,setLoading]=useState(false),[history,setHistory]=useState<Article[]>([]);
  const [availability,setAvailability]=useState<Record<string,FeedState>>({}),availabilityRef=useRef(availability);
  const [feedCorrection,setFeedCorrection]=useState<{category:string;position:number;revision:number}|null>(null);
  const recheck=useRef<string|null>(null),recheckOrder=useRef(0);
  const serviceHold=useRef<FeedState|undefined>(undefined);
  const stateFor=(category:string,state:FeedState)=>{const previous=availabilityRef.current[category];availabilityRef.current={...availabilityRef.current,[category]:{...state,exhausted:state.phase!=='ready'&&(state.phase==='exhausted'||previous?.phase==='exhausted'||!!previous?.exhausted)}};setAvailability(availabilityRef.current)};
  const [learning,setLearning]=useState<Learning>(emptyLearning),learningRef=useRef(learning),served=useRef(new Set<string>());
  const views=useRef(new LibraryViews()),consumedRevision=useRef(0);
  const wiki=useRef(options.wikipedia??new Wikipedia()),cacheRef=useRef(cache),feedsRef=useRef(feeds),readyRef=useRef(ready),onlineRef=useRef(online);
  const bookmarkWrites=useRef(new BookmarkWriter()),retryAfter=useRef(new Map<string,number>());
  const profileWrites=useRef(serialWrites()),refreshRevision=useRef(0),refreshedRevision=useRef(0);
  const busy=useRef(false),controller=useRef<AbortController|null>(null),requestId=useRef(0),foreground=useRef(0);
  const active=useRef<Article|undefined>(undefined),categoryRef=useRef('all'),positionRef=useRef(0),discovery=useRef(true),awake=useRef(AppState.currentState!=='background');
  const fullJobs=useRef(new Map<string,{promise:Promise<Article>;signal:AbortSignal}>()),pendingFull=useRef(new Map<string,Article>());
  const ai=useRef<AIPreparation|null>(null),dwell=useRef<DwellGate|null>(null),visibleAI=useRef<Article|undefined>(undefined),pendingAI=useRef<Article|undefined>(undefined);
  const scheduler=useRef<ReserveScheduler|null>(null),operations=useRef<{context:()=>ReturnType<typeof context>;work:typeof reserveWork}|null>(null);
  const commitCache=(update:(rows:Article[])=>Article[])=>{const next=update(cacheRef.current);cacheRef.current=next;setCache(next)};
  const commitFeeds=(update:(rows:Record<string,Article[]>)=>Record<string,Article[]>)=>{const next=update(feedsRef.current);feedsRef.current=next;setFeeds(next)};
  const pool=(category=categoryRef.current)=>views.current.reserve(cacheRef.current,learningRef.current,served.current,consumedRevision.current,category);
  const cachedFeed=(category:string)=>category==='all'?pool(category):pool(category).filter(a=>a.category===category);
  const reorderFuture=()=>onlineRef.current&&commitFeeds(old=>{const next={...old};for(const [key,rows] of Object.entries(old))next[key]=refreshFuture(rows,key==='all'?cacheRef.current:cacheRef.current.filter(a=>a.category===key),learningRef.current,served.current,key===categoryRef.current?positionRef.current:-1);return next});
  const commitLearning=(next:Learning)=>{const changed=next.categories!==learningRef.current.categories;learningRef.current=next;setLearning(next);if(changed){if(discoveryAnchor(next,()=>.5)){refreshRevision.current++;scheduler.current?.reset()}reorderFuture()}scheduler.current?.wake()};
  const track=(a:Article,event:'open'|'save'|'unsave'|'seen')=>profileWrites.current(async()=>{const next=learn(learningRef.current,a,event);await storage.putLearning(next);commitLearning(next)});
  // Passing a card consumes its identity without inventing an engagement weight.
  const consume=(rows:Article[])=>{
    if(!rows.length)return;
    for(const a of rows)if(!served.current.has(a.id)){served.current.add(a.id);consumedRevision.current++}
    void profileWrites.current(async()=>{const old=learningRef.current,seen=[...new Set([...old.seen,...rows.flatMap(a=>[a.id,identity(a)])])];if(seen.length!==old.seen.length){const next={...old,seen};await storage.putLearning(next);commitLearning(next)}}).catch(()=>setError('Avanzamento del feed non salvato'));
  };
  const protections=(extra=new Set<string>())=>{
    const protectedIds=new Set([...extra,...pool().map(a=>a.id),...offlineReserve(cacheRef.current,learningRef.current,served.current).map(a=>a.id),...fullJobs.current.keys()]);
    if(active.current)protectedIds.add(active.current.id);
    for(const a of (feedsRef.current[categoryRef.current]||[]).slice(Math.max(0,positionRef.current-2),positionRef.current+REFILL_AHEAD))protectedIds.add(a.id);
    return protectedIds;
  };
  const remember=async(items:Article[],protect=new Set<string>())=>{

    await storage.putArticles(items);
    commitCache(old=>{const map=new Map(old.map(a=>[a.id,a]));for(const a of items)map.set(a.id,mergeArticle(map.get(a.id),a));return [...map.values()]});
    const removed=new Set(await storage.prune(protections(protect)));
    if(removed.size)commitCache(old=>old.filter(a=>!removed.has(a.id)||a.saved));
  };
  if(!ai.current)ai.current=new AIPreparation((a,s)=>wiki.current.full(a,s).then(async full=>{if(!s.aborted)await remember([full],new Set([a.id]));return full}),options.aiGenerator??((a,key,s)=>simplify(continuation(a.paragraphs,a.preview),key,s,a.title,a.preview)),a=>remember([a],new Set([a.id])),m=>{void storage.putAIMetrics(m).catch(()=>{})});
  if(!dwell.current)dwell.current=new DwellGate(()=>{const a=visibleAI.current;if(a&&onlineRef.current&&awake.current&&discovery.current&&!active.current&&ai.current!.canPrepare(a)){pendingAI.current=a;scheduler.current?.wake()}});
  const configureAI=(key:string,enabled:boolean)=>{if(ai.current!.configure(key,enabled)){dwell.current?.clear();pendingAI.current=undefined}};
  const observeAI=(a:Article|undefined,scope:string)=>{if(visibleAI.current?.id!==a?.id){ai.current?.cancel();pendingAI.current=undefined}visibleAI.current=a;dwell.current!.update(a&&ai.current!.available()&&onlineRef.current&&awake.current?scope+':'+a.id:'')};
  const exclusions=()=>new Set([...learningRef.current.seen,...served.current,...cacheRef.current.flatMap(a=>[a.id,identity(a)]),...Object.values(feedsRef.current).flatMap(rows=>rows.flatMap(a=>[a.id,identity(a)]))]);
  const publish=async(category:string,rows:Article[],signal:AbortSignal)=>{
    if(signal.aborted)return 0;
    const candidates=rows.map(previewOnly).filter(a=>a.preview.length&&articleBytes(a)<=PREVIEW_BYTES&&!seenArticle(a,learningRef.current)&&!served.current.has(a.id)&&generalAudienceScore(a.title,a.paragraphs)>=.45);
    // Publish each response before awaiting persistence or the next API round.
    let added=0;
    commitFeeds(old=>{
      const next={...old,[category]:appendDiscoveries(old[category]||[],candidates,learningRef.current,served.current)};
      added=next[category].length-(old[category]?.length??0);
      const currentCategory=categoryRef.current;
      if(currentCategory!==category){const matching=candidates.filter(a=>currentCategory==='all'||a.category===currentCategory);next[currentCategory]=appendDiscoveries(old[currentCategory]||[],matching,learningRef.current,served.current)}
      return next;
    });
    // A global discovery can revive a depleted category immediately; do not
    // leave it disabled until the next app lifecycle event.
    for(const id of new Set(candidates.map(a=>a.category)))if(availabilityRef.current[id]?.exhausted){stateFor(id,{phase:'ready'});retryAfter.current.delete(id);if(recheck.current===id)recheck.current=null}
    await remember(candidates);
    if(!signal.aborted)reorderFuture();
    return added;
  };
  const recovery=async(category:string,signal:AbortSignal,limit:number,preferInterest=false)=>{
    let total=0;
    const result=await recoverFeed(async attempt=>{let added=0;await wiki.current.batch(category,exclusions(),limit,signal,learningRef.current,{maxRounds:1,requestAttempts:1,alternative:attempt>1,preferInterest:attempt===1&&preferInterest,onChunk:async rows=>{added+=await publish(category,rows,signal)}});total+=added;return added},signal,state=>{if(!signal.aborted)stateFor(category,state)});
    if(!signal.aborted){stateFor(category,result);if(result.phase==='limit')serviceHold.current=result;if(result.after)retryAfter.current.set(category,result.after);else retryAfter.current.delete(category)}
    return total;
  };
  function context(){const cat=recheck.current??categoryRef.current,blocked=!canRecheck(availabilityRef.current[cat]);return {...reserveContext(readyRef.current&&onlineRef.current&&awake.current&&discovery.current&&!active.current&&!busy.current&&!foreground.current&&canRecheck(serviceHold.current)&&canRecheck(availabilityRef.current.all),blocked?'all':cat,pool,pendingFull.current.size>0||!!pendingAI.current),refresh:refreshRevision.current>refreshedRevision.current}}
  async function reserveWork(category:string|null,signal:AbortSignal){
    if(category===null){
      if(pendingAI.current){const candidate=pendingAI.current;pendingAI.current=undefined;const current=cacheRef.current.find(a=>a.id===candidate.id)??candidate;await ai.current!.prepare(current,signal);return 1}
      const article=[...pendingFull.current.values()].find(a=>cacheRef.current.find(row=>row.id===a.id)?.saved)||pendingFull.current.values().next().value;
      if(!article)return 1;
      const current=cacheRef.current.find(a=>a.id===article.id);
      if(current?.complete&&current.textVersion===3){pendingFull.current.delete(article.id);return 1}
      const completed=await wiki.current.full(current??article,signal);
      if(signal.aborted)return 0;
      await remember([completed],new Set([article.id]));pendingFull.current.delete(article.id);return 1;
    }
    const revision=refreshRevision.current;let published=0;
    published=await recovery(category,signal,6,revision>refreshedRevision.current);
    if(recheck.current===category&&!signal.aborted)recheck.current=null;
    if(!signal.aborted)refreshedRevision.current=revision;
    return published;
  }
  operations.current={context,work:reserveWork};
  if(!scheduler.current)scheduler.current=new ReserveScheduler(()=>operations.current!.context(),(category,signal)=>operations.current!.work(category,signal));
  const network=Network.useNetworkState();
  const reevaluate=()=>{const exhausted=Object.entries(availabilityRef.current).filter(([id,s])=>id!=='all'&&(s.phase==='exhausted'||s.exhausted));if(exhausted.length){const [id]=exhausted[recheckOrder.current++%exhausted.length];stateFor(id,{phase:'idle'});retryAfter.current.delete(id);recheck.current=id}scheduler.current?.reset(false)};
  const connection=(connected:boolean)=>{const changed=onlineRef.current!==connected;onlineRef.current=connected;setOnline(connected);if(!connected){controller.current?.abort();scheduler.current?.interrupt();ai.current?.cancel(true);dwell.current?.clear();pendingAI.current=undefined}else if(changed){for(const [id,state] of Object.entries(availabilityRef.current))if(state.phase!=='exhausted'&&state.phase!=='limit'&&canRecheck(state))stateFor(id,{phase:'idle'});setError('');reevaluate()}};
  useEffect(()=>{connection(options.onlineOverride??(network.isConnected!==false&&network.isInternetReachable!==false))},[network.isConnected,network.isInternetReachable,options.onlineOverride]);
  useEffect(()=>{let alive=true;(async()=>{
    await storage.initStorage();let articles=await storage.getArticles();
    if(!articles.some(a=>a.preview?.some(p=>p.trim()))){await storage.putArticles(seeds as Article[]);articles=await storage.getArticles()}
    const prefs=await storage.getSettings();prefs.categories=categoryOrder(prefs.categories);
    let visits=await storage.getHistory();const profile=await storage.migrateProfile(articles,visits);articles=await storage.getArticles();visits=await storage.getHistory();ai.current!.metrics=await storage.getAIMetrics();
    if(alive){learningRef.current=profile;setLearning(profile);cacheRef.current=articles;setCache(articles);setHistory(visits);setSettings(prefs);commitFeeds(()=>({all:onlineRef.current?reserveArticles(articles,profile,served.current):offlineReserve(articles,profile,served.current)}));readyRef.current=true;setReady(true)}
  })().catch(()=>{if(alive){const local=seeds as Article[];cacheRef.current=local;setCache(local);commitFeeds(()=>({all:offlineReserve(local,learningRef.current,served.current)}));readyRef.current=true;setReady(true);setError('Non è stato possibile aprire la raccolta salvata. Riprova riaprendo l’app.')}});return()=>{alive=false;controller.current?.abort();scheduler.current?.dispose();ai.current?.cancel(true);dwell.current?.clear()}},[]);
  const trimFeed=(category:string,position:number)=>{
    consume((feedsRef.current[category]||[]).slice(0,position));
    const remove=feedTrimCount(position);if(remove)commitFeeds(old=>old[category]?{...old,[category]:old[category].slice(remove)}:old);
    positionRef.current=position-remove;scheduler.current?.wake();return position-remove;
  };
  const setDiscovery=(enabled:boolean)=>{discovery.current=enabled;if(!enabled){controller.current?.abort();scheduler.current?.interrupt()}};
  const load=async(category:string,position=0,force=false)=>{
    if(categoryRef.current!==category){controller.current?.abort();requestId.current++;busy.current=false;setLoading(false)}
    categoryRef.current=category;positionRef.current=position;
    let current=feedsRef.current[category]||[];
    current=appendDiscoveries(current,cachedFeed(category),learningRef.current,served.current);
    if(current!==feedsRef.current[category])commitFeeds(old=>({...old,[category]:current}));
    if(!readyRef.current||!discovery.current||active.current||!awake.current)return;
    if(!onlineRef.current){if(category==='all'){
      const next=offlineContinuation(current,position,cacheRef.current,learningRef.current,served.current);
      if(next.length!==current.length||next.some((a,i)=>a.id!==current[i]?.id)){
        const nextPosition=current[position]?next.findIndex(a=>a.id===current[position].id):0;
        commitFeeds(old=>({...old,all:next}));if(nextPosition!==position){positionRef.current=Math.max(0,nextPosition);setFeedCorrection(old=>({category,position:positionRef.current,revision:(old?.revision??0)+1}))}
      }
    }setError('');return}
    if(serviceHold.current&&!canRecheck(serviceHold.current)){if(availabilityRef.current[category]?.after!==serviceHold.current.after)stateFor(category,serviceHold.current);return}
    if(busy.current||foreground.current||(!force&&current.length-position>REFILL_AHEAD)||(retryAfter.current.get(category)||0)>Date.now()){scheduler.current?.wake();return}
    const token=++requestId.current;busy.current=true;setLoading(true);setError('');scheduler.current?.interrupt();const abort=new AbortController();controller.current=abort;
    try{
      await recovery(category,abort.signal,current.length?6:4);
    }catch(e){if(!abort.signal.aborted&&token===requestId.current){retryAfter.current.set(category,Date.now()+30000);stateFor(category,{phase:'service',after:Date.now()+30000})}}
    finally{if(token===requestId.current){busy.current=false;setLoading(false);scheduler.current?.afterForeground()}}
  };
  const refresh=async(category:string)=>{if(availabilityRef.current[category]?.phase==='limit'&&!canRecheck(availabilityRef.current[category]))return;controller.current?.abort();requestId.current++;busy.current=false;setLoading(false);retryAfter.current.delete(category);stateFor(category,{phase:'idle'});reevaluate();await load(category,positionRef.current,true)};
  const enterCategory=(category:string)=>{scheduler.current?.interrupt();controller.current?.abort();requestId.current++;busy.current=false;categoryRef.current=category;positionRef.current=0;setLoading(false);commitFeeds(old=>({...old,[category]:!onlineRef.current&&category==='all'?offlineReserve(cacheRef.current,learningRef.current,served.current):appendDiscoveries((old[category]||[]).filter(a=>!seenArticle(a,learningRef.current)),cachedFeed(category),learningRef.current,served.current)}))};
  const activate=(article?:Article)=>{active.current=article;if(article){ai.current?.claim(article.id);ai.current?.beginOpen();dwell.current?.clear();pendingAI.current=undefined;controller.current?.abort();scheduler.current?.interrupt()}else{ai.current?.cancel(true);scheduler.current?.wake()}};
  const interactive=async<T,>(work:()=>Promise<T>)=>{foreground.current++;scheduler.current?.interrupt();try{return await work()}finally{foreground.current--;scheduler.current?.wake()}};
  const full=async(article:Article,signal:AbortSignal)=>interactive(async()=>{
    const current=cacheRef.current.find(a=>a.id===article.id);const preparation=ai.current!.fullInFlight(current?.complete?{...current,preview:article.preview}:article);if(preparation){const cancel=()=>ai.current!.cancel(true);signal.addEventListener('abort',cancel,{once:true});try{return {...await preparation,preview:article.preview}}catch{if(signal.aborted)return article}finally{signal.removeEventListener('abort',cancel)}}
    if(current?.complete&&current.textVersion===3)return {...mergeArticle(current,article),preview:article.preview};
    if(article.complete&&article.textVersion===3)return article;
    if(!onlineRef.current)return {...(current?mergeArticle(current,article):article),preview:article.preview,contentIssue:'Approfondimento non scaricato sul telefono',contentIssueKind:'offline' as const};
    const existing=fullJobs.current.get(article.id);let job=existing?.signal.aborted?undefined:existing?.promise;
    if(!job){job=wiki.current.full(article,signal).then(async complete=>{if(!signal.aborted)await remember([complete],new Set([article.id]));return complete}).finally(()=>{if(fullJobs.current.get(article.id)?.promise===job)fullJobs.current.delete(article.id)});fullJobs.current.set(article.id,{promise:job,signal})}
    try{const complete=await job;return signal.aborted?article:{...complete,preview:article.preview}}
    catch(error){return {...(current?mergeArticle(current,article):article),contentIssue:error instanceof Error?error.message:'Testo non disponibile',contentIssueKind:!onlineRef.current?'offline' as const:error instanceof WikiError?error.kind:'network' as const}}
  });
  const prepare=async(article:Article)=>{
    if(!onlineRef.current||(article.complete&&article.textVersion===3))return;
    // One visible preparation plus at most eight saved articles; previews first.
    for(const [id,a] of pendingFull.current)if(!cacheRef.current.find(row=>row.id===id)?.saved)pendingFull.current.delete(id);
    if(pendingFull.current.size<8||pendingFull.current.has(article.id))pendingFull.current.set(article.id,article);
    scheduler.current?.wake();
  };
  const setSaved=async(a:Article,saved:boolean)=>{
    const old=cacheRef.current.find(row=>row.id===a.id),article={...(old||mergeArticle(old,a)),saved};
    await bookmarkWrites.current.set(a.id,saved,!!old?.saved,()=>profileWrites.current(async()=>{const next=learn(learningRef.current,article,saved?'save':'unsave');await storage.putSavedArticle(article,saved,next);commitLearning(next)}),value=>commitCache(rows=>rows.some(row=>row.id===a.id)?rows.map(row=>row.id===a.id?{...row,saved:value}:row):[...rows,{...article,saved:value}]));
    if(cacheRef.current.find(row=>row.id===a.id)?.saved){if(!article.complete)void prepare(article)}else pendingFull.current.delete(article.id);return saved;
  };
  const save=(a:Article,onlySave=false)=>setSaved(a,onlySave||!cacheRef.current.find(row=>row.id===a.id)?.saved);
  const read=async(a:Article)=>{await track(a,'open');const current=mergeArticle(cacheRef.current.find(row=>row.id===a.id),a);await storage.putArticles([current]);await storage.markRead(a.id);commitCache(rows=>rows.some(row=>row.id===a.id)?rows.map(row=>row.id===a.id?{...mergeArticle(row,a),readAt:Date.now()}:row):[...rows,{...current,readAt:Date.now()}]);setHistory(await storage.getHistory())};
  const updateSettings=(patch:Partial<Settings>)=>setSettings(old=>{const next={...old,...patch};void storage.putSettings(next).catch(()=>setError('Preferenza non salvata'));return next});
  const search=async(query:string,signal:AbortSignal)=>interactive(()=>onlineRef.current?wiki.current.search(query,signal):Promise.resolve(rankLocal(query,cacheRef.current)));
  const lastRandom=useRef('');
  const random=async(signal:AbortSignal)=>interactive(async()=>{
    let picked:Article|undefined;
    if(onlineRef.current){try{picked=await wiki.current.random(new Set([...learningRef.current.seen,lastRandom.current]),signal)}catch{if(signal.aborted)return}}
    if(signal.aborted)return;
    if(!picked){const rows=cacheRef.current.filter(a=>a.preview.length&&!seenArticle(a,learningRef.current)&&a.id!==lastRandom.current&&generalAudienceScore(a.title,a.paragraphs)>=.45);picked=rows[Math.floor(Math.random()*rows.length)]}
    if(picked){lastRandom.current=picked.id;await remember([picked],new Set([picked.id]));return picked}
  });
  const getFeed=(category:string)=>views.current.feed(category,feedsRef.current[category]||cachedFeed(category),cacheRef.current,settings.aiEnabled);
  const checkConnection=async()=>{if(options.onlineOverride!==undefined)return options.onlineOverride;const n=await Network.getNetworkStateAsync();const connected=n.isConnected!==false&&n.isInternetReachable!==false;connection(connected);return connected};
  const retryFeed=()=>{const state=availabilityRef.current[categoryRef.current];if(state?.phase==='limit'&&!canRecheck(state))return;retryAfter.current.delete(categoryRef.current);reevaluate();void checkConnection().then(()=>load(categoryRef.current,positionRef.current,true)).catch(()=>{})};
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{awake.current=state==='active';if(awake.current){void checkConnection().then(()=>{reevaluate();void load(categoryRef.current,positionRef.current)}).catch(()=>{})}else{controller.current?.abort();scheduler.current?.interrupt();ai.current?.cancel(true);dwell.current?.clear();pendingAI.current=undefined}});return()=>subscription.remove()},[options.onlineOverride]);
  useEffect(()=>{if(!ready||!online)return;const after=Math.min(...Object.values(availability).flatMap(s=>s.after?[s.after]:[]));if(!Number.isFinite(after))return;const timer=setTimeout(()=>{if(!awake.current)return;for(const [id,s] of Object.entries(availabilityRef.current))if(s.after&&canRecheck(s)){retryAfter.current.delete(id);stateFor(id,{phase:s.phase==='exhausted'?'exhausted':'idle'});if(id!=='all'&&s.phase==='exhausted'&&!recheck.current)recheck.current=id}scheduler.current?.reset(false);void load(categoryRef.current,positionRef.current)},Math.max(1,after-Date.now()));return()=>clearTimeout(timer)},[availability,ready,online]);
  const revise=(a:Article,s:AbortSignal,retry=false)=>{if(!onlineRef.current)return Promise.resolve(undefined);return ai.current!.request(a,s,retry)};
  const categoryIds=useMemo(()=>personalizedCategories(learning,settings.categories),[learning,settings.categories]);
  return {beginAIOpen:()=>ai.current!.beginOpen(),abandonAIOpen:()=>ai.current!.abandonOpen(),configureAI,observeAI,revise,originalReady:()=>ai.current!.originalReady(),finishAIOpen:()=>ai.current!.finishOpen('fallback'),aiMetrics:()=>ai.current!.metrics,availability,feedCorrection,disabledCategory:(id:string)=>categoryDisabled(id,online,availability[id]),isRepeated:(a:Article)=>repeatedArticle(a,learningRef.current,served.current),homeReady:()=>{const local=onlineRef.current?cachedFeed('all'):offlineReserve(cacheRef.current,learningRef.current,served.current);return !!(feedsRef.current.all?.some(a=>a.preview.length&&!repeatedArticle(a,learningRef.current,served.current))||local.length)},ready,settings,updateSettings,cache,history,online,error,loading,load,getFeed,trimFeed,save,setSaved,isSaved:(id:string)=>!!cacheRef.current.find(a=>a.id===id)?.saved,read,search,random,remember,full,prepare,refresh,enterCategory,track,activate,setDiscovery,checkConnection,retryFeed,get reserveCount(){return pool().length},reserveTarget:RESERVE_TARGET,categoryIds};
}


