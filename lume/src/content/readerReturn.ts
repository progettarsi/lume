// Return geometry belongs to the opening, not to a refreshed collection.
export function returnDisposition<T extends {id:string}>(snapshot:readonly T[],live:readonly T[],id:string):'attached'|'moved'|'removed'{
  const before=snapshot.findIndex(row=>row.id===id),after=live.findIndex(row=>row.id===id);
  if(after<0)return 'removed';
  if(before!==after||snapshot.slice(0,before).some((row,i)=>live[i]?.id!==row.id))return 'moved';
  return 'attached';
}
export function nearReturn(progress:number,scroll:number):boolean{
  'worklet';
  return progress<=.12&&scroll<=.5;
}
export function localReturnReorder<T extends {id:string}>(snapshot:readonly T[],live:readonly T[],id:string):boolean{
  const before=snapshot.filter(row=>row.id!==id),after=live.filter(row=>row.id!==id);
  return before.length===after.length&&before.every((row,i)=>row.id===after[i].id);
}
export function returnFinished(progress:number,scroll:number):boolean{
  'worklet';
  // A spring can remain a fraction above its endpoint after native rounding.
  // Release the covering surface once its residual geometry is imperceptible;
  // requiring exact zero can strand a closed reader above every other control.
  return progress<=.001&&scroll<=.5;
}
export function exitCut(height:number,scroll:number,viewport:number,start:number,exit:number,lineHeight:number):number{
  'worklet';
  const top=Math.min(height,Math.max(0,scroll-start));
  const bottom=Math.min(height,Math.max(top,scroll+viewport-start));
  // Until the preview is back, retain three visible lines. As scroll approaches
  // zero this reserve shrinks continuously, not as a timed second disappearance.
  const reserve=Math.min(bottom-top,Math.max(0,scroll),lineHeight*3);
  return top+reserve+(bottom-top-reserve)*(1-Math.max(0,Math.min(1,exit)));
}
