# Agentes y módulos del Proyecto Gravity

## 1. Enfoque general

Gravity separa responsabilidades en agentes y módulos. Esto permite que el sistema sea más mantenible que una plantilla monolítica o un único prompt largo.

Los agentes definen tareas de alto nivel. Los módulos de soporte gestionan diseño, interlinking, validación, memoria, imágenes, dashboard, guards y utilidades.

## 2. Agentes principales

### Content Architect

Responsable de planificar la estructura de la página. Decide qué secciones necesita la página y cómo se ordenan.

Aporta:

- Arquitectura de contenido.
- Jerarquía de bloques.
- Intención local.
- Distribución del mensaje comercial.

### Art Director

Responsable del ADN visual. Define personalidad, familia de diseño y tratamiento visual.

Aporta:

- Personalidad visual.
- Contraste.
- Layout del hero.
- Tratamiento de tarjetas.
- Ritmo de secciones.

Debe funcionar de forma defensiva cuando falten datos de entrada.

### Content Writer

Responsable de redactar bloques. Debe seguir el playbook de nicho y escribir en español natural.

Aporta:

- Hero.
- Servicios.
- Bloques de confianza.
- FAQ.
- CTAs.
- Texto local.

### Layout Composer

Responsable de ensamblar HTML final a partir de contenido y diseño.

Aporta:

- Estructura HTML.
- Composición visual.
- Inserción de componentes.
- Integración de CSS y schema.

### NAP Guardian / NAP module

Responsable de validar y normalizar identidad local:

- Nombre.
- Teléfono.
- Dirección.
- Área servida.
- Datos de contacto.

Regla clave: no inventar datos si no se reciben.

### Spanish Linguistic Corrector / Linguist

Responsable de mejorar el español y corregir fragmentos rotos.

Aporta:

- Naturalidad.
- Corrección gramatical.
- Signos de interrogación.
- Frases locales completas.

### Niche Coherence Auditor

Responsable de mantener el contenido dentro del nicho.

Aporta:

- Detección de términos ajenos.
- Coherencia sectorial.
- Reducción de contaminación entre verticales.

### Quality / SEO / Technical modules

Responsables de checks técnicos:

- SEO básico.
- Schema.
- HTML.
- Enlaces.
- Seguridad de salida.
- Limpieza final.

## 3. Módulos por carpeta

### `src/agents`

Contiene agentes de planificación, escritura, diseño, NAP, SEO, calidad, despliegue y soporte.

### `src/design-system`

Contiene el motor visual procedural:

- Familias visuales.
- Temas.
- Tokens.
- Componentes.
- Contraste.
- Presets.
- Masterclass registry.

### `src/internal-linking`

Gestiona enlaces internos y site graph:

- Planificación de enlaces.
- Reglas.
- Validación.
- Bloques automáticos.
- Adaptadores de pipeline.

### `src/guards`

Agrupa validaciones por dominio:

- Copy.
- HTML.
- Layout.
- Legal.
- Links.
- NAP.
- Schema.
- SEO.

### `src/images`

Gestiona imágenes y posibles integraciones ComfyUI.

Debe documentarse como módulo opcional o dependiente de configuración si no se usa en todas las misiones.

### `src/learning`

Contiene piezas de aprendizaje, ejemplares y prompt augmentation si están activas.

Uso recomendado:

- Guardar ejemplos buenos.
- Guardar anti-patrones.
- Evitar aprender de salidas mediocres sin revisión.

### `src/debug`

Gestiona logs, artefactos de fase y trazabilidad.

Muy útil para entender por qué una misión falla o qué fase produce cierto resultado.

### `src/dashboard`

Contiene servidor y lógica de dashboard si se usa interfaz local.

Debe protegerse si se expone fuera del entorno de desarrollo.

## 4. Prompts por agente

El proyecto incluye prompts organizados por agente, normalmente con archivos `HUMAN.md` y `SKILL.md`.

Esta separación permite distinguir:

- **Skill:** capacidad técnica del agente.
- **Human:** tono, identidad editorial y criterios de comunicación.

Esta arquitectura es positiva porque evita mezclar instrucciones técnicas con estilo de escritura.

## 5. Contratos recomendados

Para mejorar estabilidad, cada agente debería tener contrato de salida validado.

Ejemplo conceptual:

```ts
const ArtDirectorOutputSchema = z.object({
  personality: z.string().default("professional"),
  contrastModel: z.string().default("balanced"),
  cardTreatment: z.string().default("outlined"),
  heroLayout: z.string().default("split")
});
```

Esto evitaría que una propiedad ausente rompa fases posteriores.

## 6. Resumen

La arquitectura por agentes es una de las fortalezas reales del proyecto. Permite crecer por módulos, añadir verticales, cambiar estilos, revisar fases concretas y diagnosticar problemas sin reescribir todo el generador.
