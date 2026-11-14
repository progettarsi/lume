# Changelog

APK universali e checksum SHA-256 sono allegati alle [release GitHub](https://github.com/progettarsi/lume/releases).

## 0.2.5 — build 27, 17 ottobre 2026

- Feedback aptico per pulsanti, navigazione, categorie e salvataggi.
- Microvibrazioni durante la comparsa del testo.
- Aptica disattivabile dalle impostazioni, senza vibrazioni duplicate. Dettagli in [HAPTICS.md](docs/HAPTICS.md).

## 0.2.4 — build 26, 16 ottobre 2026

- useAnimations per navigazione Home/Profilo, salvataggio e Shuffle; Phosphor per le icone statiche, incluse tutte le categorie. Animazioni limitate alle interazioni, con rispetto dei movimenti ridotti.
- Si anima soltanto la destinazione nella navbar; il doppio tap su Home anima il refresh accettato.
- Storia usa una pergamena, coerente fra barra categorie, articoli e interessi.
- Corrette condizioni di corsa fra navbar e apertura/chiusura del lettore; le superfici fuori contesto non intercettano i tocchi.
- Al ritorno dalla galleria il layout dell'onboarding viene ricreato sulla fase corrente, conservando nome, foto e bozza; corretta la tastiera dopo il selettore.
- Crediti e licenze MIT di useAnimations e Phosphor in Impostazioni → Informazioni e in [assets/licenses](assets/licenses).

## 0.2.3 — build 25, 16 ottobre 2026

- Prime icone animate della navigazione (Lordicon, poi sostituite da useAnimations nella 0.2.4).
- Accanto alle categorie degli articoli compaiono le stesse icone della barra superiore.

## 0.2.2 — build 24, 15 ottobre 2026

- Corrette le aree di tocco della navbar e il contenimento delle schermate.
- Il feed mantiene una scheda leggibile quando gli avanzamenti superano il caricamento; rifornimento locale anticipato.
- Corrette apertura e chiusura degli articoli, intercettazione dei tocchi e icona del segnalibro.
- Ridotti ricalcoli della riserva, ordinamenti delle categorie e normalizzazioni ripetute all'avvio.
- Primo APK universale (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`), Android 7.0 / API 24 o successivo.

## 0.2.1 — build 20, 14 ottobre 2026

- Corretto il crash del ricaricamento Home con doppio tap: l'indicatore MD3 usa un solo orologio di frame sul thread UI, senza callback ricorsive.
- Avvio più rapido: font e archivio locale caricati in parallelo; migrazioni già completate non ripetute.
- Onboarding: corretta la sovrapposizione nome/foto con la tastiera aperta.

## 0.2.0 — build 19, 14 ottobre 2026

- 150 scoperte curate di 40–80 parole incluse nell'app e disponibili offline, con approfondimenti e fonti attribuite. Vedi [DISCOVERY-RELEASE.md](docs/DISCOVERY-RELEASE.md).
- Badge discreto per le edizioni verificate automaticamente; queste edizioni non vengono riscritte da Gemini.
- Recupero di sezioni Wikipedia e contenuti culturali Wikivoyage, con budget di rete condiviso.
- Consigli più specifici e percorsi facoltativi «Collega le scoperte».
- Palette Oliva e crema, design system condiviso, profilo e impostazioni riorganizzati.

## 0.1.13 — integrazione del prototipo approvato, 12 ottobre 2026

- Regia nativa della variante C: pulsante persistente alla stessa altezza, forme originali che ruotano, categorie con le icone della Home e ritorno dal tutorial alla personalizzazione.
- Tutorial con tre articoli nel Feed reale, lettore condiviso che si richiude nella scheda, doppio tap locale, dock con etichette misurate e freccia centrata nella forma. Nessun articolo successivo visibile a riposo.
- Titoli e nomi di esempio animati con geometria stabile; tastiera e testo ingrandito rispettati. Preparazione con almeno dieci anteprime, loader MD3 che si ferma e si espande verso la Home automaticamente.
- Android versionCode 17, application ID e certificato conservati. Build 16 archiviata.

## 0.1.13 — 11 ottobre 2026

- Onboarding locale con nome/foto facoltativi, interessi canonici e almeno dieci anteprime leggibili prima del normale ingresso online. Aggiornamenti legacy conservativi, ripresa e replay senza modificare il profilo.
- Tutorial con schede, categorie, lettore, segnalibri, dock, raccolta e ricerca condivisi con l’app; azioni di prova isolate.
- SVG originali adattati ai temi, comparsa di raggi e pulsante, morph organico, decorazioni in movimento, titoli animati e swipe interrompibile; movimento ridotto e tastiera rispettati.
- Corretti allineamenti della schermata nome, copia foto asincrona e rilascio dell’evento nativo di misura. Android versionCode16, ID e firma conservati.

## 0.1.12 — 11 ottobre 2026

- Tema principale e argomenti secondari classificati prima della visualizzazione, indipendenti dalla provenienza del recupero. Gemini facoltativo migliora il futuro del feed senza cambiare le etichette durante la lettura; il ripiego locale riconosce anche le biografie di rapper.
- Catalogo ampliato con percorsi reali di recupero. Categorie attivate dagli interessi, identità e ordine stabili, reinserimento dopo l'esaurimento; “Per Te” resta primo e disponibile offline.
- Migrazione con backup e riconciliazione dei contributi di aperture e salvataggi, senza duplicare segnali o cancellare cronologia.
- Barra con inserimenti, uscite e riordino interrompibili, copie in uscita inerti, testo senza scalatura e rispetto del movimento ridotto.
- Schermata Gemini dedicata con guida al progetto gratuito e fatturazione disattivata, link ufficiali, stato delle scritture ed errori; chiave personale custodita dal servizio esistente.
- Android versionCode 15, application ID e firma conservati.
