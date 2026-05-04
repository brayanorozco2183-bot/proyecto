# Integraciones opcionales de Gravity

## 1. Enfoque

Gravity tiene módulos y dependencias que permiten ampliar el sistema, pero no todas las integraciones deben presentarse como obligatorias o siempre activas.

Este documento separa núcleo confirmado de integraciones opcionales.

## 2. Núcleo confirmado

El núcleo del proyecto incluye:

- Código TypeScript.
- Pipeline de generación.
- Agentes.
- Diseño procedural.
- Interlinking.
- Guards.
- Sanitización.
- Salida HTML estática.
- Scripts de auditoría.
- Logs de ejecución.

## 3. Ollama / modelos locales

El proyecto puede usar modelos locales vía Ollama si el entorno está configurado.

Variables habituales:

```env
OLLAMA_HOST=http://localhost:11434
DEFAULT_MODEL=qwen2.5:7b
```

Requisitos:

- Ollama instalado.
- Modelos descargados.
- Endpoint accesible.
- Configuración de router/modelos correcta.

No debe afirmarse que un modelo concreto está siempre activo. Depende de la configuración y disponibilidad local.

## 4. ComfyUI / generación de imágenes

El proyecto contiene workflows y módulos relacionados con imágenes y ComfyUI.

Debe documentarse como integración opcional:

- Requiere ComfyUI instalado o endpoint disponible.
- Requiere workflows válidos.
- Requiere assets/modelos configurados.
- Puede fallar si el entorno gráfico o los modelos no están preparados.

Variables posibles:

```env
COMFYUI_ENDPOINT=http://localhost:8188
```

Formulación correcta:

> Gravity puede integrarse con generación de imágenes si ComfyUI y los workflows están configurados.

Evitar:

> Gravity genera siempre imágenes únicas con IA para cada página.

## 5. WordPress

WordPress debe considerarse un destino opcional.

Para documentarlo como activo deben existir:

- Endpoint REST.
- Credenciales válidas.
- Mapeo de campos.
- Prueba de publicación.
- Logs de entrega.

Variables posibles:

```env
WORDPRESS_API_URL=
WORDPRESS_USERNAME=
WORDPRESS_APP_PASSWORD=
```

Formulación correcta:

> El núcleo confirmado es HTML estático. WordPress puede usarse como integración adicional si el módulo y credenciales están configurados.

## 6. Playwright / UX validation

El proyecto incluye dependencias opcionales relacionadas con Playwright y automatización.

Puede usarse para:

- Capturas.
- Validación responsive.
- Comprobaciones visuales.
- Tests de navegación.

No debe afirmarse que cada misión pasa siempre validación Playwright si no forma parte obligatoria del flujo ejecutado.

## 7. Dashboard

El proyecto contiene un dashboard local. Puede ser útil para:

- Ejecutar o revisar misiones.
- Observar logs.
- Gestionar parámetros.
- Ver estado del sistema.

Si se expone fuera de localhost, debe revisarse seguridad, autenticación y variables de entorno.

## 8. SQLite / memoria / aprendizaje

El proyecto tiene módulos relacionados con memoria, aprendizaje y exemplars.

Uso adecuado:

- Registrar fallos técnicos.
- Reutilizar lecciones aprendidas.
- Inyectar ejemplos buenos.
- Bloquear anti-patrones.

Precaución:

- No aprender automáticamente de contenido mediocre.
- No mezclar memoria técnica con memoria editorial sin curación.
- Mantener backups de la base de datos si se usa en producción.

## 9. Dependencias opcionales

El `package.json` incluye dependencias opcionales como:

- `playwright`.
- `express`.
- `cors`.
- `bullmq`.
- `ioredis`.
- `basic-ftp`.
- `ssh2-sftp-client`.

Estas piezas permiten ampliar el sistema, pero no todas forman parte del flujo mínimo.

## 10. Perfiles de ejecución recomendados

### Perfil básico local

- Node.js.
- npm install.
- TypeScript.
- Salida HTML.

### Perfil local con LLM

- Perfil básico.
- Ollama.
- Modelo descargado.

### Perfil visual con imágenes

- Perfil local con LLM.
- ComfyUI.
- Workflows.
- Modelos/assets.

### Perfil producción estática

- Build/typecheck.
- Auditorías.
- Carpeta `output_sites`.
- Hosting estático.

### Perfil WordPress

- Perfil producción.
- API REST configurada.
- Credenciales.
- Prueba de publicación.

## 11. Resumen

Gravity es más claro y creíble cuando se documenta por capas: núcleo funcional, módulos opcionales e integraciones experimentales. Esto permite explicar todo el potencial del proyecto sin prometer que todos los módulos están activos en cada ejecución.
