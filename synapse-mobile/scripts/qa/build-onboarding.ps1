param([switch]$SkipPrebuild,[switch]$FullSetup)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
$taskQa=Join-Path $taskRoot 'releases/qa/onboarding-0.1.13'
$taskApplication=if($FullSetup){'app.synapse.reader.setupqa'}else{'app.synapse.reader.onboardingqa'}
$taskLabel=if($FullSetup){'Synapse setup QA'}else{'Synapse onboarding QA'}
$taskApk=if($FullSetup){'Setup-QA.apk'}else{'Onboarding-QA.apk'}
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$env:TEMP=Join-Path $taskRoot '.expo/onboarding-tmp';$env:TMP=$env:TEMP
$env:PATH=$env:JAVA_HOME+'\bin;'+$env:PATH
Push-Location $taskRoot
try {
 if(!$SkipPrebuild){node node_modules/expo/bin/cli prebuild --platform android --no-install *> (Join-Path $taskQa 'prebuild.log');if($LASTEXITCODE -ne 0){throw 'Prebuild failed'}}
 $taskPaths=@('index.ts','android/app/build.gradle','android/app/src/main/res/values/strings.xml')
 $taskOriginal=@{};foreach($taskPath in $taskPaths){
  $taskOriginal[$taskPath]=[IO.File]::ReadAllBytes((Join-Path $taskRoot $taskPath))
  $taskBackup=Join-Path $taskRoot ('.expo/onboarding-qa-originals/'+$taskPath)
  [IO.Directory]::CreateDirectory((Split-Path $taskBackup -Parent)) | Out-Null
  [IO.File]::WriteAllBytes($taskBackup,$taskOriginal[$taskPath])
 }
 try {
  if(!$FullSetup){[IO.File]::WriteAllText((Join-Path $taskRoot 'index.ts'),"import './scripts/qa/OnboardingHarness';")}
  elseif(![IO.File]::ReadAllText((Join-Path $taskRoot 'index.ts')).Contains("import App from './App'")){throw 'Full setup requires the real application entry'}
  $taskGradlePath=Join-Path $taskRoot 'android/app/build.gradle'
  $taskGradle=[IO.File]::ReadAllText($taskGradlePath)
  if(!$taskGradle.Contains("applicationId 'app.synapse.reader'")){throw 'Production identity missing'}
  [IO.File]::WriteAllText($taskGradlePath,$taskGradle.Replace("applicationId 'app.synapse.reader'","applicationId '"+$taskApplication+"'"))
  $taskStringsPath=Join-Path $taskRoot 'android/app/src/main/res/values/strings.xml'
  [IO.File]::WriteAllText($taskStringsPath,[IO.File]::ReadAllText($taskStringsPath).Replace('<string name="app_name">Synapse</string>',('<string name="app_name">'+$taskLabel+'</string>')))
  $env:SYNAPSE_STORE_PASSWORD=(Get-Content (Join-Path $taskRoot '.credentials/signing.json') -Raw|ConvertFrom-Json).password
  Push-Location android
  try {& ./gradlew.bat assembleRelease --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' *> (Join-Path $taskQa 'build-qa.log');if($LASTEXITCODE -ne 0){throw 'QA build failed'}}finally{Pop-Location}
  Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination (Join-Path $taskQa $taskApk)
 }finally{
  $taskRestoreErrors=@()
  foreach($taskPath in $taskPaths){
   $taskRestored=$false
   for($taskAttempt=0;$taskAttempt -lt 10;$taskAttempt++){
    try{[IO.File]::WriteAllBytes((Join-Path $taskRoot $taskPath),$taskOriginal[$taskPath]);$taskRestored=$true;break}catch{Start-Sleep -Milliseconds 200}
   }
   if(!$taskRestored){$taskRestoreErrors+=$taskPath}
  }
  Remove-Item Env:SYNAPSE_STORE_PASSWORD -ErrorAction SilentlyContinue
  if($taskRestoreErrors.Count){throw ('Restore failed; original bytes saved in .expo/onboarding-qa-originals: '+($taskRestoreErrors -join ', '))}
 }
}finally{Pop-Location}
