param([switch]$SkipPrebuild)
$ErrorActionPreference='Stop'
$taskProject=Split-Path -Parent $PSScriptRoot
$taskSecrets=Join-Path $taskProject '.credentials'
$taskKeyStore=Join-Path $taskSecrets 'synapse-release.p12'
if(-not (Test-Path -LiteralPath $taskKeyStore)){throw 'File di firma mancante: .credentials/synapse-release.p12 non trovato.'}
if(-not $env:SYNAPSE_STORE_PASSWORD){throw 'Variabile di ambiente SYNAPSE_STORE_PASSWORD non impostata.'}
$taskVersion=(Get-Content -LiteralPath (Join-Path $taskProject 'app.json') -Raw | ConvertFrom-Json).expo.version
$taskTools=Join-Path (Split-Path -Parent $taskProject) '.mobile-tools'
$taskJava=Get-ChildItem (Join-Path $taskTools 'java') -Directory | Select-Object -First 1
if(-not $taskJava){throw 'JDK 17 non disponibile.'}
$env:JAVA_HOME=$taskJava.FullName
$env:ANDROID_HOME=Join-Path $taskTools 'android-sdk'
$taskCache=Join-Path $taskTools 'gradle-cache'
$taskShortCache=Join-Path (Split-Path -Parent $taskProject) '.g'
New-Item -ItemType Directory -Force $taskCache | Out-Null
if(-not(Test-Path -LiteralPath $taskShortCache)){New-Item -ItemType Junction -Path $taskShortCache -Target $taskCache | Out-Null}
$env:GRADLE_USER_HOME=$taskShortCache
$env:ANDROID_USER_HOME=Join-Path $taskTools 'android-user'
New-Item -ItemType Directory -Force $env:ANDROID_USER_HOME | Out-Null
$env:PATH="$env:JAVA_HOME\bin;"+$env:PATH
if(-not (Test-Path (Join-Path $env:ANDROID_HOME 'licenses/android-sdk-license'))){throw 'Prima della compilazione occorre accettare la licenza Android SDK.'}
Push-Location $taskProject
try{
  if(-not $SkipPrebuild){
    node node_modules/expo/bin/cli prebuild --platform android --no-install
    if($LASTEXITCODE -ne 0){throw 'Preparazione Android non riuscita.'}
  }
  $taskSdkEscaped=$env:ANDROID_HOME.Replace('\','/');"sdk.dir=$taskSdkEscaped" | Set-Content -LiteralPath android/local.properties
  # Cached Ninja dependency paths from the old Gradle location exceed Windows MAX_PATH.
  $taskMigration=Join-Path $taskTools 'short-cache.ready'
  if(-not(Test-Path -LiteralPath $taskMigration)){
    $taskPrefix=[IO.Path]::GetFullPath($taskProject).TrimEnd('\')+'\'
    foreach($taskRelative in @('android/app/.cxx','node_modules/react-native-worklets/android/.cxx','node_modules/react-native-reanimated/android/.cxx','node_modules/expo-modules-core/android/.cxx','node_modules/react-native-gesture-handler/android/.cxx')){
      $taskBuildRoot=Join-Path $taskProject $taskRelative
      if(Test-Path -LiteralPath $taskBuildRoot){Get-ChildItem -LiteralPath $taskBuildRoot -Filter '.ninja_deps' -Recurse -File | ForEach-Object {
        $taskResolved=[IO.Path]::GetFullPath($_.FullName)
        if(-not $taskResolved.StartsWith($taskPrefix,[StringComparison]::OrdinalIgnoreCase)){throw 'Cache del compilatore fuori dal progetto.'}
        Remove-Item -LiteralPath $taskResolved
      }}
    }
  }
  Push-Location android
  try{ & ./gradlew.bat assembleRelease --no-daemon '-PreactNativeArchitectures=arm64-v8a,x86_64';if($LASTEXITCODE -ne 0){throw 'Compilazione Android non riuscita.'} }finally{Pop-Location}
  New-Item -ItemType Directory -Force releases | Out-Null
  Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination "releases/Synapse-$taskVersion.apk" -Force
  'Gradle cache uses the short workspace junction.' | Set-Content -LiteralPath $taskMigration
  Write-Output "APK pronto in releases/Synapse-$taskVersion.apk"
}finally{Pop-Location}
