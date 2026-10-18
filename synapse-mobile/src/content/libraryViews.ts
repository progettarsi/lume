import {isVerified} from './edition';
import type {Article} from './types';
import {seenArticle,type Learning} from './recommendations';
import {reserveArticles,RESERVE_LOW} from './reserve';

/** Derived views of immutable library snapshots. UI state (keyboard, toast,
 * navigation, request indicator) cannot invalidate ranking or reader editions.
 * Consumed IDs have a separate synchronous revision: never wait for disk writes.
 * At most one current snapshot and 24 category views are retained. */
export class LibraryViews{
 private cache?:Article[];private learning?:Learning;private consumed=-1;
 private reserves=new Map<string,Article[]>();
 private feeds=new Map<string,{rows:Article[];cache:Article[];ai:boolean;view:Article[];items:Map<string,{source:Article;completed?:Article;view:Article}>}>();
 private indexed?:Article[];private byId=new Map<string,Article>();
 constructor(private rank:typeof reserveArticles=reserveArticles){}
 reserve(cache:Article[],learning:Learning,served:Set<string>,revision:number,category='all'){
  const sameScores=this.learning&&(['categories','topics','bookmarks','opens','recent','sequence','initialInterests','version','categoryVersion'] as const).every(key=>this.learning![key]===learning[key]);
  if(!sameScores)this.reserves.clear();
  else if(cache!==this.cache){for(const key of this.reserves.keys()){
   if(key==='all'){this.reserves.delete(key);continue}
   const before=this.cache!.filter(a=>a.category===key),after=cache.filter(a=>a.category===key);
   if(before.length!==after.length||before.some((a,i)=>a!==after[i]))this.reserves.delete(key);
  }}
  if(sameScores&&(learning!==this.learning||revision!==this.consumed)){for(const [key,rows] of this.reserves){const remaining=rows.filter(a=>!served.has(a.id)&&!seenArticle(a,learning));if(remaining.length<RESERVE_LOW)this.reserves.delete(key);else this.reserves.set(key,remaining)}}
  this.cache=cache;this.learning=learning;this.consumed=revision;
  let rows=this.reserves.get(category);
  if(!rows){rows=this.rank(category==='all'?cache:cache.filter(a=>a.category===category),learning,served);if(this.reserves.size>=24)this.reserves.clear();this.reserves.set(category,rows)}
  return rows;
 }
 feed(category:string,rows:Article[],cache:Article[],ai:boolean){
  const previous=this.feeds.get(category);
  if(previous?.rows===rows&&previous.cache===cache&&previous.ai===ai)return previous.view;
  if(this.indexed!==cache){this.indexed=cache;this.byId=new Map(cache.map(a=>[a.id,a]))}
  const items=new Map<string,{source:Article;completed?:Article;view:Article}>();
  const view=rows.map(article=>{
   const completed=this.byId.get(article.id);
   const old=previous?.items.get(article.id);
   if(previous?.ai===ai&&old?.source===article&&old.completed===completed){items.set(article.id,old);return old.view}
   const updated=isVerified(article)?article:completed?.complete&&!article.edition?{...article,textVersion:completed.textVersion,revision:completed.revision,paragraphs:completed.paragraphs,complete:true,contentIssue:undefined,contentIssueKind:undefined,simplified:completed.simplified,simplifiedVersion:completed.simplifiedVersion,simplifiedPreview:completed.simplifiedPreview,simplifiedInput:completed.simplifiedInput,simplifiedPrepared:completed.simplifiedPrepared}:article;
   const result=ai||!updated.simplified?updated:{...updated,simplified:undefined};
   items.set(article.id,{source:article,completed,view:result});return result;
  });
  if(this.feeds.size>=24)this.feeds.clear();this.feeds.set(category,{rows,cache,ai,view,items});return view;
 }
}
