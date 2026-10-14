import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Keyboard,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Label, useTheme } from '../Atoms';
import { body } from '../../theme';
import {ProfilePhotoSlot} from './ProfilePhotoSlot';
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
  embedded?: boolean;
  onNameFocus?: (focused:boolean)=>void;
}

export function IdentityStage({
  binding: b,
  motion,
  usableHeight,
  fontScale,
  embedded=false,
  onNameFocus,
}: IdentityStageProps) {
  const { palette } = useTheme();

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
    // Persistent scene layers are mounted before they become visible. Pause
    // offscreen/background work without marking an untouched suggestion stopped.
    if (!motion.visible || !motion.appActive) {
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
      return;
    }
    if (motion.reduced || realValue.length > 0) {
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
    onNameFocus?.(true);
    stoppedRef.current=true;
    if(loopTimerRef.current){clearTimeout(loopTimerRef.current);loopTimerRef.current=null}
    let visible=Array.from(placeholderOverlay);
    const erase=()=>{if(!visible.length){setShowOverlay(false);loopTimerRef.current=null;return}visible.pop();setPlaceholderOverlay(visible.join(''));loopTimerRef.current=setTimeout(erase,ONBOARDING_MOTION.placeholder.focusEraseInterval)};
    if(showOverlay)erase();else stopLoop();
  };

  const handleBlur = () => {
    Keyboard.dismiss();
    setIsFocused(false);
    onNameFocus?.(false);
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


  return (
    <View style={styles.container}>
      {/* Subtitle */}
      {!embedded&&<Label style={[styles.subtitle, { color: palette.muted }]}>
        Come ti chiami? Nome e foto sono facoltativi e rimangono sul dispositivo.
      </Label>}

      {/* Avatar Section */}
      <View style={[styles.avatarSection, { marginTop: embedded?0:sectionGap }]}>
        <ProfilePhotoSlot binding={b} motion={motion} size={avatarSize} compact={false}/>

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
      <View style={[styles.inputSection,{marginTop:24}]}>
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
