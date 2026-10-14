import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  computeMd3Path,
  evaluateMd3Loader,
  md3RotationDegrees,
  md3SpringResponse,
  MD3_STAGE_DURATION_MS,
} from '../../content/materialLoading';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface MaterialLoadingSnapshot {
  path: string;
  rotation: number;
}

export interface MaterialLoadingIndicatorProps {
  size: number;
  color: string;
  active: boolean;
  reduced: boolean;
  frozen: boolean;
  onFreeze?: (snapshot: MaterialLoadingSnapshot) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Material Design 3 native loading indicator for Synapse mobile.
 *
 * Runs strictly on the UI thread without per-frame JavaScript timers:
 * - 7 shapes cycling every 650ms (4550ms total cycle).
 * - Morph interpolation governed by second-order spring (stiffness 200, damping ratio 0.6).
 * - Continuous 50deg/stage rotation combined with 90deg spring rotation (+140deg/stage).
 * - Instant freeze upon `frozen: true`, emitting `onFreeze` snapshot once per cycle.
 * - Seamless resume without jumps when `active` toggles true -> false -> true.
 * - Full cancellation on unmount.
 */
export function MaterialLoadingIndicator({
  size,
  color,
  active,
  reduced,
  frozen,
  onFreeze,
  style,
}: MaterialLoadingIndicatorProps) {
  // sequenceProgress tracks normalized shape stage (0 -> 7 per cycle)
  const sequenceProgress = useSharedValue(0);
  const frozenPath = useSharedValue('');
  const frozenRotation = useSharedValue(0);
  const isFrozen = useSharedValue(frozen);
  const hasEmittedFreeze = useSharedValue(false);

  // Keep callback ref fresh for runOnJS dispatch
  const onFreezeRef = useRef(onFreeze);
  onFreezeRef.current = onFreeze;

  const handleEmitFreeze = (snapshot: MaterialLoadingSnapshot) => {
    if (onFreezeRef.current) {
      onFreezeRef.current(snapshot);
    }
  };

  // Sync frozen shared value
  useEffect(() => {
    isFrozen.value = frozen;
    if (!frozen) {
      hasEmittedFreeze.value = false;
    }
  }, [frozen, isFrozen, hasEmittedFreeze]);

  // A single UI frame clock avoids a recursive worklet callback crossing
  // runtimes at the end of each cycle (a fatal error in release Hermes).
  const clock = useFrameCallback(frame => {
    if (!isFrozen.value && frame.timeSincePreviousFrame !== null) {
      sequenceProgress.value += frame.timeSincePreviousFrame / MD3_STAGE_DURATION_MS;
    }
  }, false);
  useEffect(() => {
    if (reduced) sequenceProgress.value = 0;
    clock.setActive(active && !frozen && !reduced);
    return () => clock.setActive(false);
  }, [active, frozen, reduced, clock, sequenceProgress]);

  // React to frozen state change on the UI thread and emit snapshot once per freeze
  useAnimatedReaction(
    () => isFrozen.value,
    (currentFrozen, prevFrozen) => {
      if (currentFrozen && !prevFrozen && !hasEmittedFreeze.value) {
        hasEmittedFreeze.value = true;
        const currentSeq = sequenceProgress.value;
        const snapshot = evaluateMd3Loader(currentSeq);
        frozenPath.value = snapshot.path;
        frozenRotation.value = snapshot.rotation;
        runOnJS(handleEmitFreeze)({
          path: snapshot.path,
          rotation: snapshot.rotation,
        });
      }
    }
  );

  // SVG Path animated props on the UI thread
  const animatedPathProps = useAnimatedProps(() => {
    if (reduced) {
      return { d: computeMd3Path(0, 0) };
    }
    if (isFrozen.value && frozenPath.value !== '') {
      return { d: frozenPath.value };
    }
    const currentSeq = sequenceProgress.value;
    const base = Math.floor(currentSeq);
    const f = currentSeq - base;
    const spring = md3SpringResponse(f);
    return { d: computeMd3Path(base, spring) };
  });

  // Transform animated style (rotation around center) on the UI thread
  const animatedContainerStyle = useAnimatedStyle(() => {
    if (reduced) {
      return { transform: [{ rotate: '0deg' }] };
    }
    if (isFrozen.value) {
      return { transform: [{ rotate: `${frozenRotation.value}deg` }] };
    }
    const currentSeq = sequenceProgress.value;
    const base = Math.floor(currentSeq);
    const f = currentSeq - base;
    const spring = md3SpringResponse(f);
    const rotation = md3RotationDegrees(base, f, spring);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, styles.container, style]}
    >
      <Animated.View style={[{ width: size, height: size }, animatedContainerStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <AnimatedPath animatedProps={animatedPathProps} fill={color} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
