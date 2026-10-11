import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Label, Button, Icon, useTheme } from '../Atoms';
import { heading } from '../../theme';
import { OrganicShapeSlot } from '../OnboardingMotionSlots';
import { ActionButton } from './ActionButton';
import type { MotionEnvironment } from '../../content/onboardingPresentation';
import type { OnboardingBinding } from '../../useOnboarding';

export interface PreparationStageProps {
  binding: OnboardingBinding;
  motion: MotionEnvironment;
}

export function PreparationStage({ binding: b, motion }: PreparationStageProps) {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();

  const prep = b.preparation;
  const canEnter = prep.canEnter;
  const canRetry = prep.canRetry;

  const isLight = palette.paper === '#f7f4ee';
  const titleSize = width < 360 ? 32 : 36;
  const titleLine = width < 360 ? 39 : 43;

  return (
    <View style={styles.container}>
      {/* Background decorations: soft-burst top-right, puffy bottom-left (opacity 0.22) */}
      <View
        pointerEvents="none"
        accessible={false}
        aria-hidden={true}
        importantForAccessibility="no-hide-descendants"
        style={styles.decorationsContainer}
      >
        <OrganicShapeSlot
          kind="soft-burst"
          size={320}
          motion={motion}
          style={[
            styles.decorTopRight,
            {
              opacity: 0.22,
            },
          ]}
        />
        <OrganicShapeSlot
          kind="puffy"
          size={320}
          motion={motion}
          style={[
            styles.decorBottomLeft,
            {
              opacity: 0.22,
            },
          ]}
        />
      </View>

      {/* Exact title on two lines */}
      <View style={styles.titleWrapper}>
        <Label
          accessibilityRole="header"
          style={[
            styles.title,
            {
              fontFamily: heading,
              fontSize: titleSize,
              lineHeight: titleLine,
              color: palette.ink,
            },
          ]}
        >
          {'Sto preparando\ntutto per te…'}
        </Label>
      </View>

      {/* Central Group: cookie 132.211 and compass 52 */}
      <View style={styles.centralGroup}>
        <View
          testID="onboarding-preparation-shape-slot"
          style={styles.cookieWrapper}
        >
          <OrganicShapeSlot
            kind="preparation"
            size={132}
            motion={motion}
            style={styles.cookieShape}
          />
          <Image
            source={require('../../../assets/onboarding/compass.png')}
            style={styles.compassImage}
            resizeMode="contain"
            accessible={false}
          />
        </View>

        {/* Real status text from controller - never a synthetic timer */}
        <Label
          accessibilityLiveRegion="polite"
          style={[styles.statusMessage, { color: palette.muted }]}
        >
          {prep.message}
        </Label>

        {/* Optional retry button if allowed by controller state */}
        {canRetry && (
          <Button
            disabled={b.busy}
            label="Riprova caricamento"
            onPress={b.retryFeed}
            style={[
              styles.retryButton,
              {
                backgroundColor: palette.surface,
              },
            ]}
          >
            <Label style={{ color: palette.ink }}>Riprova</Label>
          </Button>
        )}
      </View>

      {/* Footer controls: Back always accessible, ActionButton Entra (enabled only when canEnter) */}
      <View style={styles.footerRow}>
        <Button
          label="Indietro"
          disabled={b.busy}
          onPress={() => b.navigate('back')}
          style={[
            styles.backButton,
            {
              backgroundColor: palette.surface,
            },
          ]}
        >
          <Icon name="arrow-left" size={24} />
        </Button>

        {/* Enter button is active only when ready or in fallback (partial/error/offline) */}
        <ActionButton
          label={canEnter ? 'Entra nella Home' : 'Caricamento in corso…'}
          onPress={() => b.navigate('enter')}
          disabled={b.busy || !canEnter}
          motion={motion}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  decorationsContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  decorTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
  },
  titleWrapper: {
    marginTop: 24,
    minHeight: 86,
  },
  title: {
    textAlign: 'left',
  },
  centralGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  cookieWrapper: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  cookieShape: {
    position: 'absolute',
  },
  compassImage: {
    width: 52,
    height: 52,
  },
  statusMessage: {
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 320,
    paddingHorizontal: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    minHeight: 48,
    borderRadius: 24,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});
