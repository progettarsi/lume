# Verifica del ritorno scelto

L’utente ha mantenuto la contrazione inversa accelerata già presente (B del vecchio confronto). Il codice corrente non contiene più selettori A/B/C o varianti alternative. Gli APK e le prove del confronto dell’8 ottobre restano riscontri storici nella relativa cartella releases; non sono artefatti di consegna.

La fixture corrente usa Reader, ArticleList e useReturnRows reali, senza rete, chiavi o dati personali. Build: scripts/qa/build-reader-return.ps1, output nella QA finale. Entry e configurazione vengono ripristinati in finally; non compilare l’app normale contemporaneamente.

Aprire il titolo da Home, Ricerca, Shuffle, Salvati o Cronologia, scorrere profondamente e chiudere. Inverti riapre la stessa istanza dopo 90 ms come stimolo di prova, senza un timer di blocco nel prodotto; controllare che finali/istanza non cambino. Grande usa font app 23, Ridotto è un override di QA e non una modifica Android. Lista ↓ prepara 500 righe; avanzare fino al target, aprirlo e verificare promozione fuori schermo senza attesa di una misura invisibile. In Salvati, rimuovere dall’interno del lettore e chiudere. Arrivo sostituisce il modello durante la chiusura: il lettore deve conservare l’edizione in rientro.

Query/focus, cache, quota e rete reali devono essere verificati nell’app normale o nel trasporto controllato separato. Le registrazioni visive non misurano FPS.
