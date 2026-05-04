export type ImageSlot = 'hero-default' | 'editorial-default' | string;

export interface PageImageLoRA {
    name: string;
    strengthModel: number;
    strengthClip: number;
    triggerWords: string[];
    matchKey?: string;
    notes?: string;
}

export interface PageImageContext {
    pageId: string;
    niche: string;
    city: string;
    businessName?: string;
    phone?: string;
    h1?: string;
    heroSubtitle?: string;
    canonical?: string;
    outputSlug?: string;
}

export interface PageImageBrief {
    pageId: string;
    slot: ImageSlot;
    kind: 'hero' | 'editorial';
    niche: string;
    city: string;
    businessName?: string;
    prompt: string;
    negativePrompt: string;
    alt: string;
    caption?: string;
    seed: number;
    width: number;
    height: number;
    sectionTitle?: string;
    outputSlug?: string;
    modelHints?: {
        unet?: string;
        clip?: string;
        t5?: string;
        vae?: string;
    };
    loras?: PageImageLoRA[];
    debug?: {
        matchedLoRaKeys: string[];
        selectionNotes: string[];
    };
}

export interface GeneratedImageAsset {
    slot: ImageSlot;
    localPath: string;
    publicUrl: string;
    filename: string;
    mimeType: string;
    seed: number;
    workflowId: string;
    promptId?: string;
    alt: string;
    caption?: string;
}
