# Fix Prestazioni, Gesture e Schermate Lume — 14 Ottobre 2026

Questo documento descrive dettagliatamente le cause alla radice, le correzioni architetturali e i contratti preservati per la risoluzione dei problemi critici di performance, fluidità e interazione dell'app nativa `synapse-mobile` (Lume).
È redatto a beneficio di tutti gli agenti LLM e sviluppatori che operano sul codebase, al fine di mantenere gli aggiornamenti sincronizzati, coordinati e conformi alle direttive di `AGENTS.md`.

---

## 1. Sommario Esecutivo delle Modifiche

| Area Critica | Problema Segnalato | Causa alla Radice | Soluzione Applicata | File Modificati |
|---|---|---|---|---|
| **Setup / Onboarding** | Lunga attesa e pulsante bloccato dopo la selezione delle categorie | Ogni chip premuto accodava una scrittura asincrona SQLite in `OnboardingController.draft()`. `navigate('next')` attendeva lo svuotamento della coda e bloccava il thread con `reorderFuture()` sincrono | Coalescenza delle intenzioni di bozza con `draftIntent`; differimento di `reorderFuture()` con `setTimeout(..., 0)` in `persistOnboarding` | `src/content/onboarding.ts`, `src/useLibrary.ts` |
| **Salvataggio Articoli** | Icona centrale a schermo per troppo tempo; icona segnalibro in alto a destra non si riempie | L'icona centrale usava uno stato React e `setTimeout(420ms + 130ms)` sul JS thread; `SaveButton` conteneva un `<View>` assoluto senza `width`/`height` esplicite che collassava a 0 px sul layout Yoga (Android) | Animazione nativa su thread UI con Reanimated (`withSequence`); dimensioni fisse `24x24` e `onPress` nativo garantito su `SaveButton` | `src/components/Feed.tsx`, `src/components/SaveButton.tsx` |
| **Reattività Generale** | Tocchi persi, swipe lenti, navbar non responsiva | Loop continuo di ricarica in `App.tsx` dovuto a `lib.loading` nell'array delle dipendenze di `useEffect`; vincoli di tap troppo rigidi (`maxDistance(7)`, `maxDuration(250)`) | Rimosso `lib.loading` dalle dipendenze; estese le tolleranze di tap su `FeedCard` (`maxDistance: 14`, `maxDuration: 450ms`) | `App.tsx`, `src/components/Feed.tsx` |
| **Blocco Schermata Profilo** | Navigando nel profilo l'app smette di funzionare e nessun tap viene rilevato | `<ScrollView>` in `ScreenLayer` del profilo privo di `style={{flex: 1}}`, collassando a 0 px di altezza utile per l'hit-testing Fabric | Aggiunto `style={{flex: 1}}` allo `ScrollView` del profilo; garantito `pointerEvents="box-none"` su `ScreenLayer` e `style={{flex: 1}}` su `PageScroll` | `App.tsx`, `src/design-system/components.tsx` |

---

## 2. Dettaglio delle Cause e Interventi Architetturali

### 2.1 Onboarding: Coalescenza delle Scritture di Bozza ed Esecuzione Fluida
* **Contesto:** Durante la fase `interests`, l'utente tocca più chip di categoria prima di premere il pulsante per proseguire.
* **Diagnosi:** In `OnboardingController.draft(patch)`, ogni tocco invocava immediatamente `this.write(...)`, accodando una transazione SQLite su `this.tail`. Premere 3–5 categorie generava 3–5 transazioni disco serializzate. Quando l'utente premeva "Continua", `navigate('next')` si accodava in fondo a `this.tail` e impostava `this.busy = true`. Lo schermo rimaneva bloccato con il pulsante disabilitato finché tutte le transazioni non si chiudevano. Inoltre, al completamento degli interessi, `persistOnboarding` eseguiva `reorderFuture()`, che ricalcolava l'ordinamento consigliato di tutti i feed sul thread JS in modo sincrono prima di sbloccare il controller.
* **Correzione:**
  - In `src/content/onboarding.ts`: Introdotto `private draftIntent = 0`. Ogni chiamata a `draft()` incrementa il contatore; se un'operazione accodata sulla coda `this.tail` si risveglia ma `intent !== this.draftIntent`, il job ritorna immediatamente lo stato precedente `s`, evitando di chiamare `this.commit()` e di occupare SQLite.
  - In `src/useLibrary.ts`: In `persistOnboarding`, `reorderFuture()` è invocato con `setTimeout(reorderFuture, 0)`. Il commit persistente su SQLite completa la Promise senza attendere il ricalcolo CPU dei feed, permettendo alla UI di avviare istantaneamente la transizione fluida verso la fase successiva.

### 2.2 Segnalibri e Salva: Geometria Yoga e Animazione UI-Thread
* **Diagnosi Icona Centrale:** `FeedCard` usava uno stato React `confirmed` controllato da un `setTimeout` di 420 ms seguito da una transizione di 130 ms. In presenza di latenza sul thread JS, il timeout accumulava ritardi considerevoli, lasciando l'icona centrale visibile a lungo.
* **Diagnosi Icona In Alto a Destra (`SaveButton`):**
  - Struttura originaria:
    ```tsx
    <Animated.View style={[{position:'absolute',bottom:0,width:24,overflow:'hidden'},clip]}>
      <View style={{position:'absolute',bottom:0}}>
        <Icon name="bookmark" color={palette.accent}/>
      </View>
    </Animated.View>
    ```
    Su Android Yoga, un `<View>` interno con `position: 'absolute', bottom: 0` ma senza larghezza/altezza esplicite, posto dentro un contenitore che inizialmente ha altezza `0` (stato non salvato), viene misurato a 0 px. Quando Reanimated fa crescere l'altezza della maschera da 0 a 24 px sul thread UI, Yoga non riesegue il passaggio di misura; l'icona piena interna restava quindi a dimensione nulla o tagliata.
  - Inoltre, la prop `gestureManaged={true}` azzerava `onPress` su `Pressable`, delegando solo a `Gesture.Tap()` con tolleranza di 10 px, che veniva spesso cancellato dalle coordinate verticali del `Pan` genitore.
* **Correzione:**
  - `SaveButton`: la vista interna ha ora `style={{position:'absolute',bottom:0,width:24,height:24}}`, garantendo dimensioni 24x24 stabili sin dal primo frame. `Pressable` mantiene sempre `onPress={activate}` con `hitSlop={8}`, e il tap RNGH ha soglia a 16 px / 500 ms.
  - `FeedCard`: la notifica di salvataggio al centro è gestita da `showConfirmed`, che pilota Reanimated con `withSequence(withSpring(1, spring), withDelay(180, withTiming(0, {duration: 120})))`. L'intera sequenza (comparsa elastica, 180 ms di tenuta, 120 ms di dissolvenza) gira nativamente sul thread UI in ~300 ms, svincolata dal thread JS.

### 2.3 Eliminazione del Loop di Ricarica e Taratura Gesture Feed
* **Diagnosi Loop:** In `App.tsx`:
  ```tsx
  useEffect(()=>{
    ...
    if(lib.ready&&enabled&&!reader)void lib.load(category,index)
  },[..., lib.loading, ...]);
  ```
  `load()` imposta `lib.loading = true` all'avvio e `lib.loading = false` al termine. Avere `lib.loading` nell'array delle dipendenze dell'effetto che invoca `load()` innescava un loop infinito di re-render e chiamate continue, saturando il thread JavaScript e causando la perdita sistematica di tocchi e comandi.
* **Diagnosi Gesture:** In `FeedCard`, `single.maxDistance(7).maxDuration(250)` scartava qualsiasi tap umano la cui area di contatto si spostasse di oltre 7 pixel o durasse più di un quarto di secondo.
* **Correzione:**
  - Rimosso `lib.loading` dalle dipendenze dell'effetto di scoperta in `App.tsx`.
  - Tarate le gesture di `FeedCard`: tap singolo a `maxDistance(14).maxDuration(450)`, doppio tap a `maxDistance(14).maxDuration(350).maxDelay(300)`.

### 2.4 Risoluzione del Blocco della Schermata Profilo
* **Diagnosi:** In `App.tsx`, all'interno di `<ScreenLayer active={route==='profile'...}>`:
  ```tsx
  <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',paddingTop:24,paddingBottom:bottom+110}}>
  ```
  Il componente `<ScrollView>` era sprovvisto di `style={{flex: 1}}`. In React Native / Android Fabric, uno ScrollView senza vincolo di flessibilità o altezza esplicita dentro un contenitore assoluto viene misurato con altezza 0. I test di hit-testing per i tap cadevano fuori dalla vista o venivano assorbiti dallo sfondo dell'`Animated.View` sovrastante, impedendo l'interazione con "Articoli salvati", "Cronologia", "Impostazioni" e bloccando lo scroll.
* **Correzione:**
  - Assegnato `style={{flex: 1}}` allo `ScrollView` del profilo in `App.tsx`.
  - In `src/design-system/components.tsx`, impostato `pointerEvents={active ? 'box-none' : 'none'}` sull'`Animated.View` interno di `ScreenLayer`, e aggiunto `style={[{flex: 1}, props.style]}` al componente `PageScroll`.

---

## 3. Matrice dei File Modificati e Risultati dei Test

### File modificati nel commit:
1. `synapse-mobile/App.tsx`: rimozione `lib.loading` dal loop di scoperta; aggiunta `style={{flex: 1}}` al profilo.
2. `synapse-mobile/src/content/onboarding.ts`: coalescenza scritture `draftIntent` in `OnboardingController`.
3. `synapse-mobile/src/useLibrary.ts`: differimento asincrono `setTimeout(reorderFuture, 0)` in `persistOnboarding`.
4. `synapse-mobile/src/components/Feed.tsx`: animazione salvataggio su UI thread; tolleranze tap ampliate.
5. `synapse-mobile/src/components/SaveButton.tsx`: dimensioni fisse 24x24 per l'icona interna; `onPress` nativo ripristinato.
6. `synapse-mobile/src/design-system/components.tsx`: `pointerEvents` su `ScreenLayer` e `style={{flex: 1}}` su `PageScroll`.

### Risultati di Verifica:
- **Test Unitari / Integrazione (`pnpm test`):** 299/299 test superati con successo (0 fallimenti, 0 cancellati).
- **Controllo Tipi TypeScript (`pnpm run typecheck`):** 0 errori di tipo (`tsc --noEmit` completato con codice 0).
- **Bundle Android (`pnpm run export`):** Compilazione bundle statico JS completata con successo (`_expo/static/js/android/...`).

---

## 4. Linee Guida per Agenti LLM Successivi

1. **Non ripristinare mai `lib.loading` nelle dipendenze di `useEffect`:** La funzione `load()` altera `loading`. Inserire `loading` nelle dipendenze provoca loop infiniti.
2. **Layout ScrollView nei ScreenLayer:** Ogni `ScrollView` o lista inserita in una `ScreenLayer` deve avere esplicitamente `style={{flex: 1}}` (o dimensioni prefissate). `contentContainerStyle={{flexGrow: 1}}` non sostituisce il vincolo di flessibilità del contenitore esterno su Android Fabric.
3. **Animazioni di segnalibro e feedback visivo:** Evitare stati React accoppiati a `setTimeout` sul thread JS per micro-animazioni di feedback. Utilizzare shared value Reanimated con `withSequence` e `withDelay`.
4. **Dimensioni icone mascherate da `overflow: hidden`:** Le viste mascherate con altezza animata devono contenere elementi figli con larghezza e altezza definite per evitare che il motore Yoga le misuri a 0 px sul frame iniziale.
5. **Preservazione credenziali e runtime protetto:** Non modificare mai `.credentials/synapse-release.p12` né cancellare chiavi di firma. Non modificare il prototipo protetto in `../synapse`.
