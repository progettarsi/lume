import {normalizeName,type LocalIdentity} from './onboarding';
import {LocalPhoto,type PhotoPort} from './onboardingPhoto';

/** A profile edit owns temporary photos, never the committed identity. */
export class ProfileIdentitySession{
 value:LocalIdentity;
 private original:LocalIdentity;
 private photo:LocalPhoto;
 private closed=false;
 private saving=false;
 constructor(private port:PhotoPort,private references:()=>string[],private commit:(identity:LocalIdentity)=>Promise<void>,identity:LocalIdentity){
  this.original={...identity};this.value={...identity};this.photo=new LocalPhoto(port);
 }
 get busy(){return this.saving||this.photo.busy}
 get dirty(){return normalizeName(this.value.name)!==this.original.name||this.value.photoUri!==this.original.photoUri}
 setName(name:string){if(!this.closed)this.value={...this.value,name:Array.from(name).slice(0,48).join('')}}
 private refs(){return [...this.references(),...(this.closed?[]:[this.value.photoUri].filter((uri):uri is string=>!!uri))]}
 async pick(remove=false){
  if(this.closed||this.saving)return 'busy';
  const current=()=>this.value.photoUri,stage=async(photoUri:string|undefined)=>{if(this.closed)throw Error('Modifica chiusa.');this.value={...this.value,photoUri}};
  if(remove){await this.photo.remove(current,stage,()=>this.refs());return 'saved'}
  return this.photo.replace(current,stage,()=>this.refs());
 }
 async save(){
  if(this.closed||this.busy||!this.dirty)return false;
  this.saving=true;
  try{const identity={...this.value,name:normalizeName(this.value.name)};await this.commit(identity);this.value=identity;this.closed=true;
   const old=this.original.photoUri;if(old&&old!==identity.photoUri&&!this.references().includes(old))await this.port.remove(old).catch(()=>{});return true;
  }finally{this.saving=false}
 }
 async discard(){if(this.closed||this.saving)return;this.closed=true;const uri=this.value.photoUri;if(uri&&!this.references().includes(uri))await this.port.remove(uri).catch(()=>{})}
}
