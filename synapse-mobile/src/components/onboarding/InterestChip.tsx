import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { Label, useTheme } from '../Atoms';
import { body } from '../../theme';
import type { MotionEnvironment } from '../../content/onboardingPresentation';

export interface InterestChipProps {
  id: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
  motion: MotionEnvironment;
}

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);

export function InterestChip({
  id,
  label,
  selected,
  disabled = false,
  onToggle,
  motion,
}: InterestChipProps) {
  const { palette } = useTheme();

  // Progress shared value: 0 = unselected, 1 = selected
  const progress = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    if (motion.reduced || !motion.appActive || !motion.visible) {
      cancelAnimation(progress);
      progress.value = selected ? 1 : 0;
      return;
    }
    cancelAnimation(progress);
    progress.value = withTiming(selected ? 1 : 0, {
      duration: 120,
      easing: easeOut,
    });
    return()=>cancelAnimation(progress);
  }, [selected, motion.reduced, motion.appActive, motion.visible]);

  const animatedChipStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [palette.surface, palette.active]
    );
    return {
      backgroundColor,
    };
  });

  const animatedCheckStyle = useAnimatedStyle(() => ({
    opacity: progress.value,

  }));

  return (
    <Animated.View style={[styles.chipWrapper, animatedChipStyle]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: selected, disabled }}
        disabled={disabled}
        onPress={() => onToggle(id)}
        style={styles.pressable}
      >
        <Animated.View style={[styles.checkWrapper, animatedCheckStyle]}>
          <Text style={[styles.checkText, { color: palette.ink }]}>✓ </Text>
        </Animated.View>
        <Text style={[styles.labelText, { color: palette.ink }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chipWrapper: {
    minHeight: 48,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pressable: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkWrapper: {
    width:22,
    overflow: 'hidden',
  },
  checkText: {
    fontFamily: body,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  labelText: {
    fontFamily: body,
    fontSize: 17,
    lineHeight: 24,
  },
});
