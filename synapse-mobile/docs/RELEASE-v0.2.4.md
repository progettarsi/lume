Lume v0.2.4 aggiorna le icone e corregge il layout dell'onboarding dopo la scelta della foto profilo.

- useAnimations per navigazione Home/Profilo, salvataggio e Shuffle; Phosphor per le icone statiche, incluse tutte le categorie. Animazioni limitate alle interazioni, con rispetto dei movimenti ridotti e senza riproduzione simultanea dei controlli del Profilo.
- Si anima soltanto la destinazione nella navbar. Il doppio tap su Home anima il refresh accettato; salvataggio e rimozione seguono il comando azionato.
- Storia usa una pergamena, coerente fra barra categorie, articoli e interessi.
- Corrette condizioni di corsa fra navbar e apertura/chiusura del lettore: eventi e misurazioni superati vengono scartati; le superfici fuori contesto non intercettano i tocchi.
- Al ritorno dalla galleria il layout dell'onboarding viene ricreato sulla fase corrente, conservando nome, foto e bozza. Corretta anche la gestione della tastiera dopo il selettore. La correzione finale è stata verificata e approvata dall'utente.
- Crediti e licenze MIT di useAnimations e Phosphor inclusi in Impostazioni → Informazioni e nel repository.

**Download:** `Lume-0.2.4.apk`, APK universale per `armeabi-v7a`, `arm64-v8a`, `x86` e `x86_64`; Android 7.0 / API 24 o successivo. Checksum SHA-256 allegato.

**Aggiornamento:** versione 0.2.4, build 26, pacchetto `app.synapse.reader`, stessa firma. Installare sopra la versione precedente per mantenere i dati.

**Verifiche:** TypeScript, 331 test automatici, export Android Hermes e compilazione release. Il difetto del layout è stato riprodotto sull'emulatore Android 16 con il precedente APK e verificato nella build corretta, compresi selezione rapida, annullamento, conservazione del nome e avanzamento agli interessi. La release incrementa versione e build rispetto all'anteprima approvata. Le quattro ABI non equivalgono a un collaudo fisico su ciascuna architettura.

[useAnimations](https://useanimations.com/) e [Phosphor Icons](https://phosphoricons.com/) mantengono le rispettive licenze MIT. Testi e fonti inclusi mantengono attribuzioni e licenze; Gemini resta opzionale.
