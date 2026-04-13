# Plan de Refinamiento Diseño Corporativo (V7.1)

El objetivo es elevar la plantilla generada por `ContentArchitectAgent` de un diseño moderno genérico a un diseño **Premium, Autoridad Nacional y Corporativo Minimalista**.

Todo el trabajo se realizará **exclusivamente** editando las reglas CSS y atributos `style` dentro del método genérico `buildTemplate` en `architect.ts`, respetando el 100% de la lógica y arquitectura actual (cero alteraciones en el TypeScript subyacente o peticiones al LLM).

## Cambios Estilísticos a Aplicar

1. **Paleta de Colores Corporativa (Menos es Más)**:
   - Primary: `#0A192F` (Navy muy oscuro y serio, no azul eléctrico).
   - Accent: `#D4AF37` (Oro tenue y elegante, no amarillo chillón).
   - Backgrounds: Uso intensivo de espacio negativo (`#FFFFFF`) y descansos muy sutiles (`#F8FAFC`).
   - Textos: `#334155` (Slate oscuro para legibilidad perfecta sin ser negro puro).

2. **Hero de Alta Autoridad**:
   - Eliminar el gradiente llamativo continuo (`linear-gradient(135deg, ...)`) en favor de un fondo sólido `#0A192F`. 
   - Añadir un sutil patrón o pseudo-textura (vía CSS radial-gradient ultra transparente) solo para darle profundidad corporativa sin distraer, o bien mantenerlo flat para máxima elegancia.
   - Tipografía del H1 más "apretada" (letter-spacing: -1.5px) y peso 900.

3. **Refinamiento de las Cards (Minimalismo)**:
   - Reducir el `border-radius` de 16px a 8px (los bordes muy redondeados parecen "apps", los bordes ligeramente cuadrados denotan seriedad e institucionalidad).
   - Sombras ultraligeras: cambiar el `box-shadow: 0 15px 35px rgba(0,0,0,0.06)` a algo más pulcro: `box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #E2E8F0;`.
   - Efecto Hover sutil: Cambiar el pronunciado `translateY(-8px)` a un sofisticado `translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.06);`.

4. **Botones y CTAs (Foco Cognitivo)**:
   - Eliminar la "escala" agresiva en el hover del CTA (`transform: scale(1.05)`). En lugar de eso, usar una traslación sutil de color o un ligero resplandor (`box-shadow` dorado).
   - Uniformidad: Todos los bordes de botones pasarán de 10px a 6px, alineados con el corporativismo.

5. **Ajuste Tipográfico y de Whitespace**:
   - Mantener `Inter` pero asegurar que el line-height y márgenes de los párrafos sean consistentes.
   - Reducir el padding mastodóntico de `100px` en móvil a `60px`, manteniendo gran respiro en Desktop (`90px`).

## Ejecución Técnica

Se modificará un único archivo:
- `[MODIFY]` `src/agents/architect.ts`: Reescribir el string devuelto en `buildTemplate` y los estilos en línea de los FAQs generados.

## Aprobación
¿Comenzamos a sobreescribir el CSS del `buildTemplate` con estas pautas específicas para lograr el aura corporativa?
