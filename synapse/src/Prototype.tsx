import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type Ref } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useIsPresent, useReducedMotion, useMotionValue, useTransform, animate, type MotionStyle, type MotionValue } from 'motion/react';
import { Carousel, KeyboardInput, MobileScroll, useKeyboard, useKeyboardInsets, useMobileDevice, useScreenPortal } from './mobile';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import 'material-symbols/rounded.css';
import './prototype.css';

type Article = { id: string; category: string; title: string; short: string[]; deep: string[]; source: string };
const articles: Article[] = [
 {id:'doppler',category:'Scienza',title:'Il suono cambia quando ci muoviamo',short:['Quando un’ambulanza si avvicina, la sirena sembra più acuta. Quando si allontana, il suono diventa più grave.','È l’effetto Doppler: il movimento cambia la frequenza che percepiamo. Lo stesso principio aiuta gli astronomi a studiare il moto delle stelle.'],deep:['La sirena emette onde sonore a intervalli regolari. Se la sorgente si muove verso chi ascolta, ogni nuova onda parte da un punto più vicino: le onde arrivano a intervalli più brevi e la frequenza percepita aumenta.','Quando la sorgente si allontana, gli intervalli si allungano. La sirena non ha cambiato la propria nota: è cambiato il modo in cui le onde raggiungono l’ascoltatore.','Il fenomeno riguarda anche la luce. Gli astronomi misurano lo spostamento delle righe spettrali per ricavare informazioni sul movimento di una stella lungo la nostra linea di vista.'],source:'https://it.wikipedia.org/wiki/Effetto_Doppler'},
 {id:'serendipita',category:'Cultura',title:'Il caso favorisce le menti preparate',short:['Nel 1754 Horace Walpole inventò la parola serendipità, ispirandosi a una fiaba persiana. I suoi protagonisti trovavano indizi preziosi mentre cercavano tutt’altro.','Una scoperta inattesa diventa utile quando sappiamo riconoscerla. Curiosità e attenzione possono trasformare un dettaglio trascurato in una nuova idea.'],deep:['La serendipità descrive la scoperta di qualcosa di interessante mentre si sta cercando altro. Il caso può offrire l’occasione, ma riconoscerne il valore richiede attenzione.','Il termine nasce da Serendip, un antico nome dello Sri Lanka. Walpole lo usò in una lettera per descrivere il modo in cui i protagonisti della fiaba I tre principi di Serendip facevano scoperte inattese.','Nella ricerca, una sorpresa non è automaticamente una scoperta. Serve formulare una domanda, controllare le osservazioni e mettere alla prova una spiegazione.'],source:'https://it.wikipedia.org/wiki/Serendipit%C3%A0'},
 {id:'cielo',category:'Scienza',title:'Perché il cielo è blu?',short:['La luce del Sole sembra bianca, ma contiene molti colori. Attraversando l’atmosfera, incontra molecole che la diffondono in tutte le direzioni.','Le lunghezze d’onda più corte vengono diffuse maggiormente. Per questo, quando guardiamo lontano dal Sole, il cielo ci appare soprattutto blu.'],deep:['Questo processo è chiamato diffusione di Rayleigh. Avviene quando la luce incontra particelle molto più piccole della sua lunghezza d’onda.','Al tramonto la luce percorre un tratto più lungo nell’atmosfera. Gran parte del blu viene diffusa fuori dal percorso diretto, mentre la luce che ci raggiunge appare più rossa.','Il colore osservato dipende anche dalla sensibilità dei nostri occhi e dallo spettro della luce solare.'],source:'https://it.wikipedia.org/wiki/Diffusione_di_Rayleigh'},
 {id:'stampa',category:'Cultura',title:'Una pagina può cambiare il mondo',short:['Prima della stampa, copiare un libro richiedeva tempo e lavoro. I caratteri mobili resero possibile comporre una pagina e riprodurla molte volte.','Nell’Europa del Quattrocento, la stampa contribuì a far circolare testi e idee su una scala nuova. Un cambiamento tecnico diventò anche culturale.'],deep:['I singoli caratteri potevano essere disposti in una forma, inchiostrati e premuti contro un foglio. Terminato un lavoro, si potevano riutilizzare per comporre un altro testo.','La storia della stampa non inizia in Europa: forme di stampa e caratteri mobili erano già state sviluppate in Asia. Gutenberg mise insieme un sistema adatto alla produzione europea.','La maggiore disponibilità dei testi cambiò il modo di conservare, confrontare e discutere le conoscenze.'],source:'https://it.wikipedia.org/wiki/Stampa_a_caratteri_mobili'},
 {id:'luna',category:'Scienza',title:'La Luna ci mostra sempre lo stesso volto',short:['La Luna ruota su se stessa, anche se dalla Terra vediamo quasi sempre la stessa faccia. Il suo periodo di rotazione coincide con quello della sua orbita.','Questa rotazione sincrona è il risultato dell’interazione gravitazionale con la Terra. Il lato lontano non è sempre buio: riceve la luce del Sole come quello vicino.'],deep:['Per immaginare il fenomeno, cammina intorno a una sedia tenendole sempre rivolto il viso. Dopo un giro avrai anche ruotato su te stesso.','Nel corso del tempo, le forze di marea hanno modificato la rotazione lunare fino a portarla in una configurazione sincrona.','Piccole oscillazioni apparenti, chiamate librazioni, ci permettono di osservare un po’ più della metà della superficie lunare nel corso del tempo.'],source:'https://it.wikipedia.org/wiki/Rotazione_sincrona'},
 {id:'mappe',category:'Cultura',title:'Ogni mappa sceglie cosa raccontare',short:['La Terra è curva, una mappa è piatta. Trasformare una superficie nell’altra comporta inevitabilmente delle deformazioni.','Una proiezione può conservare gli angoli oppure le aree, ma non tutte le proprietà insieme. La mappa migliore dipende dalla domanda che vogliamo farle.'],deep:['Una proiezione cartografica è un metodo per rappresentare su un piano punti della superficie terrestre. Ogni metodo privilegia alcune proprietà.','La proiezione di Mercatore conserva gli angoli localmente, ma ingrandisce molto le regioni vicine ai poli. Le proiezioni equivalenti conservano invece i rapporti tra le aree.','Oltre alla geometria, anche colori, nomi e dettagli selezionati influenzano la lettura.'],source:'https://it.wikipedia.org/wiki/Proiezione_cartografica'}
].map(a=>({...a,short:[...a.short,a.deep[0]],deep:a.deep.slice(1)}));
type WordBox={x:number;y:number;width:number;height:number};
type ReaderOrigin={shuffle?:boolean;words?:WordBox[];titleHeight?:number;top:number;bottom:number;left:number;right:number;titleTop:number;height:number;viewportHeight:number;home:boolean};
type Travel={axis:'x'|'y';direction:number};
type Route = 'home'|'search'|'profile'|'saved'|'history'|'settings';
const defaults={size:20,dark:false};
const spring={type:'spring' as const,stiffness:380,damping:31,mass:.8};
const softSpring={type:'spring' as const,stiffness:230,damping:27,mass:.85};
const ease=[.22,1,.36,1] as [number,number,number,number];
function readLocal<T,>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
function Icon({name,filled=false}:{name:string;filled?:boolean}){return <span aria-hidden="true" className={`material-symbols-rounded ${filled?'filled':''}`}>{name}</span>}
function measureHomeOrigin(element:HTMLElement,root:HTMLElement){
 const bounds=element.getBoundingClientRect(),frame=root.getBoundingClientRect(),style=getComputedStyle(element);
 const frameScale=frame.height/root.clientHeight,scale=style.transform==='none'?1:new DOMMatrixReadOnly(style.transform).d;
 const pivot=Number.parseFloat(style.transformOrigin.split(' ')[1])||0;
 const top=(bounds.top-frame.top)/frameScale-pivot*(1-scale);
 return {top,bottom:Math.max(0,root.clientHeight-top-bounds.height/frameScale/scale),left:0,right:0,titleTop:top,height:bounds.height/frameScale/scale,viewportHeight:root.clientHeight,home:true};
}

function measureListOrigin(element:HTMLElement,root:HTMLElement):ReaderOrigin{
 const box=element.getBoundingClientRect(),frame=root.getBoundingClientRect(),style=getComputedStyle(element),title=element.querySelector('.row-title')?.getBoundingClientRect();
 const frameScale=frame.height/root.clientHeight,scale=style.transform==='none'?1:new DOMMatrixReadOnly(style.transform).d;
 const words=Array.from(element.querySelectorAll('[data-title-word]')).map(word=>{const r=word.getBoundingClientRect();return{x:(r.left-(title?.left||box.left))/frameScale/scale,y:(r.top-(title?.top||box.top))/frameScale/scale,width:r.width/frameScale/scale,height:r.height/frameScale/scale}});
 const pivot=style.transformOrigin.split(' ').map(Number.parseFloat),top=(box.top-frame.top)/frameScale-(pivot[1]||0)*(1-scale),left=(box.left-frame.left)/frameScale-(pivot[0]||0)*(1-scale),height=box.height/frameScale/scale,width=box.width/frameScale/scale;
 return {words,titleHeight:(title?.height||29)/frameScale/scale,top,left,right:Math.max(0,root.clientWidth-left-width),bottom:Math.max(0,root.clientHeight-top-height),height,viewportHeight:root.clientHeight,titleTop:top+(title?(title.top-box.top)/frameScale/scale:29),home:false};
}
function measureShuffleOrigin(element:HTMLElement,root:HTMLElement):ReaderOrigin{const box=measureListOrigin(element,root);return {...box,shuffle:true,titleTop:box.top+8}}
export default function Prototype(){
 const {setDeviceId}=useMobileDevice(); const {screenRef}=useScreenPortal(); const keyboard=useKeyboard(); const {bottomInset}=useKeyboardInsets();
 const reduced=useReducedMotion();
 const [themeMoving,setThemeMoving]=useState(false);
 const [route,setRoute]=useState<Route>('home'),[category,setCategory]=useState('Per te'),[index,setIndex]=useState(0);
 const [travel,setTravel]=useState<Travel>({axis:'x',direction:1});
 const [categoryDirection,setCategoryDirection]=useState(1);
 const [chipsHidden,setChipsHidden]=useState(false);
 const feedPosition=useMotionValue(0),feedHeight=useMotionValue(712);
 useLayoutEffect(()=>{feedPosition.set(0)},[category]);
 const feedControl=useRef<ReturnType<typeof animate>|null>(null),wheelTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const closeRef=useRef<HTMLButtonElement|null>(null),searchRef=useRef<HTMLInputElement|null>(null),rootRef=useRef<HTMLDivElement|null>(null);
 const feedTop=useTransform(feedHeight,h=>(rootRef.current?.clientHeight||904)-h);
 useEffect(()=>{const resize=()=>{animate(feedHeight,(rootRef.current?.clientHeight||904)-(chipsHidden?138:192),reduced?{duration:0}:spring)};resize();const observer=new ResizeObserver(resize);if(rootRef.current)observer.observe(rootRef.current);return()=>observer.disconnect()},[chipsHidden,reduced]);

 const pendingTap=useRef<{timer:ReturnType<typeof setTimeout>;id:string;at:number}|null>(null),lastRandom=useRef<string|null>(null);
 const [saveFeedback,setSaveFeedback]=useState<{id:string;key:number}|null>(null);
 useEffect(()=>{if(!saveFeedback)return;const timer=setTimeout(()=>setSaveFeedback(null),400);return()=>clearTimeout(timer)},[saveFeedback]);
 const cancelArticleTap=()=>{if(pendingTap.current)clearTimeout(pendingTap.current.timer);pendingTap.current=null};
 useEffect(()=>{cancelArticleTap();return cancelArticleTap},[route,category,index]);
 const openerRef=useRef<HTMLElement|null>(null);
 const [expanded,setExpanded]=useState<Article|null>(null),[readerOpen,setReaderOpen]=useState(false),[readerOrigin,setReaderOrigin]=useState<ReaderOrigin>({top:256,bottom:20,left:0,right:0,titleTop:256,height:628,viewportHeight:904,home:true});
 const [saved,setSaved]=useState<string[]>(()=>readLocal('synapse-saved',[])),[history,setHistory]=useState<string[]>(()=>readLocal('synapse-history',[]));
 const [settings,setSettings]=useState(()=>{const s={...defaults,...readLocal('synapse-settings',defaults)};return {size:s.size===19?20:s.size,dark:s.dark}}),[query,setQuery]=useState(''),[toast,setToast]=useState('');
 useEffect(()=>{if(!themeMoving)return;const timer=setTimeout(()=>setThemeMoving(false),460);return()=>clearTimeout(timer)},[themeMoving,settings.dark]);
 const gesture=useRef<{x:number;y:number;position:number;dragged:boolean}|null>(null),suppressed=useRef(false);
 const filtered=articles.filter(a=>category==='Per te'||a.category===category),article=filtered[Math.min(index,filtered.length-1)];
 useEffect(()=>{document.title='Synapse · una piccola scoperta';setDeviceId('pixel-10');return()=>{feedControl.current?.stop();if(wheelTimer.current)clearTimeout(wheelTimer.current)}},[]);
 useEffect(()=>{const screen=screenRef.current;if(!screen)return;const reset=()=>{if(screen.scrollTop)screen.scrollTop=0;};screen.addEventListener('scroll',reset);return()=>screen.removeEventListener('scroll',reset)},[screenRef]);
 useEffect(()=>{localStorage.setItem('synapse-saved',JSON.stringify(saved));},[saved]);
 useEffect(()=>{localStorage.setItem('synapse-history',JSON.stringify(history));},[history]);
 useEffect(()=>{localStorage.setItem('synapse-settings',JSON.stringify(settings));},[settings]);
 useEffect(()=>{if(route==='home')setHistory(h=>[article.id,...h.filter(id=>id!==article.id)].slice(0,100));},[route,article.id]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),1700);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{if(route!=='search'||expanded)return;const frame=requestAnimationFrame(()=>searchRef.current?.focus({preventScroll:true}));return()=>cancelAnimationFrame(frame)},[route]);
 const settle=(next:number)=>{const target=Math.max(0,Math.min(filtered.length-1,next));setIndex(target);feedControl.current?.stop();feedControl.current=animate(feedPosition,target,reduced?{duration:0}:{...spring,velocity:feedPosition.getVelocity()});if(target===0)setChipsHidden(false)};
 const nav=(r:Route)=>{cancelArticleTap();const ranks:Record<Route,number>={home:0,search:1,profile:2,saved:3,history:3,settings:3};setTravel({axis:r==='search'||route==='search'?'y':'x',direction:ranks[r]>=ranks[route]?1:-1});keyboard.hide();setReaderOpen(false);setRoute(r);if(r===route&&r==='search')searchRef.current?.focus({preventScroll:true});if(r===route&&r==='home'){settle(0);setChipsHidden(false)}};
 const toggleSave=(id:string)=>{const was=saved.includes(id);setSaved(s=>was?s.filter(x=>x!==id):[...s,id]);setToast(was?'Rimosso dai salvati':'Articolo salvato')};
 const open=(a:Article,element?:HTMLElement,originOverride?:ReaderOrigin)=>{
  if(suppressed.current&&element?.classList.contains('reading-area'))return;
  if(expanded?.id!==a.id){
   const isHome=!!element?.classList.contains('reading-area');
   setReaderOrigin(originOverride??(element&&rootRef.current?(isHome?measureHomeOrigin(element,rootRef.current):measureListOrigin(element,rootRef.current)):{top:156,bottom:660,left:24,right:24,titleTop:187,height:88,viewportHeight:904,home:false}));
   openerRef.current=element||null;setExpanded(a);
  }
  keyboard.hide();setReaderOpen(true);setHistory(h=>[a.id,...h.filter(id=>id!==a.id)]);
 };
 const tapArticle=(a:Article,element:HTMLElement,detail:number)=>{
  if(suppressed.current)return;
  if(detail===0){cancelArticleTap();open(a,element);return}
  const pending=pendingTap.current;
  if(pending?.id===a.id&&Date.now()-pending.at<280){cancelArticleTap();setSaved(ids=>ids.includes(a.id)?ids:[a.id,...ids]);setToast('Articolo salvato');setSaveFeedback({id:a.id,key:Date.now()});return}
  cancelArticleTap();pendingTap.current={id:a.id,at:Date.now(),timer:setTimeout(()=>{pendingTap.current=null;open(a,element)},280)};
 };
 const shuffle=(element:HTMLElement)=>{cancelArticleTap();const pool=articles.filter(a=>a.id!==lastRandom.current),picked=pool[Math.floor(Math.random()*pool.length)];lastRandom.current=picked.id;open(picked,element,rootRef.current?measureShuffleOrigin(element,rootRef.current):undefined)};
 const page=(d:number)=>{const next=index+d;if(next<0||next>=filtered.length)return;setChipsHidden(d>0);settle(next)};
 const start=(e:PointerEvent<HTMLDivElement>)=>{suppressed.current=false;if((e.target as HTMLElement).closest('button,a'))return;feedControl.current?.stop();if(wheelTimer.current)clearTimeout(wheelTimer.current);gesture.current={x:e.clientX,y:e.clientY,position:feedPosition.get(),dragged:false}};
 const move=(e:PointerEvent<HTMLDivElement>)=>{const g=gesture.current;if(!g)return;const dy=e.clientY-g.y,dx=e.clientX-g.x;if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)*1.3){g.dragged=true;suppressed.current=true;cancelArticleTap();e.currentTarget.setPointerCapture(e.pointerId);setChipsHidden(dy<0);const next=g.position-dy/feedHeight.get();feedPosition.set(next<0?next*.22:next>filtered.length-1?filtered.length-1+(next-filtered.length+1)*.22:next)}};
 const end=(e:PointerEvent<HTMLDivElement>)=>{const g=gesture.current;gesture.current=null;if(!g)return;const dy=e.clientY-g.y;if(g.dragged){const target=Math.abs(dy)>55?Math.round(g.position)+(dy<0?1:-1):Math.round(feedPosition.get());settle(target)}};
 const wheel=(delta:number)=>{if(Math.abs(delta)<2)return;cancelArticleTap();feedControl.current?.stop();setChipsHidden(delta>0);const next=Math.max(0,Math.min(filtered.length-1,feedPosition.get()+delta/feedHeight.get()));feedPosition.set(next);setIndex(Math.round(next));if(wheelTimer.current)clearTimeout(wheelTimer.current);wheelTimer.current=setTimeout(()=>settle(Math.round(feedPosition.get())),90)};
 const closeReader=()=>{if(openerRef.current?.isConnected&&rootRef.current)setReaderOrigin(readerOrigin.home?measureHomeOrigin(openerRef.current,rootRef.current):readerOrigin.shuffle?measureShuffleOrigin(openerRef.current,rootRef.current):measureListOrigin(openerRef.current,rootRef.current));setReaderOpen(false)};
 useEffect(()=>{if(!expanded||!readerOpen)return;closeRef.current?.focus({preventScroll:true});const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')closeReader()};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape)},[expanded?.id,readerOpen]);
 const readerClosed=()=>{setExpanded(null);const restore=openerRef.current;if(restore?.isConnected)restore.focus({preventScroll:true});else rootRef.current?.querySelector<HTMLElement>('.back-button,.bottom-nav button[aria-current]')?.focus({preventScroll:true});if(route==='search')searchRef.current?.focus({preventScroll:true})};
 const activeProfile=['profile','saved','history','settings'].includes(route);
 const list=(route==='saved'?saved:history).map(id=>articles.find(a=>a.id===id)!).filter(Boolean);
 const term=query.trim().toLocaleLowerCase('it');
 const results=articles.filter(a=>`${a.title} ${a.category} ${a.short.join(' ')}`.toLocaleLowerCase('it').includes(term)).sort((a,b)=>Number(b.title.toLocaleLowerCase('it').includes(term))-Number(a.title.toLocaleLowerCase('it').includes(term)));
 const palette=usePalette(settings.dark,!!reduced);
 const style={...palette,'--reading-size':`${settings.size}px`,'--nav-inset':`${bottomInset}px`} as MotionStyle;
 return <MotionConfig reducedMotion="user" transition={spring}><LayoutGroup id="synapse"><motion.div ref={rootRef} className={`synapse ${settings.dark?'theme-dark':''} ${themeMoving?'theme-moving':''} ${expanded&&!readerOpen?'reader-closing':''}`} style={style} onPointerDownCapture={e=>{if((e.target as HTMLElement).closest('button,a,input'))cancelArticleTap()}} onFocusCapture={()=>{if(screenRef.current)screenRef.current.scrollTop=0}}>
 <motion.div className="base-layer" inert={readerOpen} aria-hidden={readerOpen?true:undefined} animate={{opacity:1,scale:1}} transition={{duration:.3,ease}}>
 <AnimatePresence initial={false} mode="sync" custom={travel}><ScreenStage key={route} travel={travel}>
 {route==='home'&&<><header className="home-header"><div className="wordmark">Synapse</div><div className="chips-visibility" inert={chipsHidden}><Carousel className="category-rail" contentClassName="category-track" ariaLabel="Categorie"><div className="chip-row">{['Per te','Scienza','Cultura'].map((c,i)=><CategoryChip key={c} label={c} selected={category===c} hidden={chipsHidden} order={i} onClick={()=>{if(c===category)return;setCategoryDirection(i-['Per te','Scienza','Cultura'].indexOf(category)>0?1:-1);feedControl.current?.stop();if(wheelTimer.current)clearTimeout(wheelTimer.current);gesture.current=null;setCategory(c);setIndex(0);setChipsHidden(false)}}/>)}</div></Carousel></div></header>
 <motion.div className="feed-viewport" style={{top:feedTop}} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;settle(Math.round(feedPosition.get()))}} onWheel={e=>wheel(e.deltaY)} tabIndex={0} aria-label="Feed di lettura" onKeyDown={e=>{if(['ArrowDown','PageDown','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();page(['ArrowDown','PageDown'].includes(e.key)?1:-1)}}}>
 <AnimatePresence initial={false} custom={categoryDirection}><CategoryStage key={category} direction={categoryDirection} position={feedPosition}>{frozenPosition=><>{filtered.map((a,i)=><FeedPage key={a.id} position={frozenPosition} height={feedHeight} page={i} active={i===index}><article className="short-article" data-testid={i===index?'current-article':undefined}>
 <div className="article-meta"><span className="category-badge"><Icon name={a.category==='Scienza'?'science':'auto_stories'}/>{a.category}</span><span className="read-time"><Icon name="schedule"/>2 min</span><SaveButton saved={saved.includes(a.id)} onClick={()=>toggleSave(a.id)}/></div>
 <motion.div className="reading-area" style={{visibility:expanded?.id===a.id?'hidden':'visible'}} role="button" tabIndex={i===index?0:-1} aria-label={`Approfondisci: ${a.title}`} whileTap={{scale:.978}} onClick={e=>tapArticle(a,e.currentTarget,e.detail)} onDoubleClick={e=>e.preventDefault()} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();suppressed.current=false;open(a,e.currentTarget)}}}>
 <h1>{a.id==='doppler'?<>Il suono cambia<br/>quando ci muoviamo</>:a.title}</h1>
 <div className="article-body">{a.short.map(p=><p key={p}>{p}</p>)}</div><AnimatePresence>{saveFeedback?.id===a.id&&<motion.span key={saveFeedback.key} className="double-tap-save" aria-hidden="true" initial={{scale:.45,y:8,clipPath:'inset(100% 0 0 0)'}} animate={{scale:1,y:0,clipPath:'inset(0% 0 0 0)'}} exit={{scale:.75,clipPath:'inset(100% 0 0 0)'}} transition={{duration:.16,ease}}><Icon name="bookmark" filled/></motion.span>}</AnimatePresence>
 </motion.div></article></FeedPage>)}</>}</CategoryStage></AnimatePresence></motion.div><div className="feed-fade" aria-hidden="true"/></>}
 {route==='search'&&<><header className="section-header"><h1>Cerca</h1></header><div className="search-results" style={{bottom:keyboard.visible?84:bottomInset+170}}><MobileScroll><div className="list-content"><AnimatePresence initial={false} mode="popLayout">{results.length?results.map(a=><ArticleRow key={a.id} article={a} covered={expanded?.id===a.id} onClick={element=>open(a,element)}/>):<motion.div key="empty" initial={{y:8,clipPath:'inset(0 0 100% 0)'}} animate={{y:0,clipPath:'inset(0 0 0% 0)'}} exit={{y:-8,clipPath:'inset(0 0 100% 0)'}}><Empty title="Nessun risultato" text="Prova un altro argomento."/></motion.div>}</AnimatePresence></div></MobileScroll></div>
 <motion.div className="search-tools" layout transition={softSpring} style={{bottom:bottomInset+(keyboard.visible?14:98)}}><motion.form className="search-composer" layout transition={softSpring} onSubmit={e=>{e.preventDefault();keyboard.hide()}}><motion.button type="button" className="search-back" aria-label="Chiudi ricerca" whileTap={{scale:.85}} onPointerDown={e=>e.preventDefault()} onClick={()=>nav('home')}><Icon name="arrow_back"/></motion.button><KeyboardInput ref={searchRef} aria-label="Cerca nella raccolta" placeholder="Cerca un argomento" value={query} onChange={e=>setQuery(e.target.value)} onBlur={()=>keyboard.hide()}/><AnimatePresence>{query&&<motion.button key="clear" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} whileTap={{scale:.8}} type="button" aria-label="Cancella ricerca" onPointerDown={e=>e.preventDefault()} onClick={()=>{setQuery('');searchRef.current?.focus({preventScroll:true})}}><Icon name="close"/></motion.button>}</AnimatePresence></motion.form><motion.button type="button" className="shuffle-button" aria-label="Apri un articolo casuale" title="Articolo casuale" whileTap={{scale:.88,rotate:12}} onPointerDown={e=>e.preventDefault()} onClick={e=>shuffle(e.currentTarget)}><Icon name="shuffle"/></motion.button></motion.div></>}
 {route==='profile'&&<><header className="section-header"><h1>Profilo</h1></header><div className="profile-content"><MobileScroll><div className="profile-inner"><div className="profile-menu"><MenuRow icon="bookmark" title="Articoli salvati" count={saved.length} onClick={()=>nav('saved')}/><MenuRow icon="history" title="Cronologia" onClick={()=>nav('history')}/><MenuRow icon="tune" title="Impostazioni" onClick={()=>nav('settings')}/></div></div></MobileScroll></div></>}
 {(route==='saved'||route==='history')&&<><header className="section-header with-back"><Back onClick={()=>nav('profile')}/><h1>{route==='saved'?'Articoli salvati':'Cronologia'}</h1></header><div className="collection-content"><MobileScroll><div className="list-content"><AnimatePresence initial={false} mode="popLayout">{list.length?list.map(a=><ArticleRow key={a.id} article={a} covered={expanded?.id===a.id} onClick={element=>open(a,element)}/>):<motion.div key="empty" initial={{clipPath:'inset(0 0 100% 0)'}} animate={{clipPath:'inset(0 0 0% 0)'}}><Empty title="Nessun articolo salvato" text="Usa Salva per ritrovarlo qui."/></motion.div>}</AnimatePresence></div></MobileScroll></div></>}
 {route==='settings'&&<><header className="section-header with-back"><Back onClick={()=>nav('profile')}/><h1>Impostazioni</h1></header><div className="settings-content"><MobileScroll><div className="settings-inner"><h2>Dimensione del testo</h2><div className="size-options">{[20,21,23].map((size,i)=><motion.button key={size} whileTap={{scale:.96}} aria-pressed={settings.size===size} className={settings.size===size?'selected':''} onClick={()=>setSettings(s=>({...s,size}))}>{settings.size===size&&<motion.span className="size-selection" layoutId="size-selection"/>}<span>{['Normale','Grande','Ampio'][i]}</span></motion.button>)}</div><motion.p layout className="sample-text">Una piccola scoperta può cambiare il modo in cui guardiamo il mondo.</motion.p><Toggle title="Tema scuro" checked={settings.dark} onToggle={()=>{setThemeMoving(true);setSettings(s=>({...s,dark:!s.dark}))}}/></div></MobileScroll></div></>}
 </ScreenStage></AnimatePresence>
 <AnimatePresence>{!keyboard.visible&&<motion.nav key="navigation" className="nav-dock" aria-label="Navigazione principale" style={{bottom:bottomInset+22}} initial={{y:110}} animate={{y:0}} exit={{y:110}} transition={{duration:.22,ease}}><div className="bottom-nav">{[{id:'home',icon:'home',label:'Home',active:route==='home'},{id:'profile',icon:'person',label:'Profilo',active:activeProfile}].map(item=><motion.button key={item.id} whileTap={{scale:.91}} aria-label={item.label} aria-current={item.active?'page':undefined} className={item.active?'active':''} onClick={()=>nav(item.id as Route)}><span className="nav-icon">{item.active&&<motion.span className="nav-selection" layoutId="nav-selection" transition={spring}/>}<Icon name={item.icon} filled={item.active}/></span><span>{item.label}</span></motion.button>)}</div><motion.button className={`search-orb ${route==='search'?'active':''}`} aria-label="Cerca" aria-current={route==='search'?'page':undefined} whileTap={{scale:.88,rotate:-5}} whileHover={{scale:1.04}} onClick={()=>nav('search')}><Icon name="search"/></motion.button></motion.nav>}</AnimatePresence>
 </motion.div>
 {expanded&&<ReaderPanel key={expanded.id} article={expanded} open={readerOpen} origin={readerOrigin} saved={saved.includes(expanded.id)} closeRef={closeRef} onClose={closeReader} onReopen={()=>setReaderOpen(true)} onClosed={readerClosed} onSave={()=>toggleSave(expanded.id)}/>}
 <AnimatePresence>{toast&&<motion.div role="status" className="toast" initial={{y:35,clipPath:'inset(0 0 100% 0)'}} animate={{y:0,clipPath:'inset(0 0 0% 0)'}} exit={{y:35,clipPath:'inset(0 0 100% 0)'}} transition={spring} style={{bottom:bottomInset+104}}>{toast}</motion.div>}</AnimatePresence>
 </motion.div></LayoutGroup></MotionConfig>
}

function usePalette(dark:boolean,reduced:boolean){
 const progress=useMotionValue(dark?1:0);
 useEffect(()=>{const control=animate(progress,dark?1:0,{duration:reduced?0:.42*Math.abs((dark?1:0)-progress.get()),ease:'linear'});return()=>control.stop()},[dark,reduced]);
 const paper=useTransform(progress,[0,1],['#f7f4ee','#1d1b19']);
 const ink=useTransform(()=>{const p=progress.get();if(p<.001)return '#282621';if(p>.999)return '#efe9df';const rgb=paper.get().match(/[\d.]+/g)?.slice(0,3).map(Number);if(!rgb)return p<.78?'#000000':'#ffffff';const linear=rgb.map(n=>{const c=n/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4});const luminance=linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;return luminance>.179?'#000000':'#ffffff'});
 const muted=useTransform(progress,[0,1],['#67655f','#b6aea2']);
 const surface=useTransform(progress,[0,1],['#eae4dc','#35302c']);
 const accent=useTransform(progress,[0,1],['#b65b40','#df9878']);
 const active=useTransform(progress,[0,1],['#dda184','#82513e']);
 const line=useTransform(progress,[0,1],['#ded8cf','#474139']);
 return {'--paper':paper,'--ink':ink,'--muted':muted,'--surface':surface,'--accent':accent,'--active':active,'--line':line};
}


function CategoryChip({label,selected,hidden,order,onClick}:{label:string;selected:boolean;hidden:boolean;order:number;onClick:()=>void}){
 return <motion.button className={`category-chip ${selected?'selected':''}`} aria-pressed={selected} onClick={onClick} initial={false} animate={{y:hidden?-48:0,scale:hidden?.92:1}} whileTap={{scale:.93}} transition={{type:'spring',stiffness:440+order*45,damping:30,mass:.65}}><motion.span className="chip-selection" initial={false} animate={{scale:selected?1:0}} transition={{type:'spring',stiffness:550,damping:30,mass:.55}}/><span>{label}</span></motion.button>
}
function CategoryStage({children,direction,position}:{children:(position:MotionValue<number>)=>React.ReactNode;direction:number;position:MotionValue<number>}){
 const present=useIsPresent(),frozen=useMotionValue(position.get());
 useLayoutEffect(()=>{if(!present)return;frozen.set(position.get());return position.on('change',v=>frozen.set(v))},[present,position]);
 return <motion.div className="category-stage" inert={!present} custom={direction} variants={{enter:(d:number)=>({x:`${d*100}%`}),settled:{x:'0%'},leave:(d:number)=>({x:`${-d*100}%`})}} initial="enter" animate="settled" exit="leave" transition={{type:'spring',stiffness:470,damping:36,mass:.65}}>{children(frozen)}</motion.div>
}
function MorphTitle({title,origin,progress}:{title:string;origin:ReaderOrigin;progress:MotionValue<number>}){
 const measure=useRef<HTMLSpanElement|null>(null),[layout,setLayout]=useState<{words:WordBox[];height:number}>({words:[],height:88});
 useLayoutEffect(()=>{const element=measure.current;if(!element)return;const update=()=>{const base=element.getBoundingClientRect(),scale=base.width/element.offsetWidth;setLayout({height:element.offsetHeight,words:Array.from(element.querySelectorAll('[data-title-word]')).map(w=>{const r=w.getBoundingClientRect();return{x:(r.left-base.left)/scale,y:(r.top-base.top)/scale,width:r.width/scale,height:r.height/scale}})})};update();const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect()},[title]);
 const height=useTransform(progress,p=>(origin.titleHeight||29)*(1-p)+layout.height*p),margin=useTransform(progress,p=>22*p);
 const words=title.split(' ');
 return <motion.h1 className="morph-title" aria-label={title} style={{height,marginBottom:margin}}><span className="morph-title-measure" ref={measure} aria-hidden="true">{words.map((word,i)=><span data-title-word key={i}>{word}{i<words.length-1?' ':''}</span>)}</span>{layout.words.map((box,i)=><MorphWord key={i} text={words[i]} source={origin.words?.[i]||box} destination={box} progress={progress} left={origin.left-24}/>)}</motion.h1>
}
function MorphWord({text,source,destination,progress,left}:{text:string;source:WordBox;destination:WordBox;progress:MotionValue<number>;left:number}){
 const phase=(p:number,start:number,end:number)=>{const t=Math.max(0,Math.min(1,(p-start)/(end-start)));return t*t*(3-2*t)};
 const x=useTransform(progress,p=>{const q=phase(p,.22,.77);return (source.x+left)*(1-q)+destination.x*q});
 const y=useTransform(progress,p=>{if(source.y>5){const lane=Math.max(source.y,destination.y)+44;return p<.77?source.y+(lane-source.y)*phase(p,0,.22):lane+(destination.y-lane)*phase(p,.77,1)}return source.y+(destination.y-source.y)*phase(p,0,.22)});
 const scale=useTransform(progress,p=>.625+.375*phase(p,.22,.77)),weight=useTransform(progress,p=>400+100*phase(p,.22,.77)),spacing=useTransform(progress,p=>`${-.48-.32*phase(p,.22,.77)}px`);
 return <motion.span className="morph-word" aria-hidden="true" style={{x,y,scale,fontWeight:weight,letterSpacing:spacing}}>{text}</motion.span>
}

function ScreenStage({children,travel}:{children:React.ReactNode;travel:Travel}){
 const present=useIsPresent();
 const variants={enter:(t:Travel)=>({x:t.axis==='x'?`${t.direction*100}%`:'0%',y:t.axis==='y'?`${t.direction*100}%`:'0%'}),settled:{x:'0%',y:'0%'},leave:(t:Travel)=>({x:t.axis==='x'?`${-t.direction*100}%`:'0%',y:t.axis==='y'?`${-t.direction*100}%`:'0%'})};
 return <motion.div className="screen-stage" inert={!present} custom={travel} variants={variants} initial="enter" animate="settled" exit="leave" transition={{type:'spring',stiffness:440,damping:38,mass:.7}}>{children}</motion.div>
}
function SaveButton({saved,onClick}:{saved:boolean;onClick:()=>void}){
 const reduced=useReducedMotion(),pulse=useMotionValue(0),fill=useMotionValue(saved?1:0),control=useRef<ReturnType<typeof animate>|null>(null);
 const scaleX=useTransform(pulse,p=>1-.12*p),scaleY=useTransform(pulse,p=>1-.18*p),y=useTransform(pulse,p=>-1.5*p),fillClip=useTransform(fill,p=>`inset(${(1-p)*100}% 0 0 0)`);
 useEffect(()=>{const a=animate(fill,saved?1:0,{duration:reduced?0:.12,ease:'easeOut'});return()=>a.stop()},[saved,reduced]);
 useEffect(()=>()=>control.current?.stop(),[]);
 const tap=()=>{control.current?.stop();if(!reduced)control.current=animate(pulse,1,{duration:.055,ease:'easeOut',onComplete:()=>{control.current=animate(pulse,0,{type:'spring',stiffness:1050,damping:32,mass:.3,restDelta:.001,restSpeed:.1})}});onClick()};
 return <button className={`save-button ${saved?'is-saved':''}`} aria-label={saved?'Rimuovi dai salvati':'Salva articolo'} aria-pressed={saved} onClick={tap}><motion.span className="save-icon" style={{scaleX,scaleY,y}}><span className="save-outline"><Icon name="bookmark"/></span><motion.span className="save-filled" style={{clipPath:fillClip}}><Icon name="bookmark" filled/></motion.span></motion.span></button>
}
function ArticleRow({article,onClick,ref,covered=false}:{article:Article;covered?:boolean;onClick:(element:HTMLElement)=>void;ref?:Ref<HTMLButtonElement>}){
 const present=useIsPresent(),tap=useRef<{x:number;y:number;dragged:boolean}|null>(null);
 return <motion.button ref={ref} layout="position" className="article-row" inert={!present} disabled={!present} style={{pointerEvents:present?'auto':'none',visibility:covered?'hidden':'visible'}}
 onPointerDown={e=>{if(e.button===0){tap.current={x:e.clientX,y:e.clientY,dragged:false};e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId)}}}
 onPointerMove={e=>{const t=tap.current;if(t&&Math.hypot(e.clientX-t.x,e.clientY-t.y)>8)t.dragged=true}}
 onPointerCancel={()=>{tap.current=null}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')tap.current=null}}
 initial={{y:8,clipPath:'inset(0 0 100% 0)'}} animate={{y:0,clipPath:'inset(0 0 0% 0)'}} exit={{y:-4,clipPath:'inset(0 0 100% 0)'}} transition={{layout:softSpring,clipPath:{duration:.16,ease},y:softSpring}} whileTap={{scale:.975}}
 onClick={e=>{const dragged=tap.current?.dragged;tap.current=null;if(!dragged)onClick(e.currentTarget)}}><span className="row-meta">{article.category} · 2 min</span><span className="row-title">{article.title.split(" ").map((word,i)=><span key={i} data-title-word>{word}{i<article.title.split(" ").length-1?" ":""}</span>)}</span><Icon name="arrow_forward"/></motion.button>
}
function MenuRow({icon,title,count,onClick}:{icon:string;title:string;count?:number;onClick:()=>void}){return <motion.button className="menu-row" whileTap={{scale:.975,x:3}} onClick={onClick}><span className="menu-symbol"><Icon name={icon}/></span><strong>{title}</strong>{count!==undefined&&<span className="menu-count">{count}</span>}<Icon name="chevron_right"/></motion.button>}
function Back({onClick}:{onClick:()=>void}){return <motion.button className="back-button" aria-label="Torna al Profilo" whileTap={{scale:.85,x:-3}} onClick={onClick}><Icon name="arrow_back"/></motion.button>}
function Empty({title,text}:{title:string;text:string}){return <div className="empty-state"><h2>{title}</h2><p>{text}</p></div>}
function Toggle({title,checked,onToggle}:{title:string;checked:boolean;onToggle:()=>void}){return <motion.button className="toggle-row" role="switch" aria-checked={checked} whileTap={{scale:.99}} onClick={onToggle}><strong>{title}</strong><span className={`switch-track ${checked?'on':''}`}><motion.span animate={{x:checked?18:0,scale:1}} whileTap={{scale:1.12}} transition={spring}/></span></motion.button>}
function StreamingText({paragraphs,enabled=true}:{paragraphs:string[];enabled?:boolean}){
 const reduced=useReducedMotion(),total=paragraphs.join(' ').split(' ').length;
 const [visible,setVisible]=useState(reduced?total:0);
 useEffect(()=>{if(reduced){setVisible(total);return}if(!enabled)return;let interval:ReturnType<typeof setInterval>;const timer=setTimeout(()=>{interval=setInterval(()=>setVisible(n=>{if(n+4>=total)clearInterval(interval);return Math.min(n+4,total)}),30)},0);return()=>{clearTimeout(timer);clearInterval(interval)}},[total,reduced,enabled]);
 let consumed=0;
 return <div className="streaming-text" aria-label={paragraphs.join(' ')} aria-busy={visible<total}>{paragraphs.map((p,i)=>{const words=p.split(' '),count=Math.max(0,Math.min(words.length,visible-consumed));consumed+=words.length;return count>0?<p key={i} aria-hidden="true">{words.slice(0,count).map((word,j)=><span className="revealed-word" key={j}>{word}{' '}</span>)}</p>:null})}</div>
}

function FeedPage({children,position,height,page,active}:{children:React.ReactNode;position:MotionValue<number>;height:MotionValue<number>;page:number;active:boolean}){
 const y=useTransform(()=> (page-position.get())*height.get());
 return <motion.div className="feed-page" style={{y,height}} inert={!active} aria-hidden={!active}>{children}</motion.div>
}
function ReaderPanel({article,open,origin,saved,closeRef,onClose,onReopen,onClosed,onSave}:{article:Article;open:boolean;origin:ReaderOrigin;saved:boolean;closeRef:Ref<HTMLButtonElement>;onClose:()=>void;onReopen:()=>void;onClosed:()=>void;onSave:()=>void}){
 const reduced=useReducedMotion(),progress=useMotionValue(0),press=useMotionValue(origin.home ? .978 : 1),panelHeight=useMotionValue(origin.viewportHeight);
 const target=useRef(open);target.current=open;
 const returnScroll=useMotionValue(0);
 const originY=useRef(origin.titleTop-138),scrollRef=useRef<HTMLDivElement|null>(null);
 const panelRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{const update=()=>panelHeight.set(panelRef.current?.clientHeight||origin.viewportHeight);update();const observer=new ResizeObserver(update);if(panelRef.current)observer.observe(panelRef.current);return()=>observer.disconnect()},[]);
 const clip=useTransform(()=>{const p=Math.max(0,Math.min(1,progress.get())),bottom=origin.home?origin.bottom:Math.max(0,panelHeight.get()-origin.top-origin.height);return `inset(${origin.top*(1-p)}px ${origin.right*(1-p)}px ${bottom*(1-p)}px ${origin.left*(1-p)}px round ${origin.shuffle?28*(1-p):0}px)`});
 // Shuffle collapses as one miniature surface, rather than dragging full-size type into an orb.
 const shuffleScale=useTransform(()=>{const p=Math.max(0,Math.min(1,progress.get())),width=panelRef.current?.clientWidth||427;return origin.shuffle?press.get()*(56/width+(1-56/width)*p):press.get()});
 const x=useTransform(()=>{const p=Math.max(0,Math.min(1,progress.get())),width=panelRef.current?.clientWidth||427;return origin.shuffle?(origin.left+28-width/2)*(1-p):0});
 const y=useTransform(()=>{const p=Math.max(0,Math.min(1,progress.get()));return origin.shuffle?(origin.top+origin.height/2-122-16*shuffleScale.get())*(1-p)+returnScroll.get()*(1-p)*shuffleScale.get():(originY.current+returnScroll.get())*(1-progress.get())});
 const shuffleContentClip=useTransform(progress,p=>`inset(0 0 ${100*(1-Math.max(0,Math.min(1,p/.24)))}% 0)`);
 const shufflePaper=useTransform(progress,p=>`color-mix(in srgb, var(--paper) ${Math.max(0,Math.min(100,p/.3*100))}%, var(--active))`);
 const shuffleIconClip=useTransform(progress,p=>`inset(0 0 ${100*Math.max(0,Math.min(1,p/.28))}% 0)`);
 const shuffleIconScale=useTransform(progress,p=>1-.25*Math.max(0,Math.min(1,p/.28)));
 const shuffleIconRotate=useTransform(progress,p=>-25*Math.max(0,Math.min(1,p/.28)));
 const headerClip=useTransform(progress,p=>`inset(0 0 ${Math.max(0,Math.min(100,(1-p)*(origin.home?200:100)))}% 0)`),headerY=useTransform(progress,p=>-10*(1-p));
 const deepClip=useTransform(progress,p=>`inset(0 0 ${100*(1-Math.max(0,Math.min(1,p*3)))}% 0)`);
 const bodyClip=useTransform(progress,p=>origin.home?'inset(0 0 0% 0)':`inset(0 0 ${100*(1-Math.max(0,Math.min(1,(p-(origin.shuffle?.12:.9))/(origin.shuffle?.4:.1))))}% 0)`);
 const titleWeight=useTransform(progress,p=>origin.home||origin.shuffle?500:400+100*p);
 const titleSize=useTransform(progress,p=>origin.home||origin.shuffle?40:25+15*p),titleLine=useTransform(progress,p=>origin.home||origin.shuffle?1.1:1.16-.06*p),titleSpacing=useTransform(progress,p=>origin.home||origin.shuffle?-.8:-.3-.5*p),titleMargin=useTransform(progress,p=>origin.home?22:22*p);
 const metaClip=useTransform(progress,p=>`inset(0 ${Math.min(100,Math.max(0,p*400))}% 0 0)`);
 const returnFade=useTransform(progress,p=>1-Math.max(0,Math.min(1,p)));
 useEffect(()=>{
  const trackReturn=()=>{if(target.current)return;const scroll=scrollRef.current?.querySelector<HTMLElement>('.mobile-scroll');originY.current=origin.titleTop-138;returnScroll.set((scroll?.scrollTop||0)-(Number.parseFloat(scroll?.dataset.overscroll||'0')||0))};
  if(!open)trackReturn();
  const transition=reduced?{duration:0}:{type:'spring' as const,stiffness:520,damping:40,mass:.7,restDelta:.001,restSpeed:.1};
  const control=animate(progress,open?1:0,{...transition,velocity:progress.getVelocity(),onUpdate:trackReturn,onComplete:()=>{if(!target.current)onClosed()}});
  const bounce=animate(press,1,reduced?{duration:0}:{type:'spring',stiffness:650,damping:26,mass:.65});
  return()=>{control.stop();bounce.stop()}
 },[open,reduced]);
 return <motion.div ref={panelRef} className={`reader-overlay continuous-reader ${open?'is-open':'is-closing'}`}  role={open?'dialog':undefined} aria-modal={open?true:undefined} aria-label={article.title} data-reader-target={open?'open':'closed'}>
 <motion.div className="reader-surface" style={{clipPath:clip,background:origin.shuffle?shufflePaper:undefined}}>
 <motion.div className="reader-scroll" ref={scrollRef} style={{x,y,scale:shuffleScale,transformOrigin:origin.shuffle?'50% 0px':undefined,clipPath:origin.shuffle?shuffleContentClip:undefined}} onClick={e=>{if(!target.current&&(e.target as HTMLElement).closest('.long-article')){e.preventDefault();e.stopPropagation();onReopen()}}}><MobileScroll><article className="long-article">{origin.home||origin.shuffle?<motion.h1 style={{fontWeight:titleWeight,fontSize:titleSize,lineHeight:titleLine,letterSpacing:titleSpacing,marginBottom:titleMargin}}>{origin.home&&article.id==='doppler'?<>Il suono cambia<br/>quando ci muoviamo</>:article.title}</motion.h1>:<MorphTitle title={article.title} origin={origin} progress={progress}/>}<motion.div className="article-body" style={{clipPath:bodyClip}}>{article.short.map(p=><p key={p}>{p}</p>)}<motion.div style={{clipPath:deepClip}}><StreamingText paragraphs={article.deep} enabled={open}/></motion.div></motion.div><motion.section style={{clipPath:bodyClip}} className="source-block"><a href={article.source} target="_blank" rel="noreferrer">Approfondisci su Wikipedia<Icon name="open_in_new"/></a></motion.section></article></MobileScroll></motion.div>
 {!origin.home&&!origin.shuffle&&<><motion.div className="reader-origin-meta" style={{top:origin.top+21,left:origin.left,clipPath:metaClip}}>{article.category} · 2 min</motion.div><motion.span className="reader-origin-arrow" style={{top:origin.top+origin.height/2-10,right:origin.right,clipPath:metaClip}}><Icon name="arrow_forward"/></motion.span></>}{origin.shuffle&&<motion.span className="reader-origin-shuffle" style={{top:origin.top+origin.height/2-12,left:origin.left+16,clipPath:shuffleIconClip,scale:shuffleIconScale,rotate:shuffleIconRotate}}><Icon name="shuffle"/></motion.span>}{origin.home&&<motion.div className="reader-return-fade" style={{opacity:returnFade}} aria-hidden="true"/>}</motion.div>
 <motion.header className="reader-header" style={{clipPath:headerClip,y:headerY}}><motion.button className="back-button" ref={closeRef} aria-label="Chiudi approfondimento" whileTap={{scale:.85}} onClick={onClose}><Icon name="arrow_back"/></motion.button><span>{article.category}</span><SaveButton saved={saved} onClick={onSave}/></motion.header>
 </motion.div>
}
