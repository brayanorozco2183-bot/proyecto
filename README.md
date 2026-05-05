# Gravity SEO Engine — V8.1

Motor de generación de contenido SEO de alta fidelidad, impulsado por agentes de IA locales (Ollama + ComfyUI). Genera páginas HTML semánticamente optimizadas para nichos de servicios locales en España, con imágenes fotorrealistas y despliegue automático.

> **Guía de instalación completa:** [`docs/GUIA_INSTALACION.md`](./docs/GUIA_INSTALACION.md)  
> **Arquitectura técnica:** [`docs/GRAVITY_ARQUITECTURA_ACTUAL.md`](./docs/GRAVITY_ARQUITECTURA_ACTUAL.md)

---

## ✨ Características principales

- **18 fases de pipeline**: Investigación SERP → Redacción editorial → Ensamblaje HTML → Imágenes → Despliegue
- **Multi-agente**: 20+ agentes especializados por fase, con modelos Ollama asignados por tier de complejidad
- **Imágenes con Flux**: Generación visual fotorrealista vía ComfyUI con soporte LoRA por nicho
- **6 nichos con playbook**: Cerrajeros, Electricistas, Fontaneros, Carpinteros, Pintores, Reformas
- **Maestro Dashboard**: Control total en tiempo real desde interfaz web
- **100% local**: Sin APIs externas de pago. Todo corre en tu máquina

---

## ⚡ Inicio rápido

```bash
# 1. Clonar
git clone https://github.com/brayanorozco2183-bot/proyecto.git
cd proyecto

# 2. Instalar dependencias
npm install
cd maestro-dashboard && npm install && cd ..

# 3. Configurar entorno
cp .env.example .env
# → Editar .env con tus rutas de Ollama y ComfyUI

# 4. Arrancar
npm run dashboard          # Terminal 1 — Backend API (puerto 8081)
cd maestro-dashboard && npm run dev  # Terminal 2 — Dashboard (puerto 8085)
```

Abre `http://localhost:8085` en tu navegador.

---

## 🔧 Requisitos del sistema

| Componente | Requerido | Notas |
|---|---|---|
| Node.js v18+ | ✅ Sí | |
| Ollama | ✅ Sí | Con modelos `qwen2.5:1.5b`, `qwen2.5:latest`, `qwen2.5-coder:3b` |
| ComfyUI | ✅ Para imágenes | Modelos Flux1-Schnell en puerto 8000 |
| Redis | ⬜ Opcional | Sin Redis el sistema funciona en modo secuencial |
| VRAM GPU | ⬜ Recomendado | 4GB mínimo para Flux Q2_K |

---

## 📁 Estructura del proyecto

```
src/
├── agents/          # Agentes de IA especializados
├── ai/              # Model Router y Agent Registry
├── dashboard/       # API Express (backend)
├── niches/          # Playbooks por nicho
├── orchestrator/    # Orquestador principal
├── pipeline-state/  # State machine del pipeline
├── pipelines/       # Fases del pipeline (research, writing, assembly...)
├── quality/         # Gates de calidad
├── renderers/       # Ensamblaje HTML
├── utils/           # Utilidades y control de runtime
└── tools/           # AIFacade, vault, scraper

maestro-dashboard/   # Frontend Next.js
docs/                # Documentación
prompts/             # Prompts de agentes
workflows/           # Workflows de ComfyUI
```

---

## 📖 Documentación

| Documento | Descripción |
|---|---|
| [`docs/GUIA_INSTALACION.md`](./docs/GUIA_INSTALACION.md) | Guía completa paso a paso para instalar y configurar |
| [`docs/GRAVITY_ARQUITECTURA_ACTUAL.md`](./docs/GRAVITY_ARQUITECTURA_ACTUAL.md) | Arquitectura, fases, agentes y modelos |
| [`docs/GUIA_INSTALACION_COMFY.md`](./docs/GUIA_INSTALACION_COMFY.md) | Instalación de ComfyUI y modelos Flux |
| [`docs/INFORME_TECNICO_COMFY_LORA.md`](./docs/INFORME_TECNICO_COMFY_LORA.md) | Sistema LoRA por nicho |
| [`docs/GUIA_EXEMPLARS_PREMIUM.md`](./docs/GUIA_EXEMPLARS_PREMIUM.md) | Sistema de aprendizaje de agentes |
