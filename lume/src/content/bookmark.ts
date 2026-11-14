import {serialWrites} from './articleState';
// Roll back to durable state, not to an earlier optimistic removal/undo.
export class BookmarkWriter {
 private queue=serialWrites();private versions=new Map<string,number>();private confirmed=new Map<string,boolean>();
 async set(id:string,value:boolean,initial:boolean,write:()=>Promise<void>,apply:(saved:boolean)=>void):Promise<boolean>{
  if(!this.confirmed.has(id))this.confirmed.set(id,initial);
  const version=(this.versions.get(id)||0)+1;this.versions.set(id,version);apply(value);
  try{await this.queue(async()=>{await write();this.confirmed.set(id,value)})}
  catch(error){if(this.versions.get(id)===version)apply(this.confirmed.get(id)!);throw error}
  return value;
 }
}
export function removalThreshold(width:number){'worklet';return width*.42}
export function removalArmed(x:number,width:number){'worklet';return width>0&&-x>=removalThreshold(width)}
export function settleDuration(distance:number,velocity:number){'worklet';return Math.max(110,Math.min(210,distance/Math.max(600,Math.abs(velocity))*1000))}
