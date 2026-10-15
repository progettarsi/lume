# Lume v0.2.2 — verifica e correzioni, 15 ottobre 2026

Questo documento descrive la build 21. Il successivo riscontro dell'utente e la
build correttiva 23 sono documentati in [PERFORMANCE-v0.2.2-build22.md](PERFORMANCE-v0.2.2-build22.md).

## Ambito

Revisione dei percorsi di avvio, onboarding, profilo, navigazione, feed/gesture,
lettore, segnalibri e annullamento, ricerca/shuffle, rete/offline, riserva/cache,
persistenza/migrazioni, Gemini opzionale e configurazione Android di rilascio.
L'analisi del codice e i contratti automatizzati non dimostrano l'assenza di ogni
possibile crash o glitch sul dispositivo. Il collaudo pratico e l'approvazione
finale restano all'utente.

Ramo iniziale `fix/review-2026-10-14`. Conservate le modifiche locali preesistenti,
compresi App, useLibrary, design system e script/documenti di altri interventi.
Snapshot dei sorgenti precedenti in `.build-temp/review-022-before`; nessun reset,
commit o push. Prototipo `../synapse` invariato.

## Problemi corretti

| Percorso | Problema | Correzione e verifica |
| --- | --- | --- |
| Archivio nativo e migrazioni | JSON sintatticamente valido ma con campi mancanti, array errati o metadati incompleti arrivava a rendering/classificazione; poteva interrompere l'avvio. | Validazione della struttura di articoli e visite prima dell'uso. I record danneggiati restano nel database, esclusi solo dalle viste in memoria. Test SQLite con dieci forme di dati non validi, migrazioni e conservazione dei record. |
| Anteprima web | Una cronologia malformata azzerava in memoria anche gli articoli validi; valori JSON diversi da array passavano il caricamento. | Recupero indipendente di articoli e visite, stessa validazione, nessuna riscrittura dei dati sorgente durante il recupero. |
| Nome/foto del setup | La coalescenza delle bozze tratteneva nome e interessi, ma poteva scartare una foto o la sua rimozione quando arrivava subito un altro aggiornamento. | L'intenzione pendente conserva tutti i campi, compreso `photoUri: undefined`. Test con foto, nome e interessi ravvicinati e con rimozione esplicita. |
| Segnalibro Home | Il pulsante conteneva sia il tap RNGH sia l'attivazione Pressable; manteneva inoltre un callback di accessibilità separato. | Un solo Pressable possiede l'attivazione; lo swipe rimane sul feed. Mantenute geometria 24×24 del riempimento, area di tocco e stato accessibile. Test del componente; affidabilità del tocco nativo da confermare sul telefono. |
| Feedback con movimento ridotto | Il timer di un salvataggio precedente poteva nascondere il feedback appena ripetuto e sopravvivere alla scheda. | Cancellazione del timer precedente e pulizia alla chiusura/cambio di preferenza. Test di due salvataggi distanti 100 ms e dello smontaggio. |
| Fonte/licenza nel lettore | L'apertura esterna non gestiva il rifiuto del sistema quando mancava un browser disponibile. | Errore gestito nel lettore e rimozione dell'avviso al successivo tentativo riuscito; test dei due collegamenti. |
| Rilascio | Nome APK/checksum fissati alla 0.2.1 e lettura di un vecchio log anche dopo una build riuscita. | Versione letta dalla configurazione, controllo dell'allineamento nativo, cartella release creata se serve e restituzione corretta dell'esito della build. |

I test aggiunti a bozze e archivio sono stati eseguiti prima delle correzioni:
entrambi fallivano sui casi riprodotti. Dopo le correzioni passano.

## Verifiche completate

- Base prima delle modifiche: TypeScript e 299/299 test superati.
- Codice v0.2.2: TypeScript e 305/305 test superati, nessun test saltato.
- Suite comprendente rete/cancellazione/rate limit, cache e riserva offline,
  concorrenza SQLite, segnalibri e annullamento, migrazioni, ranking locale,
  onboarding, gesture, ritorno del lettore, temi/accessibilità e fallback Gemini.
- Le 150 edizioni incluse conservano testo/provenienza e superano la nuova
  validazione. Nessuna richiesta Gemini o consumo di quota AI per le verifiche.
- Worklet del loader eseguiti serializzati in un contesto separato per 35 stadi,
  congelamento e smontaggio; test già presente, rieseguito nella suite completa.
- Export Android Hermes riuscito: 1.359 moduli, bundle circa 5,1 MB.
- Controllo locale delle versioni dipendenze Expo superato in modalità offline;
  non è una verifica online di vulnerabilità o degli aggiornamenti disponibili.
- Verificata con hash la conservazione dei sorgenti non coinvolti, App e lockfile.
- Risorse native di splash, icone, palette e backup conservate dopo la generazione
  Android; differenza nativa intenzionale limitata a versione/codice.
- Versione app/package/Android: **0.2.2**, codice **21**, `app.synapse.reader`.

## Build e installazione

- APK di produzione arm64: `releases/Lume-0.2.2.apk`, 37.311.965 byte.
- Build e controllo Android `lintVitalRelease` riusciti; firma APK v2 verificata.
- SHA-256 APK: `f72364163e5e4f1fe5f36be5a6a3c6be9cb5c76bee01b904820cc69c24ccd747`.
- Certificato confrontato con l'APK prelevato dall'app effettivamente installata:
  corrispondenza confermata. Chiave/password di rilascio esistenti utilizzate
  senza modificarle o rigenerarle.
- Installazione sul Galaxy S23 (`SM_S911B`, dispositivo `dispositivo di collaudo`):
  aggiornamento tramite `adb install -r`, esito **Success**.
- Package manager del telefono: `versionName=0.2.2`, `versionCode=21`,
  ultimo aggiornamento 15 ottobre 2026 alle 15:27:31, ora locale del dispositivo.
- Nessuna disinstallazione, cancellazione dati o modifica dei contenuti utente
  eseguita per preparare l'installazione.
- Solo controllo tecnico di avvio: attività avviata con esito `ok`, processo
  rimasto attivo, nessun nuovo crash Android né errore JavaScript rilevato nel
  breve intervallo osservato. I tre crash del loader presenti nel buffer prima
  dell'aggiornamento erano ancora gli stessi tre dopo l'avvio.
- Nessun collaudo visivo, test di fluidità/FPS, prova TalkBack o approvazione
  finale effettuati dall'agente. Restano all'utente, come richiesto.

Evidenze locali escluse da Git in `.build-temp/review-022-*.log`: test iniziali e
regressioni, suite completa, prebuild, export, build e controllo dell'avvio.
Il primo tentativo di build nella sandbox non riusciva a comunicare con il
processo locale Gradle; la build effettiva è stata completata fuori dalla sandbox.

## Collaudo finale sul telefono

Senza cancellare dati o reinstallare da zero:

1. Avviare e controllare presenza di nome/foto, salvati, cronologia e preferenze.
2. Home: scorrere rapidamente e invertire lo swipe, cambiare categorie, usare
   doppio tap sulla scheda e sulla Home, provare il segnalibro in alto e riaprire
   ripetutamente il lettore durante la chiusura.
3. Profilo: aprire salvati/cronologia/impostazioni; modificare nome/foto, annullare
   e salvare; rimuovere un segnalibro con swipe e usare Annulla.
4. Ricerca e shuffle: avviare una ricerca, cambiarla rapidamente, chiudere durante
   il caricamento e aprire fonte/licenza da un approfondimento.
5. Offline e ritorno online: continuare con gli articoli disponibili, controllare
   gli avvisi e la ripresa; mettere l'app in background durante il caricamento.
6. Provare temi, dimensione testo e movimento ridotto. Gemini solo se già
   configurato volontariamente, verificando che il testo originale resti leggibile.

Il setup iniziale non va forzato cancellando il profilo esistente. Il percorso
di prima installazione e gli errori di persistenza sono coperti dai test isolati;
un collaudo nativo del setup richiede un ambiente di prova separato.
