import { ContentGenerationPipeline } from '../pipelines/contentGenerationPipeline.js';
import fs from 'fs/promises';
import path from 'path';
import { extractExperimentMetrics } from './scoreExtractor.js';
import { prepareIsolatedMission } from './missionIsolation.js';

interface MissionResult {
    missionId: string;
    city: string;
    niche: string;
    score: number;
    status: string;
    metricSource: string;
    issueCodes: string[];
    timestamp: string;
}

const HISTORY_WINDOW = 10;
const resultsHistory: MissionResult[] = [];

function shouldCountAsDegradation(metrics: { valid: boolean; score: number; issueCodes: string[] }, maxScore: number): boolean {
    const criticalIssues = new Set(['CROSS_NICHE_POLLUTION','SYSTEM_LEAK_VISIBLE','SCHEMA_JSON_INVALID','SCHEMA_MISSING','INVALID_METRICS','PLACEHOLDER_OR_BROKEN_COPY','FAQ_SCHEMA_CONTENT_MISMATCH','MOBILE_VIEWPORT_MISSING','BROKEN_INTERNAL_INDEX_LINK','PRODUCTION_PLACEHOLDER_VISUAL','TECHNICAL_INTEGRITY_HARD_BLOCK']);
    if (!metrics.valid) return true;
    if (metrics.issueCodes.some((code) => criticalIssues.has(code))) return true;
    if (metrics.score < 65) return true;
    if (metrics.score >= 85) return false;
    return maxScore >= 90 && metrics.score < 80;
}

async function runBigExperiment() {
    console.log('=== INICIANDO EL GRAN EXPERIMENTO DE APRENDIZAJE (BLE V2.2 AISLADO) ===');

    const targets = [
        { city: 'Getafe', niches: ['cerrajeros', 'fontaneros', 'pintores'] },
        { city: 'Bilbao', niches: ['cerrajeros', 'fontaneros', 'carpinteros'] },
        { city: 'Alicante', niches: ['cerrajeros', 'pintores', 'electricistas'] }
    ];

    const pipeline = new ContentGenerationPipeline();
    let maxScore = 0;
    let consecutiveDrops = 0;
    const completedNiches: string[] = [];

    for (const target of targets) {
        for (const niche of target.niches) {
            console.log(`\n>>> Procesando: ${niche} en ${target.city}`);
            const missionId = `ble-v2-${target.city}-${niche}-${Date.now()}`;

            try {
                const isolation = await prepareIsolatedMission({
                    missionId,
                    niche,
                    city: target.city,
                    previousNiches: completedNiches
                });

                const result = await (pipeline as any).run({
                    missionId,
                    niche,
                    city: target.city,
                    debugMode: true,
                    forbiddenTerms: isolation.forbiddenTerms,
                    premiumContractBrief: isolation.premiumContractBrief,
                    local_nap: {
                        business_name: `${target.city} ${niche} Pro`,
                        address: `Calle Mayor 1, ${target.city}`,
                        phone: '910000000'
                    }
                }, {
                    timeoutMs: 0
                });

                const metrics = extractExperimentMetrics(result);
                if (!metrics.valid) {
                    console.error(`[INVALID_METRICS] ${metrics.reason}`);
                } else {
                    console.log(`[METRICS] score=${metrics.score} source=${metrics.sourcePath} qg=${metrics.qualityGateScore ?? 'n/a'} premium=${metrics.premiumScore ?? 'n/a'} issues=${metrics.issueCodes.join(',') || 'none'}`);
                }

                const missionRecord: MissionResult = {
                    missionId,
                    city: target.city,
                    niche,
                    score: metrics.score,
                    status: metrics.status,
                    metricSource: metrics.sourcePath || 'INVALID_METRICS',
                    issueCodes: metrics.issueCodes,
                    timestamp: new Date().toISOString()
                };

                resultsHistory.push(missionRecord);
                
                // Real-time CSV Logging
                const csvPath = path.join(process.cwd(), 'SUMMARY_BLE_V2.csv');
                const csvLine = `${missionRecord.timestamp},${missionRecord.missionId},${missionRecord.city},${missionRecord.niche},${missionRecord.score},${missionRecord.status},"${missionRecord.issueCodes.join('|')}"\n`;
                if (resultsHistory.length === 1) {
                    await fs.writeFile(csvPath, 'timestamp,missionId,city,niche,score,status,issues\n' + csvLine);
                } else {
                    await fs.appendFile(csvPath, csvLine);
                }

                completedNiches.push(niche);
                if (resultsHistory.length > HISTORY_WINDOW) resultsHistory.shift();

                console.log(`[RESULTADO] Score: ${metrics.score} | Status: ${metrics.status} | Registrado en CSV`);

                if (!metrics.valid) {
                    consecutiveDrops++;
                } else if (metrics.score > maxScore) {
                    maxScore = metrics.score;
                    consecutiveDrops = 0;
                    console.log(`[RECORD] Nuevo puntaje máximo alcanzado: ${maxScore}`);
                } else if (metrics.score < 65 || metrics.issueCodes.some(code => ['CROSS_NICHE_POLLUTION','SYSTEM_LEAK_VISIBLE','PLACEHOLDER_OR_BROKEN_COPY','FAQ_NUMBERING_ARTIFACT','SCHEMA_FAQ_NUMBERING_ARTIFACT','FAQ_SCHEMA_CONTENT_MISMATCH','MOBILE_VIEWPORT_MISSING','BROKEN_INTERNAL_INDEX_LINK','PRODUCTION_PLACEHOLDER_VISUAL','TECHNICAL_INTEGRITY_HARD_BLOCK','NICHE_CONTRACT_FORBIDDEN_TERM'].includes(code))) {
                    consecutiveDrops++;
                    console.log(`[WARNING] Bloqueo duro o score crítico. Caídas consecutivas: ${consecutiveDrops}`);
                } else if (metrics.score >= 85) {
                    consecutiveDrops = 0;
                    console.log('[BLE V2.2] Resultado premium/publicable; no se considera degradación por caída relativa.');
                } else if (metrics.score < 80) {
                    consecutiveDrops++;
                    console.log(`[WARNING] Resultado sub-premium. Caídas consecutivas: ${consecutiveDrops}`);
                }

                if (consecutiveDrops >= 5) { // Increased tolerance for big run
                    console.error('!!! DETENIENDO EXPERIMENTO: Degradación crítica persistente (5 misiones).');
                    break;
                }
            } catch (error: any) {
                console.error(`[ERROR] Fallo crítico en misión ${missionId}: ${error.message} - Saltando a la siguiente.`);
                // We record the failure in history too
                resultsHistory.push({
                    missionId, city: target.city, niche, score: 0, status: 'CRASHED', metricSource: 'SYSTEM_ERROR', issueCodes: ['CRASH_SKIP'], timestamp: new Date().toISOString()
                });
            }
        }
        if (consecutiveDrops >= 5) break;
    }

    console.log('\n=== EXPERIMENTO FINALIZADO ===');
    const successfulMissions = resultsHistory.filter(r => r.score > 0);
    const bestMission = successfulMissions.length > 0
        ? [...successfulMissions].sort((a, b) => b.score - a.score)[0]
        : null;

    const reportPath = path.join(process.cwd(), 'INFORME_FINAL_BLE_V2.md');
    const reportContent = `# Informe Final El Gran Experimento (BLE V2.2 Producción)

Fecha: ${new Date().toLocaleString()}
Total misiones intentadas: ${resultsHistory.length}
Misiones con éxito: ${successfulMissions.length}
Mejor Score alcanzado: ${bestMission?.score ?? 'N/A'}
Misión Ganadora: ${bestMission?.missionId || 'Ninguna'}

## Resumen Ejecutivo
El sistema BLE V2.2 operó con aislamiento de memoria de misión y contratos premium activos.

## Detalles del historial
${resultsHistory.map(r => `- ${r.timestamp} | ${r.missionId}: **${r.score}** (${r.status}) issues=${r.issueCodes.join(',') || 'none'}`).join('\n')}

---
*Generado automáticamente por Gravity BLE Pipeline V6.7*
`;

    await fs.writeFile(reportPath, reportContent);
    console.log(`Informe final guardado en: ${reportPath}`);
    console.log(`Resumen detallado disponible en: SUMMARY_BLE_V2.csv`);
}

runBigExperiment().catch(console.error);
