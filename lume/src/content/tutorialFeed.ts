export function tutorialDockCells(position:number,inner:number,wide:number,count=4){
 'worklet';
 const p=Math.max(0,Math.min(count-1,position)),small=(inner-wide)/(count-1);
 let left=0;
 return Array.from({length:count},(_,i)=>{
  const weight=Math.max(0,1-Math.abs(p-i)),width=small+(wide-small)*weight,cell={left,width,weight};
  left+=width;return cell;
 });
}
