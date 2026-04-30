# Guía Maestro V7.2: Ingeniería de Exemplars 100/100

Esta guía detalla cómo configurar cada campo de la tabla `learning_exemplars` para forzar al sistema a generar contenido de élite.

## 1. Catálogo de `block_type` (Categorías de Bloque)

El sistema usa el `block_type` para decidir qué ejemplo cargar. Debes usar estos nombres exactos:

| `block_type` | Objetivo del 100/100 | Elementos Clave en el `excerpt` |
| :--- | :--- | :--- |
| `hero` | Impacto inmediato y conversión. | H1 potente, párrafo de autoridad, lista de beneficios (bullet points) y un CTA claro. |
| `content` | Autoridad semántica. | Párrafos de 4-5 líneas, uso de negritas en términos clave, tono experto y sin relleno. |
| `features` | Desglose de servicios. | Estructura de grid o lista. Cada servicio debe tener una descripción técnica mínima. |
| `process` | Confianza técnica. | Pasos enumerados (1, 2, 3). Debe explicar el "cómo" se hace el trabajo. |
| `faq` | Resolver dudas y capturar tráfico. | Estructura `<h3>` para la pregunta y `<p>` para la respuesta técnica. |
| `pricing` | Transparencia y filtros. | Mencionar factores que influyen en el precio (materiales, urgencia, horario). |
| `proof` | Validación social. | Referencias a casos reales, tiempos de respuesta y resultados verificados. |
| `trust` | Seguridad y legalidad. | Mención de certificaciones (ISO, normativas), garantías y seguros de responsabilidad. |
| `cta` | Cierre de venta. | Frase de urgencia u oportunidad, botón de acción y micro-copy de confianza. |
| `local` | Relevancia geográfica. | Nombres de barrios, calles emblemáticas o puntos de interés (POIs) del área. |
| `guide` | Educación del cliente. | Explicación profunda sobre un problema común y su solución profesional. |

---

## 2. Optimización de Campos (Field Engineering)

### `agent_name` (Obligatorio: `ContentWriterAgent`)
Define qué agente consumirá este aprendizaje. El 99% de los exemplars de contenido van dirigidos a este agente.

### `niche` y `city` (Nivel de Filtrado)
*   **Global**: Si dejas `niche` y `city` como `NULL`, el aprendizaje se aplicará a **todos** los sectores y ciudades (útil para reglas de formato).
*   **Sectorial**: Si pones `cerrajeros` pero `city` en `NULL`, se aplicará a todos los cerrajeros de España.
*   **Quirúrgico**: Si pones `cerrajeros` y `madrid`, solo se activará en esa combinación. Es el más potente (100/100).

### `title` (Etiqueta descriptiva)
No afecta a la IA, pero te ayuda a ti a organizar.
*   **Mal**: "Ejemplo 1".
*   **Bien**: "Hero Premium Cerrajeros Madrid - Enfoque Seguridad Acorazada".

### `excerpt` (El "Cuerpo Maestro")
Es el HTML o texto que la IA usará como referencia. 
*   **Regla de Oro**: Debe estar **limpio de variables** (o usar `{{CIUDAD}}` y `{{NICHE}}` si quieres que sea reutilizable).
*   **Formato**: Usa HTML semántico (`<h3>`, `<p>`, `<ul>`, `<li>`). Evita `<div>` innecesarios.

### `score` (Peso: `100`)
Cualquier valor por debajo de 90 se considera "ruido" si hay otros mejores. El `100` garantiza que la IA lo trate como una **ley absoluta**.

### `metadata_json` (Atributos de Calidad)
Formato: `{"strengths": ["...", "..."], "metrics": {"words": 150}}`.
Define por qué es bueno para que el sistema de "Expert Remix" sepa qué partes enfatizar.

---

## 3. Ejemplo de Exemplar "Total" (SQL)

```sql
INSERT INTO learning_exemplars (
    agent_name, niche, city, block_type, polarity, title, score, fingerprint, excerpt, metadata_json
) VALUES (
    'ContentWriterAgent',
    'electricistas',
    'barcelona',
    'faq',
    'positive',
    'FAQ Maestra Electricidad Barcelona - Boletín Azul',
    100,
    'elec_bcn_faq_001',
    '<h3>¿Qué diferencia hay entre el Boletín Azul y el Blanco en Barcelona?</h3><p>En el área metropolitana de Barcelona, el Boletín Azul (BRIE) es el documento simplificado para cambios de titularidad o aumentos de potencia menores, mientras que el Blanco (CIE) es el certificado de instalación completa necesario para nuevas altas o reformas integrales, conforme a la normativa de la Generalitat.</p>',
    '{"strengths":["Precisión normativa regional","Diferenciación de producto","Localismo (Generalitat)"]}'
);
```

## 4. ¿Cómo conseguir el 100/100?

1.  **Diferenciación**: El contenido no debe parecer sacado de Wikipedia. Debe parecer escrito por un oficial con 20 años de experiencia.
2.  **Estructura de Silos**: Si el bloque es de `faq`, la pregunta debe atacar un *pain point* real del cliente.
3.  **No Placeholders**: Si escribes un exemplar de 100/100, no dejes huecos. Escribe el texto definitivo. La IA se encargará de adaptarlo, pero necesita ver la calidad final.
