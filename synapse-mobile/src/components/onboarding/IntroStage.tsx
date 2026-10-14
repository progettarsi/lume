import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  cancelAnimation,
  Easing,
  useAnimatedReaction,runOnJS,
} from 'react-native-reanimated';
import { Label, useTheme } from '../Atoms';
import { SvgXml } from 'react-native-svg';
import { onboardingBrand } from '../../content/onboardingBrand';
import {OnboardingTitleSlot} from '../OnboardingMotionSlots';
import { ActionButton } from './ActionButton';
import {
  ONBOARDING_MOTION,
  type MotionEnvironment,
} from '../../content/onboardingPresentation';

export interface IntroStageProps {
  motion: MotionEnvironment;
  onNext: () => void;
  busy: boolean;
  bottomInset: number;
}

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

export function IntroStage({ motion, onNext, busy, bottomInset }: IntroStageProps) {
  const { palette } = useTheme();
  const brand = onboardingBrand(palette.ink, palette.paper);

  // Rays animation values
  const raysOpacity = useSharedValue(motion.reduced ? 1 : 0);
  const raysScale = useSharedValue(motion.reduced ? 1 : ONBOARDING_MOTION.rays.fromScale);

  // Continue button animation values
  const continueOpacity = useSharedValue(motion.reduced ? 1 : 0);
  const [continueInteractable, setContinueInteractable] = React.useState(motion.reduced);

  useEffect(() => {
    if (motion.reduced) {
      raysOpacity.value = 1;
      raysScale.value = 1;
      continueOpacity.value = 1;
      setContinueInteractable(true);
      return;
    }

    if (!motion.visible || !motion.appActive) {
      cancelAnimation(raysOpacity);
      cancelAnimation(raysScale);
      cancelAnimation(continueOpacity);
      return;
    }

    // Start rays animation: delay 120ms, duration 260ms, opacity 0->1, scale 0.94->1
    raysOpacity.value = withDelay(
      ONBOARDING_MOTION.rays.delay,
      withTiming(1, { duration: ONBOARDING_MOTION.rays.duration, easing: easeOut })
    );
    raysScale.value = withDelay(
      ONBOARDING_MOTION.rays.delay,
      withTiming(ONBOARDING_MOTION.rays.toScale, {
        duration: ONBOARDING_MOTION.rays.duration,
        easing: easeOut,
      })
    );

    // Continue animation: delay 180ms, duration 220ms, opacity 0->1
    continueOpacity.value = withDelay(
      ONBOARDING_MOTION.introContinue.delay,
      withTiming(1, {
        duration: ONBOARDING_MOTION.introContinue.duration,
        easing: easeOut,
      })
    );


    return () => {
      cancelAnimation(raysOpacity);
      cancelAnimation(raysScale);
      cancelAnimation(continueOpacity);
    };
  }, [motion.reduced, motion.visible, motion.appActive]);

  useAnimatedReaction(()=>continueOpacity.value>0,(value,previous)=>{if(value!==previous)runOnJS(setContinueInteractable)(value)});

  const animatedRaysStyle = useAnimatedStyle(() => ({
    opacity: raysOpacity.value,
    transform: [{ scale: raysScale.value }],
  }));

  const animatedContinueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.centerGroup}>
        <View testID="onboarding-bulb-slot" style={styles.bulbContainer} accessible={false}>
          <Animated.View pointerEvents="none" accessible={false} style={[styles.raysWrapper, animatedRaysStyle]}>
            <SvgXml xml={brand.logo} width={105} height={105} accessible={false}/>
          </Animated.View>
        </View>

        <View style={{marginBottom:12,width:'100%'}}><OnboardingTitleSlot title="Benvenuto!" titleKey="intro" motion={motion} center/></View>
      </View>

      {/* Footer Continue */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(bottomInset, 16) + 32,
          },
        ]}
      >
        <Animated.View
          style={animatedContinueStyle}
          pointerEvents={continueInteractable ? 'auto' : 'none'}
          aria-hidden={!continueInteractable}
          accessibilityElementsHidden={!continueInteractable}
          importantForAccessibility={continueInteractable ? 'auto' : 'no-hide-descendants'}
        >
          <ActionButton
            testID="intro-continue-button"
            label="Continua"
            onPress={onNext}
            disabled={busy || !continueInteractable}
            motion={motion}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  bulbContainer: {
    width: 128,
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  raysWrapper: {
    position: 'absolute',
    top: 64 - 44.75 - 27, // center y = 64, half rays height = 44.75, offset -27
    left: 64 - 52.5,
    width: 105,
    height: 89.5,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 310,
    fontSize: 17,
    lineHeight: 25,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
