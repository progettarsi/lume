import type {Article} from './types';
import {generalAudienceScore,makePreview} from './text';

// First reversible editorial calibration. No learning weights, user scores or network calls.
export const EDITORIAL_TUNING={enabled:true,preferredScore:1.35,broadPenalty:.7,topicPenalty:1.2,fallbackPerChunk:1};
export type EditorialAssessment={eligible:boolean;preferred:boolean;score:number;reasons:string[]};
export function assessEditorial(a:Article):EditorialAssessment{
 const preview=a.preview.length?a.preview:makePreview(a.paragraphs),text=preview.join(' '),words=text.match(/[\p{L}\p{N}'’]+/gu)||[];
 const reasons:string[]=[];
 if(generalAudienceScore(a.title,a.paragraphs)<.45)return {eligible:false,preferred:false,score:-1,reasons:['Testo insufficiente, poco divulgativo o escluso dal filtro di base']};
 if(!EDITORIAL_TUNING.enabled)return {eligible:true,preferred:true,score:1,reasons:['Filtro divulgativo precedente; taratura editoriale disattivata']};
 const sentences=text.split(/[.!?]+(?:\s|$)/u).filter(s=>s.trim());
 if(words.length<24||!/[.!?][”»"')\]]?\s*$/u.test(text))return {eligible:false,preferred:false,score:-1,reasons:['Anteprima senza contesto sufficiente o frase conclusa']};
 const definition=(preview[0]||'').slice(0,450).toLocaleLowerCase('it');
 const discipline=/(?:^|[\s)])è\s+(?:[\p{L}'’]+\s+){0,3}(?:disciplina|scienz[ae]|branca|ramo|campo di studi)\b/u.test(definition);
 const study=/\b(?:studia|studio|si occupa|comprende|insieme|conoscenz|tutti|tutte)\w*/u.test(definition);
 const wide=/\b(?:in senso (?:ampio|generale)|insieme (?:delle|di tutte|di attività)|vasta gamma|ogni forma|numerosi (?:campi|settori)|complesso (?:delle|di))\b/u.test(definition);
 const bounded=/\b(?:fenomeno|oggetto|episodio|evento|tecnica|dispositivo|metodo|materiale|manufatto|esperimento|paradosso|reazione|effetto|meccanismo|processo|mammifero|uccello|pesce|pianta|lago|isola|fiume|edificio|ponte|allegoria|viaggio|minerale|formazione corallina|movimento (?:artistico|pittorico))\b/u.test(definition);
 const abstractStudy=/(?:^|[\s)])è (?:lo studio|l['’]insieme)\b/u.test(definition)&&/\b(?:conoscenze|tecniche|procedimenti|attività)\b/u.test(definition);
 // A discipline plus an abstract study/scope is a composite signal. A title alone never excludes a card.
 if((discipline&&study)||abstractStudy)return {eligible:false,preferred:false,score:0,reasons:['Definizione di disciplina/campo di studio con portata generale: tema ombrello']};
 const mechanism=/\b(?:perché|per questo|permette|consente|produce|provoca|dipende|grazie a|a causa|causato|si forma|si verifica|avviene|reazione|emissione|cambia|cambiare|variazione|trasforma|diffond|assorb|emett|sostitui|utilizzat|usato|serve a|funziona)\w*/iu.test(text);
 const example=/\b(?:ad esempio|per esempio|come (?:nel|nelle|nella)|in particolare|si trova|si trovano|situat|costruit|inventat|scopert|introduce)\w*/iu.test(text);
 const concrete=/\b\d+(?:[.,]\d+)?\s*(?:%|metri|chilometri|anni|giorni|ore|gradi|cm|km)|\b(?:1[0-9]{3}|20[0-9]{2})\b|\bsecolo\b/iu.test(text);
 const longRatio=words.filter(w=>w.length>14).length/words.length;
 const dense=sentences.some(s=>(s.match(/[\p{L}\p{N}]+/gu)||[]).length>48);
 const codes=(text.match(/\b[A-Z]{3,}\b/g)||[]).length;
 const opaque=longRatio>.08||codes>4;
 let score=1+(bounded?.55:0)+(mechanism?.45:0)+(example?.25:0)+(concrete?.15:0)-(wide?EDITORIAL_TUNING.broadPenalty:0)-(dense?.25:0)-(opaque?.35:0);
 score=Math.round(score*100)/100;
 if(bounded)reasons.push('Fenomeno, oggetto, episodio o meccanismo circoscritto nella definizione');
 if(mechanism)reasons.push('La descrizione contiene una relazione, un cambiamento o un impiego concreto');
 if(example||concrete)reasons.push('Contesto concreto: esempio, luogo, data o quantità');
 if(wide)reasons.push('Portata generale: precedenza a voci più circoscritte');
 if(dense||opaque)reasons.push('Anteprima densa o con termini/codici da chiarire');
 const preferred=score>=EDITORIAL_TUNING.preferredScore&&(bounded||mechanism||example)&&!opaque;
 if(!preferred)reasons.push('Testo leggibile, ma evidenza editoriale debole: riserva di scoperta se mancano alternative');
 if(!reasons.length)reasons.push('Anteprima leggibile; nessun segnale forte di specificità');
 return {eligible:true,preferred,score,reasons};
}

const stop=new Set('della delle degli nella nelle dello dalla dello questo questa questi queste essere stato stata sono anche parte viene viene come quale quali stato stati anni prima dopo fenomeno effetto processo fisico fisica chiamato detto termine indica attraverso mediante infatti origine'.split(' '));
function topic(a:Article){return new Set((a.title+' '+(a.preview[0]||a.paragraphs[0]||'').split(/[.!?]/)[0]).toLocaleLowerCase('it').match(/[\p{L}]{5,}/gu)?.filter(w=>!stop.has(w))||[])}
function overlap(a:Set<string>,b:Set<string>){let common=0;for(const t of a)if(b.has(t))common++;return common<2?0:common/Math.max(3,Math.min(a.size,b.size))}
export function editorialRepetition(a:Article,recent:Article[]){if(!EDITORIAL_TUNING.enabled)return 0;const terms=topic(a);return Math.max(0,...recent.slice(-3).map(old=>overlap(terms,topic(old))))*EDITORIAL_TUNING.topicPenalty}
// Scope this cache to a single ranking: no persistent assumptions about mutable
// caller objects or tuning. Tokenisation happens once, not in every greedy pair.
export function repetitionScorer(){
 const terms=new Map<Article,Set<string>>();
 const get=(a:Article)=>{let value=terms.get(a);if(!value){value=topic(a);terms.set(a,value)}return value};
 return (a:Article,recent:Article[])=>!EDITORIAL_TUNING.enabled?0:Math.max(0,...recent.slice(-3).map(old=>overlap(get(a),get(old))))*EDITORIAL_TUNING.topicPenalty;
}
// Orders only unpublished candidates. The current feed and reader edition stay fixed.
export function orderEditorial(rows:Article[],recent:Article[]=[],limit=rows.length):Article[]{
 if(!EDITORIAL_TUNING.enabled)return rows.slice(0,limit);
 const pending=rows.map((article,i)=>({article,assessment:assessEditorial(article),tokens:topic(article),base:.15*(1-i/Math.max(1,rows.length))}));
 const history=recent.slice(-3).map(article=>({article,tokens:topic(article)})),output:Article[]=[];
 while(pending.length&&output.length<limit){let best=0,value=-Infinity;
  for(let i=0;i<pending.length;i++){const item=pending[i],last=history.at(-1),two=history.at(-2);
   const repetition=Math.max(0,...history.map(old=>overlap(item.tokens,old.tokens)))*EDITORIAL_TUNING.topicPenalty;
   const category=last?.article.category===item.article.category?(two?.article.category===item.article.category?.8:.15):0;
   const score=item.assessment.score+item.base-repetition-category;if(score>value){value=score;best=i}
  }
  const item=pending.splice(best,1)[0];output.push(item.article);history.push(item);if(history.length>3)history.shift();
 }
 return output;
}
export function discoveryCandidates(rows:Article[],limit=rows.length,recent:Article[]=[]):Article[]{
 if(!EDITORIAL_TUNING.enabled)return rows.slice(0,limit);
 const assessed=rows.map(article=>({article,assessment:assessEditorial(article)}));
 const preferred=assessed.filter(x=>x.assessment.eligible&&x.assessment.preferred).map(x=>x.article);
 // Never wait for another network round if the current response has a usable card.
 const fallback=assessed.filter(x=>x.assessment.eligible&&!x.assessment.preferred).map(x=>x.article);
 const chosen=orderEditorial(preferred,recent,limit);
 if(chosen.length<limit)chosen.push(...orderEditorial(fallback,[...recent,...chosen],Math.min(limit-chosen.length,EDITORIAL_TUNING.fallbackPerChunk)));
 return chosen;
}
