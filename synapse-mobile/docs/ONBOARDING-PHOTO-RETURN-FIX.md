# Rientro dal selettore foto nell'onboarding

16 ottobre 2026 — anteprima locale, nessuna pubblicazione GitHub.

**Superato dalla verifica successiva:** questa correzione copriva lo spostamento della tastiera, ma non il difetto senza tastiera mostrato successivamente dall'utente. Vedi [ONBOARDING-PHOTO-LAYOUT-FIX.md](ONBOARDING-PHOTO-LAYOUT-FIX.md) per la riproduzione del secondo difetto e la nuova build. Il vecchio APK è stato sostituito su Drive.

## Difetto e correzione

Riprodotto su `Lume_API_36` / `emulator-5580`, Android 16: primo setup, campo nome attivo con tastiera, apertura del selettore e scelta della foto. Al rientro la tastiera era nascosta ma la schermata conservava lo spostamento: titolo invisibile, avatar tagliato e azioni sollevate. Il sistema confermava `mImeWindowVis=0` e `mInputShown=false`.

Il solo reset al cambio di attività non basta: Android può ripristinare il focus del TextInput e il valore/stato animato della tastiera può restare obsoleto. L'onboarding ora invalida lo spostamento durante il picker/background, rilascia il campo prima del picker e riabilita la sessione solo da un vero tocco sul nome o dall'evento RN `keyboardDidShow`. `keyboardDidHide` chiude la sessione anche se l'altezza animata rimane positiva. Il ripristino automatico del focus non la riattiva.

Le normali animazioni della tastiera continuano a seguire l'altezza sul thread UI; la chiusura ordinaria e la transizione agli interessi restano reversibili. Nessuna modifica alle dipendenze native o ai dati della foto.

## Verifiche

- TypeScript ed export Android Hermes: PASS.
- Suite completa: 329 test PASS; incluse altezza obsoleta, focus ripristinato, visibilità della tastiera senza pressione del puntatore, ritorno in primo piano e transizioni esistenti.
- APK universale firmato: PASS; stessa firma, quattro ABI e 20/20 librerie native previste.
- Emulatore, APK finale installato: PASS. Setup da zero con nome `QA`, tastiera e prima foto; rientro senza sovrapposizione o cambio pagina necessario. Ulteriore modifica del nome a `QA2`, nuova apertura/chiusura della tastiera e avanzamento agli interessi: PASS.
- Azzerati soltanto i dati di prova Lume creati in questa sessione; nessun wipe dell'AVD o uso di telefoni USB.

Schermate locali in `.build-temp/icon-migration/`: `onboarding-keyboard-return-before.png`, `onboarding-photo-return-after.png`, `onboarding-photo-edit-after.png`, `onboarding-photo-keyboard-hide-after.png`, `onboarding-photo-next-after.png`.

## Artefatto

`releases/Lume-0.2.3-onboarding-photo-fix-preview.apk`, 98.215.221 byte; versione 0.2.3 / 25, `app.synapse.reader`.

SHA-256: `57fa7d2ed5c9ed3f2130839e99624fd5e374872600fb1fd3276a8e42f5d90070`.

[APK corretto su Google Drive](https://drive.google.com/file/d/1_TkzZVSL90-ubLVqGXQdTfl4kpqjJ9ds/view?usp=drivesdk). Upload completato e nome, tipo e dimensione verificati tramite metadati. Eliminato su richiesta l'APK precedente `Lume-0.2.3-icons-navigation-fix-preview.apk` (file `1BiHSgNThz9ZToFIIQFjClj5R6_DYxWbT`), con esito confermato da Drive.
