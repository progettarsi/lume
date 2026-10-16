import {AppState,Platform} from 'react-native';
import * as ExpoHaptics from 'expo-haptics';
import {HapticFeedback,type HapticCue} from './content/hapticFeedback';

async function play(cue:HapticCue){
 if(Platform.OS==='android'){
  // Use View.performHapticFeedback: honors system touch feedback, no waveform fallback.
  const version=Number(Platform.Version);
  // Frequent ticks may intentionally be silent on hardware without soft effects.
  if(cue==='reveal'&&version<34)return;
  const effect=cue==='reveal'?ExpoHaptics.AndroidHaptics.Segment_Frequent_Tick:
   cue==='threshold'?ExpoHaptics.AndroidHaptics.Clock_Tick:
   cue==='confirm'&&version>=30?ExpoHaptics.AndroidHaptics.Confirm:
   cue==='on'&&version>=34?ExpoHaptics.AndroidHaptics.Toggle_On:
   cue==='off'&&version>=34?ExpoHaptics.AndroidHaptics.Toggle_Off:
   cue==='selection'&&version>=34?ExpoHaptics.AndroidHaptics.Segment_Tick:
   cue==='refresh'&&version>=30?ExpoHaptics.AndroidHaptics.Gesture_Start:ExpoHaptics.AndroidHaptics.Context_Click;
  await ExpoHaptics.performAndroidHapticsAsync(effect);
 }else if(Platform.OS==='ios'&&cue!=='reveal'){
  if(cue==='confirm')await ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
  else await ExpoHaptics.selectionAsync();
 }
}
export const haptics=new HapticFeedback(play,()=>AppState.currentState==='active'&&Platform.OS!=='web');
