import { DatabaseLike } from './types.js';
import { installEditorialMemorySchema } from './editorialMemory.js';
import { installSiteStructureMemorySchema } from './siteStructureMemory.js';
import { installVisualMemorySchema } from './visualMemory.js';

export async function installOriginalitySchema(db: DatabaseLike): Promise<void> {
  await installVisualMemorySchema(db);
  await installEditorialMemorySchema(db);
  await installSiteStructureMemorySchema(db);
}