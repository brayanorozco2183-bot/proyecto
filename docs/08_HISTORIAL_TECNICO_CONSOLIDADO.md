# Historial técnico consolidado

## 1. Propósito

Este documento fusiona los informes de parches e incidencias históricas en una visión más limpia. No pretende enumerar cada parche, sino explicar cómo ha evolucionado Gravity y qué mejoras quedan integradas en el estado actual.

## 2. Evolución principal

Gravity ha evolucionado en varias direcciones:

1. Mayor estabilidad de pipeline.
2. Mejor separación por agentes.
3. Más control sobre HTML final.
4. Diseño procedural más rico.
5. Mejor coherencia de nicho.
6. Enlazado interno más seguro.
7. Sanitización final más estricta.
8. Documentación más prudente.
9. Integraciones externas tratadas como opcionales.

## 3. Hardening de bloques

Los informes históricos sobre BLE y contratos de bloque apuntaban a una necesidad real: que cada bloque tenga estructura y payload claro.

Estado actual recomendado:

- Cada bloque debe tener tipo identificable.
- Cada bloque debe tolerar datos incompletos.
- No deben renderizarse wrappers vacíos.
- Los CTAs deben depender de datos reales.
- FAQ debe salir de preguntas reales.

## 4. Hardening HTML

La evolución del proyecto ha reforzado la importancia del HTML final.

Mejoras integradas conceptualmente:

- Limpieza de placeholders.
- Corrección de fragmentos rotos.
- Reordenación de interlinks.
- Footer como último bloque visual.
- Eliminación de duplicados.
- Evitar rutas locales.
- JSON-LD prudente.

## 5. Hardening de nicho

La documentación antigua hablaba de inteligencia de nicho. La versión actual debe expresarlo así:

Gravity puede usar playbooks, vocabularios y reglas para mantener coherencia por vertical. Esto mejora la calidad del contenido y reduce mezclas entre sectores.

Ejemplos:

- Carpinteros: madera, puertas, armarios.
- Electricistas: cuadro, boletín, averías.
- Fontaneros: fugas, bajantes, atascos.
- Cerrajeros: bombines, apertura, cerraduras.

## 6. Hardening de flujo

Los informes de estabilización de flujo quedan consolidados en estas reglas:

- Cada fase debe registrar inicio y fin.
- Cada fallo debe mostrar fase y agente.
- Los warnings no deben confundirse con errores bloqueantes.
- Las estructuras opcionales deben validarse antes de usarse.
- Una misión no debe romperse por datos ausentes si puede usar fallback seguro.

## 7. Observabilidad

El proyecto cuenta con logs por misión y fases. Esto es una fortaleza real porque permite diagnosticar problemas de forma precisa.

La observabilidad debería seguir creciendo con:

- Artefactos intermedios por fase.
- JSON de entrada/salida por agente.
- Resumen de decisiones.
- Métricas de duración.
- Registro de fallbacks aplicados.

## 8. Calidad de salida

La calidad actual debe medirse por criterios verificables:

- HTML limpio.
- SEO técnico básico.
- Coherencia de nicho.
- Coherencia local.
- CTA honesto.
- Schema prudente.
- Diseño responsive.
- Ausencia de residuos internos.

Evitar usar métricas no verificadas como “100/100” salvo que exista una auditoría reproducible.

## 9. Integraciones históricas

Documentos anteriores sobre ComfyUI, WordPress, Playwright o automatización deben quedar agrupados como integraciones opcionales.

Esto no resta valor. Al contrario: deja claro que Gravity tiene un núcleo sólido y extensiones posibles.

## 10. Incidencias recientes incorporadas

Se han integrado aprendizajes de:

- FAQ contaminado por menú móvil.
- Interlinking después del footer.
- Textos internos visibles.
- Frases locales incompletas.
- CTA sin teléfono válido.
- Fallo de `Art_Director_01` por `.some()` sobre undefined.

En la documentación actual estos puntos aparecen como hardening aplicado y recomendaciones de validación, no como foco negativo.

## 11. Estado final del historial

Los parches históricos muestran una evolución positiva: Gravity ha pasado de ser un generador funcional a un sistema más robusto, prudente y preparado para escalar páginas locales con mejor control de calidad.

La siguiente fase lógica es consolidar tests automáticos y contratos estrictos de salida para que los avances queden protegidos contra regresiones.
