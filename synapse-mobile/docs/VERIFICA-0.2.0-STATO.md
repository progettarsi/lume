# Verifica completa e valutazione 0.2.0 — stato di ripresa

Avvio: 9 ottobre 2026, Europe/Rome. Richiesta originale: verifica completa, resoconto prima delle correzioni, correzione di tutti i difetti confermati risolvibili, regressioni, release locale soltanto se tutti i criteri sono soddisfatti. Prototipo `../synapse` consultabile, vietato modificarlo. Conservare le decisioni estetiche approvate e i dati esistenti.

## Procedura di ripresa

1. Leggere questo documento e l'ultimo blocco di `docs/AVANZAMENTO.md`.
2. Verificare versione, processi ancora attivi, risultati salvati e differenze rispetto a `releases/qa/audit-0.2.0-2026-10-09/baseline-inventory.csv`. Non ripristinare automaticamente i file diversi: sono lavoro da conservare e comprendere.
3. Riprendere dal prossimo passo preciso del blocco corrente. Non ripetere i blocchi conclusi salvo cambiamenti ai file o evidenze che invalidino i controlli.
4. Aggiornare questo documento dopo ogni blocco: problemi, correzioni, verifiche, limiti e prossimo passo. Non promuovere la release sulla base di prove di un APK precedente.

## Base effettiva

- `package.json` e `app.json`: **0.1.10**, Android code **11**; application ID `app.synapse.reader`.
- Nessun repository Git disponibile. Impossibile distinguere modifiche locali e regressioni da un commit; confronto possibile con snapshot e artefatti precedenti verificati.
- Copia iniziale di 138 file e SHA-256 in `releases/qa/audit-0.2.0-2026-10-09/baseline/` e `baseline-inventory.csv`. Nessuna correzione applicata al codice.
- I precedenti resoconti sono evidenza storica da confrontare con il codice e nuove prove, non PASS automatici.
- Primo accesso ADB dal sandbox: daemon non avviabile. Da verificare con accesso agli strumenti locali autorizzati; non dichiarare assente il Galaxy sulla base di questo errore.

## Blocchi e criteri di completamento

| Blocco | Responsabilità e risultato verificabile | Stato |
|---|---|---|
| B1 | Istruzioni/documenti integralmente letti, decisioni/14 problemi ricostruiti, snapshot, versione e controlli iniziali conservati | IN CORSO |
| B2 | Revisione funzionale di rete/Gemini/feed/personalizzazione/dati/UI/Android, sicurezza completa se il servizio funziona; resoconto iniziale con ID ed evidenze prima delle correzioni | DA FARE |
| B3 | Correzioni ordinate per rischio e dipendenze, test di regressione pertinenti, controllo distinto delle modifiche delicate; aggiornamento per problema | DA FARE |
| B4 | Typecheck, test, export Android, build release, integrità/firma e matrice release sul Galaxy; servizi reali e simulati distinguibili, prestazioni confrontabili | DA FARE |
| B5 | Decisione motivata sui criteri, eventuale versione/code/firmatura/changelog/APK finale verificato, consegna con limiti e passi utente precisi | DA FARE |

## Registro del blocco corrente — B1

**Problemi trovati:** nessun nuovo difetto classificato finora. README contiene riferimenti storici; occorre distinguere versione attuale e stato dei punti precedenti.

**Correzioni:** nessuna. Creato soltanto questo documento e lo snapshot della base.

**Verifiche eseguite:** letti AGENTS nativo e prototipo; stato Git assente; versioni package/app lette; copia e hash dei 138 file iniziali. Tentativo di avvio della scansione Standard tramite Codex Security in attesa di risposta.

**Prossimo passo preciso:** completare lettura di AVANZAMENTO e dei dossier, identificare i 14 punti originari, integrare lo snapshot con configurazioni/plugin Android mancanti, eseguire typecheck/test iniziali e verificare accesso Galaxy. Poi chiudere B1 con evidenze salvate e avviare B2.

## Vincoli per la release

0.2.0 non ancora valutata né autorizzata dai riscontri. Obbligatori: nessun blocco funzionale o difetto grave aperto, correzioni verificate, controlli richiesti superati, flussi principali sul Galaxy in release, rete lenta/offline e Gemini indisponibile, nessuna regressione significativa di fluidità, scelte estetiche risolte, limiti espliciti compatibili. In mancanza di una verifica essenziale produrre eventualmente un candidato distinto senza promuovere 0.2.0.
