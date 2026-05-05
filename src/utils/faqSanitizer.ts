export function normalizeFaqQuestionText(value: unknown): string {
  let text = String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

  // Corrige artefactos del LLM: "¿3¿Cómo...?", "¿4 ¿Qué...?", "3. ¿Cómo...?", "4) ¿Qué...?", "2¿Cómo...?"
  text = text
    .replace(/^¿\s*\d{1,2}\s*¿\s*/u, '¿')
    .replace(/^\s*\d{1,2}\s*[.)\-:]?\s*(?=¿|[A-Z]|Qué|Cómo|Cuándo|Dónde)/iu, '')
    .replace(/^\s*\d{1,2}\s*[.)\-:]\s*/u, '');

  text = text
    .replace(/^¿\s*¿+/u, '¿')
    .replace(/\s+([?¿!¡,.;:])/g, '$1')
    .replace(/¿\s+/g, '¿')
    .trim();

  if (text && !text.startsWith('¿') && /^(qué|que|cómo|como|cuándo|cuando|dónde|donde|por qué|por que|cuál|cual)\b/i.test(text)) {
    text = '¿' + text;
  }
  return text;
}

export function hasFaqNumberingArtifact(value: unknown): boolean {
  const text = String(value ?? '').normalize('NFC').trim();
  return /^¿\s*\d{1,2}\s*(?:¿|[.)\-:]?\s)/u.test(text) || /^\s*\d{1,2}\s*[.)\-:]\s*¿/u.test(text);
}

export function normalizeFaqAnswerText(value: unknown): string {
  return String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function normalizeFaqEntity<T extends Record<string, any>>(entity: T): T {
  if (!entity || typeof entity !== 'object') return entity;
  if ('name' in entity) (entity as any).name = normalizeFaqQuestionText((entity as any).name);
  if (entity.acceptedAnswer && typeof entity.acceptedAnswer === 'object' && 'text' in entity.acceptedAnswer) {
    entity.acceptedAnswer.text = normalizeFaqAnswerText(entity.acceptedAnswer.text);
  }
  return entity;
}

// Aliases for compatibility with implementation patch imports
export const sanitizeFaqQuestion = normalizeFaqQuestionText;
export const sanitizeFaqAnswer = normalizeFaqAnswerText;
export const sanitizeJsonLdFaqScripts = () => {}; // Temporary placeholder if needed by other imports
export const sanitizeVisibleFaqDom = () => {}; // Temporary placeholder if needed by other imports
