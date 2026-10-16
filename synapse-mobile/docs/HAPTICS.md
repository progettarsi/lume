# Feedback aptico — prova 0.2.4b, 17 ottobre 2026

APK richiesto: `lume-haptic-0.2.4b.apk`. La versione Android resta 0.2.4/code26: il suffisso identifica la seconda build di prova, senza pubblicare una nuova release.

## Interazioni

- Pulsanti condivisi: un impulso breve al click accettato, compresi ricerca, shuffle, ritorni e azioni delle schermate. Nessun impulso per pulsanti disabilitati. Il segnale indica il tocco, non il successo di una scrittura o richiesta.
- Switch on/off: segnali nativi distinti dove disponibili; selezioni tema e dimensione del testo: tick al cambio effettivo. Toccare nuovamente la scelta attuale resta silenzioso. Lo switch decorativo interno non riceve il tocco, evitando il raddoppio del feedback nativo.
- Categorie e Home/Profilo: tick sul cambio effettivo; nessun impulso per una categoria disabilitata o una navigazione respinta. Il doppio tocco su Home segnala l'avvio del refresh, non una promessa di contenuti nuovi.
- Profilo: impulso all'apertura dell'editor e delle raccolte/impostazioni. Righe di navigazione, informazioni sulle icone e sezioni espandibili Gemini rispondono al click.
- Articoli: impulso all'apertura accettata, dopo le protezioni contro tocchi e misure obsoleti. Shuffle risponde già al suo pulsante, senza duplicare l'impulso quando arriva l'articolo.
- Salvataggi, rimozione e Annulla: conferma dopo scrittura riuscita; il doppio tocco su un articolo già salvato resta silenzioso. Editor nome/foto: conferma dopo salvataggio, senza aggiungere un secondo impulso al relativo pulsante Salva.
- Swipe nei salvati: tick al primo superamento della soglia del 42%, una sola volta per gesto anche attraversandola più volte. Tornare indietro resta possibile; il tick indica la soglia, non il successo della rimozione.

Scroll e paginazione del feed, digitazione, download, aggiornamenti di sistema e operazioni fallite non producono segnali aggiuntivi. Messaggi, selezioni visive, animazioni e comandi accessibili restano disponibili: nessuna informazione dipende soltanto dall'aptica.

## Microimpulsi durante il testo

La frontiera visiva di `ReaderReveal` genera microimpulsi mentre rivela testo nuovo visibile durante l'apertura. Nessuna modifica a contenuto, a capo, geometria o durata delle animazioni. Non viene simulata una vibrazione per ciascuna lettera: il ritmo segue l'animazione reale con un massimo di circa 14 impulsi al secondo.

Nessun timer o sequenza aptica in coda. Gli impulsi cessano alla fine della rivelazione, alla chiusura/smontaggio, allo scroll manuale, in background, con movimento ridotto o aptica disabilitata. La finestra iniziale scade dopo 2,6 secondi: un'edizione arrivata più tardi non avvia vibrazioni automatiche. Un testo completamente rivelato non riavvia il segnale su un'edizione successiva o un cambio di impaginazione.

Su Android 14/API34 e successivi viene usato `Segment_Frequent_Tick`, progettato per risultare molto leggero. Il sistema può renderlo silenzioso se l'hardware non supporta un effetto abbastanza delicato. Le versioni precedenti e iOS/web non ricevono la sequenza continua; restano i normali feedback compatibili.

## Preferenze e compatibilità

Impostazioni → Interazioni → Feedback aptico controlla tutti i segnali, anche quelli del testo. Preferenza persistente, attiva per default, con migrazione delle preferenze precedenti. Disattivarla interrompe subito il feedback; riattivarla non recupera eventi passati. Il movimento ridotto disabilita la sequenza del testo, mantenendo i normali segnali di interazione.

Gestione condivisa in `src/haptics.ts`, filtri testabili in `src/content/hapticFeedback.ts` e `src/content/revealHaptics.ts`. Riusa expo-haptics ~57.0.3, senza nuove dipendenze o modifiche native. Android usa `View.performHapticFeedback` tramite Expo, rispettando le preferenze aptiche del sistema, senza waveform/Vibrator o nuove richieste di permesso. Effetti on/off e selezioni specifici da API34, conferma e avvio gesto da API30; sulle versioni precedenti usa Context_Click. Errori/API assenti non bloccano l'interazione.

Intervalli minimi senza accodamento: 120 ms per tocchi/selezioni, 250 ms per conferme/rimozioni/soglia, 70 ms per microimpulsi. I tocchi intenzionali hanno precedenza sul testo. Le conferme di scrittura obsolete, superate o oltre 1,5 secondi sono omesse. Nessuna attesa aptica ritarda le interazioni.

Fonti: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/), [Android: feedback sugli eventi](https://developer.android.com/develop/ui/views/haptics/haptic-feedback).

## Verifica della build b

- TypeScript: PASS.
- Test automatici: PASS, 344/344, inclusi contratti feed/rete/cache, selezioni/on-off, navigazione obsoleta, preferenze, rollback, mapping Android e microimpulsi con arresto su scroll/chiusura/smontaggio/scadenza/movimento ridotto.
- Esportazione Android/Hermes: PASS.
- Build APK universale: PASS, quattro ABI (arm64-v8a, armeabi-v7a, x86, x86_64), package app.synapse.reader, minSdk24/targetSdk36. Firma v2: PASS, identica alla prima build installata.
- APK: `releases/qa/haptics-2026-10-17/lume-haptic-0.2.4b.apk`, 98.222.345 byte; SHA-256 `915bf2999b2eee5a2b3279db903963f08ed6c54fa2fbdb5d250a1668397f6af8`.
- Caricamento Drive: PASS, [lume-haptic-0.2.4b.apk](https://drive.google.com/file/d/1c9BLbHzjFfdJ9qtoIMmd1blhSHRLHCPP/view?usp=drivesdk). Nome, tipo APK e dimensione confermati con metadati e lettura del file grezzo dal connettore; SHA-256 sopra calcolato localmente, il connettore non espone il digest remoto.
- Installazione build b sul Galaxy S23 SM-S911B: PASS, autorizzata come aggiornamento con install -r, senza disinstallazione o cancellazione dati. SHA-256 del file installato identico al file locale (915bf2999b2eee5a2b3279db903963f08ed6c54fa2fbdb5d250a1668397f6af8); versione 0.2.4/code26 e firstInstallTime invariato. Avvio e prova fisica della sensazione aptica: NOT RUN, affidati all'utente.
- Build b accettata per Git dopo la consegna sul telefono. Commit e push autorizzati sul branch di lavoro; release pubblicata invariata. Nessuna ulteriore prova fisica autonoma eseguita.

## Prova manuale

1. Cambiare on/off, tema e dimensione del testo; ripetere la scelta attuale e provare un controllo disabilitato.
2. Provare categorie, Home/Profilo, ricerca, shuffle, raccolte del profilo, editor e Gemini; aggiornare Home con doppio tocco.
3. Aprire un articolo con approfondimento disponibile: percepire il ritmo leggero durante il testo visibile. Chiudere rapidamente, scorrere o passare in background e verificare l'arresto. Riprovare con movimento ridotto e con feedback tattile Android disabilitato.
4. Salvare, rimuovere con swipe invertito più volte e usare Annulla. Disattivare l'aptica nell'app, riavviare e riprovare tutte le interazioni.

La prima build aptica è stata installata con autorizzazione sul Galaxy S23, da 0.2.3/code25 a 0.2.4/code26, senza disinstallazione o cancellazione dati. Questa evidenza non costituisce prova fisica della nuova build b.
