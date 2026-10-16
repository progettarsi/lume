# Icone di navigazione e categorie — v0.2.3

Le icone Home e Avatar usano gli asset gratuiti System Solid di Lordicon, esportati come Lottie JSON con l'animazione `hover-pinch`. `lottie-react-native` 7.3.8 corrisponde alla versione prevista dall'Expo SDK installato. I file sono inclusi nell'app e non richiedono rete. Il colore segue `palette.ink` nei due temi; le aree grafiche della dock restano di 24 dp.

- Home → Profilo: si anima soltanto Avatar.
- Profilo → Home: si anima soltanto Home.
- Doppio tap su Home già selezionata: Home si anima una volta quando parte il refresh. La soglia esistente di 350 ms resta invariata.
- Un tap sulla pagina già selezionata e il primo avvio non avviano animazioni.
- Movimenti ridotti: icone statiche, navigazione e refresh disponibili.
- Il passaggio a un'altra pagina interrompe l'animazione uscente. Nuovi eventi accettati riavviano la riproduzione senza bloccare l'input.
- Il badge categoria degli articoli legge `CATEGORIES[].icon`, come la barra superiore, mantenendo dimensione di 17 dp, spaziatura, etichette e indicatore di selezione verificata.

Il credito Lordicon compare in Impostazioni → Informazioni e nel README. Le eventuali descrizioni sugli store devono mantenere il riconoscimento del fornitore. [Provenienza e licenza degli asset](../assets/lordicon/README.md).

## Verifiche e approvazione

TypeScript, tutti i 318 test automatici, export Android e compilazione APK universale superati sulle anteprime. I test includono attivazione della sola destinazione, refresh ripetuto, cancellazione prima del caricamento, movimenti ridotti, colore delle forme e geometria delle aree di tocco. L'utente ha confermato il funzionamento e approvato entrambe le modifiche dopo la prova delle anteprime, autorizzando poi la pubblicazione su GitHub.

La release v0.2.3 incrementa versione e build a 25, conserva pacchetto `app.synapse.reader` e chiave di firma esistente, e non introduce migrazioni dei dati. L'APK comprende ARM 32/64 bit e Intel 32/64 bit. La verifica delle librerie incluse non equivale a una prova fisica su ogni architettura.

Controlli finali sulla v0.2.3: typecheck, 318/318 test, export Android e build release universale superati. `apksigner verify` conferma la firma e il certificato delle anteprime approvate; il manifesto indica versione 0.2.3/build 25 e API minima 24. Verificate le cinque librerie native principali per ciascuna ABI e la stringa aggiornata `Lume/0.2.3` nel bundle finale. APK di 98.373.301 byte, SHA-256 `273c5f71fb2e1f73543f8b8456e5ee555e253c7cac6f21c5088d6ab857539cd7`.
