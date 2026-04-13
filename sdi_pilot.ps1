# 1. CONFIGURACIÓN
Add-Type -AssemblyName System.Windows.Forms
$busqueda = "electricistas Málaga"
$rutaArchivo = "$env:USERPROFILE\Desktop\Resultados_Electricistas.txt"

# Abrimos Google
Start-Process "https://www.google.com"
Write-Host "Iniciando búsqueda..." -ForegroundColor Cyan
Start-Sleep -Seconds 4

# Escribimos y buscamos
[System.Windows.Forms.SendKeys]::SendWait($busqueda)
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("~")
Write-Host "Búsqueda completada visualmente." -ForegroundColor Green
Start-Sleep -Seconds 5

# --- EXTRACCIÓN DEL CÓDIGO FUENTE ---
Write-Host "Copiando datos de la página..." -ForegroundColor Yellow
[System.Windows.Forms.SendKeys]::SendWait("^u") # Ver código
Start-Sleep -Seconds 3
[System.Windows.Forms.SendKeys]::SendWait("^a") # Seleccionar todo
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("^c") # Copiar
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("^w") # Cerrar pestaña de código

# --- LIMPIEZA TOTAL ---
$codigo = Get-Clipboard
$patron = 'https?://[^\s"''&]+'
$enlacesBrutos = [regex]::Matches($codigo, $patron) | ForEach-Object { $_.Value }

$enlacesLimpios = foreach ($url in $enlacesBrutos) {
    # 1. Cortar en el primer '<'
    $urlLimpia = $url.Split("<")[0]
    
    # 2. Eliminar las barras invertidas '\'
    $urlLimpia = $urlLimpia.Replace("\", "")
    
    # 3. Limpieza de puntos finales
    $urlLimpia = $urlLimpia.TrimEnd(".")

    # Filtros para quedarnos solo con lo importante
    if ($urlLimpia -like "*http*" -and 
        $urlLimpia -notlike "*google.com*" -and 
        $urlLimpia -notlike "*gstatic*" -and 
        $urlLimpia -notlike "*schema.org*") {
        $urlLimpia
    }
}

$resultadoFinal = $enlacesLimpios | Select-Object -Unique

# --- GUARDAR Y MOSTRAR ---
if ($resultadoFinal) {
    # Guardamos en el escritorio
    $resultadoFinal | Out-File -FilePath $rutaArchivo
    
    Write-Host "`n¡TRABAJO TERMINADO!" -ForegroundColor Green
    Write-Host "Se han encontrado $($resultadoFinal.Count) enlaces limpios." -ForegroundColor White
    Write-Host "Los resultados se han guardado en tu Escritorio como: Resultados_Electricistas.txt" -ForegroundColor Cyan
    
} else {
    Write-Host "No se pudo extraer nada. Asegúrate de que el navegador estaba en primer plano." -ForegroundColor Red
}
