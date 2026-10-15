param([switch]$ShowWindow, [int]$TimeoutSeconds = 240)
$ErrorActionPreference = 'Stop'
$taskWorkspace = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$taskTools = Join-Path $taskWorkspace '.mobile-tools'
$env:ANDROID_HOME = Join-Path $taskTools 'android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = Join-Path $taskTools 'android-user'
$env:ANDROID_AVD_HOME = Join-Path $env:ANDROID_USER_HOME 'avd'
$env:ANDROID_SERIAL = 'emulator-5580'
$taskAdb = Join-Path $env:ANDROID_HOME 'platform-tools/adb.exe'
$taskEmulator = Join-Path $env:ANDROID_HOME 'emulator/emulator.exe'
$taskAvd = 'Lume_API_36'
$taskRuntime = Join-Path $taskTools 'lume-emulator'
foreach ($taskRequired in @($taskAdb, $taskEmulator, (Join-Path $env:ANDROID_AVD_HOME "$taskAvd.ini"))) {
    if (-not (Test-Path -LiteralPath $taskRequired)) { throw "Setup emulatore incompleto: $taskRequired" }
}
New-Item -ItemType Directory -Force -Path $taskRuntime | Out-Null
$taskMutex = [Threading.Mutex]::new($false, 'Local\LumeEmulator5580')
$taskLocked = $false
try {
    try { $taskLocked = $taskMutex.WaitOne([TimeSpan]::FromSeconds($TimeoutSeconds)) }
    catch [Threading.AbandonedMutexException] { $taskLocked = $true }
    if (-not $taskLocked) { throw 'Timeout in attesa di un altro avvio di Lume.' }
    & $taskAdb start-server | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Avvio del server ADB non riuscito.' }
    $taskDevices = (& $taskAdb devices) -join "`n"
    if ($taskDevices -notmatch '(?m)^emulator-5580\s') {
        $taskArgs = @('-avd', $taskAvd, '-port', '5580', '-no-audio', '-no-boot-anim', '-gpu', 'auto')
        if (-not $ShowWindow) { $taskArgs += '-no-window' }
        Start-Process -FilePath $taskEmulator -ArgumentList $taskArgs -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskRuntime 'stdout.log') -RedirectStandardError (Join-Path $taskRuntime 'stderr.log') | Out-Null
    }
    $taskDeadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    do {
        $taskDevices = (& $taskAdb devices) -join "`n"
        if ($taskDevices -match '(?m)^emulator-5580\s+device\b') {
            $taskName = (& $taskAdb -s $env:ANDROID_SERIAL emu avd name 2>$null | Select-Object -First 1)
            if ($taskName -ne $taskAvd) { throw "La porta 5580 appartiene a un altro AVD: $taskName" }
            $taskBoot = (& $taskAdb -s $env:ANDROID_SERIAL shell getprop sys.boot_completed 2>$null) -join ''
            if ($taskBoot.Trim() -eq '1') {
                [pscustomobject]@{ Serial = $env:ANDROID_SERIAL; Avd = $taskAvd; Adb = $taskAdb; Ready = $true }
                return
            }
        }
        Start-Sleep -Seconds 2
    } while ([DateTime]::UtcNow -lt $taskDeadline)
    throw "Emulatore non pronto entro $TimeoutSeconds secondi. Log: $taskRuntime"
} finally {
    if ($taskLocked) { $taskMutex.ReleaseMutex() }
    $taskMutex.Dispose()
}
