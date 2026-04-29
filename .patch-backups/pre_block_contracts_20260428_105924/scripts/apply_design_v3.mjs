import fs from 'fs';
import path from 'path';

const root = process.cwd();
const patchDir = 'parche/gravity_design_v3_patch';

const files = [
    'src/config/visualIdentityContracts.ts',
    'src/types/design.ts',
    'src/agents/artDirectorAgent.ts',
    'src/agents/layoutComposerAgent.ts',
    'src/design-system/procedural-engine.ts'
];

files.forEach(file => {
    const src = path.join(root, patchDir, file);
    const dst = path.join(root, file);
    
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    
    // Backup existing file if any
    if (fs.existsSync(dst)) {
        fs.copyFileSync(dst, dst + '.bak_design_v3');
    }
    
    fs.copyFileSync(src, dst);
    console.log(`[Design V3] Copiado: ${file}`);
});

console.log('\n[Design V3] Parche aplicado con éxito.');
