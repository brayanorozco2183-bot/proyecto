import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { vault } from '../../tools/vault.js';
import { GeneratedImageAsset, PageImageBrief } from '../types.js';
import { getWorkflowForBrief } from './workflowRegistry.js';

interface ComfyHistoryImage {
    filename: string;
    subfolder?: string;
    type?: string;
}

function trimSlashes(value: string): string {
    return value.replace(/\/+$/g, '').replace(/^\/+/, '');
}

function joinPublicUrl(base: string, fileName: string): string {
    if (/^https?:\/\//i.test(base)) {
        return `${base.replace(/\/$/, '')}/${trimSlashes(fileName)}`;
    }
    return `${base.replace(/\/$/, '')}/${trimSlashes(fileName)}`;
}

function pickHistoryPayload(payload: any, promptId: string): any {
    if (payload?.[promptId]) return payload[promptId];
    if (payload?.history && Array.isArray(payload.history)) {
        return payload.history.find((item: any) => item.prompt_id === promptId) || null;
    }
    return payload || null;
}

function extractFirstImageOutput(historyEntry: any): ComfyHistoryImage | null {
    const outputs = historyEntry?.outputs || {};
    for (const nodeOutput of Object.values(outputs) as any[]) {
        const images = nodeOutput?.images;
        if (Array.isArray(images) && images.length > 0) {
            return images[0] as ComfyHistoryImage;
        }
    }
    return null;
}

async function wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

export class ComfyClient {
    private readonly baseUrl = vault.COMFY_BASE_URL.replace(/\/$/, '');

    async generateImage(brief: PageImageBrief): Promise<GeneratedImageAsset> {
        const { workflow, workflowId, appliedLoras } = await getWorkflowForBrief(brief);
        const promptResponse = await axios.post(`${this.baseUrl}/prompt`, { prompt: workflow }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 90000
        });

        const promptId = promptResponse.data?.prompt_id;
        if (!promptId) {
            throw new Error('Comfy no devolvió prompt_id al enviar el workflow.');
        }

        const startedAt = Date.now();
        let image: ComfyHistoryImage | null = null;

        while (Date.now() - startedAt < vault.COMFY_MAX_WAIT_MS) {
            const historyResponse = await axios.get(`${this.baseUrl}/history/${promptId}`, { timeout: 60000 });
            const historyEntry = pickHistoryPayload(historyResponse.data, promptId);
            image = extractFirstImageOutput(historyEntry);
            if (image?.filename) break;
            await wait(vault.COMFY_POLL_INTERVAL_MS);
        }

        if (!image?.filename) {
            throw new Error(`Comfy no devolvió ninguna imagen para ${brief.slot} dentro del tiempo máximo de espera.`);
        }

        const query = new URLSearchParams({
            filename: image.filename,
            subfolder: image.subfolder || '',
            type: image.type || 'output'
        });

        const binary = await axios.get(`${this.baseUrl}/view?${query.toString()}`, {
            responseType: 'arraybuffer',
            timeout: 90000
        });

        const safeFileName = image.filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
        const relativeFile = `${brief.outputSlug || brief.pageId}/${safeFileName}`;
        const localPath = path.join(process.cwd(), vault.COMFY_OUTPUT_DIR, relativeFile);
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, binary.data);

        return {
            slot: brief.slot,
            localPath,
            publicUrl: joinPublicUrl(vault.COMFY_PUBLIC_BASE_URL, relativeFile),
            filename: safeFileName,
            mimeType: binary.headers['content-type'] || 'image/png',
            seed: brief.seed,
            workflowId,
            promptId,
            alt: brief.alt,
            caption: brief.caption,
            appliedLoras
        };
    }
}

export const comfyClient = new ComfyClient();


