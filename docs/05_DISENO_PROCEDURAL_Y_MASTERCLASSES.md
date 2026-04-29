# Diseño procedural y Masterclasses visuales

## 1. Objetivo del sistema visual

El diseño procedural de Gravity permite generar páginas con variación visual sin depender de una sola plantilla. Esta es una de las fortalezas reales del proyecto: separar contenido, estructura y estilo para crear páginas más diferenciadas dentro de un mismo cluster.

## 2. Elementos del sistema visual

Gravity trabaja con varios niveles de diseño:

- Tokens de color, espaciado, sombra, radio y tipografía.
- Temas visuales.
- Familias de layout.
- Componentes de bloque.
- Presets de diseño.
- ADN visual por página.
- Galería de masterclasses.

## 3. ADN visual

El ADN visual describe cómo debe sentirse una página.

Ejemplo:

```json
{
  "personality": "technical",
  "contrastModel": "balanced",
  "cardTreatment": "elevated",
  "heroLayout": "split",
  "spacing": "balanced"
}
```

No es una promesa de conversión. Es una configuración de estilo.

## 4. Familias visuales

El proyecto contiene familias como:

- Technical grid.
- Local trust.
- Editorial.
- Conversion heavy.
- Minimal authority.
- Asymmetric premium.

Cada familia puede orientar la estructura visual, la densidad, el ritmo y la jerarquía.

## 5. Temas y tokens

Los temas permiten aplicar combinaciones coherentes de color, contraste y estilo. Los tokens ayudan a que el diseño sea consistente:

- Colores.
- Breakpoints.
- Spacing.
- Radius.
- Sombras.
- Tipografía.
- Motion.

Esto facilita que el proyecto evolucione sin cambiar manualmente cada componente.

## 6. Componentes visuales

Los componentes convierten el contenido en secciones renderizables:

- Hero.
- Servicios.
- Trust blocks.
- FAQ.
- CTA.
- Grids.
- Panels.
- Internal links.
- Footer.

Un buen componente debe tolerar datos incompletos y no generar contenedores vacíos.

## 7. Masterclass gallery

La galería de masterclasses debe presentarse como un catálogo interno de variantes visuales.

Puede decirse que:

- Muestra variantes de diseño.
- Ayuda a explorar combinaciones de personalidad, familia y tratamiento visual.
- Sirve como referencia para elegir estilos por nicho.
- Contiene 100 tarjetas si el HTML contiene esas 100 variantes.

No debe decirse sin pruebas que:

- Son capturas reales de producción.
- Muestran resultados reales sin retoques.
- Mejoran CTR.
- Han sido validadas por mapas de calor.
- Garantizan rendimiento SEO.
- Verifican “alucinaciones visuales”.

## 8. Diseño premium sin inventar resultados

Una página puede ser premium por:

- Jerarquía clara.
- Buen contraste.
- Espaciado coherente.
- Componentes cuidados.
- CTA visible pero honesto.
- Bloques de confianza prudentes.
- Secciones locales útiles.
- Ausencia de ruido visual.

No necesita afirmar métricas inexistentes.

## 9. Reglas para páginas locales

Para nichos locales en España:

- Priorizar legibilidad móvil.
- Mantener CTA seguro.
- Evitar saturación de badges.
- Usar señales de confianza reales o neutras.
- No usar imágenes locales falsas si no están generadas o verificadas.
- Evitar que todos los barrios tengan exactamente el mismo aspecto.

## 10. Hardening visual recomendado

Cada bloque visual debería pasar estas comprobaciones:

- No tiene contenedores vacíos.
- No depende de datos obligatorios ausentes.
- No rompe responsive.
- No duplica CTA sin sentido.
- No deja placeholders visibles.
- No fuerza teléfono si no existe.
- No inserta enlaces tras el footer.

## 11. Resumen

El diseño procedural de Gravity es una ventaja real porque permite escalar páginas locales con variedad visual. La forma correcta de documentarlo es como un sistema de estilos y componentes configurables, no como una prueba de rendimiento comercial garantizado.
