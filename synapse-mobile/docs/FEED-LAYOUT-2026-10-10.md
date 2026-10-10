# Feed: spazio, sfumatura e gesture — 10 ottobre 2026

Richiesta dalle due schermate dell’utente: eliminare il vuoto artificiale sopra la navbar e l’annuncio del rifornimento, mantenere una sfumatura fissa, togliere il toast di salvataggio e correggere le inversioni rapide dello scroll. Successivamente autorizzate esplicitamente anche le prove sul Galaxy collegato.

## Modifiche e cause

- L’altezza delle pagine sottraeva 100 punti per il fondo e ulteriori 80 punti per il rifornimento/errori, oppure una riga per l’offline. Ora dipende solo dal viewport e dall’intestazione: gli stati non ridimensionano il feed. Offline ed errori effettivi restano sovrapposti vicino alla navbar.
- Sfumatura rimossa dalle singole schede e collocata nella schermata Home. Alpha zero 90 punti sopra il bordo superiore del dock, alpha pieno al bordo del dock e sotto. Posizione calcolata con la stessa altezza del dock e gli stessi inset; non segue la traslazione verticale delle pagine o delle categorie.
- Nessun annuncio searching/retrying quando una scheda è leggibile. Conservati stato centrale quando manca contenuto e messaggi di errore effettivo. Indicatore SVG sottile, del colore d’accento e centrato rispetto alla riga Newsreader; rotazione continua, ferma con movimento ridotto.
- Il doppio tap conserva animazione e feedback del segnalibro senza toast «Articolo salvato». Conservato l’avviso di scrittura fallita.
- Una gesture che interrompe la molla si ancora alla pagina più vicina alla posizione visibile, conservando l’offset sotto il dito. Lo scatto al rilascio usa spostamento effettivo e velocità finale; un flick invertito prevale sulla distanza precedente. La direzione delle categorie segue il movimento recente del dito. La conferma della posizione da JavaScript non interrompe una nuova gesture; le correzioni esterne del feed restano attive.

## Verifiche

TypeScript riuscito; **145/145 test**, nessun fallimento o test saltato. Tre nuovi test eseguono i gestori reali di Feed con hook/animazioni simulati: interruzione della molla, conferma JavaScript durante una nuova gesture e inversione senza oltrepassare l’origine. Contratto di paging esteso alle velocità discordanti e al feed vuoto. Questi test non misurano il rendering nativo.

Export Android e APK release riusciti. Avvisi Gradle di deprecazione già presenti. Firma verificata, certificato storico `fb5a08f89ecdedaa90c7f94ce9aa7a8b11ca6a5d74f4b0341ff611a06ee98c6a`.

Galaxy S23: aggiornamento tramite `adb install -r`, senza disinstallazione/cancellazione dati. Metadati installati **app.synapse.reader, 0.1.11/code14**. VersionName invariato; incrementato solo il codice Android.

Prove nella release installata:

- Layout durante rifornimento e articolo lungo: nessuna riga «Cerchiamo altri articoli», sfumatura direttamente sopra il dock. Screenshot iniziale, dopo aggiornamento e durante movimento conservati.
- Dodici flick alternati da 70 ms e una gesture DOWN/MOVE con quattro cambi di tratto/UP: transizioni interrompibili, nessuna apertura accidentale o blocco persistente, punto finale allineato. Video `motion.mp4` e campione di fotogrammi `motion-gestures-contact.png`. Campione limitato, nessuna promessa di FPS o assenza di ogni possibile scatto.
- Doppio tap su Ahmed III: segnalibro e animazione visibili, nessun toast bianco. Salvataggio temporaneo rimosso tramite il pulsante; stato finale non salvato.
- Disabilitazione temporanea di Wi-Fi e dati: avviso offline, stessa scheda e stessa navbar. Alberi accessibili online/offline: titolo Ahmed III `[68,705][1013,829]` e Home `[361,2145][469,2196]` identici. Connessioni ripristinate ai valori iniziali, entrambe abilitate; avviso scomparso. App lasciata su Home.

Resa verificata in tema scuro e dimensione testo corrente. Tema chiaro/font grandi/TalkBack e uso prolungato non nuovamente certificati in questa prova. Nessuna richiesta Gemini deliberata; il normale comportamento dell’app conserva le preferenze esistenti.

## Artefatto corrente

`releases/qa/feed-layout-2026-10-10/Synapse-0.1.11-feed-layout-code14.apk`, 58.169.120 byte, SHA256 **E19E96FB349B4E5FA8E64E0A5DA7BC89DF98E8CA75271A940A074CDD1A99EA1F**. Copia in `releases/Synapse-0.1.11.apk` e in Download sul Galaxy; hash remoto coincidente. La build code13 e il precedente script di consegna rete sono evidenze storiche.

Snapshot dei file prima delle modifiche, test, export, build, firma, screenshot, alberi UI e registrazione in `releases/qa/feed-layout-2026-10-10`. Nessuna modifica al prototipo browser o pubblicazione remota.
