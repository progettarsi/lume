import type { Article } from './types';
// Saved articles are user-owned; these budgets apply to the ordinary cache.
export const CACHE_COUNT=80,CACHE_BYTES=6*1024*1024;
const sizes=new WeakMap<Article,number>();
/** Library article snapshots are immutable; weak keys cannot retain evicted text. */
export function articleBytes(article:Article):number{const known=sizes.get(article);if(known!==undefined)return known;const json=JSON.stringify(article);let size=0;for(let i=0;i<json.length;i++){const code=json.charCodeAt(i);if(code<=0x7f)size++;else if(code<=0x7ff)size+=2;else if(code>=0xd800&&code<=0xdbff&&json.charCodeAt(i+1)>=0xdc00&&json.charCodeAt(i+1)<=0xdfff){size+=4;i++}else size+=3}sizes.set(article,size);return size}
export function evictable(articles:Article[],protect:Set<string>,maxCount=CACHE_COUNT,maxBytes=CACHE_BYTES):string[]{
  const ordinary=articles.filter(a=>!a.saved).sort((a,b)=>a.fetchedAt-b.fetchedAt);
  const bytes=articleBytes;
  let count=ordinary.length,size=ordinary.reduce((s,a)=>s+bytes(a),0);
  const remove:string[]=[];
  for(const article of ordinary){if(count<=maxCount&&size<=maxBytes)break;if(protect.has(article.id))continue;remove.push(article.id);count--;size-=bytes(article)}
  return remove;
}
