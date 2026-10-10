# Build the isolated fixture APK with the already installed Android toolchain.
# Does not install anything, touch phone settings, or access application data.
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
$qaPath=Join-Path $taskRoot 'releases/qa/gemini-dwell-2026-10-09'
$entryPath=Join-Path $taskRoot 'index.ts'
$gradlePath=Join-Path $taskRoot 'android/app/build.gradle'
$entryBytes=[IO.File]::ReadAllBytes($entryPath)
$gradleBytes=[IO.File]::ReadAllBytes($gradlePath)
$stringsPath=Join-Path $taskRoot 'android/app/src/main/res/values/strings.xml'
$stringsBytes=[IO.File]::ReadAllBytes($stringsPath)
$gradle=[IO.File]::ReadAllText($gradlePath)
if([IO.File]::ReadAllText($entryPath).Contains('GeminiHarness') -or !$gradle.Contains("applicationId 'app.synapse.reader'")){throw 'Restore the production entry/config before building the QA harness.'}
New-Item -ItemType Directory -Force $qaPath | Out-Null
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$env:PATH=$env:JAVA_HOME+'\bin;'+$env:PATH
$env:SYNAPSE_STORE_PASSWORD=(Get-Content (Join-Path $taskRoot '.credentials/signing.json') -Raw|ConvertFrom-Json).password
Push-Location (Join-Path $taskRoot 'android')
try {
 [IO.File]::WriteAllText($stringsPath,[IO.File]::ReadAllText($stringsPath).Replace('<string name="app_name">Synapse</string>','<string name="app_name">Synapse Gemini QA</string>'))
 [IO.File]::WriteAllText($entryPath,"import './scripts/qa/GeminiHarness';")
 [IO.File]::WriteAllText($gradlePath,$gradle.Replace("applicationId 'app.synapse.reader'","applicationId 'app.synapse.reader.geminiqa'"))
 & .\gradlew.bat assembleRelease --offline --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' *> (Join-Path $qaPath 'build-harness.log')
 if($LASTEXITCODE -ne 0){throw 'QA build failed; see build-harness.log.'}
 Copy-Item -LiteralPath 'app/build/outputs/apk/release/app-release.apk' -Destination (Join-Path $qaPath 'Synapse-Gemini-QA.apk')
} finally {
 [IO.File]::WriteAllBytes($stringsPath,$stringsBytes)
 [IO.File]::WriteAllBytes($entryPath,$entryBytes)
 [IO.File]::WriteAllBytes($gradlePath,$gradleBytes)
 Remove-Item Env:SYNAPSE_STORE_PASSWORD
 Pop-Location
}
Write-Output (Join-Path $qaPath 'Synapse-Gemini-QA.apk')
