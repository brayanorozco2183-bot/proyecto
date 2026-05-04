# Guía Rápida: De Cero a Imágenes con ComfyUI

Como me comentaste que no tienes mucha idea, he preparado esta guía simple para que tengas todo funcionando en menos de 5 minutos.

## 1. Descargar ComfyUI (Versión Portable)

La versión "Portable" es la más fácil porque no requiere instalación ni configurar Python.

1.  **Descarga este archivo:** [ComfyUI Windows Portable (7z)](https://github.com/comfyanonymous/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia_cu121_or_cpu.7z)
    *   *Nota: Pesa unos 1.4GB.*
2.  **Extráelo** en una carpeta de tu ordenador (por ejemplo, en `C:\ComfyUI`).

## 2. Descargar el "Cerebro" (Modelo/Checkpoint)

ComfyUI necesita un modelo para saber cómo dibujar. Usaremos el **Stable Diffusion 1.5**, que es ligero y estándar.

1.  **Descarga el modelo:** [v1-5-pruned-emaonly.safetensors](https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors)
    *   *Nota: Pesa unos 4GB.*
2.  **Cópialo aquí:** Busca la carpeta donde extrajiste ComfyUI y mételo en:
    `ComfyUI_windows_portable\ComfyUI\models\checkpoints\`

## 3. Arrancar ComfyUI

1.  Entra en tu carpeta de ComfyUI.
2.  Haz doble clic en:
    *   `run_nvidia_gpu.bat` (Si tienes tarjeta gráfica NVIDIA).
    *   `run_cpu.bat` (Si no tienes tarjeta gráfica o tienes poca memoria).
3.  Se abrirá una ventana negra (consola) y luego tu navegador en `http://127.0.0.1:8188`. ¡Ya está listo!

## 4. Verificar en el Proyecto

Vuelve a la carpeta de este proyecto (`pruebaGravity`) y ejecuta este comando en tu terminal:

```bash
npm run comfy:check
```

Si todo está bien, verás un mensaje verde diciendo: **"¡ComfyUI está ONLINE!"** y **"El modelo está instalado y listo"**.

---

## Preguntas Frecuentes

*   **¿Tengo que configurar algo en ComfyUI?** No, el proyecto se encarga de enviarle los "flujos" automáticamente. Solo necesitas tenerlo abierto.
*   **¿Puedo cerrar ComfyUI?** Solo si no vas a generar imágenes. Para que el pipeline de Gravity funcione, ComfyUI debe estar abierto de fondo.
*   **¿Dónde se guardan las imágenes?** El proyecto las guardará automáticamente en `assets_generated/page-images`.
