# Renderers por familia, no por plantilla

No crees 216 `if (recipe.id === ...)`.

La regla es:

- `recipe.id` identifica la plantilla exacta.
- `recipe.rendererKey` decide el renderer HTML.
- `recipe.shell`, `density`, `tone` y `slots` alteran composición, longitud y orden.
- `recipe.className` activa CSS visual específico.

Así puedes tener 216+ plantillas con solo 10-15 renderers reales.
