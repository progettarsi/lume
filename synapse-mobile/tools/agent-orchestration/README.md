# Integrazione Synapse

Il motore unico è in `$CODEX_HOME/tools/agent-orchestration` (default `~/.codex`). Le istruzioni operative e le protezioni sono nel suo README; `VALIDATION.md` qui conserva la storia delle prove precedenti.

I comandi `delegate-agy.ps1`, `consult-astra.ps1`, `apply-proposal.ps1`, `record-outcome.ps1`, `statistics.ps1` e `tests/run.ps1` restano compatibili, ma inoltrano alla copia condivisa. Nessuna dipendenza aggiuntiva. Se l'installazione manca o la root non è autorizzata, la delega si blocca e Sol lavora direttamente.

`config.json` contiene soltanto il perimetro specifico di Synapse: lettura di sorgenti, test, documentazione e guida nativa; proposte su componenti, contenuti, test e documentazione. Feed e personalizzazione protetti non sono target delegabili. Le regole di prodotto, rete/cache, migrazioni, motion e verifica rimangono in `synapse-mobile/AGENTS.md`; il prototipo mantiene la propria guida.

La root autorizzata è Scrolls. Il registro condiviso pone un tetto alle directory consentite: modificare la configurazione del repository non può ampliarlo. Una modifica del tetto richiede una richiesta esplicita dell'utente.

La directory `.runtime` originale rimane qui: log, backup, hash, lock, statistiche e prenotazioni Astra non vengono spostati o cancellati. Le vecchie proposte senza il nuovo manifest di integrità possono essere consultate e registrate, ma non applicate: serve una nuova proposta revisionata. L'archivio della migrazione conserva i byte dei wrapper originali fuori dal repository.

Non è stato modificato alcun file applicativo. I controlli app previsti dalla guida nativa continuano a valere quando si modifica il prodotto.
