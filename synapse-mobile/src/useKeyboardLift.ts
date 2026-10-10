import {useAnimatedKeyboard} from 'react-native-reanimated';
// Android edge-to-edge IME insets, updated on the UI thread during the animation.
export function useKeyboardLift(){return useAnimatedKeyboard({isStatusBarTranslucentAndroid:true,isNavigationBarTranslucentAndroid:true}).height}
