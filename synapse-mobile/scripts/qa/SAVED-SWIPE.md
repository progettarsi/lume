# Verifica salvati: punto 11

**Aggiornamento estetico:** questo protocollo descrive la prima implementazione storica. La release corrente elimina pulsante laterale, scritta di rilascio e collasso per altezza; usa azione accessibile sulla riga, label fissa e transizioni delle celle. Consultare `SAVED-MOTION.md` e intervento 9 per comportamento, durate e riscontri correnti.

APK e riscontri in `releases/qa/saved-swipe-2026-10-09`. L'immagine dell'utente è un riferimento visivo: l'azione è **Rimuovi dai salvati**, non Archive. Non elimina testo o visite.

`Synapse-0.1.7-saved-swipe.apk` è la consegna definitiva; `delivery-*` ne documenta soglia/conferma/undo e `installed-integrity.json` l'identità sul Galaxy. `Synapse-saved-swipe-matrix.apk` è la versione precedente usata per la matrice completa (`final-*`, nome storico delle catture): l'ultima modifica elimina i pulse dei nuovi pulsanti con movimento ridotto e corregge l'avviso dopo due scritture fallite. Non confondere la matrice precedente con una ricertificazione fisica di quei due casi.

Soglia: 42% della larghezza effettiva della riga, valutata solo al rilascio riuscito. La velocità non arma un gesto sotto soglia. Influisce soltanto sulla durata di uscita, limitata a 110–210 ms; collasso 160 ms. Il rientro parte dalla posizione corrente e una nuova presa può interromperlo. Movimento ridotto mantiene il tracciamento diretto del dito, eliminando uscita/rientro/collasso automatici.

Da verificare sulla release:

- Swipe corto veloce e lento: ritorno, nessuna apertura/rimozione.
- Superare 42%, mantenere il dito: superficie, bordo e indicazione di rilascio; nessuna scrittura prima del rilascio.
- Tornare sotto soglia prima di alzare: disarmare e rientrare.
- Cancellare il gesto/background: nessuna rimozione.
- Scroll verticale e diagonale prevalentemente verticale: scroll della lista, nessuna rimozione/apertura.
- Confermare due righe, usare Annulla due volte: restaurare ordine e salvataggi.
- Usare il pulsante accessibile di rimozione: stesso contratto dello swipe.
- Rimuovere l'ultima riga: spazio vuoto e Annulla utilizzabile.
- Riavviare dopo rimozione/ripristino: stato persistente; il registro Annulla è della sessione, massimo 32 azioni, senza scadenza temporale.
- Aprire dal salvato, scroll profondo, chiudere e riaprire; rimuovere dal lettore e chiudere: ritorno comune, senza destinazione misurabile obbligatoria.

`capture-saved.ps1` registra solo screenshot e albero UI. Non estrae DB/credenziali e rimuove i propri file temporanei dal telefono. I titoli iniziali sono conservati nelle catture baseline per controllare il ripristino dei segnalibri al termine delle prove. Non eseguire una cancellazione del database per simulare errori.

I test automatici di `bookmark.test.cjs` coprono distanze/inversione e serializzazione: rimozione+undo in corso, entrambi falliti, undo fallito dopo rimozione riuscita e fallimento tardivo superato da un nuovo salvataggio. Il contratto SQLite reale (tramite adattatore Node) verifica riconnessione, testo e cronologia conservati, stato dopo undo e impossibilità di sovrascrivere una nuova edizione con un vecchio articolo. Non sono prove fisiche di TalkBack o di guasto del disco Android.
