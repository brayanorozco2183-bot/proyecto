import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import { dbManager } from '../db/index.js';
import { registry } from '../orchestrator/registry.js';
import { LinguistAgent } from '../agents/linguist.js';
import { orchestrator } from '../orchestrator/orchestrator.js';
import { vault } from '../tools/vault.js';
import { SeoMasterLogic } from './seo-master-logic.js';
import fs from 'fs/promises';
import path from 'path';
import { dashboardSecurity, validateDashboardCommandPayload, validateAgentInteractPayload } from './security.js';
const getOrchestrator = async () => orchestrator;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(dashboardSecurity());
const PORT = process.env.DASHBOARD_PORT || 8081;

// Serve generated sites as static files at root
app.use(express.static(path.join(process.cwd(), 'output_sites')));


app.post('/api/command', async (req: Request, res: Response) => {
    const validation = validateDashboardCommandPayload(req.body);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });
    req.body = validation.value;
    const { command, publish_mode, site_type, is_cluster, scope, enable_wordpress, debug_mode } = req.body;

    const resolvedSiteType = site_type || 'static';
    const resolvedEnableWordpress = resolvedSiteType === 'wordpress' && enable_wordpress === true;

    console.log(
        `[Dashboard API] Command received: ${command} ` +
        `(mode: ${publish_mode}, type: ${resolvedSiteType}, wp: ${resolvedEnableWordpress}, cluster: ${is_cluster}, scope: ${scope}, debug: ${debug_mode})`
    );

    try {
        const orch = await getOrchestrator();
        const result = await orch.executeCommand(command, publish_mode || 'publish', {
            site_type: resolvedSiteType,
            enable_wordpress: resolvedEnableWordpress,
            is_cluster: is_cluster || false,
            scope: scope || 'auto',
            debug_mode: debug_mode || false
        });
        res.json(result);
    } catch (err: any) {
        const isInfraError = err.message.includes('Redis') || err.message.includes('offline');
        res.status(isInfraError ? 503 : 500).json({
            success: false,
            error: err.message,
            infra_offline: isInfraError
        });
    }
});

app.post('/api/command/stop', async (req: Request, res: Response) => {
    console.log(`[Dashboard API] Stop signal received`);
    try {
        const db = await dbManager.getDB();
        // Detenemos todas las misiones activas en la base de datos para que el orquestador (proceso separado) lo vea
        await db.run('UPDATE missions SET status = ? WHERE status IN (?, ?)', ['STOPPED', 'PROCESSING', 'PENDING']);
        
        const orch = await getOrchestrator();
        orch.stopAllMissions();
        res.json({ success: true, message: "⚠️ Señal de detención enviada a todas las misiones en curso." });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/stats', async (req: Request, res: Response) => {
    const db = await dbManager.getDB();
    const stats = await db.all('SELECT status, COUNT(*) as count FROM city_data GROUP BY status');
    res.json(stats);
});

app.get('/api/missions', async (req: Request, res: Response) => {
    const db = await dbManager.getDB();
    const missions = await db.all('SELECT c.*, m.niche FROM city_data c JOIN missions m ON c.mission_id = m.id ORDER BY c.id DESC LIMIT 50');
    res.json(missions);
});

app.get('/api/agents', (req: Request, res: Response) => {
    const agents = registry.getAllAgents().map(a => ({
        id: a.name,
        role: a.role,
        displayName: a.displayName,
        description: a.description
    }));
    res.json(agents);
});

app.get('/api/logs', async (req: Request, res: Response) => {
    const { agent, mission_id } = req.query;
    const db = await dbManager.getDB();
    let query = 'SELECT * FROM agent_logs';
    const params: any[] = [];

    if (agent || mission_id) {
        query += ' WHERE';
        if (agent) {
            query += ' agent_name = ?';
            params.push(agent);
        }
        if (mission_id) {
            if (agent) query += ' AND';
            query += ' mission_id = ?';
            params.push(mission_id);
        }
    }

    query += ' ORDER BY id DESC LIMIT 100';
    const logs = await db.all(query, params);
    res.json(logs);
});

app.post('/api/agent/interact', async (req: Request, res: Response) => {
    const validation = validateAgentInteractPayload(req.body);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });
    req.body = validation.value;
    const { role, input, sessionId: clientSessionId } = req.body;
    const sessionId = clientSessionId || `playground-${Date.now()}`;

    console.log(`[Dashboard API] Interactive session [${sessionId}] with agent: ${role}`);

    try {
        const agent = registry.getAgent(role);
        if (!agent) {
            return res.status(404).json({ success: false, error: `Agente con rol '${role}' no encontrado.` });
        }

        agent.setMissionId(sessionId);
        let finalInput = input;

        // --- SMART-INTERPRET: TRADUCCIÓN DE LENGUAJE NATURAL ---
        if (input && input.command) {
            console.log(`[Dashboard API] Smart-Interpret trigger for: "${input.command}"`);
            const linguist = new LinguistAgent();
            linguist.setMissionId(sessionId);
            const interpretation = await linguist.execute({ command: input.command });

            if (interpretation.success && interpretation.data) {
                // Mapeo inteligente según el agente destino
                if (role.includes('Strategic') || role.includes('SEO_Analyst')) {
                    finalInput = {
                        niche: interpretation.data.niche,
                        city: interpretation.data.locations[0] || "Valencia",
                        marketData: { localPack: [], organicLeaders: [], deepAudits: [] } // Mock data para modo interactivo
                    };
                } else if (role.includes('Author') || role.includes('Content_Architect')) {
                    finalInput = {
                        niche: interpretation.data.niche,
                        city: interpretation.data.locations[0] || "Valencia",
                        silo_structure: ["H1", "H2", "H3"],
                        word_count_target: 2000,
                        entities: []
                    };
                } else {
                    finalInput = interpretation.data;
                }
            }
        }

        const result = await agent.execute(finalInput);

        // --- BLINDAJE DE CONTENIDO POST-PROCESADO ---
        let stringified = JSON.stringify(result);
        const forbidden = [
            { regex: /ISO\s*9001/gi, replacement: 'Calidad Certificada' },
            { regex: /J\.?D\.?A\.?\s*cerrajero/gi, replacement: 'nuestros especialistas' },
            // Blindaje ultra-agresivo para capturar "1 año" o "6 meses" cerca de la palabra garantía o en tablas JSON
            { regex: /(garant.a.{1,40})(1|un|6|seis)\s*(a.o|mes|meses)/gi, replacement: '$1por escrito' },
            { regex: /(1|un|6|seis)\s*(a.o|mes|meses)\s*(de\s*)?garant.a/gi, replacement: 'garantía por escrito' },
            // Fallback para tablas técnicas donde el valor está separado de la etiqueta
            { regex: /"Garant.a"\s*:\s*"(1|un|6|seis)\s*(a.o|mes|meses)[^"]*"/gi, replacement: '"Garantía": "por escrito"' }
        ];

        forbidden.forEach(f => {
            stringified = stringified.replace(f.regex, f.replacement);
        });

        res.json({
            success: true,
            sessionId,
            result: JSON.parse(stringified)
        });
    } catch (err: any) {
        console.error(`[Dashboard API] Error in interaction:`, err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/agent/teach', async (req: Request, res: Response) => {
    const { agent_id, category, content } = req.body;
    console.log(`[Dashboard API] Teaching agent ${agent_id}: ${content.substring(0, 30)}...`);

    try {
        const db = await dbManager.getDB();
        await db.run(
            'INSERT INTO agent_knowledge (agent_id, category, content) VALUES (?, ?, ?)',
            [agent_id || 'global', category || 'general', content]
        );
        res.json({ success: true, message: "Conocimiento guardado correctamente." });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/agent/exemplar-stats', async (req: Request, res: Response) => {
    try {
        const db = await dbManager.getDB();
        const stats = await db.all('SELECT agent_name, COUNT(*) as total FROM learning_exemplars GROUP BY agent_name');
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/api/missions/active', async (req: Request, res: Response) => {
    try {
        const db = await dbManager.getDB();
        const mission = await db.get('SELECT * FROM missions WHERE status IN ("PROCESSING", "PENDING") ORDER BY created_at DESC LIMIT 1');
        res.json({ mission });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/api/missions/:id/cities', async (req: Request, res: Response) => {
    try {
        const db = await dbManager.getDB();
        const cities = await db.all('SELECT city, status, quality_score FROM city_data WHERE mission_id = ?', [req.params.id]);
        res.json(cities);
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/api/agent/knowledge', async (req: Request, res: Response) => {
    const { agent_id } = req.query;
    try {
        const db = await dbManager.getDB();
        let query = 'SELECT * FROM agent_knowledge';
        const params: any[] = [];
        if (agent_id) {
            query += ' WHERE agent_id = ? OR agent_id = "global"';
            params.push(agent_id);
        }
        const knowledge = await db.all(query, params);
        res.json(knowledge);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/agent/knowledge/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const db = await dbManager.getDB();
        await db.run('DELETE FROM agent_knowledge WHERE id = ?', [id]);
        res.json({ success: true, message: "Norma eliminada correctamente." });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/agent/knowledge-all', async (req: Request, res: Response) => {
    try {
        const db = await dbManager.getDB();
        await db.run('DELETE FROM agent_knowledge');
        res.json({ success: true, message: "Todo el conocimiento ha sido borrado." });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/settings', async (req: Request, res: Response) => {
    const db = await dbManager.getDB();
    const settings = await db.get('SELECT * FROM site_settings LIMIT 1');
    res.json(settings || {});
});

app.post('/api/settings', express.json(), async (req: Request, res: Response) => {
    const {
        site_url,
        auth_user,
        auth_pass,
        site_type,
        ftp_host,
        ftp_user,
        ftp_pass,
        ftp_port,
        ftp_path,
        enable_wordpress
    } = req.body;

    const db = await dbManager.getDB();
    await db.run('DELETE FROM site_settings');
    await db.run(
        `INSERT INTO site_settings 
        (site_url, auth_user, auth_pass, site_type, ftp_host, ftp_user, ftp_pass, ftp_port, ftp_path, enable_wordpress) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            site_url,
            auth_user,
            auth_pass,
            site_type || 'static',
            ftp_host,
            ftp_user,
            ftp_pass,
            ftp_port || 22,
            ftp_path,
            enable_wordpress ? 1 : 0
        ]
    );
    res.json({ success: true });
});

app.post('/api/test-connection', async (req: Request, res: Response) => {
    const { site_url, auth_user, auth_pass, site_type, enable_wordpress } = req.body;
    console.log(`[Dashboard API] Testing connection for ${site_url} (${site_type}, wp_enabled: ${enable_wordpress})`);

    if (site_type === 'wordpress' && enable_wordpress === true) {
        try {
            // Re-use bridge logic for handshake
            const auth = Buffer.from(`${auth_user}:${auth_pass}`).toString('base64');
            const response = await axios.get(`${site_url}/wp-json/wp/v2/users/me`, {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 8000
            });
            console.log(`[Dashboard API] WordPress success: ${response.data.name}`);
            res.json({ success: true, message: `Conexión exitosa. Usuario: ${response.data.name}` });
        } catch (err: any) {
            console.error(`[Dashboard API] WordPress error: ${err.message}`);
            res.status(401).json({ success: false, error: err.response?.data?.message || err.message });
        }
    } else {
        // Simple URL check for static sites + presence of FTP credentials
        const { ftp_host, ftp_user } = req.body;
        try {
            await axios.get(site_url);
            const msg = ftp_host && ftp_user
                ? "URL accesible y credenciales de despliegue configuradas."
                : "URL accesible. Nota: No se han configurado credenciales SFTP/FTP.";
            res.json({ success: true, message: msg });
        } catch (err) {
            res.status(400).json({ success: false, error: "La URL del sitio no es accesible." });
        }
    }
});

app.get('/api/health', async (req: Request, res: Response) => {
    const health: any = {
        ollama: { status: 'offline', model: vault.OLLAMA_MODEL_RESEARCH },
        redis: { status: 'offline', host: vault.REDIS_HOST },
        database: { status: 'online', path: vault.DATABASE_PATH }
    };

    // Check Ollama
    try {
        const ollamaRes = await axios.get(`${vault.OLLAMA_URL}/api/tags`, { timeout: 2000 });
        health.ollama.status = 'online';
        health.ollama.models = ollamaRes.data.models?.length || 0;
    } catch (e) {
        health.ollama.status = 'offline';
    }

    // Check Redis
    try {
        const orch = await getOrchestrator();
        health.redis.status = orch.isRedisConnected() ? 'online' : 'offline';
    } catch (e) {
        health.redis.status = 'offline';
    }
    res.json(health);
});

// --- SEO MASTER CONTROL CENTER ENDPOINTS ---

app.get('/api/seo-master/pages', async (req: Request, res: Response) => {
    try {
        const rootDir = 'output_sites';
        const sites = await fs.readdir(rootDir);
        const pages: string[] = [];

        for (const site of sites) {
            const sitePath = path.join(rootDir, site);
            const stat = await fs.stat(sitePath);
            if (stat.isDirectory()) {
                const files = await fs.readdir(sitePath);
                files.filter(f => f.endsWith('.html')).forEach(f => {
                    pages.push(`${site}/${f}`);
                });
            }
        }
        res.json(pages);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/seo-master/page-content', async (req: Request, res: Response) => {
    const { page } = req.query;
    if (!page) return res.status(400).json({ error: 'Page parameter is required' });

    try {
        const filePath = path.join('output_sites', page as string);
        const content = await fs.readFile(filePath, 'utf-8');
        const sections = SeoMasterLogic.parsePage(content);
        res.json({ sections, fullHtml: content });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/seo-master/save-page', async (req: Request, res: Response) => {
    const { page, updates } = req.body;
    if (!page || !updates) return res.status(400).json({ error: 'Page and updates are required' });

    try {
        const filePath = path.join('output_sites', page);
        const originalContent = await fs.readFile(filePath, 'utf-8');

        // Apply changes
        const updatedHtml = SeoMasterLogic.applyChanges(originalContent, updates);

        // Validate
        const validation = SeoMasterLogic.validate(updatedHtml);
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        // Backup
        const backupDir = path.join('backups', 'seo-master', path.dirname(page));
        await fs.mkdir(backupDir, { recursive: true });
        const backupPath = path.join(backupDir, `${path.basename(page)}.${Date.now()}.bak`);
        await fs.writeFile(backupPath, originalContent);

        // Save
        await fs.writeFile(filePath, updatedHtml);

        res.json({ success: true, message: 'Página guardada y validada correctamente.', backup: backupPath });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/seo-master/published', async (req: Request, res: Response) => {
    try {
        const db = await dbManager.getDB();
        const urls = await db.all('SELECT city, status, published_url FROM city_data WHERE published_url IS NOT NULL ORDER BY last_pulse_at DESC');

        const enhancedUrls = urls.map((target: any) => {
            let domain_url = target.published_url;
            if (target.status === 'STATIC_READY' || target.status === 'STATIC_ERROR') {
                const slug = target.city.toLowerCase().replace(/\s+/g, '-');
                const isPrimary = slug === 'valencia'; // Simplificación basada en el proyecto
                domain_url = isPrimary ? 'https://cerrajerobaratocerca.es' : `https://cerrajerobaratocerca.es/${slug}`;
            }
            return { ...target, domain_url };
        });

        res.json({ success: true, data: enhancedUrls });
    } catch (err: any) {
        console.error("[Dashboard API] Error fetching published URLs:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE several domains at once
app.post('/api/seo-master/bulk-delete-domains', async (req: Request, res: Response) => {
    const { cities } = req.body;
    if (!cities || !Array.isArray(cities)) {
        return res.status(400).json({ success: false, error: 'Cities array is required' });
    }
    
    if (cities.length === 0) {
        return res.json({ success: true, message: 'No había ciudades seleccionadas.' });
    }

    try {
        const db = await dbManager.getDB();
        // Construct the IN clause placeholders
        const placeholders = cities.map(() => '?').join(',');
        await db.run(
            `UPDATE city_data SET published_url = NULL, status = 'REMOVED' WHERE city IN (${placeholders})`,
            cities
        );
        console.log(`[Dashboard API] Bulk domains removed: ${cities.length} items`);
        res.json({ success: true, message: `${cities.length} dominios eliminados de producción.` });
    } catch (err: any) {
        console.error("[Dashboard API] Error in bulk delete:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE a specific domain/city from production list
app.delete('/api/seo-master/domain/:city', async (req: Request, res: Response) => {
    const { city } = req.params;
    if (!city) return res.status(400).json({ success: false, error: 'City parameter is required' });

    try {
        const db = await dbManager.getDB();
        const existing = await db.get('SELECT id FROM city_data WHERE city = ?', [city]);
        if (!existing) {
            return res.status(404).json({ success: false, error: `Domain for city "${city}" not found.` });
        }
        // Clear the published_url instead of deleting the row entirely, to preserve history
        await db.run('UPDATE city_data SET published_url = NULL, status = \'REMOVED\' WHERE city = ?', [city]);
        console.log(`[Dashboard API] Domain removed: ${city}`);
        res.json({ success: true, message: `Dominio "${city}" eliminado de producción.` });
    } catch (err: any) {
        console.error("[Dashboard API] Error deleting domain:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


app.use((err: any, req: Request, res: Response, next: any) => {
    console.error("[Dashboard API] Global Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error", details: err.message });
});

app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`[Dashboard API] Maestro Command Center v2.1 (Resiliencia & Lezo Fix)`);
    console.log(`[Dashboard API] Boot Time: ${new Date().toISOString()}`);
    console.log(`[Dashboard API] Listening on http://0.0.0.0:${PORT}`);
});