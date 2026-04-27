export function assertNoTemplateLeaks(html: string): void {
    const unresolved = html.match(/\$\{[^}]+\}|\{{2,}[^{}]+\}{2,}|\[\[[^\]]+\]\]|__[\w.-]+__|<%[^%]+%>|\[object Object\]/g);
    if (unresolved?.length) {
        throw new Error(`Template leaks detectados: ${[...new Set(unresolved)].join(', ')}`);
    }
}

export function assertNoDegenerateBodySignature(html: string): void {
    const bodyClassMatch = html.match(/<body[^>]*class="([^"]+)"/i);
    const bodyClass = bodyClassMatch?.[1] || '';

    const degenerateFlags = [
        'page-surface-flat',
        'system-grid',
        'skeleton-conversion',
        'strategy-proof-distributed',
        'strategy-cta-terminal',
        'cadence-alternating',
        'family-minimal_authority'
    ];

    const matched = degenerateFlags.filter((flag) => bodyClass.includes(flag));

    if (matched.length >= 6) {
        throw new Error(`Firma visual degenerada detectada en <body>: ${matched.join(', ')}`);
    }
}

export function assertNoRepeatedBoilerplate(html: string): void {
    const suspiciousFragments = [
        'Nuestro equipo de especialistas en nuestro equipo especializado',
        'La transparencia en los costes y la calidad de los materiales son los pilares de nuestro servicio de nuestro equipo especializado',
        'Atendemos de forma inmediata en todos los barrios',
        'herramientas avanzadas y repuestos homologados'
    ];

    const offenders = suspiciousFragments.filter((fragment) => html.includes(fragment));

    if (offenders.length > 0) {
        throw new Error(`Boilerplate repetitivo detectado: ${offenders.join(' | ')}`);
    }
}

export function assertNoSystemLabelLeaks(html: string): void {
    const suspiciousPatterns = [
        /<span[^>]*class="[^"]*block__eyebrow[^"]*"[^>]*>\s*(faq|services_grid|process_steps|trust_band|local_proof|price_guidance|urgency_panel|cta_panel|map)\s*<\/span>/i,
        /\/\*\s*Point\s+\d+[^*]*\*\//i,
        /\/\*\s*AIRE\s+Update\s*\*\//i
    ];

    const offenders = suspiciousPatterns.filter((pattern) => pattern.test(html)).map((pattern) => pattern.source);
    if (offenders.length > 0) {
        throw new Error(`Leaks internos detectados en render final: ${offenders.join(' | ')}`);
    }
}
