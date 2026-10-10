# Verifica conclusiva — stato persistente, 10 ottobre 2026

Richiesta: ricontrollare i 14 punti, inclusa la diagnosi misurata del punto 13, confrontare la base iniziale, mantenere la chiusura approvata, togliere i selettori sperimentali, eseguire controlli e preparare APK aggiornabile senza cancellare dati.

## Ripresa

Leggere questo documento e l'ultima sezione di AVANZAMENTO.md. Confrontare i file correnti con `releases/qa/final-verification-2026-10-10/source-inventory.csv` e il riepilogo dei controlli. Non ripetere un blocco chiuso se codice e condizioni non sono cambiati. Nessun Git nel progetto; non ripristinare automaticamente differenze dagli snapshot.

## Blocchi

| Blocco | Risultato | Stato |
|---|---|---|
| B1 | Istruzioni, avanzamento completo, scelta B, inventario e accesso Galaxy | Completato |
| B2 | Confronto sorgenti/base, pulizia selettori, contratti e misure JS/native disponibili | Completato con limiti |
| B3 | Typecheck, test, export Android e APK release con firma conservata | Completato |
| B4 | Matrice release sul telefono; prestazioni e persistenza, limiti espliciti | Completato nel perimetro documentato |
| B5 | Stato dei 14 punti, prima/dopo, artefatto e limiti | Completato |

## Registro B1

- Letti AGENTS nativo e prototipo; nessun AGENTS negli antenati trovato. Prototipo consultato in lettura.
- AVANZAMENTO ha 773 righe; lettura in corso di completamento. Intervento 16 contiene già una verifica della 0.1.10/code 11 del 9 ottobre: è evidenza storica da ricontrollare, non una nuova prova.
- Scelta registrata: B, contrazione inversa accelerata. Punto 12 originale senza testo; chiesto all'utente senza inventarne l'associazione.
- Primo accesso ADB dal sandbox fallito nell'avvio daemon. Ripetizione con accesso agli strumenti locali: daemon avviato, elenco dispositivi vuoto. Chiesto collegamento/sblocco del Galaxy; nessuna app o impostazione modificata.
- Nessuna correzione al prodotto finora. Versione corrente 0.1.10/code 11.

**Chiusura B1:** AVANZAMENTO letto integralmente (773 righe). Inventario corrente 175 file; confronto snapshot audit: 138/138 identici. Base iniziale: 26 modificati/41 identici. Typecheck e 121/121 test iniziali superati, log nel dossier del 10 ottobre. Nessun selettore/parametro A/B/C nel prodotto o nella fixture corrente. Galaxy collegato dall'utente: SM-S911B, release 0.1.10/code11, target36/min24, non DEBUGGABLE. Accesso ADB richiede l'esecuzione fuori dal sandbox anche quando il daemon è già avviato.

**Prossimo passo B2:** leggere condizioni iniziali del Galaxy, identificare APK e raccolte, misurare dock/feed/lettore senza registrazione e tracciare le fasi native. Verificare sul telefono la copertura della preferenza ridotta, perché Feed/liste leggono solo la preferenza iniziale mentre Reader/dock hanno un listener. Nessun difetto prestazionale nuovo ancora attribuito a quel percorso.

## Registro B2

- APK installato iniziale uguale byte per byte alla consegna del 9 ottobre (E0B193…185929). Stato personale attuale: **0 salvati/182 visite**, tema scuro, AI attiva. Non ricostruire i tre salvati del resoconto storico. `initial-saved` è in realtà Cronologia; usare `initial-saved-confirmed` per la raccolta vuota.
- Condizioni: Android16, font1,0, scale0,5, USB/batteria86%, BAT27,7 °C/AP30,1 °C, stato termico0, risparmio0. Display120Hz, hasArrSupport=false. Documentazione Android aggiornata consultata; nessuna modifica al refresh nativo o globale.
- Benchmark stessi 80 articoli: riserva 78,340→29,105ms; letture UI estranee 80,878→0ms alla precisione del report, primo calcolo29,537ms. Ordine identico. È misura desktop, non FPS Android.
- Dock senza video: 1109 frame/14 in ritardo (1,26%), p50/p95/p99 5/7/14ms. Scroll Fiume con trace separata:330/11 (3,33%), 15/16/18ms; non confrontare il carico tracciato con quello non tracciato. Presentazione recente mediana8,343ms.
- Traccia nativa dello scroll3,028s: JS schedulato9,530ms totali/p95 tratto0,415ms; main479,894ms; RenderThread215,798ms. Traversal p95 2,304ms, drawing RenderThread p95 5,296ms inclusivo; coda/sincronizzazione GPU più onerosa. Nessun collo JS dimostrato. Esame successivo: 53 updateExtraData/setText/StaticLayout durante scroll; il mapper del titolo mescolava posizione scroll e proprietà del font. Non sono render React contati. Il costo del singolo componente GPU resta non isolato.
- **RM1 confermato dal codice/libreria installata:** useReducedMotion conserva il valore all'avvio. Feed/lista ignoravano il cambio durante l'esecuzione; pulse di Save/Chip/Button non aveva bypass esplicito. Prova Android transition scale0 nell'app già avviata: save86frame in circa0,7s, ma possibili altri invalidamenti impediscono di attribuire ogni frame al pulse. Ripristinata0,5 e annullato il segnalibro temporaneo.
- Correzione circoscritta in Feed, ArticleList, SaveButton, CategoryRail, Button: preferenza live esistente, arresto dei settle quando ridotto, bypass della scala e propagazione alle righe. Estetica e dinamica normale, Reader/Exit, scelte B e dati invariati. Typecheck finale già superato. Nuova versione0.1.11/code12 per aggiornamento distinguibile; firma esistente da conservare.
- Primo tentativo di inversione con chiamate ADB separate ha concluso il ritorno; escluso come prova dell'inversione. Ripetizione ravvicinata in una sola shell ha mantenuto il lettore; contatore istanza da ricertificare nella fixture.

**Prossimo passo B3:** test/export/build della0.1.11, firma e identità nativa. Poi installare con aggiornamento e ripetere RM1 e matrice completa mirata sul Galaxy. Le prove reali del prodotto sono separate da rete/Gemini controllati della fixture. Non rimuovere app QA o dati (richiesta corrente: nessuna disinstallazione).

### Correzione misurabile R1

La prima build 0.1.11 è compilata e conservata come production-before-title-fix.apk. Typecheck, 121 test ed export superati. R1: il titolo ora scorre in un unico contenitore tramite traslazione; i mapper delle parole dipendono solo dalla transizione. Stessa geometria (lo spostamento era già −scroll×progress), stessi font e variante B. Da verificare con nuova traccia e inversione sul Galaxy prima di attribuire benefici. Prossimo passo: ricompilare i controlli e la release, confrontare gli aggiornamenti nativi sullo stesso Fiume.

## Chiusura B3

Typecheck e 121/121 test sul codice con R1 superati; export Hermes 14db7506…; assembleRelease riuscito. APK 0.1.11/code12, min24/target36, ARM64/x86_64, firma v2/certificato identico fb5a08…; SHA256 09CFDBCC9F4FD473F33B8A6E8838EDE33F49B1D886F8FD9B1B4173AA8081073B. Install-r riuscito, nessuna disinstallazione/cancellazione. Primo capture immediatamente dopo start fermato dal controllo di foreground prima di qualsiasi input: ripetuto dopo avvio effettivo.

B4 avviato: Fiume in cache, stessa sequenza16 swipe alternati200ms, senza video con atrace. Prima496/22jank(4,44%), dopo530/3(0,57%), p50/p95/p99 rispettivamente15/20/22 e17/20/23ms: non affermare calo generale della latenza. Valutare i conteggi nativi separatamente. ReaderReturn fixture release compilata, Gemini in compilazione. Prossimo passo: controprova titolo, inversione contata, rete/AI e persistenze nelle fixture attuali, poi matrice originale/font Android/ridotto/ripristino.

### B4 — R1 verificato

Campione controllato stesso Fiume in cache: **400→0** ReactTextView setText/updateExtraData/StaticLayout nella traccia dello scroll. Contenuto e endpoint titolo confrontati visivamente, uguali. È eliminazione del lavoro nativo ripetuto, non conteggio render React. JS CPU76,139→48,378ms nel campione, tratti massimi1,133→2,384ms: nessuno stallo JS dominante. RenderThread CPU615,157→387,682ms, main1127,014→1081,293ms; pipeline/tempi inclusivi non additivi. Rimane jank. Dock finale1211/16(1,32%)5/7/11ms, iniziale1109/14(1,26%)5/7/14: nessun miglioramento causale della dock dichiarato.

Fiume fondo (revisionato Gemini in cache, non nuova prova servizio) e inversione ravvicinata mostrano lettore leggibile. Origine Cronologia Stampa3D dopo28swipe/182righe; test salvato temporaneo e riavvio in corso. Fixture ReaderReturn/Gemini compilate, Dock in corso. Prossimo passo: ripristinare0salvati dopo swipe/undo, font sistema1,3 e RMlive, matrice fixture ed estrazione APK installato.

### B4 — matrice Android, prima combinazione

Offline reale (Wi-Fi/dati disabilitati temporaneamente), Gemini off, appfont23+font Android1,3, tema scuro, tutte scale0: feed8swipe, lettore ASPWorldTour/attribuzione e ritorno, dock16tocchi con pause50ms verificati dagli screenshot.45frame/14jank(31,11%)5/11/14ms: campione con poche ridisegnature e stati istantanei, distinto dai dock animati; ritardi ancora presenti, nessun FPS continuo dedotto. Rete/font/scales ripristinati tramitefinally.

Primi swipes dei salvati verso destra hanno aperto il lettore: non validano il gesto sinistro previsto. Ripetizione sinistra: sotto soglia, rimozione1→0, undo0→1, rimozione finale0. Stampa3D persistente al riavvio e182visite conservate. La successiva combinazione per cronologia è da ripetere: cambio font Android ricrea la schermata Home, il tap a coordinate Profilo non ha aperto Cronologia. Acquisizioni matrix-offline-history-* escluse da quella prova. Usare label della schermata effettiva dopo cambi configurazione. Prossimo passo: verificare ripristino/0salvati e ripetere cronologia/salvati con acquisizioni e label, poi fixturecontatori.

Ripresa matrice: AI e appfont medio ripristinati,0salvati/183visite confermati. Per seconda combinazione Android è temporaneamente font1,3/scales0/Wi-Fi e dati offline; la UI dopo ricreazione è stata acquisita prima di aprire Profilo e Cronologia mediante label. Al termine del prossimo passo ripristinare font1/scales0,5/rete1. Non lasciare questi valori se interrotti.

Cronologia fuori schermo in offline: Barriera corallina storica non più in cache, avviso Articolo non disponibile offline e lista mantenuta (cross-history-reader). Il controllo Salva assente ha fermato la sequenza,finallyha ripristinato Android. È fallback corretto, non prova di apertura offline. Ripetizione con Stampa3D realmente persistita; non promettere che tutta la cronologia sia scaricata.

Seconda voce storica, Stampa3D: dopo rimozione del segnalibro e successivo consumo/refill non più in cache, stesso fallback offline (cross-cache-reader). Le righe di Cronologia non implicano conservazione illimitata del testo. Da non contare come regressione o apertura riuscita. Prova definitiva salvati in corso con anteprima corrente protetta prima del cambio Android: protected-*. Prossimo passo: controllare0salvati finale,RMlive e video scroll; poi fixture separate.

### B4 — salvati e accessibilità completati nel prodotto

protected-offline-*: anteprima protetta prima dell'offline, font Android1,3/scales0/scuro; lettore aperto e chiuso dal salvato. Sotto soglia1, rimozione0, undo1, rimozione finale0 verificati in XML/screenshot. Tutte le impostazioni Android ripristinate, appfont20/AIon/scuro conservati. Normale riavvio già confermava Stampa3D salvato/182visite; visite ulteriori legittime da ricontare alla fine.

LiveReduced: transition0 nell'app già avviata, senza cambio font o riavvio. Save produce2frame nell'intervallo800ms (prima86 in circa700ms su altra scheda); nessuna animazione continua necessaria. Un frame indicato janky, p5011ms: campione troppo piccolo per un tasso statistico. Segnalibro temporaneo annullato e transition0,5 ripristinato. Conferma funzionale del bypass, non benchmark causale del jank.

Fixture ReaderReturn installata con aggiornamento; primo avvio con nome attività abbreviato fallito perché il namespace resta app.synapse.reader. Nessun input successivo inviato, nessun dato cancellato. Prossimo passo: avviare con componente completo; contatori inversione/fondo500righe, Gemini/rete/SQLite controllati, video prodotto e stato finale/APK estratto.

### B4 — contatori ReaderReturn

Home fondo Passaggio20: istanza1/visite1/riordini0/finali0; dopo inversione90ms stessi valori e aperto; dopo chiusura riordini1/finali1. Cronologia500: i primi scrollToEnd avanzavano solo nel contenuto già misurato (non usati come prova del fondo).40 tocchi distanziati200ms hanno raggiunto visivamente righe495–499 e target500. Apertura istanza2, modello#0/visivo#499; inversione stessi contatori, ordine congelato. Arrivo edizione60ms durante chiusura: finali2/riordini2, modello#0/visivo#0. Nessuna doppia chiusura.

Salvati fixture, font23/ridotto: riga rimossa durante lettore, finale3/riordini3 e modello/visivo#−1. Non sono dati personali. Prossimo passo: font23/ridotto fino aPass20, ricerca/Shuffle, poi Gemini/riserva/database nella fixture attuale.

Pass20 raggiunto anche font23/ridotto (istanza4/finale4). Ricerca chiusa con query fiume e contatori5/5; prima prova Shuffle esclusa: tastiera sovrapposta ai pulsanti QA ha assorbito i tocchi (query fiume9, contatori ancora Ricerca5). Ripetere Shuffle da Home senza IME.

Gemini fixture release attuale: iniziale6 anteprime/req0; rete lenta1400ms per header e body, progressivo12→18 e offline attive0; AI disabilitata/gens0. Background intenzionale: req5/abort2/attive0 al rientro, pool24. Il guard di Send-AppInput ferma dopo Home Android come previsto per uscita dal foreground; rientro esplicito. Successivo tool interrotto (host stdout chiuso): nessuna nuova conclusione dedotta. Ripresa da XML e controllo assenza processo concorrente, senza rifare analisi. ADB daemon riavviato, telefono ancora accessibile. Prossimo passo: riserva30/riavvio req0, Gemini in arrivo/errore/cache/background, dati persistenti.

### B4 — Gemini/SQLite verificati

Riserva30 dopo riempimento e riavvio offline req0. In-flight adottata: AI1/full1/reuse1; PNG mostra originale leggibile durante revising. Prima quota esclusa (swipe non ancora assestato ha riaperto la voce precedente). Ripetuta su Aurora1034 dopo consumo/assestamento: AI2/full2/statoai; PNG del footer mostra QuotaQA e originale/attribuzione (avviso già nel fade di timeout; non usare XML tardivo per affermare la sua durata). Riprova senza quota: AI3 e footer revisionato Gemini. Test globale scale0 eseguito e ripristinato0,5.

Persistenza QA prima/dopo force-stop: **salvati1, visite2, riserva30, cache54, profilo v2/seen24/sessioni0/parole220** identici; dopo offline req0. Le220parole sono valore del profilo, non una sessione qualificata registrata da questa prova. Ulteriore anteprima senza testo offline: visite3/req0/statooffline, nessun approfondimento inventato. Generatore e trasporto simulati, SQLite/componenti Android reali, nessuna chiave personale.

Helper schermo riavviato dopo interruzione host: precedente processo non più presente; tocco neutro immediato e nuovo log4min. Non dichiarare mantenimento continuo durante l'interruzione. Prossimo passo: backgroundAI/esaurimento, Shuffle senza tastiera, dock/errori, video finale e ripristino app reale.

### B4 — background ed esaurimento

Generazione iniziata prima di Home Android, rientro: AI1/abortAI1/unused1/full1/attive0. Prova del generatore cancellabile locale; non restituzione della quota sul servizio remoto. Consumo offline: pool0, riavvio pool0/req0, salvati1 e cronologia3 mantenuti. Ritorno online con AIoff:26 anteprime in6s, nel target20–30; richiesta successiva tramite Riprova da leggere senza presumere30. Nessun dato personale coinvolto.

Prossimo passo: Shuffle ripetuto da Home senza IME, dock/errori/font1,5/ridotto, video del prodotto e controllo finale delle condizioni/dati/impronte. Prodotto ancora0.1.11 firmato già installato; fixture alternano soltanto app.synapse.reader.finalqa con install-r.

Shuffle fresco senza tastiera: aperto istanza1/visite1/finali0, chiuso finali1/riordini1. Riprova refill: riserva30/req10 (26 già utile prima), nessuna promessa di sincronizzazione bloccante. Dock fixture attuale: scuro/label1,5/ridotto,16tocchi alternati con pausa50ms; sei stati acquisiti. Da visionare i PNG prima di dichiarare layout verificato. App reale riaperta, nessuna disinstallazione.

Prossimo passo preciso: lettore con trasporto lento (anteprima durante download e retry), visione screenshot dock/font, video dello scroll reale separato dalle misure, stato0salvati/preferenze/condizioni finali e hash APK installato; poi B5 con tabella14punti.

## Chiusura B4

- Lettore lento nella fixture release: anteprima e caricamento visibili, full0/attive1; dopo header/body simulati da1400ms, full1/attive0 e successiva revisione. Font23 e movimento ridotto, anche tramite preferenza Android globale. Scale ripristinate0,5. Fonte e anteprima conservate.
- Sei PNG degli stati dock visionati: loading, revising, offline, network, ai, content. Tema scuro, label1,5 e ridotto: testo, X dove prevista e azioni restano leggibili nella superficie acquisita. Non una prova TalkBack o di tutte le dimensioni.
- Video del prodotto separato dalle misure:10 scroll rapidi di Fiume, chiusura dal fondo/inversione ravvicinata, ulteriore scroll e ritorno alla ricerca. File decodificato e tre tavole a4campioni/s visionate; testo presente nei campioni. Non attestazione di ogni frame o del frame rate dell'app.
- Riavvio normale conclusivo: **0salvati/184visite**, contro0/182 iniziali; due visite di QA nuove. AIon, tema scuro, font app20; Androidfont1,0/scales0,5/Wi-Fi1/dati1/risparmio0 ripristinati. Batteria100%, BAT30,4°C/AP41,0°C/SKIN32,1°C, stato termico0. Home lasciata aperta, QA arrestata e conservata, nessuna disinstallazione/cancellazione.
- APK installato estratto: stessa impronta della consegna09CFDB…1073B; ZIP/bundle integri, entry prodotto/nomi/versioni ricontrollati. Protetti Prototype.tsx e prototype.css con impronte identiche. Nessun cambiamento del prodotto dopo typecheck/test/export/build finali.
- Helper del tocco neutro ogni4min fermato tramite awake.stop. Durante l'interruzione host precedente non si presume continuità dei tocchi. Non servono ulteriori prove sul telefono in questo blocco.

**Limiti B4:** generatori e trasporti QA simulati; non nuove quote/latenze Gemini remote. Profilo personale non estratto, sessioni qualificate non misurate nel harness. Font Android1,3 provato su percorsi indicati, non tutti gli incroci. TalkBack, gesti manuali, stress termico/risparmio e attribuzione causale degli scatti residui non certificati. La prima prova quota, route ricreate dopo cambio font, Shuffle con IME e scrollToEnd non al fondo restano escluse, con ripetizioni valide registrate sopra.

**Prossimo passo B5:** aggiornare AVANZAMENTO con stato/evidenza/limite di ciascuno dei14punti, collegare dossier/matrice/APK, controllare integrità delle evidenze e corrispondenza del codice con l'inventario finale. Nessuna ricompilazione richiesta per sole modifiche documentali.

## Chiusura B5 — consegna

AVANZAMENTO aggiornato nell'intervento17: **14 righe,9 completati/4 parziali/1 ancora da verificare**. Dossier VERIFICA.md e matrice35righe completati; evidenze dei percorsi citati tutte presenti. Verifica di chiusura in `closure-integrity.json`: nessuna deriva dei175file rispetto all'inventario finale;11modifiche già documentate; APK consegnabile/installato/copia releases con la stessa impronta; helper assente e stopfile presente. Nessun nuovo cambiamento di prodotto e nessuna ricompilazione necessaria per la documentazione.

Artefatto consegnabile: `releases/qa/final-verification-2026-10-10/Synapse-0.1.11-final.apk`,0.1.11/code12, SHA25609CFDBCC9F4FD473F33B8A6E8838EDE33F49B1D886F8FD9B1B4173AA8081073B, firma esistente. Controlli automatici, export/compilazione e prove Galaxy sono distinti. Scatti residui e limiti dei servizi remoti non dichiarati risolti.

**Prossimi passi soltanto per i residui:** (1) ottenere il testo originale del punto12; (2) calibrare anticipo Gemini, selezione e profilo nell'uso reale; (3) se prosegue il punto13, tracciare commit React e rendering/GPU residuo con protocollo controllato e condizioni caldo/risparmio annotate. Prima di riprendere confrontare le impronte con current-delta.csv; eseguire di nuovo solo i controlli interessati da codice o condizioni cambiati. Nessuna prova sul telefono ancora in corso.
