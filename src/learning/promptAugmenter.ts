import { DatabaseLike } from '../originality/types.js';
import { getExemplars, summarizeExemplarForPrompt } from './exemplarRepository.js';
import { getCuratedLessons, summarizeLessonForPrompt, dedupeLessonTexts } from './lessonRepository.js';
import { inferPromptLearningContext } from './promptContext.js';
import { PromptAugmentationResult } from './types.js';

const POSITIVE_EXEMPLAR_LIMIT = Number(process.env.LEARNING_POSITIVE_EXEMPLARS || 4);
const NEGATIVE_EXEMPLAR_LIMIT = Number(process.env.LEARNING_NEGATIVE_EXEMPLARS || 2);
const LESSON_LIMIT = Number(process.env.LEARNING_LESSON_LIMIT || 7);

export async function augmentPromptWithLearnedContext(db: DatabaseLike, agentName: string, prompt: string): Promise<PromptAugmentationResult> {
  const context = inferPromptLearningContext(agentName, prompt);
  console.log(`[LEARNING] Inferred Context for ${agentName}: niche=${context.niche}, city=${context.city}, blockType=${context.blockType}`);

  const [lessonsRaw, positiveExemplars, negativeExemplars] = await Promise.all([
    getCuratedLessons(db, context, LESSON_LIMIT),
    getExemplars(db, context, 'positive', POSITIVE_EXEMPLAR_LIMIT),
    getExemplars(db, context, 'negative', NEGATIVE_EXEMPLAR_LIMIT)
  ]);

  const lessons = dedupeLessonTexts(lessonsRaw);
  if (lessons.length || positiveExemplars.length || negativeExemplars.length) {
    console.log(`[LEARNING] SUCCESS! Augmenting prompt for ${agentName} with ${lessons.length} lessons, ${positiveExemplars.length} positive exemplars, ${negativeExemplars.length} negative exemplars.`);
  } else {
    console.log(`[LEARNING] No lessons found for ${agentName} in this context.`);
  }
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
      'PATRONES 100/100 QUE DEBES IMITAR EN ESTRUCTURA, TONO Y PRECISIÓN:',
      ...positiveExemplars.map((exemplar, index) => `${index + 1}. ${summarizeExemplarForPrompt(exemplar)}`)
    ].join('\n'));
  }

  if (negativeExemplars.length) {
    sections.push([
      'PATRONES QUE DEBES EVITAR:',
      ...negativeExemplars.map((exemplar, index) => `${index + 1}. ${summarizeExemplarForPrompt(exemplar)}`)
    ].join('\n'));
  }

  const augmentedPrompt = `################################################################################
# CRITICAL SYSTEM OVERRIDE: APRENDIZAJE ARTIFICIAL 100/100 (PRIORIDAD MÁXIMA)
# Debes usar estas muestras como patrón de calidad. No copies marcas ni datos no confirmados.
# Imita la precisión, la estructura, la claridad técnica, la prudencia NAP y el tono local.
################################################################################

${sections.join('\n\n')}

################################################################################

${prompt}`;
  return {
    context,
    lessons,
    positiveExemplars,
    negativeExemplars,
    prompt: augmentedPrompt
  };
}
