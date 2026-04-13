import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { vault } from '../tools/vault.js';
import { PageProfile } from './contentVarietyAgent.js';
import { IntentModel } from '../types/pipeline_v2.js';
import { resolveVerticalPack } from '../knowledge-packs/base.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { renderSemanticSection } from '../renderers/sectionSemanticRenderer.js';
import { SectionRenderContract } from '../types/design.js';
import { buildWriterInjection } from '../niches/agentAdapters.js';
import { hydrateSemanticDraftFromPlaybook } from '../niches/blockContent.js';

export interface WriterInput {
    niche: string;
    city: string;
    section_h2: string;
    subsections_h3: string[];
    local_nap: {
        business_name: string;
        address: string;
        phone: string;
        mapEmbedUrl?: string;
    };
    contextual_data?: any;
    entities?: string[];
    pageProfile?: PageProfile; // New: Full profile
    introduction_style?: string; // Legacy/Override
    structure_type?: string;     // Legacy/Override
    sectionIndex?: number;       // New: for density control
    totalSections?: number;      // New: for density control
    artDirection?: string;       // New: for style control
    blockType?: string;
    preferred_format?: string;
    content_density?: string;
    layout_hint?: string;
    pattern_hint?: string;
    visual_weight?: 'light' | 'medium' | 'heavy';
    emphasis?: 'content' | 'trust' | 'cta';
    visual_variant?: string;
    visual_spec?: {
        spacingProfile?: 'tight' | 'normal' | 'airy';
        emphasis?: 'content' | 'trust' | 'cta';
        mobilePattern?: 'stack' | 'split-collapse' | 'cards';
        decorativeLevel?: 'none' | 'soft' | 'strong';
        sectionShell?: 'plain' | 'panel' | 'band' | 'editorial';
    };
    factuality_level?: string;
    mobile_priority?: string;
    section_id?: string;
    allowedLocalEntities?: string[];
    disallowedClaims?: string[];
    intentModel?: IntentModel;
    sectionBrief?: {
        objective: string;
        userQuestion: string;
        conversionAngle?: string;
        trustProofRequired?: string[];
        factualConstraints?: string[];
        internalLinksToMention?: string[];
        prohibitedClaims?: string[];
    };
    usedAngles?: string[];
    contentOnly?: boolean; // NEW: If true, do NOT output the main H2
    targetWords?: number; // NEW: Dynamic target from architect
    expansion_mode?: 'compact' | 'balanced' | 'deep';
    pageSkeleton?: string;
    heroTemplate?: string;
    cadencePattern?: string;
    proofStrategy?: string;
    ctaStrategy?: string;
    sectionPattern?: string;
    sectionContract?: SectionRenderContract;
}

export interface SectionSemanticData {
    sectionId?: string;
    h2?: string;
    intro?: string[];
    items?: Array<{ title: string; body: string; meta?: string[] }>;
    bullets?: string[];
    faqItems?: Array<{ question: string; answer: string }>;
    trustBullets?: string[];
    table?: {
        columns: string[];
        rows: string[][];
    };
    cta?: {
        text: string;
        phone: string;
        note?: string;
    };
    mapNote?: string;
    mapEmbedUrl?: string;
    commonMistakes?: string[];
    decisionFactors?: Array<{ title: string; body: string }>;
}

export interface WriterResult {
    semantic: SectionSemanticData;
    html?: string; // compat temporal
    wordCount: number;
}

/**
 * ContentWriterAgent - Redactor Especializado por Sección (Multi-Pass).
 * Genera contenido profundo y altamente enfocado para un solo H2 a la vez.
 */
export class ContentWriterAgent extends BaseAgent {
    constructor() {
        super(
            'Content_Writer_01',
            'Deep Section Writer',
            'Redactor de Sección',
            'Genera contenido largo, detallado y optimizado SEO para una sección HTML específica.',
            vault.OLLAMA_MODEL_COPY // O el modelo configurado para redacción
        );
    }

    private readonly FORBIDDEN_BOILERPLATE = [
        "conocimiento profundo",
        "nivel de especialización local",
        "franquicias impersonales",
        "nuestra red de técnicos locales se desplaza",
        "servicio limpio y profesional",
        "como referentes locales",
        "especialistas de toda la vida",
        "conocemos cada rincón",
        "estamos listos para atender su llamada",
        "no dude en contactar",
        "confíe en nosotros",
        "la transparencia en los costes y la calidad de los materiales son los pilares",
        "¿Buscas",
        "Ofrecemos soluciones profesionales, rápidas y garantizadas",
        "Nuestra metodología se adapta a las exigencias técnicas de",
        "Contamos con la experiencia necesaria",
        "Todas las intervenciones de",
        "nuestro servicio profesional",
        "la ejecución de nuestros técnicos",
        "compromiso profesional directo",
        "calidad verificada",
        "resultados que hablan por sí mismos",
        "nuestra trayectoria nos avala",
        "la rapidez no está reñida con la calidad",
        "cada especialista de nuestro equipo cuenta con una certificación técnica rigurosa y años de experiencia práctica",
        "atendemos cada solicitud de [a-záéíóúñ\\s]+ con un criterio de trabajo claro y profesional",
        "instalamos mirillas digitales de alta resolución que permiten ver con claridad quién llama a la puerta",
        "Efectivamente,",
        "De manera integral,",
        "Técnicamente,",
        "Nuestra trayectoria como",
        "La transparencia en el proceso es fundamental",
        "Trabajamos exclusivamente con marcas de prestigio",
        "Nuestros técnicos están en formación continua",
        "la innovación constante nos permite ofrecer",
        "todo se realiza bajo control"
    ];

    private normalizeCityName(city: string): string {
        if (!city) return city;
        return city
            .split(/\s+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }

    private isLocksmithLikeNiche(niche: string): boolean {
        return /cerraj|cerradur|bomb[ií]n|cilindr|cerroj|ganzu|antibumping|llave|candado|cierrapuertas|control\s+de\s+acceso/i.test(String(niche || '').toLowerCase());
    }

    private getCrossNicheForbiddenTerms(niche: string): RegExp[] {
        if (this.isLocksmithLikeNiche(niche)) {
            return [];
        }

        return [
            /intrusi(?:[oó]|&[oO]acute;)n[a-z&;]*/gi,
            /ganzu(?:[aá]|&[aA]acute;)s?[a-z&;]*/gi,
            /antibumping/gi,
            /fichet/gi,
            /dierre/gi,
            /tesa/gi,
            /amaestramiento[a-z&;]*/gi,
            /bomb(?:[ií]|&[iI]acute;)n(?:es)?[a-z&;]*/gi,
            /desahucio[a-z&;]*/gi,
            /cerradur[a-z&;]*/gi,
            /cerrajer(?:[ií]|&[iI]acute;)a[a-z&;]*/gi,
            /incopiables?[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])cilindro[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])escudo[a-z&;]*\s+magn(?:[eé]|&[eE]acute;)tico[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])extractor[a-z&;]*\s+de\s+cilindro[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])apertura[a-z&;]*\s+sin\s+dañ[oa]s/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])apertura[a-z&;]*\s+de\s+veh(?:[ií]|&[iI]acute;)culo[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])apertura[a-z&;]*\s+judicial[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])caja[a-z&;]*\s+fuerte[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])llave[a-z&;]*\s+maestra[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])control[a-z&;]*\s+de\s+acceso[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])mirilla[a-z&;]*\s+digital[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])barra[a-z&;]*\s+antip(?:[aá]|&[aA]acute;)nico[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])sistema[a-z&;]*\s+de\s+cierre[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])escudo[a-z&;]*\s+protector[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])ataque[a-z&;]*\s+externo[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])copias?\s+no\s+autorizadas?/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])realizar\s+duplicados?/gi,
            /vulnerabilidades?\s+en\s+sistemas?\s+de/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])sistema[a-z&;]*\s+de\s+acceso[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])cierre[a-z&;]*\s+de\s+seguridad[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])cierres?\s+de\s+seguridad[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])nivel\s+de\s+riesgo[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])protecci[oó]n\s+de\s+su\s+propiedad[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])an[aá]lisis\s+de\s+seguridad[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])emergencia\s+de\s+seguridad[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])t[eé]cnicas?\s+avanzadas?\s+de\s+seguridad[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])actos?\s+vand[aá]licos?[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])robos?\s+nocturnos?[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])prevenir\s+robos?[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])cumplimiento\s+normativo\s+en\s+sus\s+accesos?[a-z&;]*/gi,
            /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])necesidades?\s+de\s+seguridad\s+locales?[a-z&;]*/gi,
            /\bcierrapuertas\b/gi,
            /\bmuelles?\s+cierrapuertas\b/gi,
            /\bblindajes?\b/gi,
            /\bpuertas?\s+de\s+trastero\b/gi,
            /\bpuertas?\s+autom[aá]ticas\b/gi,
            /\bcancelas?\b/gi,
            /\bpomos?\b/gi,
            /\bmanillas?\b/gi,
            /\brepuestos?\s+originales?\b/gi,
            /\bmecanismos?\s+de\s+seguridad\b/gi,
            /\bauditor[ií]as?\s+de\s+seguridad\b/gi,
            /\bpuertas?\s+de\s+acceso\b/gi,
            /\btrasteros?\b/gi
        ];
    }

    private sanitizeSemanticForNiche<T = any>(semantic: T, niche: string): T {
        const forbidden = this.getCrossNicheForbiddenTerms(niche);
        const detectors = forbidden.map((rx) => new RegExp(rx.source, rx.flags.replace(/g/g, '')));

        const cleanText = (value: string): string => {
            let out = String(value || '');

            out = out.replace(/\s*\((?:TR|TK|AQ)-[a-z0-9]+\)\.?/gi, '');

            if (detectors.length > 0) {
                out = this.splitSentences(out)
                    .filter((sentence) => !detectors.some((rx) => rx.test(sentence)))
                    .join(' ');
            }

            out = out
                .replace(/\b(?:seguridad certificada|compromiso profesional directo|uso de sistemas avanzados|calidad verificada|con total garant[ií]a t[eé]cnica)\b/gi, '')
                .replace(/\band profesionalidad\b/gi, 'y profesionalidad')
                .replace(/\bde forma\s+(?:especializado|profesional|de confianza|excepcional|l[ií]der)\b/gi, '')
                .replace(/\bla un\b/gi, 'un')
                .replace(/\bcostee-efectiva\b/gi, 'rentable')
                .replace(/\s{2,}/g, ' ')
                .replace(/\s+([,.;:])/g, '$1')
                .trim();

            return out;
        };

        const walk = (node: any): any => {
            if (typeof node === 'string') return cleanText(node);
            if (Array.isArray(node)) return node.map(walk).filter(Boolean);
            if (node && typeof node === 'object') {
                return Object.fromEntries(
                    Object.entries(node)
                        .map(([k, v]) => [k, walk(v)])
                        .filter(([, v]) => v !== '' && v !== null && v !== undefined)
                );
            }
            return node;
        };

        return walk(semantic);
    }

    private semanticHasCrossNicheLeak(semantic: SectionSemanticData, niche: string): boolean {
        const detectors = this.getCrossNicheForbiddenTerms(niche)
            .map((rx) => new RegExp(rx.source, rx.flags.replace(/g/g, '')));

        if (!detectors.length) return false;

        const values: string[] = [];
        const walk = (node: any) => {
            if (typeof node === 'string') {
                values.push(node);
                return;
            }
            if (Array.isArray(node)) {
                node.forEach(walk);
                return;
            }
            if (node && typeof node === 'object') {
                Object.values(node).forEach(walk);
            }
        };

        walk(semantic);

        return values.some((value) => detectors.some((rx) => rx.test(String(value || ''))));
    }

    private buildEmergencySemanticFallback(input: WriterInput, semanticSeed?: SectionSemanticData | null): SectionSemanticData {
        const city = this.normalizeCityName(input.city);
        const requestedH3s = Array.isArray(input.subsections_h3) ? input.subsections_h3.filter(Boolean) : [];
        const safeIntroLine = `En ${city}, abordamos ${input.niche.toLowerCase()} con diagnóstico previo, ejecución ordenada y verificación final para evitar soluciones improvisadas.`;

        if (semanticSeed) {
            return this.sanitizeSemanticOutput({
                ...semanticSeed,
                h2: input.section_h2,
                cta: { text: 'Contactar ahora', phone: input.local_nap.phone }
            }, input);
        }

        if (input.blockType === 'faq') {
            const faqItems = requestedH3s.slice(0, 3).map((question, index) => ({
                question: question.endsWith('?') ? question : `${question}?`,
                answer: index === 0
                    ? `Explicamos el alcance del trabajo, revisamos el punto exacto de la incidencia y planteamos la alternativa más estable para ${city}.`
                    : `La respuesta depende del tipo de avería, del acceso al punto de trabajo y del material afectado, pero siempre se plantea con criterio técnico y presupuesto claro.`
            }));

            return {
                h2: input.section_h2,
                intro: [safeIntroLine],
                faqItems,
                trustBullets: ['Diagnóstico claro', 'Atención local', 'Garantía por escrito cuando corresponde'],
                cta: { text: 'Contactar ahora', phone: input.local_nap.phone }
            };
        }

        if (['services_grid', 'process_steps', 'local_proof', 'trust_band'].includes(input.blockType || '')) {
            const items = (requestedH3s.length ? requestedH3s : [input.section_h2]).slice(0, 4).map((title) => ({
                title,
                body: this.buildFallbackBodyFromTitle(title, input)
            }));

            return {
                h2: input.section_h2,
                intro: [safeIntroLine],
                items,
                trustBullets: ['Diagnóstico claro', 'Atención local', 'Intervención ordenada'],
                cta: { text: 'Contactar ahora', phone: input.local_nap.phone }
            };
        }

        return {
            h2: input.section_h2,
            intro: [safeIntroLine],
            bullets: ['Diagnóstico claro', 'Procedimiento ordenado', 'Verificación final'],
            cta: { text: 'Contactar ahora', phone: input.local_nap.phone }
        };
    }

    private buildNeutralCoverageLine(city: string): string {
        return `Cobertura operativa en ${city} con desplazamiento ajustado al tipo de trabajo, la complejidad de la intervención y la franja horaria.`;
    }

    private escapeRegex(value: string): string {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private stripTraceArtifacts(text: string): string {
        return String(text || '')
            .replace(/\s*\((?:TR|REF|ID)-[a-z0-9_-]{4,}\)\.?/gi, '')
            .replace(/\b(?:TR|REF|ID)-[a-z0-9_-]{4,}\b/gi, '')
            .trim();
    }

    private splitSentences(text: string): string[] {
        return String(text || '')
            .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
            .map((sentence) => sentence.trim())
            .filter(Boolean);
    }

    private removeScopeConflicts(text: string, niche: string): string {
        const pack = resolveVerticalPack(niche || '');
        const forbiddenTerms = (pack?.forbiddenTerms || [])
            .map((term: string) => String(term || '').trim().toLowerCase())
            .filter(Boolean);

        if (!forbiddenTerms.length) return text;

        return this.splitSentences(text)
            .filter((sentence) => {
                const low = sentence.toLowerCase();
                return !forbiddenTerms.some((term) => low.includes(term));
            })
            .join(' ')
            .trim();
    }

    private dedupeSentences(text: string): string {
        const seen = new Set<string>();

        return this.splitSentences(text)
            .filter((sentence) => {
                const key = sentence
                    .toLowerCase()
                    .replace(/[^a-záéíóúñ0-9\s]/gi, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (!key) return false;
                if (key.length < 14) return true;
                if (seen.has(key)) return false;

                seen.add(key);
                return true;
            })
            .join(' ')
            .trim();
    }

    private normalizeCtaText(text: string, phone: string): string {
        const value = String(text || '').trim();
        const compactValue = value.replace(/\D/g, '');
        const compactPhone = String(phone || '').replace(/\D/g, '');

        if (compactValue && compactPhone && compactValue === compactPhone) {
            return phone;
        }

        if (!value || value.length < 4) {
            return phone || 'Contactar ahora';
        }

        return value
            .replace(/ll[aá]manos\s+ahora/gi, 'Llamar ahora')
            .replace(/haz\s+clic\s+aquí/gi, 'Contactar ahora')
            .replace(/contacta\s+ya/gi, 'Contactar ahora')
            .replace(/no\s+dude\s+en\s+contactar/gi, 'Contactar ahora')
            .trim();
    }

    private sanitizeSentence(text: string, city: string, niche: string): string {
        if (!text) return text;

        const normalizedCity = this.normalizeCityName(city);
        const cleaned = this.dedupeSentences(
            this.removeScopeConflicts(
                this.stripTraceArtifacts(this.sanitizeModelOutput(text)),
                niche
            )
        );

        return cleaned
            .replace(/\btiempo r[eé]cord\b/gi, 'un plazo razonable según la urgencia')
            .replace(/\bl[íi]der(?:es)? indiscutibles?\b/gi, 'un servicio consolidado')
            .replace(/\bm[aá]xima prioridad y rigor profesional garantizado\b/gi, 'un criterio de trabajo claro y profesional')
            .replace(/\bla seguridad de su hogar o negocio es nuestra prioridad fundamental\b/gi, this.isLocksmithLikeNiche(niche) ? 'protegemos accesos y cerramientos con un enfoque técnico' : 'la fiabilidad de la instalación y la tranquilidad del usuario son una prioridad en cada intervención')
            .replace(/\bdisponemos de la tecnolog[ií]a m[aá]s avanzada del sector actual\b/gi, 'trabajamos con herramienta profesional y procedimientos contrastados')
            .replace(/\bprecios transparentes y presupuestos cerrados\b/gi, 'presupuesto claro antes de intervenir')
            .replace(/\bseguridad certificada\b/gi, '')
            .replace(/\bcompromiso profesional directo\b/gi, '')
            .replace(/\buso de sistemas avanzados\b/gi, '')
            .replace(/\bcalidad verificada\b/gi, '')
            .replace(/\bcon total garant[ií]a t[eé]cnica\b/gi, '')
            .replace(/\band profesionalidad\b/gi, 'y profesionalidad')
            .replace(/\bla un\b/gi, 'un')
            .replace(/\bcostee-efectiva\b/gi, 'rentable')
            .replace(/\bvalencia\b/g, normalizedCity === 'Valencia' ? 'Valencia' : 'valencia')
            .replace(/\bde de\b/gi, 'de')
            .replace(/\bde incluye\b/gi, 'incluye')
            .replace(/\bde la de\b/gi, 'de la')
            .replace(/\bde,\b/gi, ',')
            .replace(/\.\.+/g, '.')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .replace(new RegExp(`\\b${this.escapeRegex(city)}\\b`, 'gi'), normalizedCity);
    }

    private isGenericItemTitle(title?: string): boolean {
        const value = (title || '').trim().toLowerCase();
        if (!value) return true;
        return /^(intervenci[oó]n t[eé]cnica especializada(?: [a-z0-9]+)?|servicio\s+\d+|servicio\s+[abc]|bloque\s+\d+|elemento\s+\d+|punto\s+\d+|soluci[oó]n\s+\d+|servicio de [a-záéíóúñ]+ en [a-záéíóúñ\s]+|intervenci[oó]n profesional en [a-záéíóúñ\s]+|calidad t[eé]cnica en [a-záéíóúñ\s]+|procesos? de [a-záéíóúñ\s]+|metodolog[ií]a aplicada|explicaci[oó]n t[eé]cnica|compromiso local)$/i.test(value);
    }

    private buildFallbackBodyFromTitle(title: string, input: WriterInput): string {
        const city = this.normalizeCityName(input.city);
        const niche = input.niche.toLowerCase();

        return `En ${city}, este bloque de ${niche} se plantea con diagnóstico previo, ejecución ordenada y verificación final para evitar soluciones improvisadas. Antes de intervenir conviene revisar el punto exacto de fallo, el nivel de desgaste y qué alternativa deja una resolución más estable para el usuario.`;
    }

    private getRandomNicheTitle(niche: string, city: string): string {
        const variants = [
            `Especialistas en ${niche}`,
            `Servicio técnico de ${niche}`,
            `Intervención de ${niche} profesional`,
            `Expertos en ${niche} en ${city}`,
            `Maestría técnica en ${niche}`,
            `Resolución de problemas de ${niche}`,
            `Compromiso de calidad en ${niche}`
        ];
        return variants[Math.floor(Math.random() * variants.length)];
    }

    private sanitizeSemanticOutput(semantic: SectionSemanticData, input: WriterInput): SectionSemanticData {
        const city = this.normalizeCityName(input.city);
        const requestedH3s = Array.isArray(input.subsections_h3) ? input.subsections_h3.filter(Boolean) : [];

        semantic.h2 = semantic.h2 ? this.sanitizeSentence(semantic.h2, city, input.niche) : input.section_h2;
        semantic.intro = (semantic.intro || [])
            .map((paragraph) => this.sanitizeSentence(paragraph, city, input.niche))
            .filter(Boolean)
            .slice(0, input.blockType === 'cta_panel' ? 2 : 3);

        semantic.items = (semantic.items || []).map((item, index) => {
            const requestedTitle = requestedH3s[index];
            let title = (this.isGenericItemTitle(item?.title) && requestedTitle) ? requestedTitle : (item?.title || requestedTitle || '');
            
            // Hardening: Si el título sigue siendo genérico tras el intento de sustitución, le inyectamos una variante real
            if (this.isGenericItemTitle(title)) {
                title = this.getRandomNicheTitle(input.niche, city);
            }

            const sanitizedBody = item?.body ? this.sanitizeSentence(item.body, city, input.niche) : '';
            const body = sanitizedBody || this.buildFallbackBodyFromTitle(title, input);

            return {
                title: this.sanitizeSentence(title, city, input.niche),
                body,
                meta: Array.isArray(item?.meta)
                    ? Array.from(new Set(item.meta.map((meta) => this.sanitizeSentence(meta, city, input.niche)).filter(Boolean))).slice(0, 3)
                    : undefined
            };
        }).filter(item => item.title || item.body);

        if (requestedH3s.length > semantic.items.length && ['services_grid', 'process_steps', 'local_proof'].includes(input.blockType || '')) {
            requestedH3s.slice(semantic.items.length).forEach((title) => {
                semantic.items!.push({
                    title: this.sanitizeSentence(title, city, input.niche),
                    body: this.buildFallbackBodyFromTitle(title, input)
                });
            });
        }

        if ((input.blockType === 'services_grid' || input.blockType === 'process_steps' || input.blockType === 'local_proof') && semantic.items.length > 0) {
            semantic.items = semantic.items.slice(0, Math.max(3, Math.min(semantic.items.length, requestedH3s.length || 4)));
        }

        semantic.bullets = Array.from(new Set((semantic.bullets || []).map((bullet) => this.sanitizeSentence(bullet, city, input.niche)).filter(Boolean))).slice(0, 6);
        semantic.trustBullets = Array.from(new Set((semantic.trustBullets || []).map((bullet) => this.sanitizeSentence(bullet, city, input.niche)).filter(Boolean))).slice(0, 5);

        semantic.faqItems = (semantic.faqItems || []).map((item) => ({
            question: this.sanitizeSentence(item.question, city, input.niche),
            answer: this.sanitizeSentence(item.answer, city, input.niche)
        })).filter((item) => item.question && item.answer);

        if (semantic.table?.rows?.length) {
            semantic.table = {
                columns: (semantic.table.columns || []).map((column) => this.sanitizeSentence(column, city, input.niche)),
                rows: semantic.table.rows.map((row) => row.map((cell) => this.sanitizeSentence(cell, city, input.niche)))
            };
        }

        semantic.commonMistakes = Array.from(new Set((semantic.commonMistakes || []).map((item) => this.sanitizeSentence(item, city, input.niche)).filter(Boolean))).slice(0, 5);
        semantic.decisionFactors = (semantic.decisionFactors || []).map((item) => ({
            title: this.sanitizeSentence(item.title, city, input.niche),
            body: this.sanitizeSentence(item.body, city, input.niche)
        })).filter((item) => item.title && item.body);

        semantic.cta = {
            text: this.normalizeCtaText(this.sanitizeSentence(semantic.cta?.text || 'Contactar ahora', city, input.niche), input.local_nap.phone),
            phone: input.local_nap.phone,
            note: semantic.cta?.note ? this.sanitizeSentence(semantic.cta.note, city, input.niche) : undefined
        };

        if (input.blockType === 'map') {
            semantic.intro = [this.buildNeutralCoverageLine(city)];
            semantic.mapNote = `Cobertura operativa en ${city}`;
        }

        semantic = this.sanitizeSemanticForNiche(semantic, input.niche);
        return semantic;
    }

    async execute(input: WriterInput): Promise<AgentResponse<WriterResult>> {
        await this.logThought(`Redactando sección profunda: "${input.section_h2}" (Block: ${input.blockType}) para "${input.city}"`);

        const knowledge = await this.getPersistentKnowledge({
            city: input.city,
            niche: input.niche,
            brand: input.local_nap.business_name
        });
        const verticalPack = resolveVerticalPack(input.niche);
        
        // Use injected briefs from BaseAgent
        const writerBrief = this.nicheBrief || "";
        const technicalNorms = this.technicalBrief || "";

        try {
            if (!writerBrief) {
                // Fallback if not injected (should not happen in pipeline)
                (this as any).nicheBrief = buildWriterInjection(input.niche);
            }
        } catch (e) {
            await this.logThought(`[Warning] No high-fidelity brief for niche ${input.niche}. Using generic baseline.`);
        }

        let semanticSeed: any = null;
        try {
            semanticSeed = hydrateSemanticDraftFromPlaybook(input.niche, input.blockType || '');
        } catch (e) {
            await this.logThought(`[Warning] No semantic seed for niche ${input.niche} / block ${input.blockType}.`);
        }

        const isFirstSection = input.sectionIndex === 0;
        const isLastSection = input.sectionIndex === (input.totalSections || 0) - 1;
        const brandMentionLimit = (isFirstSection || isLastSection) ? 1 : 2;
        const expansionMode =
            input.targetWords && input.targetWords >= 320 ? 'deep' :
                input.targetWords && input.targetWords >= 200 ? 'balanced' :
                    'compact';
        // NEW: Format and Density Guidance
        let blockInstruction = `
- FORMATO ASIGNADO: ${input.preferred_format || 'prose'}. 
  * Si es 'cards', genera bloques breves y homogéneos. 
  * Si es 'bullets', usa una lista estructurada con explicaciones técnicas.
  * Si es 'table', genera una tabla comparativa útil (SOLO SI SE PIDE 'table').
  * Si es 'trust_cards', genera 3-4 tarjetas de confianza con título y una frase.
- DENSIDAD: ${input.content_density || 'standard'}. 
  * Si es 'compact', evita cualquier relleno y sé directo.
- FACTUALIDAD: ${input.factuality_level || 'editorial'}. 
  * Si es 'strict', NO improvises datos, marcas, tiempos o certificaciones.
- PRIORIDAD MÓVIL: ${input.mobile_priority || 'normal'}. 
- LAYOUT HINT: ${input.layout_hint || 'auto'}.
  * split_feature: apertura fuerte + bloques claramente contrastados.
  * boxed_content: bloques o tarjetas bien separadas.
  * full_width_text: narrativa más corrida y limpia.
  * minimal_centered: texto más breve, directo y escaneable.
  * two_column_trust: estructura orientada a prueba/confianza.
- PATTERN HINT: ${input.pattern_hint || 'none'}.
  * Es un patrón compositivo interno y NO sustituye el layout base.
  * Ejemplos válidos: proof_stack, trust_strip, timeline_story, authority_band.
  * Úsalo solo para modular el orden interno del contenido, no para cambiar la semántica del bloque.
- PESO VISUAL: ${input.visual_weight || 'medium'}.
  * light: menos bloques, menos enumeraciones, lectura limpia.
  * medium: equilibrio entre texto y estructura.
  * heavy: más densidad visual, listas, tarjetas, elementos de conversión.

- ÉNFASIS: ${input.emphasis || 'content'}.
  * content: prioriza explicación técnica y claridad.
  * trust: prioriza pruebas, garantías por escrito, transparencia y señales de confianza.
  * cta: prioriza urgencia, contacto y avance a conversión sin sonar agresivo.
  * Si es 'high', usa frases más cortas y párrafos de máximo 3 líneas.
- ENTIDADES PERMITIDAS: ${(input.allowedLocalEntities || []).join(', ')}.
- REGLA DE MAPA: Si es un bloque de mapa, el copy debe ser NEUTRO y orientativo (sin claims de tiempo).
- CLAIMS PROHIBIDOS: "20 minutos", "menos de 20 minutos", "inmediato garantizado", "garantía de 10 años", "precio cerrado" (salvo dato real).
- OBJETIVO DE LONGITUD: ${input.targetWords || 180} palabras aproximadas.
- MODO DE EXPANSIÓN: ${expansionMode}.

REGLAS DE EXPANSIÓN SIN RELLENO:
- Si el modo es 'compact', responde con precisión y alta densidad.
- Si el modo es 'balanced', añade contexto técnico, criterios de decisión y una o dos objeciones frecuentes.
- Si el modo es 'deep', desarrolla la sección con capas reales:
  1. explicación técnica,
  2. variantes o casos frecuentes,
  3. señales de riesgo o errores comunes,
  4. criterios de elección profesional,
  5. micro-prueba o garantía operativa sin inventar datos.
- Nunca repitas la misma idea con sinónimos.
- Cada párrafo o ítem debe aportar un ángulo nuevo.
- Si faltan datos verificables, profundiza con proceso, diagnóstico, escenarios y recomendaciones, no con afirmaciones vacías.

`;

        const dynamicTarget = input.targetWords || 250;
        const angle = input.pageProfile?.editorial_angle || 'transparencia-total';
        const introStyle = input.introduction_style || 'explicación técnica';
        const structType = input.structure_type || 'bloques de valor';

        const nuanceEngines: Record<string, string> = {
            'legado-local': `NUANCE: Enfoque en LEGADO Y TRADICIÓN. 
                - Menciona barrios específicos de ${input.city} de forma natural.
                - Usa frases como "como los profesionales de toda la vida", "conocemos cada rincón de ${input.city}".
                - Prioriza historias de "antes vs ahora" en las explicaciones técnicas.`,
            'fiabilidad-extrema': `NUANCE: Enfoque en FIABILIDAD TÉCNICA Y PREVENCIÓN DE DAÑOS ESTRUCTURALES.
    - Habla de estabilidad, durabilidad, ajuste correcto, resistencia al uso y prevención de averías.
    - El tono debe ser serio, preventivo y enfocado en evitar problemas futuros e inconvenientes.
    - Explica por qué una solución bien ejecutada reduce incidencias y mejora el resultado final sin recurrir a temáticas ajenas al oficio.`,
            'elite-tecnica': `NUANCE: Enfoque en EXCELENCIA TÉCNICA Y MAESTRÍA.
    - Menciona procesos y herramientas genéricas del oficio, nunca herramientas exclusivas de otro nicho.
    - El tono debe ser didáctico pero técnico, como un maestro explicando su oficio.
    - Enfócate en la precisión del ajuste, la calidad del material y el acabado final.`,
            'rapidez-critica': `NUANCE: Enfoque en LOGÍSTICA Y VELOCIDAD DE RESPUESTA.
                - Usa un ritmo de frases más cortas y dinámicas. 
                - Enfócate en la paz mental que da la rapidez, la disponibilidad en ${input.city} y la optimización de rutas.
                - Frases clave: "tiempo de respuesta optimizado", "asistencia en minutos", "solución inmediata".`,
            'transparencia-total': `NUANCE: Enfoque en ÉTICA Y HONESTIDAD PROFESIONAL.
                - Explica el "por qué" de las tarifas (sin dar precios).
                - Habla de "presupuestos cerrados antes de empezar", "sin sorpresas en factura".
                - El tono debe ser humano, educativo y honesto (accountability focus).`
        };

        const writingStyleInstruction = `
- TIPO DE BLOQUE (CRÍTICO): ${input.blockType}
${blockInstruction}
- ÁNGULO EDITORIAL (OBLIGATORIO): ${angle.toUpperCase()}
- ESTILO DE INTRODUCCIÓN (OBLIGATORIO): ${introStyle}
- TIPO DE ESTRUCTURA (OBLIGATORIO): ${structType}
- NUANCE ACTIVA: ${nuanceEngines[angle] || nuanceEngines['transparencia-total']}

REGLAS DE TONO (IMPRESCINDIBLE):
- Si es 'narrative' o 'authority_note': Usa un tono directo y profesional, sin auto-bombo. Habla de compromiso, procesos y ética, no de "somos los mejores".
- Si es 'local_proof': Limítate a 1 párrafo de contexto y 3 evidencias concretas (barrios, logística).
- PROHIBIDO USAR ESTAS FRASES (BOILERPLATE DETECTADO): "¿Buscas...", "Nuestra metodología se adapta...", "Contamos con la experiencia necesaria...", "servicio profesional", "soluciones a medida", "amplia gama de servicios".

- TARGET DE LONGITUD: Esta sección DEBE tener aproximadamente ${dynamicTarget} palabras.
- VOCABULARIO CRÍTICO: Usa ÚNICAMENTE terminología estrictamente perteneciente al oficio de "${input.niche}".
- PROHIBIDO ABSOLUTO: Bajo ningún concepto hables de "seguridad", "protección anti-robos", "sistemas de acceso" ni "intrusiones" si el nicho no es explícitamente de cerrajería de seguridad. Manten el vocabulario alineado a ${input.niche}.
- MARCAS: no inventes marcas ni materiales concretos si no vienen dados por el contexto.
- DETALLE TÉCNICO: Prioriza naturalidad y claridad comercial. Evita el "fluff" SEO innecesario.
`;

        if (input.blockType === 'map') {
            const normalizedCity = this.normalizeCityName(input.city);
            const mapSemantic: SectionSemanticData = {
                sectionId: input.section_id || 'mapa',
                h2: input.section_h2,
                intro: [this.buildNeutralCoverageLine(normalizedCity)],
                mapNote: `Cobertura operativa en ${normalizedCity}`,
                mapEmbedUrl: input.local_nap.mapEmbedUrl
            };
            return {
                success: true,
                data: {
                    semantic: mapSemantic,
                    html: renderSemanticSection(mapSemantic, {
                        blockType: input.blockType,
                        sectionId: input.section_id,
                        sectionH2: input.contentOnly ? undefined : input.section_h2,
                        contentOnly: input.contentOnly,
                        layoutHint: input.layout_hint as any,
                        patternHint: input.pattern_hint,
                        visualVariant: (input as any).visual_variant,
                        visualWeight: input.visual_weight,
                        emphasis: input.emphasis,
                        pageComposition: input.pageProfile?.page_composition,
                        visualSystem: (input.pageProfile?.designDNA as any)?.visualSystem,
                        sectionShell: (input as any).visual_spec?.sectionShell || 'plain',
                        pageSkeleton: input.pageSkeleton as any,
                        heroTemplate: input.heroTemplate as any,
                        cadencePattern: input.cadencePattern as any,
                        proofStrategy: input.proofStrategy as any,
                        ctaStrategy: input.ctaStrategy as any,
                        sectionPattern: input.sectionPattern as any
                    }),
                    wordCount: 45
                },
                thoughts: "Neutral map block with systemic semantic structure."
            };
        }

        const nicheLabel = input.niche.charAt(0).toUpperCase() + input.niche.slice(1);
        const prompt = `
Actúa como un redactor Senior especializado en SEO Local y conversión. Tu misión es redactar una sección específica para una página de servicios de ${input.niche} en ${input.city}.
PROHIBIDO EL CONTENIDO DE RELLENO. Prioriza la claridad comercial y el valor técnico sobre la longitud artificial.

OBJETIVO DE ESTE BLOQUE: ${input.sectionBrief?.objective || 'Redacción técnica de alta autoridad'}
PREGUNTA DEL USUARIO A RESOLVER: ${input.sectionBrief?.userQuestion || input.section_h2}

${knowledge}

[REGLAS TÉCNICAS Y NORMAS DE NEGOCIO (OBLIGATORIO)]:
${technicalNorms}
- REGLA DE ENTROPÍA CLUSTER: Queda terminantemente prohibido empezar más de 2 párrafos o cards con la misma palabra o fórmula (Ej: No uses "En...", "Nuestros...", "Contamos..." como inicio sistemático). Varía la estructura sintáctica en cada bloque.

DATOS DE MISIÓN:
- **NICHE**: ${input.niche}
- **CITY**: ${input.city}
- **BUSINESS**: ${input.local_nap.business_name}
- **GEO CONTEXT**: ${(input.contextual_data as any)?.geoData?.neighborhoods?.join(', ') || 'General city coverage'}

[BRIEF DEL NICHO]:
${writerBrief}

SEMILLA SEMIESTRUCTURADA DEL PLAYBOOK (Usa esto como base o referencia fuerte):
${JSON.stringify(semanticSeed, null, 2)}

- TELÉFONO ÚNICO Y OBLIGATORIO: ${input.local_nap.phone}
  - [CRÍTICO] Está TERMINANTEMENTE PROHIBIDO usar cualquier número que no sea el proporcionado arriba. No uses números de ejemplo ni variaciones.
  - [CRÍTICO] Si usas un número incorrecto, la página será rechazada por el sistema de auditoría técnica.

${input.contentOnly ?
                `Escribe SOLO EL CUERPO (párrafos, listas, h3, tarjetas o tabla según el formato ${input.preferred_format}) para la sección "${input.section_h2}". PROHIBIDO incluir el tag <h2>.` :
                `Escribe el contenido para la sección "${input.section_h2}". NO incluyas el tag <h2>, ya lo añadirá el sistema automáticamente.`
            }

SUB-SECCIONES- **H3 REQUERIDOS**: Es OBLIGATORIO incluir todos los H3 solicitados: ${(input.subsections_h3 || []).join(', ')}. Cada H3 debe tener al menos 2 párrafos de contenido detallado.
- **NEUTRALIDAD DE MARCA**: PROHIBIDO mencionar marcas específicas del sector "${input.niche}". Usa términos genéricos como "marcas líderes", "componentes certificados" o "materiales de alta calidad".
- **ESTO ES UNA LANDING PREMIUM**: Usa un tono profesional, técnico y autoritario. Evita frases genéricas.
- **REGLAS DE PROFUNDIDAD CRÍTICAS**:
1. Longitud Objetivo para esta sección: ${dynamicTarget} palabras (No exceder significativamente).
2. Formato de salida: JSON SEMÁNTICO VÁLIDO, no HTML.
3. Debes devolver una estructura adaptada al blockType.
4. No inventes campos fuera del esquema.
5. Prohibido: frases de relleno vacías. Todo debe ser información técnica o local útil.
6. Desarrollo equilibrado: Asegura que cada H3 tenga al menos 2 párrafos de explicación técnica o una lista/tabla de apoyo.

REGLA DE ATAQUE DIRECTO (Anti-Fluff):
- PROHIBIDO empezar secciones o párrafos con: "Bienvenido a...", "En este artículo...", "Si estás buscando...", "Nuestra empresa...", "En [Ciudad]...", "Descubre cómo...", "En la actualidad", "Es importante destacar", "Comprender esto es vital".
- NUNCA repitas el texto del H2/H3 exacto en la primera frase del párrafo que le sigue.
- La primera oración de cada párrafo debe contener un dato técnico, un beneficio directo o una entidad de nicho. Prohibido el preámbulo vacío.

- **BLACK-LIST EDITORIAL (PROHIBIDO ABSOLUTO)**: No uses NUNCA estas frases o sus variaciones cercanas:
  ${this.FORBIDDEN_BOILERPLATE.map(p => `* "${p}"`).join('\n  ')}

${writingStyleInstruction}

REGLA DE IDIOMA: [CRÍTICO] TODO el texto debe ser en ESPAÑOL DE ESPAÑA. Prohibido incluir caracteres chinos, reflexiones de la IA en otros idiomas o textos de relleno al final de los bloques.

REGLA DE CIUDAD: [CRÍTICO] Solo menciona barrios, distritos o zonas específicas si vienen en las entidades permitidas o son de conocimiento general verificado para ${input.city}. NO inventes barrios.

REGLA DE TELÉFONO [MÁXIMA PRIORIDAD]: Es obligatorio que el teléfono "${input.local_nap.phone}" aparezca al menos una vez en cada bloque. 
Está TOTALMENTE PROHIBIDO usar números de ejemplo, números con "123", o cualquier número que no sea el proporcionado arriba. No uses "96 123 45 67" ni variaciones.
Si el texto generado no contiene el teléfono "${input.local_nap.phone}", la generación será nula.

REGLA DE GARANTÍA Y PRECIOS: [CRÍTICO] Prohibido mencionar años específicos (ej: "10 años"). Usa "garantía por escrito". Prohibido mencionar precios concretos. Usa "precios justos" o "tarifas competitivas". Si generas una tabla, NO incluyas columnas de garantía con valores numéricos.
RESPONDE SOLO JSON VÁLIDO.

REGLAS DE DIFERENCIACIÓN OBLIGATORIAS:
- PROHIBIDO reutilizar aperturas genéricas como "Nuestro equipo de especialistas...", "Como expertos en...", "Ofrecemos servicios de...".
- PROHIBIDO reutilizar cierres como "Estamos listos para atender su llamada...", "No dude en contactar...", "Confíe en nosotros...".
- Cada sección debe arrancar con una estrategia distinta: diagnóstico, objeción, criterio técnico, caso frecuente, error habitual, señal local o decisión comparativa.
- Cada bloque debe tener un ángulo editorial ÚNICO. No repitas el mismo beneficio principal en dos bloques distintos.
- No repitas la misma estructura de frase en dos tarjetas consecutivas.
- Si generas listas de servicios, alterna entre:
  1) beneficio + situación de uso
  2) problema + solución
  3) criterio técnico + resultado
- FAQ:
  - CADA RESPUESTA DEBE TENER UN PATRÓN DISTINTO Y APORTAR VALOR TÉCNICO:
    a) Respuesta directa + Matriz técnico (ej: "Depende de la severidad del problema, pero usualmente...")
    b) Advertencia + Recomendación (ej: "No intente forzar la instalación, ya que podría dañar el componente...")
    c) Caso frecuente + Criterio de decisión (ej: "Si el síntoma persiste tras el reinicio, la causa suele ser...")
    d) Desmitificación de coste (ej: "Muchos clientes temen un desembolso elevado, pero en este escenario...")
  - PRIORIDAD DE PREGUNTAS: Objeciones reales (tiempo, precio, garantía, disponibilidad, tipo de avería). Prohibido preguntas genéricas normativas.
  - PROHIBIDO: Respuestas de una sola línea o extremadamente genéricas.
  - prohibido usar la frase "La transparencia en los costes y la calidad de los materiales son los pilares..."
- Local proof:
  - Objetivo: 1 párrafo local potente + 3 evidencias concretas.
  - prohibido repetir "Atendemos de forma inmediata en todos los barrios..."
  - Evita cards abstractas como "logística específica del área" o "casos habituales".

Para services_grid:
{
  "intro": ["párrafo 1", "párrafo 2"],
  "items": [
    { "title": "Servicio 1", "body": "..." }
  ],
  "trustBullets": ["...", "..."],
  "cta": { "text": "Llamar ahora", "phone": "${input.local_nap.phone}" }
}

Para faq:
{
  "intro": ["..."],
  "faqItems": [
    { "question": "...", "answer": "..." }
  ],
  "cta": { "text": "Consultar disponibilidad", "phone": "${input.local_nap.phone}" }
}

Para price_guidance:
{
  "intro": ["..."],
  "table": {
    "columns": ["Situación", "Compromiso", "Ventaja"],
    "rows": [["...", "...", "..."]]
  },
  "cta": { "text": "Solicitar presupuesto", "phone": "${input.local_nap.phone}" }
}`;

        try {
            let rawResponse = await this.callModel(prompt);
            let semantic: SectionSemanticData = safeJsonParse<SectionSemanticData>(rawResponse, {
                intro: [],
                items: [],
                cta: { text: 'Contactar ahora', phone: input.local_nap.phone }
            });

            semantic = this.sanitizeSemanticForNiche(semantic, input.niche);

            // Robust Fallback: Si el LLM falla en items pero tenemos semilla, la usamos
            if (semanticSeed && (!semantic.items?.length && !semantic.faqItems?.length && !semantic.table?.rows?.length)) {
                console.log(`[Writer] LLM output weak. Hydrating from Niche Playbook seed for block ${input.blockType}.`);
                semantic = { ...semanticSeed, ...semantic };
            }

            // --- AUTO-RETRY IF TOO SHORT OR EMPTY ---
            const jsonWordCount = JSON.stringify(semantic).split(/\s+/).length;
            const hasItems = (semantic.items?.length || 0) > 0 || (semantic.faqItems?.length || 0) > 0 || (semantic.table?.rows?.length || 0) > 0;

            if (jsonWordCount < 40 || !hasItems) {
                this.logThought(`Section too short (${jsonWordCount} words) or empty items. Retrying with Force-Abundance...`);
                const retryPrompt = `${prompt}\n\n[CRÍTICO] TU RESPUESTA ANTERIOR FUE RECHAZADA POR SER DEMASIADO CORTA. \nDebes redactar AL MENOS 4 elementos detallados en el array 'items' o 'faqItems', con al menos 2 párrafos de 40 palabras cada uno. NO ESCATIMES EN DETALLES.`;

                rawResponse = await this.callModel(retryPrompt);
                semantic = safeJsonParse<SectionSemanticData>(rawResponse, semantic);
            }

            // Fallback to raw if still problematic
            if (!semantic.intro?.length && !hasItems) {
                semantic.intro = [this.sanitizeModelOutput(rawResponse)];
            }

            semantic = this.sanitizeSemanticOutput(semantic, input);

            if (this.semanticHasCrossNicheLeak(semantic, input.niche)) {
                await this.logThought(`[Writer] Cross-niche semantic leak detected in block ${input.blockType}. Rebuilding deterministic fallback.`);
                semantic = this.buildEmergencySemanticFallback(input, semanticSeed);
                semantic = this.sanitizeSemanticOutput(semantic, input);
            }

            // --- LLM SAFETY WASH (PHONE) ---
            const realPhone = input.local_nap.phone;
            // Catch most variations of 9-digit Spanish landlines with spaces/dots/dashes
            const phonePattern = /(?:\+34|0034|34)?[\s.-]?[6789](?:[\s.-]?\d){8}/g;
            const html = renderSemanticSection(semantic, {
                blockType: input.blockType,
                sectionId: input.section_id,
                sectionH2: input.contentOnly ? undefined : input.section_h2,
                contentOnly: input.contentOnly,
                layoutHint: input.layout_hint as any,
                visualVariant: (input as any).visual_variant,
                visualWeight: input.visual_weight,
                emphasis: input.emphasis,
                pageComposition: input.pageProfile?.page_composition,
                visualSystem: (input.pageProfile?.designDNA as any)?.visualSystem,
                sectionShell: (input as any).visual_spec?.sectionShell || 'plain',
                commonMistakes: semantic.commonMistakes,
                decisionFactors: semantic.decisionFactors,
                pageSkeleton: input.pageSkeleton as any,
                heroTemplate: input.heroTemplate as any,
                cadencePattern: input.cadencePattern as any,
                proofStrategy: input.proofStrategy as any,
                ctaStrategy: input.ctaStrategy as any,
                sectionPattern: input.sectionPattern as any,
                sectionContract: input.sectionContract
            });

            const count = JSON.stringify(semantic).split(/\s+/).length;
            let finalHtml = html.replace(phonePattern, (match: string) => {
                const compactMatch = match.replace(/\D/g, '');
                const compactReal = realPhone.replace(/\D/g, '');
                // Replace if the last 9 digits (the actual local number) do not match
                if (compactMatch.slice(-9) !== compactReal.slice(-9)) {
                    return realPhone;
                }
                return match;
            });

            // --- VALIDACIÓN POST-REDACCIÓN ---
            const issues: string[] = [];
            const lowHtml = finalHtml.toLowerCase();

            // 1. Manejo de H2: El renderer ya añade el H2 si no es contentOnly.
            if (input.contentOnly && lowHtml.includes('<h2')) {
                issues.push('ERROR: El writer incluyó un H2 en modo contentOnly (duplicidad detectada).');
            }
            // Eliminado el bloque que forzaba el H2 manual porque el renderer de secciones lo gestiona.

            // 2. Debe incluir H3 si se pidieron
            for (const h3 of input.subsections_h3 || []) {
                if (!lowHtml.includes(h3.toLowerCase().substring(0, 5))) {
                    issues.push(`Falta H3 requerido: ${h3}`);
                }
            }

            // 3. Mínimo de utilidad (umbral reducido para mayor tolerancia en bloques de acción)
            const finalWordCount = finalHtml.split(/\s+/).length;
            const absoluteMinFactor = (input.blockType === 'urgency_panel' || input.blockType === 'cta_panel') ? 0.08 : 0.25;
            const absoluteMin = Math.floor(dynamicTarget * absoluteMinFactor);
            if (finalWordCount < absoluteMin) issues.push(`Pobreza editorial crítica (${finalWordCount}/${absoluteMin} palabras).`);

            // 4. Frases vacías / Placeholders
            if (lowHtml.includes('contenido experto sobre') || lowHtml.includes('texto optimizado para')) {
                issues.push('Presencia de frases placeholder detectada.');
            }
            if (/intervenci[oó]n t[eé]cnica especializada|servicio\s+[abc]|servicio\s+\d+/i.test(finalHtml)) {
                issues.push('Se detectaron títulos genéricos de marcador en items o cards.');
            }

            // 5. CTA final
            if (isLastSection && !lowHtml.includes('tel:') && !lowHtml.includes('cta-link')) {
                issues.push('CTA final ausente o detectado como vacío.');
            }

            if (issues.length > 0) {
                this.logThought(`[QA Interno] Advertencias en sección: ${issues.join(' | ')}`);
            }

            // Success is now based on meeting a reasonable floor and being technical, even if some H3s are missed.
            const meetsFloor = finalWordCount >= absoluteMin * 0.7;
            const isSafe = !issues.includes('ERROR: El writer incluyó un H2 en modo contentOnly (duplicidad detectada).') &&
                !issues.includes('Presencia de frases placeholder detectada.');

            return {
                success: meetsFloor && isSafe,
                data: { semantic, html: finalHtml, wordCount: finalWordCount },
                thoughts: `Redactado: ${input.blockType}. Words: ${finalWordCount}. Issues QA: ${issues.length}. Status: ${meetsFloor && isSafe ? 'PASS' : 'RETRY'}`
            };

        } catch (error: any) {
            await this.logThought(`[RESCATE] Ollama falló en redacción de "${input.section_h2}": ${error.message}. Generando contenido de emergencia.`);

            const niche = input.niche || 'Profesionales';
            const city = input.city || 'tu zona';
            const phone = input.local_nap.phone;
            const pack = resolveVerticalPack(niche);

            // Recursive variable replacement helper
            const sanitize = (val: string) => (val || '').replace(/\${city}/g, city).replace(/\${niche}/g, niche);

            const technical = (pack.technicalConcepts.length > 0 ? pack.technicalConcepts : ['servicios técnicos especializados', 'soluciones profesionales']).map(sanitize);
            const trust = (pack.trustSignals.length > 0 ? pack.trustSignals : ['atención 24/7', 'presupuesto sin compromiso']).map(sanitize);

            const fallbackSemantic: SectionSemanticData = {
                intro: [
                    `${niche} en ${city} demanda un enfoque técnico especializado y el uso de componentes con certificación de calidad.`,
                    `Nuestras intervenciones técnicas en el área de ${city} priorizan la durabilidad estructural y el cumplimiento de los estándares de seguridad vigentes.`,
                    `Analizamos cada instalación en ${city} para aplicar soluciones específicas que garanticen la estabilidad operativa a largo plazo.`
                ],
                items: technical.map((concept, idx) => {
                    const templates = [
                        `Ejecutamos procesos de ${concept} bajo normativas de seguridad rigurosas. En el entorno de ${city}, nos enfocamos en el ajuste técnico para maximizar la vida útil.`,
                        `La resolución de incidencias en ${concept} requiere un diagnóstico pormenorizado. Empleamos componentes homologados para un rendimiento óptimo en ${city}.`,
                        `Auditamos cada fase de ${concept} en ${city} para asegurar la trazabilidad de la intervención y la idoneidad de los materiales.`,
                        `Nuestra operativa en ${concept} integra estándares industriales específicos para ${city}, velando por que cada detalle reciba atención técnica.`
                    ];
                    return {
                        title: concept.charAt(0).toUpperCase() + concept.slice(1),
                        body: templates[idx % templates.length]
                    };
                }),
                trustBullets: [
                    ...trust.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
                    `Certificación técnica verificada en ${city}`,
                    'Presupuesto analítico detallado',
                    'Cumplimiento estricto de normativa industrial'
                ],
                cta: { text: "Solicitar evaluación técnica", phone: phone }
            };

            // Customization based on block type
            if (input.blockType === 'faq') {
                fallbackSemantic.intro = [`Resolvemos las dudas técnicas y logísticas más frecuentes sobre nuestros servicios de ${niche.toLowerCase()} en ${city}.`];
                fallbackSemantic.faqItems = [
                    {
                        question: `¿Cuál es el tiempo de respuesta para servicios en ${city}?`,
                        answer: `Contamos con técnicos distribuidos en puntos estratégicos de ${city} para optimizar los traslados. La disponibilidad se gestiona en tiempo real para asegurar una atención ágil en toda la zona geográfica.`
                    },
                    {
                        question: `¿El presupuesto proporcionado para ${city} es vinculante?`,
                        answer: `Emitimos una valoración técnica previa. Para mayor transparencia, el especialista confirma el diagnóstico in situ en ${city} y presenta el presupuesto detallado antes de proceder con la reparación.`
                    },
                    {
                        question: `¿Qué tipo de garantía ofrecéis por los trabajos realizados en ${city}?`,
                        answer: `Todos nuestros servicios de ${niche.toLowerCase()} en ${city} cuentan con garantía por escrito que cubre tanto la mano de obra como los materiales instalados, cumpliendo estrictamente con la normativa vigente.`
                    },
                    {
                        question: `¿Tenéis disponibilidad inmediata en todos los barrios de ${city}?`,
                        answer: `Sí, mantenemos disponibilidad de guardia según la franja y la urgencia en ${city}. Cubrimos todos los distritos y áreas metropolitanas, asegurando que siempre haya un profesional disponible cerca de usted.`
                    }
                ];
            } else if (input.blockType === 'urgency_panel') {
                fallbackSemantic.intro = [
                    `Atención técnica prioritaria para incidencias de ${niche.toLowerCase()} en ${city} que no pueden esperar.`,
                    `Nuestra infraestructura logística está diseñada para dar respuesta a averías críticas en cualquier punto de ${city} con la máxima celeridad.`
                ];
                fallbackSemantic.items = [
                    { title: "Diagnóstico Rápido", body: `Evaluamos la gravedad de la situación en ${city} para asignar el técnico más cercano y el equipamiento específico necesario para una solución definitiva.` },
                    { title: "Unidades Móviles", body: `Nuestros vehículos en ${city} están equipados con un stock completo de repuestos y herramientas de precisión para resolver la mayoría de servicios en una sola visita.` },
                    { title: "Seguridad Garantizada", body: `Priorizamos la integridad de su instalación en ${city}, aplicando técnicas no invasivas siempre que sea posible para evitar daños colaterales durante la reparación.` }
                ];
            } else if (input.blockType === 'cta_panel' || input.blockType === 'micro_cta') {
                fallbackSemantic.intro = [
                    `Contacte ahora con un especialista in ${niche.toLowerCase()} para resolver su problema en ${city} de forma profesional y transparente.`,
                    `Estamos disponibles para asesorarle sobre la mejor solución técnica para su caso particular en ${city}.`
                ];
                fallbackSemantic.items = [
                    { title: "Atención Directa", body: `Llame al ${phone} y un técnico cualificado le atenderá personalmente para coordinar la visita a su ubicación en ${city}.` }
                ];
            } else if (input.blockType === 'comparison_table' || input.blockType === 'price_guidance') {
                fallbackSemantic.intro = [
                    `Entienda los factores que determinan la calidad de un servicio técnico de ${niche.toLowerCase()} en ${city}.`,
                    `Comparamos los estándares de nuestra metodología frente a las soluciones genéricas del mercado en ${city}.`
                ];
                fallbackSemantic.table = {
                    columns: ["Factor Crítico", "Nuestro Estándar", "Beneficio"],
                    rows: [
                        ["Materiales", "Componentes Homologados", "Mayor durabilidad del sistema"],
                        ["Mano de Obra", "Técnicos Especialistas", "Ejecución precisa y segura"],
                        ["Garantía", "Certificado por Escrito", "Tranquilidad total post-servicio"],
                        ["Transparencia", "Presupuesto previo", "Sin sorpresas en la factura final"]
                    ]
                };
            } else if (input.blockType === 'local_proof') {
                fallbackSemantic.intro = [
                    `Nuestra presencia técnica en ${city} nos permite ofrecer una cobertura real y efectiva en todos los distritos.`,
                    `Conocemos las tipologías de instalaciones más comunes en cada zona de ${city}, lo que agiliza el diagnóstico y la reparación.`
                ];
                fallbackSemantic.items = [
                    { title: "Evidencia de Proximidad", body: `Contamos con técnicos residentes en ${city}, lo que reduce las esperas y asegura un conocimiento exhaustivo de la zona geográfica.` },
                    { title: "Adaptación al Entorno", body: `Nuestra metodología contempla las normativas específicas de ${city} y las necesidades particulares de sus diferentes núcleos urbanos.` },
                    { title: "Capacidad de Respuesta", body: `La distribución estratégica de nuestras unidades en ${city} garantiza que siempre podamos atender servicios urgentes y programados.` }
                ];
            } else if (input.blockType === 'process_steps' || input.blockType === 'timeline') {
                fallbackSemantic.intro = [
                    `Un proceso estructurado para garantizar resultados de calidad en cada intervención de ${niche.toLowerCase()} en ${city}.`,
                    `Seguimos protocolos estrictos desde el primer contacto hasta la finalización del trabajo en ${city}.`
                ];
                fallbackSemantic.items = [
                    { title: "Diagnóstico", body: `Analizamos el estado de su instalación en ${city} para proponer la solución más eficiente y duradera.` },
                    { title: "Presupuesto", body: `Presentamos una valoración detallada y transparente antes de iniciar cualquier acción técnica en ${city}.` },
                    { title: "Ejecución", body: `Realizamos el trabajo de ${niche.toLowerCase()} utilizando herramientas de precisión y materiales de alta gama en su ubicación de ${city}.` },
                    { title: "Control", body: `Verificamos el correcto funcionamiento de la reparación en ${city} antes de dar por finalizado el servicio.` },
                    { title: "Documentación y Garantía", body: `Entregamos la factura detallada y el certificado de garantía operativa para su total tranquilidad en ${city}.` }
                ];
            }

            const fallbackHtml = renderSemanticSection(fallbackSemantic, {
                blockType: input.blockType,
                sectionId: input.section_id,
                sectionH2: input.section_h2,
                contentOnly: input.contentOnly,
                layoutHint: input.layout_hint as any,
                visualVariant: (input as any).visual_variant,
                visualWeight: input.visual_weight,
                emphasis: input.emphasis,
                pageComposition: input.pageProfile?.page_composition,
                visualSystem: (input.pageProfile?.designDNA as any)?.visualSystem,
                sectionShell: (input as any).visual_spec?.sectionShell || 'plain',
                pageSkeleton: input.pageSkeleton as any,
                heroTemplate: input.heroTemplate as any,
                cadencePattern: input.cadencePattern as any,
                proofStrategy: input.proofStrategy as any,
                ctaStrategy: input.ctaStrategy as any,
                sectionPattern: input.sectionPattern as any
            });

            return {
                success: true,
                data: { semantic: fallbackSemantic, html: fallbackHtml, wordCount: 150 },
                thoughts: "Ollama Error Fallback: Semantic recovery from playbook patterns."
            };
        }
    }
}





