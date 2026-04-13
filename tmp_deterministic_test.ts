import { TaskOrchestrator } from './src/orchestrator/orchestrator.js';

const orchestrator = new TaskOrchestrator();

async function runTest() {
    console.log('🚀 Starting deterministic test for Carpinteros in Barcelona...');
    try {
        const jobId = await orchestrator.startMission(
            'Carpinteros', 
            ['Barcelona'], 
            'publish', 
            { 
                mode: 'sandbox', // Use sandbox to skip some gates if needed, or leave empty for full pipeline
                site_type: 'static'
            }
        );
        console.log(`✅ Mission started with ID: ${jobId}`);
    } catch (err) {
        console.error('❌ Failed to start mission:', err);
    }
}

runTest();
