import { TaskOrchestrator } from '../src/orchestrator/orchestrator.js';
import { dbManager } from '../src/db/index.js';

async function main() {
    const orchestrator = new TaskOrchestrator();
    
    // Prompt extremadamente específico y claro, sin preposiciones ambiguas
    const prompt = "crea una página de cerrajeros en Getafe";
    
    console.log(`🚀 Iniciando prueba de flujo con PROMPT CLARO: "${prompt}"`);
    console.log(`----------------------------------------------------------`);

    try {
        const result = await orchestrator.executeCommand(prompt, 'draft', {
            debug_mode: true,
            site_type: 'static'
        });

        if (result.success) {
            console.log(`✅ Comando enviado con éxito. JobId: ${result.jobId}`);
            console.log(`⏳ Esperando a que el pipeline termine la misión...`);
            
            // Esperar un poco para ver los primeros logs
            const db = await dbManager.getDB();
            let completed = false;
            let lastStatus = '';
            
            while (!completed) {
                const mission = await db.get('SELECT status FROM missions WHERE id = ?', [result.jobId]);
                if (mission) {
                    if (mission.status !== lastStatus) {
                        console.log(`[STATUS] ${mission.status}`);
                        lastStatus = mission.status;
                    }
                    if (['COMPLETED', 'FAILED', 'ERROR'].includes(mission.status)) {
                        completed = true;
                        
                        // Ver el score final si existe
                        const review = await db.get('SELECT score FROM learning_output_reviews WHERE mission_id = ?', [result.jobId]);
                        if (review) {
                            console.log(`🏆 SCORE FINAL: ${review.score}/100`);
                        }
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } else {
            console.error(`❌ El orquestador rechazó el comando:`, result.message);
        }
    } catch (err) {
        console.error(`💥 Error en el test:`, err);
    }
}

main().catch(console.error);
