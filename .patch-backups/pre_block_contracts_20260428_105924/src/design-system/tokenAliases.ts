// Añade aliases que hoy ya usa el CSS generado, pero que no siempre se emiten.

export function renderTokenAliases(): string {
  return `
    --body-size: var(--body-md-size);
    --heading: var(--text);
    --surface-alt: color-mix(in srgb, var(--surface) 92%, var(--bg));
    --shadow-lg: var(--shadow-dramatic);
    --radius: var(--radius-section);
    --secondary: var(--accent);
  `;
}

// Uso recomendado dentro del generador de :root:
// :root {
//   ...tokens actuales...
//   ${renderTokenAliases()}
// }