# SEO local España y contenido honesto

## 1. Objetivo

Este documento define cómo debe generar Gravity páginas locales para España sin inventar datos y manteniendo una calidad percibida alta.

Una página premium no necesita exagerar. Necesita ser clara, útil, local, bien estructurada y honesta.

## 2. Datos que no deben inventarse

Gravity no debe fabricar:

- Teléfonos.
- Direcciones exactas.
- Oficinas físicas.
- Reseñas.
- Puntuaciones.
- Años de experiencia.
- Certificaciones.
- Garantías.
- Precios cerrados.
- Disponibilidad 24h.
- “Equipo local” si no está demostrado.
- “Empresa líder” si no hay fuente.

Cuando falte un dato, el sistema debe usar una versión segura.

## 3. Degradación segura de CTAs

### Con teléfono válido

Puede usarse:

```html
<a href="tel:+34XXXXXXXXX">Llamar ahora</a>
```

### Sin teléfono válido

Usar:

```html
<a href="#contacto">Solicitar orientación</a>
```

O textos como:

- Pedir diagnóstico previo.
- Solicitar información.
- Contactar.
- Consultar disponibilidad.

No debe aparecer texto interno como “Teléfono pendiente de validación”.

## 4. Schema local prudente

### Recomendado

```json
{
  "@type": "Service",
  "serviceType": "Carpinteros",
  "areaServed": {
    "@type": "City",
    "name": "Bilbao"
  }
}
```

### Evitar sin datos reales

```json
{
  "aggregateRating": {
    "ratingValue": "4.9",
    "reviewCount": "127"
  }
}
```

No deben incluirse ratings ni reviews si no proceden de una fuente real.

## 5. Idioma y localización España

Las páginas para España deben usar:

- `lang="es-ES"`.
- `og:locale` apropiado.
- Español natural de España.
- Preguntas con `¿` y `?`.
- Términos locales sin sobrecargar el texto.
- Referencias geográficas prudentes.

## 6. Contenido local de calidad

Una buena página local debe explicar:

- Qué servicio se ofrece.
- En qué ciudad o zona se presta.
- Qué problemas resuelve.
- Cómo se solicita información.
- Qué señales de confianza existen.
- Qué dudas frecuentes tiene el usuario.
- Qué páginas relacionadas puede visitar.

No necesita prometer que es la mejor ni la más barata.

## 7. Coherencia de nicho

### Electricistas

Términos adecuados:

- Cuadro eléctrico.
- Diferenciales.
- Sobrecargas.
- Boletín eléctrico.
- Instalación.
- Averías.

Evitar mezclar con:

- Tuberías.
- Bombines.
- Madera.

### Carpinteros

Términos adecuados:

- Puertas.
- Armarios.
- Herrajes.
- Madera.
- Montaje.
- Ajustes.
- Reparaciones.

Evitar mezclar con:

- Fugas.
- Enchufes.
- Cerraduras antibumping, salvo que sea carpintería de puertas en contexto correcto.

### Fontaneros

Términos adecuados:

- Fugas.
- Grifería.
- Bajantes.
- Atascos.
- Tuberías.
- Reparaciones de agua.

### Cerrajeros

Términos adecuados:

- Cerraduras.
- Bombines.
- Aperturas.
- Llaves.
- Seguridad.
- Antibumping.

## 8. FAQ limpio

Las preguntas frecuentes deben salir solo de preguntas reales.

No debe entrar en FAQ:

- Menú.
- Navegación móvil.
- Enlaces del header.
- Textos de botones.
- Migas de pan.

Ejemplo correcto:

```json
{
  "@type": "Question",
  "name": "¿Qué incluye una reparación de carpintería en Bilbao?"
}
```

## 9. Enlazado interno limpio

El interlinking debe ayudar al usuario y a la estructura del sitio.

Buenas prácticas:

- Enlaces relacionados por ciudad, barrio o servicio.
- Texto de enlace claro.
- Un solo bloque principal de enlaces relacionados.
- Ubicación antes del footer.
- No duplicar hubs.

## 10. Tono recomendado

El tono ideal para Gravity en España:

- Claro.
- Profesional.
- Sin relleno.
- Sin claims absolutos.
- Con utilidad concreta.
- Comercial, pero no agresivo.
- Local, pero sin inventar presencia física.

## 11. Fórmula recomendada de página premium

1. Hero claro: servicio + ciudad + propuesta.
2. Señales de confianza prudentes.
3. Servicios concretos.
4. Explicación del proceso.
5. Bloque local sin inventar dirección.
6. FAQ real.
7. Enlaces internos.
8. CTA final seguro.
9. Footer.
10. Schema prudente.

## 12. Resumen

El SEO local honesto es una ventaja competitiva. Gravity debe generar páginas que parezcan profesionales porque están bien estructuradas y son útiles, no porque exageran datos que no existen.
