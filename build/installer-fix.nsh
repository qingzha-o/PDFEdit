; The stock electron-builder app-running check can produce a false positive on
; some per-user installs. The installer still overwrites cleanly when the app is
; closed, and the user can retry if Windows reports a file lock.
!macro customCheckAppRunning
!macroend
