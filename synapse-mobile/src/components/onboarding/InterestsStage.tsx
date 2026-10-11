import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Label, useTheme } from '../Atoms';
import { ActionButton } from './ActionButton';
import { InterestChip } from './InterestChip';
import { OrganicShapeSlot } from '../OnboardingMotionSlots';
import type { MotionEnvironment } from '../../content/onboardingPresentation';
import type { OnboardingBinding } from '../../useOnboarding';

export interface InterestsStageProps {
  binding: b;
  motion: MotionEnvironment;
}
type b = OnboardingBinding;

export function InterestsStage({ binding: b, motion }: InterestsStageProps) {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();

  // Use draft.interests directly to avoid dropped taps
  const selectedInterests = b.draft?.interests ?? [];

  return (
    <View style={styles.container}>
      {/* Subtitle */}
      <Label style={[styles.subtitle, { color: palette.muted }]}>
        Scegli gli argomenti che ti incuriosiscono. Puoi continuare anche senza selezionarne.
      </Label>

      {/* Chips Container */}
      <View style={styles.chipsContainer}>
        {b.options.map((option) => {
          const isSelected = selectedInterests.includes(option.id);
          return (
            <InterestChip
              key={option.id}
              id={option.id}
              label={option.label}
              selected={isSelected}
              disabled={b.busy}
              onToggle={b.toggleInterest}
              motion={motion}
            />
          );
        })}
      </View>

      {/* Footer note */}
      <Label style={[styles.note, { color: palette.muted }]}>
        Gli interessi sono selezionabili anche se il feed non ha ancora articoli per tutti.
      </Label>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  decorationsContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  decorTopLeft: {
    position: 'absolute',
    top: -210, // >65% offscreen of 320 size
    left: -210,
  },
  decorBottomRight: {
    position: 'absolute',
    bottom: -210,
    right: -210,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  footerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
