import { DatabaseLike } from '../originality/types.js';
import { getExemplars, summarizeExemplarForPrompt } from './exemplarRepository.js';
import { getCuratedLessons, summarizeLessonForPrompt, dedupeLessonTexts } from './lessonRepository.js';
import { inferPromptLearningContext } from './promptContext.js';
import { PromptAugmentationResult } from './types.js';

export async function augmentPromptWithLearnedContext(db: DatabaseLike, agentName: string, prompt: string): Promise<PromptAugmentationResult> {
  const context = inferPromptLearningContext(agentName, prompt);
  const [lessonsRaw, positiveExemplars, negativeExemplars] = await Promise.all([
    getCuratedLessons(db, context, 5),
    getExemplars(db, context, 'positive', 2),
    getExemplars(db, context, 'negative', 2)
  ]);

  const lessons = dedupeLessonTexts(lessonsRaw);
  if (!lessons.length && !positiveExemplars.length && !negativeExemplars.length) {
    return {
      context,
      lessons,
      positiveExemplars,
      negativeExemplars,
      prompt
    };
  }

  const sections: string[] = [];
  if (lessons.length) {
    sections.push([
      'LECCIONES CURADAS (NO REPITAS ESTOS ERRORES):',
      ...lessons.map((lesson, index) => `${index + 1}. ${summarizeLessonForPrompt(lesson)}`)
    ].join('\n'));
  }

  if (positiveExemplars.length) {
    sections.push([
      'PATRONES QUE FUNCIONARON BIEN:',
      ...positiveExemplars.map((exemplar, index) => `${index + 1}. ${summarizeExemplarForPrompt(exemplar)}`)
    ].join('\n'));
  }

  if (negativeExemplars.length) {
    sections.push([
      'PATRONES QUE DEBES EVITAR:',
      ...negativeExemplars.map((exemplar, index) => `${index + 1}. ${summarizeExemplarForPrompt(exemplar)}`)
    ].join('\n'));
  }

  const augmentedPrompt = `${sections.join('\n\n')}\n\n--- PROMPT ORIGINAL ---\n${prompt}`;
  return {
    context,
    lessons,
    positiveExemplars,
    negativeExemplars,
    prompt: augmentedPrompt
  };
}
