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

// 1. Tipeo "Humano" con errores aleatorios y borrados
async function humanType(page: Page, selector: string, text: string) {
    await page.click(selector, { force: true });
    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // Simular un error tipográfico ocasional (3% de probabilidad)
        if (Math.random() < 0.03 && /[a-z]/i.test(char)) {
            const wrongChars = 'abcdefghijklmnopqrstuvwxyz';
            const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];
            await page.keyboard.press(wrongChar);
            await delay(100, 250);

            // Reacción humana: pausa, luego borra
            await delay(200, 500);
            await page.keyboard.press('Backspace');
            await delay(150, 300);
        }

        // Escribir el carácter correcto
        await page.keyboard.press(char);

        // Retrasos dinámicos entre teclas (humanizando la cadencia)
        let typeDelay = Math.random() < 0.2 ? delay(150, 400) : delay(50, 120);
        await typeDelay;
    }
}

// 2. Comportamiento Errático: Calentar la cookie
async function warmupSession(page: Page, cursor: any) {
    console.log("🔥 Calentando sesión (Human Behavior Warmup)...");
    try {
        await page.goto('https://es.wikipedia.org/wiki/Especial:Aleatoria', { waitUntil: 'domcontentloaded' });
        await delay(2000, 4000);

        // Movimiento curvo del ratón con ghost-cursor
        await cursor.move({ x: Math.random() * 800 + 200, y: Math.random() * 600 + 200 });

        // Scroll aleatorio simulando que lee
        await page.mouse.wheel(0, 300 + Math.random() * 500);
        await delay(1500, 3000);
        await page.mouse.wheel(0, -200 + Math.random() * -300);
        await delay(1000, 2000);

        console.log("🔥 Calentamiento completado.");
    } catch (e) {
        console.log("⚠️ Fallo leve en warmup, continuando...");
    }
}

async function runRealAudit() {
    console.log("🚀 INICIANDO MODO DIOS 2026: FINGERPRINT HUMANO Y BEHAVIORAL AI");

    const userDataDir = path.join(process.cwd(), '.bot_profiles', 'pilot_session');
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }

    let context;
    try {
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            channel: 'chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled' // Evasión extra de flag de automatización
            ],
            ignoreDefaultArgs: ['--enable-automation'] // Ocultar bandera de automatización superior
        });
    } catch (e: any) {
        console.error("❌ OTRA VENTANA DE CHROME ESTÁ ABIERTA. Ciérrala y vuelve a intentarlo.");
        return;
    }

    let report = "# Auditoría 2026 (Behavioral AI): Cerrajeros Donostia\\n\\n";
    const page = await context.newPage();

    // FACADE completa para ghost-cursor (Puppeteer Compatibility Layer)
    const patchElement = (el: any) => {
        if (!el) return el;
        if (el.asElement) return el;
        el.asElement = () => el;
        el.remoteObject = () => ({ objectId: 'fake-id' });
        return el;
    };

    // FACADE completa para ghost-cursor (Puppeteer Compatibility Layer)
    (page as any).browser = () => ({
        userAgent: async () => await page.evaluate(() => navigator.userAgent),
        version: async () => '120.0',
        isConnected: () => true
    });

    (page as any).target = () => ({
        _targetId: 'dummy-target-id',
        _targetInfo: { browserName: 'chrome' }
    });

    const _orig$ = page.$;
    (page as any).$ = async (s: string) => patchElement(await _orig$.call(page, s));
    const _orig$$ = page.$$;
    (page as any).$$ = async (s: string) => {
        const res = await _orig$$.call(page, s);
        return res.map(patchElement);
    };

    (page as any)._client = () => ({
        send: async (method: string, params: any) => {
            console.log(`   [CDP DEBUG] Método: ${method}`);
            if (method === 'Browser.getWindowForTarget') {
                return { bounds: { width: 1280, height: 720 } };
            }
            if (method === 'DOM.getContentQuads') {
                // Fallback a Playwright bounding box
                return { quads: [[0, 0, 100, 0, 100, 100, 0, 100]] };
            }
            return {};
        }
    });

    const cursor = createCursor(page as any);
    const _origCursorMove = (cursor as any).move;
    (cursor as any).move = async (selector: any, options: any) => {
        if (typeof selector === 'string') return await _origCursorMove.call(cursor, selector, options);
        return await _origCursorMove.call(cursor, patchElement(selector), options);
    };

    try {
        // Fase 1: Calentamiento
        await warmupSession(page, cursor);

        // Fase 2: Ir a Google
        console.log("➡️  Navegando a Google.es...");
        await page.goto("https://www.google.es", { waitUntil: 'domcontentloaded' });
        await delay(1500, 3000);

        // Manejar el popup de cookies de Google con ghost-cursor
        const consentButton = await page.$('button:has-text("Aceptar todo"), button#L2AGLb, button#W0wltc');
        if (consentButton) {
            console.log("   - Aceptando cookies con movimiento curvo...");
            await cursor.click(consentButton as any);
            await delay(2000, 3000); // Esperar a que el modal desaparezca
        }

        // Fase 3: Búsqueda humanizada
        console.log("➡️  Esquivando Behavioral Detection: Tipeando con errores...");
        const searchInputStr = 'textarea[title="Buscar"], input[name="q"], textarea[name="q"]';
        await page.waitForSelector(searchInputStr, { timeout: 10000 });

        // Mover el ratón hacia el campo de forma natural
        await (cursor as any).move(searchInputStr);
        await page.click(searchInputStr, { force: true }); // Usamos click nativo forzado si algo intercepta
        await humanType(page, searchInputStr, 'cerrajeros Donostia');

        await delay(500, 1500); // Pequeña pausa antes de dar enter
        await page.keyboard.press('Enter');
        try {
            await page.waitForSelector('div.g, #search', { timeout: 15000 });
        } catch (e) {
            console.log("⚠️ Timeout esperando resultados, verificando estado...");
        }

        // Simular que el usuario procesa la SERP (mover ratón aleatoriamente)
        await delay(1500, 3000);
        await (cursor as any).move({ x: 300 + Math.random() * 200, y: 400 + Math.random() * 200 });
        await page.mouse.wheel(0, 400); // Ligerísimo scroll para ver los primeros
        await delay(2000, 4000);

        console.log("➡️  Extrayendo resultados orgánicos de Google...");
        let serpResults: any[] = [];
        try {
            serpResults = (await page.evaluate(() => {
                const items: { title: string, link: string }[] = [];
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
            })) || [];
        } catch (evaluateError) {
            console.error("❌ Error en page.evaluate (SERP):", evaluateError);
            serpResults = [];
        }

        if (serpResults.length === 0) {
            console.log("❌ Bloqueo en Google. Cambió layout o CAPTCHA infranqueable.");
            console.log("   URL actual:", page.url());
            const content = await page.content();
            require('fs').writeFileSync('debug_google.html', content);
            report += `## Error crítico en SERP.\\nURL: ${page.url()}\\nVer debug_google.html para detalles.`;
        } else {
            console.log(`✅ ${serpResults.length} resultados orgánicos encontrados.`);
            report += "## Top Orgánico Encontrado (Behavioral AI Bypass):\\n";
            serpResults.forEach((r, i) => report += `${i + 1}. [${r.title}](${r.link})\\n`);
            report += "\\n---\\n\\n## Análisis de Sitios\\n\\n";

            for (let i = 0; i < serpResults.length; i++) {
                const comp = serpResults[i];
                console.log(`\\n[${i + 1}] Entrando a: ${comp.title}`);

                try {
                    await page.goto(comp.link, { waitUntil: 'domcontentloaded', timeout: 25000 });
                    await delay(3000, 5000); // Simular lectura humana de la página destino
                    await page.mouse.wheel(0, 600); // Hacemos scroll
                    await delay(1500, 3000);

                    const audit = await page.evaluate(() => {
                        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '').filter(h => h.length > 0);
                        const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim() || '').filter(h => h.length > 0);
                        const text = document.body.innerText || '';
                        const wordCount = text.split(/\s+/).filter(w => w.length > 2).length;
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
                    report += `- *Error al scrapearlo.*\\n\\n`;
                }
            }
        }

    } catch (e: any) {
        console.error("❌ Fallo general durante la ejecución:", e);
        report += `\\n\\n**ERROR CRÍTICO:** ${e.message}\\n`;
    } finally {
        if (context) await context.close();
    }

    fs.writeFileSync('C:\\\\Users\\\\Jorge\\\\.gemini\\\\antigravity\\\\brain\\\\b423d34c-80fb-4997-aad0-5dc3bbae76ed\\\\auditoria_real_2026.md', report, 'utf-8');
    console.log("\\n✅ Informe guardado en auditoria_real_2026.md");
}

runRealAudit();
