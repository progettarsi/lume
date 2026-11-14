/** A gesture chooses only the neighbour of its starting page, regardless of inertia. */
export function swipeTarget(start:number,translation:number,velocity:number,height:number,count:number){
  'worklet';
  const distance=Math.abs(translation)>height*.16;
  const flick=Math.abs(velocity)>450&&Math.abs(translation)>10;
  const direction=flick?Math.sign(-velocity):distance?Math.sign(-translation):0;
  return Math.max(0,Math.min(Math.max(0,count-1),start+direction));
}

/** Keep a short backwards window instead of retaining every consumed introduction. */
export function feedTrimCount(position:number){return position>=24?position-8:0}
