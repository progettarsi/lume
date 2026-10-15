#requires -Version 7.4
[CmdletBinding()]
param([string]$Repository = (Resolve-Path "$PSScriptRoot/../../..").Path)
$PSBoundParameters['Repository'] = $Repository
& "$PSScriptRoot/forward-shared.ps1" -Name 'statistics.ps1' -Arguments $PSBoundParameters
exit $LASTEXITCODE
