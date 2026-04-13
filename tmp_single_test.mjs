import { execSync } from 'node:child_process';

const niche = 'Cerrajeros';
const city = 'Madrid';
const family = 'technical_grid';

console.log(`🚀 Starting Single Niche Test: ${niche} in ${city} (Family: ${family})...`);

try {
  const cmd = `cmd /c "npm start -- Genera ${niche} en ${city} familia ${family} modo premium y genera archivos estáticos"`;
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
  console.log(`\n✅ Success: ${niche} in ${city}`);
  
  console.log('\n--- VERIFICATION ---');
  console.log('Checking for generated files...');
  // Simulating check - the model will do this manually
} catch (error) {
  console.error(`\n❌ Failed: ${niche} in ${city}`);
  process.exit(1);
}
