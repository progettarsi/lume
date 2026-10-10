// Native QA only: no production data or remote service. Real hook/SQLite/Feed/Reader.
import React,{useEffect,useRef,useState} from 'react';
import {View,Text,Pressable,useWindowDimensions} from 'react-native';
import {registerRootComponent} from 'expo';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider,useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFonts} from 'expo-font';
import {Newsreader_500Medium} from '@expo-google-fonts/newsreader/500Medium';
import {SourceSans3_400Regular} from '@expo-google-fonts/source-sans-3/400Regular';
import {SourceSans3_600SemiBold} from '@expo-google-fonts/source-sans-3/600SemiBold';
import {useSharedValue} from 'react-native-reanimated';
import {useLibrary} from '../../src/useLibrary';
import * as storage from '../../src/storage';
import {Wikipedia} from '../../src/content/wikipedia';
import type {Article} from '../../src/content/types';
import {Feed,type Origin,type OpenArticle} from '../../src/components/Feed';
import {Reader} from '../../src/components/Reader';
import {ThemeContext} from '../../src/components/Atoms';
import {dark} from '../../src/theme';
const corpus=require('./personalization-corpus.cjs') as {rows:Article[];article:(t:number,i:number,p?:string)=>Article};
function Harness(){const [fonts]=useFonts({Newsreader_500Medium,SourceSans3_400Regular,SourceSans3_600SemiBold}),[ready,setReady]=useState(false);
 useEffect(()=>{void (async()=>{await storage.initStorage();if(!(await storage.getArticles()).length){await storage.putArticles(corpus.rows);await storage.putLearning({version:2,seen:[],categories:{nature:999},topics:{},updatedAt:1} as any)}setReady(true)})()},[]);
 return <GestureHandlerRootView style={{flex:1}}><SafeAreaProvider>{fonts&&ready&&<Cases/>}</SafeAreaProvider></GestureHandlerRootView>}
function Cases(){const w=useWindowDimensions(),insets=useSafeAreaInsets(),paint=useSharedValue(1),[index,setIndex]=useState(0),[online,setOnline]=useState(false),[note,setNote]=useState('Pronto'),[reader,setReader]=useState<{article:Article;origin:Origin}|null>(null),[open,setOpen]=useState(false),calls=useRef(0);
 const wiki=useRef(new Wikipedia(async url=>{calls.current++;const q=new URL(String(url)).searchParams;const theme=q.get('gsrsearch')?.includes('Astronomia')?0:2;return new Response(JSON.stringify({query:{pages:Array.from({length:6},(_,i)=>{const a=corpus.article(theme,100+calls.current*6+i,'remote');return {pageid:1000+calls.current*6+i,title:a.title,extract:a.preview[0],fullurl:a.source}})}}))}));
 const lib=useLibrary({onlineOverride:online,wikipedia:wiki.current}),latest=useRef(lib);latest.current=lib;const rows=lib.getFeed('all');
 useEffect(()=>{if(lib.ready)void lib.load('all',index)},[lib.ready,online,index]);
 const report=async(label:string)=>{const p=await storage.getLearning();setNote(`${label} v${p.version} recent${p.recent?.length} req${calls.current} saved${(await storage.getArticles()).filter(a=>a.saved).length} visits${(await storage.getHistory()).length}`)};
 const run=async(kind:string)=>{try{const current=latest.current.getFeed('all')[index]?.id;if(kind==='Save3'){for(let i=0;i<3;i++)await latest.current.setSaved(corpus.article(0,i,'qa-signal'),true)}if(kind==='Undo'){const a=corpus.article(0,2,'qa-signal');await latest.current.setSaved(a,false);await latest.current.setSaved(a,true)}if(kind==='Remove3'){for(let i=0;i<3;i++)await latest.current.setSaved(corpus.article(0,i,'qa-signal'),false)}await report(`${kind} pin${current===latest.current.getFeed('all')[index]?.id?'OK':'FAIL'}`)}catch(e){setNote(String(e))}};
 const show:OpenArticle=(a,node,kind)=>{const present=(origin:Origin)=>{lib.activate(a);setReader({article:a,origin});setOpen(true);void lib.read(a).then(()=>report('Open'))};if(node)node.measureInWindow((x,y,width,height)=>present({kind,x,y:y-insets.top,width,height}));else present({kind,x:24,y:20,width:w.width-48,height:300})};
 const button=(s:string,fn:()=>void)=><Pressable key={s} accessibilityLabel={s} onPress={fn} style={{padding:10,backgroundColor:'#554339',margin:2}}><Text style={{color:'white'}}>{s}</Text></Pressable>;
 return <ThemeContext.Provider value={{palette:dark,progress:paint}}><View style={{flex:1,paddingTop:insets.top,backgroundColor:dark.paper}}><Text style={{color:dark.ink,padding:8}}>Personalizzazione QA · {online?'online':'offline'}</Text><View style={{height:410,paddingHorizontal:24}}><Feed articles={rows} height={410} size={20} saved={new Set(lib.cache.filter(a=>a.saved).map(a=>a.id))} readerOpen={open} position={index} onIndex={n=>setIndex(lib.trimFeed('all',n))} onDirection={()=>{}} onOpen={show} onSave={a=>void lib.save(a)}/></View><Text accessibilityLabel={note} style={{color:dark.ink,padding:8,fontSize:12}}>{note}</Text><Text style={{color:dark.ink,fontSize:12,paddingHorizontal:8}}>Next10: {rows.slice(index+1,index+11).map(a=>a.category).join(', ')}</Text><View style={{flexDirection:'row',flexWrap:'wrap'}}>{['Save3','Undo','Remove3'].map(s=>button(s,()=>void run(s)))}{button('Dati',()=>void report('Dati'))}{button('Online',()=>setOnline(v=>!v))}{button('Apri',()=>rows[index]&&show(rows[index],null,'home'))}</View>{reader&&<View style={{position:'absolute',top:insets.top,left:0,right:0,bottom:0}}><Reader article={reader.article} origin={reader.origin} open={open} width={w.width} height={w.height-insets.top} top={20} bottom={insets.bottom} size={20} saved={lib.isSaved(reader.article.id)} onClose={()=>setOpen(false)} onReopen={()=>setOpen(true)} onClosed={()=>{lib.activate();setReader(null)}} onSave={()=>void lib.save(reader.article)}/></View>}</View></ThemeContext.Provider>;
}
registerRootComponent(Harness);
