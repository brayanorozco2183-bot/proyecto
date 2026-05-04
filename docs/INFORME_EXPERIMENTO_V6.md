# INFORME TÉCNICO: EXPERIMENTO 30 SITIOS (GRAVITY V6)
**Fecha del Informe**: 2026-04-23
**Ambiente**: Getafe (Saturación Local)
**Misión**: Validación de Estabilidad Editorial y Expansión Premium

## 1. Resumen Ejecutivo
El experimento de 30 sitios confirma la madurez del **Motor Estético (Tier 8.7)** y la efectividad de los parches de pulido final (`finalHtmlPolish`). Sin embargo, se ha detectado un cuello de botella crítico en el **Mapeo de Nichos** que impide la expansión automática hacia consultas de "long-tail" o servicios especializados, resultando en una tasa de fallo del 53% en variaciones de palabras clave.

## 2. Análisis de Rendimiento por Bloques

### Bloque A: Estabilidad Operativa (100% Éxito)
*   **Puntuación Media**: 79.3 / 100
*   **Consistencia**: Alta. Tras una primera iteración de aprendizaje (54/100), el sistema se estabilizó inmediatamente en 82/100.
*   **Conclusión**: El sistema es extremadamente fiable en tareas repetitivas y "seguras".

### Bloque B: Expansión de Servicios (26% Éxito)
*   **Puntuación Media**: 56.0 / 100 (sobre misiones completadas)
*   **Falla Crítica**: La mayoría de las misiones (apertura urgente, cambio de cerradura, etc.) fallaron al no encontrar un "Playbook" asociado.
*   **Causa**: El intérprete de lenguaje extrae el nicho con demasiada literalidad (incluyendo preposiciones como "de...") lo que rompe la búsqueda determinista de playbooks.

### Bloque C: Optimización Aprendida (20% Éxito)
*   **Puntuación Media**: 82.0 / 100
*   **Conclusión**: Cuando el Playbook se localiza correctamente, la calidad es sobresaliente, pero el fallo sistémico de mapeo persiste.

## 3. Auditoría de Calidad y Estética

### ✅ Éxitos (Integridad del Sistema)
*   **Control de Placeholders**: 0 incidencias. "Llamativa y natural" fue reemplazado exitosamente en el 100% de los casos por "Consultar presupuesto" o "Contactar".
*   **CSS Premium**: El tamaño de 59KB se mantuvo estable sin corromperse. Los efectos de glassmorphism y sombras dramáticas son visibles y funcionales.
*   **Interlinking Scoped**: Todos los enlaces internos se mantuvieron dentro del cluster `/de-cerrajeros-getafe/`, corrigiendo la contaminación regional observada en misiones previas.

### ⚠️ Regresiones (Puntos de Fricción)
*   **Niche-Ghosting**: Debido al fallo en el Playbook, algunas páginas se generaron sin la estructura de autoridad requerida, lo que explica los scores de 63/100 observados en el Bloque B.
*   **Truncamiento de Slugs**: Se detectaron carpetas con nombres cortados como `...sustituir-una-cerradura-en-getaf`, indicando un límite de caracteres en el generador de rutas.

## 4. Métricas Detalladas (Muestreo)

| Iteración | Niche Interpretado | Score | Status | Detalle |
| :--- | :--- | :--- | :--- | :--- |
| 01 | de cerrajeros | 54 | OK | Curva de aprendizaje inicial. |
| 02-10 | de cerrajeros | 82 | OK | Estabilidad máxima. |
| 11 | de apertura urgente... | -- | FAIL | No Playbook found. |
| 14 | de cerrajero para... | 63 | OK | Calidad degradada por falta de datos nicho. |
| 20 | de cerrajeros 24 horas | 82 | OK | Mapeo exitoso (contiene keyword 'cerrajeros'). |

## 5. Recomendaciones Técnicas
1.  **Fuzzy Playbook Mapper**: Modificar `PlaybookLoader.ts` para que realice búsquedas semánticas o ignore prefijos comunes (`de `, `servicios de `).
2.  **Mapping Automático**: Forzar que cualquier variación que contenga términos de cerrajería apunte al playbook `cerrajeros.json` si no hay uno específico.
3.  **Slug Refactor**: Aumentar el límite de caracteres para rutas locales para evitar truncamientos en URLs informativas.

---
*Informe generado automáticamente por Antigravity AI.*
