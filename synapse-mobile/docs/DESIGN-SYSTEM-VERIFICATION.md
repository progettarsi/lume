# Lume — verifica del design system

Aggiornato il 14 ottobre 2026. Implementazione e controlli locali completati; collaudo pratico finale affidato all'utente, come richiesto. Non considerare l'intera matrice sul dispositivo già superata.

## Controlli locali

- Typecheck TypeScript: superato.
- 263 test: superati. Comprendono contratti esistenti di feed/cache/personalizzazione, regressioni dei gesti, onboarding, configurazione Gemini e nuovi controlli del design system.
- Test aggiunti: scene coperte escluse da tocco/accessibilità, selezione con valori numerici preservati, interruttore disabilitato, etichette del selettore a riga singola, contrasto delle superfici, presenza dei font e licenze, opacità dei pulsanti disabilitati durante il feedback.
- Export Android Hermes: superato il 13 ottobre; rieseguito sulla correzione finale del 14 ottobre, risultato nel log indicato sotto.
- Build release Android arm64: artefatto `releases/Lume-0.1.13-design-system.apk`, con SHA-256 nel file adiacente. Versione e identificativo del pacchetto invariati.

Log e acquisizioni locali: `releases/qa/design-system-2026-10-13/`. Questa directory è esclusa da Git e contiene anche schermate intermedie: usare i file `*-final` e `15-settings-320-large.png` come riferimento per il selettore corretto. `05-settings-dark.png` documenta invece il difetto precedente alla correzione.

## Già osservato sul Samsung Galaxy S23 il 13 ottobre

- Installazione della build completa del 13 ottobre riuscita, con dati utente conservati.
- Home, profilo e impostazioni si aprono con font locali e palette 04.
- Confronto delle tre varianti del profilo nella fixture separata, in chiaro/scuro; scelto il gruppo arrotondato. Provato anche un nome lungo.
- Gemini nella fixture: senza chiave, configurato, errore, offline e salvataggio; controlli disabilitati durante l'attesa. La fixture non usa storage o servizi remoti e non consuma quota Gemini.
- “Automatico” intero su una riga sia alla larghezza ordinaria sia a 320 dp con testo al 150%. A larghezza ridotta vanno a capo i pulsanti interi.
- Dock assente nelle impostazioni.
- Albero accessibile compresso delle impostazioni: nessun controllo della Home o del profilo sottostante e un solo interruttore accessibile. L'albero diagnostico non compresso include anche nodi non importanti: la loro presenza da sola non dimostra un difetto TalkBack.
- TalkBack attivato brevemente dentro Lume e focus visibile. Questo **non certifica** l'intera sequenza parlata o il ritorno del focus.
- Scala del testo, risoluzione e servizi di accessibilità ripristinati dopo le prove.

La correzione finale del 14 ottobre riguarda l'opacità dei pulsanti disabilitati: è coperta da un test locale e inclusa nel nuovo APK, ma non è stata installata o provata sul telefono dall'agente, su richiesta dell'utente.

## Collaudo finale dell'utente

1. **Preferenze:** provare chiaro, scuro e automatico; modificare dimensione del testo e auto-hide, riaprire l'app e controllare che i valori restino salvati.
2. **Navigazione:** Profilo → Impostazioni → Gemini; dock assente nelle ultime due pagine. Aprire la tastiera: il primo Indietro deve chiuderla, i successivi tornare a Impostazioni e Profilo. Controllare posizione di scorrimento e ritorno del focus con TalkBack.
3. **Configurazione:** nessun interruttore Gemini utilizzabile senza chiave; salvataggio vuoto disabilitato; sostituzione annullabile e rimozione confermata. Nessuna chiave salvata visibile. Controllare guida e dettagli espandibili.
4. **Movimento:** sfogliare, aprire/chiudere e invertire il gesto del lettore; passare Home/Profilo; aprire/chiudere il pannello del profilo. Ripetere con movimento ridotto. La verifica video finale non è stata eseguita.
5. **Superfici restanti:** ricerca, salvati, cronologia e anteprima di sviluppo dell'onboarding, anche con titoli lunghi e testo ingrandito. Non cancellare i dati personali per riprovare l'onboarding.

iOS non è stato collaudato. Il codice resta multipiattaforma, ma tale compatibilità non sostituisce una prova su iOS.

## Interruzione e ripresa

L'ultimo script di navigazione del 13 ottobre non è stato eseguito: la revisione automatica dei permessi non poteva completarsi per quota esaurita. Nessuna preferenza è stata cambiata da quello script. Il 14 ottobre l'utente ha affidato a sé i test pratici; non sono state avviate altre prove o installazioni sul telefono.

Prototipo `synapse` preservato; nessun commit o push automatico dei cambiamenti preesistenti dell'utente. La base prima dell'intervento è conservata localmente in `releases/qa/design-system-2026-10-13/baseline/`.

## Aggiornamento palette e installazione — 14 ottobre 2026

Successivamente l'utente ha richiesto la nuova palette riportata in `DESIGN-SYSTEM.md` e l'installazione con avvio sul telefono. I sette token sono stati aggiornati in entrambi i temi, insieme ai colori nativi di avvio; le sole correzioni di contrasto del testo secondario sono documentate separatamente.

Typecheck, 263 test, export Android Hermes e build release superati. Log della nuova verifica: `palette-tests.log` e `palette-android-export.log` nella directory QA indicata sopra. L'APK `releases/Lume-0.1.13-design-system.apk` è stato installato sul Samsung Galaxy S23 come aggiornamento, senza cancellare i dati, e Lume è stata avviata: attività in primo piano confermata. Include anche la correzione dell'opacità descritta sopra. Nessun ulteriore test pratico sul dispositivo: il collaudo della nuova palette resta affidato all'utente.
