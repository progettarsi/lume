import {useRef,type ReactNode} from 'react';
import {StyleSheet,View} from 'react-native';
import {useAnimatedStyle} from 'react-native-reanimated';
import {PageHeader,ScreenLayer} from '../design-system/components';
import {useSlideTransition} from '../useSlideTransition';
import {useTheme} from './Atoms';

/** The main scroll remains mounted during a detail visit; only the departing
 * detail is released at its exit endpoint. Header and body travel together. */
export function SettingsStack({page,width,top,active,reduced,focusRequest,onBack,main,children}:{page:'main'|'gemini'|'gallery';width:number;top:number;active:boolean;reduced:boolean;focusRequest:number;onBack:()=>void;main:ReactNode;children:(page:'gemini'|'gallery')=>ReactNode}){
 const {palette}=useTheme(),lastDetail=useRef<'gemini'|'gallery'>('gemini');
 if(page!=='main')lastDetail.current=page;
 const {progress,mounted}=useSlideTransition(page!=='main',reduced);
 const mainStyle=useAnimatedStyle(()=>({transform:[{translateX:-progress.value*width}]}));
 const detailStyle=useAnimatedStyle(()=>({transform:[{translateX:(1-progress.value)*width}]}));
 const paper={backgroundColor:palette.paper};
 return <View style={{flex:1,overflow:'hidden'}}>
  <ScreenLayer layer={0} active={active&&page==='main'} style={[StyleSheet.absoluteFill,paper,mainStyle]}>
   <PageHeader title="Impostazioni" top={top} active={active&&page==='main'&&!focusRequest} backLabel="Torna al profilo" onBack={onBack}/>
   {main}
  </ScreenLayer>
  {mounted&&<ScreenLayer layer={1} active={active&&page!=='main'} style={[StyleSheet.absoluteFill,paper,detailStyle]}>
   <PageHeader title={lastDetail.current==='gemini'?'Gemini':'Design system'} top={top} active={active&&page!=='main'} backLabel="Torna alle impostazioni" onBack={onBack}/>
   {children(lastDetail.current)}
  </ScreenLayer>}
 </View>;
}
