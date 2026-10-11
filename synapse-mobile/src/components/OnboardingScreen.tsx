import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Label, Button, Icon, useTheme } from './Atoms';
import { heading, body } from '../theme';
import type { OnboardingBinding } from '../useOnboarding';
import { OnboardingTitleSlot } from './OnboardingMotionSlots';
import { IntroStage } from './onboarding/IntroStage';
import { IdentityStage } from './onboarding/IdentityStage';
import { InterestsStage } from './onboarding/InterestsStage';
import { TutorialStage } from './onboarding/TutorialStage';
import { PreparationStage } from './onboarding/PreparationStage';
import type { MotionEnvironment } from '../content/onboardingPresentation';

export function OnboardingScreen({ binding: b }: { binding: OnboardingBinding }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();

  // Boot error or uninitialized state
  if (!b.state || b.bootError) {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          paddingTop: insets.top + 40,
          gap: 20,
          justifyContent: 'center',
          backgroundColor: palette.paper,
        }}
      >
        <Label accessibilityLiveRegion="polite">
          {b.bootError || 'Apro la configurazione sul telefono…'}
        </Label>
        {!!b.bootError && (
          <Button label="Riprova" onPress={() => void b.retryBoot()}>
            <Label>Riprova</Label>
          </Button>
        )}
      </View>
    );
  }

  const motion: MotionEnvironment = {
    reduced: b.reduced,
    appActive: b.appActive,
    visible: b.active,
  };

  const titleKey =
    b.stage === 'identity' || b.stage === 'interests'
      ? 'about-you'
      : b.stage === 'tutorial'
      ? `tutorial-${b.tutorialIndex}`
      : b.stage!;

  const usableHeight = height - insets.top - insets.bottom;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top back button for Identity stage */}
      {b.stage === 'identity' && (
        <View
          style={[
            styles.topBackHeader,
            {
              paddingTop: insets.top + 12,
            },
          ]}
        >
          <Button
            label="Torna all’introduzione"
            disabled={b.busy}
            onPress={() => b.navigate('back')}
            style={styles.headerBackButton}
          >
            <Icon name="arrow-left" size={24} />
          </Button>
        </View>
      )}

      {/* Top back button for Interests stage */}
      {b.stage === 'interests' && (
        <View
          style={[
            styles.topBackHeader,
            {
              paddingTop: insets.top + 12,
            },
          ]}
        >
          <Button
            label="Torna a nome e foto"
            disabled={b.busy}
            onPress={() => b.navigate('back')}
            style={styles.headerBackButton}
          >
            <Icon name="arrow-left" size={24} />
          </Button>
        </View>
      )}

      {/* Intro Stage has its own flex:1 layout */}
      {b.stage === 'intro' ? (
        <View style={{ flex: 1, paddingTop: insets.top + 24 }}>
          <IntroStage
            motion={motion}
            onNext={() => b.navigate('next')}
            busy={b.busy}
            bottomInset={insets.bottom}
          />
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop:
              b.stage === 'identity' || b.stage === 'interests'
                ? 12
                : insets.top + 24,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          {/* Shared Title Slot for Identity & Interests */}
          {(b.stage === 'identity' || b.stage === 'interests') && (
            <OnboardingTitleSlot
              title="Parlami un po’ di te"
              titleKey={titleKey}
              motion={motion}
            />
          )}

          {b.stage === 'identity' && (
            <IdentityStage
              binding={b}
              motion={motion}
              usableHeight={usableHeight}
              fontScale={fontScale}
            />
          )}

          {b.stage === 'interests' && (
            <InterestsStage binding={b} motion={motion} />
          )}

          {b.stage === 'tutorial' && (
            <TutorialStage binding={b} motion={motion} />
          )}

          {b.stage === 'preparation' && (
            <PreparationStage binding={b} motion={motion} />
          )}

          {/* Dev sandbox banner */}
          {b.devSandbox && (
            <Button
              label="Esci dall’anteprima di sviluppo"
              onPress={b.closeDevelopment}
              style={{ marginTop: 20 }}
            >
              <Label>Esci dall’anteprima</Label>
            </Button>
          )}

          {/* Global non-blocking controller error */}
          {!!b.error && (
            <Label
              accessibilityLiveRegion="polite"
              style={{ color: palette.accent, marginTop: 12, textAlign: 'center' }}
            >
              {b.error}
            </Label>
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

export function IdentityPhoto({ binding: b }: { binding: OnboardingBinding }) {
  const { palette } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={b.photoUri ? 'Sostituisci foto' : 'Aggiungi foto'}
        disabled={b.busy || b.devSandbox}
        onPress={() => void b.pickPhoto()}
        style={{
          minHeight: 80,
          minWidth: 80,
          borderRadius: 48,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {b.photoUri ? (
          <Image
            source={{ uri: b.photoUri }}
            onError={b.reportPhotoUnavailable}
            style={{ width: 80, height: 80, borderRadius: 40 }}
          />
        ) : (
          <Icon name="account-plus-outline" size={32} />
        )}
      </Pressable>
      {!!(b.active ? b.state?.draft.photoUri : b.state?.profile.photoUri) && (
        <Button disabled={b.busy} label="Rimuovi foto" onPress={() => void b.pickPhoto(true)}>
          <Label>Rimuovi foto</Label>
        </Button>
      )}
      {!!b.photoError && (
        <Label accessibilityLiveRegion="polite">{b.photoError}</Label>
      )}
    </View>
  );
}

export function LocalProfileEditor({ binding: b }: { binding: OnboardingBinding }) {
  const { palette } = useTheme();
  const [name, setName] = useState(b.state?.profile.name ?? '');
  return (
    <View style={{ gap: 8, paddingVertical: 12 }}>
      <Label strong>Dati sul dispositivo</Label>
      <IdentityPhoto binding={b} />
      <TextInput
        accessibilityLabel="Nome nel profilo"
        value={name}
        onChangeText={setName}
        maxLength={48}
        editable={!b.busy}
        placeholder="Il tuo nome"
        placeholderTextColor={palette.muted}
        style={{
          fontFamily: body,
          fontSize: 18,
          color: palette.ink,
          padding: 12,
          backgroundColor: palette.surface,
          borderRadius: 24,
        }}
      />
      <Button disabled={b.busy} label="Salva nome" onPress={() => void b.saveProfile(name)}>
        <Label>Salva nome</Label>
      </Button>
      <Label muted>
        Nome e foto non creano un account e non vengono inviati a Gemini.
      </Label>
      {!!b.error && <Label accessibilityLiveRegion="polite">{b.error}</Label>}
    </View>
  );
}

const styles = StyleSheet.create({
  topBackHeader: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
