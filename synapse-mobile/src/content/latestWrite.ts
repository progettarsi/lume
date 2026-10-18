/** Preferences are last-intent state, unlike bookmark actions. Keep at most one
 * pending snapshot behind the active durable write, without delaying input. */
export class LatestWrite<T>{
 private pending?:{value:T};private running=false;
 constructor(private write:(value:T)=>Promise<unknown>,private failed:(error:unknown)=>void){}
 submit(value:T){this.pending={value};if(!this.running)void this.flush()}
 private async flush(){this.running=true;while(this.pending){const item=this.pending;this.pending=undefined;try{await this.write(item.value)}catch(error){this.failed(error)}}this.running=false}
}
