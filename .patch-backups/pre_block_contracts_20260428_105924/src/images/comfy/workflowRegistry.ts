import fs from 'fs/promises';
import path from 'path';
import { vault } from '../../tools/vault.js';
import { PageImageBrief, PageImageLoRA } from '../types.js';

type ComfyWorkflow = Record<string, any>;

function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

async function loadWorkflowTemplate(filePath: string): Promise<ComfyWorkflow> {
    const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    const raw = await fs.readFile(absolute, 'utf-8');
    return JSON.parse(raw);
}

function lower(value: any): string {
    return String(value || '').toLowerCase().trim();
}

function setWidgetByProxyName(node: any, proxyName: string, value: any): boolean {
    const proxies = Array.isArray(node?.properties?.proxyWidgets) ? node.properties.proxyWidgets : [];
    const widgets = Array.isArray(node?.widgets_values) ? [...node.widgets_values] : null;
    if (!widgets) return false;

    const proxyIndex = proxies.findIndex((entry: any[]) => String(entry?.[1] || '') === proxyName);
    if (proxyIndex === -1) return false;

    widgets[proxyIndex] = value;
    node.widgets_values = widgets;
    return true;
}

function setWidgetByHeuristic(node: any, targets: string[], value: any): boolean {
    const widgetNames = Array.isArray(node?.properties?.proxyWidgets)
        ? node.properties.proxyWidgets.map((entry: any[]) => String(entry?.[1] || ''))
        : [];

    for (const target of targets) {
        const idx = widgetNames.findIndex((name: string) => lower(name) === lower(target));
        if (idx !== -1 && Array.isArray(node.widgets_values)) {
            node.widgets_values[idx] = value;
            return true;
        }
    }

    return false;
}

function setNamedInputIfPresent(node: any, names: string[], value: any): boolean {
    if (!node?.inputs || typeof node.inputs !== 'object') return false;

    for (const name of names) {
        if (Object.prototype.hasOwnProperty.call(node.inputs, name)) {
            node.inputs[name] = value;
            return true;
        }
    }

    return false;
}

function isLoRANode(node: any): boolean {
    const signature = [node?.class_type, node?.type, node?.title]
        .map(value => lower(value))
        .join(' | ');

    return signature.includes('lora');
}

function disableLoRANode(node: any): void {
    setNamedInputIfPresent(node, ['lora_name'], 'None');
    setNamedInputIfPresent(node, ['strength_model', 'strength'], 0);
    setNamedInputIfPresent(node, ['strength_clip'], 0);
    setWidgetByHeuristic(node, ['lora_name', 'lora'], 'None');
    setWidgetByHeuristic(node, ['strength_model', 'strength'], 0);
    setWidgetByHeuristic(node, ['strength_clip'], 0);
}

function applyLoRAToNode(node: any, lora: PageImageLoRA): void {
    setNamedInputIfPresent(node, ['lora_name'], lora.name);
    setNamedInputIfPresent(node, ['strength_model', 'strength'], lora.strengthModel ?? vault.COMFY_LORA_DEFAULT_STRENGTH);
    setNamedInputIfPresent(node, ['strength_clip'], lora.strengthClip ?? vault.COMFY_LORA_DEFAULT_CLIP_STRENGTH);

    setWidgetByHeuristic(node, ['lora_name', 'lora'], lora.name);
    setWidgetByHeuristic(node, ['strength_model', 'strength'], lora.strengthModel ?? vault.COMFY_LORA_DEFAULT_STRENGTH);
    setWidgetByHeuristic(node, ['strength_clip'], lora.strengthClip ?? vault.COMFY_LORA_DEFAULT_CLIP_STRENGTH);
}

function applyLoRAs(cloned: ComfyWorkflow, brief: PageImageBrief): string[] {
    const requested = Array.isArray(brief.loras) ? brief.loras : [];
    if (!vault.COMFY_LORA_ENABLED || !requested.length) return [];

    const loraNodes = Object.values(cloned).filter(node => isLoRANode(node));

    if (!loraNodes.length) {
        if (vault.COMFY_LORA_STRICT_MODE) {
            throw new Error('El workflow no contiene nodos LoRA reutilizables y COMFY_LORA_STRICT_MODE=true.');
        }
        return [];
    }

    const usableCount = Math.min(loraNodes.length, requested.length, vault.COMFY_LORA_MAX_PER_IMAGE);

    for (let i = 0; i < loraNodes.length; i += 1) {
        const node = loraNodes[i];
        const lora = requested[i];

        if (i < usableCount && lora) {
            applyLoRAToNode(node, lora);
        } else {
            disableLoRANode(node);
        }
    }

    if (requested.length > usableCount && vault.COMFY_LORA_STRICT_MODE) {
        throw new Error(`Se solicitaron ${requested.length} LoRA(s), pero el workflow solo puede aplicar ${usableCount}.`);
    }

    return requested.slice(0, usableCount).map(item => item.name);
}

function mutateWorkflow(workflow: ComfyWorkflow, brief: PageImageBrief): { workflow: ComfyWorkflow; appliedLoras: string[] } {
    const cloned = deepClone(workflow);
    const nodeEntries = Object.entries(cloned);

    const clipNodes = nodeEntries.filter(([, node]) => node?.class_type === 'CLIPTextEncode');
    if (clipNodes[0]) clipNodes[0][1].inputs.text = brief.prompt;
    if (clipNodes[1]) clipNodes[1][1].inputs.text = brief.negativePrompt;

    for (const [, node] of nodeEntries) {
        const classType = lower(node?.class_type);
        const nodeType = lower(node?.type);
        const title = lower(node?.title);

        if (classType === 'checkpointloadersimple' && vault.COMFY_CHECKPOINT) {
            node.inputs.ckpt_name = vault.COMFY_CHECKPOINT;
        }

        if (classType === 'emptylatentimage') {
            node.inputs.width = brief.width;
            node.inputs.height = brief.height;
            node.inputs.batch_size = 1;
        }

        if (classType === 'ksampler' || classType === 'ksampleradvanced') {
            node.inputs.seed = brief.seed;
        }

        if (classType === 'saveimage') {
            node.inputs.filename_prefix = `${brief.outputSlug || brief.pageId}/${brief.slot}`;
        }

        if (Array.isArray(node?.widgets_values)) {
            if (title.includes('prompt') || nodeType.includes('primitivestringmultiline')) {
                if (!title.includes('negative')) {
                    node.widgets_values[0] = brief.prompt;
                } else {
                    node.widgets_values[0] = brief.negativePrompt;
                }
            }

            setWidgetByProxyName(node, 'text', brief.prompt);
            setWidgetByHeuristic(node, ['prompt'], brief.prompt);
            setWidgetByHeuristic(node, ['negative_prompt', 'negative prompt'], brief.negativePrompt);
            setWidgetByHeuristic(node, ['value', 'width'], brief.width);
            setWidgetByHeuristic(node, ['value_1', 'height'], brief.height);
            setWidgetByHeuristic(node, ['noise_seed', 'seed'], brief.seed);

            if (brief.modelHints?.unet) {
                setWidgetByHeuristic(node, ['unet_name', 'model', 'unet'], brief.modelHints.unet);
            }
            if (brief.modelHints?.clip) {
                setWidgetByHeuristic(node, ['clip_name1', 'clip_name', 'text_encoder', 'clip'], brief.modelHints.clip);
            }
            if (brief.modelHints?.t5) {
                setWidgetByHeuristic(node, ['clip_name2', 't5_name', 't5'], brief.modelHints.t5);
            }
            if (brief.modelHints?.vae) {
                setWidgetByHeuristic(node, ['vae_name', 'vae'], brief.modelHints.vae);
            }
        }

        if (classType === 'unetloader' && brief.modelHints?.unet) {
            node.inputs.unet_name = brief.modelHints.unet;
        }
        if ((classType === 'dualcliploader' || classType === 'cliploader' || classType === 'dualcliploadergguf')) {
            if (brief.modelHints?.clip && 'clip_name1' in (node.inputs || {})) node.inputs.clip_name1 = brief.modelHints.clip;
            if (brief.modelHints?.t5 && 'clip_name2' in (node.inputs || {})) node.inputs.clip_name2 = brief.modelHints.t5;
            if (brief.modelHints?.clip && 'clip_name' in (node.inputs || {})) node.inputs.clip_name = brief.modelHints.clip;
        }
        if (classType === 'vaeloader' && brief.modelHints?.vae) {
            node.inputs.vae_name = brief.modelHints.vae;
        }
    }

    const appliedLoras = applyLoRAs(cloned, brief);
    return { workflow: cloned, appliedLoras };
}

export async function getWorkflowForBrief(brief: PageImageBrief): Promise<{ workflow: ComfyWorkflow; workflowId: string; appliedLoras: string[] }> {
    const filePath = brief.kind === 'hero'
        ? vault.COMFY_WORKFLOW_HERO
        : vault.COMFY_WORKFLOW_EDITORIAL;

    const workflow = await loadWorkflowTemplate(filePath);
    const mutated = mutateWorkflow(workflow, brief);

    return {
        workflow: mutated.workflow,
        workflowId: path.basename(filePath, path.extname(filePath)),
        appliedLoras: mutated.appliedLoras
    };
}
