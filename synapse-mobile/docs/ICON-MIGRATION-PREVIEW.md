# Anteprima icone — 16 ottobre 2026

Build locale di test sulla base v0.2.3 / 25, package `app.synapse.reader`. Pubblicazione GitHub, packages e release sospesa fino all'approvazione esplicita dell'utente.

## Comportamento da provare

- Home → Profilo e ritorno: si anima soltanto la destinazione. Nessuna animazione all'apertura della schermata. Home riproduce una breve apertura/chiusura della porta.
- Doppio tap Home: un'animazione per ogni refresh effettivamente accettato, indipendente dalla durata della rete.
- Salva/rimuovi: animazione useAnimations in avanti/inverso sul pulsante azionato. Le altre copie dell'articolo aggiornano il segnalibro senza animarsi. Il doppio tap del feed conserva la conferma esistente e attiva il salvataggio locale.
- Shuffle: una riproduzione, poi indicatore di caricamento soltanto se la richiesta è ancora in corso. Nessuna attesa imposta all'apertura dell'articolo.
- Categorie, menu Profilo, Impostazioni, messaggi, ricerca, frecce e controlli onboarding: Phosphor statico. Verificare corrispondenza fra barra categorie, badge e interessi, inclusi Economia e Astronomia.
- Provare tema chiaro/scuro, movimenti ridotti, tocchi rapidi, passaggio in background e apertura del lettore durante un'animazione. Nessuna riproduzione in coda al ritorno.
- In Impostazioni → Informazioni sono presenti i crediti e le licenze MIT complete di entrambe le famiglie.

## Evidenza automatica

- TypeScript app e compilazione dei contratti: PASS.
- Suite completa: 321 test PASS, 0 fallimenti. Include feed, rete, cache, navigazione e ciclo delle nuove animazioni.
- Export Android Hermes: PASS.
- `assembleRelease`, quattro ABI: PASS.
- Firma APK: PASS; certificato SHA-256 `8e15eb9ee2bd52c0b7734082bab2d2464cdff3f33838f8d53dc76272aa00b79b`.
- Librerie Hermes, React Native, app modules, Reanimated e Worklets: presenti in tutte e quattro le ABI.
- Testi delle licenze MIT: verificati anche nel bundle effettivamente contenuto nell'APK.
- Installazione, avvio e verifica visiva su dispositivo: NOT RUN; prova dell'utente tramite APK su Drive.

## Artefatto

`releases/Lume-0.2.3-useanimations-phosphor-preview.apk`, 98.213.461 byte.

[APK di test su Google Drive](https://drive.google.com/file/d/1uVlOJBKYCxJfZjsmN7lSgZ0q2TxSNXiQ/view?usp=drivesdk). Upload completato; nome, tipo e dimensione verificati tramite lettura dei metadati Drive.

SHA-256: `d4dd57c95e6c0d191d89fe65f7c8e0a057e0d1c088e4b491ae411c9bb8c8639e`.

APK universale: `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`; Android minimo API 24, target API 36. Versione mantenuta uguale alla base fino alla pubblicazione approvata.
