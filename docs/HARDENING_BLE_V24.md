# BLE V2.4 Super Hardening

Este parche convierte el proyecto en una base más limpia y apta para producción sin eliminar tu capacidad experimental.

## Cambios principales

1. Dashboard protegido con token, rate limit, cabeceras de seguridad, control de origen y validación de payload.
2. Defaults de producción más seguros: `DEBUG_MODE=false` y `PIPELINE_SOFT_MODE=false`.
3. Scripts oficiales para auditoría, limpieza de duplicados y preparación de árbol productivo.
4. Contratos de fase para desacoplar gradualmente el pipeline grande sin romperlo.
5. Guardas HTML de producción reutilizables: viewport, placeholders, FAQ/schema, links `/index.html`, visuales placeholder.
6. Auditor de hardening que falla si detecta problemas críticos.
7. `.env.example` y `.gitignore` productivos.

## Filosofía

No se debe mezclar en el mismo paquete:

- código fuente productivo,
- experimentos,
- outputs generados,
- bases de datos,
- backups evolutivos,
- scratch/manual tests.

El proyecto puede seguir teniendo laboratorio, pero producción debe estar blindada y auditable.

## Comandos

```bash
npm run typecheck
npm run audit:security
npm run audit:hardening
npm run cleanup:duplicates
npm run prepare:production
```

Para aplicar limpieza real:

```bash
npm run cleanup:duplicates:apply
npm run prepare:production:apply
```

Ambos comandos mueven elementos a `.gravity_archive/`, no los destruyen.
