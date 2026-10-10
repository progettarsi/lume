# Isolated native and web QA; always restores the production entry and package.
$ErrorActionPreference='Stop'
$taskRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
$qaPath=Join-Path $taskRoot 'releases/qa/dock-messages-2026-10-09'
$entryPath=Join-Path $taskRoot 'index.ts'
$gradlePath=Join-Path $taskRoot 'android/app/build.gradle'
$entryBytes=[IO.File]::ReadAllBytes($entryPath)
$gradleBytes=[IO.File]::ReadAllBytes($gradlePath)
$gradle=[IO.File]::ReadAllText($gradlePath)
if(!$gradle.Contains("applicationId 'app.synapse.reader'")){throw 'Restore production configuration first.'}
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$nodePath='C:/Users/Augusto/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$env:PATH=$env:JAVA_HOME+'\bin;'+(Split-Path $nodePath)+';'+$env:PATH
$env:SYNAPSE_STORE_PASSWORD=(Get-Content (Join-Path $taskRoot '.credentials/signing.json') -Raw|ConvertFrom-Json).password
Push-Location $taskRoot
try {
 [IO.File]::WriteAllText($entryPath,"import './scripts/qa/DockHarness';")
 [IO.File]::WriteAllText($gradlePath,$gradle.Replace("applicationId 'app.synapse.reader'","applicationId 'app.synapse.reader.dockqa'"))
 & $nodePath node_modules/expo/bin/cli export --platform web --output-dir (Join-Path $qaPath 'web-fixtures') *> (Join-Path $qaPath 'export-fixtures.log')
 if($LASTEXITCODE -ne 0){throw 'QA export failed.'}
 Push-Location android
 try {
  & .\gradlew.bat assembleRelease --offline --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64' *> (Join-Path $qaPath 'build-fixtures.log')
  if($LASTEXITCODE -ne 0){throw 'QA build failed.'}
  Copy-Item -LiteralPath 'app/build/outputs/apk/release/app-release.apk' -Destination (Join-Path $qaPath 'Dock-fixtures.apk')
 } finally {Pop-Location}
} finally {
 [IO.File]::WriteAllBytes($entryPath,$entryBytes)
 [IO.File]::WriteAllBytes($gradlePath,$gradleBytes)
 Remove-Item Env:SYNAPSE_STORE_PASSWORD
 Pop-Location
}
