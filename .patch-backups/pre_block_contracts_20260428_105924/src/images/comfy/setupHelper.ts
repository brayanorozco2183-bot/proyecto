import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { vault } from '../../tools/vault.js';

async function safeModelList(baseUrl: string, family: string): Promise<string[]> {
    const endpoints = [`${baseUrl}/models/${family}`, `${baseUrl}/object_info`];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(endpoint, { timeout: 5000 });
            if (family !== 'object_info') {
                if (Array.isArray(response.data)) return response.data as string[];
            }

            const objectInfo = response.data || {};
            if (endpoint.endsWith('/object_info')) {
                const families = objectInfo?.LoadDiffusionModel?.input?.required?.model_name?.[0]
                    || objectInfo?.UNETLoader?.input?.required?.unet_name?.[0]
                    || objectInfo?.DualCLIPLoader?.input?.required?.clip_name1?.[0]
                    || objectInfo?.VAELoader?.input?.required?.vae_name?.[0]
                    || objectInfo?.LoraLoader?.input?.required?.lora_name?.[0]
                    || [];
                if (Array.isArray(families) && families.length) return families as string[];
            }
        } catch {
            // continue
        }
    }

    return [];
}

function checkWorkflowFile(label: string, filePath: string): void {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Workflow ${label} NO encontrado en ${filePath}`);
        return;
    }

    try {
        JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`✅ Workflow ${label} encontrado y es válido.`);
    } catch (e: any) {
        console.error(`❌ Workflow ${label} en ${filePath} tiene JSON corrupto: ${e.message}`);
    }
}

function parseConfiguredLoraNames(): string[] {
    const raw = String(vault.COMFY_LORA_RULES_JSON || '').trim();
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        const out = new Set<string>();

        for (const value of Object.values(parsed || {})) {
            if (!Array.isArray(value)) continue;
            for (const entry of value) {
                const name = String((entry as any)?.name || '').trim();
                if (name) out.add(name);
            }
        }

        return Array.from(out);
    } catch {
        return [];
    }
}

async function runSetupHelper() {
    console.log('\n===========================================');
    console.log('🚀 ComfyUI Readiness Helper for Gravity');
    console.log('===========================================\n');

    const baseUrl = vault.COMFY_BASE_URL.replace(/\/$/, '');

    console.log(`[Connect] Tentando conectar a ComfyUI en: ${baseUrl}...`);
    try {
        const stats = await axios.get(`${baseUrl}/system_stats`, { timeout: 3000 });
        if (stats.status === 200) {
            console.log('✅ ¡ComfyUI está ONLINE!');
            console.log(`   Versión/SO: ${(stats.data as any).system?.os || 'unknown'}`);
        }
    } catch (e: any) {
        console.error('❌ ERROR: No se puede conectar con ComfyUI.');
        console.log('   ¿Has arrancado el servidor de ComfyUI?');
        console.log(`   Error: ${e.message}`);
        return;
    }

    console.log('\n[Workflows] Comprobando archivos de flujo...');
    checkWorkflowFile('HERO', vault.COMFY_WORKFLOW_HERO);
    checkWorkflowFile('EDITORIAL', vault.COMFY_WORKFLOW_EDITORIAL);

    console.log('\n[Models] Comprobando modelos base...');
    const diffusionModels = await safeModelList(baseUrl, 'diffusion_models');
    const textEncoders = await safeModelList(baseUrl, 'text_encoders');
    const vaes = await safeModelList(baseUrl, 'vae');
    const loras = await safeModelList(baseUrl, 'loras');

    const checks = [
        { label: 'UNET', wanted: vault.COMFY_UNET_MODEL, haystack: diffusionModels },
        { label: 'CLIP', wanted: vault.COMFY_CLIP_MODEL, haystack: textEncoders },
        { label: 'T5', wanted: vault.COMFY_T5_MODEL, haystack: textEncoders },
        { label: 'VAE', wanted: vault.COMFY_VAE_MODEL, haystack: vaes }
    ];

    for (const check of checks) {
        if (!check.wanted) {
            console.warn(`⚠️ ${check.label}: no configurado en .env`);
            continue;
        }

        if (check.haystack.some((value: string) => value === check.wanted || value.endsWith(`/${check.wanted}`))) {
            console.log(`✅ ${check.label} encontrado: ${check.wanted}`);
        } else {
            console.warn(`⚠️ ${check.label} no encontrado: ${check.wanted}`);
            if (check.haystack.length) {
                console.log(`   Detectados: ${check.haystack.slice(0, 20).join(', ')}`);
            } else {
                console.log('   No se pudo leer la lista de modelos desde ComfyUI.');
            }
        }
    }

    console.log('\n[LoRA] Comprobando configuración LoRA...');
    if (!vault.COMFY_LORA_ENABLED) {
        console.log('ℹ️ LoRA desactivado. Activa COMFY_LORA_ENABLED=true para validar esta capa.');
    } else {
        const configuredLoras = parseConfiguredLoraNames();
        if (!configuredLoras.length) {
            console.warn('⚠️ LoRA activado pero COMFY_LORA_RULES_JSON está vacío o no tiene nombres válidos.');
        } else {
            console.log(`ℹ️ LoRA configurados: ${configuredLoras.join(', ')}`);
            for (const wanted of configuredLoras) {
                const found = loras.some((value: string) => value === wanted || value.endsWith(`/${wanted}`));
                if (found) {
                    console.log(`✅ LoRA encontrado: ${wanted}`);
                } else {
                    console.warn(`⚠️ LoRA no encontrado en ComfyUI: ${wanted}`);
                }
            }
        }
    }

    console.log('\n[Storage] Comprobando destino de imágenes...');
    const outDir = path.resolve(vault.COMFY_OUTPUT_DIR);
    if (!fs.existsSync(outDir)) {
        console.log(`📁 Creando directorio de salida: ${vault.COMFY_OUTPUT_DIR}`);
        fs.mkdirSync(outDir, { recursive: true });
    } else {
        console.log(`✅ Directorio de salida listo: ${vault.COMFY_OUTPUT_DIR}`);
    }

    console.log('\n===========================================');
    console.log('🏁 Diagnóstico completado.');
    console.log('===========================================\n');
}

runSetupHelper().catch(e => {
    console.error('Fatal Helper Error:', e);
});
