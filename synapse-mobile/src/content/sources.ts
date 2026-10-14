import type {Article} from './types';
import {Wikipedia} from './wikipedia';
import {paragraphsFromHtml} from './html';
import {makeEdition,isVerified,boundedParagraphs,wordCount,sourceInfo} from './edition';
import {classifyLocal} from './classification';
import {identity} from './recommendations';
type BatchArgs=Parameters<Wikipedia['batch']>;
export interface ContentProvider{full(a:Article,signal?:AbortSignal):Promise<Article>}
/** Single request per scheduled turn; independent provider cooldowns. */
export class Wikivoyage implements ContentProvider{
 private transport:Wikipedia;private next=0;private titles=['Venezia','Napoli','Siena','Kyoto','Matera','Palermo','Firenze','Istanbul','Roma','Bologna','Genova','Ravenna','Torino','Lisbona','Praga','Budapest','Lucca','Ferrara','Trieste','Verona'];
 constructor(fetcher:typeof fetch=globalThis.fetch.bind(globalThis)){this.transport=new Wikipedia(fetcher,'https://it.wikivoyage.org/w/api.php')}
 private async read(title:string,signal?:AbortSignal):Promise<Article|undefined>{
  const data=await this.transport.request({action:'parse',page:title,prop:'text|revid|links',redirects:'1'},signal,1) as unknown as {parse?:{pageid:number;title:string;text:string;revid:number;links?:{ns:number;'*'?:string;title?:string}[]}};
  const p=data.parse;if(!p?.text)return;
  const sections:{text:string;section:string}[]=[];
  const paragraphs=paragraphsFromHtml(p.text,/^(?:Cenni storici|Cultura e tradizioni|Storia|Da sapere)$/i,(text,section)=>sections.push({text,section}));
  if(!paragraphs.length)return;
  for(const l of p.links||[]){const t=l['*']||l.title;if(l.ns===0&&t&&!t.includes(':')&&!this.titles.includes(t)&&this.titles.length<300)this.titles.push(t)}
  const url='https://it.wikivoyage.org/wiki/'+encodeURIComponent(p.title||title);
  const a=makeEdition({id:'voyage:'+p.pageid,title:p.title||title,category:'general',paragraphs,preview:[],complete:true,textVersion:3,revision:p.revid,source:url,fetchedAt:Date.now(),provenance:{provider:'wikivoyage',title:p.title||title,url,revision:p.revid,section:'Cenni storici / Cultura e tradizioni / Da sapere',license:'https://creativecommons.org/licenses/by-sa/4.0/',attribution:'Wikivoyage e suoi contributori'}},true);
  if(a?.provenance)a.provenance.section=sections.find(s=>s.text.includes(a.preview[0]?.slice(0,60)))?.section||'Cenni storici';
  return a?classifyLocal(a):undefined;
 }
 async batch(exclude:Set<string>,signal?:AbortSignal){const a=await this.read(this.titles[this.next++%this.titles.length],signal);return a&&!exclude.has(a.id)&&!exclude.has(identity(a))?[a]:[]}
 async full(a:Article,signal?:AbortSignal){if(a.complete)return a;return await this.read(a.provenance?.title||a.title,signal)??a}
}
export class DiscoverySources implements ContentProvider{
 private voyage:Wikivoyage;private turns=0;private wikipediaTurns=0;
 constructor(private wikipedia:Wikipedia,fetcher?:typeof fetch){this.voyage=new Wikivoyage(fetcher)}
 async voyageTurn(reserveCount:number){return reserveCount>=20&&++this.turns%5===0}
 async discoverVoyage(exclude:Set<string>,signal:AbortSignal){try{return await this.voyage.batch(exclude,signal)}catch(error){if(signal.aborted)throw error;return []}}
 async discoverSection(category:string,exclude:Set<string>,signal:AbortSignal,learning:BatchArgs[4]){if(++this.wikipediaTurns%3!==0)return undefined;return this.wikipedia.discovery(category,exclude,signal,learning)}
 async batch(...args:BatchArgs){const callback=args[5]?.onChunk;const prepare=(rows:Article[])=>rows.map(a=>makeEdition({...a,provenance:sourceInfo(a)})).filter((a):a is Article=>!!a);args[5]={...args[5],onChunk:rows=>callback?.(prepare(rows))};return prepare(await this.wikipedia.batch(...args))}
 search(...args:Parameters<Wikipedia['search']>){return this.wikipedia.search(...args)}
 async random(...args:Parameters<Wikipedia['random']>){const a=await this.wikipedia.random(...args);return a?makeEdition(a):undefined}
 async full(a:Article,signal?:AbortSignal){
  if(isVerified(a)||a.complete&&a.edition)return a;
  const full=a.provenance?.provider==='wikivoyage'?await this.voyage.full(a,signal):await this.wikipedia.full(a,signal);
  if(!a.edition)return full;
  // Published introduction stays fixed. Extend only its own exact source passage.
  const text=full.paragraphs.join(' ').replace(/\s+/g,' ').trim(),intro=a.preview.join(' ').replace(/\s+/g,' ').trim(),offset=text.indexOf(intro);
  if(offset<0)return {...a,contentIssue:'La fonte è cambiata; conserva questa edizione o apri l’originale.',contentIssueKind:'content' as const};
  const tail=text.slice(offset+intro.length).trim().split(/\n\n+/);
  return {...full,preview:a.preview,edition:{...a.edition,continuation:boundedParagraphs(tail,300-wordCount(intro)),sourcePassages:[...a.preview,...boundedParagraphs(tail,300-wordCount(intro))]}};
 }
}
