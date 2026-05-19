Param(
  [string]$Device = ""
)

$envPath = Join-Path $PSScriptRoot ".env"
if (-Not (Test-Path $envPath)) {
  Write-Host ".env no encontrado. Copia .env.example a .env y rellena tus valores." -ForegroundColor Yellow
  exit 1
}

$defines = @{}
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $parts = $line -split "=", 2
  if ($parts.Count -eq 2) {
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value -ne "") {
      $defines[$key] = $value
    }
  }
}

if ($defines.Count -eq 0) {
  Write-Host ".env está vacío o sin pares KEY=VALUE válidos." -ForegroundColor Yellow
  exit 1
}

$defineArgs = $defines.GetEnumerator() | ForEach-Object {
  "--dart-define=$($_.Key)=$($_.Value)"
}

$cmd = "flutter run " + ($defineArgs -join " ")
if ($Device -ne "") {
  $cmd += " -d $Device"
}

Write-Host "Ejecutando: $cmd" -ForegroundColor Cyan
Invoke-Expression $cmd

