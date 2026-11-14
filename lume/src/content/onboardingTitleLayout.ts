export type TitleLine={text:string;x:number;y:number;width:number;height:number};

/** Paint a prefix inside the native layout of the complete title. A partly
 * typed word never participates in wrapping, and centered lines keep their x. */
export function revealedTitleLines(title:string,lines:readonly TitleLine[],count:number):TitleLine[]{
 let cursor=0;
 return lines.map(line=>{
  const text=line.text.replace(/[\r\n]+$/u,''),found=title.indexOf(text,cursor),start=found<0?cursor:found;
  const offset=Array.from(title.slice(0,start)).length;
  cursor=start+text.length;
  return {...line,text:Array.from(text).slice(0,Math.max(0,count-offset)).join('')};
 });
}
