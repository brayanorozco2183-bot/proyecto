import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export type SectionType = 'text' | 'grid' | 'faq' | 'table' | 'content' | 'about';

export interface SeoMasterSection {
    id: string;
    title: string;
    content: string;
    type: SectionType;
    structured?: any;
}

export interface SeoValidationResult {
    valid: boolean;
    errors: string[];
}

export class SeoMasterLogic {
    private static readonly PROTECTED_TAGS = ['nav', 'header:not(.hero)', 'footer', 'script', 'style'];

    static parsePage(html: string): SeoMasterSection[] {
        const $ = cheerio.load(html);
        const sections: SeoMasterSection[] = [];

        // 1. Hero Section
        const hero = $('.el-hero, header.hero').first();
        if (hero.length) {
            sections.push({
                id: 'hero',
                title: 'Sección Hero',
                content: hero.html() || '',
                type: 'text',
                structured: {
                    title: hero.find('.el-hero-h1, h1').text().trim(),
                    subtitle: hero.find('.el-hero-p, p').first().text().trim()
                }
            });
        }

        // 2. Services Grid
        const services = $('#servicios .el-grid, #servicios .grid').first();
        if (services.length) {
            const structure: any[] = [];
            services.find('.el-card, .card').each((_, el) => {
                structure.push({
                    icon: $(el).find('.icon').text().trim() || '🔒',
                    title: $(el).find('h3').text().trim(),
                    desc: $(el).find('p').text().trim()
                });
            });
            sections.push({
                id: 'servicios',
                title: 'Servicios (Grid)',
                content: services.html() || '',
                type: 'grid',
                structured: structure
            });
        }

        // 3. Technical Table
        const table = $('.el-table, .table-container table').first();
        if (table.length) {
            const structure: any[] = [];
            table.find('tbody tr').each((_, el) => {
                const label = $(el).find('td, .el-td').first().text().replace(':', '').trim();
                const value = $(el).find('td, .el-td').last().text().trim();
                if (label || value) structure.push({ label, value });
            });
            sections.push({
                id: 'tecnico',
                title: 'Especificaciones Técnicas',
                content: table.find('tbody').html() || '',
                type: 'table',
                structured: structure
            });
        }

        // 4. Experience Intro
        const expIntro = $('#experiencia .premium-content');
        if (expIntro.length) {
            sections.push({
                id: 'experiencia-text',
                title: 'Descripción Principal (Experiencia)',
                content: expIntro.html() || '',
                type: 'text',
                structured: { text: expIntro.text().trim() }
            });
        }

        // 5. Dynamic SEO Blocks
        $('.premium-content').not(':has(.premium-content)').not('#experiencia .premium-content').not('.about-section .premium-content').each((i, el) => {
            const $el = $(el);
            if ($el.text().trim().length < 5 && $el.find('ul, .intervention-card').length === 0) return;

            const title = $el.find('h2').first().text().trim();
            const blocks: any[] = [];
            $el.find('p, ul, .intervention-card').each((_, sub) => {
                const $sub = $(sub);
                if ($sub.parents('.intervention-card').length > 0 && !$sub.hasClass('intervention-card')) return;

                if ($sub.is('p')) {
                    blocks.push({ type: 'paragraph', text: $sub.text().trim() || '' });
                } else if ($sub.is('ul')) {
                    const items: string[] = [];
                    $sub.find('li').each((_, li) => { items.push($(li).html()?.trim() || ''); });
                    blocks.push({ type: 'list', items });
                } else if ($sub.hasClass('intervention-card')) {
                    const cardTitle = $sub.find('h3').text().trim() || '';
                    const cardDesc = $sub.find('p').text().trim() || '';
                    const meta: string[] = [];
                    $sub.find('.intervention-meta span').each((_, s) => { meta.push($(s).text().trim() || ''); });
                    blocks.push({ type: 'intervention', title: cardTitle, description: cardDesc, meta });
                }
            });

            if (blocks.length > 0 || title) {
                sections.push({
                    id: `seo-${sections.filter(s => s.id.startsWith('seo-')).length}`,
                    title: title || `Bloque SEO Adicional`,
                    content: $el.html() || '',
                    type: 'content',
                    structured: { title, blocks }
                });
            }
        });

        // 6. FAQ
        const faq = $('.el-faq-group, .faq-container').first();
        if (faq.length) {
            const structure: any[] = [];
            faq.find('.el-faq-item, .faq-item').each((_, el) => {
                structure.push({
                    question: $(el).find('.el-faq-q, .faq-q').text().trim(),
                    answer: $(el).find('.el-faq-a, .faq-a').text().trim()
                });
            });
            sections.push({
                id: 'faq',
                title: 'Preguntas Frecuentes',
                content: faq.html() || '',
                type: 'faq',
                structured: structure
            });
        }

        // 7. About Section
        const about = $('.about-section');
        if (about.length) {
            const aboutText = about.find('.about-info .premium-content').html()?.trim() || '';
            const stats: any[] = [];
            about.find('.stat-item').each((_, el) => {
                stats.push({
                    value: $(el).find('.stat-num').text().trim(),
                    label: $(el).find('.stat-label').text().trim()
                });
            });
            const legal: any = {};
            about.find('.about-legal li').each((_, el) => {
                const text = $(el).text().trim();
                if (text.includes('CIF:')) legal.cif = text.split('CIF:')[1].trim();
                if (text.includes('Dirección Central:')) legal.address = text.split('Dirección Central:')[1].trim();
                if (text.includes('Especialización:')) legal.specialization = text.split('Especialización:')[1].trim();
            });
            sections.push({
                id: 'about',
                title: 'Sobre Nosotros / Estadísticas',
                content: about.html() || '',
                type: 'about',
                structured: { text: aboutText, stats, legal }
            });
        }

        return sections;
    }

    static applyChanges(originalHtml: string, updates: Record<string, any>): string {
        const $ = cheerio.load(originalHtml);

        if (updates['hero']) {
            const el = $('header.hero');
            const { title, subtitle } = updates['hero'];
            if (title) el.find('h1').text(title);
            if (subtitle) el.find('p').first().text(subtitle);
        }

        if (updates['servicios']) {
            const el = $('#servicios .grid');
            const items = updates['servicios'] as any[];
            el.html(items.map(item => `
                <div class="card">
                    <div class="icon">${item.icon}</div>
                    <h3>${item.title}</h3>
                    <p>${item.desc}</p>
                </div>`).join('\n'));
        }

        if (updates['faq']) {
            const el = $('.faq-container');
            const items = updates['faq'] as any[];
            el.html(items.map(item => `
                <div class="faq-item">
                    <div class="faq-q">${item.question}</div>
                    <div class="faq-a">${item.answer}</div>
                </div>`).join('\n'));
        }

        if (updates['tecnico']) {
            const tbody = $('.table-container table tbody');
            const items = updates['tecnico'] as any[];
            tbody.html(items.map(item => `
                <tr>
                    <td><strong>${item.label}</strong></td>
                    <td>${item.value}</td>
                </tr>`).join('\n'));
        }

        if (updates['experiencia-text']) {
            const el = $('#experiencia .premium-content');
            if (updates['experiencia-text'].text) el.text(updates['experiencia-text'].text);
        }

        Object.keys(updates).forEach(key => {
            if (key.startsWith('seo-')) {
                const index = parseInt(key.split('-')[1]);
                const el = $('.premium-content').not(':has(.premium-content)').not('#experiencia .premium-content').not('.about-section .premium-content').eq(index);
                if (el.length) {
                    const { title, blocks } = updates[key];
                    let html = '';
                    if (title) html += `<h2>${title}</h2>\n`;
                    if (blocks && Array.isArray(blocks)) {
                        blocks.forEach((block: any) => {
                            if (block.type === 'paragraph') html += `<p>${block.text}</p>\n`;
                            else if (block.type === 'list') html += `<ul>\n${block.items.map((it: string) => `  <li>${it}</li>`).join('\n')}\n</ul>\n`;
                            else if (block.type === 'intervention') html += `<div class='intervention-card'>\n  <h3>${block.title}</h3>\n  <p>${block.description}</p>\n  <div class='intervention-meta'>\n    ${block.meta.map((m: string) => `<span>${m}</span>`).join('')}\n  </div>\n</div>\n`;
                        });
                    }
                    el.html(html);
                }
            }
        });

        if (updates['about']) {
            const about = $('.about-section');
            if (about.length) {
                const { text, stats, legal } = updates['about'];
                if (text) about.find('.about-info .premium-content').html(text);
                if (stats && Array.isArray(stats)) {
                    about.find('.about-stats').html(stats.map(s => `
                        <div class="stat-item"><span class="stat-num">${s.value}</span><span class="stat-label">${s.label}</span></div>
                    `).join(''));
                }
                if (legal) {
                    let legalHtml = '';
                    if (legal.cif) legalHtml += `<li style="margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;"><strong>CIF:</strong> ${legal.cif}</li>\n`;
                    if (legal.address) legalHtml += `<li style="margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;"><strong>Dirección Central:</strong> ${legal.address}</li>\n`;
                    if (legal.specialization) legalHtml += `<li><strong>Especialización:</strong> ${legal.specialization}</li>`;
                    about.find('.about-legal ul').html(legalHtml);
                }
            }
        }

        return $.html();
    }
    static validate(html: string): SeoValidationResult {
        const errors: string[] = [];
        const $ = cheerio.load(html);

        if ($('h1').length === 0) errors.push('Falta el título H1');
        if ($('h1').length > 1) errors.push('Hay más de un título H1');
        if ($('title').length === 0) errors.push('Falta el tag <title>');

        // Verificar bloques críticos
        if ($('#servicios').length === 0) errors.push('Falta la sección de servicios');

        return {
            valid: errors.length === 0,
            errors
        };
    }
}