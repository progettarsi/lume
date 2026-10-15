#requires -Version 7.4
[CmdletBinding()]
param([Parameter(Mandatory)][string]$ResultFile,
    [Parameter(Mandatory)][ValidateSet('accepted','corrected','rejected')][string]$Outcome,
    [Parameter(Mandatory)][string]$Checks,
    [ValidateRange(0,1440)][int]$ReviewMinutes = 0)
& "$PSScriptRoot/forward-shared.ps1" -Name 'record-outcome.ps1' -Arguments $PSBoundParameters
exit $LASTEXITCODE
