# Verifica iniziale — 12 ottobre 2026

## Aggiornamento modelli — 13 ottobre 2026

`agy models` elenca Gemini 3.8 Flash High/Medium/Low, Claude Sonnet/Opus e GPT-OSS; 3.7 Medium non è più riconosciuto. Configurato 3.8 Flash Medium come preferito e soltanto 3.8 Flash Low come fallback prima dell'inferenza, limitati dall'allowlist esplicita. Nessun retry dopo errori. Il catalogo ha cache di 24 ore con invalidazione per scadenza, configurazione, CLI/impostazioni e diagnostici espliciti di disponibilità. L'elenco non costituisce conferma del backend.

Superati **26 controlli locali senza AI**, inclusi cache, criteri di selezione, rifiuto di modelli costosi e assenza di retry/conferme false dopo quota, autenticazione o rifiuto del backend. Unica delega reale: `gemini-3.8-flash-medium` confermato, `ready_for_review`, 7,53 s, 14.238 token input / 455 output / 398 thinking; totale provider 14.693. Proposta esatta revisionata e applicata alla fixture isolata, backup/BOM/CRLF verificati, esito registrato e byte originali ripristinati. Il fallback Low è autorizzato ed elencato, ma non verificato con inferenza reale. Nessuna pretesa di confronto quantitativo tra Medium e Low. Astra non invocata; nessun commit/push.

Log ignorati: `.runtime/agy38-final-smoke-fd696990`. Le istruzioni AGENTS, le protezioni di applicazione e i sorgenti applicativi non sono stati modificati.

Ambiente locale Windows, repository Git `Scrolls`, ramo `onboarding-patch`, app React Native/Expo in `synapse-mobile`. Le modifiche preesistenti dell'onboarding, incluso `synapse-mobile/AGENTS.md`, sono state lasciate intatte. L'intervento aggiunge soltanto il nuovo `AGENTS.md` alla root, due regole `.gitignore` e gli strumenti in questa directory. Nessun commit/push effettuato.

## Prove superate

- PowerShell 7.6.5, Codex CLI 0.162.1, AGY CLI 1.3.3. Help e flag verificati sulle installazioni locali. Rilevati due eseguibili Codex nel PATH: il wrapper seleziona esplicitamente il primo.
- `agy models` ha elencato `gemini-3.7-flash-medium`. Prova reale e successiva esecuzione completa del wrapper riuscite usando il login Google già disponibile. Nessuna autenticazione API o acquisto di crediti configurato.
- Delega reale finale: `ready_for_review`, modello effettivo `gemini-3.7-flash-medium`, 7,48 s, 14.227 token input / 406 output / 351 thinking secondo l'envelope AGY. La definizione dei contatori appartiene al provider: non sommare arbitrariamente thinking al totale riportato, 14.633.
- Proposta Flash revisionata, applicata a un repository fittizio, contenuto esatto controllato (`updated` + CRLF), backup dei byte originali verificato ed esito registrato come `accepted`. Il repository sorgente rimane invariato durante la generazione.
- Unica inferenza Astra iniziale: `consultation_ready`, 13,10 s, 10.940 token input / 178 output, di cui 31 reasoning riportati dalla CLI. Login confermato `Logged in using ChatGPT`; chiavi API ambientali escluse. Parametro modello `gpt-6-astra`, effort High; la CLI JSON non espone un campo modello effettivo, quindi il wrapper non lo inventa. Nessun evento di strumenti rilevato, snapshot invariato.
- Secondo tentativo con lo stesso `mainTaskId` bloccato **prima di avviare la CLI**, `attempts: 0`. Nessuna seconda inferenza Astra.
- **21 controlli automatici locali senza AI**: contesto UTF-8, percorsi e traversal, segreti, budget, binari/UTF-16, junction, ricorsione, requisiti Astra, stato/modello finali, soft deny, exit nonzero, output malformato/incompleto, turni Codex falliti, lock, limite per task, quoting/Unicode, separazione stderr, timeout con processo figlio reale, flusso eccessivo senza newline, eventi strumenti/permessi, rimozione credenziali ambientali, stdin non vuoto, snapshot di file tracciati/untracked/cancellati, applicazione revisionata, conflitti e backup/BOM/CRLF.
- Parsing di tutti gli script PowerShell riuscito; `git diff --check` riuscito; runtime e log correttamente ignorati da Git. Statistiche di durata/esito funzionanti.

## Correzioni emerse dalle prove

Le prove non sono state perfette al primo tentativo: il timeout AGY richiede un'unità (`120s`); un risultato asincrono vuoto PowerShell contaminava il valore restituito; due percorsi Codex venivano inizialmente concatenati. Questi errori sono stati risolti e le regressioni pertinenti sono coperte dai test. L'errore sui percorsi Codex è avvenuto prima di ogni chiamata al modello.

Il JSON schema nativo AGY ha introdotto un passaggio aggiuntivo nel test (envelope con due turni e 31.448 token totali). L'implementazione finale richiede JSON nel prompt e lo valida localmente: l'ultimo smoke test ha richiesto un solo turno. È un'osservazione locale, non una promessa di risparmio percentuale su task reali. La precedente prova preliminare AGY e quella con schema sono state chiamate di configurazione esplicite, non retry implementati dal wrapper.

La configurazione custom AGY `tools: []` non ha rimosso gli strumenti esposti nel test. È stata scartata come misura di isolamento; il relativo file di prova è solo temporaneo, non installato nel progetto o nei profili globali.

## Limiti e verifiche non effettuate

- Il test completo con junction ha richiesto esecuzione host autorizzata; la sandbox corrente ne impediva la creazione. Anche le prove CLI reali sono state autorizzate per accesso ai profili e rete. Nessun flag di bypass delle protezioni è utilizzato.
- Non è stata avviata una nuova chat Sol per provare il caricamento futuro di `AGENTS.md`: avrebbe creato una sessione aggiuntiva senza beneficio proporzionato. Le istruzioni sono salvate nelle posizioni del repository previste, ma il comportamento di una futura chat non è stato osservato.
- Nessuna prova cloud, su altro PC o dopo aggiornamenti delle CLI. Gli identificatori modello/config devono essere rivalidati se gli strumenti cambiano.
- Nessuna simulazione tramite chiamate reali di esaurimento quota o rifiuti: queste casistiche sono verificate con output/processi simulati, per non consumare quota inutilmente.
- Nessuna promessa di isolamento OS completo per AGY. Il controllo del flusso può rilevare strumenti già avviati; snapshot e lock coprono solo il perimetro documentato nel README. Per lavoro sensibile resta l'esecuzione diretta.
- Non misurati risparmio di crediti, disponibilità residua Google AI Pro o equivalenza di quota fra prodotti. Sono conservate solo metriche effettivamente restituite e gli esiti di revisione. L'overhead CLI osservato impone deleghe selettive.
- Non eseguiti test dell'app, build Android o prove telefono: nessun componente applicativo è stato modificato da questo intervento.

## Revisione architetturale finale

Mantenuti wrapper PowerShell senza dipendenze aggiuntive, config piccola e istruzioni permanenti brevi. Introdotti autonomamente: proposte prima dell'integrazione, backup dei byte non committati, controllo hash contro conflitti, rifiuto di output nonostante exit 0, registro per bloccare consultazioni ripetute, statistiche semplici senza altre AI. Evitati daemon, classificatori, fork Sol e configurazioni globali temporanee che avrebbero creato corse con altre sessioni.

Non implementato l'isolamento tramite VM/container o account separato: è una possibile evoluzione se diventasse necessario eseguire codice delegato non affidabile, ma aumenterebbe costi e manutenzione per il perimetro attuale.

Le evidenze dettagliate sono nei log locali ignorati `.runtime/flash-smoke-c4431d4a`, `.runtime/astra-smoke-cf4658b2`, `.runtime/astra-smoke-e69bec61` e nelle fixture del test finale `.runtime/tests-cb3426d245be4f018db4261dfdcb573e`. Non committare quelle directory.
