# Contenido del ZIP: Gravity Clean Source Pack

Este paquete contiene una versiÃ³n optimizada y limpia del cÃ³digo fuente del proyecto Gravity, preparada para revisiÃ³n, anÃ¡lisis o despliegue.

## 1. Carpetas Incluidas
- src/: CÃ³digo fuente principal (TypeScript, TSX, JSON, Markdown).
- scripts/: Herramientas y utilidades de automatizaciÃ³n.
- prompts/: Definiciones de agentes y prompts del sistema.
- workflows/ y comfy-workflows/: Flujos de trabajo y pipelines.
- docs/: DocumentaciÃ³n tÃ©cnica en formato Markdown.

## 2. Tipos de Archivo Incluidos
- **CÃ³digo Fuente:** .ts, .tsx, .js, .mjs, .cjs
- **ConfiguraciÃ³n:** package.json, package-lock.json, 	sconfig.json, .gitignore
- **Variables de Entorno:** .env.example (Los archivos .env reales han sido omitidos por seguridad).
- **DocumentaciÃ³n:** .md, README.md, implementation_plan.md

## 3. Patrones Excluidos
- **Dependencias:** 
ode_modules/
- **Bases de Datos:** *.db, *.sqlite, *.sqlite3, maestro.db*
- **Builds y Salidas:** dist/, uild/, .next/, out/, output_sites/
- **Resultados:** experiments/results/, 	est_results/, debug_runs/, playwright-report/
- **Basura y Temporales:** *.bak, *.old, *.orig, *.map, *.log, *.txt, *.csv
- **Multimedia:** *.png, *.jpg, *.jpeg, *.webp (excepto assets fuente documentados).
- **Scripts JS en src:** Se han omitido los archivos .js en src/ que tengan un equivalente .ts.

## 4. Instrucciones para Instalar y Validar
Para poner en marcha el proyecto desde este pack, sigue estos pasos:

1. **Instalar dependencias:**
   `ash
   npm install
   `
2. **Validar tipos de TypeScript:**
   `ash
   npm run typecheck
   `
3. **Ejecutar tests unitarios:**
   `ash
   npm test
   `

---
*Generado automÃ¡ticamente para el proyecto Gravity.*
