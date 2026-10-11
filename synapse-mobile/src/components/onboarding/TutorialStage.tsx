import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Label, Button, Icon, useTheme } from '../Atoms';
import { heading, body } from '../../theme';
import { ActionButton } from './ActionButton';
import {
  TUTORIAL,
  DEMO_CARDS,
  type TutorialDemo,
} from '../../content/onboarding';
import {
  ONBOARDING_MOTION,
  type MotionEnvironment,
} from '../../content/onboardingPresentation';
import { TutorialGestureSlot } from '../OnboardingMotionSlots';
import type { OnboardingBinding } from '../../useOnboarding';

export interface TutorialStageProps {
  binding: OnboardingBinding;
  motion: MotionEnvironment;
}

export function TutorialStage({ binding: b, motion }: TutorialStageProps) {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();

  const tutorial = TUTORIAL[b.tutorialIndex];
  const demo = b.demo;

  const currentCard = DEMO_CARDS[demo.card];
  const nextCard = DEMO_CARDS[demo.card === 0 ? 1 : 0];

  const handleNextCardPress = () => {
    b.interactDemo((d) => d.swipe(d.card === 0 ? 'next' : 'previous'));
  };

  const handleCategoryPress = (category: string, cardIndex: 0 | 1) => {
    b.interactDemo((d) => {
      d.category = category;
      d.card = cardIndex;
    });
  };

  const handleOpenToggle = () => {
    b.interactDemo((d) => {
      d.opened = !d.opened;
    });
  };

  const handleSaveToggle = () => {
    b.interactDemo((d) => {
      d.saved = !d.saved;
    });
  };

  const handleDestinationPress = (dest: 'home' | 'profile' | 'search') => {
    b.interactDemo((d) => {
      d.destination = dest;
    });
  };

  return (
    <View style={styles.container}>
      {/* Step label */}
      <Label style={[styles.stepLabel, { color: palette.muted }]}>
        {b.tutorialIndex + 1} di 4 · Dimostrazione
      </Label>

      {/* Title */}
      <Label
        accessibilityRole="header"
        style={[
          styles.title,
          {
            fontFamily: heading,
            color: palette.ink,
          },
        ]}
      >
        {tutorial.title}
      </Label>

      {/* Body */}
      <Label style={[styles.bodyText, { color: palette.ink }]}>
        {tutorial.body}
      </Label>

      {/* Interactive Scene */}
      <View style={styles.sceneContainer}>
        {/* Moment 1: Scrolling cards */}
        {b.tutorialIndex === 0 && (
          <TutorialGestureSlot
            cardIndex={demo.card as 0 | 1}
            hintStopped={demo.hintStopped}
            motion={motion}
            onInteract={() => b.interactDemo(() => {})}
            onSwipe={(dir) => b.interactDemo((d) => d.swipe(dir))}
          >
            <View style={styles.cardsStack}>
              {/* Primary card */}
              <View
                style={[
                  styles.demoCard,
                  {
                    backgroundColor: palette.surface,
                  },
                ]}
              >
                <Label style={[styles.cardCategory, { color: palette.muted }]}>
                  {currentCard.category}
                </Label>
                <Label
                  style={[
                    styles.cardTitle,
                    {
                      fontFamily: heading,
                      color: palette.ink,
                    },
                  ]}
                >
                  {currentCard.title}
                </Label>
                <Label style={[styles.cardPreview, { color: palette.ink }]}>
                  {currentCard.preview}
                </Label>
              </View>

              {/* Peeking second card (static endpoint for B, 92dp visible) */}
              <View
                style={[
                  styles.peekCard,
                  {
                    backgroundColor: palette.surface,
                  },
                ]}
              >
                <Label style={[styles.cardCategory, { color: palette.muted }]}>
                  {nextCard.category}
                </Label>
                <Label
                  style={[
                    styles.peekCardTitle,
                    {
                      fontFamily: heading,
                      color: palette.ink,
                    },
                  ]}
                >
                  {nextCard.title}
                </Label>
                {/* Vertical terracotta arrow indicator */}
                <View style={styles.scrollArrow}>
                  <Text style={[styles.arrowGlyph, { color: palette.accent }]}>
                    ↑
                  </Text>
                </View>
              </View>

              {/* Accessible button for switching cards */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Prova un’altra scheda"
                accessibilityHint="Passa alla scheda dimostrativa successiva"
                onPress={handleNextCardPress}
                style={styles.accessibleCardButton}
              >
                <Label style={{ color: palette.accent, fontSize: 17, fontWeight: '600' }}>
                  Prova un’altra scheda
                </Label>
              </Pressable>
            </View>
          </TutorialGestureSlot>
        )}

        {/* Moment 2: Category Rail Demo */}
        {b.tutorialIndex === 1 && (
          <View style={styles.categoriesScene}>
            {/* Demo rail: Per Te, Scienza, Arte */}
            <View style={styles.railRow}>
              {[
                { id: 'all', label: 'Per Te', cardIdx: 0 as const },
                { id: 'science', label: 'Scienza', cardIdx: 0 as const },
                { id: 'arts', label: 'Arte', cardIdx: 1 as const },
              ].map((cat) => {
                const isSelected = demo.category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    accessibilityRole="tab"
                    accessibilityLabel={cat.label}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleCategoryPress(cat.id, cat.cardIdx)}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: isSelected
                          ? palette.active
                          : palette.surface,
                      },
                    ]}
                  >
                    <Label
                      style={{
                        color: palette.ink,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {cat.label}
                    </Label>
                  </Pressable>
                );
              })}
            </View>

            {/* Single demo card showing corresponding content */}
            <View
              style={[
                styles.demoCard,
                {
                  backgroundColor: palette.surface,
                  marginTop: 20,
                },
              ]}
            >
              <Label style={[styles.cardCategory, { color: palette.muted }]}>
                {demo.card === 1 ? 'Arte' : 'Scienza'}
              </Label>
              <Label
                style={[
                  styles.cardTitle,
                  {
                    fontFamily: heading,
                    color: palette.ink,
                  },
                ]}
              >
                {demo.card === 1 ? 'Origami' : 'Aurora polare'}
              </Label>
              <Label style={[styles.cardPreview, { color: palette.ink }]}>
                Categorie nuove possono comparire con i tuoi interessi e i contenuti disponibili.
              </Label>
            </View>

            <Label style={[styles.instructionHint, { color: palette.accent }]}>
              Scegli una categoria per provare.
            </Label>
          </View>
        )}

        {/* Moment 3: Personalization & Save Demo */}
        {b.tutorialIndex === 2 && (
          <View style={styles.personalizationScene}>
            <View
              style={[
                styles.demoCard,
                {
                  backgroundColor: palette.surface,
                },
              ]}
            >
              <Label style={[styles.cardCategory, { color: palette.muted }]}>
                Arte
              </Label>
              <Label
                style={[
                  styles.cardTitle,
                  {
                    fontFamily: heading,
                    color: palette.ink,
                  },
                ]}
              >
                Origami
              </Label>
              <Label style={[styles.cardPreview, { color: palette.ink }]}>
                {demo.opened
                  ? 'Nell’origami tradizionale la forma nasce da pieghe successive: basta un foglio, senza tagli.'
                  : 'Una piega dopo l’altra, un foglio diventa una forma.'}
              </Label>

              {/* Action buttons inside scene */}
              <View style={styles.cardActionsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    demo.opened ? 'Chiudi esempio' : 'Apri esempio'
                  }
                  onPress={handleOpenToggle}
                  style={[
                    styles.actionPill,
                    {
                      backgroundColor: palette.active,
                    },
                  ]}
                >
                  <Label style={{ color: palette.ink, fontWeight: '600' }}>
                    {demo.opened ? 'Chiudi esempio' : 'Apri esempio'}
                  </Label>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    demo.saved
                      ? 'Rimuovi esempio dai salvati'
                      : 'Salva esempio'
                  }
                  onPress={handleSaveToggle}
                  style={[
                    styles.actionPill,
                    {
                      backgroundColor: palette.active,
                      flexDirection: 'row',
                      gap: 4,
                    },
                  ]}
                >
                  {demo.saved && (
                    <Text style={{ color: palette.ink, fontWeight: '600' }}>
                      ✓{' '}
                    </Text>
                  )}
                  <Label style={{ color: palette.ink, fontWeight: '600' }}>
                    {demo.saved
                      ? 'Rimuovi dai salvati'
                      : 'Salva esempio'}
                  </Label>
                </Pressable>
              </View>
            </View>

            <Label style={[styles.instructionHint, { color: palette.accent }]}>
              L’esempio non cambia il tuo profilo.
            </Label>
          </View>
        )}

        {/* Moment 4: Dock & Destinations Demo */}
        {b.tutorialIndex === 3 && (
          <View style={styles.dockScene}>
            {/* Scene representation based on selected destination */}
            <View
              style={[
                styles.destinationBox,
                {
                  backgroundColor: palette.surface,
                },
              ]}
            >
              {demo.destination === 'home' && (
                <>
                  <Label
                    style={[
                      styles.destTitle,
                      {
                        fontFamily: heading,
                        color: palette.ink,
                      },
                    ]}
                  >
                    Home · Scoperte
                  </Label>
                  <Label style={[styles.destDesc, { color: palette.muted }]}>
                    Il tuo feed quotidiano di curiosità e anteprime Wikipedia.
                  </Label>
                </>
              )}
              {demo.destination === 'profile' && (
                <>
                  <Label
                    style={[
                      styles.destTitle,
                      {
                        fontFamily: heading,
                        color: palette.ink,
                      },
                    ]}
                  >
                    Profilo
                  </Label>
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <Label style={{ color: palette.ink }}>• Salvati</Label>
                    <Label style={{ color: palette.ink }}>• Cronologia</Label>
                    <Label style={{ color: palette.ink }}>• Impostazioni</Label>
                  </View>
                </>
              )}
              {demo.destination === 'search' && (
                <>
                  <Label
                    style={[
                      styles.destTitle,
                      {
                        fontFamily: heading,
                        color: palette.ink,
                      },
                    ]}
                  >
                    Cerca su Wikipedia
                  </Label>
                  <View
                    style={[
                      styles.fakeSearchBox,
                      {
                        backgroundColor: palette.paper,
                        borderColor: palette.line,
                      },
                    ]}
                  >
                    <Label style={{ color: palette.muted }}>
                      Cerca un argomento…
                    </Label>
                    <Icon name="shuffle-variant" size={20} color={palette.muted} />
                  </View>
                </>
              )}
            </View>

            {/* Dock capsule + search button */}
            <View testID="tutorial-dock-slot" style={styles.dockControlsRow}>
              <View
                style={[
                  styles.dockCapsule,
                  {
                    backgroundColor: palette.surface,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="tab"
                  accessibilityLabel="Home"
                  accessibilityState={{ selected: demo.destination === 'home' }}
                  onPress={() => handleDestinationPress('home')}
                  style={[
                    styles.dockTab,
                    demo.destination === 'home' && {
                      backgroundColor: palette.active,
                      borderRadius: 24,
                    },
                  ]}
                >
                  <Icon
                    name="home-outline"
                    size={20}
                    color={palette.ink}
                  />
                  <Label style={{ color: palette.ink, fontWeight: '600', marginLeft: 4 }}>
                    Home
                  </Label>
                </Pressable>

                <Pressable
                  accessibilityRole="tab"
                  accessibilityLabel="Profilo"
                  accessibilityState={{ selected: demo.destination === 'profile' }}
                  onPress={() => handleDestinationPress('profile')}
                  style={[
                    styles.dockTab,
                    demo.destination === 'profile' && {
                      backgroundColor: palette.active,
                      borderRadius: 24,
                    },
                  ]}
                >
                  <Icon
                    name="account-outline"
                    size={20}
                    color={palette.ink}
                  />
                  <Label style={{ color: palette.ink, fontWeight: '600', marginLeft: 4 }}>
                    Profilo
                  </Label>
                </Pressable>
              </View>

              {/* Search button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerca"
                accessibilityState={{ selected: demo.destination === 'search' }}
                onPress={() => handleDestinationPress('search')}
                style={[
                  styles.searchButton,
                  {
                    backgroundColor:
                      demo.destination === 'search'
                        ? palette.active
                        : palette.surface,
                  },
                ]}
              >
                <Icon name="magnify" size={24} color={palette.ink} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Hint text at bottom */}
      <Label style={[styles.hintText, { color: palette.muted }]}>
        {tutorial.hint}
      </Label>

      {/* Footer controls: Back + Continua + Salta */}
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

        <ActionButton
          label="Continua"
          onPress={() => b.navigate('next')}
          disabled={b.busy}
          motion={motion}
        />

        <Button
          label="Salta tutorial"
          disabled={b.busy}
          onPress={() => b.navigate('skip')}
          style={[
            styles.skipButton,
            {
              backgroundColor: palette.surface,
            },
          ]}
        >
          <Label style={{ color: palette.ink }}>Salta</Label>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    lineHeight: 43,
    minHeight: 86,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 24,
  },
  sceneContainer: {
    marginBottom: 20,
  },
  cardsStack: {
    gap: 16,
  },
  demoCard: {
    minHeight: 180,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
  },
  peekCard: {
    height: 92,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardCategory: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 10,
  },
  peekCardTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  cardPreview: {
    fontSize: 17,
    lineHeight: 24,
  },
  scrollArrow: {
    position: 'absolute',
    right: 24,
    top: 30,
  },
  arrowGlyph: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  accessibleCardButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  categoriesScene: {
    gap: 12,
  },
  railRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryTab: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionHint: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  personalizationScene: {
    gap: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  actionPill: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockScene: {
    gap: 16,
  },
  destinationBox: {
    minHeight: 140,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'center',
  },
  destTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
  },
  destDesc: {
    fontSize: 16,
    lineHeight: 24,
  },
  fakeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  dockControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dockCapsule: {
    flexDirection: 'row',
    borderRadius: 30,
    padding: 6,
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    minHeight: 56,
  },
  dockTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
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
  skipButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
});
