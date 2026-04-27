import { buildSeed, pickSeeded, uniqueStrings } from '../utils/designSeed.js';

export type VisualPageArchetype =
  | 'industrial_command_center'
  | 'local_newspaper_report'
  | 'premium_studio_case'
  | 'emergency_dispatch_console'
  | 'neighborhood_directory_map'
  | 'minimal_quote_first'
  | 'before_after_showcase'
  | 'technical_diagnosis_report';

export type VisualFamilyDialect =
  | 'industrial_local'
  | 'editorial_local'
  | 'luxury_studio'
  | 'emergency_console'
  | 'directory_map'
  | 'minimal_authority_quote'
  | 'showcase_before_after'
  | 'technical_report';

export type HeroTemplateDialect =
  | 'map_first'
  | 'quote_first'
  | 'emergency_console'
  | 'editorial_cover'
  | 'pricing_first'
  | 'before_after'
  | 'problem_solution'
  | 'directory_search'
  | 'minimal_statement'
  | 'case_study_intro'
  | 'technical_diagnosis';

export interface VisualIdentityContract {
  contractId: string;
  pageArchetype: VisualPageArchetype;
  visualDialect: VisualFamilyDialect;
  heroTemplate: HeroTemplateDialect;
  sectionOrderStrategy: 'urgency_then_proof' | 'story_then_services' | 'portfolio_then_quote' | 'coverage_then_services' | 'diagnosis_then_solution' | 'price_then_trust';
  blockDialects: Record<string, string>;
  layoutSignature: {
    nav: 'utility_bar' | 'magazine_nav' | 'studio_minimal' | 'directory_tabs' | 'report_header';
    background: 'dark_gradient_grid' | 'paper_columns' | 'warm_gallery' | 'map_mesh' | 'clinical_panels' | 'quiet_white';
    cards: 'status_panels' | 'editorial_clippings' | 'portfolio_tiles' | 'directory_rows' | 'diagnostic_panels' | 'quote_cards';
    icons: 'line_technical' | 'stamp_editorial' | 'soft_gallery' | 'pin_map' | 'check_report';
    rhythm: 'compact_high_contrast' | 'longform_editorial' | 'gallery_breathing' | 'directory_dense' | 'report_precise' | 'minimal_slow';
  };
  orderedBlockTypes: string[];
  fingerprint: string[];
}

const TECHNICAL_NICHE = /cerraj|fontan|electric|repar|instal|desatas|seguridad|climat|caldera|termo|electro|ascensor|persian/i;
const DECORATIVE_NICHE = /pintor|pintura|decor|interiorismo|reforma|fachada|impermeabil|barniz|lacado|albañil|jardin|limpieza|carpint/i;
const URGENT_NICHE = /cerraj|fontan|desatas|urg|24|emerg|aver/i;

const CONTRACTS: VisualIdentityContract[] = [
  {
    contractId: 'vic_emergency_dispatch_console', pageArchetype: 'emergency_dispatch_console', visualDialect: 'emergency_console', heroTemplate: 'emergency_console', sectionOrderStrategy: 'urgency_then_proof',
    blockDialects: { services_grid: 'diagnostic_rows', local_proof: 'coverage_map_panel', process_steps: 'dispatch_timeline', faq: 'compact_decision_tree', cta_panel: 'sticky_emergency_bar', urgency_panel: 'status_console' },
    layoutSignature: { nav: 'utility_bar', background: 'dark_gradient_grid', cards: 'status_panels', icons: 'line_technical', rhythm: 'compact_high_contrast' },
    orderedBlockTypes: ['urgency_panel','local_proof','services_grid','process_steps','trust_band','map','faq','cta_panel'], fingerprint: []
  },
  {
    contractId: 'vic_technical_diagnosis_report', pageArchetype: 'technical_diagnosis_report', visualDialect: 'technical_report', heroTemplate: 'technical_diagnosis', sectionOrderStrategy: 'diagnosis_then_solution',
    blockDialects: { services_grid: 'icon_table', local_proof: 'evidence_panel', process_steps: 'inspection_protocol', faq: 'report_qa', price_guidance: 'estimate_matrix', cta_panel: 'consultation_panel' },
    layoutSignature: { nav: 'report_header', background: 'clinical_panels', cards: 'diagnostic_panels', icons: 'check_report', rhythm: 'report_precise' },
    orderedBlockTypes: ['services_grid','process_steps','price_guidance','local_proof','comparison_table','faq','map','cta_panel'], fingerprint: []
  },
  {
    contractId: 'vic_local_newspaper_report', pageArchetype: 'local_newspaper_report', visualDialect: 'editorial_local', heroTemplate: 'editorial_cover', sectionOrderStrategy: 'story_then_services',
    blockDialects: { case_story: 'feature_article', services_grid: 'editorial_service_rows', local_proof: 'neighborhood_notes', process_steps: 'story_timeline', faq: 'editorial_qa', cta_panel: 'classified_cta' },
    layoutSignature: { nav: 'magazine_nav', background: 'paper_columns', cards: 'editorial_clippings', icons: 'stamp_editorial', rhythm: 'longform_editorial' },
    orderedBlockTypes: ['case_story','trust_band','services_grid','process_steps','local_proof','map','faq','micro_cta','cta_panel'], fingerprint: []
  },
  {
    contractId: 'vic_premium_studio_case', pageArchetype: 'premium_studio_case', visualDialect: 'luxury_studio', heroTemplate: 'case_study_intro', sectionOrderStrategy: 'portfolio_then_quote',
    blockDialects: { services_grid: 'masonry_tiles', local_proof: 'studio_proof_strip', process_steps: 'atelier_steps', faq: 'cards_faq', cta_panel: 'private_briefing', case_story: 'case_study_spread' },
    layoutSignature: { nav: 'studio_minimal', background: 'warm_gallery', cards: 'portfolio_tiles', icons: 'soft_gallery', rhythm: 'gallery_breathing' },
    orderedBlockTypes: ['case_story','services_grid','trust_band','process_steps','price_guidance','local_proof','faq','cta_panel'], fingerprint: []
  },
  {
    contractId: 'vic_neighborhood_directory_map', pageArchetype: 'neighborhood_directory_map', visualDialect: 'directory_map', heroTemplate: 'directory_search', sectionOrderStrategy: 'coverage_then_services',
    blockDialects: { local_proof: 'area_directory_rows', map: 'large_zone_map', services_grid: 'horizontal_rows', trust_band: 'local_badges', faq: 'sidebar_faq', cta_panel: 'zone_cta' },
    layoutSignature: { nav: 'directory_tabs', background: 'map_mesh', cards: 'directory_rows', icons: 'pin_map', rhythm: 'directory_dense' },
    orderedBlockTypes: ['local_proof','map','services_grid','trust_band','price_guidance','faq','cta_panel'], fingerprint: []
  },
  {
    contractId: 'vic_minimal_quote_first', pageArchetype: 'minimal_quote_first', visualDialect: 'minimal_authority_quote', heroTemplate: 'quote_first', sectionOrderStrategy: 'story_then_services',
    blockDialects: { services_grid: 'minimal_columns', local_proof: 'quiet_proof', process_steps: 'numbered_manifesto', faq: 'two_column_questions', cta_panel: 'minimal_statement_cta' },
    layoutSignature: { nav: 'studio_minimal', background: 'quiet_white', cards: 'quote_cards', icons: 'stamp_editorial', rhythm: 'minimal_slow' },
    orderedBlockTypes: ['trust_band','case_story','services_grid','process_steps','local_proof','faq','cta_panel'], fingerprint: []
  },
  {
    contractId: 'vic_before_after_showcase', pageArchetype: 'before_after_showcase', visualDialect: 'showcase_before_after', heroTemplate: 'before_after', sectionOrderStrategy: 'portfolio_then_quote',
    blockDialects: { services_grid: 'before_after_tiles', local_proof: 'project_locations', process_steps: 'renovation_timeline', faq: 'cards_faq', cta_panel: 'project_quote_panel' },
    layoutSignature: { nav: 'studio_minimal', background: 'warm_gallery', cards: 'portfolio_tiles', icons: 'soft_gallery', rhythm: 'gallery_breathing' },
    orderedBlockTypes: ['case_story','services_grid','price_guidance','process_steps','local_proof','map','faq','cta_panel'], fingerprint: []
  }
];

function familyForContract(contract: VisualIdentityContract): string {
  switch (contract.visualDialect) {
    case 'emergency_console': return 'conversion_heavy';
    case 'technical_report': return 'technical_grid';
    case 'editorial_local': return 'editorial';
    case 'luxury_studio': return 'asymmetric_premium';
    case 'directory_map': return 'local_trust';
    case 'minimal_authority_quote': return 'minimal_authority';
    case 'showcase_before_after': return 'asymmetric_premium';
    default: return 'conversion_heavy';
  }
}

export function selectVisualIdentityContract(input: { niche?: string; city?: string; pageType?: string; primaryIntent?: string; primaryKeyword?: string; salt?: string; }): VisualIdentityContract {
  const niche = String(input.niche || '').toLowerCase();
  const pageType = String(input.pageType || 'service').toLowerCase();
  const seed = buildSeed(input.niche, input.city, pageType, input.primaryKeyword, input.primaryIntent, input.salt || 'visual-identity-v3');
  let pool = CONTRACTS;
  if (pageType === 'urgent' || URGENT_NICHE.test(niche)) pool = CONTRACTS.filter(c => ['emergency_dispatch_console','technical_diagnosis_report','neighborhood_directory_map'].includes(c.pageArchetype));
  else if (DECORATIVE_NICHE.test(niche)) pool = CONTRACTS.filter(c => ['premium_studio_case','before_after_showcase','local_newspaper_report','minimal_quote_first'].includes(c.pageArchetype));
  else if (TECHNICAL_NICHE.test(niche)) pool = CONTRACTS.filter(c => ['technical_diagnosis_report','industrial_command_center','emergency_dispatch_console','neighborhood_directory_map'].includes(c.pageArchetype));
  const selected = pickSeeded(pool.length ? pool : CONTRACTS, seed);
  return { ...selected, fingerprint: uniqueStrings([selected.contractId, selected.pageArchetype, selected.visualDialect, selected.heroTemplate, selected.sectionOrderStrategy, selected.layoutSignature.nav, selected.layoutSignature.background, selected.layoutSignature.cards, selected.layoutSignature.rhythm, familyForContract(selected)]) };
}

export function mapVisualContractToLegacyFamily(contract: VisualIdentityContract): any { return familyForContract(contract); }
export function mapVisualContractToLegacyHero(contract: VisualIdentityContract): any {
  if (contract.heroTemplate === 'emergency_console') return 'cta_heavy';
  if (contract.heroTemplate === 'quote_first' || contract.heroTemplate === 'minimal_statement') return 'centered';
  if (contract.heroTemplate === 'editorial_cover' || contract.heroTemplate === 'before_after' || contract.heroTemplate === 'case_study_intro') return 'stacked';
  if (contract.heroTemplate === 'directory_search' || contract.heroTemplate === 'map_first') return 'proof_first';
  return 'split';
}
