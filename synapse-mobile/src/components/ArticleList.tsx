import {FlatList} from 'react-native';
import type {ReactNode,Ref} from 'react';
import {useLayoutEffect,useRef,useState,useMemo} from 'react';
import Animated,{Easing,FadeIn,LinearTransition} from 'react-native-reanimated';
import {useMotionPreference} from '../useMotionPreference';
import {ArticleRow} from './ArticleRow';
import type {Article} from '../content/types';
import type {OpenArticle} from './Feed';

// Only nearby rows participate in the handoff. Promoted/removed rows may be
// unmounted: closing always uses the immutable measured opening endpoint.
export function ArticleList({articles,onOpen,hiddenId,returnId,animate=false,bottomPadding=110,empty,footer,listRef,onContentSizeChange,reducedOverride,onRemove,removalEnabled=true}:{articles:Article[];onOpen:OpenArticle;hiddenId?:string;returnId?:string;animate?:boolean;bottomPadding?:number;empty?:ReactNode;footer?:ReactNode;listRef?:Ref<FlatList<Article>>;onContentSizeChange?:(width:number,height:number)=>void;reducedOverride?:boolean;onRemove?:(a:Article)=>void;removalEnabled?:boolean}){
  // Persist at release, but retain each visual row until its own exit completes.
  const [exiting,setExiting]=useState<{article:Article;index:number}[]>([]);
  const systemReduced=useMotionPreference(),reduced=reducedOverride??systemReduced,previous=useRef(new Set(articles.map(a=>a.id))),live=new Set(articles.map(a=>a.id));
  const restored=new Set(onRemove?articles.filter(a=>!previous.current.has(a.id)&&!exiting.some(e=>e.article.id===a.id)).map(a=>a.id):[]);
  useLayoutEffect(()=>{previous.current=live});
  const rows=useMemo(()=>{if(!exiting.length)return articles;const next=[...articles];for(const entry of [...exiting].sort((a,b)=>a.index-b.index))if(!next.some(a=>a.id===entry.article.id))next.splice(Math.min(entry.index,next.length),0,entry.article);return next},[articles,exiting]);
  return <Animated.FlatList ref={listRef} data={rows} keyExtractor={a=>a.id} itemLayoutAnimation={onRemove&&removalEnabled&&!reduced?LinearTransition.duration(260).easing(Easing.out(Easing.cubic)):undefined} windowSize={5} initialNumToRender={10} maxToRenderPerBatch={10} extraData={`${hiddenId}:${returnId}:${animate}:${reduced}:${removalEnabled}:${exiting.map(e=>e.article.id)}`} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{flex:1}} contentContainerStyle={{paddingHorizontal:24,paddingBottom:bottomPadding}} onContentSizeChange={onContentSizeChange} ListEmptyComponent={<Animated.View entering={onRemove&&!reduced?FadeIn.duration(220):undefined}>{empty}</Animated.View>} ListFooterComponent={<>{footer}</>} renderItem={({item,index})=><ArticleRow article={item} onOpen={onOpen} hidden={item.id===hiddenId} animateLayout={animate&&item.id!==returnId} virtualized reducedOverride={reduced} removalEnabled={removalEnabled} restored={restored.has(item.id)} removing={exiting.some(e=>e.article.id===item.id)&&!live.has(item.id)} onRemove={onRemove?()=>{setExiting(old=>[...old,{article:item,index}]);onRemove(item)}:undefined} onExited={()=>setExiting(old=>old.filter(e=>e.article.id!==item.id))}/>}/>;
}
