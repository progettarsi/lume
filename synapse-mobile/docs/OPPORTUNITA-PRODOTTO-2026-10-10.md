# Synapse: opportunità implementabili e piano di scelta

10 ottobre 2026, Europe/Rome. Ricerca sul codice attuale, senza implementazione o cambio versione.

## Esito e perimetro

Consiglio **cercare dentro Salvati e Cronologia** come primo intervento: rende recuperabile il patrimonio già conservato, funziona senza rete e non cambia il motore del feed. Seguono **scelta dell'originale nel lettore** e **stato offline dei salvati**. **Ripresa volontaria dal paragrafo** è utile ma rimandabile, perché coinvolge persistenza, edizioni e animazioni delicate.

Sono lacune concrete dell'esistente, non quattro nuove sezioni dell'app. La presenza delle lacune è sostenuta dal codice; frequenza del bisogno e beneficio percepito restano ipotesi da verificare con prove locali. Nessuna proposta richiede account, backend, telemetria esterna, nuovo modello AI o permessi aggiuntivi.

Letture: AGENTS nativo e del prototipo, README, PERSONALIZZAZIONE-V3 integralmente; parti pertinenti e conclusioni di AVANZAMENTO, VERIFICA-CONCLUSIVA-STATO, VERIFICA-0.2.0-STATO, design-qa e dossier/protocolli QA. Ricerca testuale dei candidati nei documenti e dossier, quindi verifica dei componenti e dei flussi corrispondenti. Non ogni artefatto storico è stato riletto integralmente. Il prototipo è stato consultato come riferimento delle decisioni, senza modificarlo.

Non ho avviato l'app, interagito con il telefono o acquisito nuove schermate. Questo è un piano fondato sui contratti e sui dati, non una nuova certificazione visiva: nessun giudizio su clipping, estetica o fluidità deriva dai nomi dei componenti. Le prove Galaxy riportate dai dossier sono evidenze precedenti, non eseguite in questa ricerca. La forma definitiva dei controlli proposti dovrà essere valutata su schermate effettive e sul dispositivo durante l'eventuale implementazione.

## Base attuale e vincoli

- App personale/generalista per scoprire e leggere selezioni divulgative di Wikipedia italiana. Android prima piattaforma; iOS compatibile nel codice, non certificato dalle prove qui esaminate.
- Home: categorie e Per te, swipe di una scheda, tap per approfondire, doppio tap idempotente per salvare; doppio tocco Home aggiorna il feed. Cerca: query online secondo pertinenza Wikipedia, ricerca locale offline, shuffle; ritorno conserva query e contesto. Profilo: Salvati, Cronologia, Impostazioni. Lettore con fonte/licenza, salvataggio e ritorno reversibile.
- React Native 0.86.3, Expo 57, Reanimated 4.5.1, Gesture Handler 2.32; font locali Newsreader/Source Sans 3. App coordina percorsi e superfici; useLibrary coordina cache, rete, profilo, download e revisioni. SQLite nativo con coda unica e transazioni; storage.web è un adattatore di anteprima. SecureStore custodisce la chiave opzionale; nel browser resta in memoria.
- Wikipedia direttamente, senza server. Gemini facoltativo, fallimento con conservazione dell'originale. Originale e revisione sono già dati distinti; hasRevision verifica la validità, non la sola presenza di un array.
- Riserva progressiva fino a 30 anteprime, rifornimento anticipato, limiti di richieste e cancellazione. Cache ordinaria 80 articoli/6 MiB, salvati esclusi dall'espulsione; anteprime con budget separati. Cronologia fino a 500 riferimenti, non 500 testi garantiti offline. Testo selezionato fino a circa 1.100 parole, non voce Wikipedia integrale.
- Identità visiva, semplicità, accessibilità e movimento interrompibile vincolanti. Nessuna illustrazione, account, ordinamento manuale delle categorie o pulsante laterale di rimozione nei salvati. Nessun onboarding pesante o didascalia permanente di istruzioni.
- Package/app: **0.1.11/code12**. Nessun repository Git disponibile: impossibile qualificare modifiche tracked/untracked. Inventario SHA-256 di sorgenti/test/script e configurazioni in `RICERCA-OPPORTUNITA-2026-10-10-inventario.json`; non si ripristina alcun file. Ispezione processi via CIM non disponibile per accesso negato: non posso dichiarare assenza di altri lavori attivi. L'indagine non scrive al prodotto e riduce così il rischio di interferenza.

### Decisioni verificate nel codice

Personalizzazione v3 già applicata: `recommendations.ts:7` modello Learning, `:30` learn, `:65` discoveryAnchor, `:73` ranking; `useLibrary.ts:40` commitLearning riordina il futuro, senza spostare il prefisso corrente. Aperture volontarie deboli, save forte reversibile, recentezza per ordine delle azioni, varietà esplicita. Ricerca e shuffle hanno semantica propria. `types.ts` non contiene durata; `Reader.tsx:50` osserva scroll per comportamento grafico, non per apprendimento. Nessuna proposta usa permanenza, esposizione o posizione come segnale di interesse. Backup v1/v2 storico conservato e non usato dal ranking: rimozione del tempo operativo non equivale a cancellazione del backup di migrazione.

Timer di debounce ricerca, rete, animazione e preparazione Gemini restano indipendenti. Non vanno rimossi per analogia con il tempo di lettura.

L'ultimo intervento 18 di AVANZAMENTO e PERSONALIZZAZIONE-V3 superano le descrizioni v2. VERIFICA-0.2.0-STATO conserva un registro iniziale incompleto: non prova che tutti quei blocchi siano ancora da fare. Dossier v3 riporta 117 test, typecheck, export, APK e aggiornamento Galaxy, con limiti espliciti; non rieseguiti qui.

## Mappa del lavoro già trattato

| Area | Stato riscontrato | Conseguenza per questa selezione |
|---|---|---|
| Comparsa/impaginazione | ReaderReveal, testo finale prima della rivelazione, titolo traslato; interventi e QA dedicati | Nessuna nuova animazione proposta; confronto edizioni deve preservare il contratto |
| Apertura/chiusura/liste | B approvata, returnRows, geometria congelata e inversione | Non riaprire A/C; filtro e ripresa devono superare ritorni/inversioni |
| Dock/shuffle | Interventi margini, tema, tastiera e ritorno già verificati nei dossier | Non presentare rifiniture già assegnate come opportunità |
| Swipe salvati | Rimozione, rollback e Annulla senza scadenza già presenti | Il filtro non deve eliminare Annulla o aggiungere un pulsante laterale |
| Caricamenti/offline/Gemini | Riserva, priorità lettore, original fallback, avvisi e retry già presenti | Proposta offline riguarda prevedibilità e recupero di un singolo salvato, non nuova riserva |
| Qualità editoriale | Filtri, seed, varietà, campione di 50 candidati già elaborati | Taratura reale ancora utile ma categoria 4 |
| Personalizzazione | v3 completata, rimozione durata e riordino futuro | Controlli negativi/spiegazione ranking non sono prerequisiti; taratura categoria 4 |
| Sicurezza/stabilità/prestazioni | Queue SQLite, cache protetta, cancellazione, ottimizzazioni e QA esistenti | Jank residuo e TalkBack/iOS non certificati separati dal prodotto nuovo |

Residui già noti: identificazione del punto 12 originale, valutazione reale della pertinenza/editoriale e anticipo Gemini, diagnosi degli scatti residui, TalkBack e altri dispositivi. Nessuno è ribattezzato novità.

## Confronto e ordine consigliato

Categorie: 1 nuova non documentata; 2 accennata non elaborata; 3 lacuna esistente; 4 già pianificata/in corso; 5 incompatibile/scartata. Fattibilità A architettura attuale, B estensione limitata, C infrastruttura/decisione sostanziale, D non verificata.

| Proposta | Categoria / fattibilità | Beneficio e frequenza ipotizzata | Evidenza | Sforzo / rifinitura | Rischio / manutenzione | Ordine |
|---|---|---|---|---|---|---|
| Cercare in Salvati e Cronologia | 3 / A | Alto con raccolte crescenti; frequente al recupero | Forte: liste senza query, cronologia fuori cache | Medio / media su IME e ritorni | Medio / bassa, filtro locale | Prima |
| Originale a scelta nel lettore | 3 / A | Controllo e fiducia per utenti Gemini; occasionale | Forte: dati separati, solo switch globale | Medio / alta per cambio edizione | Medio / bassa se stato effimero | Seconda |
| Stato offline dei salvati | 3 / B | Affidabilità prima di un viaggio; episodico | Forte: completo distinto dal save, coda volatile | Medio / media | Medio / media, scheduler e stati | Terza |
| Riprendere dal paragrafo | 3 / B | Continuità dopo interruzione; frequenza ignota | Forte sull'assenza di persistenza; bisogno meno dimostrato | Medio / alta | Medio-alto / media | Rimandabile |

Non servono punteggi: la prima ha meno nuove invarianti persistenti e aiuta anche senza AI/rete. La seconda ha costo di dati nullo ma rifinitura delicata. La terza ha valore alto quando necessario, ma gli scaricamenti già automatici riducono il beneficio marginale. La quarta aggiunge stato nuovo e non è prerequisito delle altre. Le categorie 1/2 non sono obbligatorie: non emerge una proposta altrettanto solida da anteporre a queste lacune.

## Scheda 1 — Cercare dentro Salvati e Cronologia

1. **Nome e categoria:** filtro locale delle raccolte, categoria 3, fattibilità A. Ricerca già presente, ma con un ambito diverso.
2. **Problema/scenario:** ricordo una voce aperta giorni fa o salvata e devo scorrere una raccolta lunga. La ricerca Wikipedia non equivale a cercare ciò che ho conservato.
3. **Evidenza/confidenza:** `App.tsx:82` prepara liveRows da cache salvata o history; `:205` passa la lista intera senza query. `useLibrary.ts:161` cerca online su Wikipedia, offline soltanto cache. `storage.ts:38–43` conserva riferimenti fino a 500 e riunisce eventuali testi cache; quelli espulsi hanno ancora titolo e fonte. `text.ts:78` offre rankLocal ma riordina per punteggio ed esamina il corpo: non è da applicare ciecamente ai riferimenti storici. Alta confidenza sulla lacuna, media sul bisogno; nessun piano dedicato trovato nei documenti esaminati.
4. **Prima/dopo:** prima «Fiume» nella ricerca generale restituisce Wikipedia; dopo, nella Cronologia, «Fiume» filtra soltanto le mie visite, anche se il testo è stato espulso. Risultato offline non promette testo scaricato.
5. **Minimo utile:** query locale in entrambe le raccolte, titolo normalizzato con spazi/maiuscole/diacritici, tutti i termini richiesti; filtro mantiene l'ordine originario. Nessun risultato: «Nessun titolo nella cronologia corrisponde…» e azione cancella filtro. Ambito annunciato chiaramente anche a TalkBack.
6. **Esclusioni:** cartelle, tag, ricerca semantica, corpo integrale, ordinamenti multipli, sincronizzazione. Ricerca generale e pertinenza Wikipedia invariati.
7. **Strategia:** App possiede query di raccolta separata dalla query Wikipedia; funzione pura filtra liveRows prima di useReturnRows. ArticleList/ArticleRow riutilizzati. Un controllo locale nella superficie esistente, senza nuova schermata; posizione e tastiera da provare. Conservare query e ordine visivo durante lettore; aggiornamenti sottostanti congelati secondo returnRows. Uno stato vuoto filtrato va distinto da raccolta realmente vuota.
8. **Dati/migrazioni/dipendenze:** nessuna; query effimera separata per saved/history, cancellata all'uscita dalla raccolta. Funziona senza rete/Gemini. Nessun costo o autorizzazione. Normalizzazione locale, non nuovo indice persistente.
9. **Casi limite:** titolo accentato, spazi/query vuota, 500 riferimenti senza paragrafi, save rimosso durante apertura, risultato ultimo rimosso e Annulla, item ripristinato mentre filtro non lo comprende, tastiera e Indietro. Non creare cronologia di query implicita.
10. **Accettazione:** corpus di 500 riferimenti con una voce senza cache trovata per titolo; ordine relativo conservato; zero richieste di rete; cancellazione mostra lista intera; chiusura lettore conserva filtro e non resta bloccata se riga rimossa; swipe/Annulla funziona su lista filtrata. Font grande, ridotto, tema e TalkBack sul dispositivo; nessun cambiamento a sourceRows durante transizione che faccia saltare il ritorno.
11. **Valutazione:** cinque recuperi di titoli noti su raccolta piccola/grande, prima con scorrimento poi col filtro, ordine alternato. Registrare riuscita, passaggi, errori e preferenza direttamente con l'utente; eventualmente durata del compito osservato manualmente, mai permanenza di lettura nel prodotto o nel ranking.
12. **Sforzo/rischi:** medio, soprattutto IME/returnRows/undo. Costo computazionale lineare su massimo 500 titoli, memoizzato per query/dati; nessun lavoro per frame. Manutenzione bassa. Rischio principale riga di origine filtrata/rimossa, già mitigato da endpoint immutabile.
13. **Gradualità/rimandabilità:** prima Salvati, poi Cronologia con gli stessi contratti; entrambe già utili singolarmente. Rimozione del controllo non richiede migrazione. Rimandabile solo se raccolte nell'uso reale restano piccole; non dipende da taratura feed.

## Scheda 2 — Scegliere l'originale nella stessa lettura

1. **Nome/categoria:** Originale / Revisionato per apertura, categoria 3, A.
2. **Problema/scenario:** voglio controllare una frase rielaborata o preferisco l'originale per questa voce. Oggi posso aprire il sito o spegnere Gemini nelle impostazioni per tutte le letture.
3. **Evidenza/confidenza:** `types.ts:2–9` contiene paragraphs e simplified separati; `text.ts:4–10` usa validRevision e readerContinuation. `Reader.tsx:35–39` sceglie l'edizione, `:129` attribuisce Gemini nel footer e apre la fonte. `App.tsx:86` disabilita la revisione secondo l'impostazione globale. Alta sull'assenza di scelta locale, media sull'utilità; attribuzione non assente, migliorabile per controllo individuale. Non nuova comparazione fact-checking.
4. **Prima/dopo:** prima torno a Impostazioni o lascio l'app; dopo «Mostra originale» cambia la sola continuazione di questa lettura e posso tornare al revisionato. Anteprima sempre uguale, fonte/licenza sempre presenti.
5. **Minimo utile:** controllo testuale accessibile nel lettore quando esistono entrambe le edizioni valide, con indicazione dell'edizione attiva vicino all'inizio della continuazione. Scelta effimera per apertura, senza alterare preferenza globale. Il testo originale mostrato è la selezione conservata da Synapse, non la voce completa.
6. **Esclusioni:** diff frase per frase, correzione AI, ulteriore chiamata Gemini, rigenerazione, confronto con revisione live, garanzia di accuratezza o testo integrale Wikipedia.
7. **Strategia:** Reader usa un mode locale nella selezione di readerContinuation; preserva modello canonico e metadati della revisione. Riutilizzare hasRevision, ReaderReveal e freezing lastOpen. Cambio soltanto con lettore aperto; durante chiusura congelare edizione/controllo. Tornare all'inizio della continuazione in modo esplicito al cambio, evitando pixel-offset arbitrari tra testi differenti. Prima verificare in fixture cambio edizione e arrivo tardivo Gemini, senza promettere zero salto.
8. **Dati/migrazioni:** nessuna persistenza nuova, nessuna dipendenza/permesso/costo. Offline possibile se entrambe conservate. AI off: originale; senza revisione valida nessun toggle fittizio. Nessuna chiamata per cambiare modalità.
9. **Casi limite:** revisione invalidata da fonte/config, arrivo durante visualizzazione originale, originale incompleto, switch dal fondo, apertura da lista/shuffle, cambio font, inversione. Scelta originale deve prevalere sull'arrivo tardivo, senza cancellare la revisione in cache.
10. **Accettazione:** alternare dieci volte con zero richieste aggiuntive; anteprima e fonte identiche; corretto testo/label anche offline; assenza toggle su invalidRevision; cambio globale AI conserva cache; nessuna sostituzione di edizione durante chiusura; ritorno/inversione non bloccati; accessibilità stato selezionato e focus coerenti.
11. **Beneficio/prova:** tre testi già revisionati, chiedere di trovare la formulazione originale e tornare alla revisione; verificare comprensione di cosa è stato rielaborato e cosa è una selezione. Feedback diretto, nessuna telemetria.
12. **Sforzo/rifinitura:** medio, rifinitura alta su layout e scroll. Memoria: riferimenti ai due array già presenti, evitare ulteriori copie per frame. Privacy invariata; focus e annunci non per ogni paragrafo. Rischio regressione medio in ReaderReveal/lastOpen.
13. **Introduzione/rimandabilità:** singolo controllo, rimovibile senza perdita di dati. Secondo passo, indipendente da scheda 1; rimandabile per chi usa Gemini raramente. Nessuna reinterpretazione del tempo di lettura.

## Scheda 3 — Sapere se un salvato è leggibile offline

1. **Nome/categoria:** stato locale e recupero singolo dei salvati, categoria 3, B.
2. **Problema/scenario:** salvo una voce per un viaggio e assumo che sia scaricata. Salvataggio e download completo sono azioni diverse; lo scopro solo quando apro senza rete.
3. **Evidenza/confidenza:** `useLibrary.ts:148–156` prepare/setSaved avviano già preparazione, non inventarne una nuova. `:32` pendingFull è in memoria; `:80–90` scheduler lavora quando discovery è attiva; `:114` disattiva discovery fuori Home. `ArticleRow.tsx:16–17` mostra titolo/categoria, non complete. `:136–145` full usa textVersion===3 e gestisce preview offline. `cache.ts:7` protegge salvati. Alta confidenza sul contratto distinto e sulla coda volatile; non prova che i download normalmente falliscano.
4. **Prima/dopo:** prima riga «Fiume» con solo save; dopo metadato «Testo disponibile offline» oppure «Solo anteprima». Nel lettore della voce incompleta, online, azione esplicita per scaricare il testo e risultato persistito; il retry lettore esiste già e va riutilizzato.
5. **Minimo utile:** stato derivato nella riga dei salvati e nel lettore, aggiornato dalla cache; stati preview/completo/loading/errore coerenti. Una voce per volta recuperabile nel lettore con percorso foreground esistente. Non promessa automatica «ogni salvato scaricato». Nessun pulsante laterale alla riga.
6. **Esclusioni:** download massivo, sincronizzazione al lancio, servizio background Android, garanzia di disponibilità della voce completa Wikipedia, AI necessaria, nuove quote/budget.
7. **Strategia:** helper unico di disponibilità usa complete, textVersion, paragraphs effettivi e readerContinuation originale; non soltanto saved o simplified. Riutilizzare full/interactive/remember, ReaderNotice e mergeArticle. ArticleRow accetta metadato accessibile senza alterare la comparsa/uscita stabilita. Lo stato «scaricato» si conferma dopo persistenza riuscita, non all'avvio della richiesta. L'estensione di UI e coordinamento stato è limitata ma va provata.
8. **Dati/migrazioni:** nessun flag persistito duplicato; cache già contiene necessario. Loading/errore della richiesta singola effimeri. Nessun nuovo permesso/costo; offline mostra solo ciò che c'è, Gemini off non ostacola download originale. Protezione salvati resta; storage può crescere con i salvati, quindi evitare recupero indiscriminato.
9. **Casi limite:** saved preview, complete vecchia versione, completo senza continuazione utile, unsave durante download, chiusura/app background, fallimento SQLite, quota Wikipedia, retry doppio, perdita rete, revisione AI priva di originale valido. Non conservare un nuovo job persistente incompleto per questa versione.
10. **Accettazione:** tre fixture (preview, completo valido, cache obsoleta) hanno label veritiere; download singolo non duplicato e lettore preempta riserva; riavvio offline della voce completata mantiene il testo; errore lascia preview/save e azione retry; unsave non viene annullato da risposta tardiva. Nessuna nuova richiesta solo per mostrare la raccolta e nessuna espulsione del salvato.
11. **Beneficio/prova:** prima del viaggio simulato chiedere quali voci saranno disponibili, poi disattivare la rete e controllare previsione vs risultato. Valutare chiarezza, errori di aspettativa e possibilità di recupero, non quantità di download.
12. **Sforzo/rischi:** medio, manutenzione media perché le label dipendono dal contratto versione/testo; rischio medio di stati ottimistici e concorrenza. Energia/rete: nessun polling, azione singola cancellabile, budget/priorità esistenti. Rifinitura tipografica e TalkBack su metadato da verificare sul telefono.
13. **Gradualità:** prima label veritiera (utile da sola), poi recupero singolo coordinato col retry già presente. Rimovibile senza migrazione. Terzo passo; nessuna dipendenza dalle prime due, ma va verificata insieme al toggle originale.

## Scheda 4 — Riprendere volontariamente dal paragrafo

1. **Nome/categoria:** punto locale di ripresa, categoria 3, B.
2. **Problema/scenario:** interrompo un approfondimento, riapro la voce e cerco manualmente il punto precedente. Bisogno plausibile, non ancora misurato; testi relativamente brevi riducono la priorità.
3. **Evidenza/confidenza:** `Reader.tsx:21` inizializza scroll a 0 per istanza; `App.tsx:216` key reader.session ricrea Reader dopo chiusura. `types.ts` e `storage.ts` non conservano un punto di lettura. L'inversione della stessa chiusura conserva già scroll: non confondere questa funzionalità esistente con una riapertura successiva. Dossier v3 esplicita che la posizione di sessione Home non è salvata. Alta sulla lacuna, medio-bassa sul beneficio.
4. **Prima/dopo:** prima riapertura all'inizio; dopo possibilità «Riprendi dal paragrafo» o «Dall'inizio», senza apertura automatica fuori contesto e senza cambiare la posizione Home.
5. **Minimo:** soltanto ultima voce con testo conservato; ancoraggio al paragrafo e identità dell'edizione. Offrire ripresa quando riapro quella voce da percorso normale; non nuova schermata o dashboard. Punto scritto alla chiusura e al passaggio background, non per frame.
6. **Esclusioni:** percentuali/completamento, tempo, streak, apprendimento dallo scroll, ripresa automatica del feed, sincronizzazione, storia di tutti gli offset.
7. **Strategia:** ReaderExpose di un ancoraggio semantico dal layout paragrafi; separare origine geometrica del ritorno e destinazione di scroll. Serializzare attraverso storage queue un record in preferences. Ripristinare dopo layout disponibile e apertura stabilizzata, senza bloccare input o alterare font. ReaderReveal deve rendere visibile il paragrafo raggiunto. Conservare edizione congelata durante closing.
8. **Dati/migrazione:** record opzionale versionato {articleId, editionKey, paragraphIndex}; una sola voce, vecchie installazioni senza record. editionKey deve identificare preview, contenuto originale/revisionato e revisione: riutilizzare revisionInput dove pertinente. Nessun timestamp di permanenza o uso nel profilo. Equivalente storage.web. Nessun servizio, permesso/costo; offline solo testo realmente presente.
9. **Limiti:** font/rotazione, fonte cambiata, Gemini arrivato, testo evictato, indice fuori range, ritorno dal fondo/inversione, Android ucciso prima del lifecycle callback. Se edizione non corrisponde, tornare all'inizio con spiegazione breve; non scaricare testo solo per riprendere. Non garantire salvataggio nell'uccisione improvvisa.
10. **Accettazione:** chiusura/riavvio stessa edizione riporta al paragrafo; cambio font non usa vecchi pixel; cambio edizione invalida; offline senza testo non inventa contenuto; reverse-close resta sulla stessa istanza; nessun evento di apprendimento aggiunto; nessuna scrittura SQLite per frame; nessun timer di permanenza.
11. **Valutazione:** interrompere tre voci in punti noti e recuperarle, con/senza funzione; riuscita e frizione percepita. Prima chiedere se succede davvero con approfondimenti di questa lunghezza.
12. **Sforzo/rifinitura:** medio con rifinitura alta, rischio medio-alto su reveal/scroll/return e persistenza lifecycle. Manutenzione media; memoria limitata a un record. Privacy locale ma nuovo dato eliminabile con «Dall'inizio»; nessuna importazione in Learning.
13. **Gradualità/rimandabilità:** spike mirato in fixture prima di implementare; stabilità dell'ancora su entrambe le edizioni è gate. Se non dimostrata, componente di ripristino diventa D e non si avvia. Dopo stabilizzazione del cambio edizione (scheda 2); utile ma rimandabile. Record ignorabile/rimuovibile se ritirata.

## Primo intervento: sequenza operativa pronta per una scelta successiva

**Analisi mirata:** rileggere App liveRows/useReturnRows e ArticleList/SavedSwipe, fissare politica filtro e query per raccolta. Preparare scenari 0/1/500 voci, titolo senza testo e rimozione ultimo risultato. Verificare impronte rispetto all'inventario prima di toccare codice; preservare eventuale lavoro intervenuto.

**Modifica minima:** filtro puro su titolo, query effimera in Salvati, stato vuoto con cancella filtro. Riutilizzare lista e ritorni, niente schema dati. Estendere a Cronologia dopo gli stessi scenari, non a ricerca online. L'intervento deve essere già percepibile, senza indice o infrastruttura preliminare.

**Verifiche:** test mirati a normalizzazione/tutti i termini/ordine e cronologia evictata; poi scenari integrazione query→apertura→chiusura, rimozione/Annulla, query cambiata e righe fuori schermo. Typecheck e contratti interessati; per handoff del codice rispettare AGENTS: test feed/rete/cache ed export Android. Non necessario rieseguire scansioni globali per progettare il filtro. Build/dispositivo solo se autorizzati nel futuro incarico, distinguendo bundle, APK e prova reale.

**Prova dispositivo:** raccolta controllata senza sostituire dati personali; verificare IME, Indietro, font grande/scuro, ridotto, TalkBack, swipe e inversione. Acquisire schermate/video effettivi e usare skill applicabili se si formulano giudizi visivi. Cinque compiti di recupero e feedback locale; nessuna telemetria.

**Rifinitura eventuale:** se controllo invade il layout o non viene scoperto, confrontare due collocazioni nella stessa superficie; scegliere dalla prova. Se beneficio trascurabile con raccolte reali, fermarsi al minimo o ritirarlo. Non aggiungere cartelle per compensare una verifica negativa.

## Idee escluse e perché

- **Più rapido adattamento e nuovo ranking:** categoria 4, già sviluppati in v3; prima valutazione reale dei risultati. Non introdurre segnali di lettura o durata (categoria 5).
- **«Non mi interessa» e spiegazione esatta delle raccomandazioni:** controllo plausibile ma meno forte delle tre priorità. explainRecommendation espone contributi di punteggio, non provenance dello slot esplorativo/diversità/acquisizione; una label «perché hai salvato X» non è dimostrata. Servirebbe traccia del motivo effettivo e policy per esclusioni negative, undo e varietà. Rimane ipotesi D per spiegazione causale; niente nuova UI prioritaria.
- **Reset/intera esportazione dati:** problema possibile ma non documentato nell'uso. Reset deve distinguere interessi, seen, bookmark contributions, visite e backup di migrazione, evitando riesumazione indesiderata; export file richiede definire formato, chiave esclusa e flusso di condivisione. Studio separato, non «semplice pulsante» e non requisito delle proposte.
- **Cronologia di tutte le schede solo incontrate:** seen conserva esclusioni, non snapshot completo; convertirlo in archivio amplia spazio e ambiguità privacy. Per ora recupero delle aperture già disponibili.
- **Approfondimenti correlati nel lettore:** Wikipedia usa già collegamenti per acquisizione; lista correlati richiede pertinenza/editoriale e nuovo percorso senza perdere origine. Beneficio aggiuntivo non verificato, recupero via ricerca/fonte già possibile.
- **Ricerca semantica, sinonimi/remota nuova AI:** nessuna necessità dimostrata per filtrare titoli locali; costo/manutenzione evitabili. Eventuale qualità ricerca Wikipedia è vincolo diverso.
- **Download di tutti i salvati al lancio:** contrasta lancio progressivo/budget e può ampliare consumo senza controllo. Stato veritiero e recupero singolo coprono il bisogno minimo.
- **Onboarding, notifiche, gamification, social/account:** mancano evidenze; didascalie permanenti e schermate aggiuntive riaprirebbero scelte di semplicità. Nessun motivo per introdurli.
- **Riordinamento manuale categorie, pulsante rimozione laterale, varianti chiusura A/C:** categoria 5, decisioni esplicite da non riaprire senza nuove prove.
- **Nuove ottimizzazioni speculative/GPU o riscrittura architettura:** residuo categoria 4; protocollo prestazioni già esistente, prima attribuire il costo.

## Bug e residui, separati dalle opportunità

Non confermato un nuovo bug grave in questa indagine statica. Save non significa testo completo: contratto esplicito, non perdita dati dimostrata. Cronologia può avere riferimenti non scaricati; fallback offline già corretto. Coda preparazione volatile e gate Home sono limiti osservati, non promessa violata documentata. Assenza di posizione persistente non è regressione della chiusura reversibile.

Scatti residui, TalkBack non certificato, iOS/altri Android, pertinenza reale e punto 12 originale restano elementi dei dossier precedenti. Discrepanza documentale: registro iniziale 0.2.0 non aggiornato alla conclusione dei dossier successivi; consultare interventi 17/18 e v3. Non modificato qui per non sovrascrivere piani.

## Incertezze e verifiche mancanti

1. Bisogni reali: nessuna misura di frequenza/feedback su raccolte grandi, controllo Gemini o interruzioni. Piccole prove descritte in ciascuna scheda, prima di ampliare.
2. UX: nessuna nuova prova visiva/native, TalkBack o batteria. La fattibilità dati non certifica la collocazione dei controlli o la fluidità.
3. Offline: helper disponibilità da verificare sui contenuti realmente utili e dopo write/restart; niente label ricavata solo da complete. Chiarire wording della selezione testuale vs Wikipedia completa.
4. Ripresa: spike su paragrafi misurati/cambio font/edizione/closing prima di impegnarsi; se l'ancora richiede troppa invasività, rimandare.
5. Concorrenza ambientale: CIM non accessibile e Git assente. Impronte consentono rilevare deriva, non attribuirla ad autore o commit. Non assumere equivalenza con APK installato in questa ricerca.
6. Fonti esterne: non necessarie per il minimo selezionato, che riusa contratti presenti. Nessuna affermazione nuova su quote Gemini, API Wikipedia, licenze/compatibilità future. Se un'estensione richiedesse download OS, sharing o nuova API, verificarla su documentazione ufficiale aggiornata prima di approvarla; non requisito implicito del piano.

## Continuità e consegna

Solo nuovi documenti: questo piano, appunti e inventario. Nessuna implementazione, release, installazione o modifica del prototipo. Nessuna suite globale avviata: controlli del codice precedente citati come storici. Verifica finale delle impronte registrata negli appunti; per riprendere usare questo piano e l'inventario, evitando di ripetere la ricognizione salvo deriva dei file.

La scelta successiva può riguardare un intervento concreto. Ordine: filtro locale → scelta originale → disponibilità offline; ripresa solo dopo prova del bisogno e dell'ancoraggio. Le prime tre sono indipendenti nella persistenza; solo la ripresa dipende dalla stabilità delle edizioni.

## Rivalutazione dopo il feedback: intervenire sul valore centrale

L'utente considera secondarie le prime proposte. La selezione precedente privilegiava certezza e basso costo rispetto all'impatto sul motivo per cui si apre Synapse. Le opportunità seguenti cambiano maggiormente scoperta e controllo. Non sono bisogni dimostrati; alcune idee prima rimandate vengono rivalutate alla luce di questa preferenza esplicita, non di nuove prove di soddisfazione. Nessuna modifica al prodotto.

### R1 — Esplorare un tema scelto, senza alterare tutto il profilo

**Categoria 3, fattibilità B; priorità consigliata in questa rivalutazione.** Esempio: dalla voce sulle api scegliere «Esplora questo tema» e ricevere una breve sequenza pertinente su comunicazione, orientamento e impollinazione; tornando a Per te si ritrova il feed precedente. Il vantaggio è passare da discovery passiva a curiosità intenzionale, senza digitare più ricerche.

Evidenza: wikipedia.batch usa già ricerca dal titolo di un segnale e collegamenti dalle seed, mentre App offre categorie ampie e ricerca manuale. interestTerms esiste, ma non produce di per sé una buona query né una tassonomia. Minimo utile: percorso temporaneo dalla voce corrente, una prima selezione limitata di anteprime, ritorno al contesto; non un feed infinito o una nuova schermata obbligatoria. Riutilizzare Feed, richieste Wikipedia e selezione editoriale; stato di sessione distinto da feeds/position/served di Per te. Le aperture/save volontari continuano ad apprendere secondo le regole esistenti, ma il solo avvio del percorso non equivale a interesse permanente.

Prima di implementare, replay su 10 temi con trasporto esistente: una ricerca sul titolo può restituire la stessa voce e omonimi, non contenuti connessi. Questo è il gate: almeno tre candidati distinti e valutati direttamente come pertinenti per la maggior parte dei temi, con costi nel budget; dichiarare scarsità quando manca materiale. Non garantire ora la resa. Offline solo candidati locali plausibili, altrimenti indisponibilità esplicita; Gemini non necessario. Nessuna migrazione o nuovo servizio. Sforzo medio, rifinitura e rischio medio-alti su contesto/ritorno e pertinenza. Prova: seguire una curiosità e verificare se la sequenza invoglia ad approfondire rispetto alla ricerca manuale. Rimovibile eliminando stato di sessione.

### R2 — Feedback esplicito su ciò che il feed sbaglia

**Categoria 3, fattibilità B; secondo passo possibile.** Distinguere «Salta questa voce» da «Meno di questo tema»: scorrere normalmente resta neutro, non un rifiuto. Evidenza: learn supporta open/save/unsave/seen; lo skip non esprime valenza negativa. Non riaprire la personalizzazione v3 già completata: aggiungere un'intenzione che oggi manca.

Minimo: feedback accessibile discreto sulla scheda, Annulla, penalità moderata e limitata della categoria per le future proposte; spiegare che il tema è la categoria, evitando falsa precisione semantica. Nessun blocco permanente, nessuna riduzione della varietà minima, corrente/prefisso fermi. Esclusi negative inference da scroll/durata e algoritmi di comprensione. Modulo feedback separato dai contributi bookmark; record versionato in preferences e parser compatibile, transazione/coda coerente. Nessuna nuova API, offline completo e AI indipendente.

Accettazione: richiesta su un tema riduce la sua presenza quando esistono alternative, senza svuotare feed o annullare varietà; Annulla ripristina contributo esatto; riavvio mantiene scelta; salvataggio successivo non cancella implicitamente il feedback; ricerca/shuffle non personalizzati. Verifica corpus e prova diretta su feed percepito ripetitivo. Sforzo medio, manutenzione e rischio medi; va definito conflitto tra preferenza negativa e save prima di scrivere codice. Beneficio ipotizzato: più controllo quando il feed si incanala male. Rimandabile se non emergono casi reali di insoddisfazione.

### R3 — Piccoli percorsi editoriali con un filo

**Categoria 2, fattibilità B; alternativa più impegnativa.** Le seed circoscritte sono già curate; manca la relazione esplicita tra voci. Esempio «Come vediamo i colori»: una sequenza di 3–5 voci selezionate per costruire un collegamento, non cinque risultati vagamente simili. Potenziale: rendere ogni sessione una scoperta coerente, anziché una serie di estratti scollegati.

Evidenza: editorialSeeds contiene titoli scelti; editorial penalizza ripetizione e favorisce concretezza, non costruisce progressione didattica. Minimo: tre percorsi locali, ciascuno con titoli ordinati e breve motivo del collegamento scritto/revisionato manualmente; testi Wikipedia scaricati con infrastruttura esistente, senza generazione obbligatoria. Scelta volontaria nella superficie esistente, non sostituzione totale del feed. Dati statici versionati, nessuna migrazione delle raccolte. Offline se voci disponibili; salto esplicito di voce mancante, nessuna sincronizzazione bloccante.

Accettazione: ogni percorso ha tre voci reperibili e un collegamento comprensibile verificato da lettura umana; fonte sempre accessibile; uscita ripristina feed; nessuna promessa di acquisizione conoscenze o comprensione misurata. Prova con tre sessioni e domanda diretta su quale connessione nuova si è trovata e desiderio di continuare. Sforzo medio per codice, alto lavoro editoriale ricorrente; rischio tecnico medio, costo manutenzione superiore alle altre. Esclusi catalogo vasto, quiz, badge, nuovi modelli e testi inventati. Preferire questa alternativa a R1 solo se la selezione automatica correlata non dà risultati abbastanza buoni o se l'utente preferisce cura editoriale a libertà di esplorazione.

R1 affronta il cuore della scoperta ma richiede un breve gate di pertinenza prima dell'implementazione. R2 offre controllo con meccanica verificabile, non garantisce soddisfazione. R3 offre più identità al prodotto a costo di cura continuativa. Queste priorità sostituiscono la raccomandazione precedente per l'orientamento espresso nel feedback; le quattro schede iniziali restano valide come interventi secondari.

