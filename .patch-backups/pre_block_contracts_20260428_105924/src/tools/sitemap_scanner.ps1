param (
    [string]$dominio = "https://example.com"
)

# 1. CONFIGURACIÓN
$archivoSalida = Join-Path $env:TEMP "sitemap_inventory.txt"

# Lista de posibles ubicaciones del sitemap
$posiblesSitemaps = @(
    "$dominio/sitemap_index.xml",
    "$dominio/sitemap.xml",
    "$dominio/page-sitemap.xml",
    "$dominio/post-sitemap.xml"
)

Write-Host "--- ESCANEANDO INVENTARIO: $dominio ---" -ForegroundColor Cyan

function Get-SitemapRecursive($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -UseBasicParsing -TimeoutSec 15
        [xml]$xml = $response.Content
        
        $urlsEncontradas = @()

        if ($xml.sitemapindex) {
            foreach ($s in $xml.sitemapindex.sitemap) {
                $urlsEncontradas += Get-SitemapRecursive $s.loc
            }
        }
        elseif ($xml.urlset) {
            $urlsEncontradas += $xml.urlset.url.loc
        }
        
        return $urlsEncontradas
    }
    catch {
        return $null
    }
}

# 2. EJECUCIÓN
$todasLasUrls = @()
foreach ($sitemap in $posiblesSitemaps) {
    Write-Host "Probando: $sitemap"
    $resultado = Get-SitemapRecursive $sitemap
    if ($resultado) {
        $todasLasUrls += $resultado
        if ($sitemap -like "*index*") { break }
    }
}

# 3. FILTRADO Y GUARDADO
if ($todasLasUrls) {
    $urlsFinales = $todasLasUrls | Select-Object -Unique | Where-Object { $_ -like "http*" }
    $urlsFinales | Out-File -FilePath $archivoSalida -Encoding utf8
    Write-Host "SUCCESS: Encontradas $($urlsFinales.Count) URLs."
}
else {
    # Crear archivo vacío para evitar errores de lectura
    "" | Out-File -FilePath $archivoSalida -Encoding utf8
    Write-Host "FAILURE: No se pudo obtener el inventario."
}
