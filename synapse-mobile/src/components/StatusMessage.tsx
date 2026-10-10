import {View,ActivityIndicator} from 'react-native';
import Animated,{FadeIn} from 'react-native-reanimated';
import {useMotionPreference} from '../useMotionPreference';
import {Label,Icon,Button,useTheme} from './Atoms';
import type {ReaderStatus} from '../content/readerStatus';
import {DismissibleNotice} from './DismissibleNotice';
const presentation={loading:{icon:'cloud-download-outline',title:'Caricamento'},revising:{icon:'auto-fix',title:'Revisione Gemini'},offline:{icon:'cloud-off-outline',title:'Offline'},network:{icon:'wifi-off',title:'Connessione non disponibile'},content:{icon:'information-outline',title:'Testo non disponibile'},ai:{icon:'auto-fix',title:'Gemini non disponibile'}} as const;
export function StatusMessage({status,onAction,actionLabel,compact=false,reducedOverride,fontScaleOverride,timeoutEnabled=true}:{status:ReaderStatus;onAction?:()=>void;actionLabel?:string;compact?:boolean;reducedOverride?:boolean;fontScaleOverride?:number;timeoutEnabled?:boolean}){
 const {palette}=useTheme(),reduced=useMotionPreference(),noMotion=reducedOverride??reduced,waiting=status.kind==='loading'||status.kind==='revising',p=presentation[status.kind];
 const scale=fontScaleOverride??1;
 const content=<Animated.View key={status.kind} entering={noMotion?undefined:FadeIn.duration(180)} style={{marginBottom:compact?0:18,paddingVertical:compact?8:14,paddingHorizontal:compact?0:14,paddingRight:waiting?(compact?0:14):48,borderRadius:18,backgroundColor:compact?'transparent':palette.surface,gap:8}}>
  <View style={{flexDirection:'row',gap:10,alignItems:'flex-start'}}>
   <View accessible={false} importantForAccessibility="no-hide-descendants" style={{width:20,paddingTop:1}}><Icon name={p.icon} size={20} color={palette.muted}/></View>
   <View style={{flex:1,gap:3}}><View style={{flexDirection:'row',gap:8,alignItems:'center'}}><Label allowFontScaling={fontScaleOverride===undefined} strong style={{flex:1,fontSize:14*scale,lineHeight:20*scale}}>{p.title}</Label>{waiting&&!noMotion&&<ActivityIndicator size="small" color={palette.muted} style={{width:16,height:16}}/>}</View><Label allowFontScaling={fontScaleOverride===undefined} muted accessibilityLiveRegion="polite" style={{fontSize:14*scale,lineHeight:20*scale}}>{status.message}</Label></View>
  </View>
  {onAction&&actionLabel&&<Button reduced={noMotion} label={actionLabel} onPress={onAction} style={{alignSelf:'flex-start',marginLeft:24}}><Label allowFontScaling={fontScaleOverride===undefined} strong style={{fontSize:14*scale,lineHeight:20*scale,color:palette.accent}}>{actionLabel}</Label></Button>}
 </Animated.View>;
 return waiting?content:<DismissibleNotice key={`${status.kind}:${status.message}:${status.action??''}`} reduced={noMotion} timeoutEnabled={timeoutEnabled}>{content}</DismissibleNotice>;
}
