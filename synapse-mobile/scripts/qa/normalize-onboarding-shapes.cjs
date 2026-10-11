// Offline normalization of the supplied, closed M/C Figma outlines. The originals
// are unchanged. Equal angular samples and winding make interpolation compatible.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),names=['button-identity','button-interests','cookie-preparation'];
function outline(name){
 const svg=fs.readFileSync(path.join(root,'assets/onboarding',name+'-1.svg'),'utf8'),box=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number),d=svg.match(/id="shape" d="([^"]+)"/)[1];
 const tokens=d.match(/[MCZ]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/ig);let i=0,last,polygon=[];
 while(i<tokens.length){const cmd=tokens[i++];if(cmd==='M'){last=[+tokens[i++],+tokens[i++]];polygon.push(last)}else if(cmd==='C'){
  const a=[+tokens[i++],+tokens[i++]],b=[+tokens[i++],+tokens[i++]],end=[+tokens[i++],+tokens[i++]];
  for(let j=1;j<=40;j++){const t=j/40,u=1-t;polygon.push([u*u*u*last[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t*t*t*end[0],u*u*u*last[1]+3*u*u*t*a[1]+3*u*t*t*b[1]+t*t*t*end[1]])}last=end;
 }else if(cmd!=='Z')throw Error('Unsupported outline '+cmd)}
 const cx=box[2]/2,cy=box[3]/2,scale=100/Math.max(box[2],box[3]),points=[];
 for(let n=0;n<64;n++){const angle=-Math.PI/2+n*Math.PI*2/64,dx=Math.cos(angle),dy=Math.sin(angle);let radius=Infinity;
  for(let j=0;j<polygon.length-1;j++){const a=polygon[j],b=polygon[j+1],sx=b[0]-a[0],sy=b[1]-a[1],den=dx*sy-dy*sx;if(Math.abs(den)<1e-9)continue;const ax=a[0]-cx,ay=a[1]-cy,r=(ax*sy-ay*sx)/den,t=(ax*dy-ay*dx)/den;if(r>0&&t>=0&&t<=1)radius=Math.min(radius,r)}
  if(!Number.isFinite(radius))throw Error('Outline not radial at '+n);points.push(+((50+dx*radius*scale).toFixed(4)),+((50+dy*radius*scale).toFixed(4)));
 }return points;
}
const shapes=Object.fromEntries(names.map(n=>[n,outline(n)]));
fs.writeFileSync(path.join(root,'src/content/onboardingShapes.ts'),'// Generated from unchanged local SVG outlines by scripts/qa/normalize-onboarding-shapes.cjs.\nexport const ORGANIC_POINTS='+JSON.stringify(shapes)+' as const;\n');
