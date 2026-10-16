# Piano delle icone per sezioni funzionali

Inventario del codice Lume v0.2.3 e del catalogo ufficiale useAnimations (300 icone), verificato il 16 ottobre 2026. Questa è una valutazione di copertura, non un'integrazione o una verifica nativa degli asset.

Fonti: [catalogo JSON](https://useanimations.com/icons.json), [catalogo visuale](https://useanimations.com/icons), [Lottie e React Native](https://useanimations.com/lottie-icons), [licenza MIT](https://useanimations.com/licencing-and-terms).

## Regola di assegnazione

Le sezioni sono funzionali e possono attraversare più schermate. La stessa categoria mantiene l'icona Phosphor in barra, articolo e selezione interessi. I controlli Salva effettivamente animati mantengono useAnimations nei contesti interattivi; le rappresentazioni statiche di Salvati, per esempio nel menu Profilo, usano Phosphor. I controlli di navigazione restano nella sezione navigazione anche quando compaiono in Impostazioni.

La copertura richiede un equivalente semantico adatto, non la sola somiglianza del nome. Non si aggiungono icone dove oggi ci sono soltanto etichette. Switch nativi, foto profilo, logo Lume e forme decorative originali non sono pittogrammi da sostituire con un pacchetto di icone.

La disponibilità di un asset animato non determina la famiglia grafica da usare. La regola aggiornata dall'utente è: **useAnimations soltanto dove il movimento è utile e previsto; Phosphor per tutte le icone che devono restare statiche**, anche quando useAnimations offre un equivalente. Non usare esportazioni statiche useAnimations per menu, righe, frecce o altre icone prive di una funzione animata. I gruppi con copertura incompleta continuano a usare Phosphor.

## Dosaggio del movimento

Nessuna riproduzione automatica quando si apre una schermata, compare una riga, si scorre un elenco, cambia il tema o si torna dall'app in background. Nessuna sequenza collettiva o a cascata. Il movimento deve confermare un'azione o un cambiamento di stato utile, senza ritardare l'azione.

| Contesto | Politica iniziale |
|---|---|
| Home e Profilo nella dock | Conservare il comportamento approvato: una sola riproduzione sull'icona della destinazione; l'icona uscente si ferma |
| Doppio tap Home | Una riproduzione quando parte il refresh, senza loop legato alla durata della rete |
| Salva/rimuovi articolo | Transizione breve solo sul controllo azionato e nel verso coerente con lo stato; non animare tutte le copie dello stesso segnalibro |
| Articolo casuale | Una riproduzione sul comando Shuffle; il caricamento resta distinto dall'animazione dell'icona |
| Menu Profilo | Phosphor statico per Salvati, Cronologia, Impostazioni e apertura righe; nessuna animazione aggiuntiva sulle righe prima di navigare |
| Ricerca, frecce, chevron, X e collegamenti esterni | Phosphor statico nella prima integrazione; mostrare direttamente il simbolo corretto per lo stato, senza introdurre trasformazioni decorative |
| Identità, modifica profilo e controlli onboarding | Phosphor statico nella prima integrazione, oltre alle transizioni di schermata già presenti; niente riproduzione di gruppo |
| Categorie, Impostazioni/Gemini e messaggi tecnici | Phosphor statico secondo la mappatura per sezioni |

Le icone statiche devono usare vettori Phosphor, non frame useAnimations né player Lottie montati e lasciati in pausa per ogni riga. Caricare soltanto gli asset animati selezionati; riusare dati e colori già preparati, senza istanziare tutti i player all'apertura del Profilo. I pochi controlli con animazione mantengono il proprio disegno useAnimations anche a riposo e con movimenti ridotti: non cambiare famiglia fra pressione e riposo, perché produrrebbe un salto visivo. Questo stato di riposo non estende l'uso di useAnimations alle icone destinate a restare statiche.

Liste e copie non azionate aggiornano subito il proprio stato statico. Eventi rapidi interrompono o sostituiscono la riproduzione pertinente, senza code di animazioni o timer che blocchino input e navigazione. Con movimenti ridotti si raggiunge direttamente lo stato finale; quando il controllo è coperto o l'app non è attiva, la riproduzione si ferma. Gli indicatori di caricamento esistenti continuano a rappresentare solo un'attività effettiva: non si aggiungono loop decorativi.

## Copertura del catalogo useAnimations, non assegnazione finale

La tabella seguente documenta soltanto gli asset disponibili. La politica di dosaggio sopra prevale: navigazione secondaria, ricerca, menu Profilo, identità e onboarding useranno Phosphor statico pur avendo copertura nel catalogo. Le icone useAnimations previste nella prima integrazione sono Home, Profilo nella dock, i controlli Salva animati e Shuffle.

| Sezione | Elementi attuali | Asset proposti | Contesti |
|---|---|---|---|
| Navigazione principale | Home, Profilo, Cerca | `home`, `user`, `search-to-x` nello stato lente | Dock |
| Navigazione e chiusure | Indietro, avanti, apertura righe, espansione/riduzione, chiusura, link esterno | `arrow-left`, `arrow-right`, `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`, `plus-to-x` nello stato X, `external-link` | Header, lettore, raccolte, pannelli, righe, avvisi |
| Ricerca e articolo casuale | Lente, cancella ricerca, ritorno, shuffle | `search-to-x`, `plus-to-x` nello stato X, `arrow-left`, `shuffle` | Dock, SearchComposer, ShuffleButton |
| Menu del profilo | Salvati, Cronologia, Impostazioni, apertura riga | `bookmark`, `clock`, `settings-v2`, `chevron-right` | Menu Profilo; Clock è un equivalente funzionale di Cronologia, non lo stesso disegno con freccia circolare |
| Salvataggi | Segnalibro vuoto/pieno, conferma doppio tap, rimozione con swipe e conferma | `bookmark` avanti/indietro, `check` | Feed, lettore, raccolta salvati, tutorial; la rimozione è lo stato spento del segnalibro, non un nuovo simbolo inventato |
| Identità e modifica profilo | Aggiungi foto/profilo, chiusura | `user-plus`, `plus-to-x` nello stato X | Editor profilo e stato di errore/recupero onboarding; le foto e il picker di sistema restano foto e controlli di sistema |
| Controlli del tutorial/onboarding | Avanti, aggiunta profilo, Feed, Categorie generiche, Salvati, bussola di preparazione | `arrow-right`, `user-plus`, `explore`, `layers`, `bookmark` | Controlli di onboarding; le categorie specifiche dei chip appartengono alla sezione categorie e usano Phosphor |

`explore` è effettivamente una bussola: lo SVG ufficiale usa il disegno Feather Compass. `settings-v2` usa i cursori/slider. `bookmark` contiene sia il contorno sia il riempimento animato, quindi può rappresentare i due stati persistenti del salvataggio. I file `search-to-x` e `plus-to-x` hanno stati lente/X e più/X: un pulsante Chiudi deve partire già dalla X, senza mostrare il simbolo più o una lente durante il montaggio.

## Sezioni da assegnare interamente a Phosphor statico

| Sezione | Perché useAnimations non copre tutto | Perimetro coerente |
|---|---|---|
| Categorie editoriali | Mancano equivalenti specifici per più categorie, fra cui provetta/Scienza, cervello/Psicologia, foglia/Natura e DNA/Biologia | Tutte le 22 categorie, in barra superiore, badge articoli e chip interessi; non usare useAnimations neppure per Musica, Cinema o Geografia pur essendo disponibili |
| Impostazioni e integrazione Gemini | Mancano il simbolo dedicato alla revisione/AI attuale e un equivalente diretto adatto; non sostituirlo arbitrariamente con un fulmine o una CPU | Icone semantiche di Impostazioni, Gemini e indicazione di revisione nel lettore; informazioni e stato della configurazione usano la stessa famiglia |
| Messaggi tecnici e stato degli articoli | Il gruppo condiviso include revisione/Gemini, connessione, caricamento, errori e disponibilità: alcuni simboli hanno sostituti, ma il gruppo completo non ha equivalenti diretti | Pittogrammi di FeedStatus, StatusMessage, ReaderNotice e revisione del lettore; info, avvisi, rete, attesa e riprova non vanno migrati individualmente solo perché disponibili |

Conferma editoriale/controlli automatici (`check-decagram` nel feed): assegnare al gruppo messaggi e stato del contenuto, quindi Phosphor statico, non al gruppo azioni Salva.

## Verifiche richieste prima dell'integrazione

- Tutti gli asset useAnimations proposti risultano `requiresFullPlayer: false` nel catalogo. Evitare `error` e `twitter`, che dipendono da espressioni non eseguite dai player nativi; usare le icone Alert per eventuali necessità future.
- Provare dimensioni reali 17–32 dp, frame di riposo, colore nei due temi, animazione inversa e interruzioni. La disponibilità dei file non dimostra ancora il risultato su Android.
- Trasformare i trigger hover del catalogo in eventi nativi pertinenti; le animazioni non devono avviarsi continuamente al montaggio. Conservare il comportamento approvato di Home/Profilo e del doppio tap.
- Riduzione movimento: stato finale corretto dei controlli animati, compreso il segnalibro pieno, senza cambiare famiglia grafica. Le chiusure statiche usano Phosphor. Conservare accessibilità e aree di tocco esistenti.
- Usare Phosphor in uno stile a contorno vicino a useAnimations, con peso ottico verificato: la variante Fill scelta per una famiglia interamente Solid non è automaticamente la scelta migliore in questo abbinamento.

## Integrazione in anteprima

Implementata localmente il 16 ottobre 2026, in attesa della prova APK e dell’approvazione dell’utente. Nessuna pubblicazione GitHub prevista prima dell’approvazione.

- Quattro asset useAnimations locali: `home`, `user`, `bookmark`, `shuffle`. Home riproduce avanti e indietro per tornare al disegno di riposo. Il segnalibro riproduce in avanti/inverso secondo l’intento locale.
- A riposo: SVG derivati dagli stessi endpoint, senza istanze Lottie. Si monta un player nativo solo durante una riproduzione, con cancellazione alla copertura, background o riduzione movimento. Nessuna nuova dipendenza runtime.
- Phosphor Core 2.1.1, soli tracciati selezionati, stile Regular e bookmark Fill per conferma statica. Gli alias condivisi conservano la corrispondenza fra categorie, badge e interessi.
- Licenze MIT complete incluse nei sorgenti e nell’APK, consultabili in Impostazioni → Informazioni.
- Verifica visiva e fluidità Android demandate alla prova dell’APK: controlli automatici ed export non equivalgono a una verifica su dispositivo.
