#requires -Version 7.4
& "$PSScriptRoot/../forward-shared.ps1" -Name 'tests/run.ps1' -Arguments @{}
exit $LASTEXITCODE
