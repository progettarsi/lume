# Lume v0.2.1 — correzione crash e avvio

## Evidenza
Il buffer crash Android della v0.2 mostra un errore fatale di app.synapse.reader alle17:51:39: TypeError undefined is not a function, MaterialLoadingIndicatorTsx2. Il codice prodotto da Babel per quel callback richiama runFullCycle dal proprio contesto serializzato. La funzione ricorsiva in una callback di fine ciclo non è disponibile nel runtime nativo al momento del richiamo.

## Correzioni
- Indicatore MD3: un solo orologio di frame sul thread UI, senza callback ricorsive. Conservati velocità, sette forme, rotazione assoluta, congelamento, pausa e movimento ridotto. La ripresa non azzera il contatore.
- Avvio: caricamento dei font e archivio locale in parallelo, mantenendo nascosto il contenuto finché entrambi sono pronti.
- Configurazione valida già salvata: nessuna scansione dei dati storici per riconoscere un utente precedente. Recupero da backup e normalizzazione restano attivi per configurazioni vecchie o danneggiate.
- Migrazioni già completate: una sola lettura degli articoli e della cronologia. Le migrazioni necessarie mantengono il percorso completo e le protezioni dei dati.

## Verifica
Typecheck e287test passati. Nuovi test eseguono i worklet serializzati in un contesto separato per35stadi (cinque cicli), congelamento, annullamento e movimento ridotto; controllano inoltre che gli avvii configurati non ripetano migrazioni o letture dell'archivio. Il test non sostituisce la verifica visiva sul telefono. Nessuna misura reale del tempo di avvio ancora eseguita.

L'utente ha segnalato anche glitch del setup senza indicare il passaggio: richiesta una descrizione. Non dichiarare risolti glitch visivi non identificati. Le prove pratiche rimangono affidate all'utente. Nessuna cancellazione dei dati.

Export Android e build firmata completati. APK locale releases/Lume-0.2.1.apk (versione0.2.1,codice20). Tentativo di installazione non riuscito: il telefono precedentemente collegato non è più rilevato da ADB. Nessuna installazione della patch né prova pratica eseguita. v0.2suGitHub invariata; modifiche della patch locali in attesa del riscontro sui glitch del setup.

Precisazione dell'utente: il crash avviene durante il ricaricamento della Home con doppio tap. Percorso confermato: App.refreshHome → lib.refresh → lib.loading → FeedSpinner → MaterialLoadingIndicator. Corrisponde al componente nel crash registrato; la correzione della v0.2.1 copre questo percorso. I test di refresh mantengono la scheda corrente e gestiscono risposte duplicate/connessione. Telefono ancora non presente in adb devices al controllo successivo. Il glitch del setup resta da descrivere.

## Stato corrente — completamento richiesto dall'utente
La sovrapposizione nome/foto è stata corretta: area scorrevole limitata sopra i pulsanti sollevati dalla tastiera, dimensioni foto stabili al focus, campo nome riportato in vista e spostamento dei pulsanti continuo anche durante cambio fase. Test della geometria a600/700/852dp e tastiera0–330dp superato.

Il progetto nel frattempo ha ricevuto altri commit, fino a e3abf81 sul ramo fix/review-2026-10-14. Preservati senza reset. Sul codice corrente typecheck,299test ed export Android superati. La NUOVA build non è stata eseguita: .credentials/signing.json è stato rimosso da un aggiornamento esterno e SYNAPSE_STORE_PASSWORD non è disponibile in Process/User/Machine. La chiave synapse-release.p12 è ancora presente. Non usare il vecchio APK come se contenesse queste ultime modifiche.

Script build-release.ps1 allineato alla configurazione via ambiente, senza stampare password né ricreare signing.json. Richiesto all'utente di rendere disponibile localmente SYNAPSE_STORE_PASSWORD; supportata anche variabile User per aggiornare la sessione Codex già avviata. Telefono rilevato, ma installazione del codice finale ancora pendente. Nessuna nuova pubblicazione GitHub effettuata da questa chat.

## Aggiornamento Finale Performance & Gesture — 14 Ottobre 2026 (Completato e Installato sul Dispositivo)
Risolti tutti i problemi critici di prestazioni, gesture e blocco del profilo segnalati dall'utente:
1. **Setup/Onboarding:** Coalescenza scritture di bozza con `draftIntent` in `OnboardingController` ed eliminazione della latenza di transizione con differimento asincrono di `reorderFuture()` in `persistOnboarding`.
2. **Segnalibro/Salvataggio:** Animazione popup centrato gestita interamente sul thread UI con Reanimated (`withSequence`) in `FeedCard`; risolta la geometria 24x24 dell'icona piena in `SaveButton` su Yoga e ripristinato `onPress` nativo affidabile con `hitSlop={8}`.
3. **Fluidità generale e swipe:** Rimosso il loop infinito di ricaricamento in `App.tsx` causato da `lib.loading` nell'array delle dipendenze di `useEffect`; ampliate le tolleranze delle gesture di tap in `FeedCard` per evitare tap scartati durante il tocco naturale.
4. **Sblocco del Profilo:** Aggiunto `style={{flex: 1}}` allo `ScrollView` del profilo in `App.tsx` (risolvendo il collasso dell'area di hit-testing su Fabric); impostato `pointerEvents="box-none"` su `ScreenLayer` e `style={{flex: 1}}` su `PageScroll`.

### Esito Verifiche e Rilascio:
- **Test:** 299/299 test superati con successo (`pnpm test`).
- **Typecheck:** 0 errori (`tsc --noEmit`).
- **Android Export:** Compilazione e packaging bundle statico superati (`expo export --platform android`).
- **Build APK di produzione:** `releases/Lume-0.2.1.apk` compilato con successo con chiave di rilascio tramite `scripts/build-release.ps1`.
- **Installazione su telefono:** Eseguita con successo tramite ADB sul dispositivo collegato `dispositivo di collaudo` (`adb install -r releases/Lume-0.2.1.apk` -> `Performing Streamed Install -> Success`).
- **Documentazione coordinamento LLM:** Creato documento tecnico dettagliato in [PERFORMANCE-GESTURE-FIX-2026-10-14.md](docs/PERFORMANCE-GESTURE-FIX-2026-10-14.md).
