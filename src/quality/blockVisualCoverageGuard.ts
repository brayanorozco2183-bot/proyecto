import * as cheerio from 'cheerio';

export interface BlockVisualCoverageIssue {
  code: string;
  severity: 'warning' | 'critical';
  message: string;
  selector?: string;
  evidence?: string[];
}

export interface BlockVisualCoverageResult {
  passed: boolean;
  issues: BlockVisualCoverageIssue[];
  missingClasses: string[];
}

const REQUIRED_BLOCK_CLASSES = [
  'block__cta-group',
  'block__cta-note',
  'block__pill',
  'service-card__meta',
  'step-row__meta',
  'proof-row',
  'proof-row__meta',
  'local-proof__signal',
  'local-proof__signal-list',
  'trust-band__signal-grid',
  'trust-band__signal-card',
  'process-step-rail',
  'process-step-rail__body',
  'map-block__context',
  'map-block__overlay',
  'urgency-banner__statbox',
  'faq-summary-refined',
  'faq-content-refined',
  'footer__grid-refined'
];

function collectCss(html: string): string {
  const $ = cheerio.load(html || '', { decodeEntities: false });
  return $('style').map((_i: number, el: any) => $(el).text()).get().join('\n');
}

function classExists($: cheerio.CheerioAPI, className: string): boolean {
  return $(`.${className.replace(/:/g, '\\:')}`).length > 0;
}

export function validateBlockVisualCoverage(html: string): BlockVisualCoverageResult {
  const $ = cheerio.load(html || '', { decodeEntities: false });
  const css = collectCss(html);
  const missingClasses = REQUIRED_BLOCK_CLASSES.filter((className) => classExists($, className) && !css.includes(`.${className}`));

  const issues: BlockVisualCoverageIssue[] = [];
  if ($('body').length && !$("body.gravity-production-stable").length) {
    issues.push({
      code: 'PRODUCTION_STABLE_BODY_CLASS_MISSING',
      severity: 'critical',
      message: 'La página no tiene activada la clase gravity-production-stable para la capa visual de producción.'
    });
  }
  if (!css.includes('Gravity Production Stable Visual System')) {
    issues.push({
      code: 'PRODUCTION_STABLE_CSS_MISSING',
      severity: 'critical',
      message: 'No se ha inyectado la capa CSS estable de producción.'
    });
  }

  if (missingClasses.length) {
    issues.push({
      code: 'BLOCK_VISUAL_CLASSES_WITHOUT_CSS',
      severity: missingClasses.length > 6 ? 'critical' : 'warning',
      message: `Hay clases de bloques renderizadas sin cobertura CSS directa: ${missingClasses.slice(0, 12).join(', ')}${missingClasses.length > 12 ? '…' : ''}`,
      evidence: missingClasses
    });
  }

  $('[data-block-type]').each((_i: number, el: any) => {
    const section = $(el);
    const blockType = String(section.attr('data-block-type') || 'unknown');
    const textLength = section.text().replace(/\s+/g, ' ').trim().length;
    const hasCard = section.find('.service-card,.proof-card,.step-card,.price-card,.faq-item,.semantic-card,.trust-band__signal-card,.proof-row,.map-block__support,.urgency-banner').length > 0;
    const hasMedia = section.find('img,iframe,svg,video').length > 0;
    if (textLength > 120 && !hasCard && !hasMedia && !/hero|internal_linking/.test(blockType)) {
      issues.push({
        code: 'TEXT_BLOCK_WITHOUT_VISUAL_STRUCTURE',
        severity: 'warning',
        selector: `[data-block-type="${blockType}"]`,
        message: `El bloque ${blockType} tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.`
      });
    }
  });

  const emptyLists = $('ul:empty, ol:empty, .service-card__meta:empty, .step-row__meta:empty, .proof-row__meta:empty').length;
  if (emptyLists > 0) {
    issues.push({
      code: 'EMPTY_STRUCTURAL_LISTS_VISIBLE',
      severity: 'critical',
      message: `Hay ${emptyLists} listas estructurales vacías que pueden crear huecos o layouts rotos.`
    });
  }

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const residue = text.match(/(^|\s)[:;,]\s*este bloque|\ben\s+y\b|\ben\s+puede\s+variar\b|servicios gratuitos|Lo que dicen nuestros clientes/i);
  if (residue) {
    issues.push({
      code: 'VISIBLE_COPY_RESIDUE_OR_LOCAL_FRAGMENT',
      severity: 'critical',
      message: 'Hay residuos de plantilla, idioma o fragmentos locales rotos visibles.',
      evidence: [residue[0]]
    });
  }

  return {
    passed: !issues.some((issue) => issue.severity === 'critical'),
    issues,
    missingClasses
  };
}
