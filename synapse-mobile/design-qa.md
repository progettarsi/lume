# Dock e messaggi — QA del 9 ottobre 2026

final result: passed

Ambito del risultato: confronto visivo e interazioni RN Web dei componenti reali. Non equivale alla verifica del rendering o della fluidità Android. Galaxy non collegato; prova fisica, tastiera Android e misure dei frame **non eseguibili** in questa esecuzione.

Aggiornamento nella sessione successiva, telefono collegato: risultato **passed limitato alla correzione dei margini della dock**, misurati sul Galaxy 28/28/28 px in Home e Profilo. Tavola `releases/qa/dock-insets-2026-10-09/reference-native-comparison.png` ispezionata con originale e stati reali; `measured-insets.json` conserva le misure. L'esito iniziale non certificava questa spaziatura e viene corretto dal riscontro dell'utente. **QA generale Android aperta:** osservato fondo chiaro con testo chiaro e contrasto insufficiente, e campione precedente con 12 frame in ritardo su 69. Cause non determinate; non attribuite al nuovo inset. Vedere intervento 13. Gli export web/harness dell'intervento 12 restano artefatti della versione precedente.

## Riferimento e confronto

Ispezionata l'immagine originale `C:/Users/Augusto/Downloads/Mobile Devices/dock.jpg`. Tavola condivisa riferimento/implementazione: `releases/qa/dock-messages-2026-10-09/reference-comparison.png`, aperta e visionata prima di questo rapporto. Schermate complete `web-home-final.png`, `web-profile-final.png`, `qa-dark-large-final.png`; crop in tavola conserva l'intera dock. Viewport mobile 384×832, prova stretta 320×740 e vista desktop 1280×720. Il riferimento è una tavola di cinque stati: confronto delle proporzioni della capsula/pillola, non uguaglianza delle dimensioni dell'intera immagine.

Adattamenti richiesti: palette Synapse, Source Sans 3 e Newsreader, soltanto Home/Profilo, Cerca separato e invariato. Nessuna destinazione aggiunta. La larghezza segue le due label effettive: nessuno spazio delle cinque voci fittizie.

## Superfici verificate

| Area | Riscontro |
|---|---|
| Tipografia | Source Sans 3 semibold nella pillola; label interamente impaginate a larghezza misurata. Home/Profilo leggibili a 1× e 1,5×, senza scala animata. Newsreader delle pagine conservato. |
| Spazi e forma | Capsula 60, pillola 40 centrata; margini interni coerenti, label accanto all'icona, selezionata allargata e inattiva compatta. Target minimo 48; a 320 px/font 1,5 rilevati target 111×52 e 59×52. |
| Colori | Token paper/surface/active/ink/muted esistenti; scuro e chiaro leggibili. Errori identificati anche da icona, titolo e riprova. |
| Icone e immagini | Material Community Icons coerenti per dock e stati. Nessuna immagine decorativa necessaria. Cerca 56 e icona 27 conservati. |
| Copy | Caricamento distingue anteprima da approfondimento; Gemini mantiene originale; offline distingue testo non scaricato; rete/AI/testo insufficiente hanno azione pertinente. Nessun punteggio di difficoltà aggiunto in Home. |
| Stati | Loading/revising/offline/network/AI/content ispezionati. Azioni simulate contate 0→3. Movimento ridotto elimina entrata/spinner e movimento della dock/Cerca/azioni. |
| Interazione | 12 tocchi alternati senza attendere la stabilità, ultimo Profilo selezionato, sia harness sia app normale. Ricerca reale “fiume”: risultati, apertura Fiume, ritorno con query conservata, cancellazione e chiusura verso Profilo. |

## Correzioni emerse nel confronto

P2 tipografia: prima “Ho…” e “Prof…” (`web-profile.png`). Il misuratore invisibile aveva un vincolo non valido; poi il report arrotondato di RN Web perdeva la frazione di avanzamento del glifo. Misurazione in flusso a larghezza nota e limite superiore `ceil(width)+1` risolvono il taglio, senza offset dipendente dal telefono. Nuovo confronto mostra label complete.

P2 accessibilità: aggiunto `aria-selected` oltre allo stato nativo, verificato false/true nel browser. Target delle celle interpolati nel dominio 0–1, evitando che il piccolo overshoot della pillola riduca gli hit target. Nessuna coda di animazioni o blocco temporale nel codice.

La prima revisione ha mancato un P2 di spaziatura successivamente indicato dall'utente: margine laterale della pillola 4 dp invece dei 10 verticali. Corretto nell'intervento 13: inset comune derivato da `(altezzaCapsula-altezzaPillola)/2`, larghezza utile e celle ricalcolate con entrambi gli inset. Nessun offset dipendente dallo schermo. I nuovi riscontri Android sono in `releases/qa/dock-insets-2026-10-09`; la vecchia tavola resta la testimonianza della versione precedente, non lo stato corretto.

Le acquisizioni automatiche ritagliate `motion-*.png`/`motion-contact.png` presentano viewport incoerenti in alcuni frame: **non sono una prova affidabile degli intermedi o degli scatti**. Conservate come diagnostica del limite di acquisizione, escluse dal verdetto sul movimento. La continuità e l'interruzione sono implementate lato UI, ma qualità fisica e rimbalzo richiedono il protocollo Android.

## Limiti e console

Harness finale senza errori console. In anteprima dev normale restano due avvisi DOM preesistenti sulle proprietà native dell'SVG ShuffleButton; geometria e SVG non modificati. Il refresh dev è fallito durante le sostituzioni temporanee dell'entry; la ricerca è stata verificata sull'export statico normale, entry ripristinata. Nessun errore di build finale.

Prova Android pendente: frame prodotti/in ritardo, dito reale, IME, TalkBack, font sistema, cambio movimento ridotto durante l'animazione e regres­sioni fisiche salvati/shuffle. Né i fotogrammi del browser né “120 Hz” certificano fluidità. Non cambiata alcuna impostazione del Galaxy.

## Aggiornamento nativo — prestazioni, 9 ottobre 2026

Il pass web precedente non copriva un difetto riprodotto sul Galaxy: testo del tema scuro su carta chiara. Risolto nella 0.1.8 usando la palette corrente per l'intera scena e mantenendo la dissolvenza della cattura precedente. Screenshot iniziale e finale in `releases/qa/performance-2026-10-09`; carta finale RGB 29/27/25, leggibilità ripristinata, margini dock 28 px sopra/sotto/lato esterno in entrambi gli stati.

Release finale installata: verificati rapidi Home/Profilo, ricerca/IME, lettore lungo con font dell'app grande, scroll e inversione, shuffle, gesto dei salvati e Annulla, cronologia fino al fondo e riavvio. Video/intermedi di lettore e salvati visionati. Testo non cresce durante lo swipe; originale aspetto delle righe e ritorni conservati. Le acquisizioni native sono a viewport coerente, ma le tavole campionate e l'input ADB non certificano un gesto manuale flawless. Nessuna modifica a font di sistema, TalkBack o movimento ridotto.

Il conteggio senza registrazione è riportato nel dossier `PERFORMANCE.md`: nell’iterazione conservata 742 frame/14 ritardi in navigazione con testo medio e 598/24 nel lettore con testo grande. Nell’APK conclusivo 777/9 in navigazione; ricerca, lettore, ritorno, Home, lista dei tre salvati e riavvio ricontrollati dopo lo sblocco del Galaxy. Non è un pass di zero scatti e non si ricava FPS da 120 Hz. Il tema riprodotto è risolto; restano i limiti delle misure e le prove fisiche non eseguite dichiarate nel dossier. Il quadro nativo aggiorna la voce precedente “Prova Android pendente”, senza estendere i risultati a stati non provati.
