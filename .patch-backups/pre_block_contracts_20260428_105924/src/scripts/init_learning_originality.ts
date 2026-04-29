import { dbManager } from '../db/index.js';
import { ensureLearningSchema } from '../learning/learningService.js';
import { ensureOriginalitySchema } from '../originality/pipelineAdapters.js';

async function main() {
  await dbManager.getDB();
  await ensureOriginalitySchema();
  await ensureLearningSchema();
  console.log('[INIT] Learning + originality schemas ready.');
}

main().catch((error) => {
  console.error('[INIT] Failed:', error);
  process.exit(1);
});
