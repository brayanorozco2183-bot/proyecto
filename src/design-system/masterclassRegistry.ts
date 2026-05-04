
import fs from 'fs';
import path from 'path';

export interface GravityMasterclass {
  id: string; // En tus JSON es 'id'
  title?: string;
  architecture?: any;
  design_system_injection?: any;
  block_blueprints?: Record<string, any>;
  art_direction?: any;
}

function normalize(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

let cached: GravityMasterclass[] | null = null;

export function loadGravityMasterclasses(): GravityMasterclass[] {
  if (cached) return cached;
  const masterclassDir = path.join(process.cwd(), 'src/config/design-masterclasses');
  
  const found: GravityMasterclass[] = [];
  if (!fs.existsSync(masterclassDir)) return [];

  const files = fs.readdirSync(masterclassDir).filter(file => file.endsWith('.json'));
  for (const file of files) {
    const full = path.join(masterclassDir, file);
    try {
      const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (parsed?.id) {
        found.push(parsed as GravityMasterclass);
      }
    } catch (error: any) {
      console.warn(`[MasterclassRegistry] Error en JSON ${full}: ${error?.message}`);
    }
  }

  cached = found;
  return found;
}

export function selectGravityMasterclass(input: {
  niche?: string;
  city?: string;
  pageId?: string;
  explicitId?: string;
}): GravityMasterclass | null {
  const all = loadGravityMasterclasses();
  if (!all.length) return null;

  if (input.explicitId) {
    const byId = all.find(mc => mc.id === input.explicitId);
    if (byId) return byId;
  }

  // Selección determinista por nicho y ciudad para asegurar variedad
  const key = `${normalize(input.niche)}::${normalize(input.city)}::${normalize(input.pageId)}`;
  return all[stableHash(key) % all.length] || null;
}

export function applyMasterclassBlockVariants(
  sections: any[],
  masterclass?: GravityMasterclass | null
): any[] {
  if (!masterclass?.block_blueprints) return sections;

  return sections.map(section => {
    const blockType = section.blockType || section.block_type || '';
    const blueprint = masterclass.block_blueprints[blockType];
    
    if (!blueprint) return section;

    // Aplicar la variante y el estilo definidos en la masterclass
    return {
      ...section,
      variant: blueprint.variant || blueprint.style || section.variant,
      visualVariant: blueprint.variant || blueprint.style || section.visualVariant
    };
  });
}
