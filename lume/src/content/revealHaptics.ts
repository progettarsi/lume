/** Only moving, visible paint in the first opening sweep may produce soft ticks. */
export function revealHapticStep(previous:number,next:number,height:number,visibleEnd:number,eligible:boolean){
 'worklet';
 return eligible&&previous>=0&&next>previous&&next<height&&previous<Math.min(height,visibleEnd)&&visibleEnd>0;
}
