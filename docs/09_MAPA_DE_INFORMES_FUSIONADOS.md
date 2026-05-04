# Mapa de informes fusionados

## 1. Criterio

El ZIP original contenía 28 informes Markdown. Muchos eran informes de parche o notas de integración muy específicas. Para crear una documentación útil del estado actual, se han fusionado por tema y se han omitido documentos redundantes cuando su contenido ya aparece en informes principales.

## 2. Informes originales detectados

- `ANALISIS_BLE_V23_PHASE_REPAIR.md`
- `CHANGELOG.md`
- `DETAILED_EXPERIMENT_REPORT_GETAFE_30.md`
- `GUIA_COMFY_PRUEBA_GRAVITY.md`
- `GUIA_INSTALACION_COMFY.md`
- `HARDENING_BLE_V24.md`
- `INFORME_EXPERIMENTO_V6.md`
- `INFORME_FINAL_BLE.md`
- `INFORME_FINAL_BLE_V2.md`
- `INFORME_KNOWLEDGE_HUB.md`
- `INFORME_SISTEMA_GRAVITY.md`
- `INFORME_TECNICO_COMFY_LORA.md`
- `INTEGRATION_GUIDE.md`
- `INTEGRATION_NOTES.md`
- `PATCH_BLE_V22_DEFINITIVO.md`
- `PATCH_BLOCK_CONTRACTS_PAYLOAD_QUALITY.md`
- `PATCH_CONVERSION_UX_SUPER_PATCH.md`
- `PATCH_DOMAIN_GUARDS_AND_TYPES.md`
- `PATCH_ENRICHMENT_SCOPE_FIX.md`
- `PATCH_FINAL_DELIVERY_UNBLOCK.md`
- `PATCH_FLOW_BRAIN_UNIFICATION.md`
- `PATCH_FLOW_STABILIZATION.md`
- `PATCH_HTML_COHERENCE_FINAL.md`
- `PATCH_LIMPIEZA_CODIGO_BLE_V21.md`
- `PATCH_NICHE_INTELLIGENCE_LAYER.md`
- `PATCH_PHASE_OBSERVABILITY.md`
- `PATCH_SUPER_TYPECHECK_FLOW_CLEANUP.md`
- `PRODUCTION_CHECKLIST_BLE_V24.md`

## 3. Fusión por documento nuevo

### `01_INFORME_EJECUTIVO_GRAVITY.md`

Fusiona conceptualmente:

- `INFORME_SISTEMA_GRAVITY.md`
- `INFORME_FINAL_BLE.md`
- `INFORME_FINAL_BLE_V2.md`
- partes de `CHANGELOG.md`

### `02_ARQUITECTURA_PIPELINE_GRAVITY.md`

Fusiona conceptualmente:

- `INFORME_SISTEMA_GRAVITY.md`
- `INFORME_EXPERIMENTO_V6.md`
- `DETAILED_EXPERIMENT_REPORT_GETAFE_30.md`
- `PATCH_FLOW_BRAIN_UNIFICATION.md`
- `PATCH_FLOW_STABILIZATION.md`

### `03_AGENTES_Y_MODULOS.md`

Fusiona conceptualmente:

- `INFORME_KNOWLEDGE_HUB.md`
- `INTEGRATION_GUIDE.md`
- partes técnicas de `INFORME_SISTEMA_GRAVITY.md`

### `04_SEO_LOCAL_ESPANA_Y_CONTENIDO_HONESTO.md`

Fusiona conceptualmente:

- `PATCH_NICHE_INTELLIGENCE_LAYER.md`
- `PATCH_DOMAIN_GUARDS_AND_TYPES.md`
- `PATCH_ENRICHMENT_SCOPE_FIX.md`
- `PATCH_HTML_COHERENCE_FINAL.md`
- ajustes recientes de sanitización premium España.

### `05_DISENO_PROCEDURAL_Y_MASTERCLASSES.md`

Fusiona conceptualmente:

- `PATCH_CONVERSION_UX_SUPER_PATCH.md`
- partes de `INFORME_SISTEMA_GRAVITY.md`
- revisión reciente de la galería de masterclasses.

### `06_INTEGRACIONES_OPCIONALES.md`

Fusiona conceptualmente:

- `GUIA_COMFY_PRUEBA_GRAVITY.md`
- `GUIA_INSTALACION_COMFY.md`
- `INFORME_TECNICO_COMFY_LORA.md`
- `INTEGRATION_GUIDE.md`
- `INTEGRATION_NOTES.md`

### `07_OPERACION_INSTALACION_Y_CHECKLIST.md`

Fusiona conceptualmente:

- `PRODUCTION_CHECKLIST_BLE_V24.md`
- `HARDENING_BLE_V24.md`
- `PATCH_PHASE_OBSERVABILITY.md`
- `PATCH_FINAL_DELIVERY_UNBLOCK.md`
- partes de guías de integración.

### `08_HISTORIAL_TECNICO_CONSOLIDADO.md`

Fusiona conceptualmente todos los informes de parches:

- `PATCH_BLE_V22_DEFINITIVO.md`
- `PATCH_BLOCK_CONTRACTS_PAYLOAD_QUALITY.md`
- `PATCH_DOMAIN_GUARDS_AND_TYPES.md`
- `PATCH_ENRICHMENT_SCOPE_FIX.md`
- `PATCH_FLOW_BRAIN_UNIFICATION.md`
- `PATCH_FLOW_STABILIZATION.md`
- `PATCH_HTML_COHERENCE_FINAL.md`
- `PATCH_LIMPIEZA_CODIGO_BLE_V21.md`
- `PATCH_NICHE_INTELLIGENCE_LAYER.md`
- `PATCH_PHASE_OBSERVABILITY.md`
- `PATCH_SUPER_TYPECHECK_FLOW_CLEANUP.md`

## 4. Qué se omitió como documento independiente

Se omitieron como documentos separados los informes puramente de parche, porque el usuario indicó que no eran tan necesarios. Su contenido útil se conserva en el historial consolidado, arquitectura, operación y guías de calidad.

## 5. Resultado

El paquete final queda más corto, más útil y más fiel al proyecto actual. Explica el sistema completo sin repetir 28 documentos históricos ni exagerar capacidades no verificadas.
