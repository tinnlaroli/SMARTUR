param(
    [string]$KeystorePath = "android/app/smartur-release.jks",
    [string]$Alias = $env:KEY_ALIAS,
    [string]$StorePassword = $env:KEYSTORE_PASSWORD
)

if (-not $Alias) {
    Write-Error "Indica -Alias o define la variable de entorno KEY_ALIAS."
    exit 1
}

$keytool = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin\keytool.exe" } else { "keytool" }

$args = @("-list", "-v", "-keystore", $KeystorePath, "-alias", $Alias)
if ($StorePassword) {
    $args += @("-storepass", $StorePassword)
}

Write-Host "Keystore: $KeystorePath"
Write-Host "Alias:    $Alias"
Write-Host ""
& $keytool @args

Write-Host ""
Write-Host "Registra SHA-1 y SHA-256 en Firebase (mx.smartur.app) y vuelve a descargar google-services.json."
Write-Host "Ver docs/GOOGLE_SIGNIN_RELEASE.md"
