@echo off
setlocal
cd /d "%~dp0"

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
