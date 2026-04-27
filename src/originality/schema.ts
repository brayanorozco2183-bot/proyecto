import { DatabaseLike } from './types.js';
import { installEditorialMemorySchema } from './editorialMemory.js';
import { installSiteStructureMemorySchema } from './siteStructureMemory.js';
import { installVisualMemorySchema } from './visualMemory.js';
import { installOriginalityReservationSchema } from './reservationMemory.js';
import { installDesignLearningSchema } from './designLearningMemory.js';

export async function installOriginalitySchema(db: DatabaseLike): Promise<void> {
  await installVisualMemorySchema(db);
  await installEditorialMemorySchema(db);
  await installSiteStructureMemorySchema(db);
  await installOriginalityReservationSchema(db);
  await installDesignLearningSchema(db);
}

