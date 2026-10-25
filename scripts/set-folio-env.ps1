param(
  [string]$HomePath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [int]$Port = 4173
)

$root = [IO.Path]::GetFullPath($HomePath).TrimEnd('\')
$runtime = Join-Path $root 'app'
$data = Join-Path $root 'data'
New-Item -ItemType Directory -Force -Path $data | Out-Null

$values = [ordered]@{
  FOLIO_HOME = $root
  FOLIO_RUNTIME = $runtime
  FOLIO_DATA = $data
  FOLIO_PORT = [string]$Port
  FOLIO_HOST = '127.0.0.1'
  PDFEDIT_HOME = $root
}

foreach ($key in $values.Keys) {
  [Environment]::SetEnvironmentVariable($key, $values[$key], 'User')
  Set-Item -Path "Env:$key" -Value $values[$key]
}

Write-Host 'Folio PDFEdit environment:'
foreach ($key in $values.Keys) { Write-Host ("  {0}={1}" -f $key, $values[$key]) }
