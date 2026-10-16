export type HapticCue='confirm'|'remove'|'threshold'|'tap'|'selection'|'on'|'off'|'refresh'|'reveal';

/** No timers or queued pulses: stale, superseded and rapid actions stay quiet. */
export class HapticFeedback {
 private enabled=false;private generation=0;private last=-Infinity;private lastPulse=-Infinity;
 private pending=new Map<string,object>();
 constructor(private play:(cue:HapticCue)=>Promise<void>,private active:()=>boolean,private now=()=>Date.now()){}
 configure(enabled:boolean){if(enabled!==this.enabled){this.enabled=enabled;this.generation++;this.pending.clear()}}
 emit(cue:HapticCue){
  const time=this.now();if(!this.enabled||!this.active())return;
  if(cue==='reveal'){
   if(time-this.lastPulse<70||time-this.last<120)return;
   this.lastPulse=time;
  }else{
   const interval=cue==='confirm'||cue==='remove'||cue==='threshold'?250:120;
   if(time-this.last<interval)return;
   this.last=time;this.lastPulse=time;
  }
  try{void this.play(cue).catch(()=>{})}catch{}
 }
 begin(key:string){
  const ticket={},generation=this.generation,time=this.now(),eligible=this.enabled&&this.active();this.pending.set(key,ticket);
  return (cue?:HapticCue)=>{
   if(this.pending.get(key)!==ticket)return;this.pending.delete(key);
   if(cue&&eligible&&generation===this.generation&&this.now()-time<=1500)this.emit(cue);
  };
 }
}
