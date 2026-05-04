# Operación, instalación y checklist de Gravity

## 1. Requisitos base

- Node.js 20.x o superior.
- npm o pnpm.
- Permisos de escritura en el proyecto.
- Terminal con acceso a scripts.
- `.env` configurado según el perfil de uso.

## 2. Instalación

```bash
npm install
```

## 3. Comprobación técnica

```bash
npm run typecheck
```

Si el proyecto no tiene dependencias instaladas, el typecheck fallará hasta ejecutar `npm install`.

## 4. Scripts útiles

Según el `package.json`, el proyecto incluye scripts como:

```bash
npm run start
npm run dashboard
npm run typecheck
npm run audit:cleanup
npm run audit:security
npm run audit:hardening
npm run test:hardening
```

La disponibilidad real depende de que las dependencias y archivos asociados estén presentes.

## 5. Variables de entorno recomendadas

```env
PIPELINE_MODE=debug
OLLAMA_HOST=http://localhost:11434
DEFAULT_MODEL=qwen2.5:7b
GOOGLE_MAPS_API_KEY=
COMFYUI_ENDPOINT=
WORDPRESS_API_URL=
WORDPRESS_USERNAME=
WORDPRESS_APP_PASSWORD=
```

No todas son obligatorias. Deben activarse según el módulo usado.

## 6. Ejecución de una misión

Una misión típica requiere:

- Nicho.
- Ciudad.
- Datos de marca si existen.
- Teléfono si existe.
- Modo de salida.

Ejemplo conceptual:

```text
nicho: carpinteros
ciudad: Bilbao
salida: HTML estático
```

## 7. Checklist antes de generar

- [ ] Nicho definido.
- [ ] Ciudad definida.
- [ ] Teléfono validado o ausente de forma intencionada.
- [ ] Nombre comercial definido o fallback seguro.
- [ ] No se exige dirección si no existe.
- [ ] Playbook del nicho disponible.
- [ ] Modelo LLM disponible si se usa generación con IA.
- [ ] Carpeta de salida con permisos.

## 8. Checklist del HTML generado

- [ ] Tiene un solo H1.
- [ ] Tiene meta title.
- [ ] Tiene meta description.
- [ ] Tiene canonical.
- [ ] Tiene `lang="es-ES"` si es página para España.
- [ ] No contiene `undefined`.
- [ ] No contiene `null` visible.
- [ ] No contiene `file:///`.
- [ ] No contiene placeholders como `{{ciudad}}`.
- [ ] No contiene textos internos de sistema.
- [ ] No tiene bloques después del footer.
- [ ] No tiene FAQ contaminado con navegación.
- [ ] No tiene schema con reseñas inventadas.
- [ ] CTA coherente con datos reales.

## 9. Checklist SEO local

- [ ] Ciudad presente de forma natural.
- [ ] Nicho presente sin keyword stuffing.
- [ ] Servicios concretos del sector.
- [ ] FAQ útil y real.
- [ ] Enlaces internos relacionados.
- [ ] Schema prudente.
- [ ] No se inventan oficinas ni reseñas.

## 10. Checklist visual

- [ ] Diseño responsive.
- [ ] CTAs visibles.
- [ ] No hay contenedores vacíos.
- [ ] Espaciado coherente.
- [ ] Contraste legible.
- [ ] Secciones diferenciadas.
- [ ] Footer al final.

## 11. Diagnóstico de logs

Los logs de ejecución son clave para depurar.

Buscar:

- Fase en la que cae.
- Último agente ejecutado.
- Warnings no bloqueantes.
- Errores de propiedades undefined.
- Timeouts o llamadas lentas.
- Problemas de modelo o endpoint.

Ejemplo de interpretación:

- `Invalid phone`: no necesariamente rompe la misión, pero debe afectar al CTA.
- `Cannot read properties of undefined`: indica falta de validación defensiva sobre una estructura.
- `SLOW_CALL`: llamada LLM lenta; revisar modelo, prompt o hardware.

## 12. Recomendaciones de mantenimiento

- Ejecutar typecheck después de parches.
- Mantener logs por misión.
- Crear fixtures por nicho y ciudad.
- Añadir tests de regresión HTML.
- Versionar cambios importantes.
- Separar documentación de capacidades activas y opcionales.

## 13. Checklist para producción estática

- [ ] HTML validado.
- [ ] Enlaces relativos correctos.
- [ ] Assets copiados.
- [ ] Sitemap si aplica.
- [ ] Robots si aplica.
- [ ] Canonicals definitivos.
- [ ] No hay rutas locales.
- [ ] Revisión visual desktop/mobile.
- [ ] Revisión de contenido por humano.

## 14. Resumen

La operación de Gravity debe basarse en disciplina: buena entrada, generación controlada, validación HTML, revisión local, sanitización y entrega. Con ese flujo, el proyecto puede escalar sin perder calidad ni honestidad.
