# Lume — sistema globale

Palette aggiornata su richiesta dell’utente il 14 ottobre 2026; sostituisce i colori del riferimento precedente LUME-04-IMPLEMENTATION-HANDOFF.md.

| Token | Chiaro | Scuro |
|---|---|---|
| paper | #F7F1E3 | #1B1915 |
| ink | #353629 | #F2EBDD |
| muted | #6E6B59 | #BFB49F |
| surface | #EAE3CF | #353228 |
| accent | #62653C | #C4C08C |
| active | #D6D5AD | #514E36 |
| line | #DCD5BF | #4B4638 |

 Implementazione del 13 ottobre 2026, senza modificare ranking, cache, persistenza dei contenuti o contratti di rete.

## Fondazioni

`src/design-system/tokens.ts` definisce palette corrente chiara/scura, ruoli tipografici, spazi, raggi, aree di interazione, livelli e famiglie di movimento. `theme.ts` rimane un'esportazione compatibile. Non dedurre il tema confrontando vecchi colori: usare `isDarkPalette` o i ruoli di superficie.

`fonts.ts` carica asset inclusi nell'app: Google Sans Flex 400/500/600, Newsreader 400/500 e Newsreader ExtraBold Italic 800. Quest'ultimo è usato per il marchio **lume**, in minuscolo. **Benvenuto!** nell’onboarding usa Newsreader Medium 500, senza corsivo. Font aggiunti e licenze OFL sono in `assets/fonts`; non servono richieste di rete. I vecchi pacchetti Source Sans rimangono nel lockfile per evitare un aggiornamento delle dipendenze estraneo alla patch, ma nessuna schermata o fixture li carica.

La palette approvata conserva esattamente i suoi sette colori. Correzioni circoscritte di contrasto per il testo secondario:

| Sfondo | Chiaro | Scuro |
|---|---|---|
| Carta | `#6E6B59` | `muted` originale |
| Superficie | `#686553` | `muted` originale |
| Attivo/pressione | `#5C5948` | `#CFC5B0` |

`SurfaceContext` passa il ruolo a `Label`; `secondaryText` serve alle varianti con sfondo proprio. I test verificano almeno 4,5:1 per testo normale e 3:1 per icone d'azione sui tre sfondi. Le linee decorative non sono usate come unico segnale di selezione. Il campo comune usa `muted` per il bordo, più leggibile di `line`.

## Componenti e comportamento

- `primitives.tsx`: ThemeContext, SurfaceContext, Label, Icon, Button. `components/Atoms.tsx` riesporta l'API precedente, evitando migrazioni massive degli import.
- `components.tsx`: Surface, Section, IconBadge, NavigationRow, ToggleRow, ChoiceGroup, Field, Action, ScreenLayer, PageHeader, PageScroll, PageKeyboard e SheetSurface.
- `ChoiceGroup` misura la larghezza delle etichette in grassetto e alla scala di sistema; ogni testo rimane su **una sola riga**. Quando lo spazio non basta, vanno a capo i controlli interi. Nessuna riduzione del carattere per farli entrare. I misuratori sono invisibili, inerti ed esclusi dall'accessibilità.
- `ToggleRow` espone una sola azione con ruolo switch e stato checked/disabled. Il controllo grafico interno non gestisce il tocco.
- `ScreenLayer` nasconde i discendenti sia dal tocco sia dall'accessibilità su un contenitore nativo non collassabile. La sola traslazione fuori schermo non basta.
- `PageHeader` gestisce titolo e ritorno; `PageScroll` mantiene margini, spazio sicuro inferiore e tastiera; `PageKeyboard` usa il comportamento specifico della piattaforma. Gli inset provengono dal SafeAreaProvider esistente.
- Nessun componente visuale scrive preferenze o contenuti: riceve valore e callback. Selezione, caricamento, disabilitazione ed errori non vanno dedotti soltanto dal colore.
- Errori vicino all'azione, con annuncio cortese; originali/cache rimangono leggibili. Gli stati di rete e contenuto restano distinti nei presentatori specializzati esistenti.
- Le azioni distruttive della configurazione sono esplicite e confermate. Annullare una sostituzione non scrive la chiave.

## Impostazioni e Gemini

Quattro sezioni: Aspetto, Lettura, Home e Integrazioni. I valori 18/20/23 della lettura e le impostazioni salvate rimangono compatibili.

Gemini è una pagina dedicata: spiegazione breve, stato, utilizzo solo con chiave disponibile, configurazione/sostituzione/rimozione, guida e informazioni privacy/quote espandibili. La presenza di una chiave non viene presentata come una verifica della sua validità o del piano API. Errori di configurazione, assenza di connessione e indisponibilità del servizio rimangono concetti distinti; gli ultimi sono mostrati dal lettore esistente quando realmente rilevati. Nessuna chiamata Gemini aggiunta dalla schermata.

La dock è nascosta in Impostazioni e Gemini. Ritorno: Gemini → Impostazioni → Profilo; la tastiera viene prima chiusa se aperta. Il contenuto principale delle impostazioni rimane montato, mantenendo la posizione. Il focus accessibile ritorna alla riga Gemini o alla riga Impostazioni del profilo dopo la chiusura della superficie.

## Profilo: confronto e scelta

Provate sul telefono tre varianti reali: righe aperte, gruppo arrotondato, schede separate. Scelto il **gruppo arrotondato**: rende riconoscibili i tre accessi, riprende il trattamento delle impostazioni ed evita di frammentare una lista così breve. Avatar e nome restano in alto a sinistra; le opzioni sono centrate nello spazio disponibile e scorrono se necessario. Nessun selettore di stile nella versione utente.

Le alternative sono conservate nella galleria di sviluppo e nella fixture isolata, non nelle preferenze utente. Le raccolte mantengono l'aspetto delle righe articolo e il gesto di rimozione approvati.

## Adozione nell'intera app

| Superficie | Adozione | Variante conservata |
|---|---|---|
| Home e categorie | Palette, font, Label/Icon/Button, titolo condiviso, marchio locale | Geometria feed, fade, rail e auto-hide invariati |
| Lettore | Palette, font, titolo e primitive comuni | Misure del testo, origini e ritorni dei gesti esistenti |
| Profilo | Titolo comune, NavigationRow, icone su superfici, gruppo centrale | Avatar a sinistra e sua traiettoria C02 |
| Editor profilo | SheetSurface, Field, primitive, movimento e livelli comuni | Gestione delle modifiche, gesto e dimensioni C02 |
| Salvati e cronologia | PageHeader, font/palette e primitive comuni | ArticleList/ArticleRow specializzati per ritorni e swipe |
| Ricerca | Titolo comune, font/palette, primitive comuni | SearchComposer compatto con altezza e tastiera approvate |
| Messaggi e avvisi | Font/palette e primitive comuni | StatusMessage, FeedStatus e DismissibleNotice conservano durata, azioni e accessibilità specifiche |
| Onboarding | Font/palette, primitive, superfici semantiche corrette | Composizione, vettori, morph, scene e tutorial approvati |
| Dock | Font/palette, primitive e spring condiviso dedicato | Capsule, misurazioni e traiettoria originali |

Le eccezioni sono componenti specializzati che **consumano già le fondazioni**, non un secondo tema. Non convertire righe articolo, morph e dock in NavigationRow: cambierebbe geometrie e gesti. I file puri di `content` che governano il tutorial conservano i propri parametri per non introdurre dipendenze UI nel dominio.

## Movimento

- Feedback: opacità in pressione, senza scalare lettere o icone di testo.
- Navigazione: spring 380/29/0,75; dock: 380/24/0,8.
- Tema: dissolvenza della cattura precedente in 220 ms; colori della scena attuale atomici.
- Profilo C02: foto 460 ms, pannello 440/360 ms, ritorno 280 ms; curve e gesto invariati.
- Inserimento/rimozione: le varianti ArticleRow e CategoryRail mantengono la coordinazione esistente.
- Decorazioni: MaterialLoadingIndicator e motion context dell'onboarding restano specializzati; lo spinner Home riceve anche visibilità e stato dell'app per non animarsi quando coperto.

Non introdurre attese che bloccano l'input. Movimenti ridotti devono raggiungere direttamente lo stato finale. Riapertura, inversione e interruzione non devono duplicare operazioni o perdere il punto di partenza.

## Sviluppo e verifica

La galleria è accessibile soltanto in sviluppo da Impostazioni → Sviluppo. Usa stato locale. La fixture `scripts/qa/DesignSystemHarness.tsx` contiene confronti, nomi lunghi e stati Gemini simulati; non importa storage o rete. `scripts/qa/build-design-system.ps1` produce un pacchetto separato e ripristina sempre i file di ingresso e l'identità di produzione.

`scripts/build-design-system.ps1` produce invece l'APK di produzione senza cambiare applicationId o versione. I due script vanno eseguiti in sequenza: condividono la directory di build Android.

Verifiche e limiti effettivamente osservati sono riportati in `DESIGN-SYSTEM-VERIFICATION.md`; non confondere typecheck/export con installazione, TalkBack o verifica dei gesti sul telefono.
