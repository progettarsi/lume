# Profilo C02, variante A — 13 ottobre 2026

Scelta approvata nella chat: intestazione toccabile senza matita; la foto compare solo se impostata, con dissolvenza da sinistra e spostamento coordinato del titolo. Modifica nel pannello dal basso C02.

## Implementazione

- `ProfileHeader` usa il nome, oppure “Profilo”, come unico titolo. Foto 48 px, distanza 14 px; foto da X -14 a 0 e titolo da X -62 a 0 sulla stessa coordinata Reanimated, in 460 ms. Un viewport assoluto rivela solo 48 × progress px della foto, mantenendo il contenuto fotografico a dimensione fissa e libero dai glifi del titolo. Layout finale del testo costante; nessuna scala o variazione di larghezza durante l’animazione. La foto precedente resta montata durante la rimozione.
- Rimosso dalla schermata il blocco duplicato con nome, pulsante e vecchio editor integrato. Salvati, Cronologia e Impostazioni mantengono le loro righe.
- `ProfileEditorSheet` apre C02, con selettore foto di sistema, rimozione, nome facoltativo, Annulla e Salva. Il pannello segue la tastiera; il trascinamento della maniglia segue il dito e può essere invertito. Animazioni cancellabili, movimento ridotto, tema scuro, pulsanti accessibili e sfondo escluso dall’accessibilità durante l’apertura.
- `ProfileIdentitySession` conserva nome e foto come bozza locale fino a un unico aggiornamento del profilo. Annullamento e scarto preservano l’identità salvata. Le copie temporanee sono rimosse solo se non referenziate; un errore di persistenza conserva sia il profilo precedente sia la bozza per il retry. Una selezione tardiva dopo la chiusura non può pubblicare una foto.
- La persistenza usa il controller e lo schema esistenti; nessuna modifica a ranking, interessi, rete, cache, migrazioni o prototipo `synapse`.

## Verifica

- TypeScript: superato.
- Test completi: 255 superati, zero fallimenti, inclusi sei contratti nuovi su atomicità, scarto, rimozione, errore di persistenza, picker tardivo e doppio Salva.
- Export Android Hermes: `dist-profile-c02`; è un bundle Expo, non un APK installabile.
- Nessun dispositivo presente nell’elenco ADB. Restano da verificare sul telefono le animazioni, l’inversione del trascinamento, la tastiera, il selettore foto e il focus con lettore di schermo. Le prove del prototipo browser non sostituiscono queste verifiche native.

## Prova successiva sul telefono collegato

- Samsung Galaxy S23 SM-S911B riconosciuto. APK release arm64 compilato offline: `releases/Lume-0.1.13-profile-C02-A.apk`, con SHA-256 affiancato. Gli APK precedenti sono conservati.
- Installazione con aggiornamento `-r` riuscita; nessuna cancellazione dei dati dell’app. Avvio della reale applicazione `app.synapse.reader`, con Salvati e Cronologia già presenti.
- Stato iniziale: nome e foto assenti. Titolo “Profilo” senza avatar, senza matita e senza blocco di modifica duplicato.
- Apertura dal titolo e layout del pannello C02 verificati nel tema scuro. Nome, azioni e foto rimangono visibili con la tastiera. Inserita una bozza `ProvaC02`, poi scartata tramite conferma; il titolo e i conteggi originali sono conservati.
- Un trascinamento parziale della maniglia ritorna alla posizione aperta. Il selettore foto di Android si apre.
- La cattura della galleria è stata rifiutata dalla revisione automatica; nessuna galleria è stata registrata. Il helper di cattura verifica l’app in primo piano e consente solo Lume o il fixture isolato esplicitamente selezionato. L’utente ha scelto una propria foto per il test; salvataggio e rimozione verificati nella reale app, poi ripristino del profilo iniziale e rimozione dei soli file demo creati per il test.
- Foto salvata: titolo a X 242 px, contro X 68 px senza foto (174 px, equivalenti ai 62 dp previsti). Nome vuoto e conteggi iniziali ripristinati.
- Per osservare le fasi intermedie senza riaprire la galleria, usato `ProfileMotionHarness` con il vero `ProfileHeader` e asset demo nel pacchetto separato `app.synapse.reader.profilemotionqa`. Prima registrazione: 183 fotogrammi, spostamenti 0–174 px e inversione rapida a 146 ms dalla rimozione. Questa prova ha rilevato sovrapposizione intermedia fra foto e titolo; aggiunto il clipping progressivo alla produzione.
- Nuova registrazione con clipping: 202 fotogrammi decodificati, 131 posizioni intermedie, titolo da 0 a 174 px e ritorno a 0; inversione a 177 ms dalla rimozione. Ispezionati i fotogrammi intermedi: foto limitata allo spazio liberato dal testo, dimensione e impaginazione del titolo costanti. Il numero di fotogrammi decodificati non costituisce una misura di FPS o un benchmark.
- APK finale corretto reinstallato con `-r` sul telefono; prova temporanea disinstallata. Entry e file Android ripristinati byte per byte dopo le build isolate. Profili, salvati e cronologia della reale applicazione conservati.
- Eliminati i PNG e il video temporanei contenenti la foto scelta dall’utente. Conservate la geometria misurata e le sole registrazioni/fotogrammi con l’asset demo pubblico della prova isolata.
- Controllo completo finale: 257 test superati, zero fallimenti. APK finale SHA-256: `dd1820220bec39c760e02816e8e17e0a0156849dfa79055042933c8e6ea7a4b0`.
- Il focus con lettore di schermo e l’opzione di movimento ridotto del sistema non sono stati verificati sul telefono.

## Aggiornamento successivo

- Rimosso il messaggio di successo Profilo aggiornato e il callback dedicato: Salva chiude il pannello dopo la persistenza riuscita.
- Typecheck, 257 test ed export Android superati; APK reinstallato sul Galaxy S23 conservando i dati. SHA-256: 45652bbf3d47b23ff86512dc5b36bb07263758af7ef894c982e0fa7df8eb55f3.
- Segnalazione tema automatico: sistema Android confermato scuro. Sul nuovo APK, verificato Chiaro (selezionato, sfondo RGB 247/244/238) e ritorno ad Automatico (selezionato, sfondo RGB 29/27/25). Problema precedente non riprodotto dopo aggiornamento; nessuna modifica aggiuntiva alla logica del tema.

