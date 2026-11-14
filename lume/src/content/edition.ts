import type {Article} from './types';
export const wordCount=(s:string)=>(s.trim().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu)||[]).length;
export function sentences(text:string):string[]{
 return text.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý«“])/u).map(s=>s.trim()).filter(Boolean);
}
export function boundedParagraphs(rows:string[],budget:number):string[]{
 const out:string[]=[];let used=0;
 for(const p of rows){const parts:string[]=[];for(const s of sentences(p)){if(!completeSentence(s))return parts.length?[...out,parts.join(' ')]:out;const n=wordCount(s);if(used+n>budget)return parts.length?[...out,parts.join(' ')]:out;parts.push(s);used+=n}if(parts.length)out.push(parts.join(' '))}return out;
}
export const completeSentence=(s:string)=>/^[A-ZÀ-Ý0-9«“"'(]/u.test(s.trim())&&wordCount(s)>=3&&/[.!?][”»"')\]]?\s*$/u.test(s)&&!/(?:\.{3}|…)\s*$/.test(s);
const dependent=/^(?:quest[oaie]|ess[oaie]|ciò|tuttavia|inoltre|infatti|pertanto|per questo|di conseguenza|in seguito|anche|egli|ella|lui|lei|secondo quest|il primo|il secondo)\b/i;
/** Conservative extractive edition: never manufacture a link between unrelated paragraphs. */
export function makeEdition(a:Article,strict=false):Article|undefined{
 if(a.verification||a.edition)return a;
 const clean=a.paragraphs.filter(p=>completeSentence(p)&&!/[=∑∫{}<>\\]/.test(p));
 const title=a.title.replace(/\s*\([^)]*\)/g,'').toLocaleLowerCase('it');
 const independent=(p:string)=>!dependent.test(p)&&/^[A-ZÀ-Ý«“]/u.test(p);
 const options=clean.map((p,index)=>({p,index})).filter(({p,index})=>independent(p)&&(index===0||sentences(p)[0].toLocaleLowerCase('it').includes(title)));
 // Prefer a concrete, self-contained story. Otherwise keep the source introduction together.
 options.sort((a,b)=>Number(/invent|scopr|nacque|origine|costruit|tradizion/i.test(b.p))-Number(/invent|scopr|nacque|origine|costruit|tradizion/i.test(a.p))||a.index-b.index);
 for(const {p} of options){const index=a.paragraphs.indexOf(p),passages=a.paragraphs.slice(index);
  for(const budget of strict?[80]:[80,120]){const brief=boundedParagraphs(passages,budget),text=brief.join(' '),words=wordCount(text);
   if(words<(strict?40:24)||!completeSentence(text))continue;
   // Reconstruct the tail from the original paragraph boundaries, never from arbitrary offsets.
   let remaining=brief.join(' ').replace(/\s+/g,' ').trim();const tail:string[]=[];
   for(const part of passages){const normalized=part.replace(/\s+/g,' ').trim();if(!remaining){tail.push(part);continue}if(remaining===normalized){remaining='';continue}if(remaining.startsWith(normalized+' ')){remaining=remaining.slice(normalized.length+1);continue}if(normalized.startsWith(remaining)){const rest=normalized.slice(remaining.length).trim();if(rest)tail.push(rest);remaining='';continue}break}
   return {...a,preview:brief,edition:{version:1,continuation:boundedParagraphs(tail,300-words),sourcePassages:[...brief,...boundedParagraphs(tail,300-words)],related:[]}};
  }
 }return undefined;
}

/** Exact content identity, not a security certificate. Stored with an allowlisted bundled edition. */
export function editionFingerprint(a:Article){return JSON.stringify([a.source,a.revision,a.title,a.preview,a.edition?.continuation,a.provenance,a.edition?.sourcePassages])}
export function isVerified(a:Article){return a.verification?.version===1&&!!a.edition&&a.verification.fingerprint===editionFingerprint(a)}
export function sourceInfo(a:Article){return a.provenance??{provider:'wikipedia' as const,title:a.title,url:a.source,revision:a.revision,license:'https://creativecommons.org/licenses/by-sa/4.0/',attribution:'Wikipedia e suoi contributori'}}
export function sourceName(a:Article){return sourceInfo(a).provider==='wikivoyage'?'Wikivoyage':'Wikipedia'}
