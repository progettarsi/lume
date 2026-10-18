import {useRef} from 'react';
import {View,type LayoutRectangle} from 'react-native';
import {heading} from '../theme';
import {Label} from './Atoms';
export type TitleGeometry={x:number;y:number;height:number;words:LayoutRectangle[]};
// Both endpoints use the same word layout: wrapping never changes midway through a morph.
export function TitleWords({title,size,onGeometry}:{title:string;size:number;onGeometry?:(g:TitleGeometry)=>void}){
  const geometry=useRef<TitleGeometry>({x:0,y:0,height:0,words:[]}),tokens=title.split(/\s+/);
  const publish=()=>{if(geometry.current.height&&geometry.current.words.filter(Boolean).length===tokens.length)onGeometry?.({...geometry.current,words:[...geometry.current.words]})};
  return <View accessible accessibilityRole="header" accessibilityLabel={title} style={{flexDirection:'row',flexWrap:'wrap'}} onLayout={onGeometry?e=>{geometry.current={...geometry.current,...e.nativeEvent.layout};publish()}:undefined}>
    {tokens.map((word,i)=><Label key={`${i}:${word}`} style={{fontFamily:heading,fontSize:size,lineHeight:size===25?29:size===36?40:44,letterSpacing:size===25?-.5:size===36?-.7:-.8,includeFontPadding:false}} onLayout={onGeometry?e=>{geometry.current.words[i]=e.nativeEvent.layout;publish()}:undefined}>{word}{i<tokens.length-1?' ':''}</Label>)}
  </View>;
}
