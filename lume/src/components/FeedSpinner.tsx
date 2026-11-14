import {View} from 'react-native';
import {useTheme} from './Atoms';
import {useMotionPreference} from '../useMotionPreference';
import {MaterialLoadingIndicator} from './onboarding/MaterialLoadingIndicator';

export function FeedSpinner({active=true}:{active?:boolean}){
 const {palette}=useTheme(),reduced=useMotionPreference();
 return <View accessible accessibilityRole="progressbar" accessibilityLabel="Caricamento" style={{width:24,height:24}}><MaterialLoadingIndicator size={24} color={palette.accent} active={active} reduced={reduced} frozen={false}/></View>;
}
