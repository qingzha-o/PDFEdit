# One-click Windows installer

This folder contains the small 7-Zip SFX installer wrapper used for the final
Windows package. The large Electron app payload is not checked in; it is built
from `dist/win-unpacked`.

Assembly:

1. Copy `dist/win-unpacked` to a staging folder as `app`.
2. Copy `install.cmd`, `setup.ps1`, and `Uninstall.ps1` next to `app`.
3. Compress the contents of the staging folder to `payload.7z` with 7-Zip.
4. Concatenate `7zSD-branded.sfx`, `config.txt`, and `payload.7z` into
   `Folio-PDF-Studio-Setup-1.0.0.exe`.

```powershell
# from the repository root, after building dist/win-unpacked
Copy-Item dist\win-unpacked sfx\app -Recurse
Copy-Item build\oneclick\install.cmd,build\oneclick\setup.ps1,build\oneclick\Uninstall.ps1 sfx\
# 7za a -t7z -mx=7 sfx\payload.7z .\*    (run inside sfx\)
# cmd /c copy /b build\oneclick\7zSD-branded.sfx + build\oneclick\config.txt + sfx\payload.7z dist\Folio-PDF-Studio-Setup-1.0.0.exe
```

`setup.ps1` installs per-user to `%LOCALAPPDATA%\Programs\Folio PDF Studio`,
creates desktop/Start Menu shortcuts, writes an Add/Remove Programs entry, and
installs a PowerShell uninstaller. It intentionally does not launch the app, so
the installer never leaves a running instance behind.

The 7-Zip SFX stub is unsigned. Windows SmartScreen may ask the user to confirm
the first run.
