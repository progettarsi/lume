# Onboarding Patch — Fase B: Rapporto di Consegna UI

Data: 11 ottobre 2026  
Ramo Git: `onboarding-patch`  
Progetto: `synapse-mobile`  

---

## 1. File modificati e creati

### File creati:
- `src/components/onboarding/ActionButton.tsx`: Controllo action per "Continua" ed "Entra". Forma 50dp / hitbox 56×56dp costante, freccia 24×17 invariata, animazione del bounce (2dp down in 70ms, overshoot -1dp in 160ms easeOut, feedback ridotto con reduced motion).
- `src/components/onboarding/IntroStage.tsx`: Schermata di introduzione con gruppo lampadina (48.8×72.9dp), badge di contrasto per tema chiaro (128×128dp), alone raggi (105×89.5dp) con offset -27dp e animazione assegnata (delay 120ms, duration 260ms, scale 0.94→1, opacity 0→1 easeOut), titolo "Benvenuto!", sottotesto fedele (max 310dp) e pulsante Continua a comparsa ritardata (180ms delay, 220ms duration) con blocco tocco/focus durante l'opacità zero.
- `src/components/onboarding/IdentityStage.tsx`: Schermata Nome e Foto. Avatar 140dp (o 112dp in modalità compatta), badge `photo-plus` (40dp) / foto picker di sistema con fallback d'errore non bloccante. Input reale con overlay inerte per placeholder animato ("Alex" → "Sofia" → "Andrea", type 90ms, erase 45ms, pausa 1100ms, focus erase 16ms), cancellazione immediata al primo input e nessun ciclo post-interazione. Pillola "Salta" dedicata a questo passaggio.
- `src/components/onboarding/InterestChip.tsx`: Chip argomenti con transizione crossfade 120ms easeOut su fondo e check, layout fisso e ruolo accessibile `checkbox` con stato `checked`.
- `src/components/onboarding/InterestsStage.tsx`: Griglia categorie dal registro canonico, nessuna duplicazione segnaposto, wrapping chips, decorazioni organiche di sfondo (`flower`, `soft-boom`) opacità 0.22 con >65% fuori dal viewport e pointerEvents none.
- `src/components/onboarding/TutorialStage.tsx`: Implementazione completa dei quattro momenti progettati da Codex:
  1. *Scorrimento*: scheda "Aurora polare", seconda scheda peeking "Origami" (92dp visibili), freccia indicatore terracotta e pulsante accessibile "Prova un’altra scheda".
  2. *Categorie*: rail demo "Per Te", "Scienza", "Arte" collegato allo stato `demo.category`, aggiornamento scheda e hint.
  3. *Personalizzazione*: scheda Origami con pulsanti "Apri esempio" / "Chiudi esempio" ed "Salva esempio" / "Rimuovi dai salvati" (con check), spiegazione locale e nessuna interferenza con il profilo reale.
  4. *Dock*: replica del Dock (Home, Profilo, Cerca) con aggiornamento dimostrativo della scena (riepilogo, 3 righe profilo, o search box Wikipedia inerte).
- `src/components/onboarding/PreparationStage.tsx`: Titolo fedele a due righe ("Sto preparando\ntutto per te…"), composizione centrale con cookie (132dp) e bussola (52dp), decorazioni organiche (`soft-burst`, `puffy` opacità 0.22), stato e messaggi reali dal controller (nessun contatore sintetico o percentuale fittizia), ripieghi per errore/offline con Riprova ed Entra.
- `tests/onboarding-ui.test.cjs`: Test di transpilazione, esportazione ed aderenza visiva/accessibilità dei componenti onboarding.
- `docs/ONBOARDING-UI-DELIVERY.md`: Questo rapporto di consegna.

### File modificati:
- `src/components/OnboardingScreen.tsx`: Orchestratore principale rifattorizzato per delegare ai nuovi componenti modulari, mantenendo i contratti pubblici (`OnboardingScreen`, `IdentityPhoto`, `LocalProfileEditor`).

---

## 2. Componenti realizzati

1. `ActionButton`: wrapper per Continua / Entra con hitbox 56×56 stabile, animazione di compressione elastica su sfondo e freccia centrata con tinta adattiva.
2. `IntroStage`: scena intro a pieno schermo con lampadina, alone raggi posizionato ed animato, titolo e azione ritardata.
3. `IdentityStage`: modulo per la raccolta opzionale di nome e avatar, con overlay placeholder inerte e gestione errori foto non bloccante.
4. `InterestChip`: chip reattiva accessibile per selezione categorie.
5. `InterestsStage`: lista categorie del catalogo con decorazioni organiche di contorno.
6. `TutorialStage`: storyboard dimostrativo su 4 scene isolate in memoria.
7. `PreparationStage`: schermata di attesa e completamento basata sul feed reale.

---

## 3. Contratti utilizzati

Da `useOnboarding.ts` / `content/onboarding.ts`:
- `b.stage`, `b.tutorialIndex`, `b.active`, `b.revision`, `b.busy`
- `b.draft`, `b.state.profile`
- `b.navigate('next' | 'back' | 'skip' | 'enter')`
- `b.updateDraft({ name })`, `b.toggleInterest(id)`
- `b.options` (categorie reali con `id`, `label`, `selectable`)
- `b.photoUri`, `b.photoError`, `b.pickPhoto(remove?)`, `b.reportPhotoUnavailable`
- `b.demo`, `b.interactDemo(fn)` (stato isolato dimostrativo)
- `b.preparation` (`kind`, `message`, `canEnter`, `canRetry`)
- `b.reduced`, `b.appActive`, `b.motionEnabled`
- `b.saveProfile(name)` per `LocalProfileEditor`

---

## 4. Animazioni implementate (Fase B)

- **Raggi intro**: ritardo 120ms, durata 260ms, opacità 0→1, scala 0.94→1 con curva cubica `easeOut` [0.22, 1, 0.36, 1]. In reduced motion: immediatamente visibili e a scala 1.
- **Pulsante Continua intro**: ritardo 180ms, comparsa in 220ms `easeOut`. Hitbox e focus disabilitati (pointerEvents 'none', aria-hidden) finché l'opacità è zero. In reduced motion: immediatamente attivo e visibile.
- **Press feedback Continua / Salta**: translateY di 2dp in 70ms e ritorno con overshoot a -1dp in 160ms; freccia e label immobili; hitbox 56×56 costante. In reduced motion: transizione bypassata.
- **Placeholder animato nome**: ciclo di digitazione ("Alex", "Sofia", "Andrea") a 90ms/lettera, pausa 1100ms, cancellazione a 45ms/lettera; cancellazione rapida a 16ms/lettera al focus. Overlay puramente visivo, campo nativo isolato. Interruzione immediata e definitiva al primo input reale `onChangeText`.
- **Selezione chip interessi**: crossfade 120ms `easeOut` del colore di sfondo (`interpolateColor` da `surface` ad `active`) e comparsa del segno di spunta senza deformare il testo o il layout.

---

## 5. Punti di integrazione lasciati per Codex (Fase C)

- **Rotazione e morphing organico di sfondo dei pulsanti (`OrganicShapeSlot`)**: rimangono gli endpoint statici da asset originali (`button-identity.png`, `button-interests.png`, `cookie-preparation.png`).
- **Forme organiche fluttuanti di contorno**: posizionamento statico a opacità 0.22 (`flower`, `soft-boom`, `soft-burst`, `puffy`). Il ciclo lento di traslazione e rotazione (24s) è riservato a Codex.
- **Tipografia animata dei titoli**: `OnboardingTitleSlot` mantiene il rendering statico del titolo completo finale per ciascuna schermata (`titleKey='about-you'` condiviso per identity e interests).
- **Gesto di scorrimento verticale interattivo nel tutorial**: `TutorialGestureSlot` incapsula le due schede statiche; Codex implementerà il pan gesture responder UI-thread con soglia 0.22, spring physics e hint bounce temporizzato.
- **Regia delle transizioni tra schermate e verso Home**: gestita tramite cambi di stato e scrolling views con fallback pulito.

---

## 6. Adattamenti responsive

- Schermi con altezza utile < 700dp o `fontScale` ≥ 1.3: dimensione avatar ridotta da 140dp a 112dp e gap ridotto da 32dp a 20dp.
- Schermi con larghezza < 360dp: dimensione del titolo scalata da 36/43dp a 32/39dp per evitare troncamenti.
- `KeyboardAvoidingView` e `ScrollView` con `keyboardShouldPersistTaps="handled"` per garantire visibilità e accessibilità dell'input nome e dei comandi con tastiera aperta o testo ingrandito.

---

## 7. Verifiche eseguite

- **TypeScript compilation**:
  `tsc --noEmit` completato con 0 errori.
  `tsc -p tsconfig.test.json` completato con 0 errori.
- **Test suite completa**:
  `node --test tests/*.test.cjs` eseguito con successo: **206 test passati, 0 falliti**.
- **Esportazione bundle Android (Hermes)**:
  `expo export --platform android` completato con successo (`index-39f281e370cee66779ad3ec74514e716.hbc`, 17 asset).
- **Modifiche preesistenti della fase A**: integralmente conservate nel working tree nei 9 file protetti.

## Esito della revisione C — 11 ottobre 2026

Consegna B riesaminata indipendentemente rispetto alle fondamenta, ai riferimenti e al workspace modificato. Slot C completati; corretti SVG/palette dell'intro, spaziatura identità/footer, raster con fondo opaco, tastiera e cancellazione dei timer placeholder. Su richiesta successiva dell'utente, il tutorial ora riusa i componenti reali dell'app, mantenendo gli esempi locali isolati. La versione consegnata da B rimane documentata sopra come evidenza storica; il risultato corrente e le verifiche sono in [ONBOARDING-0.1.13-REVIEW.md](ONBOARDING-0.1.13-REVIEW.md).
