const {test}=require('node:test'),assert=require('node:assert/strict');
const {tutorialDockCells}=require('../.test-build/tutorialFeed');
test('three-step and legacy four-step dock tracks fill their capsule without clipping or overshoot',()=>{
 for(const count of [3,4]){
 const inner=242,wide=110;let previous=-1;
 for(let p=0;p<=count-1;p+=.01){const c=tutorialDockCells(p,inner,wide,count),low=Math.floor(p),high=Math.min(count-1,low+1),f=p-low,left=(c[low].left+c[low].width/2)*(1-f)+(c[high].left+c[high].width/2)*f-wide/2;
  assert(Math.abs(c.reduce((sum,cell)=>sum+cell.width,0)-inner)<.00001);assert(c.every(cell=>cell.width>=44-.00001));assert(left>=previous-.00001);assert(left>=-.00001);assert(left+wide<=inner+.00001);previous=left;
 }
 }
});
