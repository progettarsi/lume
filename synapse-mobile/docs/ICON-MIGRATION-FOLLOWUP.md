# Correzioni dopo la prova dell'APK — 16 ottobre 2026

## Storia

Il pittogramma Phosphor `columns` appariva come una pausa alla dimensione dei chip. Sostituito con `scroll` (pergamena), sempre Regular e tramite l'alias condiviso `pillar`: barra categorie, badge e interessi ricevono lo stesso aggiornamento.

## Blocco segnalato dopo tocchi rapidi

Analisi del codice, senza tentativi di riproduzione e senza installazione o uso del dispositivo. Non ci sono log dell'episodio: la causa esatta non è confermata.

Il salvataggio aggiorna cache e stato dei segnalibri; non modifica la rotta. Il passaggio al Profilo avviene tramite la navbar. Sono però emerse queste condizioni concrete:

1. `open.show` imposta immediatamente `activeReaderOpen`, ma la disabilitazione della navbar dipende dal successivo render React. Un evento navbar già accodato poteva quindi cambiare pagina durante l'apertura del lettore.
2. Un'apertura dal feed accodata prima del cambio pagina poteva creare una nuova richiesta dopo che `navigate` aveva annullato quella precedente. L'annullamento da solo non protegge dagli eventi di una schermata precedente. Anche le callback native di misura mancavano di una verifica del contesto corrente.
3. Un lettore in chiusura restava modale per l'accessibilità e manteneva discendenti interattivi anche quando il ritorno era ormai riferito a un'altra pagina. L'opacità animata non esclude quella superficie dal rilevamento dei tocchi. Una chiusura incompleta o ritardata poteva pertanto lasciare una copertura invisibile.

Correzioni: guardia immediata basata sullo stato effettivo del lettore; contesto di navigazione aggiornato sincronicamente; scarto delle aperture e misurazioni superate; riapertura consentita solo nella stessa sessione e pagina; ritorni verso pagine non più attive esclusi da input e accessibilità. Il ritorno resta reversibile sulla pagina originale, senza timer di blocco o attese introdotte.

Queste correzioni eliminano condizioni di corsa riscontrabili nel codice e compatibili con parte della segnalazione. Non dimostrano che l'intero blocco osservato dipendesse soltanto da esse.

## Verifica

- TypeScript: PASS.
- Suite completa: 326 test PASS. Cinque nuove verifiche deterministiche controllano gli eventi prima del commit React, callback di misura tardive, cambio pagina, riapertura reversibile e input/accessibilità del ritorno fuori contesto. Non sono tentativi di riproduzione sul dispositivo.
- Export Android Hermes e compilazione `assembleRelease`: PASS. Firma invariata e 20/20 librerie native previste presenti nelle quattro ABI.
- Riproduzione del bug, installazione, avvio e verifica su dispositivo: NOT RUN, come richiesto.
- GitHub, packages e release: nessuna pubblicazione in questo intervento.

## APK corretto

`releases/Lume-0.2.3-icons-navigation-fix-preview.apk`, 98.212.333 byte; v0.2.3 / 25, package `app.synapse.reader`.

SHA-256: `fe4179eada1cd78724beacf454c202e2599e443eff5edc3c71d47b82af0f315f`.

[APK corretto su Google Drive](https://drive.google.com/file/d/1BiHSgNThz9ZToFIIQFjClj5R6_DYxWbT/view?usp=drivesdk). Upload completato; nome, tipo e dimensione verificati tramite metadati Drive.
