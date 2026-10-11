# Synapse mobile

Prima implementazione React Native + Expo dell’esperienza approvata. Android come prima piattaforma; codice dell’app condiviso con iOS. Il prototipo originale nella cartella `../synapse` resta separato.

## Funzioni implementate

- Feed verticale guidato dal gesto: uno swipe avanza di un solo articolo, anche con velocità elevata. Doppio tap per salvare, lettura estesa e transizioni reversibili.
- Tutte le categorie nella barra superiore scorrevole con sfumatura a destra. Selezione con un tap, ordine automatico secondo gli interessi, senza riordinamento manuale. Le chips scompaiono durante lo scorrimento, liberando spazio per l’articolo. “Per te” resta prima.
- Wikipedia in italiano: prima risposta pubblicata subito, rifornimento quando restano 12 schede e riserva persistente fino a 30 anteprime utili, costruita progressivamente. Lavoro in secondo piano seriale: massimo sei avvii al minuto, due risposte API per lotto, pausa tra lavori e tentativi automatici finiti. L’articolo aperto interrompe i download di riserva. Nessun server.
- Riserva: massimo 512 KiB di anteprime, 16 KiB per voce. Cache ordinaria: 80 articoli / 6 MiB; salvati esclusi, articolo attivo e riserva utile protetti dalla pulizia (i contenuti protetti possono superare il limite ordinario). La cronologia mantiene fino a 500 riferimenti. Offline sono disponibili le anteprime conservate e soltanto gli approfondimenti già scaricati; il fallimento Gemini conserva il testo originale, gli altri errori offrono un’azione nel fondo del lettore.
- Ricerca online ordinata secondo la pertinenza di Wikipedia; ricerca locale senza connessione. Shuffle online, con ripiego sulla cache quando il servizio non risponde.
- Profilo, salvati, cronologia, dimensione del testo, tema scuro. SQLite sul telefono; adattatore locale solo per l’anteprima browser.
- AI facoltativa: chiave personale Gemini custodita con SecureStore sul telefono. Quota gratuita del fornitore, nessuna fatturazione attivata dall’app. Se non disponibile, rimane il testo originale. Nell’anteprima browser la chiave resta soltanto in memoria.
- Icona fornita adattata alla palette, inclusa versione Android adattiva e monocromatica.

La selezione divulgativa usa filtri e temi iniziali: non garantisce che ogni voce Wikipedia sia accessibile a tutti. Il feed si personalizza sul dispositivo tramite aperture volontarie deboli, salvataggi reversibili e memoria delle interazioni recenti. Non misura tempi di lettura né deduce comprensione o lunghezza desiderata; la ricerca conserva la pertinenza Wikipedia. L’AI gratuita dipende dalle quote e dalla disponibilità del fornitore, e non è necessaria al funzionamento.

- Aggiornamento Home con doppio tocco su Home e un solo indicatore superiore; esclusione persistente dei contenuti già letti/incontrati, anche dopo la pulizia della cache.
- Categoria Curiosità, temi iniziali mescolati, scoperte dai collegamenti delle voci e quota casuale del feed.
- Testi da paragrafi HTML: niente tabelle, didascalie, navigazione, note o formule isolate. Selezione fino a circa 1.100 parole, senza troncare frasi.
- Gemini Flash-Lite 3.1 con ripiego 3.5 solo se il modello non esiste: revisione della sola continuazione, anteprima immutabile, errori espliciti, riprova e conservazione offline. Il riassunto compare nella stessa apertura appena pronto; errore o timeout restituiscono il testo classico. Il testo disponibile viene impaginato prima della rivelazione dall’alto con bordo sfumato, senza ricomporre gli a capo; lo scroll anticipa la visibilità.
- Disambiguazioni escluse tramite metadati Wikipedia e categorie; l’estrazione non scarta la definizione per conservare frammenti senza contesto. Cache del testo aggiornata senza cancellare cronologia o salvataggi.
- SQLite: una connessione dedicata, letture e scritture ordinate, recupero una volta per handle Android non valido.

## Avvio e controlli

Con Node e pnpm 10 disponibili:

```powershell
pnpm install
node node_modules/expo/bin/cli start
pnpm typecheck
pnpm test
node node_modules/expo/bin/cli export --platform all
```

## APK locale

La cache Gradle usa il collegamento locale breve ../.g per evitare il limite dei percorsi Windows.

Gli strumenti portabili vengono cercati in `../.mobile-tools`: JDK 17, Android SDK 36, build-tools 36.0.0 e NDK 27.1.12297006. L’accettazione della licenza ufficiale Android SDK deve essere autorizzata prima dell’installazione dei pacchetti.

```powershell
./scripts/build-android.ps1
```

Il comando prepara il progetto Android, riusa la firma privata locale nella cartella ignorata `.credentials` (la crea solo alla prima build) e genera `releases/Synapse-<versione>.apk`. Conservare `.credentials` privatamente: servirà per aggiornare la stessa installazione. Nessuna pubblicazione su store o servizio remoto è prevista.

## Stato di verifica

Onboarding Patch C, 11 ottobre 2026: **0.1.13/code16 installata sul Galaxy S23**, con firma e dati conservati. Tutorial con componenti reali dell’app e interazioni isolate; SVG e animazioni, spaziatura nome e tastiera corretti. Precaricamento online di almeno10 anteprime leggibili. TypeScript,214 test, export Android, APK/firma/checksum verificati; percorso e replay provati nella QA, aggiornamento legacy e conteggi9 salvati/230 cronologia conservati. [Risultati e limiti](docs/ONBOARDING-0.1.13-REVIEW.md). APK in `releases/Synapse-0.1.13.apk`. Nessun merge/push/pubblicazione. Le consegne seguenti sono evidenze storiche.

Category Patch, 11 ottobre 2026: **0.1.12/code15 installata sul Galaxy S23**, con firma e dati conservati. Revisione indipendente A→B, difetti corretti, TypeScript, 184 test, export Android e APK/checksum verificati. Provati feed/lettore, offline/riconnessione, categoria dinamica Musica, Gemini e combinazione scuro/testo ingrandito/movimento ridotto; simulazioni distinte dalle prove del prodotto. APK in `releases/Synapse-0.1.12.apk`, risultati e limiti in [CATEGORY-PATCH-0.1.12-REVIEW.md](docs/CATEGORY-PATCH-0.1.12-REVIEW.md). Nessuna pubblicazione o push. Le consegne seguenti sono evidenze storiche.

Layout feed e scroll, 10 ottobre 2026: corretto lo spazio sopra la navbar, sfumatura statica, indicatore di rifornimento e salvataggio senza toast. 145 test, TypeScript, export e APK release verificati; **0.1.11/code14 installato sul Galaxy S23** e provato con flick/inversioni, doppio tap e offline senza spostamento della scheda. Dettagli e limiti in docs/FEED-LAYOUT-2026-10-10.md. Le build precedenti sotto sono evidenze storiche.

Rete/riserva, 10 ottobre 2026: 142 test, TypeScript, export e APK release 0.1.11/code13 verificati. Build pronta in releases/qa/network-reserve-2026-10-10/Synapse-0.1.11-network-reserve-code13.apk; Installato sul Galaxy S23 come aggiornamento tramite install -r; copia in Download con hash coincidente. Metadati installati confermati: 0.1.11/code13. App non avviata e nessuna prova sul telefono eseguita. Verifica sul telefono affidata all’utente. Diagnosi, stati, tentativi, riserva e checklist in docs/RETE-RISERVA-2026-10-10.md.

Personalizzazione v3 senza tempo di lettura: stato corrente, migrazione, confronti e limiti in `docs/PERSONALIZZAZIONE-V3.md`. Le sezioni seguenti sono evidenze storiche; la v2 e le sue stime di esposizione sono superate.

Completata il 10 ottobre 2026: 117 test, TypeScript, export e APK Android verificati; aggiornamento installato sul Galaxy S23 conservando i dati. APK corrente dell'intervento: `releases/qa/personalization-v3-2026-10-10/Synapse-0.1.11-personalization-v3.apk` (versione 0.1.11/code12 invariata). Confronti deterministici e prove con dati controllati distinti dalle verifiche del prodotto e dai limiti nell'uso reale.

Ritorno shuffle, 9 ottobre 2026: corretta la superficie che conservava le coordinate di apertura con tastiera visibile. Release installata e verificata sul Galaxy con tastiera inizialmente aperta/chiusa e scroll; 102 test, TypeScript, export, build e firma superati. Video prima/dopo in `releases/qa/shuffle-return-2026-10-09`, causa e limiti nell'intervento 10 di `docs/AVANZAMENTO.md`.

Revisione estetica del punto 11, 9 ottobre 2026: ripristinata la riga senza pulsante laterale, label a impaginazione fissa, feedback graduale e Annulla con entrata/movimento coordinato delle celle. Release installata sul Galaxy, video e conteggi di frame nel dossier `releases/qa/saved-motion-2026-10-09`; 102 test, TypeScript, export e firma verificati. Stato corrente e limiti nell'intervento 9 di `docs/AVANZAMENTO.md` e `scripts/qa/SAVED-MOTION.md`. L'intervento 8 descrive la versione precedente, ora superata nell'estetica.

Punto 11, 9 ottobre 2026: swipe sinistro nei salvati con soglia proporzionale, feedback, conferma al rilascio, uscita e Annulla senza scadenza. Comando accessibile equivalente, rollback sullo stato persistito e protezione di testo/cronologia. 102 test, TypeScript, export e APK release verificati; matrice di gesture/ultimo elemento/undo/riavvio/ritorno provata sul Galaxy. Dettagli e limiti nell'intervento 8 di `docs/AVANZAMENTO.md`; protocollo in `scripts/qa/SAVED-SWIPE.md`.

Punto 4, 9 ottobre 2026: prima selezione editoriale reversibile sui testi Wikipedia già ricevuti, temi specifici nelle 13 categorie, varietà del nuovo tratto e ripiego limitato in caso di scarsità. Personalizzazione e risultati precedenti preservati. 97 test, TypeScript, export Android, APK/firma e controllo di Home/lettore/fonte/ritorno sul Galaxy superati. Campione di 50 candidati prima/dopo in `releases/qa/editorial-selection-2026-10-09/CAMPIONE-50.md` e CSV; metodologia e replay in `scripts/qa/EDITORIAL-SELECTION.md`. Risultati, riduzione della resa e impossibilità di misurare la latenza API sotto HTTP 429 nell'intervento 7 di `docs/AVANZAMENTO.md`.

Punto 3, 9 ottobre 2026: preparazione Gemini dopo una sosta continua iniziale di 3,5 secondi sulla scheda visibile, con AI e chiave già abilitate. Richiesta condivisa con il lettore, priorità esplicita, budget e cancellazione coordinati con la riserva, cache valida per contenuto/configurazione e misure locali anonime. 88 test e TypeScript superati. Dettagli, prove sul Galaxy e limiti nell’intervento 6 di `docs/AVANZAMENTO.md`; fixture separata descritta in `scripts/qa/GEMINI-DWELL.md`.

Punti 7/8, 8 ottobre 2026: riserva progressiva di 30 anteprime, cache aggiornata, priorità del lettore e messaggi distinti con riprova. 78 test, TypeScript, export Android, APK release e firma superati. Aggiornamento installato sul Galaxy S23; riserva/offline/rete lenta verificati sul dispositivo con trasporto controllato in una QA separata, ricerca e lettore verificati anche nell’app normale. Riscontri e limiti in `docs/AVANZAMENTO.md`, intervento 5; APK in `releases/qa/feed-reserve-2026-10-08/`.

Aggiornamento 8 ottobre 2026: 0.1.7 (versionCode 8), installato come aggiornamento sul Galaxy S23. 59 test, TypeScript, esportazione Android, APK e firma verificati. Sul telefono verificati risposta reale Gemini nella stessa apertura, riuso della revisione, animazione classica, scorrimento durante la comparsa, ritorno all’anteprima invariata, durata classica/AI e singolo indicatore di refresh. Dettagli in `releases/QA-0.1.7.md`.

Aggiornamento 8 ottobre 2026: disponibile 0.1.5 (versionCode 6). Gemini verificato realmente sul Galaxy S23 con la chiave già presente; refresh Home, Curiosità, categorie adattive, persistenza e salvataggi verificati. 47 test automatici, TypeScript, bundle Android, APK e firma verificati. Dettagli in `releases/QA-0.1.5.md`.

Aggiornamento precedente: disponibile 0.1.4 (versionCode 5), con correzioni a timeout/cancellazione di rete, validazione delle preferenze, memoria e allineamento del feed, salvataggio della chiave AI e lettore. TypeScript, 29 test, esportazione Android e compilazione APK superati; firma verificata. Installata come aggiornamento sul Galaxy S23 e avviata senza errori nei log esaminati. Verifica visiva in attesa dello sblocco del telefono; scansione Codex Security non avviata per errore del plugin. Dettagli e limiti in `releases/QA-0.1.4.md`. Il resoconto seguente riguarda le prove precedenti della 0.1.3.

TypeScript e 25 controlli automatici su contenuti, rete, cache e ordinamento delle scritture superati. Il bundle Android è incluso nell’APK release 0.1.3 (versionCode 4), installato e verificato su Samsung Galaxy S23 con Android 16. Verificati chiusura da salvati (freccia e Indietro), rimozione del salvataggio mentre il lettore è aperto, cronologia con riga spostata e testo scrollato, home, dieci alternanze Salva/rimuovi, doppio tap, persistenza al riavvio, categoria/feed, shuffle e tastiera. La chiusura non aspetta la misurazione di una riga nascosta o rimossa. I salvataggi rispondono subito e le scritture vengono eseguite nell’ordine dei tocchi; i download non possono ripristinare un segnalibro rimosso o sostituire il testo completo con l’anteprima. Il tema usa una breve dissolvenza uniforme dell’intera schermata, reversibile anche con tocchi ravvicinati. Nessun crash nel processo finale durante le prove. I cinque salvataggi originali del telefono sono stati ripristinati e confermati dopo il riavvio.

La connessione Wikipedia è stata verificata sul telefono con feed, ricerca e approfondimenti reali; corretto il rifiuto HTTP 403 dovuto all’identificazione del client. APK da circa 55 MiB, Android 7 o successivi, ARM64 e x86_64. Firma v2 verificata e identica alla versione precedente, integrità ZIP e bundle inclusi verificati. Permessi inutilizzati per file esterni, overlay e biometria rimossi. Report, riscontri visivi e SHA-256 si trovano in `releases`. Le verifiche su iOS e su altri dispositivi Android restano da effettuare.

Per ricompilare dopo modifiche al solo codice dell’app, senza rigenerare il progetto Android, lo script accetta `-SkipPrebuild`.

Font inclusi localmente: Newsreader e Source Sans 3 (SIL Open Font License). Testi Wikipedia con fonte e attribuzione nel lettore, licenza CC BY-SA.


Punto 5, 9 ottobre 2026: personalizzazione locale v2 con migrazione e backup atomici, esposizione stimata anziché tempo dalla sola apertura, contributi dei segnalibri reversibili e dimensioni distinte di lingua/prerequisiti/quantità. 116 test, TypeScript, export, release e firma superati. Esempi e profili simulati in `releases/qa/personalization-2026-10-09/CALIBRAZIONE-E-PROFILI.md`; dettagli e limiti nell'intervento 11 di `docs/AVANZAMENTO.md`. Galaxy non collegato: nessuna nuova verifica fisica.

Punti 2/8 visivo, 9 ottobre 2026: dock a capsula con pillola Home/Profilo, redistribuzione UI interrompibile, label a impaginazione fissa e Cerca conservato. Messaggi coerenti di rete/offline/caricamento/Gemini con riprova e movimento ridotto. 116 test, TypeScript, export Android, release/firma superati; QA visiva e ricerca/ritorno RN Web documentati in `design-qa.md`. APK finale e harness isolato in `releases/qa/dock-messages-2026-10-09`; protocollo `scripts/qa/DOCK-MESSAGES.md`. Galaxy assente: fluidità, tastiera e regressioni native da provare, senza assimilare il browser alla verifica fisica. Risultati separati nell'intervento 12 di `docs/AVANZAMENTO.md`.

Ritocco dock, 9 ottobre 2026: margine laterale della pillola uniformato al verticale con inset derivato dalle altezze. APK `releases/qa/dock-insets-2026-10-09/Synapse-0.1.7-dock-insets.apk` installato sul Galaxy; Home/Profilo misurati 28 px sopra/sotto/lato esterno. 116 test, TypeScript, export/build/firma superati. Riscontri generali ancora aperti su tema e fluidità, distinti dal margine corretto: intervento 13 di `docs/AVANZAMENTO.md`.

Prestazioni e regressioni, 9 ottobre 2026: **0.1.8 / code 9** installata sul Galaxy. Ranking/viste del feed riusati per dati invariati, gesture stabile durante il refill, lettore senza copie e registrazioni di callback estranee al contenuto, palette unificata che risolve il tema incongruente. 121 test, TypeScript, export Android, build/firma/integrità superati. Home, ricerca/IME, scroll rapido, inversione del lettore, shuffle, salvati/Annulla, cronologia al fondo e riavvio verificati sul dispositivo. Margini dock 28/28/28 px preservati. Misure JS/native, filmati, APK e limiti in `releases/qa/performance-2026-10-09/PERFORMANCE.md`; intervento 14 nel documento di avanzamento. Non dichiarata fluidità perfetta o equivalenza tra 120 Hz e frame prodotti.

Avvisi chiudibili, 9 ottobre 2026: **0.1.9 / code 10** installata sul Galaxy. X, swipe laterale nei due sensi e timeout normale di 2 secondi per errori/avvisi brevi; caricamento e revisione in corso restano visibili. Nel lettore il timeout aspetta la visibilità del footer e si sospende durante la chiusura. Gestione di Annulla dei salvati conservata. 121 test, TypeScript, export/build/firma/integrità superati; prove native con messaggi simulati separate dall'avvio dell'app normale. Dossier `releases/qa/dismissible-errors-2026-10-09/VERIFICA.md`, intervento 15 nel documento di avanzamento.

Verifica conclusiva,9 ottobre2026: **0.1.10/code11**, `releases/qa/final-verification-2026-10-09/Synapse-0.1.10-final.apk`, installata come aggiornamento sul Galaxy con firma conservata e hash identico. Chiusura B mantenuta, selettori/pacchetti sperimentali rimossi.121 test, TypeScript, export e release superati. Scroll/fondo/inversione, shuffle/IME, cronologia fuori schermo, salvati3→0→3, dock e persistenza ricontrollati; rete/Gemini/font/ridotto con fixture native isolate. Aggiorna i precedenti limiti “Galaxy assente”, senza assimilare simulazioni a servizio remoto. Presentazione mediana8,34ms nei tratti attivi ma frame in ritardo residui: punto13 parziale. Stato14 punti, limiti e matrice nell'intervento16 e nel dossier `VERIFICA.md`; punto12 originale da identificare.


