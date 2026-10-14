import * as ImagePicker from 'expo-image-picker';
import {Image} from 'react-native';
import {ImageManipulator,SaveFormat} from 'expo-image-manipulator';
import {Directory,File,Paths} from 'expo-file-system';
import type {PhotoPort} from './content/onboardingPhoto';
const folder=()=>new Directory(Paths.document,'synapse-profile');
function ownedFile(uri:string){const prefix=folder().uri.replace(/\/$/,'')+'/';return uri.startsWith(prefix)&&/^avatar-[a-z0-9-]+\.jpg$/.test(uri.slice(prefix.length))?new File(uri):undefined}
export const photoPort:PhotoPort={
 async pick(){
  // System photo picker; no camera, microphone or broad library request.
  try{const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:false,quality:1,exif:false});
   if(result.canceled)return {kind:'cancelled'};
   const a=result.assets[0];return {kind:'picked',uri:a.uri,width:a.width,height:a.height,bytes:a.fileSize};
  }catch(error){if(/permission|denied/i.test(String(error)))return {kind:'denied'};throw error}
 },
 async copy(photo){
  let w=photo.width,h=photo.height;
  if((!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)&&typeof Image?.getSize==='function'){
   try{
    const size=await new Promise<{width:number;height:number}>((res,rej)=>{Image.getSize(photo.uri,(width,height)=>res({width,height}),rej)});
    w=size.width;h=size.height;
   }catch{}
  }
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('Non riesco a ridurre questa foto. Prova un’altra immagine.');
  const context=ImageManipulator.manipulate(photo.uri),scale=Math.min(1,768/Math.max(w,h));
  context.resize({width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))});
  const image=await context.renderAsync();let temporary:File|undefined,destination:File|undefined;
  try{const result=await image.saveAsync({format:SaveFormat.JPEG,compress:.8});temporary=new File(result.uri);
   if(!temporary.exists||temporary.size>1024*1024)throw Error('Non riesco a ridurre questa foto. Prova un’altra immagine.');
   const dir=folder();dir.create({intermediates:true,idempotent:true});destination=new File(dir,`avatar-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);await temporary.copy(destination);
   if(!destination.exists||!destination.size)throw Error('Foto non copiata sul telefono.');return destination.uri;
  }catch(error){if(destination?.exists)destination.delete();throw error}finally{if(temporary?.exists)temporary.delete();image.release();context.release()}
 },
 async remove(uri){const file=ownedFile(uri);if(file?.exists)file.delete()},
 async exists(uri){return ownedFile(uri)?.exists??false},
};
/** Retry orphan cleanup at boot; referenced copies are always protected. */
export async function cleanPhotos(references:string[]){const dir=folder();if(!dir.exists)return;for(const item of dir.list())if(item instanceof File&&/^avatar-.+\.jpg$/.test(item.name)&&!references.includes(item.uri))try{item.delete()}catch{}}
