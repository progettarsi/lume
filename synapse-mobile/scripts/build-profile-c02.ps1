$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
if(![IO.File]::ReadAllText((Join-Path $taskRoot 'index.ts')).Contains("import App from './App'")){throw 'Production entry required'}
if(![IO.File]::ReadAllText((Join-Path $taskRoot 'android/app/build.gradle')).Contains("applicationId 'app.synapse.reader'")){throw 'Production package required'}
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$env:TEMP=Join-Path $taskRoot '.build-temp/profile-c02';$env:TMP=$env:TEMP
$env:PATH=$env:JAVA_HOME+'\bin;'+$env:PATH
Push-Location $taskRoot
try{
 $env:SYNAPSE_STORE_PASSWORD=(Get-Content -LiteralPath '.credentials/signing.json' -Raw|ConvertFrom-Json).password
 Push-Location android
 try{& ./gradlew.bat assembleRelease --offline --no-daemon '-PreactNativeArchitectures=arm64-v8a' *> (Join-Path $taskRoot 'profile-c02-apk.log');$taskExit=$LASTEXITCODE}finally{Pop-Location}
 if($taskExit -ne 0){Get-Content profile-c02-apk.log -Tail 30;throw 'Production build failed'}
 $taskApk=Join-Path $taskRoot 'releases/Lume-0.1.13-profile-C02-A.apk'
 Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination $taskApk
 $taskHash=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLowerInvariant()
 [IO.File]::WriteAllText($taskApk+'.sha256',$taskHash+"  Lume-0.1.13-profile-C02-A.apk`n")
 Get-Content profile-c02-apk.log -Tail 6
}finally{Remove-Item Env:SYNAPSE_STORE_PASSWORD -ErrorAction SilentlyContinue;Pop-Location}
