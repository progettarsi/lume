import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {AppState,View} from 'react-native';
import Svg,{G,Path} from 'react-native-svg';
import LottieView,{type AnimationObject} from 'lottie-react-native';
import {animatedIconFrames} from '../design-system/animatedIconFrames';
const assets={home:require('../../assets/useanimations/home.json'),user:require('../../assets/useanimations/user.json'),bookmark:require('../../assets/useanimations/bookmark.json'),shuffle:require('../../assets/useanimations/shuffle.json')};
export type AnimatedIconName=keyof typeof assets;
const colored=new Map<string,AnimationObject>();
function sourceFor(name:AnimatedIconName,color:string){
 const key=name+color;let source=colored.get(key);
 if(!source){const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255);
  source=JSON.parse(JSON.stringify(assets[name]),(_key,v)=>{if(v&&(v.ty==='fl'||v.ty==='st')&&v.c?.a===0)v.c={...v.c,k:[...rgb,1]};return v});
  // Include the supplied endpoint keyframe in the native playback.
  const animation=source as unknown as typeof assets.home;animation.op++;animation.layers.forEach((layer:{op:number})=>layer.op++);colored.set(key,source!);
 }return source!;
}
export function RestingAnimatedIcon({name,color,filled=false,size=24}:{name:AnimatedIconName;color:string;filled?:boolean;size?:number}){
 const paths=animatedIconFrames[name][filled?1:0];
 return <Svg width={size} height={size} viewBox="4 4 24 24" accessible={false} aria-hidden importantForAccessibility="no">{paths.map((p,i)=><G key={i} transform={p.transform} opacity={p.opacity}><Path d={p.d} fill={p.fill?color:'none'} stroke={p.stroke?color:'none'} strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round"/></G>)}</Svg>;
}
// A revision is a local interaction event, never a persisted state update.
// Idle controls are SVGs; only the activated icon mounts a native player.
export function AnimatedIcon({name,color,revision,filled=false,active=true,reduced=false,size=24,onComplete}:{name:AnimatedIconName;color:string;revision:number;filled?:boolean;active?:boolean;reduced?:boolean;size?:number;onComplete?:()=>void}){
 const previous=useRef({revision,filled}),sequence=useRef(0);
 const [run,setRun]=useState<{id:number;reverse:boolean;ready?:boolean;idleEnd?:boolean}|null>(null);
 useLayoutEffect(()=>{
  const before=previous.current;previous.current={revision,filled};
  if(!active||reduced||AppState.currentState!=='active'){setRun(null);return}
  if(before.revision!==revision&&(name!=='bookmark'||before.filled!==filled))setRun({id:++sequence.current,reverse:name==='bookmark'&&!filled});else setRun(null);
 },[revision,filled,active,reduced,color,name]);
 return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:size,height:size}}>
  <View style={{opacity:run?.ready?0:1}}><RestingAnimatedIcon name={name} color={color} filled={run?.idleEnd?true:run&&name==='bookmark'?run.reverse:filled} size={size}/></View>
  {run&&active&&!reduced&&<Playback key={run.id+color} name={name} color={color} size={size} reverse={run.reverse} onIntermission={()=>setRun(current=>current?.id===run.id?{...current,ready:false,idleEnd:true}:current)} onReady={()=>setRun(current=>current?.id===run.id?{...current,ready:true}:current)} onDone={()=>{if(sequence.current!==run.id)return;setRun(current=>current?.id===run.id?null:current);onComplete?.()}}/>}
 </View>;
}
function Playback({name,color,size,reverse,onReady,onDone,onIntermission}:{name:AnimatedIconName;color:string;size:number;reverse:boolean;onReady:()=>void;onDone:()=>void;onIntermission:()=>void}){
 const returning=useRef(false),playing=useRef(true),leg=useRef(0),[loaded,setLoaded]=useState(false);
 const source=useMemo(()=>sourceFor(name,color),[name,color]),renderedLeg=leg.current;
 useLayoutEffect(()=>{playing.current=true;const sub=AppState.addEventListener('change',state=>{if(state!=='active'){playing.current=false;onDone()}});return()=>{playing.current=false;sub.remove()}},[]);
 // Start through the Fabric property transaction only after source + speed have
 // mounted. There are no queued play/pause commands targeting a removed view.
 return <LottieView key={renderedLeg} source={source} autoPlay={loaded} speed={returning.current||reverse?-1:1} loop={false} resizeMode="contain" style={{position:'absolute',width:size*4/3,height:size*4/3,left:-size/6,top:-size/6,opacity:loaded?1:0}}
  onAnimationLoaded={()=>{if(!playing.current||leg.current!==renderedLeg||AppState.currentState!=='active')return;setLoaded(true);onReady()}}
  onAnimationFailure={()=>{if(playing.current&&leg.current===renderedLeg){playing.current=false;onDone()}}}
  onAnimationFinish={cancelled=>{if(cancelled||!playing.current||leg.current!==renderedLeg)return;if(name==='home'&&!returning.current){returning.current=true;leg.current++;setLoaded(false);onIntermission()}else onDone()}}/>;
}
