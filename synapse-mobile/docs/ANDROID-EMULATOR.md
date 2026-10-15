# Emulatore Lume per Codex

Il dispositivo dedicato e persistente `Lume_API_36` usa Android 16 (API 36),
Google APIs x86_64 e ADB `emulator-5580`. SDK, immagine, dati e log restano in
`Scrolls/.mobile-tools`, esclusa da Git. Non serve Android Studio.

Da `synapse-mobile`, ogni comando seguente avvia automaticamente l'emulatore
senza finestra, oppure riutilizza quello gia acceso, e attende il boot:

```powershell
& ./scripts/adb-emulator.ps1 shell getprop sys.boot_completed
& ./scripts/adb-emulator.ps1 install -r ./releases/<build>.apk
```

Il wrapper seleziona sempre il seriale dedicato anche in presenza di telefoni
USB. Per preparare altre sessioni di strumenti Android:

```powershell
& ./scripts/start-emulator.ps1
# Imposta ANDROID_HOME, ANDROID_SDK_ROOT, ANDROID_USER_HOME,
# ANDROID_AVD_HOME e ANDROID_SERIAL nella sessione PowerShell corrente.
```

Per una finestra visibile, usare `start-emulator.ps1 -ShowWindow` quando
l'emulatore e spento. Per spegnerlo usare `adb-emulator.ps1 emu kill`;
il prossimo comando lo riaccende. Non viene avviato al login di Windows:
l'avvio e automatico su richiesta, senza servizi permanenti o privilegi admin.

L'avvio non compila, installa o apre Lume e non esegue test. I futuri test
devono installare la build desiderata con supporto x86_64. I dati dell'AVD
sono conservati: non usare `-wipe-data` senza una richiesta esplicita.
I log di avvio sono in `.mobile-tools/lume-emulator/`.
L'esecuzione richiede accesso host a WHPX e al server ADB locale: se la
sandbox li blocca, eseguire lo stesso comando con il normale meccanismo
di autorizzazione host di Codex, senza cambiare dispositivo.

Riferimento: [Android Emulator da riga di comando](https://developer.android.com/studio/run/emulator-commandline).
