# Onboarding Patch 0.1.13 — revisione e consegna C

11 ottobre 2026. Ramo `onboarding-patch`. Base A `528ef5ddbc580149bd423939a318a508fee215a8`, consegna B `07b24f1004c14a6b7f3a4004634eef0db3aaf9e8`. Questo documento sostituisce i limiti di implementazione ancora aperti nelle consegne A/B; quelle rimangono evidenze storiche.

## Risultato e perimetro

Il tutorial presenta i componenti effettivi di Synapse: `FeedCard`, `CategoryRail`, `Reader`, `SaveButton`, `Dock`, `ArticleRow`, `ShuffleButton`, menu Profilo e campo ricerca. Gli ultimi due sono estratti senza alterare l'aspetto del prodotto e riusati anche da App. Nome, foto, ordine del percorso, catalogo, migrazione, storage, personalizzazione locale e soglia di dieci anteprime restano quelli delle fondamenta A. Nessun account, nuovo backend, chiave incorporata o tempo di lettura.

Le edizioni del tutorial sono due esempi locali. Aperture, segnalibri, cronologia di esempio, categorie, ricerca e shuffle ricevono callback locali: non chiamano `useLibrary`, non aggiornano learning e non inviano richieste Wikipedia/Gemini. Il lettore ha gli stessi controlli del prodotto; i suoi collegamenti esterni aprono la fonte soltanto su esplicito tocco. La ricerca della dimostrazione filtra i due esempi e lo shuffle sceglie uno di essi. Non sono richieste remote simulate come risultati reali. I dati della dimostrazione si perdono quando si lascia il tutorial.

## Revisione indipendente di B e correzioni

- Contratti A conservati: skip facoltativi, catalogo canonico, ritorno con draft, completed/legacy, replay, profilo locale e preloading sono collegati correttamente. Verificati anche i nove file già modificati prima di C. Gli slot C incompleti erano intenzionali nella consegna B, non regressioni delle fondamenta.
- Intro: il PNG era una rappresentazione statica. Ora lampadina, filamento e raggi usano gli SVG originali, colorati dalla palette corrente. Rimossa la cornice circolare non presente nel riferimento. Raggi e pulsante compaiono con opacità/trasformazione; il pulsante diventa raggiungibile appena inizia a comparire, senza timer di blocco.
- Identità: eliminata la linea sopra i comandi, riallineati Continua/Salta e rialzato il gruppo. Sottotitolo a 4 dp dal titolo, avatar separato; bordi e testi seguono entrambi i temi. Lo spazio extra del footer si riduce con la tastiera. Tornando dal tutorial il titolo riserva solo la destinazione, eliminando la riga vuota residua.
- Forme decorative: alcuni PNG contenevano il fondo della schermata originale e non si adattavano al tema. Sostituiti con vettori canonici; posizionati sul viewport, dietro testo e comandi, senza scorrere insieme ai chip.
- Tutorial: eliminati card arrotondate, rail, dock e segnalibri ricostruiti ad hoc. Il titolo dell'esempio apre davvero il lettore condiviso. I salvataggi appartengono alle singole edizioni. La variante a dimensione naturale di FeedCard evita di tagliare il testo nel tutorial con font grandi; la paginazione del feed di produzione mantiene il comportamento precedente.
- Placeholder: focus e primo carattere annullano il vecchio ciclo; l'erase rapido non crea timer da un aggiornamento di stato. Il limite rimane 48 caratteri Unicode, senza tagliare coppie surrogate.
- Foto: individuato nelle fondamenta A un `File.copy` asincrono non atteso in SDK57. Ora la copia è attesa prima di controllare il file e confermare il riferimento. Test con copia nativa differita e selezione reale sul telefono.
- Nella prova del tutorial condiviso è emerso un errore C di misura nativa: l'updater leggeva l'evento React Native dopo il rilascio. Il valore viene ora acquisito immediatamente. Test dedicato con evento rilasciato e riprova del ritorno sul dispositivo.

## Animazioni completate

Morph organico con 64 punti compatibili, curve chiuse e interpolazione sul thread UI; rotazione 18 s, morph 6 s per direzione. La scala varia tra 1 e 1.02 invece di ridurre il disegno sotto la dimensione canonica. SVG originali invariati; movimento ridotto mostra gli endpoint originali. Bordi decorativi con traslazione ±8/±12 dp, rotazione ±4°, ciclo 24 s. Freccia immobile sopra il fondo organico, bounce breve e interrompibile alla pressione.

Titoli: erase18 ms, pausa70 ms, type32 ms. Layout del testo completo separato dalla pittura animata; semanticamente è esposto soltanto il titolo finale. Identità/interessi condividono la chiave. Cambio rapido, background, uscita e movimento ridotto interrompono i timer. Scena e ingresso Home in220 ms, senza trattenere il completamento.

Hint tutorial: massimo due cicli, interrotto al primo contatto. Pan sul thread UI, soglia22%, al massimo una scheda per rilascio, ritorno/inversione/cancel e comando accessibile equivalente. Il gesto interno blocca lo scroll esterno durante l'interazione. Loop e animazioni sono annullati fuori scena, in background e allo smontaggio; nessun rendering React per fotogramma per morph, drift, bounce o pan.

## Audit visivo del percorso

Riferimenti A e cinque frame Figma richiesti: 22:37,23:380,22:73,22:243,22:195. Il nodo intro è stato letto direttamente con screenshot e contesto; le altre quattro letture sono state impedite dal limite del connettore Starter. Per esse il confronto usa i riferimenti PNG/SVG conservati in `docs/onboarding-references` e `assets/onboarding`. Nessuna modifica a Figma o al prototipo protetto `../synapse`. Newsreader del progetto sostituisce il font del mock originale, con peso regolare nei titoli onboarding.

| Passo | Evidenza e risultato |
|---|---|
| Introduzione | SVG originale, tinta chiaro/scuro, nessun badge aggiunto; video nativo di comparsa raggi/CTA. |
| Nome e foto | Gerarchia titolo/sottotitolo/avatar, nessun divisore, comandi centrati; input e comandi raggiungibili con tastiera a320dp/font2. |
| Interessi | Titolo condiviso, chip canonici, selezione con check, decorazioni vettoriali di sfondo; ritorno preserva il draft. |
| Tutorial1 | Schede reali, dimensione naturale, peek, swipe avanti/indietro, comando equivalente e apertura lettore. |
| Tutorial2 | Rail reale con Per Te/Scienza/Arte; categorie cambiano effettivamente l'edizione locale. |
| Tutorial3 | Card e segnalibro reali; apertura/rimozione di salvataggio funzionanti nell'esempio. |
| Tutorial4 | Dock reale con pillola e sola label selezionata; Profilo, raccolta locale e ricerca condividono i componenti di prodotto. |
| Preparazione | Vettori canonici e bussola, gruppo centrale; testo legato allo stato reale. Ingresso senza aspettare un ciclo decorativo. |

Le tavole native, il video e i log sono evidenze locali escluse da Git in `releases/qa/onboarding-0.1.13/`. Schermate rappresentative: `identity-final-light.png`, `keyboard-320-font-2.png`, `interests-final-light.png`, `tutorial-swipe-real-dark.png`, `tutorial-categories-real-dark.png`, `tutorial-reader-real-dark.png`, `tutorial-profile-real-dark.png`, `tutorial-dock-real-light.png`, `preparation-final-light.png`, `home-replay-isolated.png`, `intro-motion.mp4`. Le acquisizioni sono della QA separata e mostrano un nome fittizio. Le schermate prese prima del completamento di una transizione non sono usate per concludere che la destinazione sia corretta.

## Verifiche automatiche e native

TypeScript e compilazione content riusciti; **214 test, zero fallimenti**. Export Android/Hermes riuscito. Ai contratti precedenti si aggiungono topologia e continuità del morph, soglia/inversione tutorial, palette/percorsi SVG originali, placeholder con timer controllati, copia foto differita, riuso dei componenti con callback isolate e rilascio dell'evento nativo di misura.

Sul Galaxy S23/Android16: percorso da introduzione a Home nella QA con applicationId separato; digitazione immediata, ritorni, selezione degli interessi, riavvio durante il setup e completamento persistente. Foto reale dall'immagine di prova posseduta, annullamento, sostituzione, rimozione e riavvio; nessuna acquisizione della galleria privata. Nome successivamente modificato nell'editor locale e conservato al riavvio. Il tutorial condiviso è stato provato con swipe nei due versi, pulsante equivalente, lettore, segnalibro, categorie, Profilo e ricerca; ritorno alla prima scena riprovato dopo il fix.

Completamento QA con39 anteprime utili e0 visite/0 salvati reali della QA nonostante le azioni negli esempi. Dopo riavvio la Home resta completata, riserva30; replay con salvataggio di esempio e skip conserva nome e0 visite/0 salvati. Temi chiaro/scuro, movimento normale/ridotto, background/ripresa, tastiera/font1.3 e320dp/font2 provati. Tutorial con schede a dimensione naturale provato anche a320dp/font2. Preparazione offline con contenuti conservati verificata sul dispositivo, poi connessione ripristinata; selettore foto dell’editor successivo annullato senza cambi. Dimensione e font del telefono ripristinati; tocco neutro ogni5min durante il lavoro quando la QA/app è in primo piano.

Online si entra normalmente solo con almeno **10 anteprime uniche e leggibili**, senza attendere Gemini o la riserva intera. Soglie9/10, deduplica, risultati tardivi, aggiornamento interessi, offline vuoto/parziale ed errori rete/disco sono verificati dai test. Offline/errori offrono esplicitamente la possibilità di iniziare con meno contenuti e riprovare; non promettono dieci articoli quando la rete non li consente.

## APK e aggiornamento

APK firmato installato come aggiornamento sul Galaxy S23/Android16:0.1.13/code16. Primo avvio senza onboarding forzato per l’utente legacy; Profilo conserva9 salvati e230 voci di cronologia. SHA256 finale `B2B7D585ED3BD04D9394CD559F80391FCAECAB9702317F03C67D1080D38DB282`. ZIP1196 voci con CRC verificati, bundle di produzione presente e marker QA assenti. La copia recuperata dall’installazione ha lo stesso hash dell’APK consegnato. Replay dalle impostazioni aperto e chiuso con Back nella release effettiva, conservando9 salvati/230 cronologia; gli scambi dell’esempio sono verificati più estesamente nella QA. Nella build installata controllati anche raccolta, Home e passaggio Scienza/Per Te senza aggiungere aperture o segnalibri personali. Font1.0 e dimensione1080×2340 ripristinati; helper temporaneo di mantenimento schermo fermato.

Versione0.1.13/code16, applicationId `app.synapse.reader`, arm64-v8a/x86_64. APK `releases/Synapse-0.1.13.apk`; checksum `releases/Synapse-0.1.13.apk.sha256`. Firma SHA256 `fb5a08f89ecdedaa90c7f94ce9aa7a8b11ca6a5d74f4b0341ff611a06ee98c6a`, coincidente con0.1.12. Manifest finale privo di camera, microfono e accesso generale alla galleria. La copia QA e i suoi comandi non sono nel bundle di produzione. Nessuna disinstallazione, cancellazione dati, merge, push o pubblicazione.

## Limiti

Verifica fisica rappresentativa su un solo dispositivo Android; iOS non compilato/provato. Le semantiche di accessibilità e il focus sul titolo sono implementati/verificati nei controlli, ma non è dichiarata una sessione TalkBack completa. Errori SQLite, permesso negato, rete vuota e lentezza remota sono casi deterministici dei test: non equivalgono a guasti fisici riprodotti. Nessuna misurazione universale di FPS o promessa sui tempi di Wikipedia/Gemini. L'anteprima QA della preparazione permette il confronto grafico senza rallentare artificialmente il caricamento reale. Il limite di lettura Figma è esplicito sopra; non è dichiarato un confronto completo con nodi live non letti.

## Git

Commit C sulle sole modifiche di questo intervento, con selezione separata dei cambi C in App e Feed. Le modifiche precedenti nei nove file rimangono identiche e fuori dal commit C; il prototipo è intatto. Le build includono il workspace corrente e quindi anche quei cambi preesistenti, verificati e conservati. Gli APK/QA, chiavi, cache e dati personali non vengono tracciati.
