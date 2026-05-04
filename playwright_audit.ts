import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import os from 'os';
import path from 'path';

chromium.use((stealthPlugin as any)());

async function runRealAudit() {
    console.log("🚀 LEYENDO DATOS REALES CON TU SESIÓN DE GOOGLE (HUMANO ON)");

    // Usaremos el directorio de datos de usuario de Chrome estándar en Windows
    const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');

    // IMPORTANTE: Asegúrate de que todas tus ventanas normales de Chrome estén cerradas antes de lanzar esto
    // Si no las cierras, Playwright lanzará un error porque la base de datos del perfil estará bloqueada.
    console.log("⚠️ Asegúrate de tener Chrome completamente cerrado antes de continuar.");

    let context;
    try {
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            channel: 'chrome', // Usar el Chrome instalado en el sistema
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    } catch (e: any) {
        console.error("❌ Error al cargar tu perfil de Chrome. Por favor, CIERRA TODAS las ventanas de Chrome de tu ordenador y vuelve a ejecutar el script.");
        return;
    }

    let report = "# Auditoría Definitiva y Real: Cerrajeros Donostia\\n\\n";

    const page = await context.newPage();
    try {
        console.log("➡️  Navegando a Google.es (como humano)...");
        await page.goto("https://www.google.es", { waitUntil: 'domcontentloaded' });

        // Pausa super larga para que el sistema antispam no salte
        await page.waitForTimeout(3000 + Math.random() * 2000);
        const consentButton = await page.$('button:has-text("Aceptar todo"), button:has-text("Acepto"), button#W0wltc');
        if (consentButton) {
            console.log("   - Aceptando cookies de Google...");
            await consentButton.click();
            await page.waitForTimeout(1000);
        }

        console.log("➡️  Buscando 'cerrajeros Donostia' en Google...");
        await page.fill('textarea[title="Buscar"], input[name="q"], textarea[name="q"]', 'cerrajeros Donostia');
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        console.log("➡️  Extrayendo resultados orgánicos de Google...");
        const serpResults = await page.evaluate(() => {
            const items: { title: string, link: string }[] = [];
            // Google usa div.g para agrupar resultados orgánicos (evitando anuncios)
            document.querySelectorAll('div.g').forEach((el) => {
                if (items.length >= 5) return;
                const linkEl = el.querySelector('a');
                const titleEl = el.querySelector('h3');
                if (linkEl && titleEl) {
                    const link = linkEl.getAttribute('href');
                    const title = titleEl.textContent;
                    if (link && link.startsWith('http') && title) {
                        items.push({ title: title.trim(), link: link.trim() });
                    }
                }
            });
            return items;
        });

        if (serpResults.length === 0) {
            console.log("❌ Bloqueo en Google (Captcha/WAF) o cambio de layout.");
            report += "## Error: Google detectó el bot o bloqueó la SERP.\\n";
        } else {
            console.log(`✅ ${serpResults.length} resultados orgánicos encontrados.`);
            report += "## Top Orgánico Encontrado (Google):\\n";
            serpResults.forEach((r, i) => report += `${i + 1}. [${r.title}](${r.link})\\n`);
            report += "\\n---\\n\\n## Análisis de Sitios\\n\\n";

            for (let i = 0; i < serpResults.length; i++) {
                const comp = serpResults[i];
                console.log(`\\n[${i + 1}] Entrando a: ${comp.title}`);
                console.log(`    URL: ${comp.link}`);

                try {
                    await page.goto(comp.link, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await page.waitForTimeout(3000);

                    const audit = await page.evaluate(() => {
                        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '').filter(h => h.length > 0);
                        const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim() || '').filter(h => h.length > 0);
                        const text = document.body.innerText || '';
                        const wordCount = text.split(/\\s+/).filter(w => w.length > 2).length;
                        return { h1s, h2s: h2s.slice(0, 5), wordCount };
                    });

                    console.log(`    ✅ Palabras: ~${audit.wordCount}`);
                    console.log(`    ✅ H1: ${audit.h1s.join(' | ') || 'Ninguno'}`);

                    report += `### ${i + 1}. ${comp.title}\\n`;
                    report += `- **URL:** ${comp.link}\\n`;
                    report += `- **Volumen de Texto:** ~${audit.wordCount} palabras\\n`;
                    report += `- **H1:** ${audit.h1s.join(' | ') || '*Ninguno*'}\\n`;
                    report += `- **Top H2s:**\\n`;
                    if (audit.h2s.length === 0) report += "  - *Sin H2s detectados*\\n";
                    audit.h2s.forEach(h => report += `  - ${h}\\n`);
                    report += "\\n";

                } catch (navErr: any) {
                    console.log(`    ❌ Fallo al cargar sitio: ${navErr.message.substring(0, 80)}`);
                    report += `### ${i + 1}. ${comp.title}\\n`;
                    report += `- **URL:** ${comp.link}\\n`;
                    report += `- *Error al scrapearlo (AntiBot / Timeout).*\\n\\n`;
                }
            }
        }

    } catch (e: any) {
        console.error("❌ Fallo general durante la ejecución de Playwright:", e);
        report += `\\n\\n**ERROR CRÍTICO:** ${e.message}\\n`;
    } finally {
        if (context) {
            await context.close();
        }
    }

    fs.writeFileSync('C:\\\\Users\\\\Jorge\\\\.gemini\\\\antigravity\\\\brain\\\\b423d34c-80fb-4997-aad0-5dc3bbae76ed\\\\auditoria_real_playwright.md', report, 'utf-8');
    console.log("\\n✅ Informe guardado en auditoria_real_playwright.md");
}

runRealAudit();
