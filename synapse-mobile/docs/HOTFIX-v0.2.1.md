# Lume v0.2.1 — correzione crash e avvio

## Evidenza
Il buffer crash Android della v0.2 mostra un errore fatale di app.synapse.reader alle17:51:39: TypeError undefined is not a function, MaterialLoadingIndicatorTsx2. Il codice prodotto da Babel per quel callback richiama runFullCycle dal proprio contesto serializzato. La funzione ricorsiva in una callback di fine ciclo non è disponibile nel runtime nativo al momento del richiamo.

## Correzioni
- Indicatore MD3: un solo orologio di frame sul thread UI, senza callback ricorsive. Conservati velocità, sette forme, rotazione assoluta, congelamento, pausa e movimento ridotto. La ripresa non azzera il contatore.
- Avvio: caricamento dei font e archivio locale in parallelo, mantenendo nascosto il contenuto finché entrambi sono pronti.
- Configurazione valida già salvata: nessuna scansione dei dati storici per riconoscere un utente precedente. Recupero da backup e normalizzazione restano attivi per configurazioni vecchie o danneggiate.
- Migrazioni già completate: una sola lettura degli articoli e della cronologia. Le migrazioni necessarie mantengono il percorso completo e le protezioni dei dati.

## Verifica
Typecheck e287test passati. Nuovi test eseguono i worklet serializzati in un contesto separato per35stadi (cinque cicli), congelamento, annullamento e movimento ridotto; controllano inoltre che gli avvii configurati non ripetano migrazioni o letture dell'archivio. Il test non sostituisce la verifica visiva sul telefono. Nessuna misura reale del tempo di avvio ancora eseguita.

L'utente ha segnalato anche glitch del setup senza indicare il passaggio: richiesta una descrizione. Non dichiarare risolti glitch visivi non identificati. Le prove pratiche rimangono affidate all'utente. Nessuna cancellazione dei dati.

Export Android e build firmata completati. APK locale releases/Lume-0.2.1.apk (versione0.2.1,codice20). Tentativo di installazione non riuscito: il telefono precedentemente collegato non è più rilevato da ADB. Nessuna installazione della patch né prova pratica eseguita. v0.2suGitHub invariata; modifiche della patch locali in attesa del riscontro sui glitch del setup.

Precisazione dell'utente: il crash avviene durante il ricaricamento della Home con doppio tap. Percorso confermato: App.refreshHome → lib.refresh → lib.loading → FeedSpinner → MaterialLoadingIndicator. Corrisponde al componente nel crash registrato; la correzione della v0.2.1 copre questo percorso. I test di refresh mantengono la scheda corrente e gestiscono risposte duplicate/connessione. Telefono ancora non presente in adb devices al controllo successivo. Il glitch del setup resta da descrivere.
