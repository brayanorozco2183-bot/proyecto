# 📘 Informe Técnico: Motor de Generación ComfyUI + LoRA

Este informe detalla la arquitectura, el funcionamiento de los modelos y las estrategias de optimización para la generación de imágenes en tu proyecto.

---

## 1. Arquitectura de Integración

Tu proyecto utiliza una arquitectura de **Cliente-Servidor (Headless)**:

1.  **Frontend/Core (TypeScript):** El pipeline de SEO identifica qué imágenes faltan y qué nicho se está trabajando.
2.  **Prompt Factory:** Transforma el nicho (`niche`), la ciudad (`city`) y el título de la sección en un "Prompt" descriptivo siguiendo reglas de fotografía profesional y realismo.
3.  **Client (ComfyUI API):** Se comunica vía HTTP/WebSockets con tu servidor local. Envía el flujo de trabajo (Workflow) y espera a que la GPU termine de renderizar.
4.  **Ruteador de Imágenes:** Una vez generada, la imagen se recupera del servidor y se mueve físicamente a la carpeta del sitio correspondiente (`output_sites/[slug]`).

---

## 2. Los Modelos: Flux.1 Schnell (GGUF)

Has descargado y configurado la familia de modelos **Flux**, que actualmente es el estado del arte en IA generativa de código abierto.

*   **UNet (Cerebro): `flux1-schnell-Q2_K.gguf`**
    *   Este modelo utiliza tecnología GGUF (cuantización), lo que permite que un modelo de ~24GB de RAM funcione ocupando solo ~4GB.
    *   **Schnell** significa "rápido" en alemán. Está diseñado para funcionar en solo 4 a 8 pasos (`steps`), frente a los 20-50 de modelos antiguos.
*   **Text Encoders: CLIP L y T5 XXL**
    *   El modelo T5 es el que permite que Flux entienda frases complejas y pueda escribir texto dentro de las imágenes con precisión.
*   **VAE: Flux VAE**
    *   Se encarga de convertir la representación matemática latente en los píxeles finales que ves.

---

## 3. Funcionamiento de las LoRA

Las **LoRA (Low-Rank Adaptation)** son pequeños archivos que se "inyectan" en el modelo principal para enseñarle conceptos específicos sin tener que re-entrenarlo todo.

### ¿Cómo las usa tu proyecto?
El archivo `src/images/comfy/loraCatalog.ts` contiene un radar de nichos. Cuando generamos una imagen:
1.  **Detección:** Si el nicho incluye "Cerrajería", el catálogo busca reglas para ese nicho.
2.  **Inyección:** El sistema añade automáticamente las `Trigger Words` (palabras activadoras) al prompt (ej. "Realism, amateur photo").
3.  **Workflow Mutation:** Modificamos el JSON de ComfyUI para conectar un nodo `LoraLoader` entre el modelo base y el generador, aplicando la fuerza configurada en tu `.env`.

---

## 4. Cómo mejorar los resultados

Para obtener resultados de nivel "Premium", puedes ajustar estos parámetros en tu `.env`:

### A. Ajuste de Fuerza (Strength)
*   **`COMFY_LORA_DEFAULT_STRENGTH`**: Si las imágenes se ven "quemadas" o con colores extraños, baja este valor a `0.6` o `0.5`. Si no notas el efecto de la LoRA, súbelo a `0.9` o `1.0`.

### B. Reglas por Nicho (`COMFY_LORA_RULES_JSON`)
Puedes asignar LoRAs específicas para cada servicio:
```json
{
  "locksmith": [{"name": "herramientas_reales.safetensors", "strengthModel": 0.8}],
  "garden": [{"name": "jardin_mediterraneo.safetensors", "strengthModel": 0.7}]
}
```

### C. Prompt Engineering
Flux responde mejor a descripciones naturales. En lugar de etiquetas sueltas, el sistema construye frases como: *"A professional locksmith working on a door in Madrid, natural light, cinematic photography"*.

---

## 5. Solución de Problemas Comunes

*   **"Connection Refused":** Asegúrate de que ComfyUI esté abierto y escuchando en el puerto configurado (ej. 8000 o 8188).
*   **"Model Not Found":** Verifica que los nombres de los archivos en el `.env` coincidan **exactamente** (incluyendo `.safetensors` o `.gguf`) con los archivos en tus carpetas de ComfyUI.
*   **Imagen no aparece en el sitio:** Revisa que el `outputSlug` esté bien definido en el contexto de generación.
