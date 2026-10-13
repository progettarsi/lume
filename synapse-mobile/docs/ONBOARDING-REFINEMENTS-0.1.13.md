# Rifiniture onboarding 0.1.13 — 13 ottobre 2026

La foto profilo usa nuovamente un’immagine nativa ordinaria, subito collegata alla foto selezionata. Si animano soltanto le didascalie «Aggiungi/Modifica foto profilo» e l’inserimento/rimozione del comando di rimozione con lo spazio circostante. Nessun livello fotografico nascosto o dissolvenza dell’immagine.

Le categorie della personalizzazione hanno una maschera di trasparenza sul contenuto, senza sovrapporre il colore dello sfondo. La sfumatura superiore segue lo scorrimento; quella inferiore scompare quando tutti gli elementi sono raggiunti. Le forme decorative rimangono indipendenti. Dipendenza nativa: masked-view 0.3.2; modalità software Android necessaria per aggiornare una maschera animata, come documentato dal [progetto](https://github.com/callstack/masked-view).

Nel tutorial ciascun rettangolo selezionato cresce nel proprio spazio e gli altri si contraggono. I titoli vengono misurati completi prima di mostrare la prima lettera: ogni riga è rivelata nella posizione definitiva. Il sottotitolo segue con una transizione l’altezza del titolo completo, recuperando lo spazio nelle tappe Categorie e Salvati. Il testo Categorie descrive correttamente la barra della Home, senza attribuire al badge dell’articolo un’apertura inesistente.

Verifica automatica: typecheck, compilazione test e 243 test superati. Quattro nuove verifiche coprono maschera dinamica, geometria preventiva/rientro tra titoli di una e due righe, rettangoli della dock reversibili e foto diretta con soli comandi animati.

Verifica fisica già effettuata nella copia isolata sul Galaxy S23: maschera all’inizio, durante lo scorrimento e al fondo; conservazione della foto sintetica dopo riavvio; spazio tra titoli e sottotitoli e ritorno tutorial → personalizzazione → identità. Le catture refinement-* sono in releases/qa/onboarding-integration-0.1.13. La precedente tavola della dissolvenza fotografica è superata dalla correzione richiesta dall’utente. La verifica della nuova versione con foto diretta e la consegna sono registrate sotto a completamento.

La prova fotografica finale usa un paesaggio sintetico distinguibile da un’icona: `refinement-photo-landscape-visible.png` dopo la sostituzione e `refinement-photo-landscape-restart.png` dopo un cold start della copia QA. La spunta delle catture precedenti era essa stessa il bitmap di prova selezionato, non un overlay. Entrambe le immagini sono fixture della copia QA; nessun profilo dell’app principale è stato sostituito.

La nuova esportazione Android è riuscita. Durante il controllo del ritorno dall’identità è stata aggiunta anche l’opacità coordinata del pulsante Salta nome/foto, per impedirne residui sopra la dock del tutorial: il pulsante persiste durante il movimento ma è visibile soltanto nella fase corretta.

La dock corretta è stata verificata fisicamente nelle tre tappe, compreso il ritorno Feed → Categorie → Salvati: `refinement-categorie-verified.png`, `refinement-feed-verified.png`, `refinement-categorie-from-feed.png`, `refinement-salvati-verified.png`. Nessun pulsante Salta nel tutorial; la freccia esterna conserva la funzione concordata. La tavola `refinement-dock-motion-final-board.png`, catturata prima della correzione, documenta il difetto e NON rappresenta la versione consegnata.

Limiti: questa rifinitura ripete la verifica su Galaxy S23 in tema chiaro e con font normale; non ripete l’intero setup in tema scuro, TalkBack, iOS, rete offline o tutti i permessi. Movimento ridotto e sospensione delle nuove animazioni sono coperti dai controlli automatici.

Consegna: Synapse 0.1.13, versionCode 18. APK firmato `releases/Synapse-0.1.13-build18.apk`; SHA256 `1fce0994e6afd5e5fa1f9c55649a2dc658fcd5c77e321562163b820ca891dee9`. Certificato di firma identico alla build 17: `fb5a08f89ecdedaa90c7f94ce9aa7a8b11ca6a5d74f4b0341ff611a06ee98c6a`. Installato con aggiornamento conservativo sul telefono; package e versione confermati, cold start Home controllato. Build 17 conservata. Copia QA build 18 lasciata sulla schermata identità con il paesaggio sintetico; file di prova condivisi nella galleria rimossi, copia privata dell’app mantenuta. Nessun dato dell’app principale cancellato. I lavori preesistenti su Home/rail/settings e la configurazione di orchestrazione restano fuori dal commit.

Ulteriore controllo al ritorno dal tutorial: la doppia didascalia sovrapposta poteva conservare «Aggiungi» con una foto presente. Sostituita con una sola didascalia, il cui contenuto dipende sempre dalla foto corrente e la cui entrata è animata. Il controllo verifica anche che non esista una seconda etichetta contraddittoria.

Verifica finale del caso: dopo identità → personalizzazione → tutorial → personalizzazione → identità, foto presente e unica didascalia «Modifica foto profilo» corretta (`refinement-identity-caption-final.png`).
