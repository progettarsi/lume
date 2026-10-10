param([string]$Folder='final-verification-2026-10-10',[string]$Package='app.synapse.reader')
$ErrorActionPreference='Stop'
$taskProject=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskADB=Join-Path (Split-Path $taskProject -Parent) '.mobile-tools/android-sdk/platform-tools/adb.exe'
$taskFolder=Join-Path $taskProject ('releases/qa/'+$Folder)
New-Item -ItemType Directory -Force -Path $taskFolder | Out-Null
function Assert-App {
 if((& $taskADB shell dumpsys window | Select-String mCurrentFocus) -notmatch ([regex]::Escape($Package)+'/')){throw 'App expected in foreground; input stopped.'}
}
function Send-AppInput([string[]]$InputArgs) {
 Assert-App
 & $taskADB shell input @InputArgs
 if($LASTEXITCODE -ne 0){throw 'Input failed'}
 Assert-App
}
function Tap-Label([string]$Capture,[string]$Label) {
 [xml]$taskTree=Get-Content -LiteralPath (Join-Path $taskFolder ($Capture+'.xml')) -Raw
 $taskNodes=@($taskTree.SelectNodes('//node') | Where-Object {$_.'content-desc' -eq $Label})
 if(!$taskNodes.Count){throw "Label absent: $Label"}
 $taskBounds=$taskNodes[-1].bounds
 if($taskBounds -notmatch '^\[(\d+),(\d+)\]\[(\d+),(\d+)\]$'){throw 'Invalid bounds'}
 $taskX=([int]$Matches[1]+[int]$Matches[3])/2
 $taskY=([int]$Matches[2]+[int]$Matches[4])/2
 if([int]$Matches[3] -le [int]$Matches[1] -or [int]$Matches[4] -le [int]$Matches[2]){throw 'Invisible target'}
 Send-AppInput @('tap',([int]$taskX).ToString(),([int]$taskY).ToString())
}
function Capture-App([string]$Name,[switch]$Quiet) {
 if($Name -notmatch '^[a-z0-9-]+$'){throw 'Invalid capture name'}
 Assert-App
 Start-Sleep -Milliseconds 500
 & $taskADB shell screencap -p /sdcard/synapse-conclusive.png
 & $taskADB pull /sdcard/synapse-conclusive.png (Join-Path $taskFolder ($Name+'.png')) | Out-Null
 & $taskADB shell rm /sdcard/synapse-conclusive.xml
 & $taskADB shell uiautomator dump /sdcard/synapse-conclusive.xml > (Join-Path $taskFolder ($Name+'-capture.log'))
 if($LASTEXITCODE -eq 0){
  $taskPath=Join-Path $taskFolder ($Name+'.xml')
  & $taskADB pull /sdcard/synapse-conclusive.xml $taskPath | Out-Null
  [xml]$taskTree=Get-Content -LiteralPath $taskPath -Raw
  foreach($taskNode in $taskTree.SelectNodes('//node[@password="true"]')){$taskNode.SetAttribute('text','[redacted]')}
  $taskTree.Save($taskPath)
  if(!$Quiet){$taskTree.SelectNodes('//node') | Where-Object {($_.text -or $_.'content-desc') -and $_.password -ne 'true' -and $_.text -notmatch '[\uE000-\uF8FF]'} | Select-Object -First 35 | ForEach-Object {[pscustomobject]@{text=if($_.text.Length -gt 120){$_.text.Substring(0,120)+'…'}else{$_.text};label=$_.'content-desc';bounds=$_.bounds;checked=$_.checked}} | ConvertTo-Json -Compress}
 }
 Assert-App
}
function Measure-Dock([string]$Name,[int]$Pause=350) {
 Assert-App
 & $taskADB shell dumpsys gfxinfo $Package reset > (Join-Path $taskFolder ($Name+'-reset.txt'))
 $taskWatch=[Diagnostics.Stopwatch]::StartNew()
 for($taskPair=0;$taskPair -lt 8;$taskPair++){
  Send-AppInput @('tap','350','2170'); Start-Sleep -Milliseconds $Pause
  Send-AppInput @('tap','575','2170'); Start-Sleep -Milliseconds $Pause
 }
 $taskWatch.Stop()
 & $taskADB shell dumpsys gfxinfo $Package framestats > (Join-Path $taskFolder ($Name+'-gfx.txt'))
 @{actions=16;requestedPauseMs=$Pause;elapsedMs=$taskWatch.ElapsedMilliseconds;video=$false;package=$Package} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskFolder ($Name+'-protocol.json'))
 Select-String -Path (Join-Path $taskFolder ($Name+'-gfx.txt')) -Pattern 'Total frames|Janky frames:|50th percentile|95th percentile|99th percentile' | Select-Object -First 5
 Capture-App $Name
}
function Measure-Reader([string]$Name) {
 Assert-App
 $taskPid=(& $taskADB shell pidof $Package).Trim()
 & $taskADB shell dumpsys gfxinfo $Package reset > (Join-Path $taskFolder ($Name+'-reset.txt'))
 & $taskADB shell atrace --async_start -b 32768 gfx view sched freq -a $Package > (Join-Path $taskFolder ($Name+'-trace-start.txt'))
 # One shell preserves identical cadence and alternating displacement.
 & $taskADB shell 'i=0; while [ $i -lt 8 ]; do input swipe 500 1800 500 600 200; input swipe 500 600 500 1800 200; i=$((i+1)); done'
 & $taskADB shell atrace --async_stop > (Join-Path $taskFolder ($Name+'-atrace.txt'))
 & $taskADB shell dumpsys gfxinfo $Package framestats > (Join-Path $taskFolder ($Name+'-gfx.txt'))
 @{pid=$taskPid;actions=16;swipeMs=200;alternating=$true;video=$false;package=$Package} | ConvertTo-Json | Set-Content (Join-Path $taskFolder ($Name+'-protocol.json'))
 Select-String -Path (Join-Path $taskFolder ($Name+'-gfx.txt')) -Pattern 'Total frames|Janky frames:|50th percentile|95th percentile|99th percentile' | Select-Object -First 5
 Capture-App $Name
}
