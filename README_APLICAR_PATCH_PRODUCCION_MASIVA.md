# Gravity Patch Producción Masiva Premium

Copia el contenido de este ZIP encima de la raíz de tu proyecto Gravity.

## Aplicar

```bash
unzip gravity_production_massive_stable_patch.zip -d /ruta/a/tu/proyecto
cd /ruta/a/tu/proyecto
npm install
npm run typecheck
npm run audit:security
npm run audit:hardening
```

## Activación

La estabilidad visual de producción queda activada por defecto.

Para volver temporalmente a variantes experimentales:

```bash
GRAVITY_PRODUCTION_VISUAL_STABILITY=false npm start
```

Para producción masiva, déjalo sin definir o en `true`.
