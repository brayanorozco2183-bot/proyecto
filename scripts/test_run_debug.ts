import { orchestrator } from '../src/orchestrator/orchestrator.js';

async function runTest() {
    console.log('--- STARTING EMERGENCY VERIFICATION MISSION (DEBUG MODE) ---');
    console.log('Target: Fontaneros en Getafe');
    
    try {
        const result = await orchestrator.executeCommand(
            'Lanza misión de fontaneros en Getafe modo debug',
            'publish',
            { 
                debug_mode: true,
                is_cluster: false,
                force: true // Ensure we don't skip phases if possible
            }
        );
        
        console.log('--- MISSION TRIGGERED ---');
        console.log('Result:', result.response);
        console.log('JobId:', result.jobId);
        
        // We exit because the orchestrator will handle the background worker if Redis is up,
        // or run synchronously if in failsafe (which is likely if Redis isn't configured).
    } catch (error) {
        console.error('--- MISSION FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

runTest();
