# Preparazione Gemini: QA locale

La fixture usa Feed, Reader, useLibrary, parser Wikipedia e SQLite reali in un pacchetto separato (`app.synapse.reader.geminiqa`). Il trasporto Wikipedia e il generatore Gemini sono simulati; nessuna chiave personale viene letta e nessuna quota remota viene consumata. Il valore segnaposto nella fixture non è una chiave di servizio.

Compilazione con gli strumenti locali già disponibili: `./scripts/qa/build-gemini.ps1`. Entry, applicationId e nome vengono ripristinati byte per byte in `finally`. APK e riscontri in `releases/qa/gemini-dwell-2026-10-09`. Non usare le copie iteration come verifica della build finale.

- Online / Offline / Lenta controllano soltanto il trasporto della fixture, senza modificare Android.
- Apri apre la scheda corrente. Chiudi usa il ritorno reale; i normali swipe cambiano scheda.
- Dopo circa 3,5 secondi su una scheda ferma la preparazione diventa idonea. Attende comunque la riserva e il budget condiviso: al primo riempimento può iniziare sensibilmente più tardi.
- Gemini simulato impiega 3 secondi. Aprire durante la generazione deve aumentare `reuse`, senza aumentare `AI` o `full`.
- Lasciarla finire, poi aprire: `cached` aumenta e `unused` diminuisce, senza nuova generazione.
- Cambiare scheda durante la generazione o passare in background deve annullare il trasporto; `abortAI` aumenta. Una scheda attraversata in meno di 3,5 secondi non deve avviare Gemini.
- Quota attiva/disattiva il fallimento simulato. L'originale resta leggibile. Riaprire dopo il fallimento non ripete automaticamente la generazione; l'azione **Riprova revisione Gemini** nel lettore disattiva la quota simulata ed esegue il tentativo esplicito. Un successo reale del generatore riabilita la preparazione, conservando il budget.
- Grande cambia solo il font della fixture. No testo conserva lo scenario del precedente intervento; non serve al confronto della preparazione.

`AI` conta le chiamate al generatore, comprese quelle esplicite. `reuse` conta l'adozione di generazioni speculative già iniziate; l'adozione del solo download originale ha un contatore separato nel coordinatore. `unused` include lavoro completato ancora non usato e generazioni annullate/fallite. Il contatore del trasporto si azzera al riavvio, mentre le misure del coordinatore persistono nella SQLite della QA: non confrontare direttamente i totali di sessioni diverse.

Le misure del prodotto sono accessibili internamente con `lib.aiMetrics()` e persistono nella preferenza SQLite `ai-metrics`. Nessun selettore o pannello sperimentale viene aggiunto all'app normale. Queste prove verificano i contratti e il collegamento nativo, non i tempi reali del servizio Gemini né il risparmio di quota dopo un abort.
