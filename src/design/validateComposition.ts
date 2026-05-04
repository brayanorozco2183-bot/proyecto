export function validateComposition(page: any) {
    const alerts: string[] = [];
    const sections = page.sections || [];
    const blockTypes = sections.map((s: any) => String(s?.block_type || s?.blockType || '').toLowerCase());
    const variants = sections.map((s: any) => String(s?.visual_variant || s?.variant || '').toLowerCase());

    // 1. No double heavy CTA
    const heavyCTAs = sections.filter((s: any) => s.block_type === 'cta_panel' && s.visual_weight === 'heavy');
    if (heavyCTAs.length > 1) {
        alerts.push('REDUNDANT_HEAVY_CTA: More than one heavy CTA panel detected.');
    }

    // 2. No more than 2 blocks with elevated cards
    const elevatedBlocks = sections.filter((s: any) => s.card_variant === 'elevated');
    if (elevatedBlocks.length > 2) {
        alerts.push('EXCESSIVE_ELEVATION: Too many sections using elevated card variants.');
    }

    // 3. Spacing consistency
    const highWeightCount = sections.filter((s: any) => s.visual_weight === 'heavy').length;
    if (highWeightCount > 3) {
        alerts.push('VISUAL_FATIGUE: Too many heavy-weight sections on a single page.');
    }

    // 4. Tension management: FAQ and Map should be low tension
    const faqAndMap = sections.filter((s: any) => s.block_type === 'faq' || s.block_type === 'map');
    faqAndMap.forEach((s: any) => {
        if (s.tension === 'high') {
            alerts.push(`IMPROPER_TENSION: Section ${s.block_type} should not have high tension.`);
        }
    });

    // 5. Final CTA should be high tension (second peak)
    const lastSection = sections[sections.length - 1];
    if (lastSection && lastSection.block_type !== 'cta_panel' && lastSection.block_type !== 'urgency_panel') {
        alerts.push('WEAK_CLOSURE: Page does not end with a high-conversion block.');
    }

    // 6. Avoid visually repetitive card-heavy runs
    const cardHeavy = new Set(['services_grid', 'local_proof', 'trust_band', 'faq']);
    let consecutiveHeavy = 0;
    let maxConsecutiveHeavy = 0;
    for (const bt of blockTypes) {
        if (cardHeavy.has(bt)) {
            consecutiveHeavy += 1;
            maxConsecutiveHeavy = Math.max(maxConsecutiveHeavy, consecutiveHeavy);
        } else {
            consecutiveHeavy = 0;
        }
    }
    if (maxConsecutiveHeavy > 2) {
        alerts.push('CARD_MONOTONY: More than two card-heavy sections appear consecutively.');
    }

    // 7. Map should not feel visually bare
    const mapVariant = sections.find((s: any) => (s.block_type || s.blockType) === 'map')?.visual_variant || variants[blockTypes.indexOf('map')] || '';
    if (String(mapVariant).toLowerCase() === 'minimal_embed') {
        alerts.push('BARE_MAP: Map uses a low-presence variant that tends to feel visually empty.');
    }

    // 8. Commercial pages should not close with a weak phone bar
    if (lastSection && (lastSection.block_type === 'cta_panel' || lastSection.blockType === 'cta_panel')) {
        const lastVariant = String(lastSection.visual_variant || lastSection.variant || '').toLowerCase();
        const lastWords = Number(lastSection.target_words || 0);
        if (lastVariant === 'minimal_phone_bar' || lastWords < 90) {
            alerts.push('WEAK_CLOSURE_CTA: Final CTA panel is too light for a premium commercial landing.');
        }
    }

    return {
        isValid: alerts.length === 0,
        alerts
    };
}
