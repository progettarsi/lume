# Lume

Release corrente: **v0.2.5**, build 27. [Changelog](CHANGELOG.md) e [APK universale Android](https://github.com/progettarsi/lume/releases/tag/v0.2.5), compatibile con le quattro ABI da Android 7.0.

Prima implementazione React Native + Expo dell’esperienza approvata. Android come prima piattaforma; codice dell’app condiviso con iOS.

## Funzioni implementate

- Feed verticale guidato dal gesto: uno swipe avanza di un solo articolo, anche con velocità elevata. Doppio tap per salvare, lettura estesa e transizioni reversibili.
- Tutte le categorie nella barra superiore scorrevole con sfumatura a destra. Selezione con un tap, ordine automatico secondo gli interessi, senza riordinamento manuale. Le chips scompaiono durante lo scorrimento, liberando spazio per l’articolo. “Per te” resta prima.
- Wikipedia in italiano: prima risposta pubblicata subito, rifornimento quando restano 12 schede e riserva persistente fino a 30 anteprime utili, costruita progressivamente. Lavoro in secondo piano seriale: massimo sei avvii al minuto, due risposte API per lotto, pausa tra lavori e tentativi automatici finiti. L’articolo aperto interrompe i download di riserva. Nessun server.
- Riserva: massimo 512 KiB di anteprime, 16 KiB per voce. Cache ordinaria: 80 articoli / 6 MiB; salvati esclusi, articolo attivo e riserva utile protetti dalla pulizia (i contenuti protetti possono superare il limite ordinario). La cronologia mantiene fino a 500 riferimenti. Offline sono disponibili le anteprime conservate e soltanto gli approfondimenti già scaricati; il fallimento Gemini conserva il testo originale, gli altri errori offrono un’azione nel fondo del lettore.
- Ricerca online ordinata secondo la pertinenza di Wikipedia; ricerca locale senza connessione. Shuffle online, con ripiego sulla cache quando il servizio non risponde.
- Profilo, salvati, cronologia, dimensione del testo, tema scuro. SQLite sul telefono; adattatore locale solo per l’anteprima browser.
- AI facoltativa: chiave personale Gemini custodita con SecureStore sul telefono. Quota gratuita del fornitore, nessuna fatturazione attivata dall’app. Se non disponibile, rimane il testo originale. Nell’anteprima browser la chiave resta soltanto in memoria.
- Icona fornita adattata alla palette, inclusa versione Android adattiva e monocromatica.

La selezione divulgativa usa filtri e temi iniziali: non garantisce che ogni voce Wikipedia sia accessibile a tutti. Il feed si personalizza sul dispositivo tramite aperture volontarie deboli, salvataggi reversibili e memoria delle interazioni recenti. Non misura tempi di lettura né deduce comprensione o lunghezza desiderata; la ricerca conserva la pertinenza Wikipedia. L’AI gratuita dipende dalle quote e dalla disponibilità del fornitore, e non è necessaria al funzionamento.

- Aggiornamento Home con doppio tocco su Home e un solo indicatore superiore; esclusione persistente dei contenuti già letti/incontrati, anche dopo la pulizia della cache.
- Categoria Curiosità, temi iniziali mescolati, scoperte dai collegamenti delle voci e quota casuale del feed.
- Testi da paragrafi HTML: niente tabelle, didascalie, navigazione, note o formule isolate. Selezione fino a circa 1.100 parole, senza troncare frasi.
- Gemini Flash-Lite 3.1 con ripiego 3.5 solo se il modello non esiste: revisione della sola continuazione, anteprima immutabile, errori espliciti, riprova e conservazione offline. Il riassunto compare nella stessa apertura appena pronto; errore o timeout restituiscono il testo classico. Il testo disponibile viene impaginato prima della rivelazione dall’alto con bordo sfumato, senza ricomporre gli a capo; lo scroll anticipa la visibilità.
- Disambiguazioni escluse tramite metadati Wikipedia e categorie; l’estrazione non scarta la definizione per conservare frammenti senza contesto. Cache del testo aggiornata senza cancellare cronologia o salvataggi.
- SQLite: una connessione dedicata, letture e scritture ordinate, recupero una volta per handle Android non valido.

## Crediti delle icone

[useAnimations](https://useanimations.com/) per Home/Profilo nella dock, salvataggio e Shuffle; [Phosphor Icons](https://phosphoricons.com/) per tutte le icone statiche, comprese le 22 categorie. Entrambe le librerie sono MIT: crediti e testi integrali delle licenze sono inclusi nell’app (Impostazioni → Informazioni) e in [assets/licenses](assets/licenses). Sono vettori locali, senza servizi o abbonamenti. Dettagli e regole di movimento in [docs/ICON-SECTION-PLAN.md](docs/ICON-SECTION-PLAN.md).

## Avvio e controlli

Con Node e pnpm 10 disponibili:

```powershell
pnpm install
node node_modules/expo/bin/cli start
pnpm typecheck
pnpm test
node node_modules/expo/bin/cli export --platform all
```

## APK locale

La cache Gradle usa il collegamento locale breve ../.g per evitare il limite dei percorsi Windows.

Gli strumenti portabili vengono cercati in `../.mobile-tools`: JDK 17, Android SDK 36, build-tools 36.0.0 e NDK 27.1.12297006. L’accettazione della licenza ufficiale Android SDK deve essere autorizzata prima dell’installazione dei pacchetti.

```powershell
./scripts/build-android.ps1
```

Il comando prepara il progetto Android, riusa la firma privata locale nella cartella ignorata `.credentials` (la crea solo alla prima build) e genera `releases/Lume-<versione>.apk`. Conservare `.credentials` privatamente: servirà per aggiornare la stessa installazione. Nessuna pubblicazione su store o servizio remoto è prevista.

La cartella `android/` è generata da `expo prebuild` e le risorse `@xml/secure_store_*` vengono create dal plugin `expo-secure-store`.

## Documentazione

- [Design system](docs/DESIGN-SYSTEM.md): palette, tipografia, primitive e regole di movimento.
- [Icone](docs/ICON-SECTION-PLAN.md) e [aptica](docs/HAPTICS.md).
- [Personalizzazione locale](docs/PERSONALIZZAZIONE-V3.md).
- [Catalogo delle scoperte](docs/DISCOVERY-RELEASE.md).
- [Emulatore Android](docs/ANDROID-EMULATOR.md).
- [Changelog](CHANGELOG.md).
