export type PhotoPick={kind:'cancelled'|'denied'}|{kind:'picked';uri:string;width:number;height:number;bytes?:number};
export type PhotoPort={pick:()=>Promise<PhotoPick>;copy: (photo:Extract<PhotoPick,{kind:'picked'}>)=>Promise<string>;remove:(uri:string)=>Promise<void>;exists:(uri:string)=>Promise<boolean>};
export class LocalPhoto{
 busy=false;
 constructor(private port:PhotoPort){}
 async replace(current:()=>string|undefined,commit:(uri:string|undefined)=>Promise<void>,references:()=>string[]){
  if(this.busy)return 'busy';this.busy=true;let copy:string|undefined;
  try{const selected=await this.port.pick();if(selected.kind!=='picked')return selected.kind;
   if(!Number.isFinite(selected.width)||!Number.isFinite(selected.height)||selected.width<=0||selected.height<=0||selected.width*selected.height>80_000_000||(selected.bytes??0)>25*1024*1024)throw Error('Scegli una foto più piccola (massimo 25 MB).');
   copy=await this.port.copy(selected);const old=current();await commit(copy);
   if(old&&old!==copy&&!references().includes(old))await this.port.remove(old).catch(()=>{});
   return 'saved';
  }catch(error){if(copy&&!references().includes(copy))await this.port.remove(copy).catch(()=>{});throw error}finally{this.busy=false}
 }
 async remove(current:()=>string|undefined,commit:(uri:string|undefined)=>Promise<void>,references:()=>string[]){
  if(this.busy)return;this.busy=true;try{const old=current();await commit(undefined);if(old&&!references().includes(old))await this.port.remove(old).catch(()=>{})}finally{this.busy=false}
 }
 async usable(uri?:string){if(!uri)return undefined;try{return await this.port.exists(uri)?uri:undefined}catch{return undefined}}
}
