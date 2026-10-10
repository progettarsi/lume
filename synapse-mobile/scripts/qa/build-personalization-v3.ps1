param([switch]$Fixture)
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
$qaPath=Join-Path $taskRoot 'releases/qa/personalization-v3-2026-10-10'
$entryPath=Join-Path $taskRoot 'index.ts'
$gradlePath=Join-Path $taskRoot 'android/app/build.gradle'
$entryBytes=[IO.File]::ReadAllBytes($entryPath)
$gradleBytes=[IO.File]::ReadAllBytes($gradlePath)
$gradle=[IO.File]::ReadAllText($gradlePath)
if(!$gradle.Contains("applicationId 'app.synapse.reader'")){throw 'Restore production configuration first'}
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$env:PATH=$env:JAVA_HOME+'\bin;C:/Users/Augusto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin;'+$env:PATH
$env:SYNAPSE_STORE_PASSWORD=(Get-Content (Join-Path $taskRoot '.credentials/signing.json') -Raw|ConvertFrom-Json).password
$taskName=if($Fixture){'Fixture-Personalization'}else{'Synapse-0.1.11-personalization-v3'}
Push-Location (Join-Path $taskRoot 'android')
try {
 if($Fixture){[IO.File]::WriteAllText($entryPath,"import './scripts/qa/PersonalizationHarness';");[IO.File]::WriteAllText($gradlePath,$gradle.Replace("applicationId 'app.synapse.reader'","applicationId 'app.synapse.reader.personalizationqa'"))}
 & .\gradlew.bat assembleRelease --offline --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' *> (Join-Path $qaPath ("build-$taskName.log"))
 if($LASTEXITCODE -ne 0){throw 'Build failed; see log'}
 Copy-Item -LiteralPath 'app/build/outputs/apk/release/app-release.apk' -Destination (Join-Path $qaPath ("$taskName.apk"))
 Get-FileHash (Join-Path $qaPath ("$taskName.apk")) | Format-List
} finally {
 [IO.File]::WriteAllBytes($entryPath,$entryBytes)
 [IO.File]::WriteAllBytes($gradlePath,$gradleBytes)
 Remove-Item Env:SYNAPSE_STORE_PASSWORD
 Pop-Location
}
