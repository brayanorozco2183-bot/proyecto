import * as cheerio from 'cheerio';
import { runSiteOriginalityGate } from '../originality/qualityGateSiteOriginality.js';
import { dbManager } from '../db/index.js';
import { validateContentAgainstNichePlaybook } from '../niches/technicalValidation.js';
import { detectCrossNicheContamination } from '../niches/crossNicheDetector.js';
import { scorePremiumOutput } from '../quality/premiumScore.js';
import { hasFaqNumberingArtifact } from '../utils/faqSanitizer.js';
import { validateRenderedPageTechnically } from '../utils/technicalPageValidator.js';

export type QualityGateSeverity = 'critical' | 'error' | 'warning';

export interface QualityGateIssue {
    code: string;
    severity: QualityGateSeverity;
    message: string;
    penalty: number;
    evidence?: string[];
}

export interface QualityGateInput {
    html: string;
    city: string;
    niche: string;
    businessName?: string;
    phone?: string;
    mission?: any;
    pagePlan?: any;
    pageId?: string;
}

export interface QualityGateResult {
    passed: boolean;
    score: number;
    issues: QualityGateIssue[];
    summary: string;
}

const DEFAULT_MIN_SCORE = 75;
const PREMIUM_MIN_SCORE = 88;

const BLE_V24_TECHNICAL_BLOCKERS = new Set([
    'FAQ_SCHEMA_CONTENT_MISMATCH',
    'SCHEMA_JSON_INVALID',
    'SCHEMA_MISSING',
    'PLACEHOLDER_OR_BROKEN_COPY',
    'PRODUCTION_PLACEHOLDER_VISUAL',
    'MOBILE_VIEWPORT_MISSING',
    'BROKEN_INTERNAL_INDEX_LINK',
    'BROKEN_INTERNAL_LINK',
    'SYSTEM_LEAK_VISIBLE',
    'TRUNCATED_SEO_COPY',
    'SCHEMA_STREETADDRESS_IS_CITY',
    'SCHEMA_WEBPAGE_DESCRIPTION_MISMATCH',
    'BROKEN_LOCAL_FRAGMENT',
    'GENERIC_OR_BROKEN_SEO_COPY'
]);

function hasBlockingQualityIssue(issues: QualityGateIssue[]): boolean {
    return issues.some((issue) =>
        issue.severity === 'critical' ||
        BLE_V24_TECHNICAL_BLOCKERS.has(issue.code) ||
        issue.code === 'BLE_V24_BLOCKER_ESCALATION'
    );
}

function recomputeQualityGatePass(issues: QualityGateIssue[], score: number, minScore: number): boolean {
    const forcePass = process.env.QUALITY_GATE_FORCE_PASS === 'true';
    if (forcePass) return true;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    return !hasBlockingQualityIssue(issues) && errorCount === 0 && score >= minScore;
}

function qualityGateCounts(issues: QualityGateIssue[]): { criticalCount: number; errorCount: number; blockerCount: number } {
    return {
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        errorCount: issues.filter(i => i.severity === 'error').length,
        blockerCount: issues.filter(i => BLE_V24_TECHNICAL_BLOCKERS.has(i.code)).length,
    };
}

const ABSTRACT_LOCAL_HEADINGS = new Set([
    'referencias geográficas locales',
    'puntos de servicio técnico',
    'logística específica del área',
    'barrios de cobertura',
    'barrios de servicio',
    'casos habituales de la zona',
    'asistencia en todos los barrios',
    'expertos en seguridad local',
    'respuesta ante emergencias en la ciudad',
    'zona de cobertura',
    'contexto del barrio',
    'problemas comunes en la ciudad',
    'atención inmediata en la zona',
    'necesidad de climatización en la zona'
]);

const BOILERPLATE_PATTERNS: Array<{ code: string; regex: RegExp; message: string; penalty: number; severity: QualityGateSeverity }> = [
    {
        code: 'HERO_BUSCAS_FORMULA',
        regex: /¿buscas\b/i,
        message: 'El hero usa la fórmula “¿Buscas...?”, demasiado genérica para una página premium.',
        penalty: 8,
        severity: 'error'
    },
    {
        code: 'GENERIC_SOLUTIONS_FORMULA',
        regex: /ofrecemos soluciones profesionales,\s*rápidas y garantizadas/gi,
        message: 'Fórmula de subtítulo demasiado genérica (“soluciones profesionales, rápidas y garantizadas”).',
        penalty: 10,
        severity: 'error'
    },
    {
        code: 'LOCAL_PROOF_METHOD_FORMULA',
        regex: /nuestra metodología se adapta a las exigencias técnicas de/gi,
        message: 'La sección local contiene una fórmula repetitiva que suena a plantilla.',
        penalty: 14,
        severity: 'error'
    },
    {
        code: 'LOCAL_PROOF_KNOWLEDGE_FORMULA',
        regex: /gracias a nuestro conocimiento profundo de/gi,
        message: 'La sección local contiene copy repetitivo de “conocimiento profundo”.',
        penalty: 12,
        severity: 'error'
    },
    {
        code: 'EXPERIENCE_NECESSARY_FORMULA',
        regex: /contamos con la experiencia necesaria para gestionar intervenciones de/gi,
        message: 'Se repite la fórmula “Contamos con la experiencia necesaria...”.',
        penalty: 12,
        severity: 'error'
    },
    {
        code: 'FAQ_NORMATIVAS_FORMULA',
        regex: /¿qué normativas rigen el servicio de/gi,
        message: 'La FAQ cae en preguntas normativas clónicas y poco naturales.',
        penalty: 16,
        severity: 'critical'
    },
    {
        code: 'FAQ_TODAS_LAS_INTERVENCIONES_FORMULA',
        regex: /todas las intervenciones de/gi,
        message: 'Las respuestas FAQ empiezan con una fórmula repetida y poco editorial.',
        penalty: 14,
        severity: 'error'
    },
    {
        code: 'TECHNICAL_EXECUTION_FORMULA',
        regex: /la ejecución de nuestros técnicos/gi,
        message: 'Se detectó una construcción verbal extraña (“la ejecución de nuestros técnicos”).',
        penalty: 8,
        severity: 'warning'
    },
    {
        code: 'SERVICE_PROFESSIONAL_FORMULA',
        regex: /nuestro servicio profesional/gi,
        message: 'Se detectó una construcción pobre (“nuestro servicio profesional”).',
        penalty: 10,
        severity: 'error'
    },
    {
        code: 'GENERIC_TRUST_STRIP',
        regex: /respuesta inmediata[\s\S]*precios cerrados[\s\S]*materiales certificados/gi,
        message: 'Trust strip excesivamente genérica y demasiado “template”.',
        penalty: 6,
        severity: 'warning'
    }
    ,
    {
        code: 'TRUST_TOKEN_RESIDUE',
        regex: /seguridad certificada|compromiso profesional directo|uso de sistemas avanzados|calidad verificada|con total garantía técnica/gi,
        message: 'Se detectaron coletillas de confianza residuales repetidas, impropias de una página premium.',
        penalty: 16,
        severity: 'critical'
    },
    {
        code: 'MIXED_LANGUAGE_RESIDUE',
        regex: /\band profesionalidad\b/gi,
        message: 'Se detectó mezcla de idiomas en el copy (“and profesionalidad”).',
        penalty: 14,
        severity: 'error'
    },
    {
        code: 'GENERIC_CARD_TITLES',
        regex: /servicio de [a-záéíóúñ]+ en [a-záéíóúñ\s]+|intervención profesional en [a-záéíóúñ\s]+|calidad técnica en [a-záéíóúñ\s]+/gi,
        message: 'Los títulos internos repiten una plantilla demasiado genérica.',
        penalty: 14,
        severity: 'error'
    }

];

function normalizeText(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripHtml(value: string): string {
    return value
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function countOccurrences(text: string, regex: RegExp): number {
    const matches = text.match(regex);
    return matches ? matches.length : 0;
}

function firstWordsSignature(text: string, words = 8): string {
    const normalized = normalizeText(text);
    return normalized.split(' ').slice(0, words).join(' ').trim();
}

function unique<T>(items: T[]): T[] {
    return Array.from(new Set(items));
}

function pushIssue(
    issues: QualityGateIssue[],
    issue: QualityGateIssue
): void {
    issues.push(issue);
}

function analyzePlaceholderHeadings($: cheerio.CheerioAPI, city: string, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const genericHeadingRegex = /^(intervenci[oó]n t[eé]cnica especializada(?: [a-z0-9]+)?|servicio\s+\d+|bloque\s+\d+|elemento\s+\d+|servicio\s+[abc])$/i;
    const headings = $('h2, h3').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean);

    const genericHeadings = (headings as string[]).filter((heading) => genericHeadingRegex.test(normalizeText(heading)));
    if (genericHeadings.length > 0) {
        pushIssue(issues, {
            code: 'GENERIC_PLACEHOLDER_HEADINGS',
            severity: 'critical',
            message: 'Se detectaron headings de marcador en bloques clave, impropios de una página premium.',
            penalty: 22,
            evidence: unique(genericHeadings).slice(0, 8)
        });
        scoreDelta -= 22;
    }

    const badlyCasedHeadings = (headings as string[]).filter((heading) => {
        const low = heading.toLowerCase();
        return low.includes(` ${city.toLowerCase()}`) && !heading.includes(city);
    });

    if (badlyCasedHeadings.length > 0) {
        pushIssue(issues, {
            code: 'CITY_CASING_IN_HEADINGS',
            severity: 'warning',
            message: 'Hay headings con la ciudad en minúscula o mal capitalizada.',
            penalty: 4,
            evidence: unique(badlyCasedHeadings).slice(0, 6)
        });
        scoreDelta -= 4;
    }

    return scoreDelta;
}

function analyzeBoilerplate(text: string, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    for (const rule of BOILERPLATE_PATTERNS) {
        const count = countOccurrences(text, rule.regex);

        if (count === 0) continue;

        const multiplier = count >= 3 ? 1.25 : 1;
        const penalty = Math.round(rule.penalty * multiplier);

        pushIssue(issues, {
            code: rule.code,
            severity: rule.severity,
            message: `${rule.message} Apariciones: ${count}.`,
            penalty
        });

        scoreDelta -= penalty;
    }

    return scoreDelta;
}

function analyzeTitleAndMeta($: cheerio.CheerioAPI, city: string, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const title = $('title').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
    const normalizedCity = normalizeText(city);

    if (title) {
        const normalizedTitle = normalizeText(title);

        if (
            normalizedTitle.includes(` en ${normalizedCity}`) &&
            normalizedTitle.endsWith(`| ${normalizedCity}`)
        ) {
            pushIssue(issues, {
                code: 'TITLE_DUPLICATED_CITY',
                severity: 'error',
                message: `El <title> duplica la ciudad de forma poco premium: "${title}".`,
                penalty: 10,
                evidence: [title]
            });
            scoreDelta -= 10;
        }
    }

    if (metaDescription) {
        const normalizedMeta = normalizeText(metaDescription);
        const genericMetaPatterns = [
            /expertos en .* servicio profesional, rapido y con garantia local/,
            /servicio profesional, rapido y con garantia local/,
            /en toda la zona de/
        ];

        const hits = genericMetaPatterns.filter(p => p.test(normalizedMeta)).length;

        if (hits >= 2) {
            pushIssue(issues, {
                code: 'META_DESCRIPTION_TEMPLATEY',
                severity: 'error',
                message: `La meta description suena a plantilla SEO en lugar de propuesta editorial: "${metaDescription}".`,
                penalty: 10,
                evidence: [metaDescription]
            });
            scoreDelta -= 10;
        }
    }

    return scoreDelta;
}

function analyzeHero($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const heroSubtitle = $('.hero__subtitle').first().text().trim();
    if (!heroSubtitle) return 0;

    const normalized = normalizeText(heroSubtitle);

    if (normalized.startsWith('¿buscas')) {
        pushIssue(issues, {
            code: 'HERO_SUBTITLE_WEAK_OPENING',
            severity: 'error',
            message: `El hero subtitle empieza con una fórmula débil: "${heroSubtitle}".`,
            penalty: 10,
            evidence: [heroSubtitle]
        });
        scoreDelta -= 10;
    }

    if (/presupuesto sin compromiso/.test(normalized) && /soluciones profesionales/.test(normalized)) {
        pushIssue(issues, {
            code: 'HERO_SUBTITLE_TEMPLATE_STACK',
            severity: 'warning',
            message: 'El hero combina varias fórmulas comerciales demasiado previsibles en una sola línea.',
            penalty: 6,
            evidence: [heroSubtitle]
        });
        scoreDelta -= 6;
    }

    return scoreDelta;
}

function analyzeNav($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const navLinks = $('.nav__link').map((_: any, el: any) => $(el).text().trim()).get();
    const normalized = navLinks.map((item: string) => normalizeText(item));

    const canonicalTemplate = ['servicios', 'urgencia', 'areas', 'zonas', 'dudas', 'proceso', 'precios'];

    const overlap = normalized.filter((item: string) => canonicalTemplate.includes(item)).length;

    /*
    if (navLinks.length >= 4 && overlap >= 4) {
        pushIssue(issues, {
            code: 'NAV_TOO_TEMPLATEY',
            severity: 'warning',
            message: `La navegación sigue una plantilla demasiado obvia: ${navLinks.join(' / ')}.`,
            penalty: 5,
            evidence: navLinks
        });
        scoreDelta -= 5;
    }
    */

    return scoreDelta;
}

function analyzeLocalProof($: cheerio.CheerioAPI, city: string, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const localSection =
        $('section#zonas').first().length
            ? $('section#zonas').first()
            : $('section').filter((_: any, el: any) => normalizeText($(el).find('h2').first().text()).includes(normalizeText(city))).first();

    if (!localSection.length) return 0;

    const cards = localSection.find('.semantic-card');
    const headings = cards.map((_: any, el: any) => $(el).find('h3').first().text().trim()).get();
    const paragraphs = cards.map((_: any, el: any) => $(el).find('p').first().text().trim()).get().filter(Boolean);

    const abstractHits = (headings as any[]).filter((h: any) => ABSTRACT_LOCAL_HEADINGS.has(normalizeText(h)));
    if (abstractHits.length >= 3) {
        pushIssue(issues, {
            code: 'LOCAL_PROOF_ABSTRACT_HEADINGS',
            severity: 'critical',
            message: 'La cobertura local usa demasiados headings abstractos y genéricos.',
            penalty: 18,
            evidence: unique(abstractHits).slice(0, 8)
        });
        scoreDelta -= 18;
    }

    if (cards.length > 6) {
        pushIssue(issues, {
            code: 'LOCAL_PROOF_OVEREXPANDED',
            severity: 'warning',
            message: `La sección local tiene demasiadas cards (${cards.length}) y corre riesgo de relleno.`,
            penalty: 6
        });
        scoreDelta -= 6;
    }

    const signatureMap = new Map<string, number>();
    for (const paragraph of paragraphs) {
        const sig = firstWordsSignature(paragraph, 8);
        if (!sig) continue;
        signatureMap.set(sig, (signatureMap.get(sig) || 0) + 1);
    }

    const repeatedParagraphStarts = [...signatureMap.entries()]
        .filter(([, count]) => count >= 3)
        .map(([sig]) => sig);

    if (repeatedParagraphStarts.length > 0) {
        pushIssue(issues, {
            code: 'LOCAL_PROOF_REPEATED_PARAGRAPH_STARTS',
            severity: 'critical',
            message: 'Las cards de cobertura local comparten el mismo arranque sintáctico.',
            penalty: 20,
            evidence: repeatedParagraphStarts.slice(0, 5)
        });
        scoreDelta -= 20;
    }

    return scoreDelta;
}

function analyzeFaq($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const faqCards = $('.faq-card');
    if (!faqCards.length) return 0;

    const questions = faqCards.map((_: any, el: any) => $(el).find('h3').first().text().trim()).get();
    const answers = faqCards.map((_: any, el: any) => $(el).find('p').first().text().trim()).get().filter(Boolean);

    const normativeQuestions = (questions as any[]).filter((q: any) =>
        normalizeText(q).startsWith('¿que normativas rigen el servicio de')
    );

    if (normativeQuestions.length >= 3) {
        pushIssue(issues, {
            code: 'FAQ_NORMATIVE_CLUSTER',
            severity: 'critical',
            message: 'La FAQ está dominada por preguntas normativas clónicas en vez de objeciones reales.',
            penalty: 20,
            evidence: normativeQuestions.slice(0, 5)
        });
        scoreDelta -= 20;
    }

    const answerSignatureMap = new Map<string, number>();
    for (const answer of answers) {
        const sig = firstWordsSignature(answer, 10);
        if (!sig) continue;
        answerSignatureMap.set(sig, (answerSignatureMap.get(sig) || 0) + 1);
    }

    const repeatedAnswers = [...answerSignatureMap.entries()]
        .filter(([, count]) => count >= 3)
        .map(([sig]) => sig);

    if (repeatedAnswers.length > 0) {
        pushIssue(issues, {
            code: 'FAQ_REPEATED_ANSWER_SIGNATURES',
            severity: 'critical',
            message: 'La FAQ repite demasiadas respuestas con la misma estructura.',
            penalty: 18,
            evidence: repeatedAnswers.slice(0, 5)
        });
        scoreDelta -= 18;
    }

    return scoreDelta;
}

function analyzeMapPlacement($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const sectionIds = $('section[id]').map((_: any, el: any) => $(el).attr('id') || '').get();
    const zonasIndex = sectionIds.indexOf('zonas');
    const mapIndex = sectionIds.indexOf('donde-estamos');

    if (zonasIndex >= 0 && mapIndex === -1) {
        pushIssue(issues, {
            code: 'MAP_MISSING_AFTER_LOCAL_PROOF',
            severity: 'error',
            message: 'Existe sección local (`zonas`) pero no aparece el bloque de mapa (`donde-estamos`).',
            penalty: 12
        });
        scoreDelta -= 12;
    } else if (zonasIndex >= 0 && mapIndex !== zonasIndex + 1) {
        pushIssue(issues, {
            code: 'MAP_NOT_AFTER_LOCAL_PROOF',
            severity: 'warning',
            message: 'El mapa no aparece inmediatamente después de la prueba local.',
            penalty: 5
        });
        scoreDelta -= 5;
    }
    return scoreDelta;
}

function analyzeDuplicateHeroOrGhostHero($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;
    const dedicatedHero = $('section.hero').length > 0;
    const ghostHero = $('section#hero').length > 0;

    if (dedicatedHero && ghostHero) {
        pushIssue(issues, {
            code: 'DUPLICATE_HERO_SECTION',
            severity: 'critical',
            message: 'Hay un hero visual y otro bloque semántico duplicado con id="hero".',
            penalty: 20
        });
        scoreDelta -= 20;
    }

    const literalHeroEyebrow = $('.block__eyebrow').filter((_: any, el: any) => normalizeText($(el).text()) === 'hero').length;
    if (literalHeroEyebrow > 0) {
        pushIssue(issues, {
            code: 'GHOST_HERO_EYEBROW',
            severity: 'error',
            message: 'Se detectó el literal “hero” como eyebrow de un bloque.',
            penalty: 8
        });
        scoreDelta -= 8;
    }

    return scoreDelta;
}

function analyzeBrokenInternalLinks($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;
    const badLinks = $('a').map((_: any, el: any) => $(el).attr('href') || '').get().filter((href: string) =>
        /\/index\.html\/?$/i.test(href) || href === '#top'
    );

    if (badLinks.length > 0) {
        pushIssue(issues, {
            code: 'SUSPICIOUS_INTERNAL_LINKS',
            severity: 'error',
            message: 'Se detectaron enlaces internos sospechosos o placeholders en navegación/contexto.',
            penalty: 10,
            evidence: unique(badLinks as string[]).slice(0, 6)
        });
        scoreDelta -= 10;
    }

    return scoreDelta;
}

function analyzeThinTrustBand($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;
    const trustSection = $('section#senales-confianza').first();
    if (trustSection.length && normalizeText(trustSection.text()).length < 80) {
        pushIssue(issues, {
            code: 'THIN_TRUST_SECTION',
            severity: 'error',
            message: 'La banda de confianza quedó demasiado vacía o sin contenido útil.',
            penalty: 10
        });
        scoreDelta -= 10;
    }
    return scoreDelta;
}



function analyzeSanitizerResidualFragments(plainText: string, issues: QualityGateIssue[]): number {
    const residualPatterns = [
        /\btipo\s+de,\s+el\s+herraje\b/gi,
        /\bseg[uú]n\s+el,\s+el\s+material\b/gi,
        /\bbrechas\s+de\s+por\s+copias?\s+no\s+autorizadas?\b/gi,
        /\brealizamos\s+y\s+con\s+la\s+m[aá]xima\s+discreci[oó]n\b/gi,
        /\bauditor[ií]as\s+de\s+gratuitas\b/gi,
        /integran\s+la\s+[uú]ltima\s+tecnolog[ií]a\s+en\s+profesional/gi,
        /vulnerabilidades?\s+en\s+sistemas?\s+de/gi,
        /control\s+sobre\s+qui[eé]n\s+puede\s+realizar\s+duplicados?/gi,
        /copias?\s+no\s+autorizadas?/gi,
        /\bmuelles?\s+cierrapuertas\b/gi,
        /\bauditor[ií]as?\s+de\s+seguridad\b/gi,
        /\bmecanismos?\s+de\s+seguridad\b/gi,
        /\brepuestos?\s+originales?\b/gi,
        /\bpuertas?\s+de\s+trastero\b/gi,
        /\bnivel\s+de\s*,/gi,
        /\bcobertura\s+comunicada\s+a\s+nivel\s+de\s*(?:·|$)/gi,
        /\ben\s+y\s+evita\b/gi,
        /\bvisible\s+en\s+y\s+evita\b/gi,
        /\bse\s+parece\s+a\s*,/gi,
        /\bComarca\s+de\s+la\s+Vega\s+de\s+y\s+Andaluc[ií]a\b/gi,
        /\bComarca\s+de\s+la\s+Vega\s+de\b/gi,
        /\bpara\s+garant\s*$/gi,
        /\brevisar\s+alta\s+con\s+contexto\b/gi,
        /\bEscudos\s+Protectors\b/gi,
        /\bsistemas\s+cerrajeros\b/gi,
        /\brecuperar\s+el\s+daño\b/gi
    ];

    const hits = residualPatterns
        .map((rx) => plainText.match(rx) || [])
        .flat()
        .map((m) => normalizeText(String(m)))
        .filter(Boolean);

    if (!hits.length) return 0;

    pushIssue(issues, {
        code: 'SANITIZER_RESIDUAL_FRAGMENTS',
        severity: 'critical',
        message: 'El HTML contiene fragmentos residuales típicos de una limpieza cross-niche defectuosa.',
        penalty: 18,
        evidence: unique(hits).slice(0, 10)
    });

    return -18;
}

function analyzeCrossNicheLeakage(input: QualityGateInput, plainText: string, issues: QualityGateIssue[]): number {
    const niche = normalizeText(input.niche || '');
    const looksLikeLocksmith = /cerraj|cerradura|bombin|cilindro|llave|bumping|ganzu|candado/.test(niche);

    if (looksLikeLocksmith) return 0;

    const leakedPatterns = [
        // Nuclear Cleanup: High-risk terms (Sync with ContentWriterAgent V6)
        /intrusi(?:[oó]|&[oO]acute;)n[a-z&;]*/gi,
        /ganzu(?:[aá]|&[aA]acute;)[a-z&;]*/gi,
        /antibumping/gi,
        /fichet/gi,
        /dierre/gi,
        /tesa/gi,
        /amaestramiento[a-z&;]*/gi,
        /bomb(?:[ií]|&[iI]acute;)n[a-z&;]*/gi,
        /desahucio[a-z&;]*/gi,
        /cerradur[a-z&;]*/gi,
        /cerrajer(?:[ií]|&[iI]acute;)a[a-z&;]*/gi,
        
        // Contextual Cleanup
        /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])cilindro[a-z&;]*/gi,
        /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])escudo[a-z&;]*\s+magn(?:[eé]|&[eE]acute;)tico/gi,
        /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])extractor[a-z&;]*\s+de\s+cilindro/gi,
        /(?:^|[^a-z&;áéíóúñA-ZÁÉÍÓÚÑ])apertura[a-z&;]*\s+judicial/gi,
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
        /\bauditor[ií]as?\s+de\s+seguridad\b/gi
    ];

    const hits = leakedPatterns
        .map((rx) => plainText.match(rx) || [])
        .flat()
        .map((m) => String(m).trim())
        .filter(Boolean);

    if (!hits.length) return 0;

    pushIssue(issues, {
        code: 'CROSS_NICHE_LEAKAGE',
        severity: 'critical',
        message: 'El HTML contiene términos de otro nicho, señal de contaminación semántica entre verticales.',
        penalty: 24,
        evidence: unique(hits).slice(0, 10)
    });

    return -24;
}

function analyzeNicheCompliance(input: QualityGateInput, issues: QualityGateIssue[]): number {
    const pagePlan = (input.pagePlan || {}) as any;
    const nicheRules = pagePlan?.strategicAnalysis?.schemaTypes || pagePlan?.schemaTypes || pagePlan?.seoBrief?.schemaTypes || [];
    if (process.env.DEBUG_QUALITY_GATE === 'true') {
        console.log(`[DEBUG_QUALITY] Provided Schemas: ${JSON.stringify(nicheRules)}`);
    }

    const nicheValidation = validateContentAgainstNichePlaybook({
        niche: input.niche,
        html: input.html,
        schemaTypes: nicheRules
    });

    if (nicheValidation.ok) return 0;

    let delta = 0;
    for (const issue of nicheValidation.issues) {
        pushIssue(issues, {
            code: 'NICHE_COMPLIANCE_ERROR',
            severity: 'error',
            message: `Incumplimiento de Playbook (${input.niche}): ${issue}`,
            penalty: 15
        });
        delta -= 15;
    }
    return delta;
}

function analyzeGlobalParagraphRepetition($: cheerio.CheerioAPI, issues: QualityGateIssue[]): number {
    let scoreDelta = 0;

    const paragraphs = $('p').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean);
    const sigMap = new Map<string, number>();

    for (const p of paragraphs) {
        const sig = firstWordsSignature(p, 9);
        if (!sig) continue;
        sigMap.set(sig, (sigMap.get(sig) || 0) + 1);
    }

    const duplicated = [...sigMap.entries()].filter(([, count]) => count >= 4);

    if (duplicated.length > 0) {
        pushIssue(issues, {
            code: 'GLOBAL_PARAGRAPH_REPETITION',
            severity: 'critical',
            message: 'La página repite demasiados párrafos con el mismo arranque, señal clara de contenido parametrizado.',
            penalty: 18,
            evidence: duplicated.slice(0, 5).map(([sig, count]) => `${sig} (${count})`)
        });
        scoreDelta -= 18;
    }

    return scoreDelta;
}

export function runQualityGate(input: QualityGateInput, minScore = DEFAULT_MIN_SCORE): QualityGateResult {
    const $ = cheerio.load(input.html);
    const plainText = normalizeText(stripHtml(input.html));

    const issues: QualityGateIssue[] = [];
    issues.push(...detectSchemaHygieneIssues($));
    let score = 100;

    score += analyzeTitleAndMeta($, input.city, issues);
    score += analyzePlaceholderHeadings($, input.city, issues);
    score += analyzeHero($, issues);
    score += analyzeDuplicateHeroOrGhostHero($, issues);
    score += analyzeNav($, issues);
    score += analyzeBrokenInternalLinks($, issues);
    score += analyzeThinTrustBand($, issues);
    score += analyzeLocalProof($, input.city, issues);
    score += analyzeFaq($, issues);
    score += analyzeMapPlacement($, issues);
    score += analyzeGlobalParagraphRepetition($, issues);
    score += analyzeBoilerplate(plainText, issues);
    score += analyzeCrossNicheLeakage(input, plainText, issues);
    score += analyzeSanitizerResidualFragments(plainText, issues);
    score += analyzeNicheCompliance(input, issues);

    const technicalIssues = validateRenderedPageTechnically({ html: input.html }, {
        expectedPhone: input.phone,
        expectedBusinessName: input.businessName,
        mission: { city: input.city, niche: input.niche },
        pagePlan: input.pagePlan
    } as any);
    const technicalPenaltyMap: Record<string, { severity: QualityGateSeverity; penalty: number; message: string }> = {
        TRUNCATED_SEO_COPY: { severity: 'error', penalty: 14, message: 'La metadescripción, OG o Twitter parece truncada.' },
        SCHEMA_STREETADDRESS_IS_CITY: { severity: 'error', penalty: 16, message: 'El schema usa la ciudad como streetAddress; no es una dirección verificada.' },
        SCHEMA_WEBPAGE_DESCRIPTION_MISMATCH: { severity: 'error', penalty: 10, message: 'La descripción de WebPage no está alineada con la meta description final.' },
        BROKEN_LOCAL_FRAGMENT: { severity: 'critical', penalty: 18, message: 'Hay fragmentos locales rotos visibles.' },
        GENERIC_OR_BROKEN_SEO_COPY: { severity: 'error', penalty: 10, message: 'El SEO visible contiene copy genérico o roto.' },
        FAQ_SCHEMA_CONTENT_MISMATCH: { severity: 'critical', penalty: 20, message: 'Las FAQs visibles no coinciden con el schema FAQ.' }
    };
    for (const code of technicalIssues) {
        const policy = technicalPenaltyMap[code];
        if (!policy || issues.some(issue => issue.code === code)) continue;
        pushIssue(issues, { code, severity: policy.severity, message: policy.message, penalty: policy.penalty });
        score -= policy.penalty;
    }

    const premium = scorePremiumOutput({ html: input.html, city: input.city, niche: input.niche, phone: input.phone, businessName: input.businessName, qualityGate: { score } });
    if (premium.score < PREMIUM_MIN_SCORE) {
        const penalty = Math.max(4, Math.round((PREMIUM_MIN_SCORE - premium.score) / 2));
        pushIssue(issues, { code: 'PREMIUM_SCORE_BELOW_TARGET', severity: premium.score < 75 ? 'error' : 'warning', message: premium.summary, penalty, evidence: premium.issueCodes });
        score -= penalty;
    }

    let counts = qualityGateCounts(issues);
    if (counts.blockerCount > 0 && !issues.some(i => i.code === 'BLE_V24_BLOCKER_ESCALATION')) {
        issues.push({
            code: 'BLE_V24_BLOCKER_ESCALATION',
            severity: 'critical',
            message: 'BLE V2.4: la pagina contiene bloqueadores tecnicos de produccion y no debe publicarse.',
            penalty: 100
        });
    }

    counts = qualityGateCounts(issues);
    if (counts.criticalCount >= 2 && !issues.some(i => i.code === 'QUALITY_COLLAPSE')) {
        pushIssue(issues, {
            code: 'QUALITY_COLLAPSE',
            severity: 'critical',
            message: 'Se acumulan varias señales de contenido demasiado genérico o repetitivo.',
            penalty: 10
        });
        score -= 10;
    }

    score = Math.max(0, Math.min(100, score));
    counts = qualityGateCounts(issues);
    const passed = recomputeQualityGatePass(issues, score, minScore);

    const summary = passed
        ? `Quality Gate OK (${score}/100).`
        : `Quality Gate FAILED (${score}/100). Critical=${counts.criticalCount}, Errors=${counts.errorCount}. Blockers=${counts.blockerCount}.`;

    return {
        passed,
        score,
        issues: issues.sort((a, b) => b.penalty - a.penalty),
        summary
    };
}

function detectSchemaHygieneIssues($: cheerio.CheerioAPI): QualityGateIssue[] {
  const issues: QualityGateIssue[] = [];
  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      for (const node of graph) {
        const type = node?.['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('FAQPage') && Array.isArray(node.mainEntity)) {
          const bad = node.mainEntity
            .map((item: any) => String(item?.name || ''))
            .filter((name: string) => hasFaqNumberingArtifact(name));
          if (bad.length) {
            issues.push({
              code: 'FAQ_NUMBERING_ARTIFACT',
              severity: 'error',
              message: 'El schema FAQ contiene preguntas con numeración artificial del LLM.',
              penalty: 8,
              evidence: bad.slice(0, 5)
            });
          }
        }
      }
    } catch {
      issues.push({
        code: 'SCHEMA_JSON_INVALID',
        severity: 'critical',
        message: 'Un bloque JSON-LD no se puede parsear.',
        penalty: 20,
        evidence: [raw.slice(0, 160)]
      });
    }
  });
  return issues;
}


export async function runAsyncQualityGate(input: QualityGateInput, minScore = DEFAULT_MIN_SCORE): Promise<QualityGateResult> {
    const result = runQualityGate(input, minScore);

    // Phase 9.5.2: Site Originality Gate (Async)
    if (input.mission && input.pagePlan) {
        console.log(`[QualityGate] Running Site-Level Originality analysis...`);
        const db = await dbManager.getDB();
        const originalityGate = await runSiteOriginalityGate({
            db: db as any,
            html: input.html,
            mission: input.mission,
            pagePlan: input.pagePlan,
            pageId: input.pageId || 'temp-id'
        });

        if (originalityGate.issues.length > 0) {
            result.issues.push(...originalityGate.issues.map((issue: any) => ({
                code: issue.code,
                severity: issue.severity as any,
                message: issue.message,
                penalty: issue.penalty,
                evidence: issue.evidence
            })));

            result.score += originalityGate.scoreDelta;
            result.score = Math.max(0, Math.min(100, result.score));
            
            const counts = qualityGateCounts(result.issues);
            result.passed = recomputeQualityGatePass(result.issues, result.score, minScore);
            result.summary = result.passed
                ? `Quality Gate OK (${result.score}/100 including Site Originality).`
                : `Quality Gate FAILED (${result.score}/100) due to Site Originality issues. Critical=${counts.criticalCount}, Errors=${counts.errorCount}, Blockers=${counts.blockerCount}.`;
            
            result.issues.sort((a, b) => b.penalty - a.penalty);
        }
    }

    return result;
}

export function formatQualityGateIssues(result: QualityGateResult, max = 5): string {
    return result.issues
        .slice(0, max)
        .map(issue => {
            let msg = `${issue.code}: ${issue.message}`;
            if (issue.evidence && issue.evidence.length > 0) {
                msg += ` Encontrado: ${issue.evidence.join(', ')}`;
            }
            return msg;
        })
        .join(' | ');
}

