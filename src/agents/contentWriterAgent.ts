import { BaseAgent, AgentResponse } from './base.js';
import axios from 'axios';
import { AIFacade } from '../tools/aiFacade.js';
import { vault } from '../tools/vault.js';
import { PageProfile } from './contentVarietyAgent.js';
import { IntentModel } from '../types/pipeline_v2.js';
import { resolveVerticalPack } from '../knowledge-packs/base.js';
import { safeJsonParse } from '../utils/jsonRecovery.js';
import { renderSemanticSection } from '../renderers/sectionSemanticRenderer.js';
import { SectionRenderContract } from '../types/design.js';
import { buildWriterInjection } from '../niches/agentAdapters.js';
import { hydrateSemanticDraftFromPlaybook } from '../niches/blockContent.js';
import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';
import { getRulesByCategory } from '../knowledge-packs/governanceRules.js';

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

    private truncate(value: any, max = 400): string {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        return text.length > max ? `${text.slice(0, max)}…` : text;
    }

    private normalizeCityName(city: string): string {
        const val = String(city || '').trim();
        if (!val) return 'esta localidad';
        return val
            .split(/\s+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }

    private normalizeNicheName(niche: string): string {
        return String(niche || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private isGenericOrUnknownNiche(niche: string): boolean {
        const normalized = this.normalizeNicheName(niche);
        if (!normalized) return true;
        return /^(servicios? locales?|servicios? profesionales?|servicios? generales?|profesionales?|especialistas?|empresa local|negocio local|soluciones locales?|multi ?servicio|multiservicio[s]?|home services?)$/.test(normalized);
    }

    private shouldBypassLlmForSection(input: WriterInput, writerBrief: string, semanticSeed: any): boolean {
        const forceAll = String(vault.WRITER_FORCE_DETERMINISTIC || '').toLowerCase() === 'true';
        const disableOnMissingPlaybook = String(vault.WRITER_DISABLE_LLM_ON_MISSING_PLAYBOOK || 'true').toLowerCase() !== 'false';
        const genericNiche = this.isGenericOrUnknownNiche(input.niche);
        const missingPlaybook = !writerBrief || !semanticSeed;

        if (forceAll) return true;
        
        // FORZAR SIEMPRE IA PARA CONTENIDO PREMIUM (ELIMINAR FASTPATH POR DEFECTO)
        return false;
    }

    private getWriterTimeouts() {
        // En hardware limitado, damos 120s para asegurar calidad
        const primary = Number(vault.WRITER_TIMEOUT_MS || 120000);
        const retry = Number(vault.WRITER_RETRY_TIMEOUT_MS || 60000);
        return {
            primary: Number.isFinite(primary) && primary > 0 ? primary : 120000,
            retry: Number.isFinite(retry) && retry > 0 ? retry : 60000
        };
    }

    private finalizeWriterHtml(semantic: SectionSemanticData, input: WriterInput): { html: string; wordCount: number } {
        const realPhone = input.local_nap.phone;
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

        const finalHtml = html.replace(phonePattern, (match: string) => {
            const compactMatch = match.replace(/\D/g, '');
            const compactReal = realPhone.replace(/\D/g, '');
            if (compactMatch.slice(-9) !== compactReal.slice(-9)) {
                return realPhone;
            }
            return match;
        });

        return {
            html: finalHtml,
            wordCount: finalHtml.split(/\s+/).filter(Boolean).length
        };
    }

    
private buildFaqAnswer(question: string, input: WriterInput, variant: number): string {
        const city = this.normalizeCityName(input.city);
        const niche = input.niche.toLowerCase();
        const q = this.normalizeNicheName(question);
        const localAreas = this.getAllowedLocalAreas(input, 2);
        const areaHint = localAreas.length ? `, también en zonas como ${localAreas.join(' y ')}` : '';

        if (/madera|material/.test(q)) {
            return `Depende del uso, de la humedad ambiental y del acabado buscado. En ${city}, lo razonable es comparar melamina de alta densidad, DM lacado y madera maciza según resistencia, mantenimiento y presupuesto${areaHint}.`;
        }

        if (/tiempo|cuanto tarda|cuánto tarda|plazo|entrega/.test(q)) {
            return `El plazo cambia por la complejidad del diseño, las mediciones reales en obra, el acabado elegido y la carga de taller. En ${city}, lo prudente es dar un rango tras visita técnica, no una fecha cerrada sin revisar el caso.`;
        }

        if (/humedad|sol|danad|dañad|reparar|restaurar|sustituir/.test(q)) {
            return `Muchas piezas se pueden recuperar con lijado, ajuste, refuerzo o barnizado, pero otras conviene sustituirlas si la estructura ya no está estable. En ${city}, la decisión depende del estado real de la madera, de los herrajes y del uso diario del mueble o cerramiento.`;
        }

        if (/garantia|garantía/.test(q)) {
            return `Lo importante es que la garantía quede por escrito y que se detalle qué cubre la fabricación, el montaje y los ajustes posteriores. En ${city}, una propuesta seria también deja claro qué depende del material elegido y qué debe verificarse en obra antes de cerrar el presupuesto.`;
        }

        if (/presupuesto|cuanto|cuánto|precio|coste|tarifa/.test(q)) {
            return `El presupuesto cambia por medidas reales, material base, complejidad del diseño, acabados y calidad de herrajes. En ${city}, comparar propuestas tiene más sentido cuando te desglosan fabricación, instalación y remates que cuando te dan una cifra universal por teléfono.`;
        }

        if (/cobertura|zona|barrios|tambien atendeis|también atendéis/.test(q)) {
            return `Sí, siempre que la agenda y el tipo de trabajo encajen con la logística real. En ${city}, lo habitual es confirmar desplazamiento, medición previa y si el caso requiere taller, montaje en obra o ambas cosas${areaHint}.`;
        }

        const genericAnswers = [
            `En ${city}, este tipo de ${niche} se valora mejor cuando te explican el proceso, los materiales y lo que realmente condiciona el resultado final.`,
            `La mejor decisión suele salir de una visita técnica o de una revisión previa de medidas, uso previsto y estado actual de la instalación en ${city}.`,
            `Para ${niche} en ${city}, conviene priorizar criterio técnico, materiales adecuados y una propuesta clara por escrito antes que promesas absolutas.`
        ];

        return genericAnswers[variant % genericAnswers.length];
    }

    private buildDeterministicSectionResult(input: WriterInput, semanticSeed?: SectionSemanticData | null, reason = 'fastpath'): AgentResponse<WriterResult> {
        let semantic = this.buildEmergencySemanticFallback(input, semanticSeed);
        semantic = this.sanitizeSemanticOutput(semantic, input);
        const finalized = this.finalizeWriterHtml(semantic, input);
        return {
            success: true,
            data: { semantic, html: finalized.html, wordCount: finalized.wordCount },
            thoughts: `Modo determinista activado para ${input.blockType}. Reason=${reason}. Words=${finalized.wordCount}.`
        };
    }

    private buildNeutralCoverageLine(city: string): string {
        return `Cobertura operativa en ${city} con planificación por zonas, validación previa del tipo de incidencia y una propuesta ajustada al alcance real.`;
    }


    private getAllowedLocalAreas(input: WriterInput, limit = 6): string[] {
        const city = this.normalizeCityName(input.city);
        const seen = new Set<string>();
        const out: string[] = [];

        for (const value of input.allowedLocalEntities || []) {
            const cleaned = String(value || '').replace(/^.*?\ben\s+/i, '').replace(/\s+/g, ' ').trim();
            const key = cleaned.toLowerCase();
            if (!cleaned || cleaned === city || seen.has(key)) continue;
            seen.add(key);
            out.push(cleaned);
            if (out.length >= limit) break;
        }

        return out;
    }

    private getInternalLinkHints(input: WriterInput, limit = 3): string[] {
        const raw = input.sectionBrief?.internalLinksToMention || [];
        const seen = new Set<string>();
        const out: string[] = [];
        for (const value of raw) {
            const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
            const key = cleaned.toLowerCase();
            if (!cleaned || seen.has(key)) continue;
            seen.add(key);
            out.push(cleaned);
            if (out.length >= limit) break;
        }
        return out;
    }

    private looksLikeSemanticPlaceholder(text: string): boolean {
        const value = String(text || '').replace(/\s+/g, ' ').trim();
        if (!value) return true;
        return /^(explicaci[oó]n clara del criterio|la respuesta depende del punto exacto|en [a-záéíóúñ\s]+, cuando hablamos de |para abordar |al organizar la intervenci[oó]n|recomienda\b|habla de\b|define\b|aclara\b|la seguridad en tu hogar|nuestro equipo est[aá] preparado|getafe, un pueblo tranquilo|cerrajeros expertos como nosotros|la confianza en los servicios de cerrajer[ií]a)/i.test(value);
    }

    private hashString(value: string): number {
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            hash = ((hash << 5) - hash) + value.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    private pickDeterministicVariant(options: string[], seed: string, fallback = ''): string {
        const pool = Array.isArray(options) ? options.filter(Boolean) : [];
        if (!pool.length) return fallback;
        const index = this.hashString(seed) % pool.length;
        return pool[index] || fallback || pool[0];
    }

    private getPlaybook(input: WriterInput): any {
        return input.contextual_data?.nichePlaybook?.playbook || input.contextual_data?.playbook || null;
    }

    private getTopicSignalTerms(input: WriterInput): string[] {
        const playbook = this.getPlaybook(input);
        const values = [
            input.niche,
            input.intentModel?.primaryKeyword,
            ...(Array.isArray(input.subsections_h3) ? input.subsections_h3 : []),
            ...(Array.isArray(playbook?.aliases) ? playbook.aliases : []),
            ...(Array.isArray(playbook?.allowedVocabulary) ? playbook.allowedVocabulary : []),
            ...(Array.isArray(playbook?.coreServices) ? playbook.coreServices : [])
        ];

        const normalized = values
            .map((value: any) => this.normalizeNicheName(String(value || '')))
            .filter((value: string) => value.length >= 4);

        return Array.from(new Set(normalized));
    }

    private containsTopicSignal(text: string, input: WriterInput): boolean {
        const normalizedText = this.normalizeNicheName(text);
        if (!normalizedText) return false;

        return this.getTopicSignalTerms(input).some((term) => normalizedText.includes(term));
    }

    private detectWriterFamily(niche: string): string {
        const normalized = this.normalizeNicheName(niche);
        if (/carpint|ebanist|madera|armario|vestidor|tarima/.test(normalized)) return 'carpinteros';
        if (/cerraj|cerradur|bombin|cilindr|llave|persiana|blindad/.test(normalized)) return 'cerrajeros';
        if (/fontan|tuber|grifo|fuga|desatas/.test(normalized)) return 'fontaneros';
        if (/electric|enchufe|cableado|cuadro/.test(normalized)) return 'electricistas';
        return 'generic';
    }

    private buildLocalSeoAddition(input: WriterInput, mode: 'body' | 'faq' | 'intro', salt = ''): string {
        const city = this.normalizeCityName(input.city);
        const niche = String(input.niche || '').trim().toLowerCase();
        const playbook = this.getPlaybook(input);
        const decisionLabels = (Array.isArray(playbook?.decisionCriteria) ? playbook.decisionCriteria : [])
            .map((item: any) => String(item?.label || '').trim().toLowerCase())
            .filter(Boolean);
        const trustLabels = (Array.isArray(playbook?.validTrustSignals) ? playbook.validTrustSignals : [])
            .map((item: any) => String(item?.label || '').trim())
            .filter(Boolean);
        const localAreas = this.getAllowedLocalAreas(input, 2);
        const blockType = String(input.blockType || 'generic');
        const family = this.detectWriterFamily(niche);
        const areaHint = localAreas.length ? ` en zonas como ${localAreas.join(' y ')}` : '';
        const safeDecisionPair = decisionLabels.slice(0, 2).join(' y ');
        const safeTrustPair = trustLabels.slice(0, 2).join(' y ');

        const familyPools: Record<string, Partial<Record<string, Partial<Record<'body' | 'faq' | 'intro', string[]>>>>> = {
            carpinteros: {
                services_grid: {
                    body: [
                        `En ${city}, esta parte del trabajo se valora mejor cuando se explican medidas reales, materiales, herrajes y ajustes finales${areaHint}.`,
                        `En ${city}, conviene diferenciar entre fabricar a medida, adaptar una pieza existente o restaurar solo la parte dañada antes de presupuestar.`
                    ]
                },
                process_steps: {
                    intro: [`En ${city}, un proceso serio de carpintería empieza por medición en obra y definición de materiales antes de fabricar o montar.`],
                    body: [
                        `En ${city}, ordenar el trabajo en medición, preparación de piezas, montaje y comprobación final evita rehacer cortes, remates y ajustes.`,
                        `En ${city}, revisar holguras, herrajes y nivelación al terminar evita que un mueble o una puerta quede bien solo el primer día.`
                    ]
                },
                local_proof: {
                    intro: [
                        `En ${city}, la cobertura útil no depende de frases genéricas, sino de cómo se coordinan visita, medición, fabricación y montaje${areaHint}.`
                    ],
                    body: [
                        `En ${city}, hablar de cobertura real implica explicar cuándo hace falta visita previa, cuándo basta con validación inicial y cómo se organiza el montaje según el tipo de proyecto.`
                    ]
                },
                price_guidance: {
                    intro: [`En ${city}, una guía de presupuesto útil no da cifras universales: aclara qué cambian las medidas, el material, el acabado y los herrajes.`],
                    body: [
                        `En ${city}, comparar propuestas tiene más sentido cuando separan fabricación, instalación, remates y posibles ajustes en obra.`
                    ]
                },
                local_proof: {
                    intro: [
                        `En ${city}, nuestra logística operativa nos permite cubrir con solvencia tanto el centro como los barrios periféricos, asegurando que cada aviso cuente con técnicos que conocen bien la zona.`,
                        `La asistencia en ${city} se organiza siguiendo protocolos de proximidad; esto nos permite optimizar desplazamientos y ofrecer una respuesta técnica coherente con las necesidades del municipio.`
                    ]
                },
                faq: [
                    `En ${city}, la solución técnica ideal siempre se valida tras una inspección directa, priorizando la durabilidad y el uso de materiales que cumplan con los estándares de calidad del sector.`,
                    `Resolver cualquier duda en ${city} antes de empezar es parte de nuestro compromiso; entender los factores que influyen en el resultado ayuda a tomar decisiones más inteligentes.`
                ]
            },
            home_local: {
                local_proof: {
                    intro: [
                        `Nuestra presencia técnica en ${city} está consolidada mediante una red de especialistas locales preparados para intervenir con materiales específicos y herramientas de última generación.`,
                        `Entendemos que un servicio de proximidad en ${city} exige no solo rapidez, sino un conocimiento profundo de la tipología de viviendas y locales de la zona para ofrecer soluciones reales.`
                    ]
                },
                trust_band: {
                    body: [
                        `La confianza en ${city} no se promete, se demuestra mediante procesos transparentes, garantías firmadas y un seguimiento técnico que asegura la satisfacción tras cada servicio.`,
                        `En ${city}, cada intervención se documenta y se garantiza, protegiendo al cliente mediante el uso exclusivo de componentes certificados y mano de obra cualificada.`
                    ]
                },
                cta_panel: {
                    intro: [`Para recibir una orientación técnica honesta sobre su caso en ${city}, el primer paso es contactar para coordinar una valoración sin compromiso ajustada a sus necesidades.`]
                }
            },
            generic: {
                local_proof: {
                    intro: [`La cobertura técnica en ${city} se define por la cercanía operativa y la capacidad de movilización de recursos especializados hacia cualquier punto de la localidad o zonas limítrofes.`]
                },
                trust_band: {
                    body: [`Consolidamos nuestra autoridad en ${city} mediante la aplicación estricta de normativas técnicas y el uso de señales de confianza verificables en cada proyecto.`]
                }
            }
        };

                const blockPool = familyPools[family]?.[blockType]?.[mode] || familyPools.generic?.[blockType]?.[mode] || [];
        return this.pickDeterministicVariant(
            blockPool,
            `${input.section_id || input.section_h2}|${blockType}|${mode}|${salt}|${safeDecisionPair}|${safeTrustPair}`,
            ''
        ).replace(/\s+/g, ' ').trim();
    }

    private ensureLocalSeoContext(text: string, input: WriterInput, mode: 'body' | 'faq' | 'intro' | 'bullet' = 'body', salt = ''): string {
        const city = this.normalizeCityName(input.city);
        const niche = String(input.niche || '').trim().toLowerCase();
        let out = String(text || '').replace(/\s+/g, ' ').trim();
        if (!out) return out;

        const hasCity = new RegExp(`\\b${this.escapeRegex(city)}\\b`, 'i').test(out);
        const hasNiche = niche ? new RegExp(`\\b${this.escapeRegex(niche)}\\b`, 'i').test(out) : false;
        const hasTopicSignal = hasNiche || this.containsTopicSignal(out, input);

        if (mode === 'bullet') {
            if (!hasCity && out.length <= 36) {
                return `${out} · ${city}`.replace(/\s+/g, ' ').trim();
            }
            return out;
        }

        const shouldInject = mode === 'intro'
            ? !hasCity
            : (!hasCity && !hasTopicSignal);

        if (!shouldInject) {
            return out;
        }

        const addition = this.buildLocalSeoAddition(input, mode, salt);
        if (addition && !out.toLowerCase().includes(addition.toLowerCase())) {
            out = `${out} ${addition}`.replace(/\s+/g, ' ').trim();
        }

        return out;
    }

    private escapeRegex(value: string): string {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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


    private looksLikeGuidanceInstruction(text: string): boolean {
        const value = String(text || '').trim();
        if (!value) return false;
        return /^(explica|describe|diferencia|aclara|prioriza|resume|indica|detalla|recomienda|habla|define|orienta)\b/i.test(value);
    }


private dedupeLocalLabel(text: string, city: string): string {
    const safeCity = this.normalizeCityName(city);
    const escapedCity = this.escapeRegex(safeCity);
    return String(text || '')
        .replace(new RegExp(`\ben\s+${escapedCity}\s+en\s+${escapedCity}\b`, 'gi'), `en ${safeCity}`)
        .replace(new RegExp(`\b${escapedCity}\s+en\s+${escapedCity}\b`, 'gi'), safeCity)
        .replace(new RegExp(`\b${escapedCity}\s+${escapedCity}\b`, 'gi'), safeCity)
        .replace(/\s{2,}/g, ' ')
        .trim();
}

    private sanitizeBulletLabel(text: string, input: WriterInput, trust = false): string {
        const city = this.normalizeCityName(input.city);
        let out = this.sanitizeSentence(String(text || ''), city, input.niche)
            .replace(/\s*·\s*[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/g, '')
            .replace(new RegExp(`\\b${this.escapeRegex(input.niche)}\\s+en\\s+${this.escapeRegex(city)}\\b`, 'gi'), '')
            .replace(new RegExp(`\\b${this.escapeRegex(city)}\\s+${this.escapeRegex(input.niche)}\\b`, 'gi'), city)
            .replace(/\bplanificamos\s+each\s+intervenci[oó]n\b/gi, 'planificamos cada intervención')
            .replace(/\s{2,}/g, ' ')
            .replace(/[.;:,]+$/g, '')
            .trim();

        if (!out) return out;

        if (/^cobertura local$/i.test(out)) return `Cobertura real en ${city}`;
        if (/^cobertura real$/i.test(out)) return `Cobertura real en ${city}`;
        if (/^atencion directa$/i.test(out)) return 'Atención directa';
        if (/^prioridad clara$/i.test(out)) return 'Prioridad operativa clara';
        if (/^intervencion ordenada$/i.test(out)) return 'Intervención ordenada';
        if (/^seguimiento claro$/i.test(out)) return 'Seguimiento claro';
        if (/^planificacion por zonas$/i.test(out)) return 'Planificación por zonas';
        if (/^presupuesto previo$/i.test(out)) return 'Presupuesto previo';
        if (/^proceso explicado$/i.test(out)) return 'Proceso explicado';

        if (trust && out.length <= 20 && !new RegExp(`\\b${this.escapeRegex(city)}\\b`, 'i').test(out) && /cobertura|zona|desplazamiento/i.test(out)) {
            return `${out} en ${city}`;
        }

        return out;
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
            .replace(/\bcomo los profesionales? de toda la vida\b/gi, 'con un criterio profesional claro')
            .replace(/\bcomo referentes locales\b/gi, 'con atención local')
            .replace(/\bespecialistas de toda la vida\b/gi, 'profesionales del oficio')
            .replace(/\bconocemos cada rinc[oó]n(?: de [a-záéíóúñ\s]+)?\b/gi, 'trabajamos con coordinación local')
            .replace(/\bnuestro equipo se ha familiarizado con cada rinc[oó]n del barrio\b/gi, 'planificamos cada intervención según el contexto real')
            .replace(/\bantes,\s*cuando[^.?!]*[.?!]?/gi, '')
            .replace(/\bcomo profesionales? de toda la vida\b/gi, 'con un criterio profesional claro')
            .replace(/\bconocer? los secretos? de [a-záéíóúñ\s]+\b/gi, 'trabajar con un criterio técnico adaptado al contexto')
            .replace(/\bno dudes? en [a-záéíóúñ\s]+\b/gi, 'puedes consultarlo antes de intervenir')
            .replace(/\bpuedes confiar en que te ayudaremos\b/gi, 'te explicamos cómo abordar el caso')
            .replace(/\bsoluciones? temporales? ni ef[ií]meras?\b/gi, 'arreglos improvisados')
            .replace(/\bseguridad certificada\b/gi, '')
            .replace(/\bcompromiso profesional directo\b/gi, '')
            .replace(/\buso de sistemas avanzados\b/gi, '')
            .replace(/\bcalidad verificada\b/gi, '')
            .replace(/\bcon total garant[ií]a t[eé]cnica\b/gi, '')
            .replace(/\band profesionalidad\b/gi, 'y profesionalidad')
            .replace(/\bla un\b/gi, 'un')
            .replace(/\bcostee-efectiva\b/gi, 'rentable')
            .replace(/\bde de\b/gi, 'de')
            .replace(/\bpreguntas?\s+frecces\b/gi, 'Preguntas frecuentes')
            .replace(/\bcu[aá]nd[ae]\b/gi, 'cuándo')
            .replace(/\bde el\b/gi, 'del')
            .replace(/la respuesta a la pregunta ['"“”]?([^'"“”]+)['"“”]?/gi, '$1.')
            .replace(/\bde incluye\b/gi, 'incluye')
            .replace(/\bde la de\b/gi, 'de la')
            .replace(/\bde,\b/gi, ',')
            .replace(/\bmadrid\b/gi, normalizedCity.toLowerCase() === 'madrid' ? 'Madrid' : normalizedCity)
            .replace(/\bbarcelona\b/gi, normalizedCity.toLowerCase() === 'barcelona' ? 'Barcelona' : normalizedCity)
            .replace(/\bsevilla\b/gi, normalizedCity.toLowerCase() === 'sevilla' ? 'Sevilla' : normalizedCity)
            .replace(/\bvalencia\b/gi, normalizedCity.toLowerCase() === 'valencia' ? 'Valencia' : normalizedCity)
            .replace(/\bzaragoza\b/gi, normalizedCity.toLowerCase() === 'zaragoza' ? 'Zaragoza' : normalizedCity)
            .replace(/\bmalaga\b/gi, normalizedCity.toLowerCase() === 'malaga' ? 'Malaga' : normalizedCity)
            .replace(/\bm[áà]laga\b/gi, normalizedCity.toLowerCase() === 'malaga' ? 'Málaga' : normalizedCity)
            .replace(/\bgranada\b/gi, normalizedCity.toLowerCase() === 'granada' ? 'Granada' : normalizedCity)
            .replace(/\balicante\b/gi, normalizedCity.toLowerCase() === 'alicante' ? 'Alicante' : normalizedCity)
            .replace(/\bmurcia\b/gi, normalizedCity.toLowerCase() === 'murcia' ? 'Murcia' : normalizedCity)
            // Bunker Sanitization: Eliminar fugas de planning y fragmentos rotos remanentes
            // Gravity Heuristic Repair: Arreglar de raíz preposiciones huérfanas y huecos de contexto
            .replace(/\b(en|de|con|para)\s*([,.;:!?¡¿])/gi, (match, prep, punct) => {
                return `${prep} ${normalizedCity}${punct}`;
            })
            // Reparar casos de 'en' al final de fragmentos o listas sin ciudad
            .replace(/\b(en|de|con|para)\s*$/i, (match, prep) => `${prep} ${normalizedCity}`)
            .replace(/\b(en|de|con|para)\s*\.\.\./g, (match, prep) => `${prep} ${normalizedCity}...`)
            .replace(/\ben\s+es\s+crucial/gi, `en ${normalizedCity} es crucial`)
            .replace(/\ben\s+conviene/gi, `en ${normalizedCity} conviene`)
            .replace(/\bclientes\s+en\s*\./gi, `clientes en ${normalizedCity}.`)
            .replace(/\bcobertura\s+en\s*[,.;:]/gi, `cobertura en ${normalizedCity}.`)
            .replace(/^[ ,.;:!?¡¿\s]+/, '') // No empezar con basura
            .replace(/\s{2,}/g, ' ')
            .replace(/\s,\s/g, ', ')
            .trim()
            .replace(new RegExp(`\\b${this.escapeRegex(city)}\\b`, 'gi'), normalizedCity);
    }

    private isGenericItemTitle(title?: string): boolean {
        const value = (title || '').trim().toLowerCase();
        if (!value) return true;
        // Block more generic patterns (User Fix)
        return /^(intervenci[oó]n t[eé]cnica especializada(?: [a-z0-9]+)?|servicio\s+\d+|servicio\s+[abc]|bloque\s+\d+|elemento\s+\d+|punto\s+\d+|soluci[oó]n\s+\d+|servicio de [a-záéíóúñ]+ en [a-záéíóúñ\s]+|intervenci[oó]n profesional en [a-záéíóúñ\s]+|calidad t[eé]cnica en [a-záéíóúñ\s]+|procesos? de [a-záéíóúñ\s]+|metodolog[ií]a aplicada|explicaci[oó]n t[eé]cnica|compromiso local|profesionales cualificados|soluciones de calidad|nuestros servicios)$/i.test(value);
    }

    private buildFallbackBodyFromTitle(title: string, input: WriterInput): string {
        const city = this.normalizeCityName(input.city);
        const niche = input.niche.toLowerCase();
        const normalizedTitle = this.dedupeLocalLabel(String(title || '').trim(), input.city);
        const localAreas = this.getAllowedLocalAreas(input, 2);
        const areaA = localAreas[0] || city;
        const areaB = localAreas[1] || areaA;
        const linkHint = this.getInternalLinkHints(input, 1)[0];

        const templates = [
            `En ${city}, ${normalizedTitle.toLowerCase()} se resuelve mejor cuando primero se comprueban el estado real, las medidas útiles y las piezas o materiales que de verdad condicionan el trabajo.`,
            `Cuando este trabajo afecta a zonas como ${areaA}${areaB && areaB !== areaA ? ` y ${areaB}` : ''}, conviene ordenar desplazamiento, materiales y verificación final para que la actuación de ${niche} no quede a medias.`,
            `Antes de cerrar ${normalizedTitle.toLowerCase()}, revisamos si compensa ajustar, sustituir o rehacer solo la parte necesaria para que la solución no dependa de un arreglo provisional.`,
            linkHint
                ? `Si el caso se parece a ${linkHint.toLowerCase()}, puede ser útil valorar esa línea de trabajo dentro del cluster antes de elegir una intervención más amplia.`
                : `La clave está en dejar claro qué se hará, qué se valida al terminar y qué seguimiento conviene si el estado previo del punto tratado pide una segunda revisión.`
        ];

        return this.pickDeterministicVariant(templates, `${normalizedTitle}|${areaA}|${areaB}|${linkHint || ''}|${city}`);
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

    private toStringArray(value: unknown): string[] {
        if (Array.isArray(value)) {
            return value
                .flatMap((entry: any) => {
                    if (entry == null) return [];
                    if (typeof entry === 'string') return [entry];
                    if (typeof entry === 'number' || typeof entry === 'boolean') return [String(entry)];
                    if (typeof entry === 'object') {
                        if (typeof entry.text === 'string') return [entry.text];
                        if (typeof entry.body === 'string') return [entry.body];
                        if (typeof entry.title === 'string') return [entry.title];
                        if (typeof entry.question === 'string') return [entry.question];
                        if (typeof entry.answer === 'string') return [entry.answer];
                    }
                    return [];
                })
                .map((item) => String(item || '').trim())
                .filter(Boolean);
        }

        if (typeof value === 'string') {
            return value
                .split(/\n+/)
                .map((item) => item.trim())
                .filter(Boolean);
        }

        if (value && typeof value === 'object') {
            const anyValue = value as any;
            if (typeof anyValue.text === 'string') return [anyValue.text.trim()].filter(Boolean);
            if (typeof anyValue.body === 'string') return [anyValue.body.trim()].filter(Boolean);
            if (typeof anyValue.title === 'string') return [anyValue.title.trim()].filter(Boolean);
        }

        return [];
    }

    private toDecisionFactorArray(value: any): Array<{ title: string; body: string }> {
        if (Array.isArray(value)) {
            return value.map((item: any) => ({
                title: typeof item?.title === 'string' ? item.title : (typeof item?.label === 'string' ? item.label : ''),
                body: typeof item?.body === 'string' ? item.body : (typeof item?.text === 'string' ? item.text : ''),
            })).filter((item) => item.title || item.body);
        }
        if (value && typeof value === 'object') {
            const entries = Object.entries(value as Record<string, any>).map(([key, body]) => ({
                title: String(key || '').trim(),
                body: typeof body === 'string' ? body : (typeof (body as any)?.body === 'string' ? (body as any).body : ''),
            }));
            return entries.filter((item) => item.title || item.body);
        }
        return [];
    }

    private normalizeSemanticShape(semantic: SectionSemanticData, input: WriterInput): SectionSemanticData {
        const normalized: SectionSemanticData = { ...(semantic || {}) };

        normalized.intro = this.toStringArray(normalized.intro);
        normalized.bullets = this.toStringArray(normalized.bullets);
        normalized.trustBullets = this.toStringArray(normalized.trustBullets);
        normalized.commonMistakes = this.toStringArray(normalized.commonMistakes);

        const rawItems = Array.isArray(normalized.items) ? normalized.items : [];
        normalized.items = rawItems.map((item: any) => ({
            title: typeof item?.title === 'string'
                ? item.title
                : (typeof item?.heading === 'string' ? item.heading : ''),
            body: typeof item?.body === 'string'
                ? item.body
                : (typeof item?.text === 'string' ? item.text : ''),
            meta: this.toStringArray(item?.meta).slice(0, 3)
        })).filter((item) => item.title || item.body);

        const rawFaq = Array.isArray(normalized.faqItems) ? normalized.faqItems : [];
        normalized.faqItems = rawFaq.map((item: any) => ({
            question: typeof item?.question === 'string'
                ? item.question
                : (typeof item?.title === 'string' ? item.title : ''),
            answer: typeof item?.answer === 'string'
                ? item.answer
                : (typeof item?.body === 'string' ? item.body : '')
        })).filter((item) => item.question || item.answer);

        const rawFactors = this.toDecisionFactorArray(normalized.decisionFactors);
        normalized.decisionFactors = rawFactors.map((df: any) => ({
            title: typeof df?.title === 'string' ? df.title : '',
            body: typeof df?.body === 'string' ? df.body : ''
        })).filter(df => df.title && df.body);

        if (normalized.cta && typeof normalized.cta === 'object') {
            normalized.cta = {
                text: this.normalizeCtaText(normalized.cta.text, input.local_nap.phone),
                phone: input.local_nap.phone,
                note: typeof normalized.cta.note === 'string' ? normalized.cta.note : ''
            };
        }

        return normalized;
    }

    private sanitizeSemanticOutput(semantic: SectionSemanticData, input: WriterInput): SectionSemanticData {
        const city = this.normalizeCityName(input.city);
        const niche = input.niche;
        const normalized = this.normalizeSemanticShape(semantic, input);

        if (normalized.intro) {
            normalized.intro = normalized.intro
                .map((text, i) => {
                    const cleaned = this.ensureLocalSeoContext(this.sanitizeSentence(text, city, niche), input, 'intro', `intro_${i}`);
                    return (this.looksLikeSemanticPlaceholder(cleaned) || this.looksLikeGuidanceInstruction(cleaned))
                        ? this.buildLocalSeoAddition(input, 'intro', `intro_${i}`)
                        : cleaned;
                })
                .filter(text => text && !this.looksLikeGuidanceInstruction(text));
        }

        if (normalized.items) {
            normalized.items = normalized.items.map((item, i) => {
                const title = this.isGenericItemTitle(item.title)
                    ? this.getRandomNicheTitle(niche, city)
                    : this.sanitizeSentence(item.title, city, niche);

                const candidateBody = this.ensureLocalSeoContext(this.sanitizeSentence(item.body, city, niche), input, 'body', `item_${i}`);
                const body = (this.looksLikeSemanticPlaceholder(item.body) || this.looksLikeGuidanceInstruction(item.body) || this.looksLikeSemanticPlaceholder(candidateBody))
                    ? this.buildFallbackBodyFromTitle(title, input)
                    : candidateBody;

                return {
                    title,
                    body,
                    meta: (item.meta || []).map((m: string) => this.sanitizeSentence(m, city, niche)).slice(0, 3)
                };
            }).filter(item => item.title && item.body);
        }

        if (normalized.faqItems) {
            normalized.faqItems = normalized.faqItems.map((item, i) => ({
                question: this.sanitizeSentence(item.question, city, niche),
                answer: (() => {
                    const candidateAnswer = this.ensureLocalSeoContext(this.sanitizeSentence(item.answer, city, niche), input, 'faq', `faq_${i}`);
                    return (this.looksLikeSemanticPlaceholder(item.answer) || this.looksLikeGuidanceInstruction(item.answer) || this.looksLikeSemanticPlaceholder(candidateAnswer))
                        ? this.buildFaqAnswer(item.question, input, i)
                        : candidateAnswer;
                })()
            })).filter(item => item.question && item.answer);
        }

        if (normalized.bullets) {
            normalized.bullets = normalized.bullets
                .map((b) => this.sanitizeBulletLabel(b, input))
                .filter(b => b.length > 3 && !this.looksLikeGuidanceInstruction(b));
        }

        if (normalized.trustBullets) {
            normalized.trustBullets = normalized.trustBullets
                .map((b) => this.sanitizeBulletLabel(b, input, true))
                .filter(b => b.length > 3 && !this.looksLikeGuidanceInstruction(b));
        }

        if (normalized.commonMistakes) {
            normalized.commonMistakes = normalized.commonMistakes
                .map((m) => this.sanitizeSentence(m, city, niche))
                .filter(m => m.length > 3 && !this.looksLikeGuidanceInstruction(m));
        }

        const safeDecisionFactors = this.toDecisionFactorArray(normalized.decisionFactors);
        if (safeDecisionFactors.length) {
            normalized.decisionFactors = safeDecisionFactors.map((df, i) => {
                const safeTitle = this.sanitizeSentence(df.title, city, niche);
                const candidateBody = this.ensureLocalSeoContext(this.sanitizeSentence(df.body, city, niche), input, 'body', `df_${i}`);
                return {
                    title: safeTitle,
                    body: (!candidateBody || this.looksLikeSemanticPlaceholder(candidateBody) || this.looksLikeGuidanceInstruction(candidateBody))
                        ? this.buildFallbackBodyFromTitle(safeTitle || 'Criterio técnico', input)
                        : candidateBody
                };
            }).filter(df => df.title && df.body);
        } else {
            normalized.decisionFactors = [];
        }

        return normalized;
    }

    private buildEmergencySemanticFallback(input: WriterInput, seed?: SectionSemanticData | null): SectionSemanticData {
        const city = this.normalizeCityName(input.city);
        const niche = input.niche;
        const h3s = Array.isArray(input.subsections_h3) ? input.subsections_h3 : [];

        const base: SectionSemanticData = {
            sectionId: input.section_id,
            h2: this.dedupeLocalLabel(input.section_h2, input.city),
            intro: seed?.intro || [`En ${city}, el servicio de ${niche.toLowerCase()} necesita un enfoque técnico proporcionado al estado real del trabajo, del material y del montaje.`],
            items: seed?.items || h3s.map(h3 => ({
                title: h3,
                body: this.buildFallbackBodyFromTitle(h3, input)
            })),
            bullets: seed?.bullets || [],
            faqItems: seed?.faqItems || [],
            cta: {
                text: 'Consultar presupuesto sin compromiso',
                phone: input.local_nap.phone
            }
        };

        if (input.blockType === 'faq' && !base.faqItems?.length) {
            base.faqItems = h3s.map((q, i) => ({
                question: q,
                answer: this.buildFaqAnswer(q, input, i)
            }));
        }

        return base;
    }

    private isLocksmithLikeNiche(niche: string): boolean {
        const term = String(niche || '').toLowerCase();
        return /cerraj|caja fuerte|bombin|cerradur|persiana|puerta|blindad|cerrojo|ganzu|antibumping/i.test(term);
    }

    private looksLikeTraceArtifact(text: string): boolean {
        return /\[DEBUG\]|\[TRACE\]|\[LOG\]|AI Response:|Writing Phase:|Block Index:/.test(text);
    }

    private stripTraceArtifacts(text: string): string {
        return text
            .split('\n')
            .filter(line => !this.looksLikeTraceArtifact(line))
            .join(' ')
            .trim();
    }

    private sanitizeModelOutput(text: string): string {
        return text
            .replace(/```json|```/g, '')
            .replace(/(\r\n|\n|\r)/gm, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    private buildSystemPrompt(input: WriterInput, knowledgePack: string): string {
        const niche = input.niche;
        const city = this.normalizeCityName(input.city);
        const cityLower = city.toLowerCase();
        const nicheLower = niche.toLowerCase();
        const techBrief = this.truncate(this.technicalBrief, 400);
        const nicheBrief = this.truncate(this.nicheBrief, 800);
        const knowledge = this.truncate(knowledgePack, 2000);
        const entities = (input.entities || []).slice(0, 10).join(', ');
        const areas = this.getAllowedLocalAreas(input, 4).join(', ');
        const linkHints = this.getInternalLinkHints(input, 3).join(', ');
        const governanceRules = getRulesByCategory('Writer').map((r, i) => `${i + 1}. ${r}`).join('\n');

        return `
Eres un redactor experto en SEO local para el mercado español. Tu misión es generar el contenido semántico para una sección específica de una página de servicios.

NICHO: ${niche}
CIUDAD: ${city}
H2 SECCIÓN: ${this.dedupeLocalLabel(input.section_h2, city)}
H3 SUBSECCIONES: ${input.subsections_h3.join(', ')}
KEYWORDS/ENTIDADES: ${entities}
ÁREAS LOCALES: ${areas}
ENLACES INTERNOS (Anchors sugeridos): ${linkHints}

REGLAS DE ORO (OBLIGATORIAS):
${governanceRules}
2. **ESPECIFICIDAD TÉCNICA REAL**: Habla del oficio correcto para el nicho actual. Usa materiales, procesos, piezas y criterios compatibles con ${input.niche}, nunca con otros gremios.
3. **TONO DE AUTORIDAD**: Escribe como un profesional veterano del nicho actual que explica la realidad técnica del trabajo a un cliente, sin adornos publicitarios.
4. **LOCALIDAD NATURAL**: Menciona barrios o zonas de ${city} (ej: ${areas}) integrándolos en logística real de visita, medición, desplazamiento y montaje; evita ejemplos fijos de otros oficios.
5. **SIN PLACEHOLDERS**: No escribas "Factor 1", "Criterio 1", "Placeholder". Genera contenido real y completo.
6. **PREGUNTAS USUARIO**: ${input.sectionBrief?.userQuestion || '¿Cómo se resuelve mi problema de forma fiable?'}
7. **REGLA DE PROHIBICIÓN**: ${input.sectionBrief?.prohibitedClaims?.join(', ') || 'Sin tiempos record ni precios cerrados por teléfono.'}

PLAYBOOK TÉCNICO:
${techBrief}

CONOCIMIENTO NICHO:
${nicheBrief}

KNOWLEDGE PACK:
${knowledge}

PACK CERRADO DE NICHO (OBLIGATORIO):
- Usa solo terminología, piezas, procesos y ejemplos compatibles con ${niche}.
- Prohibido mezclar oficios, materiales o averías de otros nichos.
- Si una frase no encaja claramente en el playbook del nicho, no la uses.
- Ante duda, vuelve a servicios, FAQs, trust signals y criterios de decisión del playbook.

INSTRUCCIONES JSON:
Devuelve un objeto JSON con esta estructura:
{
  "intro": ["Párrafo 1 profundo", "Párrafo 2 de contexto"],
  "items": [{"title": "Subtítulo H3", "body": "Texto detallado (80-120 palabras)", "meta": ["Dato técnico 1", "Dato 2"]}],
  "bullets": ["Ventaja técnica 1", "Diferenciador 2"],
  "faqItems": [{"question": "¿...?", "answer": "Explicación clara y útil"}],
  "commonMistakes": ["Error 1", "Error 2"],
  "decisionFactors": [{"title": "Factor 1", "body": "Por qué es importante"}],
  "cta": {"text": "Llamativa y natural", "note": "Pequeña aclaración de confianza"}
}
`;
    }


    private evaluateCrossNicheRisk(input: WriterInput, semantic: SectionSemanticData, html: string) {
        return detectCrossNicheContamination({
            niche: input.niche,
            city: input.city,
            blockType: input.blockType,
            html,
            textFragments: [
                ...(semantic.intro || []),
                ...((semantic.items || []).flatMap((item) => [item.title, item.body, ...(item.meta || [])])),
                ...((semantic.faqItems || []).flatMap((item) => [item.question, item.answer])),
                ...(semantic.bullets || []),
                ...(semantic.trustBullets || []),
                ...(semantic.commonMistakes || []),
                ...((semantic.decisionFactors || []).flatMap((item) => [item.title, item.body]))
            ]
        });
    }

    async execute(input: WriterInput): Promise<AgentResponse<WriterResult>> {
        const city = this.normalizeCityName(input.city);
        this.log(`Redactando sección [${input.blockType}]: ${this.dedupeLocalLabel(input.section_h2, city)}`);

        let semanticSeed = null;
        try {
            const writerInjection = buildWriterInjection(input.niche || '');
            if (writerInjection && input.blockType) {
                semanticSeed = hydrateSemanticDraftFromPlaybook(
                    input.niche || '',
                    input.blockType,
                    input.city || ''
                );
            }
        } catch (e) {
            this.log(`Warning en pre-hidratación: ${(e as Error).message}`);
        }

        const writerBrief = String(this.nicheBrief || '');
        if (this.shouldBypassLlmForSection(input, writerBrief, semanticSeed)) {
            return this.buildDeterministicSectionResult(input, semanticSeed, 'bypass_llm');
        }

        try {
            const { primary: timeoutMs } = this.getWriterTimeouts();
            const knowledge = await this.getRelevantKnowledge(input.niche, input.city, [input.section_h2, ...input.subsections_h3]);
            const systemPrompt = this.buildSystemPrompt(input, knowledge);

            const startTime = Date.now();
            const response = await this.callModel(systemPrompt, this.model, {
                temperature: 0.3,
                numPredict: 2500,
                timeoutMs: timeoutMs,
                json: true
            });

            const duration = Date.now() - startTime;
            let semantic = safeJsonParse(response) as SectionSemanticData;

            if (!semantic || (!semantic.intro?.length && !semantic.items?.length)) {
                throw new Error('Invalid semantic response from LLM');
            }

            semantic = this.sanitizeSemanticOutput(semantic, input);
            const finalized = this.finalizeWriterHtml(semantic, input);
            const crossNicheReport = this.evaluateCrossNicheRisk(input, semantic, finalized.html);

            if (crossNicheReport.shouldRegenerate || crossNicheReport.severity === 'fatal') {
                await this.logThought(`[NICHE_ISOLATION] Contaminación detectada en ${input.blockType}: ${crossNicheReport.summary}. Activando fallback determinista.`);
                await this.rememberLesson({
                    title: 'Contaminación de nicho crítica revertida',
                    lesson: `Draft de ${input.blockType} rechazado. Motivos: ${(crossNicheReport.reasons || []).join(', ')}. No mezclar entidades ajenas al nicho.`,
                    severity: 'fatal',
                    lessonType: 'safety',
                    niche: input.niche,
                    city: input.city,
                });
                return this.buildDeterministicSectionResult(input, semanticSeed, `cross_niche_${crossNicheReport.severity}`);
            }

            if (crossNicheReport.severity === 'major') {
                await this.logThought(`[NICHE_ISOLATION] Riesgo major en ${input.blockType}, pero se conserva el draft al no ser contaminación fatal. ${crossNicheReport.summary}`);
            }

            return {
                success: true,
                data: { semantic, html: finalized.html, wordCount: finalized.wordCount },
                thoughts: `Sección generada con LLM (${duration}ms). Wordcount: ${finalized.wordCount}. CrossNiche=${crossNicheReport.severity}/${crossNicheReport.score}.`
            };

        } catch (error: any) {
            this.log(`Fallo en redacción LLM (${input.section_h2}): ${error.message}. Activando fallback.`);
            await this.rememberFailure({
                errorMessage: error.message,
                failureType: 'llm_fallback',
                niche: input.niche,
                city: input.city,
                lessonTitle: 'Caída a fallback determinista',
                lessonText: `Se generó timeout o error de estructura al atacar el H2: ${input.section_h2}. Se requiere mayor simplificación.`,
            });
            return this.buildDeterministicSectionResult(input, semanticSeed, 'llm_failure');
        }
    }
}

