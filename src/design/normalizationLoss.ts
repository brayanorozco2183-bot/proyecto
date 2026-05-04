export interface NormalizationLossEntry {
    sectionId: string;
    proposed: any;
    rendered: any;
    delta: string[];
}

export function generateLossReport(proposedSections: any[], finalSections: any[]): NormalizationLossEntry[] {
    const report: NormalizationLossEntry[] = [];

    proposedSections.forEach(p => {
        const rendered = finalSections.find(f => f.section_id === p.section_id);
        if (rendered) {
            const delta: string[] = [];
            if (p.preferred_format !== rendered.preferred_format) delta.push('format_changed');
            if (p.layout_hint !== rendered.layout_hint) delta.push('layout_changed');
            if (p.visual_variant !== rendered.visual_variant) delta.push('variant_changed');

            if (delta.length > 0) {
                report.push({
                    sectionId: p.section_id,
                    proposed: { format: p.preferred_format, layout: p.layout_hint, variant: p.visual_variant },
                    rendered: { format: rendered.preferred_format, layout: rendered.layout_hint, variant: rendered.visual_variant },
                    delta
                });
            }
        }
    });

    return report;
}