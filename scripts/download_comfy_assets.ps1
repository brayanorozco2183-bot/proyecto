param(
    [string]$ComfyPath = ""
)

# 🚀 Script de Configuración de Assets para ComfyUI (Flux.1 Schnell)
# Este script descarga los modelos necesarios para que el pipeline de Gravity funcione.

if ([string]::IsNullOrWhiteSpace($ComfyPath)) {
    $ComfyPath = Read-Host "Introduce la ruta de tu instalación de ComfyUI (ej. C:\ComfyUI_windows_portable\ComfyUI)"
}

if (-not (Test-Path $ComfyPath)) {
    Write-Error "La ruta especificada no existe: $comfyPath"
    exit
}

$models = @(
    @{
        Url = "https://huggingface.co/city96/FLUX.1-schnell-gguf/resolve/main/flux1-schnell-Q2_K.gguf"
        Dest = "models/unet/flux1-schnell-Q2_K.gguf"
        Desc = "Flux.1 Schnell UNet (GGUF Q2_K)"
    },
    @{
        Url = "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors"
        Dest = "models/clip/clip_l.safetensors"
        Desc = "CLIP L"
    },
    @{
        Url = "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors"
        Dest = "models/clip/t5xxl_fp8_e4m3fn.safetensors"
        Desc = "T5 XXL (FP8)"
    },
    @{
        Url = "https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/ae.safetensors"
        Dest = "models/vae/flux-vae-bf16.safetensors"
        Desc = "Flux VAE"
    }
)

Write-Host "`n--- Iniciando descarga de modelos Flux ---" -ForegroundColor Cyan

foreach ($model in $models) {
    $fullDest = Join-Path $comfyPath $model.Dest
    $parentDir = Split-Path $fullDest -Parent
    
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    if (Test-Path $fullDest) {
        Write-Host "[SKIP] $($model.Desc) ya existe en $fullDest" -ForegroundColor Gray
    } else {
        Write-Host "[INFO] Descargando $($model.Desc)..." -ForegroundColor Yellow
        try {
            Invoke-WebRequest -Uri $model.Url -OutFile $fullDest -ErrorAction Stop
            Write-Host "[OK] Descargado correctamente." -ForegroundColor Green
        } catch {
            Write-Host "[ERR] Error al descargar $($model.Desc): $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Por favor, descárgalo manualmente desde: $($model.Url)" -ForegroundColor Gray
        }
    }
}

Write-Host "`n--- Proceso completado ---" -ForegroundColor Cyan
Write-Host "Recuerda descargar tus LoRAs favoritas y ponerlas en ComfyUI/models/loras/"
