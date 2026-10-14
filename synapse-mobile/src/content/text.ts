import type { Article } from './types';
import {validRevision} from './revision';
import {isVerified,boundedParagraphs,wordCount} from './edition';
/** Cached revisions from before the continuation-only contract must never replace the lead. */
export function hasRevision(article:Article):boolean {
  return validRevision(article);
}
export function readerContinuation(article:Article):string[]{
  if(article.edition){const rest=isVerified(article)?article.edition.continuation:hasRevision(article)?article.simplified!:article.edition.continuation;return boundedParagraphs(rest,Math.max(0,300-wordCount(article.preview.join(' '))))}
  if(article.contentIssue&&!article.complete)return [];
  const available=Math.max(0,1100-article.preview.join(' ').trim().split(/\s+/).filter(Boolean).length);
  return makePreview(hasRevision(article)?article.simplified!:continuation(article.paragraphs,article.preview),available,24,true);
}
export function readerParagraphs(article:Article):string[]{
  return [...article.preview,...readerContinuation(article)];
}
export function paragraphsFromExtract(text: string): string[] {
  const output:string[]=[];let skipLevel=0;
  for(const line of text.replace(/\r/g,'').split(/\n+/)){
    const heading=line.trim().match(/^(={2,})\s*(.*?)\s*\1$/);
    if(heading){const level=heading[1].length;if(skipLevel&&level<=skipLevel)skipLevel=0;
      if(/^(?:note|fonti|bibliografia|riferimenti|voci correlate|collegamenti esterni|altri progetti|discografia|filmografia|opere|pubblicazioni|palmarès|statistiche|tassonomia|classificazione|formula|dimostrazione)(?:\b|$)/i.test(heading[2]))skipLevel=level;
      continue;
    }
    if(/^(?:Note|Bibliografia|Voci correlate|Collegamenti esterni)\s*$/i.test(line.trim()))break;
    if(skipLevel)continue;
    const p=line.replace(/\[(?:\d+(?:[,–-]\d+)*|senza fonte|citation needed)\]/gi,'').replace(/[\u200b\ufeff]/g,'').replace(/[ \t]+/g,' ').trim();
    // Preserve short definitions and source order. Lists, formula fragments and headings are not prose.
    if(p.length<12)continue;
    if(/^[={|*#•]|^\}|\\(?:begin|displaystyle|frac)|https?:\/\/|\{\\/u.test(p))continue;
    // Losing the definition must not turn a list or later fragments into an apparent article.
    if(!/[.!?][”»"')\]]?\s*$/u.test(p)){if(!output.length)return [];continue}
    if(output.includes(p))continue;
    output.push(p);
  }
  // Bounded reading edition, ending only at sentence boundaries, never at an arbitrary character.
  return makePreview(output,1000,24,true);
}
export function generalAudienceScore(title: string, paragraphs: string[]): number {
  const text = paragraphs.slice(0,2).join(' ');
  // Short, complete definitions can be useful; characters alone do not establish sufficiency.
  if ((text.match(/[\p{L}\p{N}]+/gu)||[]).length < 24 || !/[.!?][”»"')\]]?\s*$/u.test(text) || /disambiguazione|può riferirsi a|lista di|elenco di|glossario/i.test(title+' '+text)) return -1;
  const lead=paragraphs[0]?.toLocaleLowerCase('it')||'',anchors=title.toLocaleLowerCase('it').match(/[\p{L}]{4,}/gu)||[];
  if(anchors.length&&!anchors.some(word=>lead.includes(word))&&/^[\p{L} '-]+,\s*oggi\b/u.test(lead))return -1;
  // Catalogue entries are valid encyclopedia pages but poor everyday discoveries.
  if(/semiasse maggiore|classificazione spettrale/i.test(text))return -1;
  const words=text.split(/\s+/), long=words.filter(w=>w.length>14).length / words.length;
  const symbols=(text.match(/[=∑∫{}<>\\]/g)||[]).length;
  if(/pornograf|violenza sessuale|tortura|suicidio|autolesionismo|necrofil|pedofil/i.test(title+' '+text))return -1;
  const jargon=(text.match(/\b(?:teorema|omomorfismo|isomorfismo|topologico|differenziale|polinomiale|enzimatico|nucleotid|allele|sottospecie)\w*/gi)||[]).length;
  const denseSentences=text.split(/[.!?]/).filter(s=>s.trim().split(/\s+/).length>65).length;
  return 1-long*4-symbols*.15-jargon*.09-denseSentences*.12;
}
export function makePreview(paragraphs: string[], maxWords=155,maxParagraphs=3,strict=false): string[] {
  const output:string[]=[];let remaining=maxWords;
  for(const p of paragraphs){
    if(remaining<=0||output.length>=maxParagraphs)break;
    const words=p.trim().split(/\s+/).length;
    if(words<=remaining){output.push(p);remaining-=words;continue}
    // Candidate ends must be followed by a sentence start, excluding common abbreviations/decimals.
    const ends=[...p.matchAll(/[.!?][”»"')\]]?(?=\s+[A-ZÀ-Ý0-9“«"]|$)/gu)].map(m=>m.index!+m[0].length).filter(end=>!/(?:\b(?:ecc|sec|prof|dott|sig|n|pag|art|a\.C|d\.C))\.$/i.test(p.slice(0,end)));
    const end=ends.filter(end=>p.slice(0,end).split(/\s+/).length<=remaining).at(-1);
    if(end)output.push(p.slice(0,end));
    else if(!output.length&&ends.length&&!strict)output.push(p.slice(0,ends[0]));
    break;
  }
  return output;
}
export function continuation(paragraphs:string[],preview:string[]):string[]{
  let prefix=preview.join(' ').replace(/…$/,'').replace(/\s+/g,' ').trim();
  return paragraphs.flatMap(raw=>{
    const p=raw.replace(/\s+/g,' ').trim();if(!prefix)return [p];
    if(prefix===p){prefix='';return []}
    if(prefix.startsWith(p+' ')){prefix=prefix.slice(p.length).trim();return []}
    if(p.startsWith(prefix)){const tail=p.slice(prefix.length).trim();prefix='';return tail?[tail]:[]}
    // Source revisions can differ; retain facts rather than deleting a mismatched paragraph.
    prefix='';return [p];
  });
}
export function rankLocal(query:string, articles:Article[]):Article[]{
  const words=query.toLocaleLowerCase('it').trim().split(/\s+/).filter(Boolean);
  return articles.map(article=>{const title=article.title.toLocaleLowerCase('it'),body=article.paragraphs.join(' ').toLocaleLowerCase('it');return {article,score:words.reduce((s,w)=>s+(title.includes(w)?5:body.includes(w)?1:0),0)}})
    .filter(row=>!words.length||row.score>0).sort((a,b)=>b.score-a.score).map(row=>row.article);
}
