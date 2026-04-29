# Super Patch: typecheck cleanup + procedural renderer stabilization

Este parche corrige los puntos que quedaron sueltos tras el Flow Stabilization Patch.

## Cambios incluidos

1. **Tipo `ResolvedPageRenderPlan` corregido**
   - Se añadieron las propiedades opcionales `visualSystem` y `system` dentro de `visualSystem`.
   - Esto elimina el error donde `procedural-engine.ts` accedía a campos usados por render plans antiguos/nuevos pero no declarados en `src/types/design.ts`.

2. **Extracción del CSS gigante de `procedural-engine.ts`**
   - El bloque global de estilos se movió a `src/design-system/procedural-global.css`.
   - `procedural-engine.ts` queda más ligero y más fácil de revisar.
   - Se añadió `src/design-system/proceduralStyles.ts` para cargar el CSS con caché.

3. **Fallback seguro de CSS**
   - Si `procedural-global.css` no está disponible en alguna ejecución empaquetada, el sistema usa un CSS mínimo funcional en vez de romper la generación.

4. **Verificador del parche**
   - Nuevo script: `scripts/verify_super_typecheck_flow_cleanup.mjs`.
   - Comprueba que el CSS fue extraído, que el renderer lo carga, que el tipo acepta los aliases y que no se dejaron accesos `visualSystem/system` sin contrato.

## Cómo probar

```bash
npm install
node scripts/verify_super_typecheck_flow_cleanup.mjs
npm run typecheck
npm run start
```

En una generación real, el flujo debería seguir mostrando:

```txt
[Phase 8] START Final procedural composition...
[PhaseRunner] MISSION_SUCCESS html_path=...
```

Si `npm run typecheck` muestra nuevos errores, deberían ser errores reales localizados, no los avisos anteriores de `visualSystem/system` ni problemas provocados por el CSS embebido en el renderer.
