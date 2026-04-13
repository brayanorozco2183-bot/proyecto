import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * The SecureVault ensures all critical credentials and configurations 
 * are validated and safely accessible.
 */
const configSchema = z.object({
    OLLAMA_URL: z.string().default('http://localhost:11434'),
    OLLAMA_MODEL_RESEARCH: z.string().default('qwen2.5:latest'),
    OLLAMA_MODEL_COPY: z.string().default('qwen2.5:latest'),
    DATABASE_PATH: z.string().default('./maestro.db'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    WP_APPLICATION_PASSWORD: z.string().optional(),
    SERP_API_KEY: z.string().optional(),
    DEBUG_MODE: z.coerce.boolean().default(true),
});

export type Config = z.infer<typeof configSchema>;

export class SecureVault {
    private static config: Config;

    static load(): Config {
        if (!this.config) {
            const result = configSchema.safeParse(process.env);
            if (!result.success) {
                console.error('Core Configuration Error:', result.error.format());
                process.exit(1);
            }
            this.config = result.data;
            console.log('[SecureVault] Configuration loaded and validated.');
        }
        return this.config;
    }
}

export const vault = SecureVault.load();