import * as cheerio from 'cheerio';
import { RenderedPage, GenerationMission, PostDeployAuditResult } from '../types/pipeline_v2.js';

function normalizeText(value: string | undefined): string {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeRegExp(value: string | undefined): string {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type PerformanceSignals = {
    styleBytes: number;
    blurCount: number;
    shadowCount: number;
    remoteFontSheets: number;
    missingImageDimensions: number;
    eagerNonHeroImages: number;
    iframeCount: number;
    nonLazyIframes: number;
};

function buildServiceLabel(niche?: string): string {
    const normalized = normalizeText(niche).toLowerCase();
    if (!normalized) return 'servicio local';
    if (/(?:eros|istas|ores|ales)$/i.test(normalized)) return normalized;
    if (/^servicio\b/i.test(normalized)) return normalized;
    return `servicio de ${normalized}`;
}

function buildAuditUrl(mission: GenerationMission): string {
    const clusterFolder = String((mission as any).cluster_folder_name || (mission as any).clusterFolderName || '').trim();
    if (clusterFolder) return clusterFolder;
    if (mission.subPath) return String(mission.subPath).replace(/^\/+|\/+$/g, '');
    return `${String(mission.niche || '').trim()}-${String(mission.city || '').trim()}`
        .replace(/\s+/g, '-')
        .toLowerCase();
}

function buildBoilerplateRegex(mission: GenerationMission): RegExp | null {
    const city = normalizeText(mission.city);
    if (!city) return null;
    const niche = normalizeText(mission.niche);
    const escapedCity = escapeRegExp(city);
    const escapedNiche = niche ? escapeRegExp(niche) : '[^.,;:!?]+';
    const escapedService = escapeRegExp(buildServiceLabel(niche));

    return new RegExp(
        `\\bEn\\s+${escapedCity},\\s+este\\s+trabajo\\s+de\\s+(?:${escapedNiche}|${escapedService}|[^.,;:!?]+?)\\s+conviene\\s+resolverlo\\s+con\\s+una\\s+valoraci[oó]n\\s+previa\\s+y\\s+(?:una\\s+propuesta\\s+ajustada\\s+al\\s+alcance\\s+real|un\\s+criterio\\s+t[eé]cnico\\s+proporcional\\s+al\\s+caso)\\.?`,
        'i'
    );
}

function countMatches(values: string[], pattern: RegExp | null): number {
    if (!pattern) return 0;
    return values.reduce((acc, value) => acc + (pattern.test(value) ? 1 : 0), 0);
}

export class AuditSentinel {
    static async audit(page: RenderedPage, mission: GenerationMission): Promise<PostDeployAuditResult> {
        console.log(`[AuditSentinel] 🤖 Crawling site health for ${mission.city}...`);

        const $ = cheerio.load(page.html || '', { decodeEntities: false } as any);
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        const brokenLinks = this.detectBrokenLinks($);
        const title = $('title').first().text().trim();
        const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
        const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
        const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || '';
        const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim() || '';
        const twitterDescription = $('meta[name="twitter:description"]').attr('content')?.trim() || '';
        const visibleFaqAnswers = this.extractVisibleFaqAnswers($);
        const schemaInspection = this.inspectStructuredData($, mission);
        const perfSignals = this.inspectPerformanceSignals(page.html || '');
        const boilerplateRegex = buildBoilerplateRegex(mission);
        const visibleFaqBoilerplateHits = countMatches(visibleFaqAnswers, boilerplateRegex);
        const qualityGateScore = Number((page.metadata as any)?.qualityGate?.score);
        const validationErrors = Array.isArray(page.metadata?.validation_errors) ? page.metadata.validation_errors : [];
        const originalitySignals = validationErrors.filter((issue) => /\[QUALITY:SITE_|\[QUALITY:HERO_BUSCAS_FORMULA/i.test(issue));

        if (!title) {
            issues.push('[AUDIT:MISSING_TITLE] La página final no contiene un <title> utilizable.');
        } else if (title.includes('…') || title.length < 25) {
            issues.push(`[AUDIT:TITLE_TRUNCATED] El <title> final parece truncado o demasiado corto: "${title}".`);
        }

        if (!metaDescription) {
            issues.push('[AUDIT:MISSING_META_DESCRIPTION] Falta la meta description final.');
        } else if (metaDescription.length < 90) {
            warnings.push('[AUDIT:SHORT_META_DESCRIPTION] La meta description final es demasiado corta para una landing BOFU.');
        }

        if (/descubre\s+las\s+mejores\s+soluciones/i.test(metaDescription) || /proteger\s+tu\s+propiedad/i.test(metaDescription)) {
            issues.push('[AUDIT:GENERIC_META_DESCRIPTION] La meta description sigue usando copy genérico de plantilla.');
        }

        if ((ogTitle && ogTitle !== title) || (twitterTitle && twitterTitle !== title)) {
            warnings.push('[AUDIT:SOCIAL_TITLE_MISMATCH] OG/Twitter title no coincide con el <title> final.');
        }

        if ((ogDescription && ogDescription !== metaDescription) || (twitterDescription && twitterDescription !== metaDescription)) {
            warnings.push('[AUDIT:SOCIAL_DESCRIPTION_MISMATCH] OG/Twitter description no coincide con la meta description final.');
        }

        if (brokenLinks.length > 0) {
            issues.push(`[AUDIT:BROKEN_LINKS] Se detectaron ${brokenLinks.length} enlaces vacíos o sospechosos.`);
        }

        if (!schemaInspection.schemaValid) {
            issues.push('[AUDIT:SCHEMA_INVALID] No se detectó un bloque JSON-LD válido en el HTML final.');
        }

        if (schemaInspection.faqBoilerplateHits >= 2 || visibleFaqBoilerplateHits >= 2) {
            issues.push('[AUDIT:FAQ_BOILERPLATE_REPETITION] Las FAQ siguen arrastrando coletillas repetidas de plantilla.');
        }

        if (/\bAtenci[oó]n\s+directa\s+para\b/i.test(page.html) || /\bAtenci[oó]n\s+para\s+[A-ZÁÉÍÓÚÑ]/i.test(page.html)) {
            issues.push('[AUDIT:CTA_PLACEHOLDER_RESIDUAL] Quedan microcopys de CTA sin terminar en el HTML final.');
        }

        if (Number.isFinite(qualityGateScore) && qualityGateScore < 60) {
            issues.push(`[AUDIT:QUALITY_GATE_LOW] El Quality Gate previo quedó en ${qualityGateScore}/100, demasiado bajo para dar la página por cerrada.`);
        }

        if (originalitySignals.length > 0) {
            warnings.push(...originalitySignals.slice(0, 4));
        }

        if (perfSignals.styleBytes > 45000) {
            warnings.push(`[AUDIT:HEAVY_INLINE_CSS] El CSS inline final pesa ${perfSignals.styleBytes} bytes.`);
        }
        if (perfSignals.blurCount > 3) {
            warnings.push(`[AUDIT:EXCESSIVE_BLUR_EFFECTS] Se detectaron ${perfSignals.blurCount} usos de backdrop-filter.`);
        }
        if (perfSignals.shadowCount > 55) {
            warnings.push(`[AUDIT:EXCESSIVE_SHADOWS] Se detectaron ${perfSignals.shadowCount} declaraciones de box-shadow.`);
        }
        if (perfSignals.missingImageDimensions > 0) {
            warnings.push(`[AUDIT:MEDIA_DIMENSIONS_MISSING] Hay ${perfSignals.missingImageDimensions} imágenes sin width/height.`);
        }
        if (perfSignals.eagerNonHeroImages > 0) {
            warnings.push(`[AUDIT:EAGER_NON_HERO_IMAGES] Hay ${perfSignals.eagerNonHeroImages} imágenes eager fuera del hero.`);
        }
        if (perfSignals.nonLazyIframes > 0) {
            warnings.push(`[AUDIT:IFRAME_NOT_LAZY] Hay ${perfSignals.nonLazyIframes} iframes sin loading=lazy.`);
        }

        if (issues.some((issue) => issue.includes('TITLE_TRUNCATED') || issue.includes('GENERIC_META_DESCRIPTION'))) {
            recommendations.push('Reescribir title/meta/OG/Twitter desde el HTML final publicado, no desde el plan inicial.');
        }
        if (issues.some((issue) => issue.includes('FAQ_BOILERPLATE_REPETITION'))) {
            recommendations.push('Reconstruir el resumen de FAQ desde el HTML final o desde JSON-LD limpio para evitar arrastre de boilerplate.');
        }
        if (originalitySignals.length > 0) {
            recommendations.push('Usar las señales SITE_* del Quality Gate para marcar esta URL como “publicable con deuda editorial”, no como audit OK.');
        }
        if (perfSignals.styleBytes > 45000 || perfSignals.blurCount > 3 || perfSignals.shadowCount > 55) {
            recommendations.push('Reducir CSS inline, blur y sombras acumuladas desde el render final para mejorar Lighthouse sin cambiar la arquitectura editorial.');
        }
        if (perfSignals.missingImageDimensions > 0 || perfSignals.eagerNonHeroImages > 0) {
            recommendations.push('Forzar width/height en imágenes y reservar loading=eager solo para la imagen principal del hero.');
        }

        const performance = Math.max(
            40,
            this.computePerformanceScore(page, issues, warnings)
                - (perfSignals.styleBytes > 45000 ? 6 : 0)
                - Math.min(8, Math.max(0, perfSignals.blurCount - 3) * 2)
                - (perfSignals.shadowCount > 55 ? 4 : 0)
                - Math.min(6, perfSignals.missingImageDimensions)
                - Math.min(6, perfSignals.eagerNonHeroImages * 2)
                - Math.min(6, perfSignals.nonLazyIframes * 2)
        );
        const accessibility = Math.max(80, 95 - brokenLinks.length * 3);
        const seo = Math.max(70, schemaInspection.schemaValid ? 100 - Math.min(20, issues.length * 3) : 78);
        const passed = (
            schemaInspection.schemaValid &&
            brokenLinks.length === 0 &&
            issues.length === 0 &&
            (!Number.isFinite(qualityGateScore) || qualityGateScore >= 70) &&
            performance >= 85
        );

        return {
            passed,
            url: buildAuditUrl(mission),
            html_path: page.metadata.output_path || '',
            lighthouse: {
                performance,
                accessibility,
                seo,
            },
            schema_valid: schemaInspection.schemaValid,
            broken_links: brokenLinks,
            issues,
            warnings,
            recommendations,
            stats: {
                titleLength: title.length,
                metaDescriptionLength: metaDescription.length,
                faqCountVisible: visibleFaqAnswers.length,
                faqCountSchema: schemaInspection.faqAnswerCount,
                faqBoilerplateHitsVisible: visibleFaqBoilerplateHits,
                faqBoilerplateHitsSchema: schemaInspection.faqBoilerplateHits,
                qualityGateScore: Number.isFinite(qualityGateScore) ? qualityGateScore : null,
                styleBytes: perfSignals.styleBytes,
                blurCount: perfSignals.blurCount,
                shadowCount: perfSignals.shadowCount,
                remoteFontSheets: perfSignals.remoteFontSheets,
                missingImageDimensions: perfSignals.missingImageDimensions,
                eagerNonHeroImages: perfSignals.eagerNonHeroImages,
                nonLazyIframes: perfSignals.nonLazyIframes,
            }
        };
    }

    private static inspectPerformanceSignals(html: string): PerformanceSignals {
        const $ = cheerio.load(html || '', { decodeEntities: false } as any);
        const styles = $('style').map((_i: any, el: any) => $(el).text()).get().join('\n');
        const blurCount = (styles.match(/backdrop-filter\s*:/gi) || []).length;
        const shadowCount = (styles.match(/box-shadow\s*:/gi) || []).length;
        const styleBytes = Buffer.byteLength(styles, 'utf8');
        const remoteFontSheets = $('link[href*="fonts.googleapis.com"]').length;
        const missingImageDimensions = $('img').filter((_i: any, el: any) => !$(el).attr('width') || !$(el).attr('height')).length;
        const eagerNonHeroImages = $('img[loading="eager"]').filter((_i: any, el: any) => $(el).closest('.hero-immersive__media, .hero-visual__frame').length === 0).length;
        const iframeCount = $('iframe').length;
        const nonLazyIframes = $('iframe').filter((_i: any, el: any) => String($(el).attr('loading') || '').toLowerCase() !== 'lazy').length;

        return {
            styleBytes,
            blurCount,
            shadowCount,
            remoteFontSheets,
            missingImageDimensions,
            eagerNonHeroImages,
            iframeCount,
            nonLazyIframes,
        };
    }

    private static computePerformanceScore(page: RenderedPage, issues: string[], warnings: string[]): number {
        let score = page.metadata?.technical_passed ? 92 : 72;
        score -= issues.length * 4;
        score -= Math.min(8, warnings.length * 2);
        const qualityGateScore = Number((page.metadata as any)?.qualityGate?.score);
        if (Number.isFinite(qualityGateScore) && qualityGateScore < 60) score -= 6;
        return Math.max(40, Math.min(100, score));
    }

    private static inspectStructuredData($: cheerio.CheerioAPI, mission: GenerationMission): { schemaValid: boolean; faqBoilerplateHits: number; faqAnswerCount: number } {
        let schemaValid = false;
        const answers: string[] = [];
        const boilerplateRegex = buildBoilerplateRegex(mission);

        $('script[type="application/ld+json"]').each((_i: any, el: any) => {
            try {
                const raw = JSON.parse($(el).text() || '{}');
                const nodes = Array.isArray(raw?.['@graph']) ? raw['@graph'] : (Array.isArray(raw) ? raw : [raw]);
                if (nodes.length > 0) schemaValid = true;
                for (const node of nodes) {
                    const type = node?.['@type'];
                    const isFaq = type === 'FAQPage' || (Array.isArray(type) && type.includes('FAQPage'));
                    if (!isFaq) continue;
                    const entities = Array.isArray(node?.mainEntity) ? node.mainEntity : [];
                    for (const entity of entities) {
                        const answer = normalizeText(entity?.acceptedAnswer?.text || '');
                        if (answer) answers.push(answer);
                    }
                }
            } catch {
                // ignore malformed blocks
            }
        });

        return {
            schemaValid,
            faqBoilerplateHits: countMatches(answers, boilerplateRegex),
            faqAnswerCount: answers.length,
        };
    }

    private static extractVisibleFaqAnswers($: cheerio.CheerioAPI): string[] {
        const answers: string[] = [];
        $('details[data-faq-item="true"], .faq-item').each((_i: any, el: any) => {
            const answer = normalizeText($(el).find('.faq-content-refined, div').first().text());
            if (answer) answers.push(answer);
        });
        return answers;
    }

    private static detectBrokenLinks($: cheerio.CheerioAPI): string[] {
        const broken = new Set<string>();
        $('a[href]').each((_i: any, el: any) => {
            const href = ($(el).attr('href') || '').trim();
            if (!href) {
                broken.add('empty-href');
                return;
            }

            if (href === '#') {
                broken.add('#');
                return;
            }

            if (/^javascript:/i.test(href) || /^mailto:\s*$/i.test(href)) {
                broken.add(href);
                return;
            }

            if (/^\/(?:\.\.\/)+/.test(href) || href.includes('undefined') || href.includes('null')) {
                broken.add(href);
            }
        });
        return Array.from(broken);
    }
}

