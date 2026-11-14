#requires -Version 7.4
param([string]$Name, [System.Collections.IDictionary]$Arguments)
$ErrorActionPreference = 'Stop'
try {
    if ($Name -notin @('delegate-agy.ps1','consult-astra.ps1','apply-proposal.ps1','record-outcome.ps1','statistics.ps1','tests/run.ps1')) { throw 'Unknown shared command.' }
    $orchestrationHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex' }
    $command = Join-Path $orchestrationHome ('tools/agent-orchestration/' + $Name)
    if (-not (Test-Path -LiteralPath $command -PathType Leaf)) { throw 'Shared orchestration unavailable. Continue directly with Sol.' }
    & $command @Arguments
    if (-not $? -or $LASTEXITCODE -ne 0) { exit 1 }
    exit 0
} catch {
    @{status='blocked';reason=$_.Exception.Message;retry=$false} | ConvertTo-Json -Compress
    exit 1
}
