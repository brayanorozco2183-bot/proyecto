# Gravity Flow Stabilization Patch

Este parche estabiliza el flujo actual de generación antes de añadir pruebas de regresión.

## Cambios incluidos

1. **Cache de PlaybookLoader**
   - `resolveNicheId()` ahora memoiza resoluciones por nicho normalizado.
   - El log de `PlaybookLoader` solo se emite en cache miss o si `GRAVITY_PLAYBOOK_LOG_EVERY_RESOLVE=true`.
   - `resolvePlaybookForMission()` memoiza el contexto de playbook construido para evitar recalcular briefs.

2. **Mission Runtime Context**
   - Nuevo archivo `src/runtime/missionContext.ts`.
   - Adjunta `missionRuntimeContext` y `nichePlaybook` a `mission.contextual_data`.
   - Permite pasar contexto resuelto por misión sin reconsultar constantemente el loader.

3. **Logs de fases START/END/FAILED**
   - `ContentPipelinePhaseRunner` ahora registra inicio, fin, duración y error de cada fase.
   - Si una fase falla, se guarda artefacto de depuración con mensaje y stack.

4. **Phase 8 endurecida**
   - `AssemblyPhase` ahora registra:
     - inicio de composición,
     - número de secciones preparadas,
     - tamaño del HTML bruto,
     - tamaño del HTML final,
     - duración.
   - Si falla la composición procedural, genera un HTML mínimo de emergencia con metadatos `assembly_mode: "emergency_fallback"`.

5. **Fallback por bloque en procedural engine**
   - Si un bloque del registry falla, se mantiene el HTML legacy del bloque.
   - Si tampoco hay HTML legacy, se inserta una sección mínima visible.
   - Bloques que tarden más de 2 segundos en render local emiten warning.

6. **Resultado final explícito**
   - Si se genera HTML, el runner imprime:
     - `MISSION_SUCCESS`
     - `html_path=...`
   - Si termina sin HTML, imprime `MISSION_COMPLETED_WITHOUT_HTML`.

## Importante sobre LLMs lentos

Este parche **no reduce los timeouts de LLM** ni fuerza fast mode. Si tu ordenador tarda mucho generando con Ollama, eso sigue permitido. La mejora es que el sistema no debe quedarse opaco: debe avanzar con logs claros o fallar con diagnóstico.

## Variables útiles

```bash
# Solo si quieres volver a ver cada resolución del playbook en logs:
GRAVITY_PLAYBOOK_LOG_EVERY_RESOLVE=true
```

## Qué probar

Ejecuta tu mismo comando habitual de generación y revisa que el log contenga:

```txt
[Phase 8] START Final procedural composition...
[Phase 8] END Final procedural composition ...
[PhaseRunner] MISSION_SUCCESS html_path=...
```

Si falla, debe aparecer:

```txt
[Phase X] MISSION_FAILED ...
```

con fase, duración, mensaje y stack.
