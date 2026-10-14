# Lume · documento di partenza per l’implementazione

**Destinatario:** Astra  
**Data:** 13 ottobre 2026  
**Scelta dell’utente:** opzione **04 — Oliva e crema**  
**Progetto da aggiornare:** `synapse-mobile`, React Native / Expo.

## Obiettivo

Portare nell’app principale la palette Oliva e crema e la tipografia concordata, mantenendo struttura, interazioni e comportamento nativi già implementati. Il risultato deve avere carta calda, verde oliva morbido e un tema scuro caldo e leggibile.

L’utente ha indicato l’opzione 04 come la migliore. Questa è la direzione da implementare. Le opzioni 05 — Salvia e miele e 06 — Muschio e terracotta restano alternative esplorative.

## Decisioni emerse dal confronto

La prima esplorazione comprendeva Salvia e lino, Inchiostro e avorio e Prugna e cipria. L’utente ha trovato interessante solo il verde, chiedendo più calore e osservando che il primo tema verde perdeva qualità nello scuro rispetto ai colori attuali dell’app.

La seconda esplorazione ha quindi mantenuto il verde, introducendo superfici crema e fondi scuri tendenti al carbone caldo. Fra queste varianti è stata scelta **Oliva e crema**.

La preferenza per la 04 identifica la direzione complessiva. La resa finale su dispositivo, compreso il tema scuro, resta da verificare: la scelta del prototipo browser non costituisce una verifica nativa.

## Palette da implementare

Usare questi valori come base esatta, conservando le sette chiavi del sistema di tema esistente. Non combinare i colori della 04 con quelli della 05 o della 06.

| Token | Chiaro | Scuro | Ruolo |
| --- | --- | --- | --- |
| `paper` | `#F7F1E3` | `#211F19` | Fondo principale, pagine e pannelli |
| `ink` | `#353629` | `#F2EBDD` | Testo principale, marchio e icone ordinarie |
| `muted` | `#6E6B59` | `#BFB49F` | Testo secondario e metadati |
| `surface` | `#EAE3CF` | `#353228` | Superfici secondarie e controlli neutri |
| `accent` | `#62653C` | `#C4C08C` | Azioni e accenti oliva |
| `active` | `#D6D5AD` | `#514E36` | Selezioni e controlli attivi |
| `line` | `#DCD5BF` | `#4B4638` | Divisori e bordi discreti |

Nel prototipo il marchio usa `ink`, senza un ulteriore colore dedicato. Conservare l’assegnazione semantica dei token nei componenti nativi; eventuali correzioni di contrasto devono essere circoscritte e documentate.

Nel tema scuro evitare di tornare al fondo verde saturo della prima esplorazione. Il fondo della 04 è bruno/carbone; il testo è avorio e gli accenti sono oliva chiaro. Verificare anche testo e icone sulle superfici `active`, non soltanto sul fondo `paper`.

## Tipografia concordata

### Marchio «lume»

- Testo del marchio in minuscolo: **lume**.
- **Newsreader ExtraBold Italic, peso 800**, esclusivamente per il marchio.
- Caricare il font reale. Evitare peso e corsivo sintetici applicati a Newsreader Regular.
- Nel prototipo: 43 px nel marchio dell’intestazione e 79 px nell’esempio di benvenuto. Sono riferimenti browser, non nuovi valori obbligatori per tutte le schermate native.
- Nell’app, il marchio attuale è `Lume`, Newsreader Regular, 46/50 px. Partire dalla geometria nativa esistente e verificare gli ingombri del nuovo font, soprattutto estremi dei glifi corsivi e allineamento con la rail.
- Per la schermata iniziale usare il layout nativo già approvato, adattando il marchio dove presente. Non duplicare il marchio perché il prototipo di confronto lo mostra in più contesti.

La scritta visibile nel prodotto può diventare «lume» senza modificare package Android, bundle identifier iOS, schema, slug o altri identificatori tecnici. Il nome visualizzato dell’app, già `Lume`, non richiede una nuova rinomina per questa implementazione.

### Titoli

**Newsreader**, con pesi e dimensioni differenziati come nell’app principale. Non estendere ExtraBold Italic ai titoli.

Riferimenti verificati nel codice attuale:

| Contesto | Font e peso | Dimensione / interlinea |
| --- | --- | --- |
| Titolo dell’anteprima nel feed | Newsreader Medium 500 | 36 / 40 |
| Profilo e titolo Cerca | Newsreader Medium 500 | 38 / 42 |
| Intestazione delle raccolte | Newsreader Medium 500 | 34 / 38 |
| Altri titoli e onboarding | Newsreader 400 o 500 secondo il componente | Conservare la gerarchia nativa esistente |

Le liste del prototipo usano anche 25/29 px e i titoli si adattano alla larghezza browser. Questi valori non sostituiscono automaticamente le misure dei componenti nativi. Conservare gli stili già presenti per lettore, righe e onboarding, salvo correzioni necessarie e motivate.

### Corpo e controlli

**Google Sans Flex**, al posto di Source Sans 3, per testo di lettura, metadati, etichette, input e controlli.

- Peso 400: corpo e testo ordinario.
- Peso 500: enfasi intermedia dove già necessaria.
- Peso 600: etichette forti e controlli selezionati.
- Conservare le dimensioni del corpo e le preferenze di lettura native. Il prototipo usa 18 px, interlinea 1,47 e un’opzione 20 px; queste misure dimostrative non devono sovrascrivere la preferenza dell’utente.
- Verificare a capo, altezza delle righe e centratura verticale: il cambio di famiglia modifica le metriche del testo.

Nel prototipo sono disponibili copie statiche reali di Google Sans Flex 400, 500, 600 e 700, scaricate da Google Fonts. Per l’app bastano i pesi effettivamente usati. Non introdurre controlli per gli assi variabili o dipendenze da richieste di rete per caricare i font.

## Font e riferimenti disponibili

Tutti i percorsi seguenti sono relativi alla root `C:\Users\Augusto\Documents\Scrolls`.

| Risorsa | Percorso |
| --- | --- |
| Prototipo interattivo | `lume-palette-prototypes/index.html` |
| Token delle palette e logica della demo | `lume-palette-prototypes/app.js` |
| Stili e misure browser | `lume-palette-prototypes/style.css` |
| Note della demo | `lume-palette-prototypes/README.md` |
| Verifiche browser effettuate | `lume-palette-prototypes/VERIFICA.md` |
| Confronto delle nuove palette scure | `lume-palette-prototypes/palette-calde-scuro.png` |
| Newsreader 800 Italic | `lume-palette-prototypes/assets/Newsreader_800ExtraBold_Italic.ttf` |
| Google Sans Flex | `lume-palette-prototypes/assets/GoogleSansFlex-400.ttf`, `GoogleSansFlex-500.ttf`, `GoogleSansFlex-600.ttf` |
| Licenze dei font | `lume-palette-prototypes/assets/Newsreader-OFL.txt`, `GoogleSansFlex-OFL.txt` |

L’opzione 04 è il **primo oggetto** dell’array `palettes` in `app.js`. Per conservare i dati della prima demo, il suo ID interno è ancora `salvia`: non confonderlo con il nome della palette precedente.

Il prototipo può essere avviato dalla sua directory con `node serve.cjs`, quindi aperto su `http://127.0.0.1:4321/`. La disponibilità di questa anteprima dipende dal server locale. Il controllo «Confronta scuro attuale» mostra i colori originali dell’app su tutte le varianti; «Torna alle alternative» ripristina le nuove palette.

**L’autorità per colori e comportamento è il codice, non il campionamento degli screenshot.** Alcune immagini precedenti nella cartella documentano esplorazioni superate; usare l’opzione 04 del prototipo corrente.

## Punti di intervento nell’app

1. **`src/theme.ts`:** sostituire le palette chiara e scura con i token della 04; mantenere forma di `Palette`, esportazioni e parametri delle animazioni. Aggiornare i riferimenti centrali del corpo e del semibold a Google Sans Flex.
2. **`App.tsx`:** caricare i font effettivi con il sistema già in uso; cambiare font e testo del marchio. Gestire caricamento ed errori senza regressioni nella fase iniziale.
3. **Componenti tipografici:** partire da `src/components/Atoms.tsx`, quindi controllare i riferimenti diretti a Source Sans 3 e Newsreader nei componenti. Newsreader 400/500 rimane disponibile per i titoli.
4. **Temi e superfici:** verificare feed, lettore, ricerca, categorie, dock, profilo, pannelli, impostazioni, toast e onboarding. Cercare colori fissi rimasti dalla vecchia palette e distinguerli da colori funzionali, immagini e simboli che non vanno cambiati indiscriminatamente.
5. **Superfici di avvio:** allineare al nuovo `paper` i fondi di avvio e dell’icona adattiva dove pertinenti. In `app.json`, il fondo dell’icona adattiva è oggi `#f7f4ee`; il riferimento chiaro della 04 è `#F7F1E3`. Preservare geometria di lampadina e filamento negli asset approvati.
6. **Documentazione del progetto:** aggiornare la descrizione della palette e dei font in `AGENTS.md` una volta implementati. L’indicazione attuale «terracotta / Source Sans 3» descrive lo stato precedente; per questa modifica prevalgono le scelte esplicite dell’utente riportate qui.

Prima di rimuovere la dipendenza Source Sans 3, verificare che non esistano più riferimenti attivi. Copiare i font necessari in una directory di asset dell’app e includerne le licenze; il bundle nativo deve essere autosufficiente rispetto alla cartella del prototipo.

## Confini dell’implementazione

Il prototipo serve per confrontare colori e tipografia. Non è una specifica sostitutiva dell’intera app.

- Preservare layout nativi, paginazione gestuale, navigazione, lettore, struttura del profilo e pannello nome/foto già implementati.
- Non importare articoli dimostrativi, ricerca locale della demo, paginazione a pulsanti, sincronizzazione delle tre varianti o controlli esterni di confronto nell’app principale.
- Non aggiungere nuovi account, schermate, immagini degli articoli o preferenze di palette selezionabili: la richiesta riguarda l’applicazione della 04 e della tipografia concordata.
- Non modificare feed, personalizzazione, richieste Wikipedia, cache, ranking, migrazioni, dati del profilo o salvataggi per introdurre il nuovo aspetto.
- Preservare le righe dei salvati: nessun nuovo pulsante visibile di rimozione laterale, anche se presente nella demo browser.
- Conservare le animazioni reversibili, la preferenza di movimento ridotto e i gradienti delle categorie e del feed. Applicare i nuovi colori anche ai gradienti senza cambiarne logica e geometria.
- Preservare il runtime protetto `synapse` e gli altri prototipi separati.

## Stato della workspace e modalità di lavoro

La workspace contiene già numerose modifiche non committate, incluse modifiche a `App.tsx`, componenti del feed, lettore, categorie e profilo. Prima di intervenire, leggere `AGENTS.md` alla root e quello di `synapse-mobile`, controllare lo stato corrente e distinguere il lavoro preesistente dalla nuova implementazione.

Non effettuare reset, checkout distruttivi o riscritture che eliminino quel lavoro. Non ampliare autorizzazioni, registrare directory o avviare deleghe automatiche. Questo documento prepara il passaggio di consegne ad Astra; non avvia una sessione, non cambia il modello della chat e non costituisce un risultato già implementato.

La cartella `lume-palette-prototypes` è esclusa dal Git della root dalla regola generale `/*`. Se Astra lavora da una copia remota del repository, i riferimenti e i font vanno resi disponibili esplicitamente. Non presupporre che il prototipo sia presente su Git o allargare automaticamente le regole di inclusione. Questa tabella dei token consente comunque di ricostruire la palette selezionata.

## Sequenza consigliata

1. Fotografare lo stato iniziale e identificare tutti i riferimenti a tema e font.
2. Integrare font locali e palette nei punti centrali del sistema esistente.
3. Applicare «lume» ExtraBold Italic e controllare i riferimenti tipografici diretti.
4. Verificare schermate e stati in entrambi i temi; correggere solo problemi concreti di contrasto, a capo e allineamento.
5. Eseguire i controlli del progetto e verificare il risultato su dispositivo.
6. Consegnare il riepilogo delle modifiche, le schermate confrontabili e l’esito delle verifiche, indicando con precisione quelle non eseguite.

## Criteri di accettazione

### Aspetto

- I sette token in entrambi i temi corrispondono all’opzione 04, salvo correzioni motivate e documentate.
- «lume» appare in Newsreader 800 Italic reale, senza tagli dei glifi.
- I titoli mantengono Newsreader con la gerarchia nativa esistente.
- Corpo e controlli usano Google Sans Flex e rispettano le impostazioni di lettura.
- Testo, icone, stati attivi, placeholder, bordi e gradienti restano leggibili in chiaro e scuro.
- Profilo con e senza foto, nomi lunghi, titoli lunghi e tastiera aperta non introducono sovrapposizioni o tagli.

### Comportamento

- Passaggio di tema, apertura e chiusura del lettore, paginazione e movimenti del profilo conservano il comportamento attuale.
- I gradienti della rail e del feed funzionano in entrambi i temi e con entrambe le impostazioni di auto-hide.
- Testo e titoli mantengono il layout finale durante i gesti; evitare ridimensionamenti del testo usati per mascherare problemi di impaginazione.
- Funzionamento offline dei font, caricamento iniziale, movimento ridotto e accessibilità sono verificati.
- Salvataggi, profilo, cronologia e contratti di rete/cache rimangono integri.

### Verifiche tecniche richieste

Eseguire da `synapse-mobile` gli script del progetto:

```text
npm run typecheck
npm test
npm run export
```

L’export produce il bundle Android: non equivale a un APK installato né a una prova su dispositivo. Verificare separatamente resa e movimento su Android; mantenere il codice compatibile con iOS e riportare se iOS è stato effettivamente provato.

## Cosa è stato completato e cosa resta

**Completato:** esplorazione di sei direzioni cromatiche in due iterazioni, prototipi browser interattivi, concordanza sulle famiglie tipografiche, selezione dell’opzione 04 e questo documento di partenza.

**Da eseguire:** integrazione nativa della palette e dei font, verifica completa dell’app, controlli tecnici, export Android e verifica su dispositivo.

Per questa esplorazione non sono stati modificati i runtime delle app. Le verifiche browser già annotate riguardano i prototipi e non certificano l’integrazione nativa.
