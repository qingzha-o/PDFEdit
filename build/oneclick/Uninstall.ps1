$dest = $PSScriptRoot
$exe = Join-Path $dest 'Folio PDF Studio.exe'
Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith($dest, [StringComparison]::OrdinalIgnoreCase) } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Folio PDF Studio.lnk') -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('Programs')) 'Folio PDF Studio.lnk') -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('Programs')) 'Uninstall Folio PDF Studio.lnk') -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\FolioPDFStudio' -Recurse -Force -ErrorAction SilentlyContinue
Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" -ArgumentList '/c', "timeout /t 2 >nul & rmdir /s /q `"$dest`"" -WindowStyle Hidden
