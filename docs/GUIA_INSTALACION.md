# Guía de Instalación Completa — Gravity SEO Engine V8.1

Esta guía cubre todo lo necesario para instalar y ejecutar Gravity en un PC desde cero.

---

## Índice

1. [Requisitos del sistema](#1-requisitos-del-sistema)
2. [Instalar Node.js](#2-instalar-nodejs)
3. [Instalar Ollama y los modelos LLM](#3-instalar-ollama-y-los-modelos-llm)
4. [Instalar ComfyUI y los modelos Flux](#4-instalar-comfyui-y-los-modelos-flux)
5. [Clonar e instalar el proyecto](#5-clonar-e-instalar-el-proyecto)
6. [Configurar el archivo .env](#6-configurar-el-archivo-env)
7. [Arrancar el sistema](#7-arrancar-el-sistema)
8. [Lanzar tu primera misión](#8-lanzar-tu-primera-misión)
9. [Redis (opcional)](#9-redis-opcional)
10. [Resolución de problemas](#10-resolución-de-problemas)

---

## 1. Requisitos del sistema

| Componente | Mínimo | Recomendado |
|---|---|---|
| SO | Windows 10/11, Ubuntu 22+, macOS 13+ | Windows 11 / Ubuntu 24 |
| RAM | 8 GB | 16 GB |
| VRAM (GPU) | 4 GB (para Flux Q2_K) | 8 GB |
| Espacio en disco | 20 GB libres | 40 GB libres |
| Node.js | v18 | v20+ |

---

## 2. Instalar Node.js

Descarga e instala Node.js desde:  
👉 **https://nodejs.org** (versión LTS, v20 recomendado)

Verifica la instalación:
```bash
node --version   # Debe mostrar v18.x o superior
npm --version
```

---

## 3. Instalar Ollama y los modelos LLM

### 3.1 Instalar Ollama

👉 **https://ollama.com/download**

Instala según tu sistema operativo. En Windows, ejecuta el instalador `.exe`.

Verifica que Ollama está corriendo:
```bash
ollama list
```

### 3.2 Descargar los modelos necesarios

Ejecuta estos comandos en una terminal (pueden tardar varios minutos según tu conexión):

```bash
# Modelo rápido — para agentes de utilidad
ollama pull qwen2.5:1.5b

# Modelo estándar — para análisis y corrección
ollama pull qwen2.5:latest

# Modelo coder — para escritura y arquitectura de contenido
ollama pull qwen2.5-coder:3b
```

> **Con 4GB de VRAM:** Los tres modelos funcionan perfectamente. El motor usará `qwen2.5-coder:3b` para las fases críticas de redacción.

Verifica que están disponibles:
```bash
ollama list
# Debe mostrar los tres modelos
```

---

## 4. Instalar ComfyUI y los modelos Flux

> ⚠️ Esta sección es **obligatoria si quieres imágenes** en las páginas generadas. Si no, puedes saltar al paso 5 y configurar `COMFY_ENABLED=false` en el `.env`.

Consulta la guía detallada en:  
📄 [`docs/GUIA_INSTALACION_COMFY.md`](./GUIA_INSTALACION_COMFY.md)

### Resumen rápido

1. Clona ComfyUI: `git clone https://github.com/comfyanonymous/ComfyUI`
2. Instala dependencias Python: `pip install -r requirements.txt`
3. Descarga los modelos Flux1-Schnell en las carpetas de ComfyUI:
   - `models/unet/` → `flux1-schnell-Q2_K.gguf`
   - `models/clip/` → `clip_l.safetensors`, `t5xxl_fp8_e4m3fn.safetensors`
   - `models/vae/` → `flux-vae-bf16.safetensors`
4. Arranca ComfyUI en el **puerto 8000**: `python main.py --port 8000`

---

## 5. Clonar e instalar el proyecto

```bash
# Clonar el repositorio
git clone https://github.com/brayanorozco2183-bot/proyecto.git
cd proyecto

# Instalar dependencias del backend
npm install

# Instalar dependencias del frontend (Maestro Dashboard)
cd maestro-dashboard
npm install
cd ..
```

---

## 6. Configurar el archivo .env

El archivo `.env` contiene toda la configuración del sistema. **No está en el repositorio** (seguridad), debes crearlo a partir de la plantilla:

```bash
# En Windows (PowerShell o CMD)
copy .env.example .env

# En Linux/macOS
cp .env.example .env
```

Ahora **edita el `.env`** con un editor de texto. Los valores que debes ajustar:

### Configuración de modelos (mínimo necesario)
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL_FAST=qwen2.5:1.5b
OLLAMA_MODEL_STANDARD=qwen2.5:1.5b
OLLAMA_MODEL_PREMIUM=qwen2.5-coder:3b
OLLAMA_MODEL_CODER=qwen2.5-coder:3b
OLLAMA_MODEL_RESEARCH=qwen2.5:latest
OLLAMA_MODEL_COPY=qwen2.5-coder:3b
```

### Override específico para el escritor principal (recomendado)
```env
OLLAMA_AGENT_MODEL_CONTENT_WRITER_01=qwen2.5-coder:3b
```

### Perfil del router de modelos
```env
MODEL_ROUTER_ENABLED=true
MODEL_ROUTER_PROFILE=premium-local
GPU_VRAM_GB=4
TOTAL_RAM_GB_OVERRIDE=16
```

### Base de datos y modo de ejecución
```env
DATABASE_PATH=./maestro.db
DEBUG_MODE=false
PIPELINE_SOFT_MODE=true
```

### ComfyUI (si lo tienes instalado)
```env
COMFY_ENABLED=true
COMFY_BASE_URL=http://127.0.0.1:8000
COMFY_UNET_MODEL=flux1-schnell-Q2_K.gguf
COMFY_CLIP_MODEL=clip_l.safetensors
COMFY_T5_MODEL=t5xxl_fp8_e4m3fn.safetensors
COMFY_VAE_MODEL=flux-vae-bf16.safetensors
COMFY_OUTPUT_DIR=./assets_generated/page-images
COMFY_PUBLIC_BASE_URL=/assets_generated/page-images
COMFY_LORA_ENABLED=true
COMFY_LORA_MAX_PER_IMAGE=2
```

### Dashboard (seguridad básica)
```env
DASHBOARD_PORT=8081
DASHBOARD_AUTH_TOKEN=tu-token-secreto-aqui
DASHBOARD_ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://localhost:8085,http://127.0.0.1:8085
```

### Profundidad de contenido
```env
GRAVITY_CONTENT_DEPTH=premium
GRAVITY_PREMIUM_TARGET_WORDS=2200
```

---

## 7. Arrancar el sistema

Necesitas **dos terminales** abiertas simultáneamente:

### Terminal 1 — Backend API
```bash
# Desde la raíz del proyecto
npm run dashboard
```
Verás: `[Dashboard API] Listening on http://0.0.0.0:8081`

### Terminal 2 — Frontend Dashboard
```bash
cd maestro-dashboard
npm run dev
```
Verás: `Local: http://localhost:8085`

### Abrir el dashboard
Abre tu navegador en:  
👉 **http://localhost:8085**

---

## 8. Lanzar tu primera misión

### Desde el Maestro Dashboard

1. Abre `http://localhost:8085`
2. Ve a la sección **Configuración del Sitio** y rellena la URL base (puede ser cualquiera para pruebas locales)
3. En el campo de comando escribe:
   ```
   electricistas getafe
   ```
4. Selecciona modo **Publish** o **Draft**
5. Pulsa **Lanzar Misión**
6. El **Monitoreo Maestro** mostrará el progreso en tiempo real

### Nichos disponibles

| Comando | Nicho |
|---|---|
| `cerrajeros <ciudad>` | Cerrajeros |
| `electricistas <ciudad>` | Electricistas |
| `fontaneros <ciudad>` | Fontaneros |
| `carpinteros <ciudad>` | Carpinteros |
| `pintores <ciudad>` | Pintores |
| `reformas integrales <ciudad>` | Reformas Integrales |

### Modo Cluster (varias ciudades)
```
cerrajeros madrid, getafe, alcobendas, leganes
```

### Resultado
Las páginas generadas aparecen en:
```
output_sites/<nicho>-<ciudad>/index.html
```

---

## 9. Redis (opcional)

Redis permite procesar misiones en cola con BullMQ. **Sin Redis el sistema funciona igualmente** en modo secuencial (una misión a la vez).

### Instalar Redis en Windows
Opción más fácil: usar **WSL** (Windows Subsystem for Linux):
```bash
# En WSL
sudo apt update && sudo apt install redis-server
sudo service redis-server start
```

O descargar el instalador desde:  
👉 https://github.com/microsoftarchive/redis/releases

### Instalar Redis en Linux/macOS
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis && brew services start redis
```

Configura en `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 10. Resolución de problemas

### El dashboard no abre (puerto 8081)
- Verifica que `npm run dashboard` está corriendo sin errores
- Comprueba que el puerto 8081 no está ocupado por otra aplicación

### Error "Cannot connect to Ollama"
- Verifica que Ollama está corriendo: `ollama list`
- Confirma que `OLLAMA_URL=http://localhost:11434` en tu `.env`

### Las imágenes no aparecen en la página
1. Verifica que ComfyUI está corriendo en el puerto configurado en `COMFY_BASE_URL`
2. Verifica que `COMFY_ENABLED=true` en tu `.env`
3. Verifica que los modelos Flux están en las carpetas correctas de ComfyUI
4. Consulta `docs/GUIA_COMFY_PRUEBA_GRAVITY.md` para un diagnóstico paso a paso

### Misiones activas fantasma al arrancar
Si el dashboard muestra misiones activas que no deberían existir:
```bash
# Windows
cmd.exe /c "npx tsx clear_all.ts"

# Linux/macOS
npx tsx clear_all.ts
```

### Error "PROCESS_ABORTED_BY_USER" al lanzar una misión
Significa que el estado de parada de una misión anterior no se limpió. Solución:
1. Reinicia el proceso del backend (`Ctrl+C` en Terminal 1 y vuelve a ejecutar `npm run dashboard`)
2. Si persiste, ejecuta el script de limpieza anterior

### El modelo LLM no responde / timeout
- Reduce la carga: cierra otras aplicaciones que usen GPU/RAM
- Aumenta los timeouts en `.env`:
  ```env
  AI_FACADE_TIMEOUT_MS=600000
  WRITER_TIMEOUT_MS=900000
  ```
- Considera usar modelos más pequeños (`qwen2.5:1.5b` para todo)

---

## Variables de entorno — Referencia completa

| Variable | Default | Descripción |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | URL de Ollama |
| `OLLAMA_MODEL_FAST` | `qwen2.5:1.5b` | Modelo para agentes rápidos |
| `OLLAMA_MODEL_STANDARD` | `qwen2.5:1.5b` | Modelo para análisis |
| `OLLAMA_MODEL_PREMIUM` | `qwen2.5:latest` | Modelo para escritura/QA |
| `OLLAMA_MODEL_CODER` | `qwen2.5-coder:1.5b` | Modelo para validación técnica |
| `MODEL_ROUTER_ENABLED` | `true` | Activa el enrutamiento de modelos |
| `MODEL_ROUTER_PROFILE` | `auto` | `fast`, `balanced`, `premium-local`, `auto` |
| `GPU_VRAM_GB` | `0` | VRAM disponible en GB |
| `DATABASE_PATH` | `./maestro.db` | Ruta de la base de datos SQLite |
| `REDIS_HOST` | `localhost` | Host de Redis |
| `DEBUG_MODE` | `false` | Guarda artefactos de debug en `debug_runs/` |
| `PIPELINE_SOFT_MODE` | `false` | Si falla una fase, continúa con lo que hay |
| `COMFY_ENABLED` | `false` | Activa generación de imágenes con ComfyUI |
| `COMFY_BASE_URL` | `http://127.0.0.1:8188` | URL de ComfyUI |
| `COMFY_LORA_ENABLED` | `false` | Activa LoRA en las imágenes |
| `DASHBOARD_PORT` | `8081` | Puerto del backend API |
| `GRAVITY_CONTENT_DEPTH` | `standard` | `compact`, `standard`, `premium` |
| `GRAVITY_PREMIUM_TARGET_WORDS` | `2000` | Objetivo de palabras en modo premium |

---

*Gravity SEO Engine V8.1 — Mayo 2026*
