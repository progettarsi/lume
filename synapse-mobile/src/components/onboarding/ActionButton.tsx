import React from 'react';
import {Image,Pressable,StyleSheet,type StyleProp,type ViewStyle} from 'react-native';
import Animated,{useAnimatedStyle,useSharedValue,withTiming,cancelAnimation,Easing} from 'react-native-reanimated';
import {useTheme} from '../Atoms';
import {ONBOARDING_MOTION,type MotionEnvironment,type OrganicShapeKind} from '../../content/onboardingPresentation';
import {OrganicShapeSlot} from '../OnboardingMotionSlots';

export interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  shapeKind?: OrganicShapeKind;
  motion: MotionEnvironment;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

export function ActionButton({
  label,
  onPress,
  disabled = false,
  shapeKind,
  motion,
  style,
  testID,
}: ActionButtonProps) {
  const {palette} = useTheme();
  const translateY = useSharedValue(0);

  const animatedBackStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const handlePressIn = () => {
    if (disabled || motion.reduced) return;
    cancelAnimation(translateY);
    translateY.value = withTiming(
      ONBOARDING_MOTION.bounce.translateY,
      {
        duration: ONBOARDING_MOTION.bounce.downDuration,
        easing: easeOut,
      }
    );
  };

  const handlePressOut = () => {
    if (disabled || motion.reduced) {
      translateY.value = 0;
      return;
    }
    cancelAnimation(translateY);
    // return with slight overshoot then settle at 0
    translateY.value = withTiming(
      ONBOARDING_MOTION.bounce.overshoot,
      {
        duration: Math.round(ONBOARDING_MOTION.bounce.returnDuration * 0.6),
        easing: easeOut,
      },
      () => {
        translateY.value = withTiming(0, {
          duration: Math.round(ONBOARDING_MOTION.bounce.returnDuration * 0.4),
          easing: easeOut,
        });
      }
    );
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[styles.hitbox, style]}
    >
      <Animated.View
        style={[
          styles.shapeWrapper,
          shapeKind
            ? undefined
            : {backgroundColor: palette.active, borderRadius: 25},
          animatedBackStyle,
        ]}
      >
        {shapeKind ? (
          <OrganicShapeSlot kind={shapeKind} size={50} motion={motion} />
        ) : null}
      </Animated.View>
      <Image
        source={require('../../../assets/onboarding/arrow.png')}
        style={[
          styles.arrow,
          {
            tintColor: palette.ink,
          },
        ]}
        resizeMode="contain"
        accessible={false}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitbox: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeWrapper: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  arrow: {
    width: 24,
    height: 17,
  },
});
