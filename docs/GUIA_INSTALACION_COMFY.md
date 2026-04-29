# 🚀 Guía de Instalación Elite: ComfyUI + Flux + LoRA

Esta guía te llevará de cero a tener un motor de generación de imágenes profesional integrado en tu pipeline de SEO. Hemos configurado todo para que sea **eficiente, gratuito y de alta calidad**.

---

## 🛠️ Paso 1: Instalación de ComfyUI
Si aún no tienes ComfyUI, sigue estos pasos:
1. Descarga el [ComfyUI Windows Portable](https://github.com/comfyanonymous/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia_cu121_or_cpu.7z).
2. Descomprímelo en una carpeta (ej. `C:\ComfyUI`).
3. Ejecuta `run_nvidia_gpu.bat` para verificar que arranca.

---

## 📦 Paso 2: Descarga Automática de Modelos (Flux.1)
He creado un script para facilitarte la vida. Abre una terminal de PowerShell en la raíz de este proyecto y ejecuta:

```powershell
.\scripts\download_comfy_assets.ps1
```

> [!NOTE]
> Este script descargará los modelos Flux.1 Schnell optimizados (GGUF) necesarios para que el pipeline funcione con poca VRAM (ideal para laptops).

**Lo que descargará:**
- **Flux.1 Schnell (GGUF Q2_K)**: El cerebro del modelo.
- **CLIP & T5 XXL**: Decodificadores de texto.
- **VAE**: El corrector de color y detalles.

---

## 🎨 Paso 3: Configuración de LoRAs Gratuitas
Las LoRAs añaden ese toque de realismo. Asegúrate de tener estas carpetas en tu ComfyUI:

| Nicho | LoRA Sugerida | Link Civitai | Destino en ComfyUI |
| :--- | :--- | :--- | :--- |
| **Realismo** | `flux_realism_lora.safetensors` | [Link](https://civitai.com/models/631398/flux-realism-lora) | `models/loras/` |
| **Detalle** | `flux_detailer.safetensors` | [Link](https://civitai.com/models/635674/flux-detailer) | `models/loras/` |

---

## ✅ Paso 4: Verificación Final
Una vez que hayas descargado los modelos, ejecuta nuestra herramienta de diagnóstico:

```powershell
npx ts-node src/images/comfy/setupHelper.ts
```

Si todo está en verde (`✅`), ¡estás listo para dominar los nichos con imágenes generadas por IA!

---

## 🖼️ El Objetivo Final
Aquí tienes un ejemplo de la calidad que buscamos para tus sitios de servicios:

![Ejemplo de Calidad](file:///c:/Users/Bryan/Desktop/pruebaGravity/assets_generated/preview_quality.png)

> [!TIP]
> **Ruteo Real:** Recuerda que ahora las imágenes se copian automáticamente a tu carpeta `output_sites/`. ¡Tus sitios están listos para producción!
