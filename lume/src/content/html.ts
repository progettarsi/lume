import {DOMParser} from '@xmldom/xmldom';
import {paragraphsFromExtract} from './text';
/** Read semantic paragraphs, never flatten sidebars/tables/captions into article prose. */
export function paragraphsFromHtml(html:string,sections?:RegExp,onParagraph?:(text:string,section:string)=>void):string[]{
  const parser=new DOMParser({errorHandler:{warning:()=>{},error:()=>{},fatalError:()=>{}}});
  const document=parser.parseFromString('<div>'+html+'</div>','text/html'),lines:string[]=[];let section='';
  const ignored=(node:Element)=>/^(?:table|figure|figcaption|ul|ol|dl|sup|script|style|math|nav|aside)$/i.test(node.tagName)||/(?:^|\s)(?:infobox|sinottico|navbox|vertical-navbox|hatnote|dablink|ambox|tmbox|metadata|noprint|mw-editsection|mw-empty-elt|mw-ref|reference|reflist|thumb|toc|gallery|mwe-math-element)(?:\s|$)/i.test(node.getAttribute('class')||'');
  const hasMath=(el:Element)=>{const all=el.getElementsByTagName('*');for(let i=0;i<all.length;i++)if(/(?:^|\s)mwe-math-element(?:\s|$)/.test(all[i].getAttribute('class')||''))return true;return false};
  const text=(node:Node,depth=0):string=>{
    if(depth>200)return '';
    if(node.nodeType===3)return node.nodeValue||'';
    if(node.nodeType!==1)return '';
    const el=node as Element;if(ignored(el))return '';
    if(el.tagName.toLowerCase()==='br')return ' ';
    let result='';for(let child=node.firstChild;child;child=child.nextSibling)result+=text(child,depth+1);return result;
  };
  const walk=(node:Node,depth=0)=>{
    if(depth>200)return;
    if(node.nodeType===1){const el=node as Element;if(ignored(el))return;
      const tag=el.tagName.toLowerCase();
      if(/^h[2-6]$/.test(tag)){section=text(el).trim();const marks='='.repeat(Number(tag[1]));lines.push(`${marks} ${text(el).trim()} ${marks}`);return}
      if(tag==='p'){
        if(sections&&!sections.test(section))return;
        // A missing formula can destroy the meaning of a paragraph: omit the paragraph as a unit.
        if(el.getElementsByTagName('math').length||el.getElementsByTagName('img').length||hasMath(el))return;
        const paragraph=text(el).replace(/\s+/g,' ').trim();onParagraph?.(paragraph,section||'Introduzione');lines.push(paragraph);return;
      }
    }
    for(let child=node.firstChild;child;child=child.nextSibling)walk(child,depth+1);
  };
  walk(document);return paragraphsFromExtract(lines.join('\n\n'));
}
