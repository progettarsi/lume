#requires -Version 7.4
[CmdletBinding()]
param([Parameter(Mandatory)][string]$TaskFile,
    [string]$Repository = (Resolve-Path "$PSScriptRoot/../../..").Path,
    [switch]$DryRun)
$PSBoundParameters['Repository'] = $Repository
& "$PSScriptRoot/forward-shared.ps1" -Name 'consult-astra.ps1' -Arguments $PSBoundParameters
exit $LASTEXITCODE
