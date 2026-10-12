const {test}=require('node:test'),assert=require('node:assert/strict');
const {MD3_SHAPE_COUNT,computeMd3Path,evaluateMd3Loader,md3RotationDegrees,md3SpringResponse}=require('../.test-build/materialLoading');

function contour(path){
 const n=path.match(/-?\d+(?:\.\d+)?/g).map(Number),points=[];let x=n[0],y=n[1];
 for(let i=2;i<n.length;i+=6){
  const [ax,ay,bx,by,cx,cy]=n.slice(i,i+6);
  for(let k=0;k<16;k++){const t=k/16,u=1-t;points.push([u*u*u*x+3*u*u*t*ax+3*u*t*t*bx+t*t*t*cx,u*u*u*y+3*u*u*t*ay+3*u*t*t*by+t*t*t*cy])}
  x=cx;y=cy;
 }
 return points;
}
function contourDistance(a,b){
 let maximum=0;
 // Compare to the sampled polygon's segments, rather than nearest samples:
 // morph pairs subdivide the same contour differently.
 for(const p of a){let minimum=Infinity;for(let i=0;i<b.length;i++){
  const q=b[i],r=b[(i+1)%b.length],dx=r[0]-q[0],dy=r[1]-q[1],length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((p[0]-q[0])*dx+(p[1]-q[1])*dy)/length)):0;
  const x=p[0]-q[0]-t*dx,y=p[1]-q[1]-t*dy;minimum=Math.min(minimum,x*x+y*y);
 }maximum=Math.max(maximum,Math.sqrt(minimum))}
 return maximum;
}

test('all seven MD3 morph seams retain the same closed contour despite different curve subdivisions',()=>{
 assert.equal(MD3_SHAPE_COUNT,7);
 for(let base=0;base<MD3_SHAPE_COUNT;base++){
  const outgoing=computeMd3Path(base,1),incoming=computeMd3Path(base+1,0);assert(outgoing.endsWith(' Z')&&incoming.endsWith(' Z'));
  const a=contour(outgoing),b=contour(incoming),gap=Math.max(contourDistance(a,b),contourDistance(b,a));
  assert(gap<.2,'Shape '+base+' boundary contour differs by '+gap.toFixed(3)+'px in a 100px viewport');
 }
});

test('MD3 absolute stage counters preserve rotation through repeated seven-shape boundaries',()=>{
 for(const boundary of [7,14,21,70]){
  const left=evaluateMd3Loader(boundary-1e-5),at=evaluateMd3Loader(boundary),right=evaluateMd3Loader(boundary+1e-5);
  assert.equal(at.base,boundary);assert.equal(at.rotation,140*boundary);assert.equal(at.path,computeMd3Path(0,0));
  assert(Math.abs(left.rotation-at.rotation)<.5);assert(Math.abs(right.rotation-at.rotation)<.01);
  assert.equal(md3RotationDegrees(boundary-1,1,1),md3RotationDegrees(boundary,0,0));
 }
 const initial=evaluateMd3Loader(0);assert.equal(initial.rotation,0);assert.equal(md3SpringResponse(0),0);assert.equal(md3SpringResponse(1),1);
 for(let sequence=0;sequence<=14;sequence+=.1){const frame=evaluateMd3Loader(sequence);assert(Number.isFinite(frame.rotation)&&Number.isFinite(frame.spring));assert(!/NaN|Infinity/.test(frame.path));assert(frame.spring>=0&&frame.spring<1.11)}
});
