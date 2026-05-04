import { chromium } from 'playwright-extra';
import { Page } from 'playwright';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
// @ts-ignore
import { createCursor } from 'ghost-cursor';
import fs from 'fs';
import os from 'os';
import path from 'path';

chromium.use((stealthPlugin as any)());

async function delay(min: number, max: number) {
    const ms = Math.floor(Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function humanType(page: Page, selector: string, text: string) {
    await page.click(selector, { force: true });
    for (const char of text) {
        if (Math.random() < 0.03 && /[a-z]/i.test(char)) {
            const wrongChars = 'abcdefghijklmnopqrstuvwxyz';
            const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
            await page.keyboard.press(wrongChar);
            await delay(100, 250);
            await delay(200, 500);
            await page.keyboard.press('Backspace');
            await delay(150, 300);
        }
        await page.keyboard.press(char);
        await (Math.random() < 0.2 ? delay(150, 400) : delay(50, 120));
    }
}

async function warmupSession(page: Page, cursor: any) {
    console.log("🔥 Calentando sesión (Human Behavior Warmup)...");
    try {
        await page.goto('https://es.wikipedia.org/wiki/Especial:Aleatoria', { waitUntil: 'domcontentloaded' });
        await delay(2000, 4000);
        await cursor.move({ x: Math.random() * 800 + 200, y: Math.random() * 600 + 200 });
        await page.mouse.wheel(0, 300 + Math.random() * 500);
        await delay(1500, 3000);
        console.log("🔥 Calentamiento completado.");
    } catch (e) {
        console.log("⚠️ Fallo leve en warmup, continuando...");
    }
}

async function runRealAudit() {
    console.log("🚀 INICIANDO MODO DIOS 2026: FINGERPRINT HUMANO Y BEHAVIORAL AI");

    const userDataDir = path.join(process.cwd(), '.bot_profiles', 'pilot_session_final');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    let context;
    try {
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            channel: 'chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
            ignoreDefaultArgs: ['--enable-automation']
        });
    } catch (e) {
        console.error("❌ Error al lanzar el contexto persistente.");
        return;
    }

    const page = await context.newPage();
    let report = "# Auditoría 2026 (Behavioral AI): Cerrajeros Donostia\\n\\n";

    // FACADE completa
    const patchElement = (el: any) => {
        if (!el) return el;
        if (el.asElement) return el;
        el.asElement = () => el;
        el.remoteObject = () => ({ objectId: 'fake' });
        return el;
    };
    (page as any).browser = () => ({ userAgent: async () => await page.evaluate(() => navigator.userAgent), version: async () => '120.0', isConnected: () => true });
    (page as any).target = () => ({ _targetId: 'fake', _targetInfo: { browserName: 'chrome' } });
    const _orig$ = page.$;
    (page as any).$ = async (s: string) => patchElement(await _orig$.call(page, s));
    (page as any)._client = () => ({
        send: async (method: string) => {
            if (method === 'Browser.getWindowForTarget') return { bounds: { width: 1280, height: 720 } };
            if (method === 'DOM.getContentQuads' || method === 'DOM.scrollIntoViewIfNeeded') return { quads: [[0, 0, 100, 0, 100, 100, 0, 100]] };
            return {};
        }
    });

    const cursor = createCursor(page as any);

    try {
        await warmupSession(page, cursor);
        console.log("➡️  Navegando a Google.es...");
        await page.goto("https://www.google.es", { waitUntil: 'domcontentloaded' });
        await delay(1500, 3000);

        console.log("➡️  Manejando consentimiento de Google...");
        // Intentar varios selectores conocidos para el botón de "Aceptar todo"
        const consentSelectors = [
            'button:has-text("Aceptar todo")',
            'button#L2AGLb',
            'button:has-text("Aceptar")',
            'div[role="none"] button:first-child',
            'button[aria-label="Aceptar todo"]'
        ];

        let consentFound = false;
        for (const selector of consentSelectors) {
            try {
                const btn = await page.$(selector);
                if (btn && await btn.isVisible()) {
                    console.log(`   - Botón encontrado (${selector}). Aplicando click curvo...`);
                    await (cursor as any).move(selector);
                    await btn.click({ force: true }); // Click nativo forzado para asegurar que cerramos el modal
                    consentFound = true;
                    break;
                }
            } catch (e) { }
        }

        if (consentFound) {
            await delay(2000, 4000);
            console.log("   - Consentimiento procesado.");
        } else {
            console.log("   - No se detectó botón de consentimiento (posible sesión limpia).");
        }

        console.log("➡️  Tipeando búsqueda...");
        const input = 'textarea[title="Buscar"], input[name="q"]';
        await page.waitForSelector(input);
        await (cursor as any).move(input);
        await humanType(page, input, 'cerrajeros Bilbao');
        await page.keyboard.press('Enter');

        try { await page.waitForSelector('div.g', { timeout: 15000 }); } catch (e) { console.log("⚠️ Resultados no detectados por selector div.g..."); }
        await delay(2000, 4000);

        const screenshotPath = `debug_serp_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath });
        console.log(`📸 Screenshot guardado: ${screenshotPath}`);

        console.log("➡️  Extrayendo datos...");
        const serpResults = await page.evaluate(() => {
            const items: any[] = [];
            const containers = document.querySelectorAll('div.g, div.MjjYud, .MjjYud');
            containers.forEach(el => {
                if (items.length >= 5) return;
                const h3 = el.querySelector('h3');
                const a = el.querySelector('a');
                if (h3 && a) {
                    const title = h3.textContent?.trim();
                    const link = a.getAttribute('href');
                    if (title && link && link.startsWith('http') && !link.includes('google.com/search')) {
                        items.push({ title, link });
                    }
                }
            });
            return items;
        }) as any[];

        if (!serpResults || serpResults.length === 0) {
            console.log("❌ Sin resultados encontrados.");
            report += "## Error: No se encontraron resultados.\\n";
        } else {
            console.log(`✅ ${serpResults.length} resultados.`);
            report += "## Resultados Encontrados:\\n";
            for (const r of serpResults) report += `- [${r.title}](${r.link})\\n`;

            for (let i = 0; i < serpResults.length; i++) {
                const comp = serpResults[i];
                console.log(`[${i + 1}] Analizando: ${comp.title}`);
                try {
                    await page.goto(comp.link, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await delay(3000, 5000);
                    const audit = await page.evaluate(() => {
                        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '');
                        const wordCount = (document.body.innerText || '').split(/\s+/).length;
                        return { h1s, wordCount };
                    });
                    report += `### ${comp.title}\\n- Palabras: ${audit.wordCount}\\n- H1: ${audit.h1s.join(', ')}\\n\\n`;
                } catch (e) {
                    report += `### ${comp.title}\\n- *Fallo al cargar*\\n\\n`;
                }
            }
        }
    } catch (e: any) {
        console.error("❌ Error fatal:", e.message);
        report += `\\n**ERROR:** ${e.message}`;
    } finally {
        await context.close();
    }

    fs.writeFileSync('C:\\\\Users\\\\Jorge\\\\.gemini\\\\antigravity\\\\brain\\\\b423d34c-80fb-4997-aad0-5dc3bbae76ed\\\\auditoria_real_2026.md', report);
    console.log("✅ FIN.");
}

runRealAudit();
