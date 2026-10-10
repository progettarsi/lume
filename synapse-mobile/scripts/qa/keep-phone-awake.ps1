param([Parameter(Mandatory)][string]$StopFile,[Parameter(Mandatory)][string]$LogFile)
$taskProject=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskAdb=Join-Path (Split-Path $taskProject -Parent) '.mobile-tools/android-sdk/platform-tools/adb.exe'
$taskDeadline=(Get-Date).AddHours(3)
while(!(Test-Path -LiteralPath $StopFile) -and (Get-Date) -lt $taskDeadline){
 Start-Sleep -Seconds 30
 if((Get-Date) -lt $taskNextTouch){continue}
 $taskFocus=& $taskAdb shell dumpsys window | Select-String mCurrentFocus
 if($taskFocus -match 'app.synapse.reader(?:\.[a-z]+)?/'){
  # Empty far-right edge just below the status bar; never a navigation target.
  & $taskAdb shell input tap 1040 110
  Add-Content -LiteralPath $LogFile -Value ((Get-Date).ToUniversalTime().ToString('o')+' neutral touch')
 }
 $taskNextTouch=(Get-Date).AddMinutes(4)
}
