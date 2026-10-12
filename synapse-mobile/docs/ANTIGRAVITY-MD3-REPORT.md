# Esito Implementazione Loader MD3 Nativo

## 1. Obiettivo dell'intervento
Realizzazione del componente loader MD3 nativo per React Native Reanimated 4 e `react-native-svg` dedicato alla schermata di preparazione/onboarding di Synapse Mobile (`synapse-mobile`).
Vincoli di sistema rispettati:
- Nessuna modifica ai file esistenti dell'applicazione.
- Nessun commit git, nessuna credenziale.
- Root e transizioni del coordinatore intatte.
- Zero timer JavaScript per-frame; esecuzione vincolata al thread UI.

## 2. File Creati
1. **[`src/content/materialLoading.ts`](file:///c:/Users/Augusto/Documents/Scrolls/synapse-mobile/src/content/materialLoading.ts)**:
   - Integrazione delle curve ufficiali da `../synapse-onboarding-motion-prototype/public/assets/synapse/md3-morphs.json` generate tramite le forme `androidx.graphics.shapes` / `MaterialShapes` (7 forme: `SOFT_BURST`, `COOKIE_9`, `PENTAGON`, `PILL`, `SUNNY`, `COOKIE_4`, `OVAL`).
   - Durata per stadio: 650 ms (ciclo totale di 7 forme: 4550 ms).
   - Risposta della molla analitica sottosmorzata del 2° ordine su worklet UI:
     - Rigidezza $k = 200$, fattore di smorzamento $\zeta = 0.6$.
     - $\omega_0 = \sqrt{200} \approx 14.1421356$, $\omega_d = \omega_0 \sqrt{1 - \zeta^2} = 0.8 \omega_0 \approx 11.3137085$.
     - Formula: $1 - e^{-\zeta \omega_0 t} \left(\cos(\omega_d t) + \frac{\zeta}{\sqrt{1 - \zeta^2}} \sin(\omega_d t)\right)$, con $t = f \times 0.65$.
   - Rotazione continua a $50^\circ$ per stadio combinata con rotazione di fase $90^\circ \times \text{spring}$:
     - $\text{rotazione}(base, f, spring) = 140^\circ \times base + 50^\circ \times f + 90^\circ \times spring$.
     - Continuità perfetta al passaggio tra gli stadi ($140^\circ$ ad ogni step).
   - Generazione path SVG cubico Bézier normalizzato (`M ... C ... Z`) su coordinate centrate scalate.

2. **[`src/components/onboarding/MaterialLoadingIndicator.tsx`](file:///c:/Users/Augusto/Documents/Scrolls/synapse-mobile/src/components/onboarding/MaterialLoadingIndicator.tsx)**:
   - Componente nativo TypeScript/React Native con interfaccia:
     ```typescript
     export interface MaterialLoadingSnapshot {
       path: string;
       rotation: number;
     }

     export interface MaterialLoadingIndicatorProps {
       size: number;
       color: string;
       active: boolean;
       reduced: boolean;
       frozen: boolean;
       onFreeze?: (snapshot: MaterialLoadingSnapshot) => void;
       style?: StyleProp<ViewStyle>;
     }
     ```
   - Esecuzione vincolata al thread UI tramite `useAnimatedProps`, `useAnimatedStyle`, `useAnimatedReaction` e `useSharedValue`.
   - **Gestione stato `frozen`**:
     - Quando `frozen` diventa `true`, il percorso `frozenPath` e l'angolo `frozenRotation` vengono congelati istantaneamente allo stato corrente del frame.
     - Viene emesso lo snapshot (`path`, `rotation`) una sola volta per ciclo tramite `runOnJS(onFreezeRef.current)(snapshot)`.
   - **Ripresa senza salti (`active: false` -> `active: true`)**:
     - Alla disattivazione l'animazione viene interrotta conservando la posizione frazionaria `sequenceProgress`.
     - Alla riattivazione la transizione calcola il tempo rimanente per completare il ciclo senza scatti o ripartenze forzate da zero.
   - **Cancellazione on unmount**:
     - `cancelAnimation(sequenceProgress)` registrato in cleanup di tutti gli hook `useEffect`.
   - **Reduced Motion**:
     - Quando `reduced: true`, l'indicatore si posiziona stabilmente su shape 0 a riposo senza animazione continua.

## 3. Verifica e Test
- **Typecheck**:
  - Eseguito `tsc --noEmit` sull'intero repository: esito positivo senza errori (0 errori).
  - Componente pienamente compatibile con l'uso in `ApprovedOnboardingScene.tsx`:
    ```tsx
    <MaterialLoadingIndicator
      size={104}
      color={palette.active}
      active={active && preparing}
      reduced={reduced}
      frozen={ready}
      onFreeze={acceptFreeze}
    />
    ```
- **Test Unitari Funzionali**:
  - Verificata la validità delle 7 coppie di curve MD3 da `md3-morphs.json` (tutte chiuse, tra 22 e 58 curve cubiche per forma).
  - Verificata la convergenza della formula di molla analitica $k=200, \zeta=0.6$ (valore $0$ a $f=0$, picco d'overshoot $\approx 1.0788$ a $f=0.5$, valore $1$ a $f=1$).
  - Verificata la continuità della rotazione ($140^\circ \times base + 50^\circ \times f + 90^\circ \times spring$).
  - Verificato il congelamento immediato su `frozen: true` con emissione singola dello snapshot su `onFreeze`.
  - Verificata la cancellazione completa all'unmount.
