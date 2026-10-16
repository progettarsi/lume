import {useEffect,useState} from 'react';
import {ActivityIndicator,StyleSheet,View} from 'react-native';
import {Button,useTheme} from './Atoms';
import {AnimatedIcon,RestingAnimatedIcon} from './AnimatedIcon';
import {useMotionPreference} from '../useMotionPreference';
export const SHUFFLE_ICON_SIZE=24;
const BUTTON_SIZE=56;
export function ShuffleIcon(){const {palette}=useTheme();return <RestingAnimatedIcon name="shuffle" color={palette.ink}/>}
export function ShuffleButton({busy,onPress,active=true}:{busy:boolean;onPress:()=>void;active?:boolean}){
 const {palette}=useTheme(),reduced=useMotionPreference(),[revision,setRevision]=useState(0),[animating,setAnimating]=useState(false);
 useEffect(()=>{if(!busy||!active||reduced)setAnimating(false)},[busy,active,reduced]);
 return <Button label={busy?'Caricamento articolo casuale':'Apri un articolo casuale'} disabled={busy} onPress={()=>{setAnimating(!reduced);setRevision(n=>n+1);onPress()}} style={styles.button}>
  <View pointerEvents="none" style={styles.face}>{busy&&!animating?<ActivityIndicator size="small" color={palette.ink}/>:<AnimatedIcon name="shuffle" color={palette.ink} revision={revision} active={active} reduced={reduced} onComplete={()=>setAnimating(false)}/>}</View>
 </Button>;
}
const styles=StyleSheet.create({button:{height:BUTTON_SIZE,justifyContent:'flex-start'},face:{position:'absolute',top:0,left:0,right:0,height:BUTTON_SIZE,alignItems:'center',justifyContent:'center'}});
