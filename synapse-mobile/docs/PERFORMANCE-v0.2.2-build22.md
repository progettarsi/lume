# Lume v0.2.2, build 23 — correzioni mirate di interazione e performance

15 ottobre 2026. Segue il riscontro dell'utente sui sette problemi della build 21.
La precedente consegna verificava l'avvio, ma non il collaudo di interazione:
quel controllo non era sufficiente a escludere i problemi ora segnalati.

## Correzioni

1. **Navbar e profilo.** Le due aree cliccabili ora hanno geometria determinata
   dalla destinazione, indipendente dalle celle decorative animate. Non cambiano
   larghezza/posizione durante la molla. Animazione avviata nel layout effect e
   cancellata alla sostituzione; scene inattive sotto quella attiva, ritagliate
   nel viewport ed escluse da tocchi/accessibilità anche sul contenitore animato.

2. **Feed senza pagine vuote.** Soluzione proposta e approvata dall'utente:
   il pager nativo può raggiungere soltanto pagine già montate da React. Se il
   caricamento o React sono in ritardo, la scheda corrente rimane leggibile.
   Quando il feed elimina le posizioni passate, vengono riallineati insieme
   offset, destinazione, ancora e origine della gesture in corso. Anche la
   riduzione del numero di articoli corregge il cursore su una scheda esistente.
   Rimangono rifornimento dai contenuti locali prima della rete, soglia anticipata
   a 12 posizioni e budget di rete esistenti; nessuna nuova richiesta illimitata.

3. **Segnalibro.** Il contenitore dell'intestazione Home non intercetta più
   l'area lasciata libera dalle categorie nascoste, che coincide con i metadati e
   il pulsante Salva. Il glifo pieno/vuoto segue direttamente il booleano salvato:
   eliminata la maschera con altezza animata che poteva perdere il riempimento.
   Restano feedback di pressione e gestione persistente/ottimistica dei dati.

4. **Avvio e costo dei ricalcoli.** La prima selezione online prepara una scheda
   locale, senza completare l'ordinamento di tutta la riserva prima di mostrare
   contenuto. La riserva viene poi ampliata dal normale caricamento. Le edizioni
   del catalogo invariate mantengono gli stessi oggetti. Gli avanzamenti che non
   cambiano i punteggi filtrano subito gli ID consumati dalla riserva già ordinata;
   il ricalcolo riparte quando scende sotto 20 o cambiano contenuti/pesi.
   I ricalcoli futuri sono accorpati e differiti, senza bloccare le scritture del
   profilo. Avvio del motore, font e lettura/migrazioni necessarie dell'archivio
   restano obbligatori: non si dichiara un tempo zero né si salta la durabilità.

5. **Categorie.** La vista di una categoria classifica per priorità soltanto i
   candidati appartenenti a quella categoria. Non ordina 150 voci estranee per
   scartarle subito dopo. Pesi, classificazione semantica e fonti non cambiano.

6. **Auto-hide disattivato.** Contenimento delle scene e separazione dei tocchi
   dell'intestazione applicati a entrambe le modalità; il ripristino della barra
   usa la geometria già presente. Collaudo pratico di entrambe le impostazioni
   ancora da completare prima di dichiarare risolti tutti i glitch.

7. **Apertura articoli.** Il nodo misurato della scheda Home è esplicitamente
   non collassabile su Android. Le misure nulle/non finite usano una geometria
   valida, evitando divisioni per zero e origini non disegnabili del lettore.
   Da confermare con il lettore nativo, oltre ai test di contratto.

## Verifiche automatiche

- TypeScript superato; **314/314 test** superati, nessun test saltato.
- Nuovi casi: trim durante una nuova gesture, swipe che superano il ritmo dei
  commit React, feed accorciato, tocchi navbar indipendenti dalla molla,
  conservazione degli oggetti del catalogo, filtro sincrono dei consumati e
  riduzione dei ricalcoli, selezione categoria limitata ai propri candidati.
- I tre nuovi casi del pager sono stati eseguiti anche sui sorgenti della build
  21 conservati nello snapshot: falliscono tutti e tre, mentre i cinque casi
  precedenti continuano a passare. Sulla build 22 passano tutti e otto.
- Test segnalibro aggiornato: stato grafico direttamente derivato dal salvataggio,
  comprese ripetizioni e cambiamenti salvato/non salvato.
- Primo segmento dell'ordinamento limitato identico all'ordinamento completo;
  confronto prima/dopo dell'ordine iniziale della riserva e del futuro superato.
- Contratti preesistenti di rete, cache, SQLite, ranking, Gemini opzionale,
  onboarding, lettore e contenuti inclusi ancora superati.
- Export Android Hermes e APK di produzione arm64 riusciti, firma verificata e
  identica a quella precedente. Nessuna modifica a chiave/password di rilascio.

### Confronto riproducibile sul PC

Sorgenti precedenti conservati in `.build-temp/performance-022/before` e compilati
separatamente. Stesso catalogo di 150 articoli; una riserva iniziale e dieci
avanzamenti che registrano solo gli ID consumati, senza cambiare i punteggi.

| Misura | Build 21 | Build 22 |
| --- | ---: | ---: |
| Ordinamenti della riserva, incluso quello iniziale | 11 | 1 |
| Oggetti invariati conservati dopo un aggiornamento del catalogo | 0/150 | 150/150 |
| Tempo del ciclo di dieci avanzamenti, escluso il primo ordinamento | 255,151 ms | 0,498 ms |

Questi tempi appartengono a Node sul PC, a un singolo campione locale. Non sono
FPS, latenza di tocco o misura dell'avvio del Galaxy S23. Evidenza e procedura
locale in `.build-temp/performance-022/benchmark.json` e `benchmark.cjs`.

## Aggiornamento durante il collaudo sul telefono

Sulla build 22 è stato riprodotto un ulteriore blocco dopo la chiusura del
lettore: la superficie residua restava sopra la Home, intercettando i tocchi.
Un secondo comando Indietro liberava la schermata. La build 23 consente il
completamento del ritorno quando la progressione è entro 0,001 dall'endpoint,
senza aspettare uno zero esatto. Il caso è coperto dal test di contratto;
la verifica nativa della nuova correzione resta da eseguire.

Il log della build 22 registra 12.161 ms per l'inizializzazione della libreria,
con 128 ms fino alla lettura iniziale dell'archivio e 6.681 ms fino al termine
dell'idratazione. La build 23 indicizza una volta gli alias delle categorie e
usa la conversione Unicode standard per le minuscole nei percorsi ripetuti di
classificazione/ranking. Per l'italiano mantiene la stessa normalizzazione:
test di equivalenza di tutti gli alias e campioni Unicode superato. Migrazioni,
identità delle fonti e pesi del profilo restano invariati. Il tempo di avvio
della build 23 non è stato ancora misurato in modo completo.

## Installazione e prove native

- **Build 23 installata**, aggiornamento con conservazione dati sul Galaxy S23
  dispositivo di collaudo: Success. Versione utente 0.2.2, pacchetto app.synapse.reader.
- APK: releases/Lume-0.2.2.apk.
- SHA-256: f5b7f9d0bcd07207d64f1c2bab31f03e29faaa403b44579157dfe80a46d440fe.
- Export Android Hermes e compilazione APK riusciti; 314/314 test e TypeScript
  superati prima della compilazione. Stessa configurazione di firma preservata.
- L'avvio dell'Activity build 23 riporta 633 ms; questa misura Android non è
  il tempo fino al primo articolo leggibile. La prima cattura dell'interfaccia
  dopo l'avvio contiene la Home e un articolo.
- Build 22, prove effettive: apertura di Effetto Stroop; salvataggio con icona
  piena e stato conservato tornando alla Home; successiva rimozione dalla Home
  e ripristino del totale originale di 4 salvati. Dopo la chiusura del lettore
  è comparso il blocco descritto sopra: non dichiarare riusciti i tentativi di
  navigazione intercettati da quella superficie.
- Recuperata la schermata, il click Profilo mostrava il profilo e i salvataggi,
  cronologia e impostazioni. Selezione Psicologia con articolo Riflesso
  condizionato verificata.
- Trenta swipe con auto-hide disattivato: catture a 10/20/30 avanzamenti con
  scheda leggibile, senza Home vuota nei punti osservati. Schermata finale
  senza sovrapposizioni persistenti nella cattura esaminata. Non è una misura
  continua di fluidità e non completa il collaudo delle animazioni.
- **Test interrotti su richiesta dell'utente**, che prosegue il collaudo.
  Nessun altro comando sul telefono dopo la richiesta di pausa.

Restano da verificare sulla build 23: chiusure/riaperture ripetute del lettore,
navbar dopo il lettore e inversioni rapide, salvataggi ripetuti e dopo riavvio,
scorrimento prolungato, categorie, entrambe le modalità di auto-hide e avvio.
L'auto-hide era inizialmente attivo ed è tuttora disattivato per le prove;
l'utente ne è informato al passaggio di consegne. Nessun ripristino automatico
sul telefono dopo la richiesta di pausa.

Nessuna cancellazione dati, disinstallazione, reset del profilo, commit o push.
Prototipo ../synapse invariato. Nome e foto non modificati; il salvataggio di
prova è stato rimosso, tornando ai 4 salvati iniziali. Le prove hanno aggiunto
una lettura alla cronologia e registrato gli avanzamenti del feed.
## Approvazione e rilascio universale

Il 15 ottobre 2026 l'utente ha confermato che la patch funziona e ha autorizzato
l'aggiornamento di GitHub e la release. La build 24 mantiene i sorgenti applicativi
della build 23 e include tutte e quattro le ABI Android. Note aggiornate in
[RELEASE-v0.2.2.md](RELEASE-v0.2.2.md). Il precedente elenco delle prove residue
registra il punto in cui i test dell'agente sono stati sospesi, prima del
collaudo e dell'approvazione comunicati dall'utente.

Verifica pacchetto universale build 24: 97.910.877 byte; SHA-256

ba522bfdc500e130df076bf5a0cb0be58d969289b31b9cf6d7e058054a837632

Firma identica alla build 23. Confermate 20 librerie native per ciascuna ABI,
con intestazioni ELF della classe e della macchina corrette; Hermes, React Native,
moduli applicativi, Reanimated e Worklets presenti in tutte. API minima 24.
TypeScript, 314/314 test ed export Android superati. Nessuna nuova installazione
o prova sul telefono dopo la richiesta di sospensione dei test.
