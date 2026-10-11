/** Worklets share these decisions with the isolated contract tests. */
export function tutorialTarget(anchor:0|1,translation:number,height:number){
 'worklet';
 const direction=translation<-height*.22?1:translation>height*.22?-1:0;
 return Math.max(0,Math.min(1,anchor+direction)) as 0|1;
}
export function organicPath(from:readonly number[],to:readonly number[],progress:number){
 'worklet';
 const count=from.length/2,p=Math.max(0,Math.min(1,progress));
 const x=(i:number)=>{const n=((i+count)%count)*2;return from[n]+(to[n]-from[n])*p};
 const y=(i:number)=>{const n=((i+count)%count)*2+1;return from[n]+(to[n]-from[n])*p};
 // Closed Catmull-Rom cubics, same topology and seam at every keyframe.
 let d=`M${x(0).toFixed(2)} ${y(0).toFixed(2)}`;
 for(let i=0;i<count;i++)d+=`C${(x(i)+(x(i+1)-x(i-1))/6).toFixed(2)} ${(y(i)+(y(i+1)-y(i-1))/6).toFixed(2)} ${(x(i+1)-(x(i+2)-x(i))/6).toFixed(2)} ${(y(i+1)-(y(i+2)-y(i))/6).toFixed(2)} ${x(i+1).toFixed(2)} ${y(i+1).toFixed(2)}`;
 return d+'Z';
}
