# Lume v0.2 — scoperte e consegna

## Contenuti e comportamento

Il catalogo incluso contiene 150 edizioni italiane da Wikipedia, selezionate e revisionate dall'agente sui passaggi sorgente conservati. Dieci categorie: Storia 17, Arte 21, Tecnologia 20, Scienza 13, Natura 15, Geografia 14, Cibo 10, Società 15, Psicologia 8, Intrattenimento 17. Le schede hanno 40–80 parole e una continuazione coerente; totale massimo 300. In 23 casi il totale rimane sotto 150 parole (minimo 92), senza riempitivi.

Il badge rosetta identifica il processo di selezione automatica, non una revisione umana né una garanzia assoluta di verità. L'impronta lega titolo, testo e provenienza; modifiche invalidano il badge. Le edizioni integre escludono la riscrittura Gemini, anche offline. La verifica non è una firma crittografica contro manipolazioni intenzionali del dispositivo.

La riserva progressiva resta di 20–30 articoli. Il catalogo non viene montato o scritto integralmente nel database all'avvio: sono persistiti gli articoli effettivamente toccati. I vecchi salvati conservano il proprio testo. Offline i contenuti possono ripetersi dopo l'esaurimento della selezione disponibile.

Wikipedia e Wikivoyage condividono il recupero in background: Wikivoyage usa solo sezioni culturali e al massimo un turno su cinque, con riserva almeno 20. Ricerca esplicita e feed restano distinti. Gemini opzionale può preparare nuove edizioni complete prima della pubblicazione, entro il budget speculativo condiviso; errori o quota mantengono la fonte. Nessuna riscrittura durante la lettura.

I consigli mantengono i pesi di apprendimento esistenti, usando contenuti più specifici e varietà. I percorsi facoltativi collegano due scoperte pronte con relazioni esplicite, al massimo un percorso ogni dieci posizioni, senza attribuire interessi automaticamente. Si disattivano in Impostazioni → Home → Collega le scoperte. Nessun tempo di lettura.

Palette Oliva e crema ripristinata, fondo scuro #1B1915. Il design system, il profilo e le impostazioni aggiornati sono inclusi senza cambiare le geometrie approvate del lettore.

## Provenienza, licenze e riproducibilità

Il codice conserva la licenza 0BSD. I testi del catalogo, adattati da Wikipedia, sono distribuiti sotto CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/ . Ogni edizione include URL, revisione, attribuzione ai contributori, licenza e passaggi sorgente. La cronologia della pagina sorgente identifica i contributori; riscrittura e selezione dei passaggi costituiscono adattamenti. Le fonti dinamiche mantengono le proprie attribuzioni. Le licenze dei font sono incluse in assets/fonts.

src/content/curatedData.ts è il catalogo pronto per build e utilizzo offline. docs/DISCOVERY-CATALOGUE-REVIEW.json conserva per ogni edizione rapporto, impronte e motivazioni; docs/discovery-overrides.json conserva le correzioni editoriali. Gli script prepare/build/publish-discovery-catalogue.cjs sono strumenti editoriali di manutenzione: richiedono il dossier e gli snapshot locali esclusi da Git, non sono dipendenze della build. Non rigenerare approvazioni senza revisione dei testi modificati.

## Verifiche della release

Typecheck e suite locale coprono integrità di tutti i 150 contenuti, distribuzione, duplicati di fonte, offline, cache e vecchi salvati, ranking e stabilità, percorsi, Gemini con fixture, cancellazione e quota. Il campione dinamico comprende 30 fixture: 15 passaggi reali e 15 casi problematici controllati; non rappresenta 30 richieste live né una garanzia semantica su ogni futuro articolo. Nessuna quota API Gemini consumata.

La consegna richiede inoltre export Android, APK firmato con chiave esistente e installazione come aggiornamento senza cancellazione dati. Le prove pratiche su telefono restano affidate all'utente; non confondere build/installazione con collaudo visivo o TalkBack.

## Checklist sul telefono

- Avviare con i dati precedenti: salvati e interessi devono restare presenti.
- Leggere scheda e approfondimento di alcune selezioni; controllare continuità, fonte e badge.
- Passare offline e continuare a sfogliare; verificare avviso di ripetizione e categorie.
- Attivare/disattivare Collega le scoperte: cambia solo il futuro del feed.
- Provare tema chiaro/scuro, caratteri grandi e leggibilità del badge.
- Verificare navigazione profilo → impostazioni → Gemini e ritorno; nessuna dock nelle due pagine secondarie.

## Esito finale del 14 ottobre 2026

- Typecheck: superato. Suite: 283/283 test superati.
- Export Android Hermes: superato, bundle circa 5,1 MB.
- Build release arm64: superata; firma APK v2 verificata con apksigner.
- Pacchetto app.synapse.reader, versione 0.2.0, versionCode 19, Android minimo API 24.
- APK Lume-0.2.apk: 40.207.469 byte.
- SHA-256: ec617cea87f99d5400a7c8731fe3bd0012fa35d5f8aff85dd8eb5cd8bfe8f89c.
- Nessun dispositivo collegato alla verifica ADB: installazione e avvio ancora da eseguire. Nessun test pratico effettuato.
- Segreti e archivi locali QA esclusi dallo staging; controllo dei pattern di credenziali sullo staging e sui nove commit preesistenti in uscita senza riscontri. Non è un audit di sicurezza completo.
