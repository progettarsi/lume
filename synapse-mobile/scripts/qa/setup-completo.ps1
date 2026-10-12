param([switch]$Ricomincia,[string]$Telefono)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskAdb=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools/android-sdk/platform-tools/adb.exe'
# This script can operate only on the disposable full-setup application.
$taskPackage='app.synapse.reader.setupqa'
if(!$Telefono){
 $taskDevices=@(& $taskAdb devices | Where-Object {$_ -match '^\S+\s+device$'} | ForEach-Object {($_ -split '\s+')[0]})
 if($taskDevices.Count -ne 1){throw 'Collega un solo telefono, oppure specifica -Telefono con il suo identificativo.'}
 $Telefono=$taskDevices[0]
}
$taskInstalled=& $taskAdb -s $Telefono shell pm path $taskPackage
if($LASTEXITCODE -ne 0 -or $taskInstalled -notmatch '^package:'){throw 'Installa prima Setup-QA.apk.'}
if($Ricomincia){
 & $taskAdb -s $Telefono shell am force-stop $taskPackage
 $taskResult=& $taskAdb -s $Telefono shell pm clear $taskPackage
 if($LASTEXITCODE -ne 0 -or $taskResult -notmatch 'Success'){throw 'Impossibile ricominciare la prova.'}
}
& $taskAdb -s $Telefono shell am start -W -n ($taskPackage+'/app.synapse.reader.MainActivity')
if($LASTEXITCODE -ne 0){throw 'Impossibile aprire Synapse setup QA.'}
Write-Output $(if($Ricomincia){'Setup di prova riavviato dal benvenuto.'}else{'Synapse setup QA aperta: riprende dal punto salvato.'})
