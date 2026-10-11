import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Label, Button, Icon, useTheme } from '../Atoms';
import { SvgXml } from 'react-native-svg';
import { onboardingVector } from '../../content/onboardingVectors';
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
          <SvgXml xml={onboardingVector("compass",palette.ink,palette.paper,palette.active)} width={52} height={52} accessible={false}/>
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
    flex:1,
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
