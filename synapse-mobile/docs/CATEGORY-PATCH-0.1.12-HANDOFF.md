# Category Patch 0.1.12 — consegna fase A

10 ottobre 2026. Fondamenta, logica e adattamenti minimi completati. Versione ancora **0.1.11**, versionCode invariato. Nessuna release, APK, installazione o prova sul telefono.

## Repository e checkpoint

Radice `C:/Users/Augusto/Documents/Scrolls`, ramo `category-patch-0.1.12`, stato iniziale pulito. Commit precedente: `48a942433b84d100e24da93e15d1b04e83e219ae`.

Il commit con questo documento e messaggio `Category patch 0.1.12: complete phase A foundations and handoff` è il checkpoint A. Lo SHA esatto viene comunicato nel messaggio finale; al passaggio si ricava con `git log -1 --format=%H`. Il documento non incorpora l’hash del proprio commit.

Nessun push, merge, cambio ramo o riscrittura della cronologia. Prototipo, esclusioni Git, dipendenze e versioni conservati. Codex termina le modifiche prima dell’avvio di Antigravity: un solo agente modifica questa cartella alla volta.

## Diagnosi confermata

- Feed usava “Scoperte” quando non trovava un tema; altre superfici usavano Wikipedia. Il ripiego condiviso ora è **Enciclopedia**, senza inventare un argomento.
- `Wikipedia.articles` applicava poche corrispondenze nei metadati soltanto al percorso `general`; gli altri articoli ereditavano la categoria di recupero, anche per link estranei o ricerca sull’articolo d’interesse.
- Un unico elenco statico alimentava recupero, preferenze e barra. Il ranking mostrava comunque tutti i 13 temi. Ora registro e barra sono separati: 22 percorsi, di cui Curiosità è esplorativo e 21 sono temi semantici.
- `EDITORIAL_SEEDS` sovrascriveva Spettacolo con semi cinematografici. Corretto; Musica e Cinema hanno percorsi distinti.
- Modificare soltanto l’etichetta avrebbe lasciato i contributi individuali del profilo v3 nella vecchia categoria.
- Il campione remoto ha rivelato GPS→Astronomia, Sistema solare→Scienza, Vombatidae→generico. Correzioni e regressioni ora verificabili.

Non sono dimostrate classificazione universale, pertinenza di tutte le risposte Gemini o disponibilità remota inesauribile. Le regole restano euristiche: Serendipità nel campione, senza abbastanza evidenza, conserva il ripiego neutro.

## Modello e classificazione

`Article.category` è il tema principale; `topics` contiene fino a tre temi secondari. `retrieval` registra tema/metodo di recupero senza influenzare la classificazione. `sourceCategories` conserva metadati pubblici; `classification` registra versione, impronta del contenuto, provider e confidenza.

`categories.ts`: ID stabili, etichette italiane brevi, alias, icona, parent, categoria Wikipedia e semi. Usare `categoryId`, `normalizeTopic`, `categoryLabel`. Musica/Musicale, Società/Societa e le vecchie etichette Arte e cultura/Intrattenimento si normalizzano. Nessuna Gossip o categoria biografica indistinta.

`classifyLocal` usa titolo, definizione, introduzione e metadati filtrati; scarta categorie amministrative, cronologiche, di manutenzione e disambiguazione. Non usa interessi o cronologia. Anteprime, cache, semi iniziali e fallback di avvio vengono preparati prima della pubblicazione. I temi secondari entrano nei termini dei nuovi segnali di personalizzazione.

`ClassificationPreparation` aggiunge Gemini in background tramite `ReserveScheduler`: prima la riserva, poi preparazione; lettore, foreground, offline e background interrompono il lavoro. Limiti: quattro articoli/lotto, 32 pendenti, due inizi/minuto oltre al budget del scheduler, timeout quattro secondi, pausa un minuto dopo errore/quota/output invalido, cache persistente di 128 risultati. Nessuna attesa Gemini al primo caricamento. Modello già presente nell’integrazione; nessun backend o piano a pagamento aggiunto.

Il prompt tratta le voci come dati. Invia titolo, introduzione entro 1.800 caratteri e 24 metadati pertinenti, senza profilo o provenienza di recupero. Validazione: identità, cardinalità, ID noti, argomenti, confidenza e proposta separata. Confidenza sotto 0,65 e Curiosità non sostituiscono il locale; una confidenza formalmente valida non dimostra pertinenza.

Impronta: ID/revisione/testo/metadati/`CLASSIFICATION_VERSION`. Aumentare questa versione quando regole, catalogo o prompt cambiano in modo incompatibile. Richieste duplicate accorpate; risultati dopo annullamento/cambio chiave/disattivazione scartati e impronta corrente ricontrollata. Cache, futuro del feed e contributi vengono corretti; prefisso pubblicato e scheda corrente mantengono l’etichetta. Alla riapertura/riavvio si usa la classificazione valida senza riclassificazione remota dell’archivio.

## Registro, attivazione e disponibilità

`categoryRegistry.ts` persiste temi osservati e ordine visibile. Sei percorsi iniziali: Scienza, Tecnologia, Storia, Natura, Geografia, Arte; massimo otto oltre Per Te. Un nuovo tema richiede percorso nel catalogo, due identità osservate, contenuti pertinenti locali, e tre interazioni distinte oppure due salvataggi distinti. Un solo tocco non basta.

Le proposte Gemini vengono normalizzate e persistite **non verificate**, senza pulsante o richieste speculative. Per promuovere un argomento non presente occorre estendere catalogo, regole e semi/ricerca con prove di reperimento e aggiornare versione/test. Non trasformare una parola generata in un percorso arbitrario.

L’ordine considera interessi consolidati, recenza per ordine delle azioni e disponibilità. Un elemento supera un precedente solo con margine 1,5, necessario anche per l’inversione. Nessuna durata/esposizione introdotta. La selezionata conserva il posto. Categorie esistenti non vengono espulse per calo d’interesse o pressione di capacità: i nuovi temi aspettano uno slot libero, fino a indisponibilità confermata.

Ogni percorso di categoria filtra per tema principale. Il ciclo usa massimo tre HTTP senza retry moltiplicati: semi/percorso corrente, link con cursore, ricerca del tema al terzo tentativo. `all` mantiene esplorazione/personalizzazione. Un vuoto avanza il percorso; errori/429/503 non provano esaurimento. Nuove scoperte pertinenti riattivano lo stato; reinserimento e ordine vengono applicati al checkpoint sicuro successivo. Riserva, protezioni, rifornimento, clock di ritorno e avviso offline restano operativi.

## Contratto barra

Usare `lib.categoryRail: CategoryRailItem[]`, già elaborato: `id`, `label`, `icon`, `selected`, `order`, `visible`, `enabled`, `reason`, `actions`. `all`/Per Te sempre primo. Motivi: offline, exhausted, service, limit, unavailable. Gli ultimi tre conservano la selezione consentita; retry e timeout restano governati centralmente.

- Selezione: mantenere `selectCategory`/`lib.enterCategory`, senza ranking o recupero nella barra.
- Collegare `beginCategoryInteraction`/`endCategoryInteraction` a tocco, cancellazione, scroll e fine momentum. Non riordinano.
- `settleCategories` soltanto con barra ferma e fuori dal lettore. L’adattamento attuale usa refresh esplicito Home e ritorno dal Profilo. Non chiamarlo ad ogni render, salvataggio, richiesta o indice del feed.
- Esaurimento selezionato: conservare elemento e spiegazione, ritorno e Annulla. `completeCategoryReturn` rimuove esauriti solo dopo il passaggio completato a Per Te; App lo chiama nell’effetto del cambio categoria a `all`.
- Offline: stessa appartenenza/ordine, Per Te utilizzabile, altri attenuati/disabilitati. Non nascondere categorie per la sola rete assente.
- Conservare istanza ScrollView, chiavi ID e offset orizzontale; coordinare inserimenti/rimozioni. Nessun drag o long press per riordinare.

`categoryIds` resta l’adattatore dell’ordine visibile; il parametro storico `order` di CategoryRail resta per gli harness. Il prodotto usa `items`.

## Contratto Integrazione Gemini

`GeminiIntegration` (`content/geminiIntegration.ts`): `state: GeminiConfigurationState`, `load()`, `setEnabled(boolean)`, `save(value)`, `remove()`. Stati loading/missing/ready/disabled/saving/error; campi configured/enabled/busy/message/actions. Lo stato non espone la chiave; ready significa configurazione presente, **non verifica remota riuscita**.

App contiene `gemini` e `geminiState`. Usano `getAIKey`/`putAIKey` esistenti: SecureStore nativo e sola memoria di sessione web. Scritture seriali; caricamenti tardivi non sovrascrivono nuovi intenti. Campo vuoto dopo salvataggio; non copiare la chiave custodita in stato visivo, messaggi o log. `persistAIKey` salva e abilita; Rimuovi elimina e disabilita. Errori preservano il valore durevole precedente.

Non aggiunta verifica remota automatica o a consumo entrando nelle impostazioni. Mostrare “configurato”, non “chiave verificata”. Gli errori della revisione del lettore restano nell’integrazione esistente. Un’eventuale verifica remota futura richiede un contratto dedicato, non una richiesta inventata nel componente.

## Migrazione e recuperabilità

Profilo ancora v3; `categoryVersion: 1` distingue la migrazione indipendente. SQLite usa coda e transazione esistenti per articoli, visite e profilo. `category-pre-v1-backup` conserva profilo grezzo e snapshot precedente, una sola volta nella medesima transazione. Backup v3 distinto e conservato. Errori fanno rollback anche di marker/backup.

`reconcileCategories` sposta una sola volta i contributi esatti dei bookmark attivi e delle aperture recenti. Corregge anche il bookmark disattivato: Annulla riaggiunge il tema nuovo. Conserva parole e ordine; accorpa alias senza duplicare massa. Aperture aggregate fuori dalla memoria recente e visite senza testo non sono ricostruibili: si conserva il contributo o l’etichetta incerta, senza inventare attribuzioni.

`putClassifiedArticles` registra classificazioni e profilo insieme. La lettura di una scheda visivamente ferma usa la categoria canonica in cache per il profilo. Merge di testo non degrada una classificazione Gemini valida dello stesso contenuto né ripristina un bookmark rimosso.

Recupero: operazione tecnica con app arrestata, copia database/WAL e controllo dei dati successivi. Ripristinare in transazione le righe/il profilo del backup concordato, conservando dati aggiunti dopo; non cancellare database o cronologia. Test verificano snapshot e rollback, non un ripristino indiscriminato dopo nuovo uso. Web: snapshot e rollback compensativo localStorage; SQLite è il riferimento nativo atomico.

## Perimetro fase B

Modificabili: `src/components/CategoryRail.tsx`; nuovo componente visivo “Integrazione Gemini” sotto `src/components/`; sezioni di composizione/navigazione relative in `App.tsx`; documentazione B e test visivi. Preservare gli effetti/callback centrali di App. Documentare qualsiasi eccezione prima di modificare il perimetro.

Da non modificare: `src/content/*`, `src/useLibrary.ts`, `src/storage*`, `src/key*`, configurazioni/versioni/lockfile, prototipo `../synapse`, geometria/gesti Feed/Reader/Dock, policy rete/riserva/profilo. Etichette Feed/Reader/ArticleRow già adattate. Nessuna decisione di classificazione o reperimento nei componenti.

Decisioni visive: icone, leggibilità, motivi di indisponibilità, offset della barra, inserimenti/rimozioni coordinati, schermata Gemini e stati saving/error. Conservare carta calda, terracotta, Newsreader/Source Sans 3, reduced motion, accessibilità e gesti interruptibili. Nessuna immagine articolo o account.

## Esempi per tutti gli stati

| Caso | Preparazione | Atteso |
|---|---|---|
| Avvio | Profilo vuoto/catalogo locale | Per Te + sei temi, etichette locali pronte |
| Emergenza | Tre aperture Jazz/Sinfonia/Pianoforte, due articoli pertinenti e slot | Musica al checkpoint, niente duplicato Musicale |
| Accidentale/proposta | Una apertura oppure proposta Robotica | Nessun pulsante; proposta non verificata |
| Ordine/selezione | Interessi vicini, tocco/scroll attivo; Storia selezionata | Ordine fermo, posto della selezionata conservato |
| Servizio/quota | service/limit/unavailable con after | Elemento conservato, spiegazione e tentativi esistenti |
| Lotto vuoto | Vuoto poi articolo utile | Nessuna rimozione, percorso avanza |
| Esaurimento | Tre vuoti validi | Spiegazione/ritorno/Annulla; rimozione dopo ritorno |
| Offline/riavvio | Rete assente | Per Te locale; altri visibili attenuati/disabilitati |
| Riattivazione | Nuovo pertinente, ready | Candidata nuovamente al checkpoint |
| Gemini lento/errore/invalido | Promise pendente, quota o ID ignoto | Locale pronto, feed non attende |
| Tardivo | Annullamento/cambio chiave/disattivazione/revisione | Nessuna applicazione obsoleta |
| Visibile | Correzione in background | Etichetta corrente ferma, futuro/cache corretti |
| Salvato | Salva→correggi→rimuovi→Annulla | Peso esatto nel tema canonico, nessun doppio conteggio |
| Configurazione | loading/missing/ready/disabled/saving/error | Stato coerente, nessuna chiave nello stato |

Test: `category-patch.test.cjs`, `category-storage.test.cjs` e harness rete/ritorni/riserva esistenti. La prova tardiva usa intenzionalmente una risposta semanticamente errata per verificare stabilità/ledger; non certifica la pertinenza del modello.

## Controlli e limiti della consegna

- TypeScript superato; **169/169 test**, zero fail/skip/cancel: 145 preesistenti, adattati dove il contratto cambia, più 24 nuovi.
- Export Android/Hermes superato; output locale escluso `dist-category-0.1.12`. Non equivale a APK/dispositivo.
- Diff/whitespace e file del commit controllati. Segreti, credenziali, log e artefatti esclusi non inclusi.
- Baseline registrata in `GIT-COLLABORATION.md`: 145 test/typecheck/export riusciti. Nessun problema preesistente di prodotto identificato. Il runner pnpm ha dato EPERM in sandbox: eseguiti direttamente gli stessi strumenti installati. Un primo probe rete è fallito nella sandbox; quelli riusciti hanno usato quattro più una richieste pubbliche.
- Wikipedia: snapshot pubblici `category-retrieval-0.1.12.json` e `category-retrieval-supplement-0.1.12.json`, URL/revisioni/metadati conservati. Replay copre tutti i 21 temi e regressioni ambigue; test deterministico semi→link→ricerca per ciascun tema. Non tutti hanno due articoli utili nel piccolo campione; rifornimento remoto prolungato non stressato. Testi pubblici Wikipedia, attribuzione alle URL incluse e licenza CC BY-SA della fonte.
- Gemini reale **non eseguito**; nessuna chiave personale recuperata dal telefono. Payload/stati/timeout/cache/cancellazione verificati con trasporto controllato. Modello/schema per la chiave, qualità/latenza/quota reali da verificare in C.
- Fluidità, offset nativo, nuova barra e schermata Gemini da provare sul telefono in C. Nessuna certificazione iOS/TalkBack/FPS.

Comandi in `synapse-mobile`, fermandosi se uno fallisce:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc -p tsconfig.test.json
node --test tests/*.test.cjs
$env:TEMP = Join-Path (Get-Location) '.expo/category-temp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
node node_modules/expo/bin/cli export --platform android --output-dir dist-category-0.1.12
```

Equivalenti package: `pnpm typecheck`, `pnpm test`, `pnpm export`. Probe opzionale `node scripts/qa/category-retrieval.cjs <output.json>`: massimo quattro richieste pubbliche; `--supplement` come terzo argomento: una richiesta. Non necessario nei normali test.

## Consegna B e revisione C

Antigravity parte dallo SHA A comunicato, controlla radice/ramo/status, legge AGENTS.md e questa consegna. Preserva modifiche inattese senza switch/reset/clean automatici. Lavora solo nel perimetro visivo; crea un commit B distinto con documentazione, verifiche e limiti, comunica SHA e file non registrati. Nessun push o merge autorizzato da questa consegna.

In C Codex confronterà **lo SHA A** con HEAD di B e controllerà anche staged, unstaged, nuovi file, esclusioni, configurazioni e segreti. Dalla radice:

```powershell
git status --short
git log --oneline --decorate -8
git diff --stat <SHA-A>..HEAD
git diff <SHA-A>..HEAD
git diff --cached
git diff
git ls-files --others --exclude-standard
```

Non basta il diff fra commit se B lascia modifiche non registrate. Integrazione, controlli completi, telefono e decisione sulla release 0.1.12 appartengono alla fase C.
