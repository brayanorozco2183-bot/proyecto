param (
    [string]$query = "electricistas Málaga",
    [string]$city = ""
)

# 1. CONFIGURACIÓN
Add-Type -AssemblyName System.Windows.Forms
$busqueda = if ($city) { "$query $city" } else { $query }
$queryEscaped = [uri]::EscapeDataString($busqueda)
$urlGoogle = "https://www.google.com/search?q=$queryEscaped"
# Usamos el TEMP para que el Orquestador lo lea fácilmente
$outputFile = Join-Path $env:TEMP "google_serp_results.txt"

# 2. LOCALIZAR CHROME
$chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}

if (-not (Test-Path $chromePath)) {
    Write-Host "No he encontrado Chrome. Intentando genérico..."
    $chromePath = "chrome.exe"
}

# 3. ABRIR CHROME EN INCÓGNITO DIRECTO A GOOGLE
Write-Host "Abriendo Chrome en modo incógnito..." -ForegroundColor Cyan
Start-Process $chromePath -ArgumentList "--incognito", "$urlGoogle"

# Esperamos a que cargue la página de resultados
Write-Host "Esperando a Google..." -ForegroundColor Green
Start-Sleep -Seconds 3

# --- EL 'ATRACO' AL CÓDIGO FUENTE ---
Write-Host "Extrayendo datos de la página..." -ForegroundColor Yellow
[System.Windows.Forms.SendKeys]::SendWait("^u") # Ver código (Ctrl + U)
Start-Sleep -Seconds 1.5
[System.Windows.Forms.SendKeys]::SendWait("^a") # Seleccionar todo (Ctrl + A)
Start-Sleep -Milliseconds 800
[System.Windows.Forms.SendKeys]::SendWait("^c") # Copiar (Ctrl + C)
Start-Sleep -Milliseconds 800
[System.Windows.Forms.SendKeys]::SendWait("^w") # Cerrar pestaña de código

# --- PROCESAMIENTO CON REGLAS DE LIMPIEZA ---
$codigo = Get-Clipboard
$patron = 'https?://[^\s"''&]+'
$enlacesBrutos = [regex]::Matches($codigo, $patron) | ForEach-Object { $_.Value }

$enlacesLimpios = foreach ($url in $enlacesBrutos) {
    # Regla del '<'
    $urlLimpia = $url.Split("<")[0]
    # Regla de la '\'
    $urlLimpia = $urlLimpia.Replace("\", "")
    # Limpieza de puntos, comillas y paréntesis (comunes al capturar código sucio)
    $urlLimpia = $urlLimpia.TrimEnd(".").TrimEnd("'").TrimEnd('"').TrimEnd(')').TrimEnd(']')

    if ($urlLimpia -like "*http*" -and 
        $urlLimpia -notlike "*google.com*" -and 
        $urlLimpia -notlike "*gstatic*" -and 
        $urlLimpia -notlike "*googleadservices.com*" -and
        $urlLimpia -notlike "*schema.org*") {
        $urlLimpia
    }
}

$resultadoFinal = $enlacesLimpios | Select-Object -Unique

# --- GUARDAR Y FINALIZAR ---
if ($resultadoFinal) {
    $resultadoFinal | Out-File -FilePath $outputFile -Encoding utf8
    Write-Host "SUCCESS: $($resultadoFinal.Count) links captured."
} else {
    Write-Host "FAILURE: No links captured."
}
