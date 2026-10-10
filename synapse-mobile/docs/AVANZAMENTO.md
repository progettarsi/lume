# Base di verifica — primo intervento

Data: 8 ottobre 2026, Europe/Rome. La base iniziale seguente descrive la ricognizione del codice, i controlli e il campione sulla release **prima delle correzioni**. Gli interventi autorizzati successivamente sono registrati in coda, con verifiche e limiti separati.

## Situazione iniziale e integrità

- Letto integralmente `AGENTS.md` nativo e quello del prototipo. Cercati anche gli AGENTS negli antenati e nelle sottocartelle, incluse quelle nascoste, escludendo dipendenze e output Android: non sono emerse altre istruzioni applicabili. Il prototipo `../synapse` è stato consultato soltanto in lettura.
- `synapse-mobile` e gli antenati non sono repository Git: `git status --short` restituisce «not a git repository». Non è possibile classificare file tracked/untracked o ricostruire modifiche locali rispetto a un commit. Date e vecchi log non sostituiscono un diff.
- Versione dichiarata in `package.json`/`app.json`: 0.1.7, Android versionCode 8. React Native 0.86.3, Expo 57, Reanimated 4.5.1, Gesture Handler 2.32.0. Sono già presenti dipendenze, strumenti Android portabili, output Android, APK e QA precedenti. Nessuno strumento installato o aggiornato in questo intervento.
- Prima dei controlli salvato `releases/qa/baseline-2026-10-08/source-inventory.csv`: percorso, dimensione, ultima modifica UTC e SHA-256 di sorgenti, test, asset, configurazioni principali e script. Ricontrollo finale: **0 file inventariati modificati**. Sono stati aggiunti questo documento e i riscontri; i controlli hanno rigenerato output di test/esportazione e possono aggiornare cache degli strumenti.
- Le dichiarazioni in README e `releases/QA-0.1.7.md` sono riscontri precedenti, non nuove prove. AGENTS definisce la personalizzazione come lavoro futuro, mentre il codice e README già implementano apprendimento e ranking: discrepanza documentale da chiarire prima di modificare quell'area.

## Controlli eseguiti

| Controllo | Esito attuale | Riscontro |
|---|---|---|
| `pnpm typecheck`, `pnpm test` | Il launcher tenta una verifica/installazione delle dipendenze e fallisce su `realpath` con EPERM. Non ha eseguito i controlli richiesti; non è un errore del codice. | `typecheck.log`, `tests.log` |
| `node node_modules/typescript/bin/tsc --noEmit` | Superato, exit 0. Stesso compilatore dello script di progetto, senza installazione. | `typecheck-direct.log` (vuoto perché senza diagnostica) |
| `node node_modules/typescript/bin/tsc -p tsconfig.test.json` + `node --test tests/*.test.cjs` | **59/59 superati**, 0 fallimenti, 0 saltati. | `tests-direct.log` |
| Export Expo Android | Primo tentativo bloccato da Hermes: permission denied sul file temporaneo `.hbc` nel sandbox. Ripetuto fuori dal sandbox con strumenti esistenti: superato, 1.142 moduli, bundle Hermes e cinque font. | `export.log`, `export-retry.log`, `export-android/metadata.json` |
| APK | Non ricompilato e non reinstallato. Verificata la release già presente sul telefono, distinta dal nuovo export. | `package.txt`, impronte sotto |

I test coprono estrazione/edizioni del testo, disambiguazioni, cache e protezione dei salvati, rete simulata/cancellazione/timeout, ranking e segnali, paging e ordine delle scritture SQLite. Non montano la UI nativa: non certificano wrapping, touch, chiusura profonda, inversione delle spring, FPS o movimento ridotto sul telefono. Non eseguiti build APK, prebuild, export iOS/web o prove su altri dispositivi: per questa base serviva il bundle Android e la release esistente.

## Mappa delle aree coinvolte

I riferimenti di riga riguardano l'inventario di questa base.

| Area | Percorso e punto di ingresso | Comportamento effettivamente presente |
|---|---|---|
| Comparsa progressiva e layout | `src/components/Reader.tsx:19`, `:21`, `:24`, `:53`, `:58`; `src/content/text.ts`; `src/components/Atoms.tsx`; `src/theme.ts` | Anteprima fissata alla prima apertura con `useRef`; continuazione assente mentre `aiBusy`; incremento React di quattro parole tramite timeout di 30 ms. Ogni paragrafo ha un testo completo invisibile per riservare altezza e un testo parziale assoluto sopra. Reset su cambio delle array del testo, stato busy o reduced motion. Corpo a size impostata, titoli 40/25; font scaling di sistema non disabilitato. |
| Titoli da liste | `src/components/TitleWords.tsx`; `Reader.tsx:75`, `:82`; `App.tsx:213` | Misura ogni parola con flex wrap in origine e destinazione; overlay animato per parola, coordinate influenzate dallo scroll. Le righe sottostanti sono nascoste con opacity mentre il lettore è montato. |
| Chiusura dopo scroll profondo | `Reader.tsx:29`, `:31`, `:37`, `:38`, `:42`, `:47`, `:53`; `App.tsx:119`, `:140` | Scroll aggiornato da callback JS (`scrollEventThrottle=16`), congelato durante chiusura. Geometria della superficie, traslazione con compensazione dello scroll, maxHeight/clipping e title overlay dipendono da progress. Chiusura completata quando progress ≤ .001; guardia sul target prima dell'unmount. Nessuna attesa di misura nella funzione close. |
| Riapertura durante chiusura | `Reader.tsx:54`, `:76`; `App.tsx:126` | Tocco senza spostamento >8 px richiama reopen; la spring viene ritargettata. Close abortisce la richiesta; reopen può ricaricare e reimpostare busy. Va verificato che offset e parole già apparse sopravvivano in tutte le edizioni. |
| Ritorno a cronologia/salvati/ricerca | `App.tsx:103`, `:106`, `:132`, `:140`, `:166`, `:182`, `:195`, `:213`; `src/storage.ts` | Origine row misurata; misura aggiornata mentre aperto quando cache/cronologia cambiano. Cronologia riordina la visita in testa; un salvato rimosso può perdere la riga. ScrollView della raccolta conserva montaggio con key della raccolta; ricerca mantiene query e ripristina focus solo alla chiusura completa. |
| Shuffle e tastiera | `App.tsx:123`, `:142`, `:202`; `Reader.tsx:38`; `src/useKeyboardLift.ts`; `useLibrary.ts:104` | Origine nel pulsante Shuffle; y di ritorno ricalcolata senza tastiera. Pagina ridotta uniformemente. Random online Wikipedia, ripiego sulla cache, esclusione dell'ultimo estratto e degli articoli incontrati. |
| Precaricamento | `App.tsx:84`, `:93`; `src/useLibrary.ts:23`, `:46`, `:94`, `:102`; `src/content/wikipedia.ts:77`; `src/content/cache.ts` | Lotti iniziali fino a 8, successivi 6 con ≤4 residui. Approfondimento della scheda visibile, su apertura o salvataggio. `fullJobs` deduplica per id condividendo promise e signal del primo richiedente. Preparazioni cancellate all'unmount; nessuna cancellazione al solo cambio articolo. Cache ordinaria 30/3 MiB con eccezioni per protetti/salvati; cronologia fino a 500 riferimenti. |
| Gemini | `App.tsx:49`, `:62`, `:65`; `src/content/simplifier.ts`; `src/content/text.ts:14`; `src/key.ts`; `src/content/articleState.ts` | Revisione della sola continuazione all'apertura, mai nel prefetch del feed. Introduzione immutabile; cache validata con versione 2 e ancora JSON dell'anteprima. Timeout 20 s, cancellazione, fallback classico e riprova. Allowlist di modelli e fallback soltanto su 404. Nessuna nuova validazione di quote/modelli del fornitore in questo intervento. Chiave non letta o esportata. |
| Personalizzazione/segnali | `App.tsx:47`, `:48`, `:79`, `:110`; `useLibrary.ts:18`, `:71`, `:84`; `src/content/recommendations.ts`; `src/storage.ts` | Seen dopo 6 s sulla Home; open alla presentazione; save/unsave solo al cambio reale; engaged alla chiusura da 8 s, capped a 180 s, sospeso in background. Pesi: seen .05, open .25, save +5, unsave −5, engaged fino a 3; decadimento 30 giorni, 200 topic, ledger persistente di identità. Ranking e categorie usano questi segnali; ricerca online mantiene pertinenza API. Non viene raccolta profondità dello scroll/completamento. |
| Dock e gesture | `App.tsx:164`, `:206`; `Feed.tsx:24`, `:48`; `CategoryRail.tsx`; `SaveButton.tsx`; `Atoms.tsx` | Dock disabilitato a lettore aperto e portato sopra il lettore durante chiusura; navigazione può eliminare un lettore già in chiusura. Doppio Home aggiorna. Feed con pan interruttibile e massimo un articolo per gesto; tap/doppio tap esclusivi. Liste con Pressable e ScrollView nativi, senza un gestore di soppressione del tap equivalente a quello del prototipo. |

### Confronto con il prototipo, senza modifiche

`../synapse/src/Prototype.tsx` contiene StreamingText (~203), ReaderPanel (~210), ritorno che misura origine e scroll (~239) e gestione tap/drag. `prototype.css` definisce l'aspetto delle parole rivelate. Il nativo conserva la cadenza nominale quattro parole/30 ms, ma sostituisce il testo parziale intero; il prototipo ha span per parola. Il nativo riserva l'altezza completa dei paragrafi, il prototipo monta soltanto quelli rivelati. Sono differenze accertate di implementazione, **non cause dimostrate di un difetto**. Non avviata l'anteprima del prototipo: nessuna sua modifica o consegna è stata effettuata.

## Campione sulla release Galaxy S23

Dispositivo collegato e sbloccato: SM-S911B, Android 16, 1080×2340. Pacchetto `app.synapse.reader`, versionName 0.1.7/versionCode 8, flag senza DEBUGGABLE. Processo 13091 rimasto presente al termine. Avviata la release esistente, nessun APK installato.

SHA-256 APK locale **e APK effettivamente estratto dall'installazione**: `9C7FC46138514F7996554B35931F4666FA6F0585CA0B9CB1242E4014FA20DD2B`, coincidente con il file `.sha256` di progetto. La copia estratta è stata eliminata dopo il confronto per evitare duplicazione di 58 MB; conservati percorso e metadati.

Non assumere identità byte per byte del bundle attuale con la release: il nuovo export ha lo stesso nome Metro `index-c2cfc898c01a1e5f7386952046fdd077.hbc`, ma SHA-256 `B30D38775651429405B983AB2B5145C9EDF3BF44EDC6DE11FD899113258E048D`; l'export preesistente ha `45006153E577B62A8BB8A7072AFBB5B4A27B42F52D0D6EA98FF965BD20DA4BAF`; `assets/index.android.bundle` dell'APK ha `72EDAF0AF77B8BA4C94B3B9E3558D077242CDC293F6C3572F5CBC2767083C1C5`. Motivo non stabilito, nessuna equivalenza sorgente/release dedotta dai soli nomi/versioni.

Font di sistema letto: 1.0; scale animazioni window/transition/animator: 0.5. Non equivalgono a movimento ridotto. Tema scuro osservato. Nessuna impostazione di sistema, rete o font modificata; nessun salvataggio aggiunto/rimosso. Le aperture di prova aggiornano legittimamente cronologia e segnali: primo conteggio disponibile 118, poi 119 dopo Shuffle. Non ripristinata artificialmente la cronologia. Nessuna estrazione del database o della chiave. Lasciati soltanto file temporanei di cattura `/sdcard/synapse-*` sul telefono.

`device-final.png` mostra il lettore Vombatidae con «Caricamento dell'approfondimento…» al momento della cattura finale, non la Home: i tocchi di navigazione ravvicinati non costituiscono prova di navigazione completata. Non misurata la durata di quell'attesa, quindi non classificata come blocco. Metadati e impronte dei riscontri sono in `evidence-inventory.csv`; riepilogo dei controlli in `verification-summary.json`.

| Prova | Esito e limite | Evidenza nella cartella baseline |
|---|---|---|
| Home → Vombatidae, quattro swipe verticali lunghi, freccia chiusura | Rientro completato, anteprima nuovamente visibile. **Confermata osservazione di una fase con superficie vuota durante il rientro profondo**, presente anche nella registrazione; non un blocco persistente. Una prova registrata, frequenza di riproduzione non stimata. | `home.png`, `reader-initial.png`, `reader-deep.png/xml`, `close-deep.png/xml`, `close-settled.png`, `home-deep-close.mp4`, `close-contact.jpg` |
| Salvati → Problematicismo, due swipe, Indietro Android | Lista di quattro salvati ripristinata. Non verificata rimozione della riga durante lettura. | `saved-before.png/xml`, `saved-reader.xml`, `saved-return.png/xml` |
| Cronologia: tentativi di apertura/scroll/ritorno | **Inconclusiva** per verifica della geometria della riga: non conservata una conferma affidabile del lettore aperto prima degli swipe; un ulteriore dump non ha ottenuto idle. Nessun difetto di ritorno dichiarato confermato. | `history-before.xml`, `history-return.xml` (tentativi, non prova di successo) |
| Ricerca online Vombatidae → lettore → due swipe → Indietro | Lettore visibile nella schermata; ritorno con query Vombatidae e controlli della ricerca. Dump reader fallito durante animazione, conservata schermata. | `search-query.xml`, `search-reader.png`, `search-return.xml` |
| Shuffle online → Eastern Conference (NHL) → due swipe → Indietro | Apertura e ritorno confermati; query Vombatidae conservata e tastiera ripristinata. La voce è breve: due swipe non garantiscono la stessa profondità di Vombatidae. | `shuffle-ready.png/xml`, `shuffle-return.png/xml`; `shuffle-reader.*` documenta attesa iniziale |
| Home/Vombatidae: chiusura e tocco dopo pausa richiesta 50 ms | Lettore aperto al termine. Video mostra ritorno e titolo/anteprima all'inizio. **Non certifica inversione della stessa transizione né conservazione dello scroll**: latenza di input e coordinate possono aver prodotto una nuova apertura della sorgente. Da ripetere con timestamp e punto di contatto verificati. | `reversal.mp4`, `reversal-contact.jpg`, `reversal-result.png`, `reversal-settled.xml` |
| Classico/Gemini | Acquisito testo esteso, ma nessuna nuova conferma affidabile dell'attribuzione Gemini/edizione nel campione. Non classificate le prove come nuove verifiche Gemini. QA 0.1.7 riporta precedenti video classico/Gemini da mantenere come riferimento storico. | `reader-footer.xml`, precedenti `../0.1.7/classic-motion.mp4` e `gemini-motion.mp4` |

`reader-initial.STALE-home.xml` è **invalido come riscontro del lettore**: uiautomator ha fallito e il primo pull ha recuperato il precedente dump Home. Ridenominato esplicitamente. Altri dump mancanti per «could not get idle state» non sono sostituiti con successi presunti. Gerarchia XML può includere schermate montate dietro la superficie attiva: la presenza di nodi non dimostra che siano visibili/toccabili.

### Frequenza display, frame prodotti e scatti

- `display-app.txt`: modalità attiva 1, circa **120 Hz** (`renderFrameRate 120.00001`). È lo stato del display, non un contatore di fotogrammi prodotti dall'app.
- Dopo reset gfxinfo e apertura/scroll/chiusura Home: **688 frame renderizzati**, **9 janky (1,31%)**, percentile 50/90/95/99 delle durate 11/13/13/19 ms. Il contatore legacy riporta 352 (51,16%): metrica differente, non intercambiabile. Riscontro `gfx-home-deep-close.txt`.
- Dopo secondo reset, nel campione del tentativo di inversione: **616 frame**, **35 janky (5,68%)**, percentili 6/13/14/15 ms; legacy 206 (33,44%). Riscontro `gfx-reversal.txt`. Il campione comprende input, attesa e acquisizioni; non isola una sola spring.
- Framestats conserva qui 120 righe Flags=0 nel buffer circolare del primo campione; FrameInterval è circa 8,33 ms (`frame-intervals.json`). È la cadenza nominale del frame, non prova di presentazione puntuale. Nessun calcolo di FPS costanti dividendo tutti i frame per un intervallo con inattività.
- Il primo screenrecord è 1080×2340, durata effettiva 35,97 s anche se richiesti 30 s, media del contenitore **12,54 fps**. Include lunghi tratti statici e cattura variabile; non equivale agli FPS dell'app. Il contact sheet ricampiona a 2/30 fps e può duplicare frame: serve a localizzare stati, non a contare scatti. La registrazione e uiautomator possono alterare il carico.
- **Confermati frame oltre la deadline secondo gfxinfo; non stabilita la causa o la fluidità costante a 120 fps.** Per un confronto futuro: reset per scenario, timestamp di start/end gesto, frame presentati/deadline nel solo tratto animato (FrameTimeline/Perfetto se già disponibile), confronto con/senza registrazione. 120 Hz implica budget nominale ~8,33 ms, 60 Hz ~16,67 ms; riportare sempre Hz, frame/FPS osservabili, percentili e deadline mancate separatamente.

Log errori: `runtime-errors.log` comprende crash storici del 7 ottobre e un errore di uiautomator precedente; nessun errore individuato per PID 13091 nel campione. Non attribuire i crash storici alla 0.1.7 o a queste prove. Nessuna dimostrazione di assenza universale di crash.

## Ipotesi da verificare, senza correzioni

| ID | Evidenza statica/osservata | Ipotesi e prova discriminante |
|---|---|---|
| H1 | Timeout JS ogni 30 ms, substring e layout di Text aggiornati, duplicato invisibile; span animati nel prototipo | La cadenza del reveal e il costo di shaping possono contribuire a scatti o differenze visive. Misurare stesso testo lungo classico/AI, timing reale degli incrementi e frame nella sola comparsa; non basta osservare Hz. |
| H2 | Fase vuota osservata in rientro profondo; superficie clip e compensazione scroll | Verificare coordinamento di scroll nativo, translateY, maxHeight e unmount, a offset numerici noti, per Home/row/shuffle. Nessuna riga è dichiarata causa certa. |
| H3 | Reopen rilancia loadReader dopo abort e resetta busy, da cui reset delle parole | La riapertura potrebbe cancellare continuazione già apparsa o perdere posizione. Discriminare inversione prima dell'unmount da apertura successiva, cache completa/AI pending/classico. |
| H4 | Origine row aggiornata mentre aperto; parole d'origine non rimisurate nello stesso effetto | Cronologia spostata, fonte fuori viewport o riga eliminata potrebbero produrre destinazione incoerente. Verificare posizione/word geometry e ritorno sia freccia sia Back, con titolo lungo e font grande. |
| H5 | Prepare non controlla searchOpen/collection; job completo usa signal del primo richiedente | Possibili preparazioni sovrapposte al cambio scheda o richieste non annullate dalla chiusura se proprietario è prepare. Contare richieste e abort con rete lenta; distinguere prefetch del lotto, full e Gemini. |
| H6 | Sessione di lettura parte prima di full/Gemini; non esistono segnali di scroll | Il tempo di attesa può pesare come lettura; inversione può spezzare la sessione. Provare attesa lunga, background, lettura <8/>8 s, close/reopen e ledger in un ambiente di test isolato. È una semantica accertata del codice, non una misura del profilo personale. |
| H7 | Button/SaveButton/Chip non usano useReducedMotion; layout ricerca con durata 180 ms | Copertura del movimento ridotto incompleta nel codice per questi micro-movimenti. Verifica nativa da eseguire; non dichiarare che tutti i movimenti siano già immediati. |
| H8 | Dock sopra il lettore durante close; righe Pressable dentro ScrollView | Verificare touch che inizia su riga/dock e diventa drag, lista corta senza overflow, tap rapido durante rientro e navigazione prima del callback closed. Nessuna apertura accidentale riprodotta con certezza in questo campione. |

## Matrice di verifica per le prossime prove

`MATRICE-VERIFICA.csv` contiene **960 combinazioni pianificate**, non eseguite: 5 origini × 2 edizioni richieste × 3 reti × 2 stati di cache × 2 profondità × 2 chiusure × 2 font × 2 condizioni di movimento. Le prove esplorative sopra non promuovono automaticamente nessuna combinazione a PASS, perché edizione/cache/font applicativo non sono stati certificati integralmente. Il CSV ha campi per stato, risultato, evidenza, build e articolo/revisione.

- Origini: Home, Cronologia, Salvati, Ricerca, Shuffle.
- Edizione richiesta: classica; Gemini. Distinguere Gemini già revisionato, nuova revisione in attesa e fallback: offline senza revisione non deve produrre un nuovo testo AI. Annotare sempre l'edizione effettivamente mostrata.
- Rete: normale, lenta controllata, offline. Cache: completa con versione testo/ancora revisioni valide; mancante/incompleta. Non eliminare dati personali per costruire lo stato mancante: usare articolo nuovo o ambiente isolato.
- Profondità: iniziale y=0; profonda con offset misurato (almeno tre viewport se il testo lo consente) e vicino al fondo. Stesso articolo/revisione per il confronto; annotare voci troppo brevi.
- Chiusura: completa; interrotta da tocco sul contenuto visibile prima dell'unmount (provare varie fasi). Ripetere freccia e Back. L'offset e le parole già apparse devono essere confrontati prima/dopo.
- Font: default applicativo e sistema 1.0; ingrandito applicativo 23, con prova aggiuntiva di font scaling di sistema ≥1,3 e titoli lunghi. Registrare separatamente i due valori.
- Movimento: normale; ridotto effettivamente attivo. La scala animazioni 0,5 non copre il secondo caso. Verificare corpo, titoli, dock, chips, save e riordino liste.

| Priorità | Caso mirato | Criterio da osservare |
|---|---|---|
| P1 | Classico/Gemini da cache, Home y=0 → reveal | Introduzione immutabile; continuazione unica; altezza e wrapping coerenti; cadenza osservata; testo finale completo. |
| P1 | Entrambe le edizioni, Home scroll profondo → close | Nessuna lunga superficie vuota, salto o blocco; titolo/anteprima rientrano; Home conserva articolo/posizione. |
| P1 | Home e ciascuna origine row/shuffle, close → reopen | Inversione della transizione esistente, input disponibile, offset/parole conservati, nessun callback stale che smonta il lettore riaperto. |
| P1 | Gemini su cache miss e rete lenta → close in attesa → reopen | Attesa leggibile, abort appropriato, nessuna risposta su articolo sbagliato, fallback/riprova senza busy permanente. |
| P1 | Offline, cache completa classica/AI; cache mancante | Lettura locale corretta o errore esplicito; nessuna nuova AI offline; salvataggi intatti; query mantenuta. |
| P1 | Cronologia scorsa, apertura da riga non in testa | Misura origine prima/dopo riordino; ritorno visibile e scroll coerente, freccia e Back. |
| P1 | Salvati: rimozione dell'articolo aperto | Destinazione assente gestita senza attesa/blocco; nessun ripristino del salvataggio da download tardivo. |
| P1 | Ricerca: query con risultati che cambiano durante apertura | Query/risultati e focus coerenti al ritorno; righe nascoste non intercettano touch. |
| P1 | Shuffle: online nuovo, offline cache, testo breve/lungo | Ritorno uniforme al pulsante, query e tastiera ripristinate, ultimo casuale escluso. |
| P1 | Testo 23 e scaling ≥1,3, titolo lungo, y profondo | Nessun taglio/sovrapposizione; geometrie per parola coerenti; fonte raggiungibile; dock non copre ultimo contenuto. |
| P1 | Reduced motion, classico/AI pronti e in attesa | Testo pronto subito visibile, transizioni/micro-movimenti coerenti con preferenza, chiusura e focus senza lock. |
| P2 | Feed con 4 residui, cambio categoria, refresh e offline | Lotti piccoli, richiesta deduplicata dove prevista, cache entro limiti considerando protetti, nessuna sincronizzazione massiva. |
| P2 | Sessione attesa vs lettura, foreground/background, save/unsave | Segnali attribuiti alla voce corretta, pesi/ordine/persistenza verificati, ricerca non ordinata per cache. |
| P2 | Gesture liste lunghe e corte, diagonali e drag dal dock | Scroll non diventa tap/apertura; Home/Profile/Cerca restano raggiungibili; nessuna route stale dopo reversal. |

Per ogni caso: registrare build/APK hash, articolo e revisione, edizione effettiva, cache prima/dopo, rete, font app/sistema, stato reduced motion, y e altezza contenuto, sequenza e timestamp input, screenshot/video, frame/deadline e tentativi riusciti/totali. Per la rete lenta usare prima mock/ambiente di prova esistente; un test deterministico di contratto non va registrato come verifica device. Non installare proxy o alterare configurazione del telefono solo per riempire la matrice.

## Verifiche non eseguite o non conclusive

Rete lenta controllata e offline non provocate sul dispositivo; cache iniziale non esportata; Gemini reale/cache/fallback non ricertificati; font grande e movimento ridotto non attivati; riga salvata rimossa non provata; riordino della cronologia non conclusivo; gesture drag/tap e raccolta segnali non misurate sul dispositivo; frame presentati della singola transizione non tracciati. Non sono tutti impedimenti tecnici: diversi casi sono volutamente rinviati per evitare modifiche non necessarie a impostazioni/dati. Limiti tecnici reali: assenza Git, dump uiautomator che talvolta non ottiene idle, nessuna identità byte per byte fra bundle esportati e APK, assenza di una misura isolata dei frame presentati.

La base è pronta per scegliere e riprodurre il primo difetto con condizioni controllate. Non è stata applicata alcuna ipotesi come correzione.

## Intervento 1 — centratura shuffle, 8 ottobre 2026

Richiesta successiva: correggere esclusivamente la centratura del simbolo shuffle, incluso il rientro dal lettore. Rilette integralmente le istruzioni applicabili e questo documento; ricontrollato il codice effettivo. Prima dell'intervento i 67 file dell'inventario iniziale coincidevano con la baseline. Non essendoci Git, conservate copie iniziali di App, Reader e Atoms e un diff finale in `releases/qa/shuffle-alignment-2026-10-08`. Il prototipo non è stato modificato. Questa sezione aggiorna lo stato della precedente analisi senza estenderne la verifica agli altri problemi.

### Cause riscontrate e modifica

- **Contenitore:** il cerchio misura 56×56 dp, ma il Button generico centrava il contenuto nei primi 48 dp. Icona e indicatore di caricamento risultavano 4 dp troppo in alto. Prima della modifica il centro del disegno sullo screenshot aperto era circa 11,5 pixel fisici sopra quello del cerchio.
- **Metriche del simbolo:** il testo del font usa advance/baseline che non coincidono con i contorni. Estratti i contorni effettivi del glifo `shuffle-variant` dal font MaterialCommunityIcons già incluso: units/em 512, advance 512, contorni [43,0,475,384]. Il nuovo ShuffleIcon usa quel medesimo disegno vettoriale alla scala originale di 24 dp, con limiti visibili [1,875;3;22,125;21], centrati su [12;12]. Non introduce spostamenti tarati sul Galaxy o sulla larghezza dello schermo. `glyph-metrics.json` e `shuffle-glyph-path.txt` conservano i riscontri.
- **Transizione:** il vecchio simbolo rimaneva a left/top 16 mentre la superficie si contraeva ed era ruotato/scalato in un contenitore di altezza variabile. La prima iterazione, centrata soltanto sulla destinazione finale, risultava ancora vicina all'angolo nei fotogrammi intermedi; conservata come riscontro in `icon-return-contact.jpg`. La soluzione finale centra il simbolo sulle dimensioni correnti della superficie, calcolate con lo stesso progress già usato dal lettore, mantenendo un pivot 24×24 dp e un ritaglio di comparsa simmetrico. Il rientro finale è visibile in `final-icon-return-contact.jpg` e `final-closed-icon-contact.jpg`.

File coinvolti: `App.tsx`, nuovo `src/components/ShuffleButton.tsx`, `src/components/Reader.tsx`. La faccia decorativa e lo spinner sono centrati sul cerchio 56 dp; il Pressable esistente resta 56×48 dp nella posizione precedente. Atoms è identico byte per byte. Nessuna modifica a ricerca/random, misura dell'origine, superficie/contenuto del lettore, spring, soglie di comparsa, callback o inversione della chiusura. L'icona segue la geometria esistente; non la modifica. Conservate dimensione del pulsante e del disegno, area di tocco e semantica accessibile. Nessuna nuova dipendenza o prova che ricopi proprietà di stile.

### Verifica sul codice e build

TypeScript senza errori; 59/59 test esistenti feed/rete/cache/storage superati (`tests-final.log`); export Android completato (`export.log`); assembleRelease offline completato (`build-final.log`), firma APK v2 verificata (`signature-final.txt`). Rimangono gli avvisi Gradle sulle API deprecate. L'APK QA separato è `Synapse-0.1.7-shuffle-alignment.apk`, versione 0.1.7/code 8 invariati, SHA-256 `4386871CE34B88F385D8A9BC52D1D2355156208224B70C33851278ED014D7680`. L'APK storico non è stato sovrascritto. Installazione aggiornata sul telefono con dati conservati. L'export e l'APK sono verifiche distinte, non viene affermata identità dei loro bundle.

### Verifica effettiva sul Galaxy S23

Galaxy S23 SM-S911B, Android 16, release QA finale sopra identificata. Screenshot e due video `final-open-motion.mp4` / `final-closed-motion.mp4` conservati nella cartella QA. Query “corallo”; articoli casuali “Comportamento manifesto” (partenza con tastiera aperta) e “Josef Kalasanz von Erberg” (partenza con tastiera chiusa).

| Stato | Tastiera inizialmente aperta | Tastiera inizialmente chiusa |
|---|---|---|
| Normale | Simbolo centrato; screenshot `final-normal-open.png` | Simbolo centrato; `final-normal-closed.png` |
| Caricamento | Spinner centrato; `final-loading-open.png` | Spinner centrato; `final-loading-closed.png` |
| Ritorno dal lettore | Simbolo segue il centro durante la contrazione; query e tastiera ripristinate | Stessa centratura durante la contrazione; query conservata, tastiera riaperta secondo il comportamento esistente |

Misurazione dei pixel a riposo e dopo entrambi i ritorni: centro dei limiti del disegno rispetto al cerchio entro 0,5 pixel fisici su entrambi gli assi (`final-pixel-measurements.json`); tale residuo dipende dalla rasterizzazione. Area cliccabile XML con tastiera aperta `[855,1347][1013,1482]`, identica a prima; chiusa `[855,2093][1013,2228]`, identica alla prima iterazione. Video ispezionati anche per fotogrammi della ricomparsa: il simbolo non resta ancorato all'angolo della superficie. Query invariata al rientro e ricerca di “corallo” funzionante. Nessuno strumento installato né configurazione del telefono cambiata.

### Limiti di questa verifica

Prova fisica su un solo Galaxy, orientamento verticale e tema scuro correnti. Altre dimensioni, tema chiaro, font ingrandito e movimento ridotto non verificati sul dispositivo in questo intervento; il calcolo relativo alla superficie e la forma SVG non dipendono dalle dimensioni del Galaxy. Le immagini `outline-56/84/112.png` sono controlli geometrici fuori dispositivo, non prove dell'app su altri schermi. Riapertura interrotta, scroll profondo, Gemini, rete lenta e offline restano nella matrice iniziale e non sono ricertificati da questa correzione. La registrazione e i fotogrammi estratti servono al confronto visivo: campionare un video a 60 fps non misura frame prodotti/presentati, scatti o frequenza del display. Nessuna conclusione prestazionale basata sui 120 Hz. Non sono iniziati altri interventi.

## Intervento 2 — problemi 14 e 1: testo stabile e scroll anticipato

8 ottobre 2026. Letti integralmente AGENTS e avanzamento; ricontrollato Reader effettivo dopo la correzione shuffle. Il codice usava ancora quattro parole aggiunte ogni 30 ms mediante stato React, testo completo invisibile e sottostringa assoluta. Riservare l'altezza non stabilizzava gli a capo del Text parziale. Il fronte non dipendeva dallo scroll e `aiBusy` azzerava anche la continuazione già disponibile. Rimossa questa combinazione, senza modificare il prototipo, App o la correzione shuffle. Le precedenti osservazioni sul rientro profondo non sono considerate risolte da questo intervento.

### Implementazione e compromesso

`ReaderReveal.tsx` monta una sola copia completa di ciascun paragrafo nella sua impaginazione definitiva. Una copertura del colore della pagina scende dall'alto verso il basso, con bordo trasparente→carta di 36 dp. Si muove con una trasformazione, senza cambiare larghezza, contenuto o altezza del Text e senza rasterizzare tutto il lettore in una maschera alpha. Usa LinearGradient e Reanimated già installati; nessuna nuova dipendenza. Il filmato breve mostra la stessa disposizione delle righe prima/dopo la comparsa (`final-short-contact.jpg`). La copertura non intercetta touch ed è esclusa dall'accessibilità; non esiste più un duplicato invisibile del testo.

La scansione automatica parte quando l'apertura ha raggiunto progress .82 e dura 600–1.800 ms in base all'altezza misurata. Lo scroll è ora gestito con Animated.ScrollView sul lato UI: espone istantaneamente tutto il contenuto della viewport raggiunta più mezzo schermo, con minimo tre altezze di riga. Il fronte conserva il massimo già raggiunto; tornare in alto o invertire la chiusura non lo azzera. Nessun timer per parola o aggiornamento React per frame. La firma del contenuto effettivo mantiene stabile l'array dei paragrafi quando cambiano salvataggio, data, origine, busy o riferimenti agli stessi dati.

Il testo scaricato è distinto dallo stato della richiesta: la continuazione classica disponibile può essere letta mentre Gemini lavora; una revisione valida in cache resta visibile anche se busy è true. Arrivando Gemini, viene sostituita soltanto la continuazione selezionata dal contratto esistente `readerContinuation`; l'anteprima fissata all'apertura resta unica e immutata. Un cambio effettivo di edizione può naturalmente cambiare gli a capo: non viene presentato come una fase dell'animazione dello stesso testo.

**Compromesso conservativo:** se l'altezza cambia dopo che una parte è già stata rivelata (font/larghezza/nuova edizione), tutto il nuovo testo disponibile diventa leggibile. Una conversione proporzionale delle coordinate non garantirebbe che righe già lette restino esposte. L'effetto può quindi terminare prima; non riparte e non ricopre testo. Se arriva il primo contenuto dopo un'anteprima senza continuazione, l'effetto breve parte normalmente, oppure lo scroll già effettuato espone la zona richiesta.

Con movimento ridotto la copertura è subito assente. Reader ascolta anche `AccessibilityInfo.reduceMotionChanged`, oltre alla preferenza iniziale Reanimated, per reagire durante l'esecuzione. Le altre micro-animazioni dell'app restano fuori ambito. Non modificate geometria di ritorno, spring o callback del lettore.

### Controlli sul codice e artefatti

- TypeScript superato (`typecheck.log`). **63/63 test**: 59 contratti esistenti più quattro verifiche funzionali su viewport anticipata, monotonicità, reflow/font, movimento ridotto e altezza nulla/breve. Non sono copie di proprietà di stile; non certificano da soli la UI.
- Export Android finale riuscito (`export-final.log`, bundle Hermes `index-e9a3149bca4ad590b118cd3511926b20.hbc`). APK release offline riuscito (`build-release-final.log`), firma v2 verificata (`signature-final.txt`). Restano avvisi Gradle di deprecazione.
- APK di produzione `releases/qa/reader-reveal-2026-10-08/Synapse-0.1.7-reader-reveal.apk`, versione 0.1.7/code 8 invariati, SHA-256 **30664260FB5F316DC9D4FF041A45BB0D9136F2FAE023EA879033C76929857874**. Installato con aggiornamento e dati conservati; APK storici non sovrascritti.
- APK isolato `ReaderReveal-fixtures.apk`, pacchetto `app.synapse.reader.revealqa`, SHA-256 **7790107C69F8EBD6FEE3A667988817E7B9E2123516AAEA64F863CBE864C3DDC2**. Monta il Reader reale con font reali; nessuna rete/storage/chiave. Il classico lungo ha 20 paragrafi, il breve uno; Gemini finale cinque paragrafi. Sono stati simulati i contenuti già in cache e gli arrivi dopo 900/2.200 ms: queste prove non certificano il servizio remoto o SQLite. L'app QA temporanea è stata rimossa dal telefono al termine; APK e istruzioni restano disponibili. Synapse di produzione rimane aggiornato.
- Riproduzione delle fixture descritta in `scripts/qa/READER-REVEAL.md`; build script separato con ripristino byte per byte di entry e configurazione Android. Questi file non sono importati dal prodotto. Dopo i build, index e build.gradle ripristinati, App invariato byte per byte. Copie iniziali/diff nella cartella QA; nessun Git disponibile.

### Prove effettive sul Galaxy S23

Android 16, 1080×2340, tema scuro, font sistema 1.0. Font app 20 e 23 nelle fixture; nessuna modifica al font di sistema. Filmato finale `final-fixtures-motion.mp4`, estratti e screenshot con prefisso `final-` nella cartella QA. Le catture senza prefisso finale e gli APK `iteration-1-*` sono della prima iterazione; non confonderli con gli artefatti finali.

| Caso provato sul dispositivo | Risultato e riscontro |
|---|---|
| Breve, comparsa senza scroll | Bordo sfumato visibile, righe ferme; `final-short-contact.jpg`. L'effetto non ricompone sottostringhe. |
| Classico lungo, due swipe rapidi | Viewport profonda con testo leggibile, nessuna attesa del fronte automatico; `long-fast.png`, `long-deep.png` nella prima iterazione; ripetuto con font 23 nella finale (`final-large-fast.png`). |
| Gemini già disponibile, busy mantenuto | Continuazione visibile; `final-cache.png`. Busy non è più usato come comando per nascondere il testo. |
| Anteprima → classico → Gemini simulati, scroll durante arrivo | Continuazioni leggibili, anteprima unica, sostituzione dell'edizione; `final-incoming.png` e filmato finale. Quando Gemini è più corto, lo ScrollView può limitare l'offset al nuovo fondo: non è perdita della rivelazione. |
| Font app 23, scroll rapido | Testo raggiunto leggibile; impaginazione definitiva per la misura corrente; `final-large-fast.png`. |
| Inversione della chiusura dopo scroll stabilizzato | Stessa istanza riaperta dopo 60 ms. Area testo `(0,300)-(1080,2050)` identica pixel per pixel prima/dopo; `final-before-reverse.png`, `final-after-reverse.png`. Non usato un nuovo montaggio per simulare l'inversione. |
| Aggiornamento estraneo al testo | Cambio salvataggio/data e nuova array con stessi paragrafi: stessa area testo identica pixel per pixel; `final-after-update.png`. |
| Movimento ridotto all'avvio e durante esecuzione | Testo subito visibile; `final-reduced-start.png`, `final-reduced-live.png`. Temporaneamente impostata la preferenza Android realmente letta dalle librerie (`transition_animation_scale=0`), ripristinata a 0.5 in finally. Il primo tentativo con sola animator scale non attivava la preferenza: conservato come `animator-only-*-NOT-reduced.png`, senza classificarlo PASS. Anche animator scale ripristinata a 0.5. |
| App di produzione finale | Articolo reale **Anime**, scroll rapido, Back e nuova apertura: testo leggibile e ritorno completato (`final-production-fast.png`, `final-production-return.png`, `final-production-reopen.png`). Prima iterazione provata anche su Fiocco di neve. Non attribuita con certezza una nuova revisione Gemini a queste aperture reali. |
| Accessibilità | Dump della prima iterazione: una sola introduzione e un solo nodo “Passaggio 1”; struttura invariata nella finale. Copertura decorativa esclusa dal tree. Nessuna sessione TalkBack completa eseguita. |

### Costo Android e limiti

Scelta mantenuta: il campione nativo è compatibile e non richiede maschere offscreen o layout ripetuto del testo. Tre aperture lunghe nella release QA finale, dopo reset dei contatori e **senza registrazione**, producono **544 frame renderizzati, 3 janky (0,55%)**, percentili 50/90/95/99 di **5/7/7/21 ms**, GPU **2/7/7/7 ms**, zero upload bitmap lenti (`gfx-final-no-record.txt`). Il campione comprende rimontaggio e apertura del lettore, non isola il solo costo della copertura. La prima iterazione riportava 726 frame/5 janky; non è un confronto controllato fra vecchio e nuovo motore a parole. Nessuna regressione o miglioramento percentuale dedotti da campioni diversi.

Display rilevato a circa 120 Hz; non equivale a 120 fps prodotti/presentati. Non misurati FrameTimeline isolati o FPS costanti; i contact sheet ricampionati possono duplicare frame. I riscontri attuali sostengono una prima versione utilizzabile sul Galaxy, non garantiscono assenza di scatti su ogni Android.

Il bordo può attraversare una riga: la visibilità è continua, non per parole intere. La copertura presuppone lo sfondo uniforme dell'attuale lettore; future immagini o superfici diverse richiederebbero una revisione. Tutto il testo disponibile entro il limite esistente di 1.100 parole viene impaginato una volta; non è una soluzione di virtualizzazione per libri molto lunghi. Font sistema ≥1,3, tema chiaro, iOS e altri telefoni non verificati fisicamente. Servizio Gemini reale, rete lenta/offline e tutte le origini della matrice generale non ricertificati; le fixture sono deterministiche. Restano fuori ambito la fase vuota della chiusura profonda e gli altri problemi iniziali. Nessuno strumento installato; le sole impostazioni temporanee necessarie alla prova di movimento ridotto sono state ripristinate.

## Intervento 3 — flash del testo prima della sfumatura (8 ottobre 2026)

Richiesta: eliminare la comparsa momentanea della continuazione completa prima del fronte sfumato. Riesaminato il ReaderReveal attuale e le istruzioni AGENTS.md. La modifica interessa soltanto `src/components/ReaderReveal.tsx`; preservati gli interventi precedenti e il prototipo `../synapse`.

### Riscontro e correzione

Nella release precedente il contenuto completo era montato da subito, mentre la misura della copertura arrivava da onLayout e la scansione iniziava solo a progress .82. Non era vincolato il primo disegno del testo alla prontezza di queste due condizioni: nella registrazione precedente appare la continuazione completa attenuata, seguita dal fronte che ne nasconde nuovamente una parte (`before.mp4`, `before-contact.jpg`). Il problema è nella sincronizzazione della visibilità iniziale, non negli a capo.

La continuazione nasce ora con opacità zero, pur partecipando al layout definitivo. La misura e l'eventuale adattamento del fronte vengono applicati insieme sul lato UI tramite runOnUI. La visibilità viene abilitata solo con altezza positiva e raggiungimento della soglia di apertura già esistente, nello stesso percorso che avvia la scansione. Il flag resta acquisito: chiusura interrotta e aggiornamenti non ricoprono testo già mostrato. Il movimento ridotto bypassa immediatamente questa attesa. Anteprima, dimensioni, impaginazione, durata della scansione, scroll anticipato e geometria del lettore conservano i contratti precedenti; nessuna nuova copia accessibile o aggiornamento React per frame.

Una prima variante che attendeva soltanto la misura non eliminava completamente il flash: conservata come `after.mp4`/`after-contact.jpg`, **non è la verifica finale**. La variante finale attende anche l'avvio effettivo della rivelazione (`final.mp4`, `final-contact.jpg`).

### Verifiche eseguite

Riscontri in `releases/qa/reveal-first-frame-2026-10-08/`.

- **Codice:** TypeScript superato, 63/63 test esistenti superati, export Android di produzione riuscito, APK release offline riuscito e firma v2 verificata. Log `typecheck.log`, `tests.log`, `export.log`, `build.log`, `signature.txt`. Nessun test aggiunto che copi le proprietà di stile.
- **Galaxy S23, release QA isolata:** registrate aperture con continuazione lunga e breve. Nei fotogrammi finali esaminati la continuazione non compare completa prima della scansione; il fronte avanza senza il lampo iniziale osservato nella versione precedente. La fixture usa il Reader reale e font reali, con contenuto deterministico. Il contact sheet ricampionato a 30 immagini/s documenta la sequenza visiva, non misura gli FPS né garantisce l'assenza di anomalie in ogni fotogramma su ogni dispositivo.
- **Galaxy S23, inversione:** riapertura della stessa istanza dopo interruzione della chiusura. Area testo `(0,300)-(1080,2050)` identica pixel per pixel prima/dopo (`latch-before.png`, `latch-after.png`, `latch-comparison.txt`). Nessuna nuova occultazione a riposo.
- **Galaxy S23, produzione:** APK installato come aggiornamento con dati conservati; apertura, Back e riapertura dell'articolo reale **Acciaio inossidabile** completati (`production.mp4`). La sua anteprima lunga occupa la prima viewport: questa prova conferma il percorso reale, mentre la verifica ravvicinata del fronte proviene dalle fixture breve/lunga.

APK finale di produzione: `Synapse-0.1.7-reveal-first-frame.apk`, versione 0.1.7/code 8 invariati. SHA-256 **2117560DBAA358FEAD7EE5D6182EE9EA6C49DFF9CBDD097ABB1354BBE1C10CDB**. APK precedenti conservati. La QA temporanea è stata disinstallata; Synapse di produzione rimane aggiornato. Nessuno strumento installato e nessuna configurazione del telefono modificata in questo intervento.

Movimento ridotto verificato sul codice (bypass dal primo montaggio), senza ripetere le modifiche alle impostazioni Android della prova precedente. Gemini reale, rete lenta/offline, altri telefoni e iOS non ricertificati per questa modifica circoscritta. Restano i limiti dell'effetto descritti nell'intervento 2. Nessun impedimento alla consegna della correzione.

## Intervento 4 — problemi 9 e 10; confronto A/B/C del punto 6

8 ottobre 2026. Rilette integralmente le istruzioni applicabili e il documento; esaminati App, Reader e ReaderReveal effettivi prima di intervenire. Conservati gli interventi locali precedenti. Il prototipo non è stato modificato. Nessun Git disponibile: copie iniziali, diff App/Reader, inventario dei file coinvolti e controlli di integrità sono in `releases/qa/reader-return-2026-10-08`. La rivelazione stabile e la correzione del primo fotogramma in **ReaderReveal sono identiche byte per byte**; invariati anche il componente shuffle, l'anteprima fissata all'apertura e il contratto di selezione della continuazione classica/Gemini.

### Situazione effettiva e correzioni comuni

Il Reader iniziale riduceva maxHeight durante la contrazione, interrompeva l'aggiornamento dell'offset appena open diventava false e sommava `scroll*(1-progress)` alla traslazione. La riserva minHeight non manteneva l'estensione dei figli dello ScrollView: con scroll profondo questa combinazione poteva limitare l'offset nativo mentre il disegno usava ancora quello precedente. Il completamento era inoltre anticipato a progress .001. Questi sono riscontri sul codice, coerenti con la fase vuota già documentata; non costituiscono una misura di ogni possibile causa di scatto su Android.

Ora l'impaginazione e l'estensione nativa restano ferme durante la chiusura. Lo scroll reale torna alla cima sul lato UI in 140 ms, mentre la superficie contrae inizialmente solo fino a .94; poi continua il rientro. Dall'inizio dell'articolo la rimozione del testo dura 100 ms. Sono durate delle animazioni, **non attese che bloccano l'input**. Rimossa la compensazione proporzionale all'intero scroll. Il lettore resta montato fino al punto geometrico zero e allo scroll rientrato; callback e sessione impediscono a una chiusura precedente di smontare una nuova apertura. La riapertura cancella le tre animazioni dalla posizione corrente, compreso l'offset raggiunto, senza saltare nuovamente al vecchio fondo.

Un'edizione, stato Gemini o messaggio arrivati durante la chiusura non cambiano il Reader in rientro, che mantiene l'ultima edizione aperta. Invertendo la chiusura può usare i nuovi dati; dopo una chiusura completa valgono cache e caricamento esistenti. La misura iniziale della sorgente resta la destinazione del titolo. Rimosso il percorso che tentava di rimisurare una riga aggiornata/invisibile mentre il lettore era aperto. Il ritorno shuffle conserva l'adattamento esistente alla posizione del composer con tastiera chiusa; le coordinate dell'icona continuano a seguire il centro della superficie.

La visita viene registrata subito da `lib.read`, ma **useReturnRows conserva separatamente l'ordine visivo all'apertura**. L'aggiornamento della lista parte solo quando il titolo è quasi rientrato (progress ≤ .12 e scroll ≤ .5). Anche questo passaggio acquisisce una copia: aggiornamenti ulteriori aspettano la fine visiva. Un'inversione ripristina la sorgente congelata.

Per una promozione fuori schermo o una riga rimossa dai salvati, il vecchio titolo conclude il rientro nella posizione misurata e si dissolve nel breve tratto finale. Non viene attesa una misura di una riga non montata e non viene animato fino alla nuova testa. Solo gli spostamenti delle righe vicine partecipano al riordino; la riga selezionata è esclusa dalla lunga animazione di layout. Cambi generali dei risultati di ricerca non ricevono il riordino locale.

Durante la prima prova di 500 righe il riordino della lista interamente montata arrivava tardi rispetto al rientro, con lo stato di chiusura ancora presente nella cattura. Non è stato isolato con un profiler il contributo di ciascun componente. Raccolte e risultati ora condividono **ArticleList/FlatList**, con finestra limitata, conservando ArticleRow, misure dei titoli e gesture native. La prova finale documenta il completamento e l'ordine aggiornato senza montare contemporaneamente centinaia di righe. Nessuna dipendenza aggiunta.

File di prodotto coinvolti: `App.tsx`, `Reader.tsx`, nuovi `ReaderExit.tsx`, `useReturnRows.ts`, `ArticleRow.tsx`, `ArticleList.tsx`, `src/content/readerReturn.ts`. `tsconfig.json` esclude gli artefatti releases e .test-build: nella cartella QA erano già presenti copie .tsx in `before/`, preservate, che non sono moduli compilabili dell'app. Non cancellate o riscritte per far passare il controllo.

### Confronto temporaneo, senza scelta estetica definitiva

App separata **Synapse confronto**, pacchetto `app.synapse.reader.returnqa`, installata sul Galaxy e lasciata disponibile. Usa Reader, ArticleList, ArticleRow e useReturnRows reali; contenuto deterministico unico, senza rete, SQLite, chiavi o dati personali. Le tre varianti condividono la correzione strutturale sopra descritta e modificano il solo disegno della continuazione:

| Variante | Vantaggio | Compromesso |
|---|---|---|
| A — dissolvenza breve | Poco invasiva e semplice | Minore continuità con la comparsa dall'alto |
| B — espansione inversa accelerata | Conserva il carattere della contrazione esistente, con righe già impaginate | Bordo netto più brusco |
| C — scomparsa dal basso all'alto, bordo sfumato 36 dp | Coerente con la rivelazione iniziale | Fronte più evidente, da valutare personalmente |

B/C usano una copertura del colore della pagina, senza ricomporre testo o creare copie accessibili. La prima iterazione cancellava troppo presto l'intera viewport profonda durante l'inversione: nella finale si mantengono fino a tre righe leggibili finché lo scroll riporta l'anteprima; questa riserva diminuisce continuamente con l'offset. Non è un secondo timer. La copertura conserva il limite dell'apertura: presuppone lo sfondo uniforme corrente e può attraversare una riga. Aggiunge una trasformazione e, per C, un piccolo gradient; non una maschera alpha dell'intera pagina. Nessuna conclusione quantitativa sul costo GPU isolato.

**Raccomandazione da valutare: C**, per continuità con l'apertura; A è la soluzione più discreta, B la più netta. Non applicata una scelta definitiva: Synapse normale mantiene la famiglia di contrazione inversa, ora corretta; selezione A/B/C confinata alla QA. Istruzioni complete in `scripts/qa/READER-RETURN.md`. Home usa lo stesso articolo lungo in tutte le varianti; Grande, Ridotto, Inverti e Arrivo permettono i casi aggiuntivi. Il timer di 90 ms di Inverti è esclusivamente uno stimolo della fixture, non un blocco dell'input del prodotto.

Il comando Lista ↓ prepara 500 righe; occorre poi scorrere o premerlo ripetutamente fino al titolo target. Senza altezze predefinite la lista nativa limita il salto al fondo già misurato: non viene finta una geometria fissa per titoli che possono andare a capo. Questa limitazione riguarda la preparazione della fixture, non la chiusura, che non aspetta alcuna misura invisibile.

### Controlli sul codice, build e integrità

- TypeScript finale senza errori (`typecheck-final.log`). **67/67 test** superati (`tests-final.log`): 63 precedenti più quattro contratti funzionali di ritorno, promozione/rimozione, completamento e riserva delle righe durante lo scroll. Non sono test che ricopiano stili né certificano da soli la UI.
- Export Android di produzione riuscito (`export-final.log`, bundle Hermes `index-7b545d3badc024a943a9ba71f2490540.hbc`). APK normale e confronto compilati offline in release (`build-production.log`, `build-harness.log`), firme v2 verificate. Restano avvisi Gradle di deprecazione. Export e APK sono verifiche distinte.
- Produzione: `Synapse-0.1.7-reader-return.apk`, versione 0.1.7/code 8 invariati, SHA-256 **ABFD16A5D5015DBD7DC86030042AC6DAFF6393E091DF5765D5264B080BD54C8C**. Installato come aggiornamento con dati conservati; APK storici preservati.
- Confronto finale: `Synapse-confronto-ABC.apk`, SHA-256 **07C93EBA44E0AEB4F6C145D46AD7983BE5258B48EC1684B070CD6D50929ECA72**. Il build temporaneo ripristina index.ts, build.gradle e strings.xml byte per byte in finally; ripristino verificato, insieme ai due file protetti del prototipo e ReaderReveal (`integrity-final.json`).

### Prove fisiche realmente eseguite

Galaxy S23 SM-S911B, Android 16, verticale, 1080×2340, tema scuro, font sistema 1.0. Dopo una schermata di blocco iniziale, l'utente ha sbloccato il dispositivo. Nessuno strumento installato. In questa tabella **device-final-** identifica le catture dell'APK di confronto finale e **device-production-** la nuova release normale. Altri prefissi/iteration-1/iteration-2/final- senza device appartengono alle iterazioni intermedie: non usarli come certificazione dell'APK finale.

| Caso | Verifica sul Galaxy e riscontro |
|---|---|
| A/B/C, stesso articolo lungo e fondo | Tutte e tre chiusure completate; anteprima/titolo presenti durante il rientro, senza pagina interamente vuota nei fotogrammi esaminati. `device-final-A/B/C.mp4`, rispettivi deep.png e contact.jpg. |
| A/B/C, stato iniziale e inversione profonda | Nuove aperture e inversione dopo 90 ms della stessa istanza; finale non aumenta durante l'inversione. `device-final-A/B/C-initial.png` e inverse.png. |
| Font app 23, C, fondo e inversione | Stessa istanza 6 prima/dopo, contatore finali 5 invariato; dopo l'inversione resta leggibile la zona corrente intorno a Passaggio 4, senza ritorno al vecchio Passaggio 20. `device-final-large-before-inverse.png`, large-inverse.png, inverse.mp4/contact.jpg. |
| Cronologia, 500 voci, nuova testa fuori schermo | Prima: modello/visivo #499; lettore aperto: modello #0 e visivo #499; dopo chiusura: entrambi #0, un solo finale. Lista resta nell'area Scoperta 494–499, senza titolo che attraversa le altre righe. `device-final-history-before/open/deep/return.png`, return.mp4/contact.jpg. |
| Salvato rimosso mentre aperto | Modello #-1, visivo #4 fino al passaggio; chiusura e rimozione completate. `device-final-saved-removed-open.png`, removed-return.png. Nessun bookmark personale rimosso nell'app normale. |
| Edizione in arrivo durante chiusura | Fixture sostituisce la continuazione lunga con una breve dopo 60 ms; chiusura completata. `device-final-arrival-return.png`; conservata l'edizione del Reader in rientro dal codice. Non è una chiamata Gemini reale. |
| Movimento ridotto simulato nella QA | Font 23, testo subito leggibile e ritorno diretto; `device-final-reduced-open.png`, reduced-return.png. Override esplicito della fixture, distinto dalla preferenza Android. |
| Home reale | Accumulatore agli ioni di litio: fondo, Back, ritorno alla scheda. `device-production-home-deep/return.png`, home-return.mp4/contact.jpg. |
| Ricerca reale | Query fiume, voce Fiume, scroll al fondo e ritorno; query conservata e tastiera ripristinata alla fine. `device-production-search-keyboard/deep/return.png`. |
| Shuffle reale | Comando carabinieri per la tutela del lavoro, partenza con tastiera aperta, scroll profondo e ritorno al cerchio; ulteriore apertura partendo da tastiera chiusa. `device-production-shuffle-open/return-keyboard/keyboard-closed/from-closed.png`, shuffle-return.mp4/contact.jpg. |
| Salvati reali | Problematicismo, fondo e ritorno alla raccolta; salvataggio conservato. `device-production-saved-deep/return.png`. |
| Cronologia reale molto in basso | Raccolta inizialmente di 136 visite, scorsa alle voci più vecchie; Cioccolato aperto, fondo e ritorno alla stessa zona, prima posizione fuori schermo. `device-production-history-bottom/reader-deep/return.png`, history-return.mp4/contact.jpg. |
| Preferenza Android di movimento ridotto | Nuova release normale riavviata con transition_animation_scale=0: Seconda guerra civile inglese, apertura con continuazione visibile, scroll profondo e ritorno diretto. `device-production-reduced-open/deep/return.png`. Valore originale 0.5 ripristinato in finally e app riavviata; `device-production-reduced-settings.txt`. |

### Limiti e verifiche ancora aperte

I video e i contact sheet ricampionati a 30 immagini/s documentano il confronto visivo, **non misurano FPS prodotti/presentati, fotogrammi persi o frequenza del display**. I 120 Hz del pannello non sono una prova di fluidità. Non eseguito un confronto prestazionale controllato tra le tre varianti né un profiler isolato del riordino; il campione precedente di ReaderReveal non viene attribuito a questo intervento.

Non ricertificati servizio Gemini reale, rete lenta/offline, altre dimensioni, tema chiaro, iOS, font sistema ≥1.3 o sessione TalkBack completa. Il font app 23 è stato provato fisicamente; il font di sistema non è stato cambiato. La fixture Arrivo verifica un cambio di edizione, non il trasporto remoto o tutte le possibili tempistiche. La rivelazione precedente è preservata, ma questa verifica non ripete l'intera matrice dell'intervento 2. Nessun impedimento alla consegna delle correzioni strutturali e del confronto; resta deliberatamente aperta la scelta estetica dell'utente. Non iniziati altri interventi.

## Intervento 5 — punto 7 e parte funzionale del punto 8

8 ottobre 2026. L’utente approva il comportamento attuale delle transizioni: mantenuta la variante normale già presente, senza scegliere una nuova estetica. Riesaminati AGENTS, avanzamento e codice effettivo. La nuova preferenza per 20–30 anteprime progressive sostituisce i piccoli lotti come politica generale: aggiornato quel solo punto di AGENTS e allineato README. Il prototipo è intatto. Non essendoci Git, copie iniziali e impronte sono in `releases/qa/feed-reserve-2026-10-08`; ReaderReveal, ReaderExit e ShuffleButton sono identici byte per byte (`motion-integrity.json`). Reader cambia soltanto per il messaggio finale e il suo congelamento durante il ritorno.

### Situazione iniziale e implementazione

La Home aspettava il completamento dell’intero batch prima di pubblicarlo; la cache ordinaria da 30 articoli / 3 MiB comprendeva anche voci già consumate e testi estesi. Non rappresentava quindi una riserva di 30 scoperte utili. Il precaricamento dell’approfondimento poteva contendere risorse alla richiesta del lettore. Questi sono riscontri sul codice, non misure della frequenza delle interruzioni della vecchia release.

- **Primo risultato:** il batch pubblica e conserva ciascuna risposta accettata prima di attendere la successiva. Primo lotto senza cache massimo quattro voci, successivi sei; massimo due risposte API per lotto. Cache e schede già visibili restano utilizzabili durante il caricamento. Non si aspetta il riempimento a 30 per mostrare la Home.
- **Rifornimento:** parte già a 12 schede dal termine. In Home attiva una coda seriale costruisce una riserva globale fino a 30 anteprime utili, favorendo almeno otto voci della categoria corrente quando le fonti lo consentono. Il feed conserva l’ordine delle schede presenti; il cambio categoria non riporta voci consumate. Finestra in memoria limitata a 64 schede e accorciata durante l’avanzamento.
- **Persistenza e identità:** SQLite conserva le anteprime; nessuna nuova banca dati o migrazione distruttiva. Esclusione per ID e URL normalizzato anche per alias nella stessa risposta. Passare una scheda ne registra l’identità senza inventare tempo di lettura o un peso di coinvolgimento. Restano i segnali precedenti. Riavvio, pulizia e cambio categoria non azzerano il registro delle voci consumate. Il refresh consuma soltanto le schede superate e quella corrente, preservando la riserva futura.
- **Spazio:** riserva selezionata ≤30 anteprime, ≤512 KiB complessivi e ≤16 KiB per anteprima. Cache ordinaria aumentata a 80 articoli / 6 MiB. Salvati esclusi dal limite ordinario; articolo aperto, richieste complete in corso, riserva utile e prossime schede protetti dalla pulizia. Queste protezioni prevalgono sul tetto ordinario: non è un limite assoluto di spazio dell’app, né dei salvati. Una voce completa protetta conserva anche il testo esteso, non soltanto i byte dell’anteprima.
- **Richieste:** secondo piano con massimo sei avvii in una finestra mobile di un minuto, una sola operazione alla volta e almeno 1.800 ms tra operazioni. Per ogni lotto massimo due risposte API; ciascuna mantiene il contratto esistente di massimo due tentativi HTTP e timeout 10 s comprensivo del corpo. Non si dichiara un limite di 24 HTTP in ogni minuto: i tentativi di un’operazione possono attraversare le finestre. La soglia riguarda il secondo piano; le richieste esplicite del lettore/ricerca/shuffle hanno precedenza. Un batch foreground è a sua volta limitato a due risposte, con pausa di 30 s dopo errore/nessun risultato utile. Il rifornimento è differito dopo il passaggio dal foreground, evitando una richiesta iniziata e subito superata dal lotto successivo.
- **Priorità e recupero:** apertura, ricerca/shuffle, uscita dalla Home e background Android interrompono la riserva. Il lettore non aspetta la sua conclusione e conserva la protezione fino alla fine della chiusura. I download completi preparatori sono separati da quelli del lettore e accodati, al massimo otto; seguono il riempimento delle anteprime. Errori/lotti vuoti in secondo piano: due riprove automatiche a 30 e 60 s, poi stop dopo tre fallimenti per fonte. Una categoria esaurita lascia proseguire le altre fonti. Ritorno online o Riprova riabilitano i tentativi senza azzerare il budget al minuto. Nessun timer blocca l’input.

### Errori nel lettore

Nuovo ReaderNotice nel fondo: caricamento e revisione hanno indicatore e testo; errore rete, offline, revisione AI indisponibile e contenuto non utilizzabile hanno messaggi distinti, icona e azione. Riprova caricamento controlla nuovamente la connessione; Riprova Gemini usa l’originale disponibile; un contenuto insufficiente rimanda alla fonte. La mancanza della chiave non lascia la revisione in caricamento infinito. L’anteprima fissata non cambia e il messaggio non introduce un’altra copia accessibile del contenuto. Il fallimento Gemini o un errore di download obsoleto non nascondono l’originale completo. Durante la chiusura resta lo stato dell’ultima edizione aperta.

La riserva promette **anteprime**, non testi estesi ancora mai scaricati. Offline il lettore spiega questo limite e mantiene la scheda leggibile. Salvare una voce non equivale alla conferma che il suo approfondimento sia già disponibile offline.

### Controlli e prove fisiche

TypeScript superato, **78/78 test** superati, export Android e APK release riusciti, firma v2 verificata (`typecheck.log`, `tests-final.log`, `export.log`, `build-production.log`, `signature.txt`). Aggiunti undici contratti utili: risposta iniziale prima della successiva lenta, cancellazione, alias, budget/riserva/categorie, stop e ripartenza, priorità, messaggi/originale e persistenza attraverso connessioni SQLite nuove, pulizia ed esaurimento. Nessun test di mera copia degli stili. L’export iniziale nel sandbox non poteva scrivere il temporaneo Hermes; riuscito con gli stessi strumenti e accesso alla cartella temporanea, senza installazioni.

**Galaxy S23, Android 16, APK release QA separata** `app.synapse.reader.reserveqa`: useLibrary, SQLite, parser Wikipedia, Feed e Reader reali; trasporto controllato senza chiavi o dati personali. I ritardi sono nel trasporto della fixture, non una limitazione della rete reale del telefono. Screenshot e XML finali:

| Caso | Risultato osservato |
|---|---|
| Riempimento e riavvio offline | 30/30 anteprime ritrovate, richieste 0; `final-restart-offline`. |
| Esaurimento e nuovo riavvio offline | Pool 0, messaggio esaurimento; dopo riavvio ancora 0, richieste 0; `final-exhausted`, `final-exhausted-restart`. |
| Rete lenta, prima risposta | Pool 2 mentre la risposta successiva è ancora attiva; `final-slow-first`. Non attende tutto il batch. |
| Disconnessione durante download | Pool 4 conservato, richieste annullate e nessun trasporto attivo; `final-disconnected`. |
| Ritorno online | Riserva ricostruita a 30, cache ordinaria 80; `final-refilled`. |
| Priorità del lettore | Prima: req 18 / abort 4 / attive 1. Dopo apertura: req 19 / abort 5 / attive 1, indicatore del lettore. Poi approfondimento completo, full 2 / attive 0 e nessuna nuova richiesta di riserva finché aperto; `final-priority-before/after/complete`. |
| Voce mai approfondita offline | Anteprima mantenuta, messaggio esplicito «non è ancora stato scaricato», Riprova; `final-offline-missing`. |
| Errore rete e riprova | Anteprima, icona, messaggio e Riprova caricamento; riprova riuscita con testo completo. `qa-missing-full`, `qa-ai-failure-original` appartengono alla prima QA; il contratto dei messaggi è invariato nella finale. |
| Gemini indisponibile | Originale completo leggibile e messaggio con icona/Riprova; `final-ai-original`. Fallimento simulato, nessuna nuova verifica di quota Gemini remota. |
| Cambio categoria | Scienza con 17 schede e riserva globale 30; `final-category`. Non rappresenta una garanzia di 30 per ogni categoria. |

APK normale finale: `Synapse-0.1.7-feed-reserve.apk`, versione 0.1.7/code 8 conservati, SHA-256 **94077574C35981C2C5E17D95EC7CC634B6CF840127219DBC24715D58BEDA44FE**. Installato come aggiornamento con dati conservati. QA finale SHA-256 **5C6C5AAFC2D6234A7462190FEF6112E4EB066CAF2FA4BF1AD4C8DE3DC0566040**; selettori e statistiche non entrano nell’app normale. Integrità di prototipo, entry e configurazione ripristinata verificata in `protected-final.json`.

**Galaxy S23, produzione normale:** Home iniziale Pietre mobili, avanzamento di quattro schede fino a Fotosintesi clorofilliana, apertura/scroll/ritorno completati (`production-home`, `production-feed-advanced`, `production-reader`, `production-return`). Ricerca online reale «geotermia»: risultati Geotermia, Geotermia in Italia e Geotermia a bassa entalpia; apertura della prima voce, originale completo e fondo con revisione Wikipedia 152058740 (`production-search`, `production-network-reader`, `production-network-footer`). Il testo completo è osservato, ma non è stata estratta la cache personale per attribuire ogni voce a un primo download o al riuso. Nessuna indisponibilità Gemini remota provocata. Le prove controllate di riserva non vengono presentate come misure della rete Wikipedia reale.

APK effettivamente installato confrontato con il finale: impronte identiche (`installed-integrity.json`). Rimossa soltanto la nuova app QA temporanea dopo le prove; il suo APK e le fixture rimangono disponibili nel progetto. Synapse normale lasciato sulla Home. Nessuna chiave o database personale estratto; le normali aperture di verifica aggiungono visite e segnali di lettura.

Aree coinvolte: coordinamento in `App.tsx`/`useLibrary.ts`, politica nuova in `content/reserve.ts`, batch Wikipedia, budget cache, fusione/stato/continuazione articolo e nuovo `ReaderNotice`. Storage mantiene schema e contratti esistenti; la sua nuova politica usa i limiti aggiornati del modulo cache. Sorgenti dei test in `tests/reserve.test.cjs` e `tests/reserve-storage.test.cjs`; aggiornato soltanto l’URL non realistico di una vecchia fixture di feed per distinguere il test degli alias. Harness e script di compilazione sotto `scripts/qa`.

### Limiti

L’obiettivo 20–30 dipende da rete, qualità delle voci e identità ancora disponibili; non è garantito immediatamente al primo avvio né in ogni categoria. Una riserva interamente consumata richiede nuove risposte online. Non misurati byte effettivi trasportati o tempi su una rete lenta remota; le prove lente/offline fisiche usano il trasporto controllato, quelle automatiche verificano i contratti. Non ricertificati iOS, altri telefoni, font di sistema ingrandito, TalkBack o tutte le combinazioni della matrice iniziale. Nessuna nuova conclusione su Hz/FPS/scatti: queste prove riguardano disponibilità e priorità dei contenuti. Nessuno strumento installato e nessuna configurazione del telefono cambiata.

## Intervento 6 — punto 3, preparazione Gemini durante la sosta

9 ottobre 2026. Riesaminati integralmente AGENTS e lo stato effettivo di App, Feed, download, cache e avanzamento precedente. Nessun Git nel progetto: copie iniziali/impronte in `releases/qa/gemini-dwell-2026-10-09/before.json` e relativi `.before.txt`. Preservati rivelazione, primo fotogramma, transizioni e scelta estetica attuale. Reader e ReaderReveal restano identici byte per byte; nessuna modifica al prototipo.

### Situazione iniziale e comportamento implementato

Il testo originale aveva già una coda preparatoria coordinata con la riserva. Gemini partiva solo nel lettore e la validità della revisione precedente controllava versione/anteprima, senza un'identità completa del contenuto e della configurazione. Riscontri sul codice, non misure retroattive dell’attesa della vecchia APK.

- **Sosta:** `AI_DWELL_MS=3500` in `content/aiPreparation.ts`, configurabile internamente. Conta una permanenza continua sulla sola scheda ferma, dopo lo scorrimento e l'ingresso laterale, nella Home visibile e con app attiva. Cambio scheda/categoria, ricerca/raccolta, lettore o background azzerano il conteggio. Gli aggiornamenti di cache/metadati non riavviano lo stesso timer. Feed segnala solo i cambi dello stato visibile dal lato UI; nessun aggiornamento React a ogni fotogramma.
- **Idoneità:** preferenza AI già attiva, chiave salvata disponibile, stato di connessione utilizzabile, nessuna revisione valida, nessuna generazione speculativa già in corso. Una chiave in modifica non viene usata prima del salvataggio. Nessun nuovo servizio, modello, dipendenza, fatturazione o chiave inserita nel prodotto.
- **Coordinamento:** la preparazione riutilizza ReserveScheduler, Wikipedia.full, remember e SQLite. La riserva delle anteprime mantiene precedenza: obiettivo globale 30 e almeno otto nella categoria quando possibile. Si conserva il budget condiviso di sei operazioni al minuto, intervallo 1.800 ms e una sola operazione di secondo piano. Ulteriore massimo di **due avvii preparatori speculativi per minuto**, inclusi quelli cancellati prima di Gemini. I limiti sono mobili e in memoria per processo; cambio chiave/categoria non li azzera, un nuovo processo sì. La soglia di 3,5 secondi rende idonea la scheda, non garantisce l’avvio o la conclusione entro quel tempo. Il riempimento iniziale può ritardare Gemini.
- **Apertura:** il lettore rivendica il lavoro prima di interrompere il secondo piano. Se riguarda la stessa identità/anteprima/contenuto, riusa sia il download originale sia la generazione in corso. Se riguarda un altro articolo, lo annulla e dà precedenza alla richiesta esplicita. Il testo originale viene reso disponibile prima di aspettare Gemini. Nessuna duplicazione della sua anteprima; il risultato tardivo è applicato soltanto alla richiesta e all’articolo ancora correnti.
- **Cancellazione:** cambio della scheda, uscita dalla Home, offline/background, disabilitazione AI o cambio chiave annullano localmente il lavoro speculativo inutile. Una preparazione già adottata dal lettore segue invece la sua richiesta; la chiusura la annulla. Versione di configurazione e signal vengono ricontrollati prima di salvare/applicare risultati. **Abort locale non garantisce di recuperare quota già consumata dal servizio remoto.** Non si dichiara un risparmio di quota basato sui soli abort.
- **Errori:** niente ripetizioni automatiche della stessa identità tentata nella sessione. Registro limitato a 200 identità, errori a 80; massimo due avvii/minuto anche passando rapidamente tra schede. Quota: sospensione globale speculativa di dieci minuti; altri errori: un minuto. Autorizzazione non valida sospende fino a cambio configurazione o a una riprova esplicita riuscita. Le aperture normali rispettano sospensioni/errori già registrati; Riprova nel lettore può eseguire un tentativo intenzionale. Un successo del generatore riabilita il servizio e conserva il budget. Nessun ciclo di retry speculativo. Originale e messaggio finale con icona/azione restano disponibili.

### Validità della cache e dati locali

Nuovo contratto `simplifiedVersion=3`: `revisionInput` comprende configurazione di prompt/modelli/parametri/estrazione, ID, fonte, titolo, revisione Wikipedia, versione di testo, anteprima fissata e paragrafi originali. Identità esatta serializzata, senza hash soggetto a collisioni; salvata soltanto accanto al testo locale e compresa nel budget della cache. La costante `REVISION_CONFIG` va incrementata quando cambia quel contratto. Non comprende la chiave: una revisione valida già ottenuta resta valida dopo un cambio di credenziale, mentre le richieste in corso vengono annullate. Salvataggi, visite e metadati estranei al contenuto non invalidano la revisione. Le vecchie revisioni v2 restano conservate, ma non sono considerate valide: l’originale è il ripiego fino alla nuova revisione v3. Nessuna migrazione distruttiva, cronologia/salvati conservati.

Le copie leggere della cronologia non conservano la nuova identità contenente i paragrafi; il dato resta nell’articolo in cache. Il flag `simplifiedPrepared` permette di distinguere una preparazione conclusa ancora non utilizzata dalla revisione ottenuta esplicitamente. Riserva e download originali non riutilizzano metadati AI di un nuovo contenuto.

Misure locali persistenti in `preferences.ai-metrics`, tramite la coda SQLite esistente; getter interno `lib.aiMetrics()`, nessun pannello permanente o analisi esterna. Solo contatori e ultime **40** coppie di durate, con modalità cache/inflight/explicit/fallback; niente ID, titoli, chiavi, testo o timestamp. Parser con allowlist dei campi, valori finiti non negativi e campioni limitati.

`preparations` conta le preparazioni accettate; `adoptedPreparations` include l’adozione del solo download originale. `specStarted` conta soltanto generazioni Gemini iniziate prima dell’apertura; `usedInFlight` quelle adottate mentre in corso; `usedCached` quelle concluse e poi aperte. `unused` comprende quelle concluse ancora non usate e quelle annullate/fallite prima dell’adozione; viene ridotto se la cache preparata viene poi usata. `cancelled` e `failures` danno contesto. Le durate misurano dalla richiesta d’apertura accettata alla disponibilità dell’originale/revisione, **non il primo fotogramma dipinto**. Le aperture abbandonate prima del risultato non entrano nei campioni; un risultato vecchio non consuma il campione di una nuova apertura.

### Controlli e valutazione della soglia

TypeScript e **88/88 test** superati: dieci nuovi contratti coprono sosta continua e reset, riuso durante il download, apertura immediata, cambio chiave/disabilitazione/cancellazione, quota e retry intenzionale, concorrenza/budget, validità della cache, diagnostica senza dati sensibili, contenuto cambiato e risultati tardivi. Esteso il test SQLite per persistenza delle misure attraverso nuove connessioni e assenza del contenuto duplicato nelle visite. Le fixture v2 dei test precedenti sono state aggiornate al nuovo contratto v3; non eliminati i controlli precedenti. Nessun test di mera copia delle proprietà di stile.

Per valutare successivamente 3,5 secondi, confrontare per esempio 2,5/3,5/5 secondi con stesso dispositivo, font, fonti, AI e condizioni di rete; raccogliere almeno 20 aperture completate per gruppo. Confrontare mediana e p90 dell’attesa AI, separando cache, adozione in corso e generazione esplicita; osservare anche attesa originale e rapporto lavoro inutile/generazioni speculative. I soli contatori cumulativi non dimostrano un guadagno causale: occorre annotare esternamente le condizioni del gruppo e usare differenze tra letture. Non usare i tempi fissi del generatore simulato per dichiarare una soglia ottimale o un miglioramento percentuale reale.

### Riscontri sul Galaxy e limiti

Galaxy S23 SM-S911B, Android 16, verticale 1080×2340. L’utente ha sbloccato il telefono. QA release separata con trasporti controllati e parser/SQLite/componenti reali, descritta in `scripts/qa/GEMINI-DWELL.md`; nella QA nessuna quota Gemini personale consumata. Nella prima iterazione il frammento HTML della fixture aveva più radici e il parser conservava soltanto l’introduzione: corretto con un contenitore, senza modificare il parser di prodotto. **device-final-** identifica le catture dell’APK QA definitivo; **final-** appartiene alla penultima iterazione e documenta anche apertura immediata e swipe rapidi. Le APK iteration sono conservate e distinte.

| Caso | Riscontro osservato |
|---|---|
| Apertura immediata, penultima QA | `final-immediate-original.png` / `.xml`: originale leggibile con stato revising, AI 1, nessun riuso. Il generatore viene chiamato una sola volta. |
| Riuso in corso, QA definitiva | `device-final-inflight-before.png`: AI 1/full 1, reuse 1 già persistito dalla sessione precedente. Dopo apertura `device-final-inflight.xml`: ancora AI 1/full 1, reuse 2. Nessun download/generazione duplicati. |
| Cache preparata, QA definitiva | `device-final-cache-before.png`: AI 2, cached 0, unused 2. Dopo apertura `.xml`: AI resta 2, cached 1, unused 1. Il lavoro concluso viene riconosciuto e riutilizzato. |
| Cambio rapido e annullamento, penultima QA | `final-rapid-change.png`: nessun nuovo AI passando tre schede rapidamente. Dopo una sosta `final-cancel-before.png` AI 3; cambio scheda/offline porta abortAI 1 e unused 1 (`final-offline-cancel.xml`). Non sono catture della nuova variante finale del controllo di ingresso laterale. |
| Background con budget disponibile, QA definitiva | Dopo nuova sessione, online per circa un secondo, Home Android per cinque secondi, ritorno: `device-final-resume-before.png` AI 0/req 0. Quattro secondi dopo: `device-final-background-generating.png` AI 1/full 1. Nuovo Home durante la generazione, ritorno e Offline: `.xml` AI 1/abortAI 1, unused da 1 a 2. Tempo in background non maturato e generazione annullata. |
| Offline, QA definitiva | `device-final-background-offline.xml` e `device-final-offline-stable.xml`, distanti cinque secondi: AI 2, req 2, nessuna operazione attiva, anteprima conservata. Anche il contratto automatico copre cancellazione e risultato tardivo. |
| Quota e font app 23, QA definitiva | `device-final-quota.png` / `.xml`: AI 2, originale completo leggibile, icona/messaggio Quota QA e Riprova. Riapertura `.xml`: AI ancora 2, nessun nuovo tentativo automatico. Azione Riprova: AI 3 e stato senza errore (`device-final-quota-retry.xml/png`). Il font di sistema non è stato modificato. |

TypeScript, 88 test, export Android e build APK finali riusciti (`typecheck.log`, `tests.log`, `export.log`, `build-production.log`, `build-harness.log`). Bundle di produzione `index-e877ab7cbaf5e9e337bdc721d5c2da70.hbc`. Firma v2 verificata; restano avvisi Gradle/CMake sul toolchain/percorso Windows, senza errori di build. Versione 0.1.7/code 8 conservati. APK normale **Synapse-0.1.7-gemini-dwell.apk**, SHA-256 **CBFBC7E494600FB9C53E90F381439724D1E369DFB71E71F821C8114DFE9DF540**; QA definitiva **Synapse-Gemini-QA.apk**, SHA-256 **4A48D5C36BA4B0455B723BCB309E683AF2DF8934669D93D245CF84AC2B3BC8BF**.

APK normale installato come aggiornamento, dati conservati; impronta della base installata identica al file finale (`installed-integrity.json`). Home **Biblioteca della Dieta nazionale del Giappone**, apertura e ritorno alla stessa scheda verificati (`production-home/reader/return.png`); inviati anche swipe al lettore. Questo controllo normale non certifica una nuova richiesta Gemini reale né il guadagno di attesa. Nessuna chiave/database personale estratto. Rimossa soltanto la nuova app Gemini QA dopo le prove; APK e sorgenti della fixture restano nel progetto. App normale lasciata sulla Home. Prototipo, entry e configurazione Android ripristinati verificati in `protected-final.json`. Le normali aperture aggiungono visite/segnali di lettura.

Restano fuori da questa verifica servizio Gemini remoto, tempi/byte su rete reale lenta, iOS, altri telefoni, font sistema ingrandito e TalkBack. Cambio chiave, AI disattivata, fonte modificata e limite del servizio sono provati nei contratti automatici; non alterate chiave/preferenze AI personali per provocarli nel prodotto. Movimento ridotto e animazioni del lettore non sono ricertificati fisicamente in questo intervento: relativi componenti preservati. Nessuna modifica all’estetica o agli strumenti/configurazioni del telefono. Nessuna nuova conclusione su Hz, FPS prodotti/presentati o scatti; le catture statiche verificano stati e contatori.

Aree coinvolte: App, segnalazione di visibilità del Feed, useLibrary e SQLite; nuovi coordinatore `aiPreparation.ts` e identità `revision.ts`, metadati/fusione dell’articolo e classificazione degli errori Gemini. Nessun intervento successivo iniziato. Nessun impedimento alla consegna; la soglia resta intenzionalmente da valutare con misure reali.

## Intervento 7 — punto 4, prima taratura della selezione

9 ottobre 2026. Rilette integralmente le istruzioni applicabili e l'avanzamento; riesaminati temi iniziali, collegamenti, parser, filtri, ordinamento, esclusioni e riserva correnti. Nessun Git: sorgenti precedenti e impronte in `releases/qa/editorial-selection-2026-10-09/before/` e `before.json`. Nessuna modifica al prototipo. `source-integrity.json` conferma identici App, useLibrary, raccomandazioni, AI/Gemini, identità delle revisioni, storage e gli altri moduli di contenuto preservati. Reader/Reveal e geometria delle transizioni non modificati.

### Situazione iniziale e modifica

La selezione precedente valutava soprattutto quantità di testo, densità/formule e gergo. Accettava definizioni di discipline intere, mentre alcuni temi iniziali erano ampi; una regola sul titolo numerico respingeva anche opere comprensibili. I consumati venivano esclusi dopo un primo limite, con il rischio di perdere candidati utilizzabili. Questi sono riscontri sul codice, non giudizi retroattivi dell'utente.

Nuovi moduli `editorial.ts` e `editorialSeeds.ts`: taratura locale sui testi già ricevuti, senza HTTP, AI o download estesi aggiuntivi. Specificità nella definizione, presenza di relazione/meccanismo/impiego, esempio/luogo/data/quantità e leggibilità concorrono alla precedenza. Il controllo delle definizioni ombrello combina disciplina e studio/portata astratta nel testo; non basta una parola del titolo. Densità e codici/termini lunghi penalizzano, senza confondere specificità con oscurità. Il filtro divulgativo richiede contesto minimo e frase conclusa invece di soli 180 caratteri; una definizione corta come Braille o Cianotipia resta utilizzabile. Le voci di catalogo astronomico sono riconosciute dal contenuto, senza respingere tutte le opere con titoli numerici. I filtri precedenti per disambiguazioni, frammenti, gergo/formule e contenuti inadatti restano attivi.

Tutte le **13 categorie** restano disponibili. I nuovi temi d'ingresso privilegiano esempi interni: Stele di Rosetta/Ponte aereo per Berlino nella storia, Capillarità/Pendolo di Foucault nella scienza, Camera oscura/Cianotipia nelle arti. I nuovi titoli sono stati verificati su Wikipedia; corretti titoli mancanti o disambiguazioni durante la preparazione. I redirect vengono risolti normalmente. `seed-probe.json` contiene 23 temi nuovi rispetto al catalogo precedente, con fonti/revisioni e testo acquisito: tutti disponibili e ammissibili nel controllo HTML finale. Non è una misura di successo dell'API. I temi specifici precedenti riutilizzati non sono conteggiati come nuovi.

La scoperta casuale e l'esplorazione dei collegamenti rimangono: nessuna whitelist totale o esclusione di categorie ampie. Si ordinano soltanto candidati non ancora pubblicati, penalizzando sovrapposizione tematica con le ultime tre voci e sequenze della stessa categoria quando ci sono alternative. Non si spostano schede già pubblicate o destinazioni del lettore. Identità consumate e duplicati di ID/fonte si controllano **prima** del limite editoriale. Ricerca esplicita conserva l'ordine di rilevanza Wikipedia e può trovare Storia; il criterio di scoperta si applica al feed, shuffle e ammissibilità della riserva. Nessun cambio a pesi, segnali o architettura della personalizzazione.

Se una risposta contiene solo testi leggibili con segnali editoriali deboli, pubblica subito un ripiego, massimo **uno per risposta**, senza aspettare il giro successivo. Non si allentano insufficienza o disambiguazione. Limiti di giri, timeout/retry, consumati, riserva 30/512 KiB, cache e sei operazioni di secondo piano al minuto restano invariati. Un'assenza di risultati utile segue gli stop/tentativi finiti già previsti; nessun ciclo nuovo. I salvati/attivi non vengono eliminati perché la taratura ora preferisce altri temi.

`EDITORIAL_TUNING.enabled=false`, impostato prima dell'inizializzazione, ripristina temi e selezione/ordinamento precedenti. Le due correzioni del filtro divulgativo in `text.ts` rimangono; le copie iniziali consentono anche il ripristino integrale. Nessuna preferenza sperimentale nell'interfaccia. Soglia iniziale 1,35, penalità di ampiezza 0,7 e ripetizione 1,2 sono prudenti parametri interni da ritarare dopo la revisione editoriale, non valori ottimali dimostrati.

### Campione confrontabile e risultati

Consegnati **CAMPIONE-50.md** e **campione-50.csv** nella cartella di QA. Stessi 50 candidati e testi prima/dopo: 26 temi iniziali precedenti (primo/terzo per categoria), sei controlli ombrello dichiarati, 18 collegamenti non preselezionati dalle introduzioni. Fonti Wikipedia e revisioni, provenienza, motivazioni sintetiche, breve estratto e colonna utente vuota. Nessuna valutazione/interesse dell'utente inventati. Baseline eseguibile congelata; replay offline documentato in `scripts/qa/EDITORIAL-SELECTION.md`. I 23 nuovi temi sono verificati separatamente, senza inserirli nel corpus per favorire il dopo.

L'API dal computer ha risposto **HTTP 429**, anche sull'endpoint riassuntivo. Interrotti i tentativi; acquisizione diagnostica tramite normali pagine HTML pubbliche, senza modificare il provider dell'app. Il corpus non riproduce l'ordine del generator API. Alcune introduzioni non vengono estratte da questo HTML: ciò non dimostra che Wikipedia non abbia testo. Il campione è stratificato, non rappresentativo di un feed casuale.

| Misura sul corpus congelato | Prima | Dopo |
|---|---:|---:|
| Candidati pubblicabili nei gruppi confrontati | 42/50 | 33/50 |
| Prioritari / ripieghi dopo | — | 24 / 9 |
| Categorie rappresentate | 13 | 13 |
| Riserva prodotta dai rispettivi contratti reali | 30 | 30 |
| Coppie consecutive della stessa categoria nella riserva | 9 | 9 |
| Sequenza massima della stessa categoria nella riserva | 2 | 2 |
| CPU desktop, mediana su 120 replay dei 50 testi | 1,75 ms | 6,45 ms |
| CPU desktop, p90 | 2,00 ms | 6,98 ms |

35 candidati sono ammissibili dopo, ma due ripieghi non entrano nei gruppi confrontati. La minore resa **42→33** è un costo esplicito: il campione raggiunge ancora 30 e conserva varietà, ma non prova la stessa disponibilità in ogni categoria/rete. Il costo locale resta piccolo su questo computer e non aggiunge richieste; non è una misura Android. Il test con seconda risposta sospesa prova che il primo ripiego viene pubblicato subito entro lo stesso budget. Impossibile certificare latenza API reale dal computer sotto rate limit. Non aumentati lotti o giri per compensare artificialmente la resa.

### Verifiche e limiti

**97/97 test**, TypeScript ed export Android superati. Nove nuovi contratti: specificità indipendente dal titolo, definizioni corte complete, quantificatori in un paradosso, scarsità/ripiego, varietà del nuovo tratto, esclusioni/alias prima del limite, primo risultato prima del rifornimento lento, ricerca/riserva offline e reversibilità con categorie mantenute. Adeguata la fixture del filtro di catalogo per controllare il contenuto anziché il solo titolo; conservati tutti gli altri contratti di rete/cache/Gemini. Log e diagnostica nel dossier QA.

APK release firmato **Synapse-0.1.7-editorial.apk**, versione 0.1.7/code 8, SHA-256 **0F34010000B68DF92CF484E580B58A4E2AC711098F130E4D3ED159B6560F56CB**. Build e firma v2 riuscite; avvisi già presenti Gradle/CMake sui percorsi Windows. Bundle export `index-cb7678c608ab2162dcc82eabc34e5c69.hbc`. Aggiornamento installato sul Galaxy S23 con dati conservati, impronta installata verificata uguale. `device-home/reader/source/return` documentano scheda **Bunker**, apertura, scroll al fondo con attribuzione Wikipedia/CC BY-SA, azione alla fonte e ritorno alla stessa scheda. Questa prova usa i contenuti già disponibili: non certifica acquisizione di un nuovo lotto remoto, latenza comparativa, riempimento da zero o qualità editoriale di 50 schede sul telefono. Non estratti database o chiavi, non cambiate impostazioni; le aperture normali registrano visite/segnali.

La qualità/interesse resta una **stima testuale**, non una comprensione editoriale certificata: Arte passa ancora come ripiego, Internet resta prioritario per i fatti disponibili; alcune voci specialistiche possono passare e opere senza parole-segnale possono essere sottostimate. Questi casi sono visibili nel campione e sono candidati alla tua valutazione, non preferenze che ti attribuiamo. Le categorie dei collegamenti sono quelle della rotta di acquisizione, non una nuova classificazione semantica. Non verificati tempi su rete lenta reale, prestazioni CPU su altri telefoni, iOS o accessibilità fisica in questa taratura; componenti e contratti precedenti preservati. Nessuna nuova conclusione su Hz/FPS/scatti.

Aree coinvolte: temi iniziali, selezione Wikipedia e shuffle, filtro divulgativo e inserimento/ammissibilità della riserva; campione e strumenti di replay. Nessuna nuova fonte, nessun intervento successivo iniziato. L'unico impedimento alla misura remota comparativa è il rate limit osservato; il risultato è implementato e provabile, con taratura ancora soggetta a revisione editoriale.

## Intervento 8 — punto 11, rimozione dai salvati con swipe e Annulla

9 ottobre 2026. Rilette AGENTS e avanzamento; esaminati ArticleList/ArticleRow, ritorno del lettore, salvataggi e code SQLite attuali. L'immagine `eliminazione.jpg` è solo riferimento visivo: nell'app l'azione è **Rimuovi dai salvati**, non Archive. Nessuna modifica al prototipo o agli interventi su selezione, riserva, Gemini, rivelazione e transizioni del Reader. Copie iniziali/impronte nel dossier `releases/qa/saved-swipe-2026-10-09/before/` e `before.json`.

### Comportamento e persistenza

Prima le liste non offrivano swipe di rimozione; l'utente poteva togliere il segnalibro dal lettore. Il rollback dopo errore usava lo stato ottimistico precedente: una rimozione e un annullamento entrambi falliti potevano lasciare un segnalibro diverso da quello realmente persistito. Inoltre una vecchia copia dell'articolo passata a un salvataggio poteva sovrascrivere un'edizione più recente. Riscontri sul codice, coperti ora dai contratti.

- Nuovo `SavedSwipe`: la riga segue direttamente il dito sul lato UI, limitata tra zero e la propria larghezza. Dietro emerge la superficie terracotta con icona `bookmark-remove-outline` e label; il lato destro della riga è arrotondato. Oltre soglia compaiono bordo evidenziato, spunta e **Rilascia per rimuovere**: il significato non dipende solo dal colore.
- Soglia **42% della larghezza effettiva** della riga, non un numero di pixel legato al Galaxy. Solo un rilascio riuscito oltre soglia conferma; tornare sotto soglia disarma. Velocità senza proiezione di distanza: uno swipe corto veloce non rimuove. Influenza solo l'uscita, limitata a 110–210 ms. Sotto soglia/cancellazione: rientro dalla posizione corrente, interrompibile con una nuova presa. Cancellazione in background non conferma.
- Riconoscimento sinistro oltre 12 dp, fallimento se il movimento verticale supera 9 dp prima dell'attivazione; un solo dito. Il pan cancella il tap nativo quando riconosciuto. Il titolo resta un comando distinto dal pulsante di rimozione. Nessun blocco globale dell'input o attesa temporale prima di poter interagire con le altre righe.
- La rimozione si registra **al rilascio**, senza attendere l'animazione. ArticleList conserva la riga visiva fino all'uscita e al collasso di 160 ms, poi le successive occupano lo spazio. Gestione distinta per righe consecutive, senza rimuovere la stessa due volte. Nessuna React setState per fotogramma di trascinamento.
- Comando visibile accessibile **Rimuovi dai salvati: titolo**, area minima 48 dp, equivalente allo swipe. **Annulla** ripristina l'ultima rimozione; per rimozioni consecutive si può premere più volte. Avviso senza scadenza, chiudibile esplicitamente, massimo 32 rimozioni nella sessione. Il registro Annulla non persiste dopo un nuovo processo; gli stati dei segnalibri sì. Nessuna cancellazione di articolo/cronologia legata allo swipe.
- `BookmarkWriter` serializza rimozione, undo e salvataggi normali. Mantiene ultimo stato confermato e versione per ID: un errore tardivo non sovrascrive un'intenzione successiva; il rollback usa lo stato durevole, anche se rimozione e undo falliscono entrambi. Gli avvisi/registro hanno token per evitare risultati tardivi relativi a un'altra operazione. Undo fallito offre riprova soltanto se il segnalibro risulta ancora rimosso.
- SQLite cambia il flag di un articolo esistente preservando testo/revisione attuali e cronologia; solo un ID assente viene inserito dal payload. Anche il fallback web conserva l'edizione esistente. Un download successivo continua a usare le protezioni già presenti contro la resurrezione di segnalibri rimossi.
- Il wrapper e lo spazio del comando rimangono uguali durante apertura/chiusura del lettore; la rimozione nella lista è disabilitata mentre il lettore è presente. Nessuna modifica dell'endpoint del titolo o del protocollo di ritorno quando la riga viene tolta dal lettore.
- Movimento ridotto: tracciamento diretto del dito, nessuna animazione automatica di rientro/uscita/collasso o scala dell'azione. Nuovi pulsanti di rimozione/avviso senza spring. Rimane il feedback statico della soglia e il comando senza swipe.

### Verifiche

**102/102 test**, TypeScript ed export Android superati. Cinque nuovi test di contratto coprono soglia/inversione, velocità limitata, rimozione+undo accodati, due scritture fallite, undo fallito e errore tardivo. Esteso il test SQLite con riconnessione dopo rimozione, ripristino, testo/cronologia conservati e nuova edizione non sovrascritta da una vecchia richiesta. Conservati tutti i contratti precedenti. Nessun test di mera copia delle proprietà di stile. Protocollo e catture: `scripts/qa/SAVED-SWIPE.md` e dossier QA.

Galaxy S23 SM-S911B, Android 16, 1080×2340, accessibile senza cambiare impostazioni. Stato iniziale: **quattro** salvati, Problematicismo, Hyalinobatrachium pellucidum, Déjà vu, Mito della caverna. `baseline-*` documenta la vecchia app. Un primo install fu rifiutato durante la copia incompleta del file: nessun aggiornamento o perdita dati; le catture `baseline-repeated` appartengono ancora alla vecchia app.

La matrice fisica completa usa **Synapse-saved-swipe-matrix.apk**, SHA-256 **EA41822FBA239CEC50ACDA6FB94D7F8B6F38F803B7E0E439EB6EF1DC471692E1**. Le catture storicamente denominate `final-*` sono di questa versione strutturalmente completa. L'APK di consegna successivo elimina anche il pulse dei nuovi pulsanti con movimento ridotto e affina l'avviso dopo doppio errore: verifica finale distinta con prefisso `delivery-*`.

| Caso sul Galaxy, matrice | Riscontro |
|---|---|
| Swipe corto veloce | `final-short`: quattro righe, nessuna apertura/rimozione. |
| Dito mantenuto oltre soglia | `final-threshold-held`: superficie, bordo, label e indicazione di rilascio; quattro segnalibri ancora presenti. `final-armed-held` è una presa precedente ancora sotto soglia, non la prova dell'armamento. |
| Inversione prima del rilascio | `final-threshold-disarmed`: ritorno completo, quattro righe. |
| Conferma al rilascio | `final-removed-one`: tre righe, avviso e Annulla. |
| Cancellazione in background e gesto verticale | `final-cancelled` / `final-vertical`: tre righe conservate, nessun lettore aperto o nuovo segnalibro rimosso. La lista breve entra tutta nello schermo: non è una misura del movimento di una lista lunga. |
| Rimozioni consecutive / comando equivalente | `final-consecutive-two`: due righe; i tap sui pulsanti completano quattro rimozioni. `final-last-removed`: lista vuota, Annulla disponibile, avviso quattro rimozioni. |
| Undo consecutivi | `final-undo-two`: due righe; `final-undo-all`: quattro, ordine originale. |
| Riavvio dopo ripristino | `final-restart-restored`: quattro righe persistite. |
| Rimozione dal lettore e chiusura dopo scroll profondo | `final-reader-removed-return`: tre righe, ritorno senza aspettare la riga mancante. |
| Riavvio dopo rimozione | `final-restart-removed`: tre righe, Problematicismo assente dai salvati. |
| Articolo/cronologia conservati | `final-history-retained`: Problematicismo ancora in cronologia. Riaperto e risalvato; `final-originals-restored` e `bookmarks-restored.json`: quattro titoli originali, stesso ordine. |

Le prove del lettore registrano normali visite/segnali; non estratti database, chiavi o preferenze personali. Nessun servizio nuovo, nessuno strumento installato e nessuna configurazione del telefono modificata. Non provocati guasti del disco Android. Errori e concorrenza verificati nei test, non sul telefono con un filesystem guasto. Movimento ridotto verificato sul codice; TalkBack e impostazione Android di movimento ridotto non ricertificati fisicamente. Non misurati Hz/FPS/scatti o fluidità comparativa con un tracciamento di frame.

Aree coinvolte: ArticleRow/ArticleList, nuovo SavedSwipe, App per Annulla/avvisi, useLibrary e scrittura dei segnalibri in storage native/web; nuovo coordinatore bookmark e test. Dettagli dell'APK finale e verifica di consegna registrati sotto. Nessun intervento successivo iniziato.

Consegna finale: **Synapse-0.1.7-saved-swipe.apk**, versione 0.1.7/code 8, SHA-256 **FBA5EF5EA465CFB0155BF94AEFF0362BB6C130AA096BD164AD2EAEFFC1AE800C**. Firma v2, build release e integrità dell'APK installato verificati (`signature.log`, `build-production.log`, `installed-integrity.json`). Bundle export `index-6c5372dfae575555a9a37133e8d5e939.hbc`; 102 test e TypeScript finali riusciti. Restano avvisi toolchain/percorsi Windows già presenti, senza errori di compilazione.

Sull'APK definitivo `delivery-saved/threshold/removed/undo` confermano nuovamente quattro segnalibri mentre il dito è oltre soglia, tre soltanto dopo il rilascio, quattro dopo Annulla, con stessi titoli/ordine (`delivery-verification.json`). Aggiornamento installato senza cancellare dati; app lasciata sui salvati ripristinati. Prototipo, Reader/Reveal, preparazione Gemini e selezione editoriale preservati, con impronte nel dossier. Nessun impedimento alla consegna; prove fisiche di TalkBack/movimento ridotto, lista lunga dei salvati e guasti di scrittura Android rimangono non eseguite e non sono dichiarate superate.

## Intervento 9 — revisione estetica del punto 11

9 ottobre 2026. Correzione richiesta dopo la prova dell'utente: trascinamento scattoso, testo dell'azione che cambiava disposizione/dimensione, indicazione di soglia improvvisa, ripristino quasi istantaneo e pulsante laterale non desiderato. L'intervento 8 rimane come resoconto storico: le sue scelte visive sono superate da questa revisione. AGENTS aggiornato per rendere esplicita la priorità della qualità del movimento e dell'estetica originale. Nessuna modifica al prototipo.

### Causa osservata e modifica

Il pannello precedente cambiava larghezza con la distanza trascinata: la label veniva nuovamente impaginata mentre la riga si spostava. La scala dell'azione variava e una scritta supplementare compariva istantaneamente oltre soglia. Il collasso dell'altezza animava il layout della lista a ogni frame; Annulla reinseriva la riga senza una transizione d'entrata coordinata. Sono riscontri nel codice e nel video precedente, non una causa unica dimostrata per ogni scatto percepito.

- Superficie sempre a dimensione piena, azione con larghezza fissa del 42% della riga; il movimento rivela tramite clipping, opacità e traslazione. Nessuna scala o larghezza del testo legata alla distanza. Label **Rimuovi dai salvati** invariata; spunta e lieve tintura in crossfade di 150 ms oltre soglia, senza nuove scritte.
- Ripristinato il Pressable dell'intera riga con titolo e freccia originali. Eliminato il pulsante laterale. L'equivalente senza swipe è un'azione accessibile della riga, senza aggiungere elementi visivi. Prima riga: titolo di nuovo nei bounds [68,469][927,551], come nell'estetica precedente al punto 11.
- Traslazione direttamente sul lato UI. Soglia proporzionale e conferma esclusivamente al rilascio mantenute; inversione disarma. Spring di rientro riprendibile dalla posizione corrente. Velocità influenza soltanto l'uscita, ora 180–260 ms. Nessun blocco dell'input tramite timer.
- Rimossa l'animazione dell'altezza della singola riga. La riga visiva rimane fino alla fine dell'uscita; poi le celle successive traslano in 260 ms tramite Animated.FlatList. Annulla reinserisce con breve traslazione/dissolvenza di 260 ms mentre le altre celle occupano le posizioni corrette. Se la riga è ancora presente, annulla l'uscita e rientra dalla posizione corrente. Avviso Annulla con entrata/uscita breve, senza scadenza.
- Movimento ridotto: niente transizioni automatiche aggiunte; il dito conserva il controllo diretto e il feedback resta leggibile. Nessuna modifica a BookmarkWriter, storage, rollback/versioni, protezione del testo o cronologia. Nessuna modifica a Reader/Reveal, riserva, Gemini o selezione editoriale.

La prima build candidata ha evidenziato sul Galaxy un crash Android in BackgroundDrawable.draw, durante il disegno degli angoli non uniformi a misura iniziale nulla. Corretta la forma usando raggio uniforme statico, con angoli sinistri fuori dal clipping: il lato destro resta arrotondato senza interpolare i raggi o modificare la geometria del titolo. Nessun aggiornamento di dipendenze/configurazioni. La build corretta si avvia e completa le prove senza nuovi crash nei processi controllati. La sequenza automatizzata iniziale ha proseguito quando Synapse era uscita: catture estranee eliminate; aggiunte guardie sul foreground prima/dopo input e catture. Nessun riscontro estraneo usato nella verifica.

### Verifiche e consegna

**102/102 test**, TypeScript ed export Android superati. Nessun test aggiunto di mera copia degli stili. Build release, firma v2 e integrità dell'APK installato verificate. APK **Synapse-0.1.7-saved-motion.apk**, versione 0.1.7/code 8, SHA-256 **3546CA3AD0ABE9B3ADCE7E2EDA55D2FD5F9373C05DAC8D4A87F48FD92D9F02ED**. Bundle export `index-fd9936d362f5e3cde8fc5ccb96eb8f6e.hbc`. Dossier `releases/qa/saved-motion-2026-10-09`, protocollo `scripts/qa/SAVED-MOTION.md`. Rimangono avvisi toolchain Windows già presenti.

Galaxy S23, Android 16: registrate due rimozioni/undo e gesto corto; visionati fotogrammi intermedi del ripristino, non soltanto gli endpoint. `held-near/far` mostrano stessa label a due distanze oltre soglia, nessuna scritta aggiuntiva; `reversed` conferma quattro salvati dopo inversione. Rimozioni consecutive fino a zero (`last-removed`), quattro undo con ordine originale (`all-restored`), persistenza dopo riavvio (`restart-restored`). Aggiornamento senza cancellare dati; quattro segnalibri originali ripristinati. Nessuno strumento installato o impostazione del telefono modificata. Le aperture del lettore mantengono i normali segnali di visita.

| Campione gfxinfo | Prima | Dopo |
|---|---:|---:|
| Fotogrammi prodotti | 301 | 451 |
| Fotogrammi in ritardo | 9 (2,99%) | 5 (1,11%) |
| Mediana / p95 / p99 | 5 / 7 / 13 ms | 5 / 5 / 8 ms |

Stesse azioni, durate della registrazione 12 e 20 s e guardie/pausa differenti: confronto diagnostico circoscritto, non benchmark statistico. Frequenza del display, frame prodotti e scatti non sono equivalenti. Non si deduce fluidità da “120 Hz”, né FPS dell'app da video o contact sheet ricampionati. L'input ADB non misura la latenza del dito umano. Nessuna promessa di assenza assoluta di scatti: il campione ha cinque frame in ritardo.

Il tap della prova `quick-undo` precede la comparsa del comando e non viene accolto: non è una prova fisica riuscita dell'inversione durante l'uscita. Ripristinato poi normalmente; inversione implementata e verificata sul codice. TalkBack, movimento ridotto e font di sistema ingrandito non ricertificati fisicamente; impostazioni lasciate invariate. Non ricertificate liste lunghe o altri telefoni/iOS, né guasti reali di scrittura. I contratti automatici di concorrenza/persistenza restano superati. Il prototipo conserva le impronte precedenti.

`reader-open/deep/return-final` documentano inoltre apertura di Problematicismo, scorrimento e ritorno ai quattro salvati con titolo nelle coordinate originali. `bookmarks-restored.json` verifica titoli/ordine e assenza del vecchio pulsante laterale. `source-integrity.json` confronta i moduli già tracciati con la consegna precedente: Reader/Reveal e infrastrutture preservate.

Aree coinvolte: SavedSwipe, ArticleRow, ArticleList, avviso Annulla in App, istruzioni e QA. Nessun intervento successivo iniziato.

## Intervento 10 — destinazione del ritorno shuffle

9 ottobre 2026. Richiesta dell'utente: animazione e pulsante shuffle non si ricongiungono nella posizione prevista. Riesaminati AGENTS, avanzamento, App, Reader, ShuffleButton e gestione tastiera correnti. Copie dei sorgenti e impronte in `releases/qa/shuffle-return-2026-10-09/before/` e `before.json`. Conservati i risultati precedenti, incluso il movimento dei salvati; prototipo non modificato.

### Difetto riprodotto e causa

Sulla release saved-motion installata, shuffle avviato con tastiera aperta → ChemSusChem → chiusura: la superficie e la sua icona terminano vicino alla posizione iniziale sopra la tastiera, mentre il pulsante della ricerca è già sceso al fondo. Nel video `before-return.mp4` sono visibili due cerchi separati prima dell'unmount. Area cliccabile del pulsante reale: [855,1347][1013,1482] con tastiera aperta, [855,2093][1013,2228] chiusa. Non si tratta di un nuovo errore nelle metriche del simbolo.

App aggiorna già l'origine shuffle per il ritorno senza tastiera. Tuttavia `Reader.surface` passava a `useAnimatedStyle` la lista esplicita `[returnDetached]`. Nell'implementazione Reanimated installata questa lista governa il riavvio del mapper: se returnDetached non cambia, la closure continua a leggere l'origine misurata all'apertura. La nuova coordinata fornita alla chiusura rimane esclusa. Il primo sospetto sulla formula della destinazione non è la causa confermata: il difetto riprodotto è la mancata acquisizione della geometria aggiornata da parte della superficie.

### Correzione

Tolto soltanto l'elenco ristretto delle dipendenze della superficie, lasciando a Reanimated le dipendenze reali della closure (origine, dimensioni, colori e distacco). Cerchio, contenuto e icona usano così la geometria corrente. Non introdotti offset, nuove durate, attese di misurazione o blocchi di input; dimensioni 56 dp, area di tocco, disegno SVG e comportamento ricerca/tastiera conservati. Nessun aggiornamento React per fotogramma. Rivelazione, chiusura profonda/inversione, salvati, Gemini, cache e prototipo preservati.

### Verifiche

102/102 test esistenti, TypeScript ed export Android superati. Nessun test che si limiti a ricopiare proprietà dello stile. Build release e firma v2 riuscite, con soli avvisi toolchain Windows già presenti. APK **Synapse-0.1.7-shuffle-return.apk**, versione 0.1.7/code 8, SHA-256 **677DCC6CC5340B853830BE5943343D4E2E44C47E4AAC72590ED8A41AF7930630**; bundle export `index-059359bd20a3978fbc4219a58548d58f.hbc`.

Galaxy S23, Android 16, tema scuro corrente:

- Tastiera inizialmente aperta → Biblioteca di Alessandria → chiusura: `after-return-open.mp4` e contact sheet mostrano la contrazione sul cerchio reale al fondo, senza il vecchio cerchio sospeso. Tastiera ripristinata dopo la chiusura come prima.
- Tastiera inizialmente chiusa → Setanta Sports Cup → due swipe fino alla zona finale/fonte → chiusura: `after-reader-scrolled` e `after-return-closed.mp4`. Ritorno al cerchio corretto; successiva riapertura della tastiera secondo il comportamento esistente. Non è stato misurato un offset numerico di tre viewport.
- Dopo entrambi i ritorni: area cliccabile con tastiera riaperta [855,1347][1013,1482], invariata. Layout dell'icona/pulsante e scala del testo non modificati.

Queste sono prove della release normale sul dispositivo, distinte dai controlli automatici. Video ricampionati a 20 immagini/s solo per ispezione visiva: non misurano FPS o scatti, né dimostrano fluidità dai 120 Hz. Articoli diversi nei due video, perché shuffle conserva la selezione casuale reale; il confronto riguarda la geometria, non il tempo del testo o di rete.

APK installato con dati conservati, impronta uguale al file di consegna (`installed-integrity.json`); nessun crash nel processo finale esaminato. `source-integrity.json` rileva soltanto Reader modificato nei moduli già tracciati; App e infrastrutture invariati. La raccolta finale contiene tre salvati, Problematicismo, Déjà vu e Mito della caverna (`saved-preserved`). Il conteggio iniziale di questo intervento non è stato acquisito: non si dichiara identità prima/dopo con i quattro della precedente sessione, né si modifica un segnalibro per ricostruire arbitrariamente quel vecchio stato. Nessuna operazione di salvataggio/rimozione inviata nella prova; relativo codice invariato.

Non cambiati font, movimento ridotto o altre impostazioni del telefono; tali varianti controllate nel codice, non ricertificate fisicamente. Non ripetute inversione durante chiusura, rete lenta/offline, altri telefoni/iOS o la matrice completa del lettore. Normali visite/segnali registrati dalle aperture, senza estrazione di DB/chiavi. Nessuna dipendenza o strumento nuovo. Aree coinvolte: soltanto superficie animata in Reader e dossier QA/documentazione. Nessun intervento successivo iniziato.

## Intervento 11 — punto 5: personalizzazione locale separata

9 ottobre 2026, esecuzione programmata delle 04:09 Europe/Rome. Primo intervento della sequenza richiesta: completato e controllato prima di iniziare dock/messaggi. Letto AGENTS nativo, avanzamento e implementazione corrente; conservate copie iniziali in `releases/qa/personalization-2026-10-09/before`. Nessuna modifica al prototipo. Le sezioni iniziali descrivono stati storici, non l'implementazione nuova.

### 1. Segnali e migrazione

Il vecchio profilo mescolava interessi e un peso derivato dal solo tempo dall'apertura. Il nuovo profilo v2 conserva integralmente seen, interessi aggregati e timestamp validi; crea dimensioni di lettura inizialmente neutrali. Migrazione SQLite atomica, con copia originale `learning-v1-backup` conservata nella raccolta privata, una sola volta. Non ricostruisce falsi completamenti dalle vecchie visite né duplica i pesi dei salvataggi. I contributi individuali dei vecchi salvataggi non sono ricavabili dall'aggregato: la rimozione di un segnalibro migrato non inventa una penalità. Cronologia, articoli e salvati non sono eliminati dalla migrazione. Idempotenza, rollback e riavvio verificati sull'adattatore nativo con SQLite reale nei test, non sul database personale.

Apertura: peso debole 0,2, con deduplicazione per identità canonica in sei ore. Scheda incontrata: esclusione persistente, senza supporre lettura. Il conteggio Home ora richiede anche primo piano e scheda stabilizzata. Salvataggio: +5, deduplicato per intenzione; rimozione sottrae soltanto il suo contributo ancora presente dopo il decadimento, mai disinteresse assoluto. Undo ripristina senza accumulare ripetutamente peso. Scritture del profilo serializzate; segnalibro e relativo profilo sono nella stessa transazione SQLite. BookmarkWriter conserva ottimismo, versioni e rollback già esistenti. Il test provoca un errore fra scrittura del segnalibro e del profilo: entrambi tornano allo stato persistito precedente.

Il lettore invia al massimo due campioni al secondo dal lato UI, senza aggiornamenti React per fotogramma o per campione. La misura combina tempo attivo, intersezione visibile a due campioni consecutivi e permanenza in 40 porzioni verticali del testo. Sono stime di esposizione, non parole certamente lette. Esclusi titolo/fonte/avvisi, parte ancora coperta dalla sfumatura, attesa del testo completo, background, apertura/chiusura e intervalli lunghi senza campioni. Il classico completo resta misurabile mentre Gemini elabora, perché è effettivamente leggibile. Una viewport immobile ha un budget di 45 secondi; spostamenti rapidi non ricevono credito di attraversamento. La posizione finale non vale completamento.

Sessione unica fino alla fine visiva della chiusura: invertire la chiusura riprende lo stesso raccoglitore; deduplicazione persistente degli ultimi 512 identificativi. Un cambio di edizione o impaginazione azzera conservativamente la misura corrente anziché sommare due letture dello stesso testo. Sessione qualificata con almeno 12 secondi e 35% di esposizione, pesata anche in rapporto all'estensione disponibile. Interessi: massimo +1,2 per sessione. Quantità sostenibile: media smorzata delle parole esposte stimate, variazione massima iniziale 8% del divario, ulteriormente attenuata da copertura e tempo. Le sole aperture non spostano questa dimensione.

### 2. Metadati e ripieghi

`articleMetadata.ts` calcola e conserva localmente metadati versionati del contenuto effettivo. Firma di contenuto/edizione, distinta da font, bookmark e timestamp; nessuna chiave, richiesta AI aggiuntiva o analitica esterna. Complessità linguistica: frasi, densità lessicale e subordinazione. Profondità: indizi di termini tecnici, prerequisiti, simboli/acronimi e spiegazioni, sul testo originale, per non scambiare la semplificazione Gemini con un argomento privo di prerequisiti. Parole disponibili ed estensione completa sono un'altra dimensione.

Livelli ordinali 1–5 provvisori e confidenze euristiche, non probabilità di correttezza: massimo 0,85 lingua/0,7 profondità sul completo; 0,4/0,3 sull'anteprima. Testo insufficiente: livello nullo e contributo neutro. Il profilo linguistico/specialistico cambia solo con confidenza almeno 0,5. Vocabolario tecnico finito, quindi possibile sottostima in discipline non rappresentate; nessuna certificazione della difficoltà personale. Preparati nove esempi che coprono le due scale, incluse sintassi densa non specialistica e testo breve con prerequisiti. Non mostrati punteggi in Home; tempo di lettura esistente conservato.

### 3. Ordinamento spiegabile

`personalization.ts` centralizza pesi, soglie e limiti della prima taratura. Ranking: interessi con decadimento di 30 giorni, qualità editoriale precedente, compatibilità prudente con lingua/prerequisiti/quantità e componente di scoperta. Conservati i filtri del punto 4, penalità di somiglianza alle ultime tre voci e limite di due categorie consecutive quando ci sono alternative. Scelta delle fonti/categorie mantiene il 40% di esplorazione; Wikipedia rimane la sola fonte. Cambia soltanto il tratto non ancora pubblicato: niente riordino della scheda visibile o destinazioni del lettore. Ricerca conserva la pertinenza.

Circa un ordinamento su otto usa un obiettivo di quantità 25% più alto, solo se la cache offre estensioni complete note. Non aumenta la soglia a ogni apertura. Per nuovi candidati con sola anteprima la quantità estesa è sconosciuta e non penalizzata: non vengono introdotti download in massa per misurarla. È un limite esplicito del suggerimento di letture più lunghe finché sono disponibili pochi candidati completi, non una promessa sulla lunghezza mai scaricata. Riserva e priorità Gemini/lettore conservate.

### Controlli e artefatti

**116/116 test**, TypeScript, export Android, assembleRelease offline e firma v2 superati. Test aggiunti per migrazione, backup/rollback atomico, riavvio, save/unsave/undo, deduplicazione, scatti fino al fondo, tempo attivo, attese, background, zone nascoste/fonte, riapertura, cambio edizione, inattività, metadati e ranking. La prima asserzione di SQLite usava uguaglianza esatta dopo un decadimento temporale reale; corretta con tolleranza numerica, senza alterare il contratto. Avvisi di percorsi CMake/deprecazioni Windows già presenti, nessuna dipendenza installata.

Release separata **Synapse-0.1.7-personalization.apk**, versionCode 8, SHA-256 **C927FA716F8A6B7CC21CD705FC8598F23CBD9A4689E0B16DD1B54F539E008FC5**, in `releases/qa/personalization-2026-10-09`. Log, export e snapshot del primo intervento conservati prima del successivo. Esempi e parametri leggibili in `CALIBRAZIONE-E-PROFILI.md`, valori in `profiles.json`; replay `scripts/qa/compare-personalization.cjs` dopo compilazione dei test. Profili simulati: nuovo, breve, approfondito, interesse scienza, salva poi rimuove. Breve: PonteBreve primo; approfondito: PonteLungo; scienza: Aurora; rimozione mantiene gli altri interessi. Testi di taratura inventati e dichiarati, non estratti o valutazioni dell'utente.

**Dispositivo:** ADB non rileva dispositivi collegati in questa esecuzione. APK non installato e nessuna nuova prova fisica della raccolta dei campioni. Non alterate rete, chiavi, salvati o impostazioni del Galaxy. I test SQLite sono un contratto dell'adattatore reale con motore locale, non una verifica del database Android personale. Nessuna misura di FPS/scatti o garanzia di fluidità dedotta da questo lavoro. Animazioni dei salvati e geometria shuffle conservate nei sorgenti; regressioni fisiche da riprovare quando il dispositivo è collegato.

### Limiti e taratura successiva

Esposizione ≠ attenzione; nessuna certezza sulle parole lette. Budget immobile di 45 secondi e reset su nuova edizione/font possono sottostimare lettura lenta; una terminazione del processo prima della chiusura perde la sessione non ancora registrata. Le vecchie preferenze aggregate restano, senza reinterpretare retroattivamente la qualità delle letture. Confidenze, dizionario dei prerequisiti, dwell, ritmo, quota di letture più lunghe e media sostenibile vanno tarati con uso reale e giudizio editoriale. Valutare pertinenza/comprensibilità, varietà, rientri e salvataggi coerenti oltre all'esposizione credibile: più tempo nell'app non è da solo successo. Aggiornati AGENTS e README che descrivevano il ranking come futuro o il solo tempo come lettura.

Il primo intervento è completato con i controlli richiesti superati; la seconda attività può iniziare. La verifica fisica rimane distinta e non eseguibile per assenza del telefono.

## Intervento 12 — dock a capsula e messaggi (seconda attività programmata)

9 ottobre 2026. Iniziato soltanto dopo completamento, 116 test, TypeScript, export/build/firma e documentazione dell'intervento 11. Letti AGENTS e avanzamento; aperto e ispezionato `C:/Users/Augusto/Downloads/Mobile Devices/dock.jpg`. Applicata la skill product-design:image-to-code con confronto visivo documentato in `design-qa.md`. Copie iniziali in `releases/qa/dock-messages-2026-10-09/before`. Prototipo preservato: impronte Prototype.tsx/prototype.css identiche ai valori precedenti.

### Dock e movimento

Nuovo `Dock.tsx`, sostituisce solo la navigazione inferiore: Home e Profilo effettivi, Cerca esterno invariato da 56 dp/icona 27. Capsula dimensionata alle label misurate, pillola selezionata con icona e label, inattive solo icona. Palette esistente, font inclusi e destinazioni conservati. Due voci non occupano lo spazio fittizio delle cinque del riferimento.

Una coordinata condivisa UI controlla posizione/larghezza della pillola, redistribuzione delle due celle e posizione delle icone. Spring 380/24/0,8, sovraelongazione della sola pillola limitata al 3,5%; celle nel dominio 0–1 mantengono target >=48. Nuovi tocchi ridirigono lo stesso valore corrente; niente code, timer che blocchino l'input o render React per frame. Label già impaginate a larghezza finale, maschera del genitore/opacity/traslazione di 4 dp: nessuna scala o testo che si estende durante il movimento. Pillola 40 dentro capsula 60, entrambe crescono per font sistema. Il misuratore iniziale evita un primo frame con label tagliata senza bloccare l'input.

In QA web trovate e corrette label troncate: misurazione iniziale senza larghezza utile, poi arrotondamento RN Web di un avanzamento frazionario (40,453→40). Ora misurazione in flusso e limite superiore ceil(width)+1; nessun offset arbitrario del telefono. Aggiunto stato selezionato web oltre a quello nativo.

`useMotionPreference` ascolta la preferenza nativa anche quando cambia. Ridotto: destinazione immediata, niente spring/entrata dei messaggi/spinner o scala di Cerca e azioni nuove. Parametro opzionale in Button, senza modificare stile e dimensioni della ricerca normale. Geometria di ritorno shuffle, Reader.surface e animazioni dei salvati preservate; Reader modificato solo nell'attribuzione visiva Gemini oltre ai campioni dell'intervento 11.

### Messaggi

`StatusMessage` comune a lettore, ricerca e feed: famiglia coerente di icone, titolo semibold e testo esplicito. Distinti caricamento, revisione Gemini, offline, rete non disponibile, testo insufficiente e AI non disponibile. Azione corretta riusa i callback di download/Gemini/fonte già presenti; originale leggibile e anteprima preservati. Entrata discreta di 180 ms e piccolo indicatore soltanto durante l'elaborazione, nessun effetto continuo sul testo. Errori riconoscibili da titolo/icona/azione oltre al colore. Attribuzione Gemini riuscita con la stessa icona, Wikipedia/licenza mantenute.

L'adattatore web mancava dei due metodi di metriche AI già previsti dall'interfaccia nativa: completato il semplice deposito locale per consentire la QA dell'app completa. Nessuna modifica al servizio AI o raccolta esterna. Copy delle impostazioni aggiornato ai segnali dell'intervento 11.

### Controlli e prove distinti

**116/116 test**, TypeScript, export Android, build release offline e firma v2 di app normale e harness superati. Nessun test aggiunto per ricopiare lo stile. Log in `releases/qa/dock-messages-2026-10-09`. La prima riesportazione QA trovava la cartella occupata dal server: liberata e ripetuta con successo; entry/index e applicationId sempre ripristinati in finally. Il refresh dev dopo il cambio temporaneo entry dava un errore Metro: verifica finale ricerca sull'export statico normale, nessun errore nella build finale.

RN Web, componenti reali: Home/Profilo, 12 tocchi alternati senza aspettare stabilità sia harness sia app normale, ultima destinazione Profilo corretta. Tema scuro, font 1,5 e movimento ridotto simulati nel solo harness, viewport 320×740/384×832, più vista desktop 1280×720. Target a 320/font1,5: 111×52 e 59×52. Tutti i messaggi ispezionati; riprove simulate 0→3, harness senza errori console. Ricerca reale “fiume”: risultati, apertura Fiume, ritorno con query conservata, cancellazione e chiusura verso Profilo. Screenshot finali e tavola con riferimento visionati, risultato visivo web passed in `design-qa.md`.

**Galaxy:** controllo ADB iniziale e finale senza dispositivi. APK non installati, movimento col dito, IME Android, TalkBack e regressioni fisiche non ricertificate. Nessuna impostazione del telefono modificata. Acquisizioni ritagliate degli intermedi del browser hanno viewport incoerenti in alcuni frame: non usate come evidenza della fluidità; limite dichiarato in QA. Nessuna misura di FPS/scatti; frequenza del display, frame prodotti e frame in ritardo restano distinti. Il pass visivo web non certifica il rimbalzo Android.

APK finale **Synapse-0.1.7-personalization-dock.apk**, 0.1.7/code8, SHA-256 **2C79DB8CB72E68C407868B95DAADC747E440C1AEE3E3091AA35994D38F1FD763**. Harness **Dock-fixtures.apk**, pacchetto separato `app.synapse.reader.dockqa`, SHA-256 **5F545B8AFD172A4D3FA2BD47195EDDBE4EA8AFD9136107BB99590D6EC02832B9**: nessuna rete, chiave o dati personali, controlli font/tema/movimento soltanto qui. Protocollo riproducibile in `scripts/qa/DOCK-MESSAGES.md`; immagini, log, APK e impronte in QA. Conservato anche l'APK autonomo della personalizzazione.

Implementazione dei due interventi completata in sequenza, con controlli richiesti superati e artefatti provabili. Rimane la verifica fisica per assenza del dispositivo; non iniziati altri punti.

## Intervento 13 — margini uniformi della pillola nella dock

9 ottobre 2026, telefono collegato. Aggiornata inizialmente la release dell'intervento 12 sul Galaxy S23 senza disinstallare o cancellare dati. L'utente indica subito una spaziatura errata: la pillola aveva inset laterale fisso di 4 dp e verticale di 10 dp. Il primo confronto visivo aveva mancato questo difetto; corretto il rapporto QA, senza considerare la vecchia tavola come evidenza della correzione.

### Modifica circoscritta

Solo `Dock.tsx`: inset comune `(navHeight-pillHeight)/2` per top e left della pillola; dimensione interna sottrae due inset. Ricalcolata la larghezza minima della capsula per ospitare label, spazio dell'icona e target inattivo >=48, senza comprimere le label. Celle riallineate allo stesso inset. Il valore segue le dimensioni scalate, non uno specifico schermo. Spring/retargeting, dimensioni di Cerca, componenti dei salvati, lettore, shuffle, personalizzazione e prototipo non modificati.

### Verifica effettiva

116/116 test, TypeScript, export Android, build release offline e firma v2 superati. Non aggiunti test che ricopino lo stile. APK `releases/qa/dock-insets-2026-10-09/Synapse-0.1.7-dock-insets.apk`, 0.1.7/code8, SHA-256 **8D4A1034A0477AB554981E7E9AAA23C3BF48B66A41FAA82E7B70E7C1EBA9FD9B**, installato con aggiornamento conservativo riuscito. Normale riavvio verificato. Profilo mostra ancora 3 salvati e 160 visite; nessuna rimozione o ripristino eseguiti. Non modificata alcuna impostazione del telefono.

Galaxy: stati Home e Profilo acquisiti (`device-home-final.png`, `device-profile-final.png`). Misurazione sui pixel reali della capsula/pillola: **28 px sopra, 28 sotto, 28 sul lato esterno** in entrambi gli stati. Replay diagnostico `scripts/qa/check-dock-insets.py`, output `measured-insets.json`; tavola `reference-native-comparison.png` con riferimento e screenshot Android visionata. Questa è una verifica fisica della spaziatura, distinta dalla derivazione matematica e dai test. Font di sistema ingrandito e movimento ridotto non cambiati o ricertificati fisicamente per questo ritocco.

### Riscontri aperti, distinti dalla correzione dei margini

La prova generale avviata prima della richiesta urgente di margini non è completata: ricerca aperta con tastiera e query “fiume” inserita, ma ritorno/shuffle/annulla/profilo di lettura non ricertificati. Le acquisizioni XML durante alcune transizioni non coincidevano con lo stato visivo: non usate per attestare un successo dei tocchi rapidi. Conservato il materiale iniziale nella QA dell'intervento 12.

Campione iniziale prima della correzione, registrazione attiva e input ADB: gfxinfo riporta **69 frame prodotti, 12 in ritardo (17,39%), mediana 16 ms, p95 27 ms, p99 36 ms**. Display configurato fino a 120 Hz; questo non è il numero di fotogrammi prodotti. Non è un benchmark controllato prima/dopo e non prova fluidità impeccabile. Musica/background e acquisizione attivi; nessuna causa certa attribuita ai ritardi. La correzione geometrica non pretende di risolverli. Misure del nuovo APK e prova col dito restano da fare.

Osservata inoltre nella nuova sessione un'anomalia separata di tema: fondo chiaro e foreground/pillola del tema scuro, ancora visibile dopo riavvio normale. Screenshot completi conservati. Il ritocco riguarda solo la dock; non stabilita la causa, né che sia stato introdotto da questo inset. Non cambiato il tema per mascherare il risultato. Verifica visiva **dei margini superata**; verifica generale di tema/fluidità resta aperta. Nessuna promessa di app interamente verificata.

## Intervento 14 — prestazioni, tema e regressioni native

9 ottobre 2026, richiesta di controllo generale con Galaxy collegato. I risultati precedenti e le modifiche locali sono stati conservati. Nessuna modifica al prototipo. Dossier completo, protocollo, condizioni delle misure e limiti in `releases/qa/performance-2026-10-09/PERFORMANCE.md`.

### Riscontri e correzioni

Confermato nella release iniziale il tema incongruente (testo chiaro su carta chiara), incluso dopo riavvio. Eliminato il percorso separato dei colori animati per carta/label: palette corrente unica per la scena, dissolvenza della cattura precedente già prevista da ThemeReveal. Rimossi i mapper di colore per ogni label e stabilizzato il contesto. Non isolata una specifica causa interna di Reanimated, né attribuito il difetto all'inset della dock. Sul Galaxy finale carta scura e testo leggibile, anche dopo riavvio; margini dock ancora 28/28/28 px in Home e Profilo.

Individuato lavoro JS evitabile: ranking completo della riserva ad ogni render, ritokenizzazione ripetuta nel confronto greedy, doppio getFeed con scansione della cache e nuove copie degli articoli, aggiornamenti della cache dopo prune senza rimozioni e dei feed senza novità. Nuove viste derivate `LibraryViews`, indice ID e identità stabili; invalidazione su cache/profilo/consumo/categoria/AI. Il consumo invalida sincronicamente prima della scrittura. Limite di 24 viste per categoria e un solo snapshot di riserva corrente. Contatore della riserva pigro e scheduler sospeso che non valuta il pool; protezioni della pulizia ancora basate sulla riserva reale. Token editoriali memorizzati solo per singolo ranking; nessuna modifica ai punteggi, alla scoperta, ai limiti di rete/cache o al profilo persistente.

Nel lettore articolo e callback stabili; frame callback memorizzato con firma/scalari anziché catturare l'intero articolo, riferimento JS all'edizione corrente. Conservati segnali di lettura, pausa, fallback originale, congelamento della chiusura e rivelazione anti-flash. Nel feed la pan non viene ricreata dal refill: limite aggiornato sul lato UI, callback stabili e schede invariate memorizzate. Nessun lock di input, timer nuovo o render React per frame. I layout del lettore, della dock e dei salvati restano quelli approvati.

### Misure e verifiche

Campione sintetico riproducibile sul computer: 80 articoli × 12 paragrafi, stesso ordine prima/dopo. Mediana calcolo riserva **81,369→29,299 ms**; riletture di UI estranea **83,022→<0,001 ms**, prima lettura ancora da calcolare (massimo 40,423 ms). Sono tempi Node, non FPS o latenza sul telefono.

Galaxy, iterazione nativa campionata senza video durante il campione (conservata in native-sampled-iteration.apk; prima dell’ultimo controllo pigro della riserva): 16 tocchi Home/Profilo con pause richieste 350 ms. Testo medio **742 frame prodotti, 14 in ritardo (1,89%), mediana 5 ms / p95 7 / p99 15**; testo grande 756/15 (1,98%), 5/10/12 ms. Iniziale 163/4 (2,45%), 5/8/14 ms. Contenuti e lavoro in background differiscono: non un confronto causalmente controllato. Display osservato a 120 Hz/adattivo, distinto dai frame prodotti. Lettore/cronologia profonda con testo grande: 598/24 (4,01%), 7/15/21 ms. Restano frame in ritardo; nessuna dichiarazione di zero scatti o fluidità perfetta. Escluso il vecchio campione con registrazione attiva. Memoria ed errori del processo acquisiti, senza dedurre assenza di perdite da una singola misura.

Verifiche fisiche tramite input ADB: Home/Profilo rapidi, tema, ricerca reale fiume con IME aperta/chiusa, Fiume lungo con scroll rapido e chiusura interrotta da riapertura, ritorno con query preservata, apertura casuale reale e ritorno shuffle, salvati con gesto invertito/sotto soglia e due rimozioni/Annulla, ritorno dal lettore ai salvati. Tre segnalibri iniziali ripristinati, stesse posizioni, presenti al riavvio. Cronologia 163 righe scorsa fino al fondo, promozione fuori schermo e chiusura completata. Riavvio finale e 8 swipe rapidi del feed finale, apertura/ritorno Home riusciti. Filmati/intermedi del lettore e dei salvati visionati separatamente dai benchmark. Tocchi iniziali assorbiti dalla chiusura IME e acquisizione shuffle ancora in caricamento esclusi dagli esiti; ripetuti sugli stati effettivi.

Testo dell'app 20/23 verificato e ripristinato a 20; tema scuro iniziale preservato. Gemini era disabilitato e non è stato attivato, nessuna chiave letta né quota consumata. Normali visite e consumo del feed prodotti dalle prove, nessuna cancellazione/modifica diretta dei dati. Nessuna impostazione del telefono cambiata. Font sistema, TalkBack, dito manuale e movimento ridotto non ricertificati fisicamente; Gemini in arrivo/cache, offline ed errori di persistenza coperti dai contratti e dalle verifiche precedenti, non da nuove simulazioni native in questa sessione.

**121/121 test**, TypeScript, export Android Hermes, release offline, firma v2 e integrità ZIP/bundle superati. Cinque nuovi test utili su invalidazione/riuso, consumo prima della persistenza, originale/AI e anteprima invariata, refill vuoti/duplicati e penalità equivalenti; nessun test che ricopi stili. Primo export fermato dal sandbox sulla scrittura temporanea Hermes, ripetuto con successo. Il Galaxy si è bloccato durante la compilazione conclusiva; dopo lo sblocco da parte dell’utente il ricontrollo è stato completato senza cambiare configurazioni. L’APK precedente campionato è conservato, i relativi risultati non sono attribuiti retroattivamente alla modifica pigra finale.

APK conclusivo: 16 tocchi Home/Profilo, **777 frame prodotti, 9 in ritardo (1,16%), mediana 5 ms / p95 7 / p99 11**, campione separato senza video. Ricerca fiume, lettore, due scroll rapidi e ritorno con query/tastiera preservate; Home e lista dei tre salvati confermate visivamente. Ulteriore riavvio: tema coerente, 3 salvati e 164 visite (una nuova visita di QA). Nessun errore nei filtri dei processi conclusivi. Acquisizioni `after/conclusive-*`; il file denominato conclusive-home mostra Profilo, destinazione di origine della ricerca: Home acquisita separatamente in conclusive-home-confirmed. Le verifiche più estese di shuffle, inversioni e Annulla restano quelle dell’iterazione campionata, con lo stesso codice visivo.

APK **Synapse-0.1.8-performance.apk**, 0.1.8/code9, SHA-256 **17DBD511BBC1967BF288D7C7A4ED0490F3E4AD39D118CCD8760D4160F068BFEE**; aggiornamento installato senza disinstallazione, versione e persistenza confermate. Prototipo con impronte invariate. Risolti i colli di bottiglia individuati e il tema riprodotto; non attribuite cause certe ad altri glitch non riprodotti e non certificata l'eliminazione di ogni possibile difetto.

## Intervento 15 — chiusura degli avvisi di errore

9 ottobre 2026. `StatusMessage` rende chiudibili gli stati rete, offline, testo insufficiente e Gemini non disponibile; caricamento e revisione in corso conservano la loro presenza. Nuovo `DismissibleNotice` condiviso anche dagli avvisi brevi dell'app: X in alto a destra con target 48 dp e label accessibile, trascinamento a destra/sinistra, conferma al rilascio oltre il 25% della larghezza. La velocità non sostituisce la soglia. Sotto soglia o dopo cancellazione il messaggio torna con una spring; una nuova presa usa la posizione corrente. Uscita e dissolvenza brevi, movimento ridotto rispettato. Impaginazione fissa, solo traslazione/opacità sul lato UI, nessun aggiornamento React per frame.

Timeout normale **2 secondi**, sospeso durante il trascinamento o la pressione della X. Android può estenderlo secondo il tempo consigliato per l'accessibilità, senza modificare le impostazioni del telefono. Timer annullati al cambio/unmount dell'avviso; la firma kind/message/action mantiene nascosto lo stesso messaggio durante aggiornamenti estranei. Chiusure tardive di un toast non cancellano un messaggio diverso arrivato dopo. Nascondere l'avviso non cancella contenuti, non interrompe richieste e non segna l'errore come risolto. Azioni di riprova conservate; la gestione separata di Annulla per i segnalibri non riceve il timeout di 2 secondi.

Nel lettore il timer parte quando l'avviso in fondo entra nella viewport: layout e scroll osservati sul lato UI, passaggio a React soltanto quando cambia la visibilità. Sospensione quando si esce dalla zona o si chiude il lettore; nessuna contrazione del footer per un timeout durante il ritorno. L'avviso della Home sospende il timeout quando si apre un'altra destinazione o il lettore. Rivelazione del testo, shuffle, dock, personalizzazione, cache e prototipo conservati.

### Verifiche

Galaxy S23, componenti reali nella QA isolata `app.synapse.reader.errorqa`, messaggi e articoli simulati, nessuna rete/chiave/quota/dati personali. X e timeout, swipe continui nei due sensi, rilascio sotto soglia con gesto di 3 secondi (avviso ancora presente), nuova presa durante il ritorno e riprova verificati. Override del movimento ridotto nel solo harness, non delle impostazioni del telefono. Input ADB, non gesto manuale col dito. Un primo tentativo di inversione con eventi DOWN/MOVE/UP separati non è usato come prova del corretto disarmo: gli swipe continui successivi danno riscontri riproducibili.

Lettore reale con sei paragrafi simulati: attesa iniziale di 3 secondi in cima, scroll rapido al fondo e avviso ancora visibile; dopo ulteriore attesa l'avviso scompare e testo originale/attribuzione rimangono. Chiusura dal fondo interrotta da riapertura verificata visivamente. Acquisizioni `reader-top-after-delay`, `reader-footer-shown`, `reader-footer-timeout`, `reader-reopen`. Screenshot finali dei gesti in `final-*`; filmato `errors-motion.mp4` e intermedi visionati appartengono alla prima iterazione del gesto, prima della rifinitura della nuova presa. Nessuna nuova misura FPS o attestazione di zero scatti. Font di sistema ingrandito e TalkBack non ricertificati fisicamente; prolungamento del timeout tramite impostazioni di accessibilità non provato modificando il telefono.

Controlli e APK conclusivi registrati nel dossier `releases/qa/dismissible-errors-2026-10-09/VERIFICA.md`.

**121/121 test**, TypeScript, export Android Hermes, release offline, firma v2 e integrità ZIP/bundle superati. APK **Synapse-0.1.9-dismissible-errors.apk**, 0.1.9/code10, SHA-256 **E5468651FDD811DF6F7D7BF04E6016549D9125E48F8832ABFAA24EAB51D8E52E**, installato con aggiornamento conservativo. App normale riavviata e Profilo verificato visivamente: 3 salvati e 166 visite, nessun errore nei filtri del processo. Prove degli errori effettuate separatamente con il pacchetto QA, rimosso al termine. Entry/applicationId ripristinati, prototipo con impronte invariate. Nessun impedimento all'installazione finale; limiti delle prove fisiche riportati sopra.

## Intervento 16 — verifica conclusiva e punto originale 13

9 ottobre 2026. Letti integralmente AGENTS.md e questo documento; verificati codice corrente e modifiche locali. Nessun Git: inventario iniziale 67 file, 26 modificati/41 identici, oltre alle aggiunte. Prototipo `../synapse` con impronte invariate. La numerazione seguente riguarda i 14 problemi originali, distinta dagli interventi cronologici.

L'utente ha mantenuto la chiusura ordinaria **B, espansione al contrario accelerata**. Rimossi parametro/rami A/C e selettori A/B/C dalla fixture, conservando tempi, geometria, inversione e shuffle. Rimossi dal Galaxy esclusivamente `app.synapse.reader.returnqa` e `app.synapse.reader.finalqa`. Versioni allineate a **0.1.10/code 11**: app.json aveva code 9 mentre il telefono era già code 10. Prima iterazione code 11 con nome nativo 0.1.9 corretta e ricompilata. Questi sono i cambiamenti di prodotto della verifica; le ottimizzazioni precedenti restano attive.

### Confronto iniziale/finale

| Area | Base iniziale | Stato attuale |
|---|---|---|
| Comparsa | Parole progressive/React, altezza riservata insufficiente | Testo disponibile impaginato definitivamente, una copia, copertura sfumata UI e anticipo con scroll; originale leggibile durante AI |
| Chiusura | Salti/sparizioni segnalati, ordine cronologia mutabile | Lettore mantenuto, ritorno rapido coordinato e reversibile; ordine congelato/origine invisibile gestita |
| Feed/cache | Attesa lotto, 30/3 MiB senza riserva utile distinta | Pubblicazione progressiva; riserva 30/512 KiB, cache 80/6 MiB con protezioni, priorità lettore e budget finiti |
| Gemini | Richiesta all'apertura | Preparazione 3,5s configurabile, validità contenuto/configurazione, riuso e fallback |
| Personalizzazione | Segnali poco distinti/tempo dall'apertura | Profilo v2 migrato, esposizione stimata, lingua/prerequisiti/quantità separati e ranking spiegabile |
| Interazione | Dock precedente, salvati senza gesto rifinito | Pillola interrompibile, swipe confermato al rilascio/undo, avvisi chiudibili |
| Controlli |59 test nella base inventariata|121 test, TypeScript, export e release firmata|

Benchmark Windows sugli stessi 80 articoli: riserva mediana 80,942→28,917 ms, aggiornamenti estranei 79,758→0 ms alla precisione del report (primo calcolo freddo 28,416 ms); ordine identico. Conferma lavoro JS evitabile già corretto, non misura FPS Android o guadagno causale rispetto ai filmati iniziali.

### Stato dei 14 punti

“Completato” vale per l'intervento e i riscontri delimitati, non ogni dispositivo/combinazione. Fixture native e SQLite reali con rete/Gemini simulati sono distinti dai servizi remoti.

| Punto | Stato | Evidenza | Limite concreto |
|---|---|---|---|
|1 — testo invisibile durante scroll|Completato|Fiume 12 swipe fino alla fonte, fixture 20 paragrafi/font 23 fino aPass 20|Font Android globale non ricertificato; testo non scaricato escluso|
|2 — dock|Completato|16 tocchi normali, 12 rapidi in fixture scura/fontlabel 1,5/ridotto; ricerca/IME conservate|ADB, non dito/TalkBack/tutte le dimensioni|
|3 — anticipo Gemini|Parziale|AI/full 1 riusati, cache offline e backgroundAI 1/abortAI 1|Servizio remoto e soglia da valutare nell'uso|
|4 — selezione|Parziale|Taratura/campione 50 già consegnati, contratti e feed reale|Valutazione editoriale e confronto latenza remota aperti|
|5 — personalizzazione|Parziale|Migrazioni/rollback/dedup/profili simulati; QA v2 persistente|Stime da calibrare; nessuna estrazione profilo personale o sessione qualificata misurata nell'harness|
|6 — scelta chiusura|Completato|B mantenuta; selettori/rami alternativi rimossi|Filmati A/B/C solo storici|
|7 — riserva|Completato|30 persistenti, riavvio offline req 0, esaurimento 0 e online 30|Trasporto controllato; testi estesi non scaricati non promessi|
|8 — stati/fallback/visivo|Completato|Quota con originale, anteprima offline, icone/riprova/grande/ridotto; X/swipe/timeout intervento 15|Gemini remoto/TalkBack non ricertificati|
|9 — chiusura profonda|Completato|Fondo Fiume, fixturePass 20, stessa istanza 1/finali 0 dopo inversione e finale 1|Non ogni fotogramma/configurazione; jank residuo|
|10 — cronologia|Completato|174 visite, voce più vecchia promossa fuori schermo e ritorno nella zona; arrivo in chiusura e riga rimossa coperti anche da contratti/storico|Non nuova prova 500 righe o cancellazione col dito|
|11 — salvati|Completato|3→0, tre undo→3/titoli/ordine, video reinserimento, ritorno lettore; niente pulsante laterale|Inversione continua/cancellazione OS/errori scrittura non tutti ripetuti fisicamente|
|12 — testo originale mancante|Ancora da verificare|Non trovato nelle richieste/documento; chiarimento solo sul 13|Occorre identificarlo senza inventare associazioni|
|13 — refresh S 23|Parziale|Presentazione mediana 8,34 ms durante movimento; nessun tetto 60 confermato; misure fasi/jank|Scatti residui; diagnosi React/JS/GPU causale, caldo/risparmio da verificare|
|14 — impaginazione|Completato|Testo definitivo, classico/AI cache/in arrivo separati; anti-flash preservato|Bordo su fondo uniforme, limite editoriale 1100 parole; font sistema/altre superfici aperti|

### Punto 13: misure e condizioni

Galaxy S 23 SM-S 911B, Android 16, release, USB/batteria 100%, risparmio 0. Inizio batteria 30,4 °C/AP 31,8 °C, stato termico 0; lettura finale batteria 29,9 °C/AP 34,0 °C/SKIN 31,1 °C, stato 0. Font sistema 1,0 e scale animazioni 0,5 invariati:0,5 non equivale a movimento ridotto. Min/peak refresh Samsung riportano `Infinity`, non una promessa 120 fps. Display 120 Hz/modalità inferiori, `hasArrSupport=false`; nessuna forzatura globale o modifica nativa senza evidenza.

| Campione senza video | Frame/in ritardo | Durata p 50/p 95/p 99 |
|---|---|---|
|Prima del controllo 0.1.9,16 tocchi dock|806/8 (0,99%)|5/7/11 ms|
|Consegna 0.1.10,16 tocchi dock|836/14 (1,67%)|5/7/10 ms|
|Consegna 0.1.10,12 swipe Fiume|271/23 (8,49%)|7/14/18 ms|

Buffer recente: presentazione mediana 8,344 ms in dock/lettore, p 95 rispettivamente 8,346/16,688 ms. Non ogni refresh produce un frame utile; UI immobile non deve produrre 120 fps. Intervalli>40 ms esclusi e contati possono essere pause o stalli. Fasi di rendering includono sincronizzazioni/pipeline e non isolano React, CPU JS o GPU. Campioni diversi per azioni/cache/lavoro: **nessun miglioramento causale del jank né eliminazione completa degli scatti dichiarati**. Test aggressivo con irregolarità residue, senza inventarne la causa o riscrivere componenti speculativamente.

### Verifiche e consegna

Matrice mirata e dossier in `releases/qa/final-verification-2026-10-09/MATRICE-FINALE.csv` e `VERIFICA.md`. App normale: feed/lettore/fondo/inversione, query/tastiera, shuffle endpoint stabile, salvati/undo/ultimo elemento, cronologia fuori schermo, dock e riavvio. Font app 20 e scuro iniziali preservati. Riavvio finale **3 salvati/175 visite**, contro 3/173 iniziali: nuove visite delle prove, nessuna cancellazione dati. Problematicismo/Déjàvu/Mito della caverna e ordine ripristinati. Home normale lasciata aperta.

QA isolate: rete lenta/disconnessione, riserva/offline/esaurimento/ritorno online, AI disabilitata/riuso/cache/quota/background; saved 1/visite 4/profilo v2 seen 72/parole 220/riserva 30 al riavvio offline req 0. Nessuna chiave personale o quota usata. Font 23/label 1,5/ridotto tramite override componenti, senza cambiare Android. Non certificano font sistema≥1,3, TalkBack, dito, Gemini remoto, caldo/risparmio o tutti gli incroci. Abitudini qualificate/migrazione completa coperte dai test, non da estrazione del database personale.

**TypeScript, 121/121 test, export Android Hermes, assembleRelease offline, firma v2, ZIP/bundle superati**. Automatici, compilazioni e telefono distinti nel dossier. Log finale: messaggi nativi ashmem deprecato/libpenguin.so assente, nessun fatal/errore React nel campione; nessuna associazione dimostrata al jank. Export e bundle APK con impronte diverse, nessuna equivalenza byte per byte dichiarata.

APK **`releases/qa/final-verification-2026-10-09/Synapse-0.1.10-final.apk`**, 0.1.10/code 11, SHA-256 **E0B1930CED7BA5FB6DC416DC09C8807F0B08680ADE259B0424774288D8185929**. Certificato conservato SHA-256 `fb5a08f89ecdedaa90c7f94ce9aa7a8b11ca6a5d74f4b0341ff611a06ee98c6a`; installato come aggiornamento, APK installato estratto/hash identico, niente DEBUGGABLE, ARM64/x86_64. App normale mai disinstallata, dati/configurazioni telefono conservati. Nessun impedimento alla build/installazione; limiti residui e punto 12 aperti.

## Intervento 17 — ricertificazione release sul Galaxy e diagnosi del punto 13

10 ottobre 2026. Letti integralmente AGENTS nativo/prototipo e le 773 righe dell'avanzamento precedente. Registro per riprendere i blocchi: `docs/VERIFICA-CONCLUSIVA-STATO-2026-10-10.md`. Evidenze, matrice delle combinazioni effettive, log e filmato in `releases/qa/final-verification-2026-10-10/`. La chiusura scelta dall'utente resta **B, contrazione inversa accelerata**. Rami e selettori di confronto A/C già rimossi nella precedente verifica: ricontrollati nel codice e nel bundle consegnato. Fixture e APK storici conservati come evidenza, senza selettori nel prodotto.

### Base, interventi confermati e prima/dopo

Base iniziale dell'8 ottobre: 67 percorsi inventariati, confronto finale **28 modificati/39 identici**, oltre alle aggiunte. All'avvio di questo blocco,138/138 file uguali allo snapshot dell'audit. Confronto con i175 percorsi all'avvio: **11 modificati**, di cui9 di prodotto (6 componenti e3 file di versione),2 script QA. Tre nuovi strumenti QA per acquisizioni, tracce e tocco periodico. Nessun Git; nessun ripristino automatico. Runtime protetto del prototipo, Prototype.tsx e prototype.css, con impronte identiche alla verifica precedente.

| Area | Prima | Dopo e riscontro |
|---|---|---|
| Titolo durante scroll | Mapper di ogni parola dipendente anche dallo scroll,400 aggiornamenti nativi del testo nel campione | Traslazione del contenitore unico, mapper legati solo alla transizione; **0 aggiornamenti** nello stesso protocollo |
| Movimento ridotto | Feed/liste con preferenza di avvio; pulse Save/Chip/Button senza bypass esplicito | Preferenza live esistente propagata, settle fermati e pulse bypassato; cambiamento Android live verificato |
| Chiusura e impaginazione | B e testo definitivo già adottati | Geometria/font/B conservati; fondo, inversione e origine500 ricontrollati in release |
| Riserva, confronto con base8ott | Calcolo ripetuto sugli stessi80articoli,78,340ms; UI estranea80,878ms |29,105ms; letture estranee0ms alla precisione del report, primo calcolo29,537ms, ordine identico. Ottimizzazione preesistente, benchmark Node, non FPS |
| Controlli |59 test nella base;121 all'avvio |121/121 sul codice finale, typecheck/export/build firmata superati |
| Installazione/dati personali |0.1.10/code11,0salvati/182visite |0.1.11/code12,0salvati/184visite al riavvio; due visite nuove delle prove, dati conservati |

**R1, collo di bottiglia di layout confermato:** il titolo mescolava `top` dipendente dallo scroll e proprietà font/lineHeight nello stesso aggiornamento animato. Lo scroll ora trasla un unico contenitore di parole; i mapper dipendono solo dalla transizione. Stessa algebra −scroll×progress e stessi endpoint. Atrace: **400→0 setText/updateExtraData/StaticLayout**. Questi sono eventi nativi ReactTextView, non400 commit/render React. Nessuna riscrittura generale. **RM1:** copertura live della preferenza ridotta, con correzioni limitate a Feed, ArticleList, SaveButton, CategoryRail e Button.

### Stato aggiornato dei 14 punti originali

**9 completati,4 parziali,1 ancora da verificare.** Completato riguarda l'intervento e le prove delimitate qui, non tutte le combinazioni/dispositivi. Le fixture eseguono componenti/hook e SQLite reali sul Galaxy, con trasporto/generatore simulati; sono distinte dal prodotto e dai servizi remoti.

| Punto | Stato | Evidenza conclusiva | Limite concreto |
|---|---|---|---|
|1 — testo invisibile durante scroll|Completato|Fiume rapido fino alla fonte, video separato visionato; Pass20 font23/ridotto; prodotto offline/font Android1,3 con testo disponibile|Campionamento visivo, non ogni fotogramma; full non scaricato non promesso offline|
|2 — dock|Completato|16 tocchi normali nel prodotto;16 rapidi offline/font1,3/ridotto; fixture scura/label1,5,Profilo finale|Input ADB; scatti residui, niente dito/TalkBack/tutte le superfici|
|3 — anticipo Gemini|Parziale|AI1/full1/reuse1; originale durante revisione, errore/riprova; backgroundAI1/abortAI1|Trasporto/generatore controllati; soglia3,5s e quote/latenza Gemini remoto non ricalibrate|
|4 — selezione|Parziale|Taratura editoriale precedente e contratti superati; feed reale, refill progressivo e ordine benchmark identico|Giudizio editoriale e confronto con latenza remota restano aperti|
|5 — personalizzazione|Parziale|Contratti migrazione/rollback/dedup; SQLite QA prima/dopo: v2/seen24/sessioni0/parole220 identici|Nessuna sessione qualificata misurata o estrazione profilo personale; stime da calibrare nell'uso|
|6 — scelta chiusura|Completato|B mantenuta nel prodotto/fixture; sorgenti e bundle senza rami/selettori A/C di confronto|Filmati/APK alternativi solo storici; nessuna nuova scelta introdotta|
|7 — riserva|Completato|Lenta6→12→18;30 persistenti/riavvio offline req0; esaurimento0 persistente, online26 utili poi30; download background cancellato|Trasporto controllato; estesi offline solo se scaricati; cache con protezioni non un limite duro dedotto da un contatore|
|8 — stati/fallback/visivo|Completato|Sei stati visionati scuro/label1,5/ridotto; quota/originale/riprova; anteprima offline e loading lento; storici non in cache con avviso/lista mantenuta|Servizio remoto/TalkBack non ricertificati; X/swipe/timeout hanno anche evidenze intervento15, non ogni gesto ripetuto qui|
|9 — chiusura profonda|Completato|Fiume fondo/inversione; HomePass20, inversione90ms mantiene istanza1/finali0, poi finale1; Pass20 grande/ridotto|Non ogni frame; scatti residui, ridotto ha transizioni istantanee|
|10 — cronologia|Completato|182righe/28swipe nel prodotto; fixture500 realmente raggiunta, modello#0/visivo#499, inversione stabile e arrivo60ms, finale2|Storico senza cache non si apre offline; niente gesto manuale; primi scrollToEnd non al fondo esclusi|
|11 — salvati|Completato|Segnalibro persistente; sotto soglia1/remove0/undo1/finale0; ripetuto offline/font Android1,3/scuro/ridotto; riga rimossa durante lettore in fixture|Gesti destri iniziali esclusi; errori scrittura coperti dai contratti, non tutti riprodotti nativamente|
|12 — testo originale mancante|Ancora da verificare|Non identificato nelle richieste/documento; domanda inviata insieme al collegamento, risposta ricevuta solo sul telefono|Serve il testo originale, senza inventare un'associazione|
|13 — refresh S23|Parziale|R1 misurato/corretto; atrace CPU/layout/rendering, cadenza presentazione e jank distinti; display fino120Hz, nessun tetto60 confermato|Scatti residui; commit React e costo GPU per componente non isolati; stress caldo/risparmio non certificato|
|14 — impaginazione|Completato|Testo definitivo/copia unica conservati; classico, cacheAI, AI in arrivo, full lento, anteprima offline; font app23/Android1,3 nei percorsi indicati|Non tutti gli incroci/font; nuova riapertura della stessa revisione QA dopo riavvio non isolata dal solo contatore cache|

### Punto 13: grandezze separate e condizioni

Galaxy SM-S911B, Android16, release non DEBUGGABLE, min24/target36. Prima: font Android1,0, tutte scale0,5, USB/batteria86%, BAT27,7°C/AP30,1°C, risparmio0, stato termico0. Dopo: stessi font/scales/rete/risparmio, batteria100%, BAT30,4°C/AP41,0°C/SKIN32,1°C, stato0. Le modifiche per offline/font1,3/scale0 sono state temporanee e ripristinate. Non è stato provocato surriscaldamento né certificato il funzionamento con risparmio attivo. Interruzione host tra blocchi: orari delle acquisizioni delimitano le prove, nessuna continuità termica presunta.

| Campione | Frame/in ritardo | p50/p95/p99 |
|---|---:|---:|
| Dock iniziale,16tocchi/pause350ms, senza video |1109/14 (1,26%)|5/7/14ms|
| Dock finale, stesso protocollo, senza video |1211/16 (1,32%)|5/7/11ms|
| Fiume primaR1,16swipe alternati200ms, con trace |496/22 (4,44%)|15/20/22ms|
| Fiume dopoR1, stesso protocollo/contenuto, con trace |530/3 (0,57%)|17/20/23ms|
| Offline/font1,3/ridotto,16tocchi/pause50ms |45/14 (31,11%)|5/11/14ms|

R1 elimina il lavoro nativo ripetuto confermato; il jank minore vale per questo campione. La latenza del lettore **non migliora uniformemente**; dock senza miglioramento causale dimostrato. Campione ridotto con poche ridisegnature/azioni istantanee conservato anche se sfavorevole, non comparato come FPS al campione animato. Misura ridotto live del segnalibro:2frame/800ms, contro86/circa700ms su altra scheda iniziale; verifica funzionale del bypass, non prova causale del jank.

Trace prima/dopo4,251/4,341s: CPU schedulata JS76,139→48,378ms, tratto massimo1,133→2,384ms; main1127,014→1081,293ms; RenderThread615,157→387,682ms. Nessuno stallo JS dominante dimostrato in questi scroll. Slice inclusive con attese/sovrapposizioni non vanno sommate come CPU; ReactText/Fabric non conta commit React. Rendering e sincronizzazione GPU restano costi residui non attribuiti esclusivamente a un componente.

Presentazione recente: mediana8,343ms/p958,344ms; durata totale della pipeline mediana23,888ms. **Refresh del display, ritmo dei frame presentati e scatti sono distinti.** UI immobile non deve produrre120frame utili/s o restare necessariamente120Hz. Display fino120Hz, `hasArrSupport=false`, min/peak Samsung Infinity. Verificati supporto Android/HAL e configurazione progetto: [ARR Android](https://developer.android.com/develop/ui/views/animations/adaptive-refresh-rate), [suggerimenti di frame rate](https://developer.android.com/media/optimize/performance/frame-rate). Nessuna forzatura globale e nessun hint nativo aggiunto senza un tetto60 o altra causa nativa confermata.

### Matrice, persistenza e livelli di verifica

Prodotto: feed/lettore/scroll rapido/fondo/inversione, ricerca/query/IME, cronologia fuori schermo, salvati/swipe/Annulla/riavvio e dock. Ripetizione combinata **offline di sistema, Gemini off, appfont23/font Android1,3, tema scuro, scale0** sui percorsi indicati nella matrice, compreso salvato protetto. Stampa3D/Barriera corallina non più in cache mostrano il fallback previsto; non conteggiati come aperture offline riuscite. Cambio font ricrea Home: primi tentativi a coordinate esclusi e ripetuti mediante label effettive. Video visionato separatamente dai benchmark,4campioni/s; nessuna promessa su ogni fotogramma.

Tre fixture release separate, installate con aggiornamento sullo stesso Galaxy: ReaderReturn, Gemini e Dock. Lenta/disconnessione, AIoff/AIinarrivo/quota/riprova, download e generazione in background, esaurimento/refill, testi grandi/scuro/ridotto. Componenti/hook/SQLite Android reali, risposte controllate; nessuna chiave personale nel harness. Prima/dopo riavvio offline: **saved1/history2/reserve30/cache54/profilov2/seen24/sessioni0/parole220 identici**, req0.220parole non attestano una sessione qualificata. Scrittura revisione coperta dai contratti, nuova riapertura della stessa revisione QA dopo riavvio non isolata. Il caso quota sul contenuto precedente e Shuffle con tastiera sovrapposta esclusi, poi ripetuti correttamente. Non si certificano tutti gli incroci possibili, TalkBack o gesto manuale.

| Livello | Esito | Cosa dimostra |
|---|---|---|
| Automatici Windows |Typecheck e121/121 test,0fail/skip|Contratti feed/rete/cache/AI/storage/rollback/reading/ritorni; non fluidità visiva|
| Export Android |Hermes riuscito,index-14db7506…hbc|Bundle esportabile; distinto da APK e telefono|
| Compilazione release |Flusso esistente riuscito,0.1.11/code12, firma v2|APK aggiornabile,min24/target36,ARM64/x86_64; ZIP/bundle integri|
| Telefono prodotto |Install-r, APK estratto identico, matrice acquisita e visionata|Evidenze funzionali/performance nel perimetro descritto, dati/preferenze conservati|
| Telefono QA |Tre fixture release,SQLite reale, rete/AI simulate|Scenari deterministici, contatori e persistenza; non servizi remoti|

Nessun cambiamento di prodotto dopo i controlli finali. Export e bundle dell'APK con impronte differenti, nessuna equivalenza byte dichiarata. Log campionato: ashmem deprecato/libpenguin.so mancante, nessun fatal/errore React nel filtro; nessuna causa del jank attribuita a quei messaggi.

### Consegna e prosecuzione delimitata

APK **`releases/qa/final-verification-2026-10-10/Synapse-0.1.11-final.apk`**,58.155.588byte, **0.1.11/code12**; copia anche `releases/Synapse-0.1.11.apk`. SHA256 **09CFDBCC9F4FD473F33B8A6E8838EDE33F49B1D886F8FD9B1B4173AA8081073B**. Certificato conservato **fb5a08f89ecdedaa90c7f94ce9aa7a8b11ca6a5d74f4b0341ff611a06ee98c6a**. APK installato estratto con impronta identica: nessuna disinstallazione né cancellazione, aggiornamento futuro possibile con la stessa firma.

Riavvio finale0salvati/184visite, contro0/182 iniziali; segnalibri temporanei rimossi, preferenze iniziali ripristinate. Home normale lasciata aperta. QA separata arrestata e conservata. Tocchi neutri ogni4min finché necessari, helper fermato al termine; nessuna modifica al timeout schermo, nessuna continuità presunta durante l'interruzione host.

Residui concreti: identificare punto12; valutare soglia/Gemini remoto e calibrazioni editoriali/personali nell'uso; isolare commit React/costo GPU residuo se prosegue la diagnosi degli scatti, con protocollo e condizioni termiche/energetiche controllati. Non ulteriori riscritture speculative. Il registro dei blocchi e la matrice permettono di riprendere da queste evidenze verificando le impronte del codice, senza ricominciare la verifica completa.

## Intervento 18 — Personalizzazione senza tempo di lettura, 10 ottobre 2026

Richiesta implementata e verificata; sostituisce le indicazioni precedenti su tempi, esposizione e lunghezza adattiva. Analisi completa, soglie pre-taratura, confronto e limiti: [PERSONALIZZAZIONE-V3.md](PERSONALIZZAZIONE-V3.md).

Eliminati etichette minuti/Calcolo, campioni di permanenza, sessioni temporali, stime linguistiche e incremento adattivo della lunghezza. Conservati animazioni, timeout e preparazione anticipata Gemini indipendente. Profilo v3: aperture deboli, salvataggi forti reversibili, memoria recente per ordine delle azioni e interessi consolidati; nessun interesse dedotto dal semplice passaggio. Migrazione con backup e ricostruzione prudente da segnali affidabili; conservati salvati, cronologia, impostazioni ed esclusioni storiche non separabili.

Bug centrale: la coda già pubblicata conservava l'ordine precedente anche dopo i salvataggi. Ora riordina soltanto il futuro e aggiorna il recupero tematico entro i budget esistenti, senza spostare la scheda corrente. Corretti anche undo dei salvati storici e ripresa delle fonti esaurite dopo un nuovo interesse. Ricerca e shuffle mantengono la propria semantica.

20 semi su corpus controllato: tre salvataggi portano 6 pertinenti nei successivi10 (vecchia coda già pronta1,45; vecchio ranking ricalcolato6,95). Cinque aperture: ranking2,9→6; cambio tema dopo20vecchi salvataggi e3nuovi: nuovo tema3→4,05, vecchio conservato3,95. Due spazi esplorativi/10. Singola apertura stabile; undo e ripetizioni non accumulano. Non dimostrazione di soddisfazione reale.

117/117 test, TypeScript, export Android e APK release finali riusciti. Fixture Galaxy con SQLite reale: corrente ferma, futuri pertinenti1→6 dopo3salvataggi, undo e riavvio offline coerenti; trasporto sintetico. Prodotto: Home/salvati/lettore senza tempi, ricerca reale e shuffle, ritorni e campione scroll. Limiti delle misure dettagliati nel rapporto, nessuna promessa FPS o nuova chiamata Gemini.

APK finale installato conservativamente ed estratto con hash identico: `releases/qa/personalization-v3-2026-10-10/Synapse-0.1.11-personalization-v3.apk`, SHA256 **4282010BFA188651DBE8C8B76074E0BB4EEEA425C71A5B0B8794E3C7FBE19A57**, versione0.1.11/code12 invariata. 1salvato/187visite preservati alla migrazione; 1/189 alla fine dopo le aperture di prova. Home lasciata aperta, nessuna pubblicazione. Questo APK è quello corrente per l'intervento; l'APK dell'intervento17 resta evidenza storica.

Lavoro completato. Eventuale prosecuzione: valutazione di pertinenza nell'uso reale e dei limiti lessicali/di disponibilità Wikipedia, senza reintrodurre durata o proxy di comprensione.


## Intervento 19 — rete, disponibilità e riserva offline, 10 ottobre 2026

Analisi, implementazione e build completate; diagnosi, confronto riproducibile, limiti e checklist in [RETE-RISERVA-2026-10-10.md](RETE-RISERVA-2026-10-10.md). Conservati personalizzazione v3 senza tempi di lettura, cache/SQLite, Gemini e transizioni esistenti; prototipo non modificato. Snapshot di 76 file in releases/qa/network-reserve-2026-10-10/before, 65 identici/11 modificati oltre alle aggiunte.

Corrette progressione dei temi/cursori, recupero finito di vuoti/duplicati/errori (massimo tre HTTP per ciclo senza retry moltiplicati), distinzione 503/429 e Retry-After, avvio speculativo prima del foreground, continuità del refresh e compatibilità AbortSignal React Native. Riserva nella stessa cache: fino a 30 anteprime varie protette anche dopo consumo, preferenza per inedite e riciclo offline dichiarato. Stati rete/disponibilità separati, categorie disabilitate con motivi distinti e riattivazione controllata/alla nuova scoperta, stato vuoto con ritorno cinque secondi annullabile/sospeso in background, avviso offline persistente sopra dock.

**142/142 test, TypeScript, export Hermes e APK release/firma v2/integrità superati**. Unica chiamata Wikipedia reale dal computer: quattro articoli utili in427ms; replay simulati non statistiche remote. APK releases/qa/network-reserve-2026-10-10/Synapse-0.1.11-network-reserve-code13.apk, **0.1.11/code13**, app.synapse.reader, SHA256 **E3BB922C80A2D21D71D3C39F1D54B8A8E7AF953E4AB9D36024F5577113A14C8A**. Firma storica conservata; versione principale/nome versione invariati.

Galaxy non rilevato da ADB: APK pronto, trasferimento e installazione non effettuati. Nessuna prova, acquisizione, avvio o benchmark sul telefono, nessuna alterazione dei dati. **Verifica sul telefono affidata all’utente**; resa visiva e fluidità nativa non certificate e nessuna promozione prima del suo riscontro. Consegna futura predisposta in scripts/deliver-network-build.ps1, con hash, Download e install-r conservativo, senza avvio app. Nessuna pubblicazione o push del codice.

### Consegna sul Galaxy S23 — 10 ottobre 2026

Dopo il collegamento del telefono richiesto dall’utente, eseguito scripts/deliver-network-build.ps1: hash locale verificato, APK copiato in /sdcard/Download/Synapse-0.1.11-network-reserve-code13.apk, SHA256 remoto coincidente e installazione con adb install -r conclusa con Success. Aggiornamento della stessa applicazione/firma, senza disinstallazione o cancellazione dei dati. Metadati del pacchetto installato confermano app.synapse.reader, versionName 0.1.11 e versionCode 13.

La precedente indicazione di telefono assente descrive il tentativo iniziale ed è superata dalla consegna riuscita. Evidenze: releases/qa/network-reserve-2026-10-10/delivery-install.log e installed-package.txt. App non avviata; nessuna prova, screenshot, registrazione o benchmark sul dispositivo. **Verifica sul telefono affidata all’utente**.

## Intervento 20 — Layout del feed e inversioni dello scroll, 10 ottobre 2026

Corretti i problemi segnalati nelle due immagini: altezza del feed indipendente da rifornimento/errori/offline, sfumatura statica sopra il dock, rifornimento visibile solo nell’indicatore alto allineato al wordmark, doppio tap senza toast di salvataggio. Gesture ancorate alla posizione visibile quando interrompono una molla, velocità finale coerente con inversione, conferme JS senza riallineamento di una gesture successiva.

145/145 test, TypeScript, export Android, APK release e firma storica verificati. Installato sul Galaxy S23 come aggiornamento 0.1.11/code14 conservando i dati. Utente ha esplicitamente autorizzato prove sul dispositivo: dodici flick alternati, gesture con inversioni, salvataggio/rimozione temporaneo e perdita/ripristino della connettività. Titolo e Home con coordinate identiche online/offline; nessun toast al doppio tap, nessun blocco persistente nelle sequenze provate. Wi-Fi/dati ripristinati e Home lasciata aperta. Nessuna certificazione FPS o generale di fluidità.

Dossier e limiti: [FEED-LAYOUT-2026-10-10.md](FEED-LAYOUT-2026-10-10.md). Artefatto corrente releases/qa/feed-layout-2026-10-10/Synapse-0.1.11-feed-layout-code14.apk, SHA256 E19E96FB349B4E5FA8E64E0A5DA7BC89DF98E8CA75271A940A074CDD1A99EA1F; anche in Download con hash coincidente. Code13 e precedente consegna restano storici.
