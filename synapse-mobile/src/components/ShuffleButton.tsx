import {ActivityIndicator,StyleSheet,View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {Button,useTheme} from './Atoms';

export const SHUFFLE_ICON_SIZE=24;
const BUTTON_SIZE=56;
// Outline of the bundled MaterialCommunityIcons shuffle-variant glyph, at its
// original 24 dp scale. Centre the actual ink bounds, not the font advance box.
const shufflePath='M16.875 3L22.125 7.5L16.875 12L22.125 16.5L16.875 21V18H14.109375L11.296875 15.1875L13.40625 13.078125L15.375 15H16.875V9H15.375L6.375 18H1.875V15H5.109375L14.109375 6H16.875ZM1.875 6H6.375L9.1875 8.8125L7.078125 10.921875L5.109375 9H1.875Z';

export function ShuffleIcon(){
  const {palette}=useTheme();
  return <Svg width={SHUFFLE_ICON_SIZE} height={SHUFFLE_ICON_SIZE} viewBox="0 0 24 24" accessible={false} aria-hidden importantForAccessibility="no"><Path d={shufflePath} fill={palette.ink}/></Svg>;
}

export function ShuffleButton({busy,onPress}:{busy:boolean;onPress:()=>void}){
  const {palette}=useTheme();
  return <Button label="Apri un articolo casuale" onPress={onPress} style={styles.button}>
    {/* Keep the existing 48 dp Pressable at the top; only the decorative face
        fills the measured 56 dp circle, for both the glyph and the spinner. */}
    <View pointerEvents="none" style={styles.face}>{busy?<View style={styles.icon}><ActivityIndicator size="small" color={palette.ink}/></View>:<ShuffleIcon/>}</View>
  </Button>;
}

const styles=StyleSheet.create({
  button:{height:BUTTON_SIZE,justifyContent:'flex-start'},
  face:{position:'absolute',top:0,left:0,right:0,height:BUTTON_SIZE,alignItems:'center',justifyContent:'center'},
  icon:{width:SHUFFLE_ICON_SIZE,height:SHUFFLE_ICON_SIZE,alignItems:'center',justifyContent:'center'},
});
