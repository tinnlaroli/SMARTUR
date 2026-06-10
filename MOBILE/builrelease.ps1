#Requires -Version 7
<#
.SYNOPSIS
    Build Smartur release APK and AAB.

.DESCRIPTION
    Firma el build con el keystore de release y produce:
      build\app\outputs\flutter-apk\app-release.apk
      build\app\outputs\bundle\release\app-release.aab

    Keystore por defecto esperado: android\app\smartur-release.jks

.EXAMPLE
    .\builrelease.ps1
    .\builrelease.ps1 -KeystorePath "android\app\smartur-release.jks" -KeyAlias upload -KeyPassword "****" -StorePassword "****"
#>

param(
    [string]$KeystorePath  = "android\app\smartur-release.jks",
    [string]$KeyAlias      = "",
    [string]$KeyPassword   = "",
    [string]$StorePassword = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Resolve keystore path relative to script location ──────────────────────
$scriptDir    = $PSScriptRoot
$absoluteKs   = if ([System.IO.Path]::IsPathRooted($KeystorePath)) {
                    $KeystorePath
                } else {
                    Join-Path $scriptDir $KeystorePath
                }

if (-not (Test-Path $absoluteKs)) {
    Write-Error "Keystore no encontrado: $absoluteKs`n" +
                "Crea el keystore con:`n" +
                "  keytool -genkey -v -keystore android\app\smartur-release.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000"
    exit 1
}

# ── Prompt for credentials if not provided ─────────────────────────────────
if (-not $KeyAlias) {
    $KeyAlias = Read-Host "Key alias"
}
if (-not $KeyPassword) {
    $KeyPassword = Read-Host "Key password" -MaskInput
}
if (-not $StorePassword) {
    $StorePassword = Read-Host "Store password" -MaskInput
}

# ── Export env vars for build.gradle.kts ───────────────────────────────────
$env:KEYSTORE_PATH     = $absoluteKs
$env:KEY_ALIAS         = $KeyAlias
$env:KEY_PASSWORD      = $KeyPassword
$env:KEYSTORE_PASSWORD = $StorePassword

Write-Host "`n[builrelease] Keystore : $absoluteKs" -ForegroundColor Cyan
Write-Host "[builrelease] Key alias: $KeyAlias`n"   -ForegroundColor Cyan

# ── Build steps ────────────────────────────────────────────────────────────
Push-Location $scriptDir

try {
    Write-Host "── flutter clean ──────────────────────────────────────────" -ForegroundColor DarkGray
    flutter clean
    if ($LASTEXITCODE -ne 0) { throw "flutter clean failed (exit $LASTEXITCODE)" }

    Write-Host "`n── flutter pub get ────────────────────────────────────────" -ForegroundColor DarkGray
    flutter pub get
    if ($LASTEXITCODE -ne 0) { throw "flutter pub get failed (exit $LASTEXITCODE)" }

    Write-Host "`n── flutter build apk --release ────────────────────────────" -ForegroundColor DarkGray
    flutter build apk --release
    if ($LASTEXITCODE -ne 0) { throw "flutter build apk --release failed (exit $LASTEXITCODE)" }

    Write-Host "`n── flutter build appbundle --release ──────────────────────" -ForegroundColor DarkGray
    flutter build appbundle --release
    if ($LASTEXITCODE -ne 0) { throw "flutter build appbundle --release failed (exit $LASTEXITCODE)" }

    # ── Output paths ───────────────────────────────────────────────────────
    $apk = Join-Path $scriptDir "build\app\outputs\flutter-apk\app-release.apk"
    $aab = Join-Path $scriptDir "build\app\outputs\bundle\release\app-release.aab"

    Write-Host "`n[builrelease] Build completado." -ForegroundColor Green

    if (Test-Path $apk) {
        $apkSize = [math]::Round((Get-Item $apk).Length / 1MB, 1)
        Write-Host "  APK ($apkSize MB): $apk" -ForegroundColor Green
    } else {
        Write-Host "  APK: no encontrado en $apk" -ForegroundColor Yellow
    }

    if (Test-Path $aab) {
        $aabSize = [math]::Round((Get-Item $aab).Length / 1MB, 1)
        Write-Host "  AAB ($aabSize MB): $aab" -ForegroundColor Green
    } else {
        Write-Host "  AAB: no encontrado en $aab" -ForegroundColor Yellow
    }

} catch {
    Write-Host "`n[builrelease] ERROR: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
    # Limpiar env vars para no dejar credenciales en el proceso padre
    $env:KEYSTORE_PATH     = $null
    $env:KEY_ALIAS         = $null
    $env:KEY_PASSWORD      = $null
    $env:KEYSTORE_PASSWORD = $null
}
