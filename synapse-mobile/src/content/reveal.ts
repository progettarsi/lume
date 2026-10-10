/** A frontier in laid-out continuation coordinates, never a substring length. */
export function revealFrontier(previous:number,sweep:number,height:number,scrollBottom:number,start:number,viewport:number,lineHeight:number,scrolled:boolean,reduced:boolean):number {
  'worklet';
  const ahead=Math.max(lineHeight*3,viewport*.5);
  const reached=scrolled?Math.max(0,scrollBottom+ahead-start):0;
  return Math.max(previous,reduced?height:Math.max(sweep,Math.min(height,reached)));
}
/** Reflow can move previously read lines by an unknown amount. Reveal all
 * available text rather than approximate a mapping that might hide them. */
export function reflowFrontier(previous:number,oldHeight:number,newHeight:number):number {
  'worklet';
  return oldHeight>0&&oldHeight!==newHeight&&previous>0?Math.max(previous,newHeight):previous;
}
