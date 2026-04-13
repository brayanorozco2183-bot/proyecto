import { execSync } from 'node:child_process';

const missions = [
  { niche: 'Carpinteros', city: 'Barcelona', family: 'local_trust' },
  { niche: 'Cerrajeros', city: 'Madrid', family: 'technical_grid' },
  { niche: 'Electricistas', city: 'Valencia', family: 'asymmetric_premium' },
  { niche: 'Fontaneros', city: 'Sevilla', family: 'minimal_authority' },
  { niche: 'Pintores', city: 'Bilbao', family: 'editorial' }
];

console.log('🚀 Starting Premium Bulk Generation of 5 Niches...');

for (const mission of missions) {
  console.log(`\n--- Generating: ${mission.niche} in ${mission.city} (Family: ${mission.family}) ---`);
  try {
    const cmd = `cmd /c "npm start -- Genera ${mission.niche} en ${mission.city} familia ${mission.family} modo premium y genera archivos estáticos"`;
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ Success: ${mission.niche} in ${mission.city}`);
  } catch (error) {
    console.error(`❌ Failed: ${mission.niche} in ${mission.city}`);
  }
}

console.log('\n✨ Bulk Generation Finalized.');
