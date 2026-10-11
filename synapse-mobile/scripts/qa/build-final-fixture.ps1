param([ValidateSet('Gemini','ReaderReturn','Dock','Category')][string]$Harness='Gemini',[string]$Folder='final-verification-2026-10-09')
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
$qaPath=Join-Path $taskRoot ('releases/qa/'+$Folder)
New-Item -ItemType Directory -Force -Path $qaPath | Out-Null
$entryPath=Join-Path $taskRoot 'index.ts'
$gradlePath=Join-Path $taskRoot 'android/app/build.gradle'
$stringsPath=Join-Path $taskRoot 'android/app/src/main/res/values/strings.xml'
$entryBytes=[IO.File]::ReadAllBytes($entryPath)
$gradleBytes=[IO.File]::ReadAllBytes($gradlePath)
$stringsBytes=[IO.File]::ReadAllBytes($stringsPath)
$gradle=[IO.File]::ReadAllText($gradlePath)
if(!$gradle.Contains("applicationId 'app.synapse.reader'")){throw 'Restore production configuration first'}
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$env:PATH=$env:JAVA_HOME+'\bin;C:/Users/Augusto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin;'+$env:PATH
$env:SYNAPSE_STORE_PASSWORD=(Get-Content (Join-Path $taskRoot '.credentials/signing.json') -Raw|ConvertFrom-Json).password
Push-Location (Join-Path $taskRoot 'android')
try {
 [IO.File]::WriteAllText($stringsPath,[IO.File]::ReadAllText($stringsPath).Replace('<string name="app_name">Synapse</string>','<string name="app_name">Synapse verifica</string>'))
 [IO.File]::WriteAllText($entryPath,"import './scripts/qa/${Harness}Harness';")
 [IO.File]::WriteAllText($gradlePath,$gradle.Replace("applicationId 'app.synapse.reader'","applicationId 'app.synapse.reader.finalqa'"))
 & .\gradlew.bat assembleRelease --offline --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' *> (Join-Path $qaPath ("build-$Harness.log"))
 if($LASTEXITCODE -ne 0){throw 'Fixture build failed'}
 Copy-Item -LiteralPath 'app/build/outputs/apk/release/app-release.apk' -Destination (Join-Path $qaPath ("Fixture-$Harness.apk"))
} finally {
 [IO.File]::WriteAllBytes($stringsPath,$stringsBytes)
 [IO.File]::WriteAllBytes($entryPath,$entryBytes)
 [IO.File]::WriteAllBytes($gradlePath,$gradleBytes)
 Remove-Item Env:SYNAPSE_STORE_PASSWORD
 Pop-Location
}
