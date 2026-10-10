# Rete, disponibilità e riserva — 10 ottobre 2026

Implementazione, TypeScript, 142/142 test, export Android e APK release definitivi completati. Il Galaxy non è rilevato da ADB: consegna sul dispositivo non eseguita. Build pronta da provare, senza promozione della resa nativa prima del riscontro dell’utente. Nessun test sul telefono autorizzato o effettuato; verifica sul telefono affidata all’utente. Riprendere da questo documento e dai log in `releases/qa/network-reserve-2026-10-10`, senza ripetere controlli già superati sullo stesso codice.

## Diagnosi e integrità

Letto integralmente AGENTS.md e le 871 righe dell’avanzamento, oltre al documento della personalizzazione v3. Cercate le istruzioni applicabili negli antenati e nei sorgenti. Il progetto non è un repository Git: conservata la base dei sorgenti, test, configurazioni e build.gradle nella cartella `before`. Il prototipo ../synapse non è stato modificato. Personalizzazione v3, assenza di tempi di lettura, SQLite, Gemini, transizioni del lettore, dock e salvati conservati.

Percorso: Wikipedia.batch sceglie una fonte (temi, ricerca tematica, casuali, collegamenti); request scarica introduzioni e metadati; articles scarta disambiguazioni/testi insufficienti; discoveryCandidates applica selezione editoriale e deduplicazione; publish aggiunge anteprime ai feed, SQLite conserva gli articoli; reserveArticles seleziona i non consumati entro i budget; LibraryViews mantiene viste stabili; Feed visualizza la finestra corrente. L’apertura volontaria aggiorna profilo e cronologia, avanzare consuma l’identità, il semplice download non segna lettura. Cache, feed proposto, articolo visualizzato e articolo aperto restano distinti.

Cause confermate nel codice:
- Due risposte senza risultati provocavano subito il messaggio generico; il successivo caricamento manuale avanzava semi/cursori e poteva quindi trovare articoli. Il replay conserva un caso con terza risposta valida: prima messaggio prematuro, dopo recupero automatico.
- I temi di collegamento venivano scelti nuovamente dopo la fine del cursore, permettendo di tornare alla stessa fonte. Ora un cursore resta ancorato al suo tema e la fine pagina avanza al tema successivo; dopo un lotto vuoto si cambia strategia.
- Il livello HTTP ritentava alcuni errori mentre il feed contava separatamente le risposte; il Retry-After veniva limitato a cinque secondi e HTTP 503 confuso con quota. Il nuovo percorso feed usa una sola richiesta HTTP per tentativo, massimo tre in un ciclo; HTTP 503 è servizio temporaneo, 429 è limite con attesa rispettata e condivisa da Wikipedia.
- I consumati venivano esclusi da tutti i pool: riserva locale interamente consumata diventava inutilizzabile offline. Ora una selezione locale separata dalla novità riusa la stessa cache, privilegia gli inediti, alterna categorie dove disponibili e ricicla alla fine conservando la scheda corrente e cambiando ordine.
- Il refresh sostituiva la coda: ora aggiorna senza perdere la scheda corrente. Pubblicazione conteggia solo identità effettivamente aggiunte, non i duplicati.
- Mancavano disponibilità distinta per categoria, motivi di disabilitazione, ritorno annullabile e avviso persistente offline. Il messaggio generico poteva essere chiuso automaticamente dopo due secondi.

Ipotesi non dimostrate: frequenza reale di ciascuna causa, qualità o resa statistica dei filtri editoriali, latenza Wikipedia su reti mobili. Non allentati indiscriminatamente i filtri; nessuna nuova analitica esterna. Gli alias sono esclusi prima del limite editoriale, come già previsto.

## Comportamento implementato

- Rete determinata esclusivamente da expo-network. Timeout, errore Wikipedia o Gemini non impostano offline e non disabilitano categorie per rete.
- Stato per fonte: idle/loading, ricerca alternative, riprova temporanea, ready, candidati attualmente senza novità, servizio temporaneo, limite e errore non recuperabile. Testi e azioni del feed centralizzati in feedAvailability.ts. Stato centrale soltanto senza scheda utile (oppure uscita dalla categoria diventata offline); indicatori discreti durante il rifornimento mantengono il contenuto.
- Tre tentativi complessivi per ciclo, ognuno massimo una risposta/una HTTP; arresto al primo risultato utile. Vuoti/duplicati cambiano fonte senza attesa artificiale, errori temporanei attendono 750/1500 ms, errore non recuperabile si ferma subito. 429 rispetta Retry-After numerico/data; la pausa è condivisa tra categorie e richieste Wikipedia. Rivalutazione senza avviare prima una richiesta speculativa che verrebbe subito annullata dal foreground. Compatibilità verificata con il polyfill AbortSignal effettivamente incluso in React Native (nessuna dipendenza da throwIfAborted). Annullamento controllato prima della pubblicazione e dopo risposta/persistenza; cambio categoria annulla lavori precedenti.
- Riserva progressiva fino a 30 anteprime, 16 KiB/anteprima e 512 KiB/selezione, nessun database parallelo. La pulizia protegge riserva di novità e selezione locale anche consumata, articolo aperto, salvati e finestra imminente. Cache ordinaria 80/6 MiB; protetti e salvati possono superare il tetto ordinario. Testi estesi offline soltanto se già scaricati.
- Sotto 20 novità globali Per Te precede categorie e lavori preparatori; refill foreground a 12 schede dal termine. Rimangono una coda di secondo piano seriale, sei avvii/minuto e pausa di 1800 ms; ogni avvio feed può usare fino a tre HTTP, non si afferma un limite di sei HTTP/minuto. Lettore aperto conserva precedenza; nessun download indiscriminato Gemini o approfondimenti.
- Offline Per Te e raccolte locali accessibili; le altre chips attenuate, disabled anche nell’albero accessibile. Indisponibilità della categoria dopo tre risposte valide vuote è distinta dall’errore temporaneo. Rivalutazione controllata dopo cooldown di cinque minuti, riconnessione, ripresa o refresh: una categoria alla volta, prima la riserva globale. La categoria resta disabilitata durante il controllo e si riabilita soltanto al risultato utile, anche quando arriva dalla scoperta globale.
- Esaurita la coda di una categoria, avanzare dall’ultima scheda mostra icona, titolo, spiegazione specifica e Vai a Per Te. Ritorno automatico di cinque secondi solo se Per Te ha una destinazione pronta. È unico, annullabile, sospeso in background e rimosso da navigazione o arrivo di novità. Se manca la destinazione niente rimbalzi automatici: restano il comando manuale e lo stato pertinente. Movimento ridotto usa aggiornamenti di progresso più radi; nessun annuncio per ogni tick.
- Avviso in basso sopra dock/safe area, senza gesture o timeout: “📴 Sei offline” e poi “📴 Sei offline · Alcuni articoli si ripetono”. Varianti brevi per font grandi, label accessibile completa; spazio del feed riservato. Il flag di ripetizione permane nella stessa permanenza offline e scompare alla riconnessione.
- Primo avvio senza anteprime riusa il catalogo incluso. Se l’archivio non è leggibile, il catalogo resta un ripiego in memoria e non viene dichiarato persistito. Un catalogo/cache senza schede utilizzabili mostra lo stato offline e Controlla connessione.

## Verifiche e limiti

142/142 test senza fail/skip: 117 precedenti più 25 nuovi, oltre alle estensioni di SQLite e dei budget esistenti. Test di recupero/provider, hook useLibrary reale con scheduler React/storage/rete simulati, componente del countdown con clock controllato, SQLite reale locale con connessioni nuove e pulizia. Non sono prove native né certificazione visiva. Tutti i controlli di personalizzazione/cache/Gemini/lettore/salvati precedenti sono mantenuti.

Replay `node scripts/qa/compare-feed-recovery.cjs`, base Wikipedia congelata in before, stesso parser/selezione e risposte simulate. I tempi sono virtuali (20 ms per HTTP più backoff del coordinatore), non tempi di rete misurati. Il tempo totale del caso limitato precedente è omesso perché include un’attesa interna reale non rappresentata dal clock virtuale.

| Scenario | Prima: HTTP / esito | Dopo: HTTP / esito | Primo utile virtuale prima → dopo |
|---|---|---|---|
| Prima risposta utile | 2 / utile (2 articoli) | 1 / utile (1 articolo; refill separato) | 20 → 20 ms |
| Vuoto, poi valido | 2 / utile | 2 / utile | 40 → 40 ms |
| Due duplicati, poi valido | 2 / nessuna novità prematura | 3 / utile | assente → 60 ms |
| Due vuoti, poi valido | 2 / nessuna novità prematura | 3 / utile | assente → 60 ms |
| Errore temporaneo, poi valido | 1 / errore | 2 / utile | assente → 790 ms |
| 429, Retry-After 120 s | 3 / nessuna novità dopo attesa ridotta | 1 / limite, attesa preservata | assente |
| Solo vuoti | 2 / nessuna novità | 3 / nessuna novità attuale | assente |

Il nuovo ciclo costa una richiesta in più se tutte le risposte sono vuote; nel caso subito utile restituisce meno articoli nel singolo ciclo, compensati dal refill progressivo. I due casi prematuri vengono recuperati. Nessun miglioramento statistico generale dedotto da questi sette esempi.

Prossimo passo: verificare export e APK/firma/integrità, consegnare con il collegamento ADB e installazione di aggiornamento esistenti, senza avviare l’app o effettuare prove/screenshot/benchmark sul Galaxy. Registrare percorsi, versione/code, hash e risultato consegna qui sotto. Verifica sul telefono affidata all’utente.

## Artefatto definitivo e consegna

- APK: releases/qa/network-reserve-2026-10-10/Synapse-0.1.11-network-reserve-code13.apk, 58167404 byte. Copia del flusso esistente anche in releases/Synapse-0.1.11.apk.
- VersionName 0.1.11 invariato; versionCode 13, applicationId app.synapse.reader. Firma v2 verificata, certificato SHA256 fb5a08f89ecdedaa90c7f94ce9aa7a8b11ca6a5d74f4b0341ff611a06ee98c6a, coincidente con la firma storica.
- APK SHA256 **E3BB922C80A2D21D71D3C39F1D54B8A8E7AF953E4AB9D36024F5577113A14C8A**. 1145 voci ZIP lette/decompresse, bundle Hermes presente (3021864 byte); metadati aapt: minSdk24/target36, ARM64/x86_64, nessun flag debuggable.
- Export definitivo index-1774c60b3eae2ef84662fa63a4874b01.hbc; APK e export sono artefatti distinti, nessuna equivalenza byte per byte affermata.
- Typecheck e 142/142 test finali senza fail/skip/cancellazioni; build-delivery.log ed export-delivery.log riusciti. Le build precedenti in build/build-final ed export-final precedono le ultime correzioni: non sono gli artefatti di consegna. Avvisi Gradle di deprecazione e CMake sui percorsi Windows persistono, senza errore di build.
- Unica richiesta reale dal computer: quattro articoli utili in 427 ms (real-network-probe.json). Nessuna richiesta Gemini, statistica generale o prova su rete mobile dedotta.
- ADB: elenco dispositivi vuoto (delivery-devices.txt). Nessun trasferimento/installazione, avvio app, prova automatica/esplorativa, screenshot, registrazione o benchmark sul telefono. Dati e impostazioni del Galaxy non toccati. **Verifica sul telefono affidata all’utente**; resa visiva, gesture, font/TalkBack e fluidità nativa non certificati in questo intervento.
- Fonte precedente conservata: 76 file, 65 identici e 11 modificati, oltre alle aggiunte. Reader/Reveal/Exit, dock, salvati, personalizzazione, storage e AGENTS identici; report source-integrity.json.

Prossimo passo: collegare il Galaxy e consegnare l’APK verificato con scripts/deliver-network-build.ps1 (hash verificato, push in Download e install -r, senza disinstallare, avviare o provare l’app). Lo script è predisposto ma non eseguito; revisione sintattica PowerShell eseguita. Quindi raccogliere il riscontro manuale dell’utente. Nessuna pubblicazione/store/push del codice.

## Checklist manuale (utente)

1. Online: scorrere Per Te durante il rifornimento e aggiornare con doppio Home; scheda corrente conservata.
2. Attivare modalità aereo su Per Te: anteprime leggibili, avviso fisso e categorie attenuate; Salvati ancora accessibili.
3. Riavviare offline e scorrere fino alle ripetizioni: avviso aggiornato e nessuna ripetizione immediata quando esistono alternative.
4. Perdere la connessione dentro una categoria: spiegazione offline, ritorno pronto a Per Te dopo circa cinque secondi.
5. Ripetere il caso precedente e premere Annulla o Vai a Per Te; nessun secondo ritorno automatico.
6. Mettere in background durante il conto alla rovescia e riaprire: tempo residuo sospeso; nuova navigazione cancella il ritorno precedente.
7. Riconnettere: avviso rimosso, categorie solo offline riabilitate e rifornimento ripreso; una categoria senza novità resta distinta dal servizio in errore.
8. Tema chiaro/scuro, font grande, movimento ridotto e TalkBack: avviso sopra dock, messaggi leggibili, stato disabled delle categorie e nessun annuncio continuo del countdown.

### Consegna sul Galaxy S23 — 10 ottobre 2026

Dopo il collegamento del telefono richiesto dall’utente, eseguito scripts/deliver-network-build.ps1: hash locale verificato, APK copiato in /sdcard/Download/Synapse-0.1.11-network-reserve-code13.apk, SHA256 remoto coincidente e installazione con adb install -r conclusa con Success. Aggiornamento della stessa applicazione/firma, senza disinstallazione o cancellazione dei dati. Metadati del pacchetto installato confermano app.synapse.reader, versionName 0.1.11 e versionCode 13.

La precedente indicazione di telefono assente descrive il tentativo iniziale ed è superata dalla consegna riuscita. Evidenze: releases/qa/network-reserve-2026-10-10/delivery-install.log e installed-package.txt. App non avviata; nessuna prova, screenshot, registrazione o benchmark sul dispositivo. **Verifica sul telefono affidata all’utente**.
