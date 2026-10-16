import React,{useState} from 'react';
import {Image,Pressable,TextInput,View,StyleSheet} from 'react-native';
import {Label,Button,Icon,useTheme} from './Atoms';
import {body} from '../theme';
import type {OnboardingBinding} from '../useOnboarding';
import {ApprovedOnboardingScene} from './onboarding/ApprovedOnboardingScene';
// Rebuild the animated presentation after an external photo activity. Fabric
// otherwise can recommit cached intro styles over the settled identity scene.
// The controller owns the draft; only presentation state is recreated.
export function OnboardingScreen({binding}:{binding:OnboardingBinding}){return <ApprovedOnboardingScene key={binding.photoPresentationRevision??0} binding={binding}/>}
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
  const [name, setName] = React.useState(b.state?.profile.name ?? '');
  return (
    <View style={{ gap: 8, paddingVertical: 12 }}>
      <Label strong>Dati sul dispositivo</Label>
      <IdentityPhoto binding={b} />
      <TextInput
        accessibilityLabel="Nome nel profilo"
        value={name}
        onChangeText={value=>setName(Array.from(value).slice(0,48).join(''))}
        maxLength={96}
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
