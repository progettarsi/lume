/** Yield CPU work to input/rendering; a timer is a checkpoint, not a worker. */
export async function cooperate<T>(steps:Generator<void,T>,signal?:AbortSignal,budget=4):Promise<T>{
 const now=()=>typeof performance==='undefined'?Date.now():performance.now();
 for(;;){
  if(signal?.aborted)throw signal.reason??new Error('Operazione annullata');
  const until=now()+budget;let result:IteratorResult<void,T>;
  do{result=steps.next();if(result.done)return result.value}while(now()<until);
  await new Promise<void>(resolve=>setTimeout(resolve,0));
 }
}
