import axios from 'axios';
import { vault } from './src/tools/vault.js';

async function testOllama() {
    console.log('--- Testing Ollama Connection ---');
    console.log('URL:', vault.OLLAMA_URL);
    console.log('Model:', vault.OLLAMA_MODEL_RESEARCH);
    
    try {
        const start = Date.now();
        const res = await axios.post(`${vault.OLLAMA_URL}/api/generate`, {
            model: vault.OLLAMA_MODEL_RESEARCH,
            prompt: 'Explain what a locksmith does in one sentence. Respond in JSON with key "explanation".',
            stream: false,
            format: 'json'
        }, { timeout: 30000 });
        
        console.log('Time taken:', Date.now() - start, 'ms');
        console.log('Response:', JSON.stringify(res.data.response));
    } catch (err: any) {
        console.error('Ollama test failed:', err.message);
    }
}

testOllama().catch(console.error);
