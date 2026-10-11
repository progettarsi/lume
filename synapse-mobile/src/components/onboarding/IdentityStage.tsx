import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { Label, Button, Icon, useTheme } from '../Atoms';
import { body, heading } from '../../theme';
import { ActionButton } from './ActionButton';
import {
  ONBOARDING_MOTION,
  type MotionEnvironment,
} from '../../content/onboardingPresentation';
import type { OnboardingBinding } from '../../useOnboarding';

export interface IdentityStageProps {
  binding: OnboardingBinding;
  motion: MotionEnvironment;
  usableHeight: number;
  fontScale: number;
}

export function IdentityStage({
  binding: b,
  motion,
  usableHeight,
  fontScale,
}: IdentityStageProps) {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();

  // Real input value matches binding.draft.name
  const initialValue = b.draft?.name ?? '';
  const [realValue, setRealValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Animated placeholder overlay state
  const [placeholderOverlay, setPlaceholderOverlay] = useState(
    motion.reduced || realValue.length > 0 ? '' : ''
  );
  const [showOverlay, setShowOverlay] = useState(
    !motion.reduced && realValue.length === 0
  );

  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isTypingRef = useRef(true);
  const stoppedRef = useRef(motion.reduced || realValue.length > 0);

  const stopLoop = () => {
    stoppedRef.current = true;
    setShowOverlay(false);
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (motion.reduced || !motion.visible || !motion.appActive || realValue.length > 0) {
      stopLoop();
      return;
    }

    if (stoppedRef.current) return;

    const names = ONBOARDING_MOTION.placeholder.names; // ['Alex', 'Sofia', 'Andrea']

    const tick = () => {
      if (stoppedRef.current || !motion.visible || !motion.appActive) return;

      const currentName = names[nameIndexRef.current % names.length];

      if (isTypingRef.current) {
        // Typing
        if (charIndexRef.current < currentName.length) {
          charIndexRef.current++;
          setPlaceholderOverlay(currentName.slice(0, charIndexRef.current));
          loopTimerRef.current = setTimeout(
            tick,
            ONBOARDING_MOTION.placeholder.typeInterval
          );
        } else {
          // Pause at full word
          isTypingRef.current = false;
          loopTimerRef.current = setTimeout(
            tick,
            ONBOARDING_MOTION.placeholder.pause
          );
        }
      } else {
        // Erasing
        if (charIndexRef.current > 0) {
          charIndexRef.current--;
          setPlaceholderOverlay(currentName.slice(0, charIndexRef.current));
          loopTimerRef.current = setTimeout(
            tick,
            ONBOARDING_MOTION.placeholder.eraseInterval
          );
        } else {
          // Move to next name
          isTypingRef.current = true;
          nameIndexRef.current++;
          loopTimerRef.current = setTimeout(
            tick,
            ONBOARDING_MOTION.placeholder.typeInterval
          );
        }
      }
    };

    loopTimerRef.current = setTimeout(
      tick,
      ONBOARDING_MOTION.placeholder.typeInterval
    );

    return () => {
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, [motion.reduced, motion.visible, motion.appActive]);

  const handleFocus = () => {
    setIsFocused(true);
    stoppedRef.current=true;
    if(loopTimerRef.current){clearTimeout(loopTimerRef.current);loopTimerRef.current=null}
    let visible=Array.from(placeholderOverlay);
    const erase=()=>{if(!visible.length){setShowOverlay(false);loopTimerRef.current=null;return}visible.pop();setPlaceholderOverlay(visible.join(''));loopTimerRef.current=setTimeout(erase,ONBOARDING_MOTION.placeholder.focusEraseInterval)};
    if(showOverlay)erase();else stopLoop();
  };

  const handleBlur = () => {
    setIsFocused(false);
    stopLoop();
    // On blur with empty field, keep static accessible placeholder, do not restart loop
    if (realValue.length === 0) {
      setShowOverlay(false);
    }
  };

  const handleChangeText = (text: string) => {
    stopLoop();
    const value=Array.from(text).slice(0,48).join('');
    setRealValue(value);
    b.updateDraft({ name: value });
  };

  // Responsive adaptions:
  // Under 700dp usable height or fontScale >= 1.3: avatar 112, gap 20
  const isCompact = usableHeight < 700 || fontScale >= 1.3;
  const avatarSize = isCompact ? 112 : 140;
  const sectionGap = isCompact ? 32 : 80;

  const isLight = palette.paper === '#f7f4ee';

  return (
    <View style={styles.container}>
      {/* Subtitle */}
      <Label style={[styles.subtitle, { color: palette.muted }]}>
        Come ti chiami? Nome e foto sono facoltativi e rimangono sul dispositivo.
      </Label>

      {/* Avatar Section */}
      <View style={[styles.avatarSection, { marginTop: sectionGap }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            b.photoUri ? 'Sostituisci foto profilo' : 'Aggiungi foto profilo'
          }
          accessibilityHint="Apre il selettore immagini di sistema"
          disabled={b.busy || b.devSandbox}
          onPress={() => void b.pickPhoto()}
          style={[
            styles.avatarCircle,
            {borderWidth:1},
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: palette.surface,
              borderColor:palette.line,
            },
          ]}
        >
          {b.photoUri ? (
            <Image
              source={{ uri: b.photoUri }}
              onError={b.reportPhotoUnavailable}
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
              }}
            />
          ) : (
            <View
              style={[
                styles.plusBadge,
                {
                  backgroundColor: palette.active,
                },
              ]}
            >
              <Image
                source={require('../../../assets/onboarding/photo-plus.png')}
                style={{
                  width: 18,
                  height: 18,
                  tintColor: palette.ink,
                }}
                resizeMode="contain"
                accessible={false}
              />
            </View>
          )}
        </Pressable>

        <Label style={[styles.photoLabel, { color: palette.muted }]}>
          {b.photoUri ? 'Modifica foto profilo' : 'Aggiungi foto profilo'}
        </Label>

        {/* Remove photo button if photo is present */}
        {!!(b.active ? b.state?.draft.photoUri : b.state?.profile.photoUri) && (
          <Button
            disabled={b.busy}
            label="Rimuovi foto"
            onPress={() => void b.pickPhoto(true)}
            style={{ marginTop: 4 }}
          >
            <Label style={{ color: palette.accent }}>Rimuovi foto</Label>
          </Button>
        )}

        {/* Non-blocking photo error message */}
        {!!b.photoError && (
          <Label
            accessibilityLiveRegion="polite"
            style={[styles.errorMessage, { color: palette.accent }]}
          >
            {b.photoError}
          </Label>
        )}
      </View>

      {/* Name Input */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            accessibilityLabel="Il tuo nome, facoltativo"
            accessibilityHint="Inserisci il tuo nome da mostrare localmente"
            editable={!b.busy}
            value={realValue}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={showOverlay ? '' : 'Il tuo nome, facoltativo'}
            placeholderTextColor={palette.muted}
            maxLength={96}
            autoCapitalize="words"
            style={[
              styles.input,
              {borderWidth:1},
              {
                backgroundColor: palette.surface,
                color: palette.ink,
                borderColor:palette.line,
              },
            ]}
          />
          {/* Animated placeholder overlay */}
          {showOverlay && placeholderOverlay.length > 0 && realValue.length === 0 && (
            <View
              pointerEvents="none"
              accessible={false}
              aria-hidden={true}
              importantForAccessibility="no-hide-descendants"
              style={styles.overlayWrapper}
            >
              <Text
                style={[
                  styles.overlayText,
                  {
                    color: palette.muted,
                  },
                ]}
              >
                {placeholderOverlay}
              </Text>
            </View>
          )}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 0,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  plusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  inputSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  inputWrapper: {
    width: '100%',
    maxWidth: 354,
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    minHeight: 52,
    borderRadius: 26,
    paddingHorizontal: 20,
    fontFamily: body,
    fontSize: 17,
  },
  overlayWrapper: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  overlayText: {
    fontFamily: body,
    fontSize: 17,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 36,
    marginBottom: 16,
  },
  skipPill: {
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
});
