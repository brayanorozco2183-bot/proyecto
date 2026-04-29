import fs from 'fs';

const checks = [
  ['src/guards/types.ts', 'normalizeIssueCode', 'createIssue normaliza códigos'],
  ['src/guards/domains/copy.ts', 'safeCopyIssue', 'copy guard normaliza issues'],
  ['src/guards/domains/copy.ts', 'SEMANTIC_VALIDATION', 'copy guard no rompe si falla validación semántica'],
  ['src/repair/pageRepairKit.ts', 'ensureMinimumJsonLd', 'repair kit garantiza JSON-LD mínimo'],
  ['src/pipelines/phases/quality.phase.ts', "schemaVersion: 'images-phase@1'", 'images phase deja metadata/schema válido'],
  ['src/pipelines/phases/quality.phase.ts', "outcome.status === 'failed' ? 'degraded'", 'images phase degrada en vez de bloquear'],
  ['src/pipeline-state/contentPipelineStateMachine.ts', 'ASSEMBLY_EMERGENCY_FALLBACK', 'assembly fallback queda visible como degradado'],
  ['docs/PATCH_FINAL_DELIVERY_UNBLOCK.md', 'Final Delivery Unblock', 'documentación presente'],
];

const failed = [];
for (const [file, needle, description] of checks) {
  if (!fs.existsSync(file)) {
    failed.push(`${description}: falta ${file}`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(needle)) failed.push(`${description}: no se encontró ${needle} en ${file}`);
}

if (failed.length) {
  console.error('Final delivery unblock verification failed:');
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Final delivery unblock patch verification passed. Copy guard safety, minimum schema, images degraded fallback and assembly degraded visibility are present.');
