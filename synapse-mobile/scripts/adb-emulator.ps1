# Every invocation ensures that the dedicated emulator is booted first.
# All arguments are forwarded to ADB with an explicit emulator serial.
$ErrorActionPreference = 'Stop'
$taskForwardArgs = $args
$taskDevice = & (Join-Path $PSScriptRoot 'start-emulator.ps1')
& $taskDevice.Adb -s $taskDevice.Serial @taskForwardArgs
exit $LASTEXITCODE
