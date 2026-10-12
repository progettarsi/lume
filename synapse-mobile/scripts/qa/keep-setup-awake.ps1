param([string]$Phone='R5CW81QWV1F')
$taskAdb=Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '../.mobile-tools/android-sdk/platform-tools/adb.exe'
for($taskTick=0;$taskTick -lt 24;$taskTick++) {
 & $taskAdb -s $Phone shell input tap 540 12 | Out-Null
 Start-Sleep -Seconds 240
}
