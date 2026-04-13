import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const outputDir = 'output_sites';

async function verify() {
    const sites = fs.readdirSync(outputDir).filter(f => fs.statSync(path.join(outputDir, f)).isDirectory());
    console.log(`Verificando ${sites.length} sitios en ${outputDir}...\n`);

    for (const site of sites) {
        const indexPath = path.join(outputDir, site, 'index.html');
        if (!fs.existsSync(indexPath)) {
            console.log(`❌ ${site}: index.html no encontrado.`);
            continue;
        }

        const html = fs.readFileSync(indexPath, 'utf-8');
        const $ = cheerio.load(html);

        const issues = [];

        // 1. Template Leaks
        const leaks = html.match(/\$\{[^}]+\}|\{{2,}[^{}]+\}{2,}|<%[^%]+%>/g) || [];
        if (leaks.length > 0) {
            issues.push(`Leaks detectados: ${[...new Set(leaks)].join(', ')}`);
        }

        // 2. High-Caps Placeholders
        const placeholders = html.match(/__[A-Z0-9_]+__/g) || [];
        if (placeholders.length > 0) {
            issues.push(`Placeholders detectados: ${[...new Set(placeholders)].join(', ')}`);
        }

        // 3. Structural Integrity
        if ($('h1').length !== 1) {
            issues.push(`H1 count: ${$('h1').length}`);
        }
        if ($('footer').length === 0) {
            issues.push(`Footer faltante`);
        }

        // 4. BEM Check (Not a failure, but interesting)
        const bemClasses = html.match(/class="[^"]*__[a-z][^"]*"/g) || [];
        
        if (issues.length === 0) {
            console.log(`✅ ${site}: TODO OK. (BEM classes: ${bemClasses.length})`);
        } else {
            console.log(`❌ ${site}:`);
            issues.forEach(i => console.log(`   - ${i}`));
        }
    }
}

verify();
