import {useLayoutEffect,useMemo,useRef} from 'react';
import {View} from 'react-native';
import LottieView from 'lottie-react-native';
import {useTheme} from './Atoms';

const icons={home:require('../../assets/lordicon/home.json'),profile:require('../../assets/lordicon/avatar.json')};
type Destination=keyof typeof icons;

// Colour the monochrome vector fills once per theme, preserving the supplied
// animation and geometry. No remote assets or per-frame React updates.
function coloredIcon(icon:object,color:string){
 const rgb=[1,3,5].map(start=>parseInt(color.slice(start,start+2),16)/255);
 return JSON.parse(JSON.stringify(icon),(_key,value)=>{
  if(value&&(value.ty==='fl'||value.ty==='st')&&value.c?.a===0)value.c={...value.c,k:[...rgb,1]};
  return value;
 });
}

export function DockIcon({name,revision,active,reduced}:{name:Destination;revision:number;active:boolean;reduced:boolean}){
 const {palette}=useTheme();
 return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><AnimatedGlyph key={palette.ink} name={name} revision={revision} active={active} reduced={reduced} color={palette.ink}/></View>;
}

function AnimatedGlyph({name,revision,active,reduced,color}:{name:Destination;revision:number;active:boolean;reduced:boolean;color:string}){
 const player=useRef<LottieView>(null),ready=useRef(false),pending=useRef(false),previous=useRef(revision);
 const source=useMemo(()=>coloredIcon(icons[name],color),[name,color]);
 useLayoutEffect(()=>{
  const changed=previous.current!==revision;previous.current=revision;
  if(reduced||!active){pending.current=false;player.current?.reset();return}
  if(changed){pending.current=true;if(ready.current){pending.current=false;player.current?.reset();player.current?.play()}}
 },[revision,active,reduced]);
 return <LottieView ref={player} source={source} style={{width:24,height:24}} autoPlay={false} loop={false}
  onAnimationLoaded={()=>{ready.current=true;if(pending.current&&active&&!reduced){pending.current=false;player.current?.reset();player.current?.play()}}}/>;
}
