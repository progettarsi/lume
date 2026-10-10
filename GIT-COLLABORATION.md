# Synapse: Git e collaborazione

## Perimetro

Un solo repository nella cartella Scrolls, con inclusione esplicita dei due
progetti. `synapse-mobile` è l'app React Native / Expo; `synapse` è il prototipo
di riferimento. Restano separati e mantengono i percorsi relativi attuali.
Gli script condivisi con il processo di build sono conservati nelle rispettive
cartelle. Leggere i relativi AGENTS.md prima di lavorare.

Sono inclusi sorgenti, test con fixture controllate, lockfile, risorse, wrapper
Gradle e configurazioni prive di segreti. Il runtime protetto del prototipo
rimane intatto; selected-design.png conserva il riferimento visivo.

Sono esclusi gli altri contenuti di Scrolls, SDK/JDK portabili, cache,
dipendenze, build/export, APK, log, archivi releases/QA, database e chiavi di
firma. Sono esclusi anche l'inventario locale e gli script QA che incorporano
identificativi del telefono. I file esclusi restano sul disco, senza cancellazioni.
Alcuni script QA storici richiedono archivi esclusi: non sono test riproducibili
da un clone pulito senza tali materiali. I normali test del package sono inclusi.

Non committare chiavi API, .credentials, configurazioni di autenticazione o dati
personali reali. Le chiavi di firma esistenti vanno conservate privatamente e
trasferite separatamente solo quando necessarie. Il debug.keystore locale è
escluso: su un nuovo clone serve rigenerarlo tramite il normale processo Expo.
Gli strumenti Android locali non sono distribuiti dal repository.

## Checkpoint preparazione: 10 ottobre 2026

- Non sono stati trovati repository Git precedenti nei progetti, nelle cartelle
  antenate o nell'albero applicativo ispezionato. Nessun remote o commit ereditato.
- Controllati tutti i file candidati con ricerca di chiavi private, token dei
  principali provider, URL con credenziali, segreti letterali e identificativi
  personali. Nessun segreto rilevato nei file ammessi; le segnalazioni residue
  riguardano percorsi locali documentati. Il controllo non garantisce l'assenza
  di ogni possibile formato di segreto.
- TypeScript dell'app: superato. Test del package: 145 superati.
- Export Android con bytecode Hermes: superato. Il primo tentativo era fallito
  per permessi sulla directory temporanea della sandbox; il secondo usa una
  directory temporanea esclusa nel workspace.
- Runtime del prototipo: verifica di integrità superata, 28 file protetti.
- Nessuna nuova compilazione APK, prova sul telefono, verifica iOS o audit
  completo delle interazioni eseguito durante questa preparazione.
- Sorgenti e configurazioni esistenti preservati: hash dei 254 file ammessi
  prima della documentazione invariati dopo i controlli.
- Il controllo whitespace del diff iniziale segnala spazi finali e righe vuote
  gia presenti nei file originali. Sono conservati, senza pulizie estranee
  alla preparazione Git.
- Account personale identificato dal connettore GitHub: `progettarsi`.
  Creazione del repository privato e push richiedono anche autenticazione Git
  locale; al checkpoint non risultano credenziali utilizzabili.

La Category Patch non è implementata. Il ramo predisposto è
`category-patch-0.1.12`, inizialmente allo stesso commit di `main`.

## Codex → Antigravity → Codex

1. Prima del passaggio, controllare `git status`, `git diff` e i file da aggiungere.
   Eseguire i controlli appropriati, registrare risultati e limiti, creare un
   commit di checkpoint e pubblicarlo sul repository privato quando disponibile.
   Comunicare ramo e SHA esatti. Non usare reset o clean per ottenere ordine.
2. Un solo agente modifica questa cartella per volta. Fermare le modifiche di
   Codex prima del lavoro di Antigravity. Per lavoro realmente parallelo usare
   cloni o worktree distinti e rami distinti.
3. Antigravity parte dal checkpoint sul ramo concordato, legge AGENTS.md,
   controlla gli eventuali cambiamenti preesistenti e termina con commit e
   resoconto delle verifiche. Nessun force push; nessuna chiave o dato personale
   nel commit. Non toccare il runtime protetto del prototipo per una patch nativa.
4. Al ritorno, Codex controlla `git status`, `git log` e
   `git diff <SHA-prima-del-passaggio>..HEAD`. Controlla anche modifiche non
   committate, nuove esclusioni, configurazioni e possibili segreti. Esegue
   typecheck, test pertinenti, export Android e verifiche dispositivo quando
   necessarie. Nessun merge o ripristino automatico di modifiche non comprese.

Prima di ogni push controllare anche i commit in uscita. Aggiungere un file a
.gitignore non lo rimuove dall'indice o dalla cronologia. Se una credenziale
compare nella cronologia, fermare il push, revocarla e concordare un percorso
sicuro: per esempio un export pulito in un nuovo repository, conservando la
cronologia locale. Non riscrivere o forzare la cronologia senza accordo.

Nessuna automazione o pipeline CI è stata configurata.
