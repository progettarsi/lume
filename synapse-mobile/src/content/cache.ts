import type { Article } from './types';
// Saved articles are user-owned; these budgets apply to the ordinary cache.
export const CACHE_COUNT=80,CACHE_BYTES=6*1024*1024;
export function articleBytes(article:Article):number{return [...JSON.stringify(article)].reduce((n,c)=>{const code=c.codePointAt(0)!;return n+(code<=0x7f?1:code<=0x7ff?2:code<=0xffff?3:4)},0)}
export function evictable(articles:Article[],protect:Set<string>,maxCount=CACHE_COUNT,maxBytes=CACHE_BYTES):string[]{
  const ordinary=articles.filter(a=>!a.saved).sort((a,b)=>a.fetchedAt-b.fetchedAt);
  const bytes=articleBytes;
  let count=ordinary.length,size=ordinary.reduce((s,a)=>s+bytes(a),0);
  const remove:string[]=[];
  for(const article of ordinary){if(count<=maxCount&&size<=maxBytes)break;if(protect.has(article.id))continue;remove.push(article.id);count--;size-=bytes(article)}
  return remove;
}
