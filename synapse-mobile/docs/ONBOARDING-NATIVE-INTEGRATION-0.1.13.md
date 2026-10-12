# Integrazione nativa del setup approvato — 0.1.13, build 17

12 ottobre 2026. Ramo `onboarding-patch`. Questo aggiornamento integra la variante C del prototipo `../synapse-onboarding-motion-prototype`, approvata dall’utente dopo la revisione delle singole schermate. Le descrizioni precedenti delle quattro tappe e del morph continuo dei pulsanti sono storiche: il percorso corrente ha tre esempi e pulsanti con contorno fisso che ruota.

## Comportamento consegnato

Una sola scena persistente coordina benvenuto, identità, interessi, tutorial e preparazione. Avanti rimane alla stessa altezza; fra interessi e tutorial si sposta sulla destra della dock. Nome e foto possono essere saltati. Il ritorno dal tutorial recupera la selezione degli interessi. La preparazione non espone Indietro o un ingresso manuale quando il normale caricamento è pronto.

Il tutorial riusa `Feed`, `FeedCard`, `SaveButton` e `Reader`, con callback locali e tre articoli del prototipo. Il riquadro ha la propria altezza di pagina: a riposo mostra un solo articolo. I fade del feed accompagnano lo scorrimento. Tap, doppio tap, salvataggio e apertura funzionano sugli esempi senza scrivere learning, cronologia o raccolta reali. La freccia esterna salta il tutorial; uno swipe ulteriore sull’ultimo articolo conduce alla preparazione. Il lettore contrae la superficie verso l’origine misurata, senza dissolvere l’intera pagina. Il testo del preview conserva la propria larghezza durante la chiusura.

Le righe complete dei titoli sono misurate prima dell’animazione lettera per lettera. I nomi Alex, Sofia e Andrea sono suggerimenti animati, mai dati inseriti automaticamente. Focus e digitazione interrompono il ciclo; uscita e background lo sospendono senza impedirne la ripresa. Tastiera e font al 130% sono stati controllati sul dispositivo.

Il loader usa le sette coppie di curve MD3 del prototipo. La sequenza e la rotazione sono eseguite sul thread UI. Quando sono disponibili almeno dieci anteprime utili, acquisisce una sola volta percorso e angolo correnti, si ferma, quindi la stessa forma si espande per entrare nella Home già montata. Nessun conteggio o ritardo di rete è simulato. Gli stati offline/errore mantengono azioni esplicite di riprova e ripiego; un errore di persistenza non provoca un ciclo automatico di tentativi. Background, smontaggio e movimento ridotto annullano o sospendono il movimento.

## Correzioni emerse dalla verifica

- Lampadina e raggi nelle dimensioni del prototipo, SVG originali e colori della palette dell’app.
- Centraggio del titolo iniziale misurato; sottotitoli che accompagnano il cambio di geometria, invece di saltare di posizione.
- Eliminata la duplicazione del sottotitolo nei contenitori integrati di identità e interessi.
- Avatar, campo e comandi sopra la tastiera; spacing dei comandi identità centrato come gruppo.
- Etichette della dock misurate nella propria larghezza: icona e testo di “Salvati” centrati insieme, con margini equivalenti.
- Corretto l’ancoraggio della forma del pulsante: il contenitore cresce da 52 a 58 punti, e il figlio da 52 punti viene ora centrato prima della scala. Il precedente scarto di circa 10 pixel rispetto alla freccia è eliminato. La misura finale è conservata in `alignment-final.json`.
- Il contenuto del tutorial si attenua prima che la superficie si raccolga nel loader; non viene tagliato dal rettangolo in contrazione.
- Il comando della dock non viene reinnescato dalla notifica di uno swipe. L’indice persistito dell’antica quarta tappa viene normalizzato alla terza senza perdere draft o backup.
- La rotazione MD3 procede su una sequenza assoluta: eliminato il salto di 260° al confine di ogni ciclo.
- Foto e nome nel titolo Profilo soltanto se entrambi presenti; altrimenti rimane “Profilo”. Impostazioni alleggerite secondo le richieste dell’utente.

## Delega e revisione indipendente

La sottotask MD3 è stata assegnata ad Antigravity attraverso [Computer Use](C:/Users/Augusto/.codex/plugins/cache/openai-bundled/computer-use/26.1007.21434/skills/computer-use/SKILL.md), come autorizzato dall’utente. Antigravity ha creato soltanto `MaterialLoadingIndicator.tsx`, `materialLoading.ts` e il [rapporto](ANTIGRAVITY-MD3-REPORT.md), senza credenziali, commit o modifiche al coordinatore. Il codice è stato riesaminato: il difetto di rotazione fra cicli è stato corretto e coperto da test indipendenti. Le dichiarazioni del rapporto delegato si riferiscono alla sua consegna iniziale, non sostituiscono questi controlli.

La revisione separata dei contratti ha controllato migrazione, back/replay, soglia 9/10, isolamento demo, freeze/zoom, sospensione/ripresa, errore SQLite e riprova esplicita. Nessuna nuova dipendenza di prodotto.

## Verifiche ed evidenze

Typecheck, compilazione dei test e **239 test superati**, esportazione Android e APK release firmato riusciti. I test comprendono migrazioni conservative, rollback, salvataggio/copia foto, placeholder, gesture, reader, geometria del titolo, continuità MD3 e ingresso solo dopo il completamento dello zoom.

Verificata anche una copia esportata dell’indice, separata dai lavori Home preesistenti: typecheck riuscito e **238/238 test** superati. La differenza è un test del toggle auto-hide appartenente al lavoro preservato e lasciato fuori dal commit onboarding.

Galaxy S23, Android, schermo 1080×2340, densità già impostata a 450, area logica 384×832. Le prove usano `app.synapse.reader.setupqa` (app reale isolata) e `app.synapse.reader.onboardingqa` (laboratorio grafico con comandi QA). Nessun dato dell’app principale è stato cancellato. Il font temporaneamente al 130% è stato ripristinato a 1.0; la densità non è stata modificata.

Provati fisicamente: percorso completo, nome digitato durante il placeholder, selettore foto aperto e annullato, interessi e loro conservazione dopo back/riavvio, setup senza nome/foto/interessi, tre tappe e dock, apertura/chiusura del lettore, doppio tap, background/ripresa, ultimo swipe, preparazione con dati reali e ingresso Home, riapertura senza onboarding, tema scuro e movimento ridotto nel laboratorio. Le registrazioni e i confronti sono in `releases/qa/onboarding-integration-0.1.13`; `setup-motion-final.mp4` e la relativa tavola documentano i passaggi intermedi. La registrazione precede soltanto il centraggio finale della forma, verificato nelle catture successive.

I casi di errore disco/rete, soglia 9/10 e sostituzione/rimozione foto sono coperti dai test; questa sessione non ha ripetuto fisicamente l’intero ciclo foto, TalkBack, tutti i permessi Android, rete lenta/offline né dispositivi iOS o tablet. Il confronto grafico dettagliato e le differenze deliberate sono in [design-qa.md](../design-qa.md).

## Versione e stato dei file

VersionName **0.1.13**, versionCode **17**, package `app.synapse.reader`. Verifica `apksigner`: firma v2 valida, certificato SHA256 `fb5a08f89ecdedaa90c7f94ce9aa7a8b11ca6a5d74f4b0341ff611a06ee98c6a`, identico alla build 16. APK: `releases/Synapse-0.1.13-build17.apk`; checksum: `releases/Synapse-0.1.13-build17.apk.sha256`. La build 16 è conservata separatamente.

APK SHA256: `56516ef5b9292c7b4d333f29b5b02fb2192aeb7c5a9d66ec5deec9ca32b96de2`. Installato con aggiornamento conservativo sul Galaxy S23; il package installato conferma code 17/name 0.1.13. Il cold start della build consegnata apre direttamente la Home scura preesistente, senza forzare onboarding (`production-home-final.png`). Il nome/profilo reale non è stato sostituito da quello delle copie QA.

Il commit comprende l’integrazione onboarding e le precedenti correzioni del tutorial richieste in questa chat. Restano separati i lavori preesistenti su rail/Home/auto-hide identificati nel checkpoint A. I file condivisi sono selezionati nell’indice senza modificare il working tree: il feed abilita il fade superiore per il tutorial; l’abilitazione preesistente per tutta la Home resta fuori dal commit. Il fixture gesture condiviso include soltanto gli adattamenti necessari a quel riuso e le prove del tutorial. L’APK comprende anche il lavoro preservato, come il working tree usato per la verifica. Non sono stati eseguiti push, merge su main o reset della cronologia.
