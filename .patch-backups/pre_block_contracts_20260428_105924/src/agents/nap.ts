import { BaseAgent, AgentResponse } from './base.js';
import { vault } from '../tools/vault.js';
import { getCanonicalNicheLabel } from '../niches/agentAdapters.js';
import { sanitizeBrandName, buildCanonicalBrandName } from '../utils/brandGuard.js';

function normalizeText(value?: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export class NAPGuardianAgent extends BaseAgent {
  constructor() {
    super('NAP_Guardian_01', 'NAP Guardian', 'Protector de Datos', 'Guardián de la consistencia de Nombre, Dirección y Teléfono (NAP) para maximizar el posicionamiento en el Local Pack.', vault.OLLAMA_MODEL_COPY);
  }

  private normalizePhone(phone?: string): string {
    const raw = String(phone || '').trim();
    if (!raw) return '';
    if (/(?:consultar|pendiente|no\s+disponible|n\/d|sin\s+telefono)/i.test(raw)) return '';

    const hasPlus = raw.startsWith('+');
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) return '';
    if (/^(\d)\1+$/.test(digits)) return '';
    if (!hasPlus && digits.length === 11 && digits.startsWith('34')) return `+${digits}`;
    return hasPlus ? `+${digits}` : digits;
  }

  private hasValidPhone(phone?: string): boolean {
    return !!this.normalizePhone(phone);
  }

  private hasUsefulText(value?: string, min = 3): boolean {
    return !!value && normalizeText(value).length >= min && normalizeText(value).toLowerCase() !== 'no disponible';
  }

  private normalizeAddress(address?: string, city?: string): string {
    const value = normalizeText(address);
    if (!value) return normalizeText(city);
    return value;
  }

  private inferAddressGranularity(address: string, city: string): 'exact' | 'city_only' | 'missing' {
    const cleanAddress = normalizeText(address).toLowerCase();
    const cleanCity = normalizeText(city).toLowerCase();
    if (!cleanAddress) return 'missing';
    if (!cleanCity) return 'exact';
    return cleanAddress === cleanCity ? 'city_only' : 'exact';
  }

  private sanitizeBusinessNameInput(value: string, niche: string, city: string): string {
    const canonical = getCanonicalNicheLabel(niche).replace(/^de\s+/i, '').trim() || 'Servicio Local';
    const safeCity = normalizeText(city);

    let out = normalizeText(value)
      .replace(/^(?:de|del)\s+/i, '')
      .replace(/\bde\s+(cerrajeros|fontaneros|electricistas|carpinteros|pintores)\b/gi, '$1')
      .replace(new RegExp(`\\bEn\\s+${safeCity}\\b`, 'i'), '')
      .replace(new RegExp(`\\ben\\s+${safeCity}\\b`, 'i'), '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const lower = out.toLowerCase();
    const looksLikeSeoPhrase = !out || lower === canonical.toLowerCase() || lower.startsWith(`${canonical.toLowerCase()} `) || /\ben\s+[a-záéíóúñ]/i.test(out);
    if (looksLikeSeoPhrase) {
      out = `${canonical} ${safeCity} Pro`;
    }

    return out.replace(/\s{2,}/g, ' ').trim();
  }

  async execute(input: { niche: string; city: string; business_name?: string; address?: string; phone?: string; }): Promise<AgentResponse<any>> {
    await this.logThought(`Verifying deterministic NAP identity for ${input.niche} in ${input.city}`);

    const businessNameProvided = this.hasUsefulText(input.business_name, 4);
    const addressProvided = this.hasUsefulText(input.address, 6);
    const phoneProvided = this.hasValidPhone(input.phone);

    const business_name = this.sanitizeBusinessNameInput(
      businessNameProvided ? String(input.business_name).trim() : '',
      input.niche,
      input.city,
    );

    const address = this.normalizeAddress(addressProvided ? input.address : input.city, input.city);
    const phone = this.normalizePhone(input.phone);
    const addressGranularity = this.inferAddressGranularity(address, input.city);

    const completenessScore = [businessNameProvided, addressProvided, phoneProvided].filter(Boolean).length;
    const consistency_score = completenessScore === 3 ? 95 : completenessScore === 2 ? 84 : completenessScore === 1 ? 72 : 60;

    const truth_level = (() => {
      if (businessNameProvided && addressGranularity === 'exact' && phoneProvided) return 'exact';
      if (businessNameProvided || phoneProvided || addressGranularity === 'exact') return 'partial';
      return 'synthetic_safe';
    })();

    const trustEvidence = [
      businessNameProvided ? 'Nombre comercial aportado' : 'Nombre comercial resuelto por fallback canónico seguro',
      addressGranularity === 'exact' ? 'Dirección exacta aportada' : 'Cobertura mostrada a nivel de ciudad',
      phoneProvided ? 'Teléfono con formato válido' : 'Teléfono pendiente de validación',
      'No se inventan reseñas ni valoraciones',
    ];

    const napData = {
      business_name,
      address,
      phone,
      consistency_score,
      truth_level,
      business_name_status: businessNameProvided ? 'provided_sanitized' : 'fallback_canonical',
      address_status: addressGranularity,
      phone_status: phoneProvided ? 'validated_format' : 'missing',
      render_policy: {
        showPhone: phoneProvided,
        showExactAddress: addressGranularity === 'exact',
        showCityOnlyAddress: addressGranularity !== 'missing',
        allowReviewClaims: false,
        allowAggregateRating: false,
        allowExactLocationClaims: addressGranularity === 'exact',
      },
      trust_evidence: trustEvidence,
      citations: [
        { site: 'Google Business Profile', action: 'verify', status: phoneProvided || addressGranularity === 'exact' ? 'ready_for_manual_check' : 'needs_real_nap' },
        { site: `Directorio local de ${input.city}`, action: 'create', status: business_name ? 'ready_for_creation' : 'needs_real_brand' },
        { site: 'Bing Places', action: 'create', status: phoneProvided ? 'ready_for_creation' : 'needs_real_phone' }
      ],
      local_blurb: `${business_name} presta servicio de ${getCanonicalNicheLabel(input.niche).toLowerCase()} en ${input.city} con identidad local coherente, datos visibles y cobertura declarada sin inventar información sensible.`
    };

    return {
      success: true,
      data: napData,
      thoughts: `NAP resuelto. truth_level=${truth_level}; consistency=${consistency_score}.`
    };
  }
}
