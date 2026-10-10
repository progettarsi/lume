# Verifica ripetibile della rivelazione

`ReaderRevealHarness.tsx` monta il Reader effettivo con font e tema nativi. Non è importato dall'app di produzione, non usa rete, database, chiavi o salvataggi personali. La revisione Gemini è una fixture del formato già validato, non una richiesta al servizio.

Per ricompilare con gli strumenti già presenti: eseguire `scripts/qa/build-reader-reveal.ps1` da PowerShell. Produce `releases/qa/reader-reveal-2026-10-08/ReaderReveal-fixtures.apk` con pacchetto separato `app.synapse.reader.revealqa`; ripristina entry e configurazione Android anche in caso di errore. Durante la compilazione non eseguire export/build di produzione in parallelo. L'APK si può installare accanto a Synapse; il nome nel launcher resta Synapse, perciò avviare il pacchetto QA esatto. Il build script non installa l'APK.

- Lungo: 20 paragrafi classici. Aprire e fare subito due swipe rapidi fino a più viewport di profondità; controllare la zona raggiunta e poi tornare verso l'alto.
- Breve: una continuazione. Osservare il bordo sfumato e confrontare gli a capo durante/dopo la comparsa.
- Cache: revisione già disponibile con stato busy intenzionalmente mantenuto, per controllare che l'attesa non nasconda testo pronto.
- Arrivo: solo anteprima, classico disponibile dopo 900 ms, revisione dopo 2.200 ms. Scorrere durante l'attesa; controllare introduzione unica e testo raggiunto leggibile.
- Grande: corpo 23 invece di 20; ripetere gli swipe.
- Inversione: chiude e riapre dopo 60 ms, mantenendo la stessa istanza. Attendere prima che l'inerzia dello scroll finisca; confrontare posizione e testo. Il timer è uno stimolo di prova, non una gestione dell'input dell'app.
- Aggiorna: cambia salvataggio, data e identità dell'array senza cambiare contenuto; il reveal non deve ripartire.
- Riapri: nuova apertura completa, distinta dall'inversione.

Per movimento ridotto usare la preferenza Android rilevata da Reanimated/AccessibilityInfo (`transition_animation_scale=0`), conservando e ripristinando il valore precedente. Il solo `animator_duration_scale=0` non attiva questa preferenza. Provare sia avvio con preferenza attiva sia attivazione mentre il lettore è montato. Non lasciare le impostazioni modificate dopo la prova.

Il risultato reale di produzione è `Synapse-0.1.7-reader-reveal.apk`, pacchetto `app.synapse.reader`; contiene il normale feed, ricerca, libreria e revisione Gemini. I due APK non sono intercambiabili. Gli screenshot/video storici della prima iterazione sono descritti nel documento di avanzamento; le catture con prefisso `final-` appartengono alla versione finale.
