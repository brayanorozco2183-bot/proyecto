$html = Get-Content 'output_sites/cerrajeros-madrid/index.html' -Raw
$allLinks = [regex]::Matches($html, 'href="([^"]+)"')
Write-Host "Total hrefs en HTML: $($allLinks.Count)"

$barrioLinks = $allLinks | Where-Object { $_.Groups[1].Value -match 'malasa|lavap|salaman|barrio|district' }
Write-Host "Hrefs a barrios encontrados: $($barrioLinks.Count)"
foreach ($l in $barrioLinks) { Write-Host "  -> $($l.Groups[1].Value)" }

# Internal links hub section
$hubMatch = [regex]::Match($html, '(?si)internal.links.hub.*?</section>')
if ($hubMatch.Success) {
    Write-Host "`n[HUB DE ENLACES INTERNOS encontrado]"
    $hubLinks = [regex]::Matches($hubMatch.Value, 'href="([^"]+)"')
    foreach ($l in $hubLinks) { Write-Host "  -> $($l.Groups[1].Value)" }
} else {
    Write-Host "`n[!] No se encontro la seccion internal-links-hub en el HTML"
}

# Check for any area-related text
$malasana = if ($html -match 'Malasa') { "SI" } else { "NO" }
$lavapies = if ($html -match 'Lavap') { "SI" } else { "NO" }
$salamanca = if ($html -match 'Salamanca') { "SI" } else { "NO" }
Write-Host "`nTexto de barrio en el HTML:"
Write-Host "  Malasana: $malasana"
Write-Host "  Lavapies: $lavapies"
Write-Host "  Salamanca: $salamanca"
