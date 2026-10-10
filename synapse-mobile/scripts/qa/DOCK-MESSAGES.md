# Dock e messaggi: replay e prova Android

Build isolata: `scripts/qa/build-dock.ps1`, usa toolchain/firma esistenti; sostituisce temporaneamente entry e applicationId e ripristina i byte originali in finally. Nessuna dipendenza installata. Chiave della firma letta dalla configurazione locale, non inclusa nei log.

Artefatti in `releases/qa/dock-messages-2026-10-09`:

- `Synapse-0.1.7-personalization-dock.apk`: app normale con entrambi gli interventi, stesso identificativo/versionCode e firma precedenti. Aggiornare senza disinstallare o cancellare dati.
- `Dock-fixtures.apk`: pacchetto separato `app.synapse.reader.dockqa`, soli componenti reali e dati simulati. Nessuna Wikipedia/Gemini, chiave, cronologia o raccolta personale. Pulsanti tema/font 1–1,5/movimento/stato **solo nella QA**, non nelle impostazioni normali.
- `web-fixtures` e `web-app`: export web locale, rispettivamente harness e app normale. Preview 127.0.0.1:8085 e :8086 finché i server della sessione restano attivi. Non sono una build Android.
- `apk-integrity.json`, log test/export/build/firma e `reference-comparison.png`. Rapporto nel `design-qa.md` della radice.

## Protocollo sul Galaxy (non ancora eseguito)

1. App normale: Home→Profilo→Home, poi 12 tocchi alternati durante il movimento; verificare ultima destinazione, label stabili e rimbalzo contenuto. Registrare intermedi, non solo endpoint.
2. Cerca invariato: tastiera aperta/chiusa, query “fiume”, aprire risultato, scroll profondo, chiudere/invertire/riaprire; query e destinazione corrette. Shuffle con tastiera aperta e chiusa: verificare ricongiungimento al cerchio reale. Non disinstallare l'app o alterare salvati per provare.
3. Harness isolato: tema chiaro/scuro, font 1/1,5, movimento normale/ridotto, Home/Profilo, tutti i sei stati. Confermare leggibilità, target pratici e azioni (il contatore è simulato). Ridotto: nessuno spinner/entrata/scala dei pulsanti nuovi.
4. App normale: salvati, swipe invertito, annulla, ritorno del lettore; cronologia; testo classico/Gemini/offline. Non consumare quota per la sola QA visiva.
5. Misurare separatamente frequenza display, frame prodotti e frame in ritardo (gfxinfo campione azioni e durata dichiarati). Video e contact sheet servono all'ispezione, non danno FPS affidabili. Verificare col dito, non soltanto input ADB.

Risultato corrente: TypeScript, 116 test, export Android, build/firma entrambi gli APK superati. Browser: confronto reference, tocchi rapidi, font e messaggi simulati, ricerca reale e ritorno superati. Dispositivo assente: nessuna installazione/prova fisica, né modifica alle sue configurazioni.
