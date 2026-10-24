@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if errorlevel 1 (
  echo.
  echo Install failed. See %TEMP%\folio-install.log
  pause
)
exit /b %errorlevel%
