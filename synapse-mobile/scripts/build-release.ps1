$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent $PSScriptRoot
$taskConfig=(Get-Content -LiteralPath (Join-Path $taskRoot 'app.json') -Raw | ConvertFrom-Json).expo
$taskVersion=$taskConfig.version
$taskPackageVersion=(Get-Content -LiteralPath (Join-Path $taskRoot 'package.json') -Raw | ConvertFrom-Json).version
if($taskPackageVersion -ne $taskVersion){throw 'Versioni app.json e package.json non allineate.'}
$taskGradle=[IO.File]::ReadAllText((Join-Path $taskRoot 'android/app/build.gradle'))
if($taskGradle -notmatch ('versionName\s+["'']'+[regex]::Escape($taskVersion)+'["'']') -or $taskGradle -notmatch ('versionCode\s+'+$taskConfig.android.versionCode+'\b')){throw 'Versione Android non allineata: eseguire prima il prebuild.'}
$taskOriginalPassword=$env:SYNAPSE_STORE_PASSWORD
$taskSigningPassword=$taskOriginalPassword
if(-not $taskSigningPassword){$taskSigningPassword=[Environment]::GetEnvironmentVariable('SYNAPSE_STORE_PASSWORD','User')}
if(-not (Test-Path -LiteralPath (Join-Path $taskRoot '.credentials/synapse-release.p12'))){throw 'File della chiave di firma esistente non disponibile.'}
$taskSigningFile=Join-Path $taskRoot '.credentials/signing.json'
if(-not $taskSigningPassword -and (Test-Path -LiteralPath $taskSigningFile)){$taskSigningPassword=(Get-Content -LiteralPath $taskSigningFile -Raw | ConvertFrom-Json).password}
if(-not $taskSigningPassword){throw 'Password di firma non disponibile: ripristinare la copia privata o SYNAPSE_STORE_PASSWORD.'}
$taskTools=Join-Path (Split-Path $taskRoot -Parent) '.mobile-tools'
if(![IO.File]::ReadAllText((Join-Path $taskRoot 'index.ts')).Contains("import App from './App'")){throw 'Production entry required'}
if(![IO.File]::ReadAllText((Join-Path $taskRoot 'android/app/build.gradle')).Contains("applicationId 'app.synapse.reader'")){throw 'Production package required'}
$env:JAVA_HOME=(Get-ChildItem (Join-Path $taskTools 'java') -Directory|Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
$env:GRADLE_USER_HOME=Join-Path (Split-Path $taskRoot -Parent) '.g'
$env:TEMP=Join-Path $taskRoot '.build-temp/discovery-release';$env:TMP=$env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
$env:PATH=$env:JAVA_HOME+'\bin;'+$env:PATH
Push-Location $taskRoot
try{
 $env:SYNAPSE_STORE_PASSWORD=$taskSigningPassword
 Push-Location android
 try{$prevPref=$ErrorActionPreference;$ErrorActionPreference='Continue';& ./gradlew.bat assembleRelease --offline --no-daemon '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64';$taskExit=$LASTEXITCODE}finally{$ErrorActionPreference=$prevPref;Pop-Location}
 if($taskExit -ne 0){throw 'Production build failed'}
 $taskNativeApk=Join-Path $taskRoot 'android/app/build/outputs/apk/release/app-release.apk'
 $taskArchive=[IO.Compression.ZipFile]::OpenRead($taskNativeApk)
 try{
  $taskEntries=@($taskArchive.Entries.FullName)
  foreach($taskAbi in @('armeabi-v7a','arm64-v8a','x86','x86_64')){
   foreach($taskLibrary in @('libhermesvm.so','libreactnative.so','libappmodules.so','libreanimated.so','libworklets.so')){
    if($taskEntries -notcontains "lib/$taskAbi/$taskLibrary"){throw "APK universale incompleto: $taskAbi/$taskLibrary"}
   }
  }
 }finally{$taskArchive.Dispose()}
 New-Item -ItemType Directory -Force -Path (Join-Path $taskRoot 'releases') | Out-Null
 $taskApk=Join-Path $taskRoot "releases/Lume-$taskVersion.apk"
 Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination $taskApk
 $taskHash=(Get-FileHash -LiteralPath $taskApk -Algorithm SHA256).Hash.ToLowerInvariant()
 [IO.File]::WriteAllText($taskApk+'.sha256',$taskHash+"  Lume-$taskVersion.apk`n")
 Write-Output "APK pronto: $taskApk"
}finally{if($null -eq $taskOriginalPassword){Remove-Item Env:SYNAPSE_STORE_PASSWORD -ErrorAction SilentlyContinue}else{$env:SYNAPSE_STORE_PASSWORD=$taskOriginalPassword};$taskSigningPassword=$null;Pop-Location}
