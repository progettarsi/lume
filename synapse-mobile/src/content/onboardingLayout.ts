export function scrollEdgeOpacity(hidden:number,length:number){
 'worklet';
 return Math.max(0,Math.min(1,hidden/length));
}
