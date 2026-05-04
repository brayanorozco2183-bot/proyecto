# Informe Técnico: Arquitectura de la Pipeline Gravity (v6.5)

Este documento detalla el funcionamiento interno de la pipeline de generación SEO "Gravity", diseñada para la creación masiva y automatizada de sitios estáticos de alta calidad y despliegues en WordPress, con un enfoque en SEO local y semántico, escalabilidad multi-nicho y resiliencia técnica.

---

## 1. Visión General
Gravity v6.5 es una **Arquitectura Multi-Agente Orquestada** diseñada para la dominación de clusters locales y la escalabilidad multi-vertical. A diferencia de generadores tradicionales, Gravity utiliza un sistema de **"Puertas de Calidad" (Quality Gates)**, un motor de **"Detección de Contaminación Cruzada" (Niche Isolation)** y un sistema de **"Branding Sanitizado"** para asegurar que el output sea indistinguible de un sitio artesanal premium.

### Dualidad de Despliegue
El sistema soporta dos modos de salida principales:
1.  **Estáticos (HTML/CSS)**: Máxima velocidad, seguridad total y coste de hosting cero.
2.  **WordPress**: Integración profunda con el CMS para gestión de contenidos dinámica, sincronizando taxonomías, metadatos y esquemas JSON-LD.

---

## 2. Desglose Detallado de las 18 Fases

### Phase 0.1: Resolución Universal de Nicho (Canonical Playbook)
*   **Función**: Determina las reglas específicas del sector mediante una canonización inteligente.
*   **Aprendizaje**: El sistema ya no depende de nombres exactos. Consultas long-tail como *"cambio de bombín"* o *"cerrajeros antibumping"* se mapean automáticamente al playbook base (*Cerrajeros*) mediante `getCanonicalNicheLabel`.
*   **Escalabilidad**: Soporte nativo para múltiples nichos (Cerrajeros, Fontaneros, Electricistas, Carpinteros, Pintores) con aislamiento de activos.

### Phase 0.5: Inicialización del Grafo de Sitio (Cluster Graph)
*   **Función**: Crea el "Site Graph" para la interconexión semántica.
*   **Acción**: Identifica ciudades vecinas y relaciones (Home -> Servicio -> Barrio) para el motor de interlinking.

### Phase 1: Investigación (Research)
*   **Agentes**: `GeoIntelAgent`, `CompetitorAuditAgent`.
*   **Acción**: Scrapeo de SERP real y auditoría profunda de competidores líderes.
*   **Dato Clave**: Extrae H1s, H2s y volumen de palabras de los que ya están en el Top 3.

### Phase 2: Normalización de Identidad (Branding & NAP Sanitization)
*   **Proceso**: Limpia y estandariza datos de NAP (Nombre, Dirección, Teléfono).
*   **Innovación**: Motor de sanitización de marcas que elimina prefijos técnicos ruidosos (ej. *"de cerrajeros"*) y sufijos duplicados (*"En Ciudad"*), asegurando que el `og:site_name` y el `Organization Name` sean comerciales y limpios.

### Phase 3: Planificación Arquitectónica
*   **Agente**: `ContentArchitectAgent`, `ArtDirectorAgent`.
*   **Acción**: Diseña el esqueleto de la página y el "ADN Visual".
*   **Ejemplo de ADN Visual**: 
    ```json
    { "personality": "luxury", "contrastModel": "dramatic", "cardTreatment": "elevated" }
    ```

### Phase 3.5: Render Plan Resolver
*   **Función**: Mapea las secciones lógicas (ej. "FAQ") a componentes visuales específicos del motor procedural.

### Phase 4: Redacción por Bloques (Writing)
*   **Agente**: `ContentWriterAgent`.
*   **Proceso**: Generación sección por sección para evitar la degradación de la atención del LLM.

### Phase 5: Refinamiento Lingüístico y Aislamiento de Nicho
*   **Acción**: Corrección gramatical asistida por el **"Cross-Niche Detector"**.
*   **Gate de Aislamiento**: Un filtro heurístico analiza si el texto ha sido "contaminado" por términos de otros nichos (ej. mencionar tuberías en una página de carpintería) y activa fallbacks deterministas si el score de contaminación supera el umbral de seguridad.

### Phase 6: Puerta de Integridad de Bloques
*   **Verificación**: Busca "Template Leaks" como `{{ciudad}}` o `[INSERTAR TELEFONO]`.

### Phase 7: Arquitectura de Enlazado Garantizado (Internal Linking Hub)
*   **Proceso**: Generación de bloques de interlinking con **Inyección Directa de Href**.
*   **Estabilidad**: Se ha abandonado el post-procesado frágil en favor de la inyección directa de rutas relativas (`index.html`) en el momento de renderizado. 
*   **Aprendizaje**: El Hub de enlaces utiliza títulos genéricos (*"Servicios recomendados y sedes de apoyo"*) para permitir conexiones naturales entre servicios de diferentes verticales dentro del mismo cluster geográfico.

### Phase 7.5: Arquitectura SEO (Schema.org)
*   **Acción**: Generación de JSON-LD avanzado.
*   **Ejemplo de JSON-LD**: 
    ```json
    {
      "@type": "LocalBusiness",
      "name": "Fontaneros en Madrid",
      "areaServed": { "@type": "City", "name": "Madrid" }
    }
    ```

### Phase 8: Ensamblaje Procedural (Assembly)
*   **Acción**: El `LayoutComposerAgent` une los bloques de texto con el código HTML premium.

### Phase 8.2: Generación de Imágenes (ComfyUI/LoRA)
*   **Proceso**: Generación de imágenes únicas mediante IA.
*   **Prompting**: Se inyectan datos del nicho y ciudad en el workflow de Flux/LoRA para realismo local.

### Phase 8.5: Completeness Guard
*   **Gate**: Verifica que no existan secciones vacías o errores de renderizado.

### Phase 9: Validación Técnica (SEO & UX)
*   **Acción**: Verifica canonicals, robots y legibilidad.
*   **UX Validation**: Testeo con Playwright para asegurar diseño responsive.

### Phase 9.5: Quality Gate Determinista
*   **Función**: Asigna una puntuación final (0-100).
*   **Gate**: Si la nota es inferior a 80, activa re-generación o "Soft Mode".

### Phase 10: Auditoría Editorial (EEAT)
*   **Agente**: `QualityScoreAgent`.
*   **Acción**: Un LLM "crítico" analiza si el texto suena realmente humano y profesional.

### Phase 11: Despliegue (Delivery)
*   **Static**: Escritura en `/output_sites/` con rutas relativas limpias.
*   **WordPress**: Publicación vía API REST con persistencia de metadatos SEO.

---

## 4. Hardening Estructural y Lingüístico (v6.5.1)

En la versión 6.5.1, se ha implementado un sistema de **"Hardening de Raíz"** para eliminar las dos debilidades históricas del sistema: la destrucción accidental de HTML y las alucinaciones de preposiciones (ej: "en .").

### 4.1 Post-Procesado DOM-Aware vs String-Regex
Anteriormente, el sistema utilizaba expresiones regulares globales sobre el string final del HTML. Esto causaba que bloques complejos (como el Hub de Interlinking) perdieran sus etiquetas `<a>` al ser confundidos con texto plano.
*   **Nueva Arquitectura**: El motor de pulido (`finalHtmlPolish.ts`) ahora es 100% **DOM-Aware** mediante Cheerio.
*   **Protección de Tags**: Las reparaciones lingüísticas solo se ejecutan sobre nodos de tipo `text`, garantizando que la estructura de enlaces, botones y grids premium permanezca intacta.
*   **Sanitización Jerárquica**: Los parches se aplican primero en el agente (Writer), luego en el ensamblaje (Sanitizer) y finalmente en el pulido final (Polish), creando tres capas de contención.

### 4.2 Motor de Reparación Heurística Local
Para combatir las alucinaciones del modelo (pérdida del nombre de la ciudad en frases largas), se ha institucionalizado el motor `repairBrokenLocalFragments`:
1.  **Detección de Huecos**: Localiza preposiciones huérfanas seguidas de puntuación (`en .`, `en :`, `en !`).
2.  **Inyección Directa**: Si se detecta un hueco y el sistema tiene identificada la ciudad, se inyecta el nombre real de forma mecánica.
3.  **Detección de Ciudad Multi-Fuente**: El sistema busca la ciudad en el JSON-LD, en el Canonical URL o en el H1 antes de decidir que no tiene contexto para reparar.

---

## 5. Arquitectura de Agentes: Skill vs Human Identity

Gravity v6.5 separa la **capacidad técnica (Skill)** de la **identidad editorial (Human Identity)**. Esta dualidad permite que un mismo agente "aprenda" a ser experto en cualquier sector sin cambiar su código.

### 5.1 El "Skill" (La Capacidad Técnica - El 'Robot')
El *Skill* reside en la infraestructura del agente (`base.ts`) y sus herramientas. Es la parte determinista que garantiza la perfección técnica:
- **Validación Estructural**: Conocimiento de semántica HTML5 y jerarquía de encabezados.
- **Memoria Persistente (SQLite)**: Capacidad para recordar fallos previos (`rememberFailure`) y aplicar lecciones aprendidas en misiones pasadas para no repetir errores de formato.
- **Sanitización de Salida**: Motor interno que elimina artefactos de IA (ej: "Claro, aquí tienes el texto...") antes de entregar el bloque.

### 5.2 El "Human" (La Identidad Editorial - La 'Voz')
La identidad *Human* se inyecta dinámicamente desde el **Niche Playbook** en cada misión. Es lo que otorga autoridad y empatía:
- **Playbooks Semánticos**: Cada nicho (vía `playbookLoader.ts`) inyecta un "Brief de Escritura" que define el tono.
- **Aislamiento de Vertical**: El sistema protege la identidad "Human" bloqueando términos que pertenecen a otras especialidades (ej: un electricista nunca hablará de "tuberías" gracias al Cross-Niche Detector).
- **Intención de Usuario (Intent Mapping)**: El agente adapta su personalidad para responder a la duda real del usuario (ej: ¿Cuánto cuesta?) con un enfoque comercial local.

---

## 6. Motor de Aprendizaje Profundo e Inteligencia de Exemplars (v6.6)

Gravity v6.6 introduce un sistema de **Entrenamiento por Exemplars** que permite al usuario actuar como el "Maestro Editorial" de la IA. Este sistema rompe con la dependencia de prompts estáticos y utiliza una base de datos de aprendizaje dinámico (`maestro.db`).

### 6.1 El Estándar de Oro (Exemplars 100/100)
A diferencia de los LLMs tradicionales que tienden a la mediocridad (estirando frases y usando clichés), Gravity utiliza **Exemplars Curados**:
- **Exemplars Positivos**: Fragmentos de texto perfectos diseñados por humanos para cada nicho y tipo de bloque. Estos ejemplos enseñan al sistema el tono técnico (ej. hablar de "bombines antibumping" o "herrajes de DM") y eliminan el lenguaje comercial vacío.
- **Score-Based Priority**: Cada ejemplar tiene una puntuación (0-100). El sistema prioriza automáticamente aquellos con score 100 en el `PromptAugmenter`.

### 6.2 Cortafuegos de Anti-Patrones (Negative Exemplars)
Una innovación crítica es el uso de **Ejemplares Negativos (Polarity: negative)** con Score 0:
- El sistema almacena ejemplos de "basura editorial" (relleno de IA, keyword stuffing salvaje, frases tipo "En el mundo tecnológico de hoy...").
- Al inyectar estos como "Anti-Patrones", se le da al modelo una referencia clara de lo que **NUNCA** debe hacer, actuando como un cortafuegos preventivo contra la degradación del contenido.

### 6.3 Prompt Augmentation dinámica
Antes de cada llamada al LLM, el `BaseAgent` ejecuta una consulta relacional:
1. **Inferencia de Contexto**: Identifica el nicho (`carpinteros`), el destino (`Lugo`) y el bloque (`hero`).
2. **Sembrado de Memoria**: Extrae los 2 mejores ejemplares positivos y los 2 peores negativos de la base de datos.
3. **Inyección en Tiempo Real**: Estos ejemplos se inyectan en el prompt original como *"PATRONES QUE FUNCIONARON BIEN"* y *"PATRONES QUE DEBES EVITAR"*.

### 6.4 Saneamiento Editorial Selectivo
Para evitar que el sistema aprenda de sus propios errores mediocres (bucles de retroalimentación negativa), Gravity permite un **Wipe Editorial**:
- Se borran las lecciones aprendidas de redacción degradada.
- Se mantienen las lecciones técnicas (infraestructura y fallos).
- Se inyectan los **Exemplars Maestros**.
Esto garantiza que el sistema sea técnicamente "anciano" (con mucha experiencia en no romperse) pero editorialmente "perpetuamente perfecto".

---

## 7. Integración WordPress

El agente `WPBridgeAgent` actúa como el conector final:
- **Taxonomías**: Sincroniza categorías y etiquetas según el nicho.
- **Metadatos SEO**: Inyecta el JSON-LD directamente en el campo `_schema_jsonld`.
- **Estado de Post**: Gestión de estados (Borrador/Publicado).

---

## 8. Diagrama de Flujo (Pipeline v6.6)

```mermaid
graph TD
    A[Misión] --> B[Phase 0.1: Playbook & Graph]
    B --> C[Phase 1: Research Deep Audit]
    C --> D[Phase 2: NAP Intelligence]
    D --> E[Phase 3: Planning & DNA]
    E --> F[Phase 4: Block Writing]
    F --> G[Phase 5: Linguistic Refinement]
    
    %% Bucle de Aprendizaje
    F -.-> L1[Augmenter: Exemplars 100/100]
    L1 -.-> F
    
    G --> H[Phase 6: Integrity Guard]
    H --> I[Phase 7: SEO & Schema Architecture]
    I --> J[Phase 8: Assembly & ComfyUI Images]
    J --> K[Phase 9: Technical & UX Validation]
    K --> L[Phase 9.5: Quality Gate & scoring]
    
    %% Registro de Lecciones
    L -.-> L2[Memory: maestro.db]
    L2 -.-> L1
    
    L --> M[Phase 10: EEAT Editorial & Polish]
    M --> N{Deploy Mode?}
    N -- Static --> O[Local HTML Delivery]
    N -- WordPress --> P[WP REST API Sync]
    O --> Q[Hardening DOM-Aware finalHtmlPolish]
    P --> Q
    Q --> R[Sitio Listo (Tier 1 Production)]
```

---

## 9. Guía de Migración y Requisitos del Entorno

Para migrar el Proyecto Gravity a un nuevo ordenador o servidor, se deben cumplir los siguientes requisitos técnicos y de configuración:

### 1. Requisitos de Software (Runtime)
- **Node.js**: Versión 20.x o superior (Recomendado para soporte total de módulos ESM).
- **Gestor de Paquetes**: npm o pnpm.
- **SQLite3**: El motor de persistencia utiliza SQLite. Asegúrate de que el entorno permita la escritura de archivos `.db`.

### 2. Estructura de Archivos Crítica
Para que el sistema sea funcional tras la migración, se deben mover los siguientes directorios y archivos:
- `/src`: Todo el código fuente y lógica de agentes.
- `/src/niches/playbooks`: Los archivos JSON que definen las verticales (esenciales para la Phase 0.1).
- `maestro.db`: La base de datos central que contiene el historial de misiones y el grafo de sitios.
- `.env`: Archivo de configuración con las API Keys y endpoints.

### 3. Configuración de Variables de Entorno (.env)
Es imperativo configurar el archivo `.env` en la raíz del proyecto con los siguientes parámetros:
- `OLLAMA_HOST`: Dirección del servidor de Ollama (ej. `http://localhost:11434`) si se usan modelos locales.
- `DEFAULT_MODEL`: El modelo LLM por defecto para la redacción (ej. `qwen2.5:7b`).
- `GOOGLE_MAPS_API_KEY`: Necesaria para la Phase 1 (investigación geo-localizada).
- `PIPELINE_MODE`: `production` o `debug`.

### 4. Dependencias Externas (IA)
Si se utiliza ejecución local:
- **Ollama**: Debe estar instalado y con los modelos descargados (ej. `ollama pull qwen2.5:7b`).
- **ComfyUI**: Si se activa la Phase 8.2 (imágenes), el endpoint de ComfyUI debe estar accesible.

### 5. Pasos para la Puesta en Marcha
1. Instalar dependencias: `npm install`.
2. Verificar conexión a base de datos: Ejecutar un script de prueba corto (ej. `test_playbook_resolution_long_tail.ts`).
3. Comprobar permisos de escritura: Asegurarse de que el proceso tiene permisos para crear carpetas en `/output_sites/`.

---
> **Doc Update 2026-04-23**: Versión 6.5 - Multiniche Stability Patch & Migration Guide.
