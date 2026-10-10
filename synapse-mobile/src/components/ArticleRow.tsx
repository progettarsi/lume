import {useRef} from 'react';
import {View,Pressable,StyleSheet} from 'react-native';
import Animated,{Easing,FadeInLeft,LinearTransition,useReducedMotion} from 'react-native-reanimated';
import {TitleWords,type TitleGeometry} from './TitleWords';
import {Label,Icon} from './Atoms';
import {SavedSwipe} from './SavedSwipe';
import {CATEGORIES} from '../content/categories';
import type {Article} from '../content/types';
import type {OpenArticle} from './Feed';
export type ListViewport={offset:number;height:number};
export function ArticleRow({article,onOpen,hidden,animateLayout=false,viewport,virtualized=false,reducedOverride,onRemove,onExited,removing=false,removalEnabled=true,restored=false}:{article:Article;onOpen:OpenArticle;hidden?:boolean;animateLayout?:boolean;viewport?:ListViewport;virtualized?:boolean;reducedOverride?:boolean;onRemove?:()=>void;onExited?:()=>void;removing?:boolean;removalEnabled?:boolean;restored?:boolean}){
  const ref=useRef<View>(null),title=useRef<TitleGeometry|undefined>(undefined),box=useRef({y:Infinity,height:0}),systemReduced=useReducedMotion();
  const visible=virtualized||!!viewport&&box.current.y+box.current.height>=viewport.offset&&box.current.y<=viewport.offset+viewport.height;
  const animate=animateLayout&&visible&&!(reducedOverride??systemReduced);
  const content=(confirm?:()=>void)=><Animated.View ref={ref} collapsable={false} entering={restored&&!(reducedOverride??systemReduced)?FadeInLeft.duration(260).easing(Easing.out(Easing.cubic)):undefined} onLayout={e=>{box.current=e.nativeEvent.layout}} layout={animate?LinearTransition.duration(140):undefined} style={{opacity:hidden?0:1}}>
    <Pressable disabled={removing} accessibilityRole="button" accessibilityLabel={article.title} accessibilityActions={confirm&&removalEnabled&&!hidden?[{name:'activate',label:'Apri articolo'},{name:'remove_saved',label:'Rimuovi dai salvati'}]:undefined} onAccessibilityAction={e=>{if(e.nativeEvent.actionName==='remove_saved')confirm?.();else if(e.nativeEvent.actionName==='activate')onOpen(article,ref.current,'row',title.current)}} onPress={()=>onOpen(article,ref.current,'row',title.current)} style={{paddingVertical:21,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#9c94834a',flexDirection:'row',gap:10,alignItems:'center'}}>
      <View style={{flex:1}}><Label muted style={{fontSize:12,lineHeight:18,marginBottom:9}}>{CATEGORIES.find(c=>c.id===article.category)?.label||'Wikipedia'}</Label><TitleWords title={article.title} size={25} onGeometry={geometry=>{title.current={...geometry,y:geometry.y+21}}}/></View>
      <Icon name="arrow-right" size={20}/>
    </Pressable>
  </Animated.View>;
  return onRemove?<SavedSwipe enabled={removalEnabled&&!hidden} removing={removing} onConfirm={onRemove} onExited={onExited||(()=>{})} reduced={reducedOverride??systemReduced}>{confirm=>content(confirm)}</SavedSwipe>:content();
}
