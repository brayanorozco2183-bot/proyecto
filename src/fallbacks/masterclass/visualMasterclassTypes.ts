export type CompositionFamily =
  | 'family-technical_grid'
  | 'family-classic_flow'
  | 'family-asymmetric'
  | 'family-editorial_stack'
  | 'family-conversion_split'
  | 'family-local_story'
  | 'family-magazine_cards'
  | 'family-proof_bands'
  | 'family-compact_columns'
  | 'family-form_focused';

export type HeroVariant =
  | 'hero--proof_first'
  | 'hero--centered'
  | 'hero--form'
  | 'hero--service_lead'
  | 'hero--location_first'
  | 'hero--cta_right'
  | 'hero--trust_band'
  | 'hero--stat_first'
  | 'hero--editorial'
  | 'hero--comparison';

export type CardStyle =
  | 'card--magazine'
  | 'card--clean'
  | 'card--glass'
  | 'card--bordered'
  | 'card--soft'
  | 'card--shadow'
  | 'card--elevated'
  | 'card--panel'
  | 'card--split'
  | 'card--minimal';

export type Density = 'compact' | 'standard' | 'rich';

export interface VisualDnaColors {
  primary: string;
  accent: string;
  text: string;
  background: string;
}

export interface VisualDnaTypography {
  heading: string;
  body: string;
}

export interface VisualDna {
  compositionFamily: CompositionFamily;
  heroVariant: HeroVariant;
  colors: VisualDnaColors;
  typography: VisualDnaTypography;
  cardStyle: CardStyle;
  density: Density;
}

export interface VisualMasterclassSeed {
  masterclassId: string;
  visualDna: VisualDna;
}

export interface ResolveVisualMasterclassInput {
  masterclassId?: string | null;
  seed?: string | number | null;
  density?: Density | null;
  compositionFamily?: CompositionFamily | null;
  heroVariant?: HeroVariant | null;
  cardStyle?: CardStyle | null;
}
