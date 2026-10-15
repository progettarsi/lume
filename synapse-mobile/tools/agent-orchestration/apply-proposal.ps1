#requires -Version 7.4
[CmdletBinding()]
param([Parameter(Mandatory)][string]$ResultFile, [switch]$Reviewed)
& "$PSScriptRoot/forward-shared.ps1" -Name 'apply-proposal.ps1' -Arguments $PSBoundParameters
exit $LASTEXITCODE
