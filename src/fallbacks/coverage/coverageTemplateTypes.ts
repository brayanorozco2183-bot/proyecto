export type CoverageTemplateTone =
  | 'proximity'
  | 'provincial'
  | 'neighborhood'
  | 'technical'
  | 'premium'
  | 'urgent'
  | 'trust'
  | 'service'
  | 'commercial'
  | 'residential';

export type CoverageTemplateDensity = 'compact' | 'balanced' | 'expanded';

export interface CoverageTemplate {
  id: string;
  tone: CoverageTemplateTone;
  density: CoverageTemplateDensity;
  h2Patterns: string[];
  introPatterns: string[];
  anchorPatterns: string[];
}

export interface ResolveCoverageTemplateInput {
  niche: string;
  city?: string;
  region?: string;
  neighborhood?: string;
  seed?: string | number;
  tone?: CoverageTemplateTone;
  density?: CoverageTemplateDensity;
}

export interface BuildCoverageCopyInput extends ResolveCoverageTemplateInput {
  locName: string;
}

export interface BuiltCoverageCopy {
  templateId: string;
  h2: string;
  intro: string;
  anchor: string;
}
