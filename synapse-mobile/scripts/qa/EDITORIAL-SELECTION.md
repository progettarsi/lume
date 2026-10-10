# Punto 4: confronto editoriale

Il confronto congelato è in `releases/qa/editorial-selection-2026-10-09/`: `CAMPIONE-50.md`, CSV con colonna utente vuota, `corpus.json`, HTML originali con revisioni e `comparison.json`. La cartella `baseline` conserva il compilato prima della modifica; `before` e `before.json` conservano sorgenti/impronte, poiché il progetto non ha Git.

Per ripetere **offline**, dalla radice dell'app con Node già disponibile:

```powershell
node node_modules/typescript/bin/tsc -p tsconfig.test.json
node scripts/qa/compare-editorial.cjs
```

Il replay usa gli stessi 50 testi, gruppi e assenza di preferenze. Confronta parser/filtri di produzione precedenti con quelli attuali; il limite di un ripiego per risposta è applicato realmente. La riserva usa i due rispettivi `reserveArticles`, con identità, budget e ranking effettivi. Le categorie del campione sono lo strato di acquisizione, non una classificazione editoriale indipendente. Le durate CPU sono sul computer: 120 ripetizioni, mediana e p90, nessuna attesa di rete. Non misurano la latenza sul telefono o il primo fotogramma.

L'acquisizione remota `capture-editorial.cjs --html` è separata dal replay: 26 temi precedenti, sei controlli ombrello, poi 18 collegamenti dalle introduzioni. L'API ha restituito 429; il corpus usa pagine HTML pubbliche, non l'ordine del generator API. Introduzioni vuote dovute all'estrazione non provano l'assenza di testo nella voce. Riutilizza gli archivi presenti e si ferma al rate limit; non è un nuovo provider dell'app. `--probe-seeds` verifica separatamente i nuovi titoli iniziali, con fonti/risoluzioni in `seed-probe.json`: quei testi non sono aggiunti ai 50 per favorire artificialmente il risultato dopo.

Prima taratura interna in `src/content/editorial.ts`. Disabilitare `EDITORIAL_TUNING.enabled` **prima dell'inizializzazione** ripristina temi e ordinamento/selezione precedenti. I miglioramenti del filtro divulgativo in `text.ts` (contesto/frase completa al posto del solo numero di caratteri; cataloghi riconosciuti dal contenuto) restano: le copie iniziali consentono anche il ripristino completo. Nessun comando remoto o pannello sperimentale necessario.

Controlli funzionali: definizioni specifiche/ombrello indipendenti dal titolo, contesto corto ma completo, paradosso con quantificatori, ripiego limitato, deduplicazione prima del limite, pubblicazione immediata prima di una risposta lenta, varietà del nuovo tratto senza spostare quello pubblicato, ricerca intenzionale e riserva offline. Tutti i contratti precedenti di rete/cache/Gemini rimangono nella suite.

La valutazione automatica segnala fatti/meccanismi descrivibili, non certifica interesse, verità o gusto dell'utente. Le voci ampie ancora favorite e le esclusioni discutibili vanno valutate nel CSV prima di una seconda taratura. Nessuna nuova fonte, peso di apprendimento o raccolta di dati personali.
