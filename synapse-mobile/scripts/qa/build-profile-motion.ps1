$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$env:TEMP=Join-Path $taskRoot '.build-temp/profile-c02';$env:TMP=$env:TEMP
$env:PATH=$env:JAVA_HOME+'\bin;'+$env:PATH
$taskPaths=@('index.ts','android/app/build.gradle','android/app/src/main/res/values/strings.xml')
$taskOriginal=@{}
foreach($taskRelative in $taskPaths){$taskFile=Join-Path $taskRoot $taskRelative;$taskOriginal[$taskRelative]=[IO.File]::ReadAllBytes($taskFile)}
Push-Location $taskRoot
try{
 [IO.File]::WriteAllText((Join-Path $taskRoot 'index.ts'),"import './scripts/qa/ProfileMotionHarness';")
 $taskGradleFile=Join-Path $taskRoot 'android/app/build.gradle'
 $taskGradle=[IO.File]::ReadAllText($taskGradleFile)
 if(!$taskGradle.Contains("applicationId 'app.synapse.reader'")){throw 'Production application identity missing'}
 [IO.File]::WriteAllText($taskGradleFile,$taskGradle.Replace("applicationId 'app.synapse.reader'","applicationId 'app.synapse.reader.profilemotionqa'"))
 $taskStringsFile=Join-Path $taskRoot 'android/app/src/main/res/values/strings.xml'
 [IO.File]::WriteAllText($taskStringsFile,[IO.File]::ReadAllText($taskStringsFile).Replace('<string name="app_name">Lume</string>','<string name="app_name">Lume · prova profilo</string>'))
 $env:SYNAPSE_STORE_PASSWORD=(Get-Content -LiteralPath '.credentials/signing.json' -Raw|ConvertFrom-Json).password
 Push-Location android
 try{& ./gradlew.bat assembleRelease --offline --no-daemon '-PreactNativeArchitectures=arm64-v8a' *> (Join-Path $taskRoot 'profile-c02-motion-qa.log');$taskExit=$LASTEXITCODE}finally{Pop-Location}
 if($taskExit -ne 0){Get-Content profile-c02-motion-qa.log -Tail 30;throw 'Motion fixture build failed'}
 Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination releases/qa/profile-c02-2026-10-13/Profile-Motion-QA.apk
 Get-Content profile-c02-motion-qa.log -Tail 6
}finally{
 foreach($taskRelative in $taskPaths){[IO.File]::WriteAllBytes((Join-Path $taskRoot $taskRelative),$taskOriginal[$taskRelative])}
 Remove-Item Env:SYNAPSE_STORE_PASSWORD -ErrorAction SilentlyContinue
 Pop-Location
}
