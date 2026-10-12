# Revisione guidata del tutorial — 11 ottobre 2026

La revisione grafica con l’utente è in corso, una schermata alla volta. Queste
modifiche sono nel workspace e nell’APK di prova con application ID separato;
l’APK principale 0.1.13 consegnato precedentemente non è stato sostituito.

## Comportamento corrente

- Titolo e istruzioni restano fermi in alto, con meno spazio prima dell’esempio.
  La prima istruzione invita a toccare l’articolo e a scorrere il feed.
- L’esempio è contenuto in un rettangolo stondato, leggermente sollevato e
  distinto dallo sfondo attraverso la palette del tema. Nessuna linea separa
  l’intestazione dall’esempio e non compare ancora l’intestazione Home.
- Il tutorial riutilizza direttamente `Feed`, lo stesso componente della Home,
  con quattro articoli locali. Ogni pagina occupa l’intero spazio del riquadro:
  a riposo è visibile un solo articolo. Lo swipe usa le stesse soglie e la stessa
  molla della Home, può essere interrotto e invertito e non viene bloccato da
  temporizzatori o scritture. È rimossa la lista ad altezza naturale che rendeva
  visibile l’articolo successivo a riposo.
- La sfumatura superiore è quella interna a `Feed`: segue il movimento e si
  azzera quando l’articolo è fermo. La sfumatura inferiore è `FeedBottomFade`,
  estratta dalla Home e riutilizzata in entrambe le viste. Entrambe usano il
  colore del proprio sfondo, quindi nel tutorial si fondono con il riquadro.
  Le sfumature non intercettano tocchi né diventano elementi accessibili.
- Il contesto delle istruzioni segue la pagina scelta dal feed. Il testo completo
  è già impaginato; il cambio usa opacità e traslazione per 160 ms. Con movimento
  ridotto il cambio è immediato. Il feed non viene spostato da questa animazione.
- I passaggi formano una dock fissa in basso: quattro icone con la voce attiva
  che si espande, più un pulsante Salta circolare separato. Ogni icona permette
  di raggiungere la rispettiva scheda; la voce Inizia, già selezionata, conclude
  il percorso. Le dimensioni tengono conto della scala del carattere.
- La barra delle categorie della seconda scheda e la dock dell’app della
  quarta restano ancorate al riquadro, usando i componenti dell’app. Raccolte,
  ricerca e lettore dimostrativi aprono le rispettive viste a pieno schermo.
- Rimossi “Prova un’altra scheda”, la nota in fondo e il pulsante Continua.
  Nei titoli delle altre fasi dell’onboarding la scrittura e cancellazione
  conservano le righe misurate dal sistema nativo, senza salti degli a capo.
- Salvataggi, visite e ricerca dell’esempio restano in memoria, separati dai
  dati dell’app. La selezione del passaggio viene salvata in sequenza, scartando
  richieste intermedie superate; il tasto Indietro nativo cerca la scheda
  precedente senza sostituire il feed. Quando cambia l’altezza del riquadro,
  il feed riallinea la pagina selezionata alla nuova altezza, come nella Home.
  Lo spazio per le categorie è interno alla seconda pagina e non modifica la
  distanza tra gli articoli; le altre pagine conservano la stessa geometria.
  Nessuna modifica ai contratti di apprendimento o precaricamento.

## Altre richieste già implementate nel codice

L’intestazione Profilo mostra foto e nome soltanto quando entrambi sono
impostati, conservando la tipografia del titolo. Altrimenti resta “Profilo”.
Nelle Impostazioni sono rimossi testo introduttivo e Rivedi il tutorial; il
controllo delle categorie ha etichetta breve e nessun sottotesto.
La preparazione online richiede almeno dieci anteprime leggibili prima
dell’ingresso automatico, con le uscite previste per assenza di rete o errori.

## Verifica e stato della revisione

Typecheck, 219 test ed esportazione Android superati. I test verificano anche
che il tutorial usi realmente `Feed`, che le pagine occupino l’intero viewport,
che la barra delle categorie conservi la stessa distanza tra le pagine e che
lo stesso articolo dimostrativo possa comparire in due tappe senza duplicare
salvataggi. Restano coperti interruzione della molla, inversione del gesto,
ridimensionamento del viewport, geometria della dock e scritture concorrenti.
APK isolato compilato e installato sul Galaxy S23. La nuova prima schermata
`releases/qa/onboarding-0.1.13/tutorial-home-feed-1-dark.png` mostra un solo
articolo a riposo. La registrazione `tutorial-home-feed.mp4`, nella stessa
cartella, verifica swipe in avanti, assestamento sulla seconda scheda e ritorno
alla prima; le sfumature accompagnano il movimento ai bordi del riquadro.
Gli screenshot e il video della lista precedente non sono evidenza di questa
correzione e sono conservati soltanto per confrontare le revisioni.

Verificati selezione Scienza nella seconda tappa, Indietro nativo dalla terza
alla seconda, quarta tappa con dock dell’app, salvataggio, apertura e chiusura
del lettore e Profilo con una visita e un salvataggio dimostrativi. Dopo Salta,
la libreria di prova conserva 30 anteprime, zero visite e zero salvati.
Verificati anche prima e seconda tappa in tema chiaro con movimento ridotto e
prima tappa scura con scala carattere di sistema 1.3. Le istruzioni, il testo
dell’articolo e la dock restano visibili. Ripristinata la scala del telefono
a 1.0; la prima schermata scura con movimento normale è lasciata aperta.

Configurazione e APK principale sono preservati; il mantenimento temporaneo
dello schermo acceso ha una scadenza e si limita alle app Synapse.

La prima schermata aggiornata è ancora sottoposta alla revisione dell’utente.
Le successive saranno presentate singolarmente; nessuna nuova versione
principale o consegna finale è dichiarata da questo checkpoint.

## Anteprima più bassa e ritorno dal lettore — 11 ottobre, 18:43

Ridotta l'altezza standard dello snippet a 420 punti, con crescita in base alla
scala del testo e riduzione flessibile sullo spazio disponibile. Lo spazio
liberato è distribuito sopra le istruzioni, tra istruzioni e anteprima e prima
della dock. Salta usa la superficie neutra e il testo attenuato. Restano il
singolo articolo a riposo, le sfumature del feed e la dock ancorata in basso.

Il lettore del tutorial mantiene la geometria a schermo intero durante la
transizione e dissolve sopra una finestra trasparente, evitando il taglio
causato dalla contrazione verso uno snippet più stretto. La scheda sottostante
riappare all'inizio della chiusura; i gesti restano bloccati solo fino alla
rimozione del lettore. Il lettore dell'app conserva la sua transizione normale.
Il doppio tap del Feed reale è stato verificato sul dispositivo. Aggiunto anche
nel corpo del lettore dimostrativo: due tocchi vicini entro 280 ms salvano,
mentre tocchi distanti, singoli e trascinamenti non salvano. Il salvataggio è
idempotente e rimane locale al tutorial. La terza tappa ora spiega il gesto.

Typecheck, 221 test ed esportazione Android superati; build QA separata riuscita
e installata. Controllati apertura, doppio tap e chiusura nelle quattro tappe,
compreso Indietro nativo nell'ultima. Dopo Salta la libreria QA mantiene
30 anteprime, zero visite e zero salvati. Verificati tema chiaro con movimento
ridotto e prima/seconda tappa scure con testo al 130%; ripristinata scala 1.0.
La registrazione tutorial-compact-reader.mp4 mostra il salvataggio nel lettore
e la dissolvenza senza contrazione del testo. Fotogrammi ispezionati prima,
durante e dopo la chiusura. La nuova immagine di revisione della prima tappa è
tutorial-compact-1-dark-final.png. Verificato anche il ritorno al Profilo
dimostrativo dai salvati e alla ricerca da una riga di risultato. Le altre tappe restano da presentare singolarmente.

APK principale invariato: SHA256
B2B7D585ED3BD04D9394CD559F80391FCAECAB9702317F03C67D1080D38DB282.

## Swipe finale e titoli animati — 11 ottobre, 19:01

Collegato onEndReached del Feed reale al completamento del tutorial: soltanto
uno swipe ulteriore verso l'alto sull'ultimo articolo passa alla preparazione.
Arrivare alla quarta scheda non conclude automaticamente il tutorial. Il
lettore aperto, una destinazione diversa da Home e una navigazione già occupata
impediscono la richiesta di completamento. I gesti invertiti restano gestiti
nel Feed reale, senza introdurre un secondo riconoscitore sovrapposto.

La schermata precedente rimane montata durante una transizione coordinata di
360 ms: dissolve e si sposta di 24 punti mentre entra la preparazione.
La composizione della superficie elevata usa una texture Android durante la
transizione, correggendo l'artefatto scuro dell'ombra visto nella prima ripresa.
Il controller attende il segnale di presentazione prima dell'ingresso automatico
quando ci sono già dieci anteprime. Questo riguarda la presentazione, non i
download: resta disponibile l'ingresso esplicito e non vengono simulati tempi
di rete. Movimento ridotto e passaggio in background completano subito il
trasferimento. Il ripristino direttamente in preparazione conserva l'ingresso
automatico precedente, senza richiedere una transizione che non è iniziata.

Le intestazioni del tutorial usano nuovamente OnboardingTitleSlot, con
cancellazione e scrittura lettera per lettera. Le righe del titolo completo
vengono misurate prima della scrittura; il sottotitolo mantiene la propria
geometria misurata, indipendente dalle lettere attualmente visibili.
La fase di uscita conserva una sessione separata del titolo precedente, così
non interferisce con la scrittura del titolo della preparazione in ingresso.

Typecheck, 225 test ed esportazione Android riusciti. APK QA compilato e
installato sul Galaxy S23. La registrazione tutorial-final-swipe.mp4 mostra
la seconda intestazione durante la scrittura, la quarta tappa e lo swipe
successivo verso la preparazione. Ispezionati fotogrammi prima, durante e dopo
il trasferimento: nessun rettangolo scuro nell'ultima build. La prova QA del
replay mostra la preparazione con il conteggio reale già pronto e la mantiene
visibile per ispezione; il normale primo onboarding conserva l'ingresso
automatico dopo il segnale di presentazione. Questa differenza è solo nel
fixture di verifica, non nel controller dell'app principale.

APK principale e relativa configurazione preservati. La release v0.1.13 non è
stata ricompilata né sostituita da questo checkpoint; resta la revisione finale.
Verificato anche sul telefono lo swipe finale con movimento ridotto: titolo
completo e passaggio immediato alla preparazione. Ripristinato movimento normale
e lasciata aperta la prima tappa; screenshot tutorial-final-typed-1-dark.png.
