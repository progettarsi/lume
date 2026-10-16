# Layout onboarding dopo la scelta della foto

16 ottobre 2026 — anteprima locale; pubblicazione GitHub subordinata all'approvazione dell'utente.

## Riproduzione e diagnosi

La registrazione dell'utente mostra un difetto anche senza tastiera. Riprodotto con il precedente APK firmato su `Lume_API_36` / `emulator-5580`, Android 16, tema scuro e risoluzione 1080×2340: setup da zero, Continua, apertura immediata dell'avatar durante la transizione, selezione di un'immagine. Al rientro il titolo scende sopra l'avatar e il sottotitolo si sovrappone a Rimuovi foto. Evidenza locale: `.build-temp/photo-video/baseline-dark-return.png`.

La geometria risultante corrisponde alle coordinate iniziali del benvenuto. Reanimated conserva gli stili iniziali del componente animato, che possono essere riapplicati durante un commit nativo al ritorno dall'attività esterna. La precedente protezione della tastiera non corregge queste coordinate.

## Correzione

Al termine del selettore esterno, anche in caso di annullamento o errore, il binding incrementa una revisione della presentazione. `OnboardingScreen` ricrea la sola scena animata, inizializzando valori condivisi, sessione del titolo e stili iniziali sulla fase corrente. Nome, foto, interessi e fase restano nel controller; nessuna migrazione o reset del setup. Non viene ripetuta l'animazione di benvenuto. La rimozione della foto mantiene la propria animazione e non ricrea la scena.

## Verifiche

- TypeScript applicazione e test: PASS; suite completa 331/331 PASS.
- Regressioni mirate: ripristino della geometria iniziale nella fase corrente, presentazione ricreata senza perdita del binding, scelta/annullamento e conservazione della bozza; protezioni della tastiera e dei doppi tocchi mantenute.
- Export Android Hermes, build universale e verifica firma: PASS. Quattro ABI; certificato SHA-256 `8e15eb9ee2bd52c0b7734082bab2d2464cdff3f33838f8d53dc76272aa00b79b`.
- Nuovo APK installato sull'emulatore: stessa sequenza rapida e stessa configurazione della riproduzione, ritorno senza sovrapposizioni: PASS (`fixed-dark-return.png`).
- Inserimento nome QA, riapertura e annullamento del selettore: nome e foto preservati, layout corretto: PASS (`fixed-cancel-name.png`). Avanzamento agli interessi: PASS (`fixed-next-interests.png`). Schermate locali in `.build-temp/photo-video/`.
- Ripristinati tema chiaro e risoluzione originale dell'emulatore. Azzerati solo dati Lume di prova creati nella sessione, nessun wipe AVD o telefono USB.

Il telefono Samsung dell'utente non è stato testato direttamente; la verifica su quel dispositivo resta affidata all'APK di anteprima. Allegati privati ed estratti del video restano esclusi da Git e Drive.

## Artefatto

`releases/Lume-0.2.3-onboarding-layout-fix-preview.apk`, 98.215.569 byte, versione 0.2.3 / 25, `app.synapse.reader`.

SHA-256: `c5cd10d1f804747c52403e048b9fe94ddc22b44cc75cee00c2e69381d733df4f`.

[APK di prova su Google Drive](https://drive.google.com/file/d/1s7bIWvh-9kH4rPKnc_hoXqKMqXEAxCHh/view?usp=drivesdk). Upload completato e metadati verificati: nome, MIME e dimensione corrispondono. Eliminata la precedente build `Lume-0.2.3-onboarding-photo-fix-preview.apk` (`1_TkzZVSL90-ubLVqGXQdTfl4kpqjJ9ds`), con conferma da Drive.
