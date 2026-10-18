import {DOMParser} from '@xmldom/xmldom';
import {paragraphsFromExtract} from './text';
import {cooperate} from './cooperative';

const entities=new Map<string,string>();
const decoder=new DOMParser({errorHandler:{warning:()=>{},error:()=>{},fatalError:()=>{}}});
function decode(text:string){return text.replace(/&(?:#[xX][\da-fA-F]+|#\d+|[a-zA-Z][\da-zA-Z]+);/g,entity=>{
 let value=entities.get(entity);if(value!==undefined)return value;
 value=decoder.parseFromString('<p>'+entity+'</p>','text/html').documentElement.textContent||'';
 if(entities.size>=256)entities.clear();entities.set(entity,value);return value;
})}
const excludedTags=/^(?:table|figure|figcaption|ul|ol|dl|sup|script|style|math|nav|aside)$/;
const excludedClasses=/(?:^|\s)(?:infobox|sinottico|navbox|vertical-navbox|hatnote|dablink|ambox|tmbox|metadata|noprint|mw-editsection|mw-empty-elt|mw-ref|reference|reflist|thumb|toc|gallery|mwe-math-element)(?:\s|$)/;
const voidTags=/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
function* htmlTokens(html:string):Generator<string|undefined,void>{
 let i=0;
 while(i<html.length){
  if(html[i]!=='<'){const end=html.indexOf('<',i),limit=end<0?html.length:end;while(i<limit){const next=Math.min(limit,i+4096);yield html.slice(i,next);i=next}continue}
  if(html.startsWith('<!--',i)){const end=html.indexOf('-->',i+4);i=end<0?html.length:end+3;yield undefined;continue}
  if(!/^<\/?[a-zA-Z!]/.test(html.slice(i,i+4))){yield '<';i++;continue}
  const start=i++;let quote='';
  while(i<html.length){const c=html[i++];if(quote){if(c===quote)quote=''}else if(c==='"'||c==="'")quote=c;else if(c==='>')break;if((i-start)%4096===0)yield undefined}
  yield html.slice(start,i);
 }
}
/** Streaming semantic selection: no document-sized DOM, including ignored tables.
 * Sync and cancellable async entrypoints share exactly the same state machine. */
function* extract(html:string,sections?:RegExp,onParagraph?:(text:string,section:string)=>void):Generator<void,string[]>{
 const stack:{tag:string;ignored:boolean}[]=[],lines:string[]=[];
 let section='',capture:{tag:string;depth:number;text:string[];bad:boolean}|undefined,done=false;
 const finish=()=>{
  if(!capture)return;
  const current=capture;capture=undefined;
  const text=decode(current.text.join('')).replace(/\s+/g,' ').trim();
  if(/^h[2-6]$/.test(current.tag)){section=text;const marks='='.repeat(Number(current.tag[1]));lines.push(`${marks} ${text} ${marks}`);return}
  if(current.bad||sections&&!sections.test(section))return;
  onParagraph?.(text,section||'Introduzione');lines.push(text);
  if(!sections&&!onParagraph){const output=paragraphsFromExtract(lines.join('\n\n')),last=output.at(-1);
   if(output.length>=24||output.join(' ').split(/\s+/).length>=1000||last&&text.startsWith(last)&&text!==last)done=true;
  }
 };
 for(const token of htmlTokens(html)){
  if(done)break;
  if(token===undefined){yield;continue}
  const name=token.match(/^<\/?([a-zA-Z][\w:-]*)/)?.[1]?.toLowerCase();
  if(!name){if(capture&&!stack.at(-1)?.ignored&&stack.length<=200&&!token.startsWith('<!')){
    for(let i=0;i<token.length;i+=4096){capture.text.push(token.slice(i,i+4096));yield}
   }yield;continue}
  if(token.startsWith('</')){
   let i=stack.length-1;while(i>=0&&stack[i].tag!==name)i--;
   if(i>=0){if(capture&&i<=capture.depth)finish();stack.length=i}
   yield;continue;
  }
  const parentIgnored=stack.at(-1)?.ignored??false;
  const cls=token.match(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i),classes=cls?.[1]??cls?.[2]??cls?.[3]??'';
  if(capture&&(name==='math'||name==='img'||/(?:^|\s)mwe-math-element(?:\s|$)/.test(classes)))capture.bad=true;
  if(!parentIgnored&&(name==='p'||/^h[2-6]$/.test(name))){if(capture)finish();capture={tag:name,depth:stack.length,text:[],bad:false}}
  if(capture&&name==='br'&&!parentIgnored)capture.text.push(' ');
  const ignored=parentIgnored||excludedTags.test(name)||excludedClasses.test(classes)||stack.length>=200;
  if(!voidTags.test(name)&&!token.endsWith('/>'))stack.push({tag:name,ignored});
  yield;
 }
 if(capture&&!done)finish();
 return paragraphsFromExtract(lines.join('\n\n'));
}
export function paragraphsFromHtml(html:string,sections?:RegExp,onParagraph?:(text:string,section:string)=>void):string[]{
 const steps=extract(html,sections,onParagraph);for(;;){const next=steps.next();if(next.done)return next.value}
}
export function paragraphsFromHtmlAsync(html:string,signal?:AbortSignal,sections?:RegExp,onParagraph?:(text:string,section:string)=>void){return cooperate(extract(html,sections,onParagraph),signal)}
