# Personalizzazione senza durata — 10 ottobre 2026

## Stato e ripresa
**Completato e installato il 10 ottobre 2026.** Stato finale e impronta APK nella sezione conclusiva. I «prossimi passi» delle note intermedie sotto sono un registro storico, ora completato.

Base 0.1.11/code12, nessun Git. Snapshot integrale dei sorgenti/test/documenti in `releases/qa/personalization-v3-2026-10-10/before`, compilato precedente in `baseline-build`, 121 test iniziali superati. Conservare gli interventi precedenti. Nessuna pubblicazione o cambio versione richiesti. Galaxy S23 collegato; daemon accessibile fuori sandbox.

## Analisi iniziale prima delle correzioni
Percorso: App show → lib.read/track → coda profileWrites → learn → SQLite → commitLearning → LibraryViews.reserve → reserveArticles/rankRecommendations. Save passa per BookmarkWriter e transazione bookmark/profilo; passaggio scheda per consume. Wikipedia.batch sceglie categoria e seed/link; publish/appendDiscoveries aggiunge solo in coda; getFeed riusa la coda pubblicata.

| Problema | Evidenza e impatto | Decisione |
|---|---|---|
| Confermato: durata ancora nel profilo | ReadingInteraction + campioni Reader, learnSession aggiorna interessi/habit; ranking usa parole, lingua, profondità/stretch | Rimuovere raccolta, modello, stime e UI; conservare timer tecnici |
| Confermato: feed pubblicato obsoleto | commitLearning invalida pool ma appendDiscoveries mantiene tutta la coda | Ricalcolare solo dopo posizione corrente, preservare prefisso/identità |
| Limite: candidati generici | batch usa seed statici/link per categoria; tokens solo titolo | Recupero tematico da azioni affidabili, termini da titolo e anteprima, senza servizio nuovo |
| Limite: inerzia/rumore | aggregati con decadimento30giorni, apertura0,2, rumore1,4; nessuna memoria recente | Memoria ordinata di interazioni, peso debole singolo, esplorazione esplicita |
| Confermato: esclusione da durata Home | timer6s marca seen anche senza azione | Eliminare timer; consumo solo all'avanzamento, senza valenza positiva/negativa |
| Migrazione: contributi non identificabili | aggregati v1/v2 includono sessioni temporali | Backup privato e ricostruzione da salvati e visite/ledger risolvibili; nessuna sottrazione inventata |
| Nessun bug di concorrenza confermato | profileWrites, BookmarkWriter, transazione già presenti | Preservare e provare errori/undo/riavvio |
| Ipotesi non dimostrata | soddisfazione e pertinenza reale | Non equiparare simulazione a giudizio dell'utente |

## Soglie fissate prima della taratura
Corpus deterministico vario, almeno 6 temi/60 candidati, 20 semi. Confrontare ranking puro e coda effettiva precedente bloccata. Nuovo utente: almeno4categorie nei primi10. Singola apertura: massimo2 posizioni nuove nei primi10 rispetto al freddo. Dopo3salvataggi coerenti: almeno4/10 pertinenti e primo entro3; dopo5aperture: almeno3/10. Cambio interesse dopo20salvataggi precedenti: nuovo tema almeno3/10 e vecchio almeno1/10. Due interessi alternati: entrambi almeno2/10. Almeno2slot esplorativi/10, nessuna tripla categoria quando esistono alternative. Scarsità: nessun duplicato, non inventare candidati. Save/remove/undo e ripetizioni: nessun accumulo. Riavvio: stesso ranking deterministico, salvati/visite/preferenze conservati. CPU80candidati: mediana non peggiore della base, obiettivo desktop <16ms (non FPS Android). Riordino prefisso invariato. Recupero: richieste tematiche dopo segnali coerenti, nessuna personalizzazione di search/shuffle, stesso budget richieste.

Queste soglie verificano reattività, varietà e stabilità con disponibilità controllata; non garantiscono percentuali sui risultati remoti o soddisfazione. Eventuali fallimenti e variazioni di soglia vanno registrati, senza cancellare esempi sfavorevoli.

Prossimo passo: implementazione v3, replay prima/dopo e regressioni; poi export/APK e percorsi sul Galaxy.

## Implementazione e verifiche intermedie
- Rimosse etichette minuti/Calcolo da Feed, righe e transizione Reader; eliminati ReadingInteraction, articleMetadata, campioni UI→JS, learnSession, habit, sessioni, stretch e stime di comprensione/quantità. Timer Home6s eliminato. Timer Gemini3,5s, animazioni e rete conservati.
- Profilo3: aperture0,2 una volta per identità, save5 reversibile, memoria32eventi con peso dimezzato ogni3azioni nuove, consolidato logaritmico limitato. Undo ripristina ordine e contributo originali. Nessuna durata o evento passivo con valenza d'interesse. Dieci termini da titolo/anteprima, non dal testo lungo.
- Slot5/10 di esplorazione esplicita, penalità di similarità e limite2categorie consecutive con alternative. Categoria corrente/prefisso preservati, futuro ricalcolato anche offline. Acquisizione Wikipedia tematica dagli articoli volontariamente apprezzati, aggiornamento anche a riserva piena con stesso scheduler/budget; risposte tardive ordinate col profilo corrente. Ricerca invariata; shuffle offline ora pesca uniformemente dagli eleggibili in cache, senza prendere soltanto i primi30 personalizzati.
- Migrazione atomica v1/v2: backup learning-pre-v3-backup, ricostruzione da visite/aperture risolvibili e salvataggi attuali, nessuna recentezza fittizia del passato. Vecchio seen conservato per evitare ripetizioni storiche; può continuare a escludere voci viste col vecchio timer, non separabili dai passaggi. Dati e impostazioni conservati. Metadati inutili eliminati da JSON articoli/visite. Backup storico volutamente conservato, mai usato dal ranking.
- 115/115 test attivi superati dopo rimozione delle prove della funzione eliminata e aggiunta di matrice/candidati/riordino/migrazione. Typecheck superato. Export Android riuscito fuori sandbox; prima invocazione senza output interrotta. Una piccola correzione successiva rilegge articoli dopo migrazione: export finale da ripetere.
- Taratura iniziale half-life8azioni falliva cambio tema (2/10 nuovi contro soglia3). Conservata in comparison-initial.json. Half-life3 supera soglie senza alterarle: switch circa4nuovi/4precedenti/2esplorazione; save3 6/10, open5 6/10, accidentale2/10 e massimo2identità nuove nel top10 su20semi. Confrontare anche ranking precedente: già reagiva ai save, ma non riordinava coda pubblicata.
- Corpus sintetico80voci/8temi/20semi, risultati comparison.json; corpus storico Wikipedia42voci utilizzabili/13categorie: in diversi temi non restano candidati dopo i segnali, nessun miglioramento inventato. real-corpus-and-cpu.json riporta anche benchmark alternato200campioni dopo40warmup: mediana desktop4,11→3,47ms, p955,28→4,62ms. Non FPS Android. Singole esecuzioni mostravano variabilità, incluso un confronto CPU sfavorevole.
- Fixture release compilata, SHA2566C0A8E…33CF7, applicationId app.synapse.reader.personalizationqa, sorgente PersonalizationHarness.tsx. Entry/config ripristinati. APK prodotto in compilazione; versione0.1.11/code12 invariata.
- Interruzione: una chiamata di acquisizione sul Galaxy rifiutata dal revisore automatico per limite d'uso; non eseguita, non giudicata pericolosa. Ripresa su richiesta dell'utente. Baseline personale attuale:1salvato/187visite (product-profile-before.xml), diversa dallo storico: conservare questi valori. Telefono sbloccato dall'utente. Nessuna impostazione modificata.

Prossimo passo preciso: acquisire qa-cold dopo installazione, Save3/Undo/riavvio offline/Online con contatori e prefisso invariato; completare APK prodotto, export finale/test, install-r conservativo e assenza tempi in Home/righe/Reader, conteggi dati. Poi documentare risultati e limiti senza promuovere test non eseguiti.

## Confronto riproducibile e parametri finali

`node node_modules/typescript/bin/tsc -p tsconfig.test.json`, poi `node scripts/qa/compare-personalization.cjs` e `node scripts/qa/compare-real-personalization.cjs`. Baseline compilata congelata nella cartella QA. Il caso cambio tema parte da20salvataggi dell'interesse precedente. Coda precedente significa una riserva precaricata prima dei nuovi eventi: il vecchio codice non la riordinava. Non confondere quel difetto con il ranking puro, che già reagiva ai salvataggi.

| Scenario (20semi, media nei primi10) | Ranking v2 ricalcolato: tema nuovo | Coda v2 già pronta: tema nuovo | Ranking v3: tema nuovo | Riscontro |
|---|---:|---:|---:|---|
| Nuovo |1,45|1,45|1,00|Varietà media5→4,5categorie; minimo4 |
| Apertura singola |2,10|1,45|2,00|Non più di2identità nuove nel top10; nessun recupero tematico da sola |
| Due salvataggi |6,00|1,45|6,00|Primo pertinente in posizione1 |
| Tre salvataggi |6,95|1,45|6,00|Riduzione deliberata rispetto al ranking puro v2 per varietà |
| Cinque aperture distinte |2,90|1,45|6,00|Primo pertinente in posizione1 |
|20vecchi salvataggi +3nuovi |3,00|0,25|4,05|Vecchio tema3,95/10; primo nuovo medio1,3 |
| Alternanza due temi |5,40|1,45|3,00|Secondo tema5/10; resto esplorazione |
| Salva/rimuovi/Annulla |4,10|1,45|6,00|Ripristina stesso contributo/ordine del salvataggio, nessuna crescita nei20cicli |
|12aperture stessa identità |2,10|1,45|2,00|Uguale ad apertura singola |
| Un solo candidato pertinente disponibile |1,00|0,00|1,00|Posizione1; nessun candidato inventato |

Per i casi senza pertinenti la prima posizione è `null`, non0; non interpretare la media delle sole presenze come copertura. Tutti i dettagli/semi/ordini sono nel JSON. Dopo un save cambia subito il ranking e il futuro; nel corpus freddo servono3aperture distinte per passare da2 a6pertinenti. Nessuna garanzia sul numero di risultati remoti. Le soglie sono state mantenute, non adattate agli esempi riusciti.

| Parametro in personalization.ts | Valore | Motivo |
|---|---:|---|
| openWeight / saveWeight |0,2 / 5|Apertura debole; decisione esplicita forte, non moltiplicazione uniforme |
| recentLimit / recentHalfLife |32 / 3azioni|Risposta a pochi segnali; il consolidato limita l'oblio. Prima prova8falliva cambio tema |
| recentWeight / confidenceMass |4 / 4|Una singola apertura ha poca massa e non domina |
| categoryWeight / topicWeight |0,6 / 0,7|Categoria più indizi della specifica anteprima; contributi consolidati logaritmici limitati |
| noise / exploreEvery |0,08 / 5|Rumore ridotto; due spazi espliciti in10, non random dominante |
| exploration / anchorProbability |0,30 / 0,65|Fonti generiche ancora campionate; recupero specifico tramite Wikipedia senza nuove API a pagamento |
| maxTerms |10|Costo e rumore lessicale contenuti; anteprima limitata, nessun download per stimare difficoltà |

## Verifica Galaxy in questa esecuzione

- Fixture separata: SQLite, useLibrary, Feed/Reader reali; articoli e trasporto sintetici. `qa-cold` → `qa-saved`: scheda Batterie0 ferma,1→6science nei successivi10; `pinOK`. `qa-undo`: stesso ordine,3salvati/3eventi recenti. Riavvio `qa-restart-data`: v3/recent3/saved3/visits0/req0. Dopo Online+Undo, `qa-online`: req1 e profilo invariato. Non è rete Wikipedia reale e non prova soddisfazione. Il nuovo processo può scegliere una diversa prima scheda: non viene salvata la posizione di sessione, ma profilo e riserva sì.
- Prodotto: aggiornamento `install -r` senza disinstallazione, firma esistente.1salvato/187visite prima e subito dopo. Home senza clock/Calcolo; riga salvata A senza minuti. Apertura A, scorrimento al footer Gemini disponibile e ritorno alla raccolta. Non attribuita nuova chiamata Gemini, potrebbe essere cache.
- Ricerca reale fiume: Fiume, Fiume(Croazia), Fiume(fiume), Ticino; apertura e ritorno con query conservata. Shuffle Ancarano(Slovenia), apertura/ritorno e query conservata. Le aperture aggiornano normalmente la cronologia; nessuna alterazione manuale dei punteggi o del database personale.
- Campione scorrimento Fiume senza video:8swipe alternati250ms,482frame/4janky(0,83%), p50/p95/p99=18/19/20ms. Non confronto causale prima/dopo, non FPS costanti o garanzia zero scatti. Nessuna configurazione di Android modificata.
- Correzioni finali dopo questo campione: Annulla di un bookmark storico(order0) non inventa recentezza; un nuovo interesse riabilita i tentativi precedentemente esauriti, conservando il limite6avvii/minuto. Regressioni automatiche aggiunte:117/117test. Fixture e prove estese sopra precedono queste due correzioni circoscritte; APK finale ricompilato e sottoposto a controllo finale separato.

## Limiti residui e continuità

La classificazione della categoria deriva ancora dalla rotta di acquisizione Wikipedia, non da una comprensione semantica certificata. Termini finiti senza stemming possono perdere sinonimi o sovrastimare parole condivise; i filtri editoriali preesistenti non sono una garanzia di pertinenza. Recupero per titolo può esaurire i risultati vicini: budget e ripiego evitano cicli illimitati. Il seen storico è conservato, quindi esclusioni nate dal vecchio timer non separabili restano: scelta prudente per evitare ripetizioni, senza fingere di ricostruire la provenienza. Le aperture note e i bookmark hanno registri per identità non troncati, per mantenere deduplicazione e reversibilità; costo di persistenza cresce con l'uso, memoria recente limitata32.

Nessuna nuova valutazione di quote/servizio remoto Gemini, TalkBack, iOS/altri telefoni, o soddisfazione di lungo periodo. Le stime linguistiche e di comprensione sono eliminate, non sostituite da proxy. Limite editoriale fisso1100parole e selezione di frasi complete conservati come vincolo del prodotto, senza equivalenza in minuti o crescita personale. Timer tecnici Gemini/animazioni/rete coperti dai contratti precedenti ancora superati.

## Consegna finale verificata

- TypeScript superato; **117/117 test**, nessun fallimento, skip o cancellazione. I 121 test della base includevano contratti della funzione rimossa: il conteggio minore non rappresenta quattro regressioni ignorate. Test comportamentali nuovi coprono migrazione, undo storico, cambio interesse e budget.
- Export Android Hermes riuscito (`export-delivery`, bundle `index-6ecf4d2cd06368e748f06aa2331d39f1.hbc`); build release finale riuscita. Nessun codice prodotto modificato dopo questi controlli.
- APK: `releases/qa/personalization-v3-2026-10-10/Synapse-0.1.11-personalization-v3.apk`, **58.146.972 byte**, SHA256 **4282010BFA188651DBE8C8B76074E0BB4EEEA425C71A5B0B8794E3C7FBE19A57**. Versione **0.1.11 / code12**, invariata. Nessuna pubblicazione.
- Installazione finale con aggiornamento conservativo riuscita. APK estratto dal Galaxy con identico SHA256 (`delivery-integrity.json`). Firma preesistente conservata, verificata anche dall'aggiornamento Android senza disinstallazione.
- Controllo separato sull'APK finale: Home e Profilo acquisiti e visionati (`delivery-home`, `delivery-profile`), nessuna etichetta tempo. **1 salvato / 189 voci cronologia** alla fine; erano **1 / 187** prima e subito dopo la migrazione. Le due nuove voci derivano dalle aperture effettuate durante le prove. Nessuna cancellazione dei dati personali, nessuna modifica alle preferenze del telefono. Home lasciata aperta; fixture separata arrestata e conservata.
- Filtro errori limitato al processo corrente: nessun messaggio AndroidRuntime/ReactNativeJS nel campione (`delivery-errors.log`); non è una garanzia sull'intera esecuzione.
- Scansione finale dei sorgenti: riferimenti alla vecchia readingMetadata soltanto nella rimozione dei campi storici; nessun readingLabel/learnSession/ReadingInteraction/readingMinutes/readingTime/Calcolo residuo. `resizeMode="stretch"` è una proprietà grafica indipendente dalla funzione rimossa.

Intervento richiesto concluso. Per un eventuale incarico successivo: valutazione nell'uso reale della pertinenza e dei limiti della selezione Wikipedia, mantenendo distinti risultati controllati e soddisfazione. Nessun monitoraggio o servizio automatico avviato. Prima di ulteriori modifiche ripartire dalle impronte e dalle evidenze qui raccolte, senza ripetere indiscriminatamente le prove già superate.
