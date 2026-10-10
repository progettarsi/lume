# Collegamenti contestuali: evidenze e direzione da verificare

10 ottobre 2026. Discussione progettuale, nessuna implementazione autorizzata o eseguita.

## Preferenze espresse dall'utente

- Termini collegati distinguibili usando il font dei titoli, così da suggerire la destinazione articolo. Colore secondario o accent desaturato, non vistoso.
- Offline mostrare soltanto destinazioni realmente disponibili; proposta: distinguere disponibilità anteprima da approfondimento completo quando serve.
- Collegamenti anche nel testo Gemini finale, mediante controllo di termini effettivamente presenti e destinazioni interessanti disponibili.
- Arrivo dei collegamenti e cambio tipografico graduali, senza scatti/reflow aggressivo; funzione disattivabile.
- Possibile primo tap con anteprima flottante centrale, angoli arrotondati, ombra e sfondo sfocato; espansione successiva, conservando articolo principale e punto di lettura.

## Evidenza scientifica consultata

- Fitzsimmons et al. (2019), [The impact of hyperlinks on reading text](https://doi.org/10.1371/journal.pone.0210900): in esperimenti eye-tracking, più parole colorate non disturbano necessariamente la lettura; un singolo termine colorato è saltato meno, e collegamenti a termini poco frequenti possono aumentare rilettura. Non dimostra un vantaggio mnemonico.
- Fitzsimmons et al. (2020), [The impact of skim reading and navigation when reading hyperlinks on the web](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0239134): link usati come segnali di importanza; elaborazione lessicale diversa in skim reading e navigazione. Non equiparare attenzione locale a comprensione/memoria generale.
- Magdin et al. (2026), [Do Highlighted Keywords and Hyperlinks Improve Reading?](https://doi.org/10.3991/ijep.v16i2.59031): abstract consultato, 42 studenti, differenze non significative tra gruppi e uso limitato dei link. Studio circoscritto, non prova che ogni design sia inefficace.
- [Dunlosky et al. (2013)](https://www.psychologicalscience.org/journals/pspi/1529100612453266/): review valuta highlighting/underlining come tecniche di studio a bassa utilità generalizzabile; non coincide con link editoriali scelti dall'app.
- [Richter, Scheiter, Eitel (2016)](https://www.sciencedirect.com/science/article/pii/S1747938X15000664): signaling delle relazioni testo-immagine può aiutare apprendimento; campo diverso da termini collegati ad articoli. Non estendere direttamente a Synapse.

Conclusione: distinguere graficamente può orientare l'attenzione e la navigazione; aumento di memoria/comprensione per questa soluzione non dimostrato. Font titoli come codice coerente di destinazione è un'ipotesi progettuale sensata, da provare su riconoscimento/aspettativa, non un risultato sperimentale specifico su Newsreader/Source Sans.

## Verifica sul codice e implicazioni

html.ts conserva solo stringhe: occorre struttura span/destinazione allineata al testo selezionato. ReaderReveal.tsx disegna paragrafi in layout finale con copertura di rivelazione; cambiare font dopo paint può cambiare larghezze e a capo. Non animare continuamente fontFamily/fontSize/letterSpacing per risolverlo: richiederebbe nuova strategia misurata e rischierebbe di riaprire problemi di layout nativo già corretti.

Strategia da valutare: individuare candidati e usare font finale prima della comparsa dei paragrafi; attivare gradualmente solo colore/indicatore quando destinazione pronta. Nessun attesa obbligatoria dei link per mostrare testo. Se candidato scoperto tardivamente, conservare geometria dell'edizione già visibile e rimandare il cambio famiglia a un rendering successivo; eventuale morph locale tra layout misurati rimane D fino a prova nativa, non promesso come semplice.

Gemini: generazione -> corrispondenze sul testo finale -> validazione di destinazioni/alias non ambigui -> span -> disponibilità -> presentazione. Non riscrivere il testo generato solo per inserire nomi/link. Match lessicale non basta: alias e omonimi richiedono evidenza dalla fonte o catalogo validato. Contratto per edizione e request token, risultati tardivi scartati se contenuto cambia/reader chiude. Minimo affidabile su destinazioni già note, nessuna ricerca remota per ciascuna parola.

Anteprima: titolo e breve estratto, altezza adattiva con limite, larghezza leggibile; forma quasi quadrata quando possibile ma non rigida con font grande. Preferenza iniziale: contenuto breve senza scroll annidato, bottone esplicito Apri articolo. Se scroll interno necessario, non usare tap generico sul testo come espansione. Un solo livello di anteprima, fondo congelato, chiusura accessibile/Indietro, focus ripristinato al link; espansione e ritorno conservano padre edizione/offset. Definire se ritorno full ripristina preview (proposta: sì) prima di codificare. Peek non conta come apertura volontaria di lettura nel profilo; espansione segue normale open.

Blur: desiderio registrato, non fattibilità certificata. Non compare dipendenza expo-blur nel package ispezionato. Decisione su renderer/dependency e qualità Android da verificare con documentazione ufficiale e prova release; nessuna installazione qui. Considerare cattura statica o blur live solo dopo confronto; sfondo oscurato è fallback, non sostituzione della preferenza senza comunicarlo. Animazioni interrompibili, ridotto rispettato e niente input-lock. Disabilitazione persistita in Settings con default compatibile, niente link, matching o download dedicati quando off.

## Gate prima di implementare

1. Riconoscimento: testo con pochi link, Newsreader/colore tenue; verificare che si preveda un articolo e si riconosca interattività senza solo colore.
2. Accuratezza: 10 originali e relative revisioni, verificare ogni destinazione e rigettare ambiguità; zero associazioni inventate.
3. Movimento: due arrivi tardivi, scroll/closing/inversione/cambio font, nessuna variazione inattesa degli a capo visibili; controlli native/text-layout e prova dispositivo. Nessun nuovo benchmark eseguito.
4. Disponibilità: offline con preview disponibile, testo completo e voce assente; niente promesse sbagliate, target riletti al tap e congelati nella preview.
5. Contesto: peek -> chiudi / peek -> full -> peek -> padre, tutte le origini e Indietro; zero perdita di offset o duplicazione eventi open.
6. Accessibilità: lettura continua e ruoli link, focus modal, contrasto chiaro/scuro, font grande, movimento ridotto, funzione off.

Direzione consigliata: link discreti -> anteprima breve -> espansione esplicita. Più articolata del solo link, ma coerente col bisogno di approfondimento secondario senza perdere il filo. Nessuna garanzia cognitiva o di fluidità prima delle prove.

## Precisazione dell'utente — apertura e chiusura quick-view

Queste decisioni sostituiscono la proposta precedente di un bottone «Apri articolo»:

- Tocco sul blocco articolo della quick-view: espansione a lettore completo, come normale apertura. Nessun comando aggiuntivo visibile. La X è esclusa dall'area di espansione; attivazione accessibile equivalente sul blocco.
- Chiusura quick-view: Indietro Android, tocco sullo sfondo fuori dalla scheda, oppure X interna in alto a destra. Il tocco esterno viene assorbito dall'overlay e non attiva l'articolo sottostante. Focus e punto di lettura tornano alla parola d'origine.
- Un trascinamento non deve essere interpretato come tap. Nessun passaggio involontario al lettore al rilascio dopo scroll.
- Variante ancora da valutare, non decisione approvata: proseguire con un gesto verso l'alto oltre l'anteprima espande gradualmente la scheda fino al lettore completo. Preferire controllo del progresso dal gesto con soglia/velocità e possibilità di ritorno sotto soglia a un'apertura automatica su un piccolo overscroll. Se l'anteprima ha scroll interno, soltanto un gesto ulteriore dal suo fondo dovrebbe candidarsi all'espansione; l'inerzia dello scroll non basta. Soglie e trasferimento del gesto al lettore non fissati senza prova dispositivo.
- Ritorno da lettore espanso proposto verso la quick-view; ulteriore chiusura torna all'articolo principale. Da verificare nella prova del percorso, non implementato.
- Prima versione di riferimento: tap per espandere e tre chiusure; scroll-to-expand resta confronto sperimentale separato, rispettando movimento ridotto e inversioni.

Nessun codice modificato; aggiornamento soltanto del piano.
