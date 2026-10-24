$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot 'app'
$dest = Join-Path $env:LOCALAPPDATA 'Programs\Folio PDF Studio'
$exe = Join-Path $dest 'Folio PDF Studio.exe'
$log = Join-Path $env:TEMP 'folio-install.log'
function Write-Log($m) { try { Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $m) -Encoding utf8 } catch {} }
Write-Log "install start: $dest"
try {
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($dest, [StringComparison]::OrdinalIgnoreCase) } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  & robocopy $src $dest /MIR /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Uninstall.ps1') -Destination (Join-Path $dest 'Uninstall.ps1') -Force

  $ws = New-Object -ComObject WScript.Shell
  $desktop = [Environment]::GetFolderPath('Desktop')
  $programs = [Environment]::GetFolderPath('Programs')

  $sc = $ws.CreateShortcut((Join-Path $desktop 'Folio PDF Studio.lnk'))
  $sc.TargetPath = $exe
  $sc.WorkingDirectory = $dest
  $sc.IconLocation = "$exe,0"
  $sc.Description = 'Folio PDF Studio'
  $sc.Save()

  $sc = $ws.CreateShortcut((Join-Path $programs 'Folio PDF Studio.lnk'))
  $sc.TargetPath = $exe
  $sc.WorkingDirectory = $dest
  $sc.IconLocation = "$exe,0"
  $sc.Description = 'Folio PDF Studio'
  $sc.Save()

  $sc = $ws.CreateShortcut((Join-Path $programs 'Uninstall Folio PDF Studio.lnk'))
  $sc.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
  $sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$dest\Uninstall.ps1`""
  $sc.WorkingDirectory = $dest
  $sc.IconLocation = "$exe,0"
  $sc.Save()

  $key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\FolioPDFStudio'
  New-Item -Path $key -Force | Out-Null
  Set-ItemProperty -Path $key -Name DisplayName -Value 'Folio PDF Studio'
  Set-ItemProperty -Path $key -Name DisplayVersion -Value '1.0.0'
  Set-ItemProperty -Path $key -Name Publisher -Value 'Folio Studio'
  Set-ItemProperty -Path $key -Name InstallLocation -Value $dest
  Set-ItemProperty -Path $key -Name DisplayIcon -Value "$exe,0"
  Set-ItemProperty -Path $key -Name UninstallString -Value "`"$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe`" -NoProfile -ExecutionPolicy Bypass -File `"$dest\Uninstall.ps1`""
  Set-ItemProperty -Path $key -Name NoModify -Value 1 -Type DWord
  Set-ItemProperty -Path $key -Name NoRepair -Value 1 -Type DWord
  Write-Log 'install complete'
} catch {
  Write-Log ("install failed: " + $_.Exception.Message)
  throw
}
