import { TaskOrchestrator } from './src/orchestrator/orchestrator.js';

const orchestrator = new TaskOrchestrator();

async function runTest() {
    console.log('🚀 Starting end-to-end test for Cerrajeros in Madrid...');
    try {
        const jobId = await orchestrator.startMission(
            'Cerrajeros', 
            ['Madrid'], 
            'publish', 
            { 
                mode: 'publish', // Full production mode for real validation
                site_type: 'static'
            }
        );
        console.log(`✅ Mission started with ID: ${jobId}`);
    } catch (err) {
        console.error('❌ Failed to start mission:', err);
    }
}

runTest();
