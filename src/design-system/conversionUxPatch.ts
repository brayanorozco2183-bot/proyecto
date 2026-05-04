export function escapeHtml(value: unknown = ''): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizePhoneValue(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/(?:consultar|pendiente|no\s+disponible|n\/d|sin\s+telefono)/i.test(raw)) return '';
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return '';
  if (/^(\d)\1+$/.test(digits)) return '';
  return hasPlus ? `+${digits}` : digits;
}

export function buildPhoneHref(value: unknown, fallback = '#contacto'): string {
  const normalized = normalizePhoneValue(value);
  return normalized ? `tel:${normalized}` : fallback;
}

export function buildPhoneLabel(value: unknown, fallback = 'Contactar'): string {
  return normalizePhoneValue(value) || fallback;
}

export function formatCtaLabel(value: unknown, mode: 'short' | 'long' = 'long'): string {
  const phone = buildPhoneLabel(value);
  if (phone === 'Contactar') return mode === 'short' ? 'Contactar' : 'Solicitar contacto';
  return mode === 'short' ? 'Llamar ahora' : `Llamar ahora: ${phone}`;
}

export type ServiceIntent = {
  category: string;
  action: string;
  emergency: string;
  proof: string;
  before: string;
  icon: string;
};

export function deriveServiceIntent(niche?: string): ServiceIntent {
  const n = String(niche || '').toLowerCase();
  if (/cerraj|cerradur|llave|puerta/.test(n)) return { category: 'Cerrajería', action: 'Apertura, cambio o reparación con diagnóstico previo', emergency: 'Urgencias y aperturas prioritarias', proof: 'Intervención explicada antes de actuar', before: 'Precio orientativo antes del desplazamiento', icon: '🔐' };
  if (/fontaner|fuga|tuber|desatasc/.test(n)) return { category: 'Fontanería', action: 'Localización de avería y solución ordenada', emergency: 'Fugas y atascos prioritarios', proof: 'Causa explicada antes de reparar', before: 'Alcance y materiales claros', icon: '💧' };
  if (/electric|luz|cuadro|enchufe/.test(n)) return { category: 'Electricidad', action: 'Revisión segura y reparación documentada', emergency: 'Averías eléctricas prioritarias', proof: 'Pruebas básicas antes de cerrar el trabajo', before: 'Riesgo y alcance explicados', icon: '⚡' };
  if (/reforma|obra|pintur|albañil|cocina|baño/.test(n)) return { category: 'Reformas', action: 'Planificación, alcance y presupuesto por fases', emergency: 'Visita técnica y propuesta clara', proof: 'Partidas separadas para comparar', before: 'Medición y calendario antes de empezar', icon: '🏗️' };
  if (/carpinter|madera|armario|puerta/.test(n)) return { category: 'Carpintería', action: 'Medición, ajuste o instalación con acabado cuidado', emergency: 'Ajustes e instalaciones priorizadas', proof: 'Materiales y acabado explicados', before: 'Medidas revisadas antes de fabricar', icon: '🪚' };
  return { category: 'Servicio local', action: 'Diagnóstico claro y solución adaptada al caso', emergency: 'Respuesta prioritaria cuando el caso lo requiere', proof: 'Criterio profesional explicado sin rodeos', before: 'Presupuesto y alcance antes de actuar', icon: '✓' };
}

export function buildDefaultHeroTrustBullets(niche?: string, city?: string): string[] {
  const intent = deriveServiceIntent(niche);
  const local = city ? `Cobertura real en ${city}` : 'Cobertura local real';
  return [intent.before, intent.proof, local];
}

export function renderEarlyTrustStrip(input: { niche?: string; city?: string; phone?: string; businessName?: string }): string {
  const intent = deriveServiceIntent(input.niche);
  const city = escapeHtml(input.city || 'tu zona');
  const phoneLabel = buildPhoneLabel(input.phone);
  const phonePiece = phoneLabel === 'Contactar' ? 'Contacto visible' : `Teléfono directo: ${phoneLabel}`;
  const items = [
    { value: intent.icon, label: intent.category, text: intent.action },
    { value: '24h', label: 'Prioridad', text: intent.emergency },
    { value: '€', label: 'Claridad', text: intent.before },
    { value: '📍', label: city, text: phonePiece }
  ];
  return `
  <section class="conversion-proof-strip" aria-label="Señales de confianza del servicio">
    <div class="el-container">
      <div class="conversion-proof-strip__grid">
        ${items.map((item) => `
          <article class="conversion-proof-item">
            <span class="conversion-proof-item__value">${item.value}</span>
            <span class="conversion-proof-item__label">${escapeHtml(item.label)}</span>
            <span class="conversion-proof-item__text">${escapeHtml(item.text)}</span>
          </article>
        `).join('')}
      </div>
    </div>
  </section>`;
}

export function renderMobileStickyCta(input: { phone?: string; niche?: string; city?: string }): string {
  const phoneHref = buildPhoneHref(input.phone);
  const cta = formatCtaLabel(input.phone, 'short');
  const intent = deriveServiceIntent(input.niche);
  const detail = input.city ? `${intent.category} en ${input.city}` : intent.category;
  return `
  <div class="mobile-sticky-cta" role="complementary" aria-label="Contacto rápido">
    <div class="mobile-sticky-cta__copy"><strong>${escapeHtml(cta)}</strong><span>${escapeHtml(detail)}</span></div>
    <a href="${phoneHref}" class="mobile-sticky-cta__button">📞</a>
  </div>`;
}
