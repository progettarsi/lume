# Qualità del movimento nei salvati — 9 ottobre 2026

Release normale, non fixture: `releases/qa/saved-motion-2026-10-09/Synapse-0.1.7-saved-motion.apk`. Prima: release saved-swipe, conservata separatamente. Nessun pulsante laterale aggiuntivo; comando equivalente tramite azione accessibile **Rimuovi dai salvati** sulla riga. Label e icone hanno layout fisso: si rivela la superficie tramite spostamento, clipping e opacità. Soglia 42% della larghezza; spunta in crossfade di 150 ms. Nessuna nuova scritta alla soglia.

Il dito guida direttamente la traslazione sul lato UI. Sotto soglia/inversione/cancellazione: spring dalla posizione corrente, riprendibile. Velocità non conferma sotto soglia. Uscita 180–260 ms secondo distanza/velocità, poi transizione delle celle di 260 ms; nessuna altezza aggiornata a ogni frame. Annulla: entrata della riga 260 ms e movimento coordinato delle altre celle; se la riga visiva è ancora presente, si inverte dalla traslazione corrente. Movimento ridotto elimina queste animazioni automatiche. Persistenza e coda di scrittura del punto 11 conservate.

`verify-saved-motion.ps1`: solo con Synapse già sui salvati e i quattro titoli iniziali del Galaxy. Registra due rimozioni/undo e un gesto corto, raccoglie gfxinfo. Controlla il foreground prima/dopo ciascun input; interrompe se cambia app. `capture-saved-motion.ps1` registra solo UI, con guardia analoga. Non estrae DB o chiavi. Coordinate della QA per il Galaxy, non soglie nell'app.

Riscontri:

- `after-motion.mp4`, primi circa 7 secondi: trascinamento, conferma, Annulla, gesto corto, seconda conferma/undo. `after-undo-sheet.png`: dettaglio 2,25–2,85 s, campionato a 30 immagini/s; mostra entrata e posizioni intermedie delle righe. Non è una misura degli FPS dell'app.
- `held-near/far`: due distanze oltre soglia, stessa dimensione/impaginazione della label. `reversed`: quattro salvati dopo inversione prima del rilascio.
- `last-removed`: zero salvati, quattro rimozioni annullabili. `all-restored`: quattro titoli nello stesso ordine. `restart-restored`: persistenza dopo riavvio.
- `quick-undo.mp4`: il tap immediato cade prima che Annulla sia comparso e non viene accolto. Non prova l'inversione durante l'uscita. Successivo Annulla ripristina la riga; l'inversione è presente nel codice, non certificata fisicamente da questa registrazione.

Gfxinfo: prima 301 frame prodotti, 9 in ritardo (2,99%); dopo 451, 5 (1,11%). Mediana 5 ms in entrambi, p95 7→5 ms, p99 13→8 ms. Stesse azioni, registrazione dopo 20 s contro 12 s prima; guardie e pause introducono differenze. Campione diagnostico, non benchmark statistico né promessa di zero scatti. Conteggio dei frame prodotti, frequenza nominale del pannello e scatti sono grandezze distinte. Non ricavare FPS dal video ricampionato o dall'indicazione 120 Hz. Latenza elevata dell'input ADB non va interpretata come misura del dito umano.

TalkBack, font di sistema ingrandito e movimento ridotto controllati nel codice, non cambiando impostazioni del telefono. Lista lunga e altri dispositivi non ricertificati. I 102 test verificano contratti di contenuto/cache/rete/persistenza, non la qualità estetica. Nessun test aggiunto che ricopi proprietà di stile.
