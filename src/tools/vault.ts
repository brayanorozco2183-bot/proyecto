import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const boolish = z.preprocess((val) => val === 'true' || val === '1', z.boolean());
const optionalNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return Number(val);
}, z.number().optional());

const configSchema = z.object({
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL_RESEARCH: z.string().default('qwen2.5:1.5b'),
  OLLAMA_MODEL_COPY: z.string().default('qwen2.5:latest'),
  OLLAMA_MODEL_FAST: z.string().default('qwen2.5:1.5b'),
  OLLAMA_MODEL_STANDARD: z.string().default('qwen2.5:1.5b'),
  OLLAMA_MODEL_PREMIUM: z.string().default('qwen2.5:latest'),
  OLLAMA_MODEL_CODER: z.string().default('qwen2.5-coder:1.5b'),
  WRITER_TIMEOUT_MS: z.coerce.number().default(600000),
  WRITER_RETRY_TIMEOUT_MS: z.coerce.number().default(300000),
  ARCHITECT_TIMEOUT_MS: z.coerce.number().default(300000),
  CORRECTOR_TIMEOUT_MS: z.coerce.number().default(300000),
  ANALYST_TIMEOUT_MS: z.coerce.number().default(300000),
  COHERENCE_TIMEOUT_MS: z.coerce.number().default(300000),
  QUALITY_TIMEOUT_MS: z.coerce.number().default(300000),
  MODEL_ROUTER_ENABLED: boolish.default(true),
  MODEL_ROUTER_PROFILE: z.string().default('auto'),
  AGENT_MODEL_OVERRIDES_JSON: z.string().default('{}'),
  OLLAMA_PREFLIGHT_ENABLED: boolish.default(true),
  OLLAMA_MODEL_ALIAS_JSON: z.string().default('{}'),
  GPU_VRAM_GB: optionalNumber.default(0),
  TOTAL_RAM_GB_OVERRIDE: optionalNumber,
  AGENT_PROMPTS_DIR: z.string().default('./prompts/agents'),
  AGENT_MEMORY_ENABLED: boolish.default(true),
  AGENT_MEMORY_MAX_LESSONS: z.coerce.number().default(5),

  DATABASE_PATH: z.string().default('./maestro.db'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  WP_APPLICATION_PASSWORD: z.string().optional(),
  SERP_API_KEY: z.string().optional(),
  DEBUG_MODE: boolish.default(false),
  AI_FACADE_ALLOW_MOCKS: boolish.default(false),
  AI_FACADE_TIMEOUT_MS: z.coerce.number().default(600000),
  AI_FACADE_FAILURE_COOLDOWN_MS: z.coerce.number().default(15000),
  FAIL_ON_DEGRADED_PLAN: boolish.default(false),
  QUALITY_AUDIT_FAIL_OPEN: boolish.default(false),
  DASHBOARD_AUTH_TOKEN: z.string().optional(),
  DASHBOARD_ALLOWED_ORIGINS: z.string().default('http://localhost:8081,http://127.0.0.1:8081'),

  COMFY_ENABLED: boolish.default(false),
  COMFY_BASE_URL: z.string().default('http://127.0.0.1:8188'),
  COMFY_CHECKPOINT: z.string().default(''),
  COMFY_UNET_MODEL: z.string().default('flux1-schnell-Q2_K.gguf'),
  COMFY_CLIP_MODEL: z.string().default('clip_l.safetensors'),
  COMFY_T5_MODEL: z.string().default('t5xxl_fp8_e4m3fn.safetensors'),
  COMFY_VAE_MODEL: z.string().default('flux-vae-bf16.safetensors'),
  COMFY_OUTPUT_DIR: z.string().default('./assets_generated/page-images'),
  COMFY_PUBLIC_BASE_URL: z.string().default('/assets_generated/page-images'),
  COMFY_POLL_INTERVAL_MS: z.coerce.number().default(5000),
  COMFY_MAX_WAIT_MS: z.coerce.number().default(1200000),
  COMFY_WORKFLOW_HERO: z.string().default('./workflows/comfy/flux2-klein-hero.json'),
  COMFY_WORKFLOW_EDITORIAL: z.string().default('./workflows/comfy/flux2-klein-editorial.json'),
  COMFY_FORCE_LOCAL_REALISM: boolish.default(true),
  COMFY_NEGATIVE_PROMPT: z.string().default('text, watermark, logo, deformed hands, extra fingers, duplicated tools, blurry, oversaturated, low quality, cgi, cartoon, 3d render, illustration'),

  COMFY_LORA_ENABLED: boolish.default(false),
  COMFY_LORA_MAX_PER_IMAGE: z.coerce.number().default(2),
  COMFY_LORA_DEFAULT_STRENGTH: z.coerce.number().default(0.8),
  COMFY_LORA_DEFAULT_CLIP_STRENGTH: z.coerce.number().default(0.8),
  COMFY_LORA_STRICT_MODE: boolish.default(false),
  COMFY_LORA_RULES_JSON: z.string().default('{}'),

  PIPELINE_FAST_DEBUG: boolish.default(false),
  PIPELINE_SOFT_MODE: boolish.default(false),
  FORCE_DETERMINISTIC_PLANNING: boolish.default(false),
  QUALITY_GATE_FORCE_PASS: boolish.default(false),
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