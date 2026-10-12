import React,{forwardRef,useCallback,useImperativeHandle,useRef,useState} from 'react';
import {View,useWindowDimensions} from 'react-native';
import {Feed,FeedBottomFade,type OpenArticle} from '../Feed';
import type {Article} from '../../content/types';
import type {MotionEnvironment} from '../../content/onboardingPresentation';

export type TutorialFeedHandle={goTo:(index:number)=>void};
export interface TutorialFeedProps{initialIndex:number;articles:Article[];saved:Set<string>;cardInsets:number[];bottomInset:number;motion:MotionEnvironment;blocked:boolean;readerOpen:boolean;covered?:string;onOpen:OpenArticle;onSave:(article:Article,only?:boolean)=>void;onIndex:(index:number)=>void;onInteract:()=>void;onEndReached?:()=>void}
// The actual Home feed owns the gesture and spring. Its page size is the
// snippet viewport, so a resting article never exposes the next one.
export const TutorialFeed=forwardRef<TutorialFeedHandle,TutorialFeedProps>(function TutorialFeed({initialIndex,articles,saved,cardInsets,bottomInset,motion,blocked,readerOpen,covered,onOpen,onSave,onIndex,onInteract,onEndReached},ref){
 const {fontScale}=useWindowDimensions();
 const [height,setHeight]=useState(0),[selected,setSelected]=useState(initialIndex),callbacks=useRef({onIndex,onInteract});callbacks.current={onIndex,onInteract};
 const report=useCallback((index:number)=>{setSelected(index);callbacks.current.onInteract();callbacks.current.onIndex(index)},[]);
 const goTo=useCallback((index:number)=>report(Math.max(0,Math.min(articles.length-1,index))),[articles.length,report]);
 useImperativeHandle(ref,()=>({goTo}),[goTo]);
 return <View testID="tutorial-feed" pointerEvents={blocked||!motion.visible||!motion.appActive?'none':'auto'} style={{flex:1,minHeight:0,overflow:'hidden',paddingVertical:fontScale>1.15?8:16}}>
  <View onLayout={e=>{const measured=e.nativeEvent.layout.height;setHeight(old=>old===measured?old:measured)}} style={{flex:1,minHeight:0,overflow:'hidden'}}>
   {height>0&&<Feed showTopFade articles={articles} height={height} size={20} saved={saved} cardInsets={cardInsets} position={selected} onIndex={report} onEndReached={blocked?undefined:onEndReached} onDirection={()=>callbacks.current.onInteract()} onOpen={onOpen} onSave={onSave} covered={covered} readerOpen={readerOpen} reducedOverride={motion.reduced||!motion.visible||!motion.appActive}/>}
  </View>
  <FeedBottomFade height={90+bottomInset}/>
 </View>;
});
