import { DatabaseLike } from '../originality/types.js';
import { promoteReviewToExemplars } from './exemplarRepository.js';
import { insertSentence } from './sentenceRepository.js';
import { SectionQualityContract } from '../utils/semanticContentGuard.js';
import { ContentBlock } from '../types/pipeline_v2.js';

export async function autonomousBlockLearning(db: DatabaseLike, block: ContentBlock, contract: SectionQualityContract): Promise<void> {
  // 1. Promote to Positive Exemplar if quality is high
  const hasIssues = (block.metadata?.semantic_guard_issues || []).length > 0;
  const score = block.metadata?.quality_score || 90;

  if (!hasIssues && score >= 85) {
    await promoteReviewToExemplars(db, {
      agentName: 'ContentWriterAgent', // Hardcoded for now as it's the main creator
      niche: contract.niche,
      city: contract.city,
      blockType: contract.blockType,
      html: block.html,
      review: {
        score,
        status: 'passed',
        strengths: ['Alta coherencia técnica', 'Adaptación local natural'],
        metrics: { words: block.wordCount || 0 }
      }
    });

    // 2. Sentence-Level Mining
    await mineSentences(db, block, contract);
  }
}

async function mineSentences(db: DatabaseLike, block: ContentBlock, contract: SectionQualityContract): Promise<void> {
  const text = block.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 40 || trimmed.length > 250) continue;

    let technicalScore = 0;
    let localScore = 0;

    // Evaluate technicality
    contract.requiredTerms.forEach(term => {
      if (trimmed.toLowerCase().includes(term.toLowerCase())) technicalScore += 2;
    });

    // Evaluate locality
    if (trimmed.toLowerCase().includes(contract.city.toLowerCase())) localScore += 5;

    // High quality threshold
    if (technicalScore >= 2 || localScore >= 5) {
      await insertSentence(db, {
        agent_name: 'ContentWriterAgent',
        niche: contract.niche,
        city: contract.city,
        block_type: contract.blockType,
        sentence_text: trimmed,
        technical_score: technicalScore,
        local_score: localScore
      });
    }
  }
}
