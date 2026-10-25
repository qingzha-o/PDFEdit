@echo off
setlocal
cd /d "%~dp0"

if not defined FOLIO_HOME set "FOLIO_HOME=%~dp0"
if not defined FOLIO_PORT set "FOLIO_PORT=4173"
if not defined FOLIO_HOST set "FOLIO_HOST=127.0.0.1"
if not defined FOLIO_DATA set "FOLIO_DATA=%~dp0data"

where node >nul 2>nul
if not errorlevel 1 (
  node server.mjs
  goto :eof
)

set "DSHNODE=%USERPROFILE%\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe"
if exist "%DSHNODE%" (
  "%DSHNODE%" server.mjs
  goto :eof
)

echo Node.js 20+ is required to run the local server.
echo Install Node.js, or open the app through the existing DSH session URL.
pause
