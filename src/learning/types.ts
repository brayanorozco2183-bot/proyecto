export type LearningPolarity = 'positive' | 'negative';
export type LearningStatus = 'rejected' | 'fixable' | 'publishable' | 'premium';

export interface PromptLearningContext {
  agentName: string;
  niche?: string;
  city?: string;
  pageType?: string;
  blockType?: string;
}

export interface OutputReviewInput {
  missionId?: string;
  agentName: string;
  niche: string;
  city: string;
  pageType?: string;
  blockType?: string;
  html: string;
  businessName?: string;
  phone?: string;
  seo?: {
    title?: string;
    metaDescription?: string;
    canonical?: string;
  };
  llmScore?: number;
  llmReasoning?: string;
  llmIssues?: string[];
}

export interface OutputReviewResult {
  score: number;
  status: LearningStatus;
  issues: string[];
  issueCodes: string[];
  strengths: string[];
  metrics: Record<string, number>;
  excerpt: string;
}

export interface CuratedLesson {
  id?: number;
  agent_name: string;
  niche: string | null;
  city: string | null;
  page_type: string | null;
  block_type: string | null;
  issue_code: string;
  lesson_text: string;
  weight: number;
  active: number;
  source_review_id?: number | null;
  created_at?: string;
}

export interface ExemplarRecord {
  id?: number;
  agent_name: string;
  niche: string | null;
  city: string | null;
  page_type: string | null;
  block_type: string | null;
  polarity: LearningPolarity;
  title: string;
  excerpt: string;
  fingerprint: string;
  score: number;
  source_review_id?: number | null;
  metadata_json?: string | null;
  created_at?: string;
}

export interface ReviewPersistenceRecord extends OutputReviewResult {
  id?: number;
  mission_id?: string | null;
  agent_name: string;
  niche: string;
  city: string;
  page_type: string | null;
  block_type: string | null;
  html_hash: string;
  llm_score?: number | null;
  llm_reasoning?: string | null;
  llm_issues_json?: string | null;
  issues_json?: string | null;
  issue_codes_json?: string | null;
  strengths_json?: string | null;
  metrics_json?: string | null;
  excerpt?: string;
  created_at?: string;
}

export interface PromptAugmentationResult {
  context: PromptLearningContext;
  lessons: CuratedLesson[];
  positiveExemplars: ExemplarRecord[];
  negativeExemplars: ExemplarRecord[];
  prompt: string;
}
