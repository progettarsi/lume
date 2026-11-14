import type {Article} from './types';
const stop=new Set('della delle degli dello questa questo questi queste anche come sono dalla nella nelle stato stata prima dopo viene parte anni secolo sistema mondo storia forma tempo molto primo modo esempio attraverso durante origine fenomeno'.split(' '));
function subject(a:Article){return new Set(a.edition?.related.length?a.edition.related:(a.preview.join(' ').toLocaleLowerCase('it').match(/[\p{L}]{5,}/gu)||[]).filter(w=>!stop.has(w)))}
export function relatedDiscoveries(a:Article,b:Article){if(a.source===b.source)return false;if(a.edition?.related.length&&b.edition?.related.length){const aa=subject(a),bb=subject(b);return [...aa].filter(w=>bb.has(w)).length>=2}const title=(v:string)=>v.replace(/\s*\([^)]*\)/g,'').toLocaleLowerCase('it');const aa=title(a.provenance?.title||a.title),bb=title(b.provenance?.title||b.title);return aa.length>6&&b.preview.join(' ').toLocaleLowerCase('it').includes(aa)||bb.length>6&&a.preview.join(' ').toLocaleLowerCase('it').includes(bb)}
/** Runtime-only scheduling metadata travels with the feed window through trimming. */
export function connectDiscoveries(rows:Article[],previous:Article[]=[],enabled=true):Article[]{
 const pending=[...rows],out:Article[]=[];let order=(previous.at(-1)?.feedSequence?.order??previous.length-1)+1,last=previous.at(-1)?.feedSequence?.lastPathStart??-10;
 while(pending.length){if(enabled&&order-last===2&&out.length){const prior=out.at(-1)!;const different=pending.findIndex(b=>b.category!==prior.category&&!relatedDiscoveries(prior,b));if(different>0)pending.unshift(...pending.splice(different,1));}
  const a=pending.shift()!;let mate=-1;
  if(enabled&&order-last>=10&&order%5<3)mate=pending.findIndex((b,i)=>i<3-order%5&&relatedDiscoveries(a,b));
  if(mate>=0){last=order;out.push({...a,feedSequence:{order:order++,lastPathStart:last}});const b=pending.splice(mate,1)[0];out.push({...b,feedSequence:{order:order++,lastPathStart:last}})}
  else out.push({...a,feedSequence:{order:order++,lastPathStart:last}});
 }return out;
}
