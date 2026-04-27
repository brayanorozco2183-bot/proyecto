export interface NormalizedExperimentMetrics {
  score: number;
  status: string;
  qualityGateScore: number | null;
  premiumScore: number | null;
  issueCodes: string[];
  sourcePath: string;
  valid: boolean;
  reason?: string;
}


function collectTechnicalIntegrityCodes(value: any, out = new Set<string>()): string[] {
  if (!value || typeof value !== 'object') return Array.from(out);
  if (Array.isArray(value)) {
    for (const item of value) collectTechnicalIntegrityCodes(item, out);
    return Array.from(out);
  }
  const anyValue = value as any;
  const ti = anyValue.technicalIntegrity || anyValue.metadata?.technicalIntegrity;
  if (Array.isArray(ti?.issueCodes)) ti.issueCodes.forEach((code: any) => out.add(String(code)));
  if (Array.isArray(ti?.issues)) ti.issues.forEach((issue: any) => issue?.code && out.add(String(issue.code)));
  for (const key of ['data','metadata','renderedPage','output','state','result']) {
    if (anyValue[key] && anyValue[key] !== value) collectTechnicalIntegrityCodes(anyValue[key], out);
  }
  return Array.from(out);
}

function finiteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function uniq(values: unknown[]): string[] {
  return Array.from(new Set(values.flatMap((v: any) => Array.isArray(v) ? v : [v]).filter(Boolean).map(String)));
}

export function extractExperimentMetrics(result: any): NormalizedExperimentMetrics {
  const data = result?.data || result || {};
  const qualityGate = data.qualityGate || data.metadata?.qualityGate || data.review?.qualityGate || {};
  const review = data.review || data.outputReview || data.metadata?.review || {};
  const premium = data.premiumScore || data.metadata?.premiumScore || data.premium || {};
  const candidates = [
    ['data.finalScore', data.finalScore],
    ['data.premiumScore.score', premium.score],
    ['data.review.score', review.score],
    ['data.outputReview.score', data.outputReview?.score],
    ['data.qualityGate.score', qualityGate.score],
    ['data.metadata.qaScore', data.metadata?.qaScore],
    ['data.score', data.score],
    ['result.score', result?.score]
  ] as const;
  for (const [sourcePath, raw] of candidates) {
    const n = finiteNumber(raw);
    if (n !== null) {
      const score = Math.max(0, Math.min(100, Math.round(n)));
      const mergedIssueCodes = uniq([collectTechnicalIntegrityCodes(result), qualityGate.issues?.map((i: any) => i?.code), review.issueCodes, review.issues?.map((i: any) => i?.code), premium.issueCodes]);
      return {
        score,
        status: String(data.status || review.status || premium.status || result?.status || (score >= 88 ? 'premium' : score >= 75 ? 'publishable' : 'fixable')),
        qualityGateScore: finiteNumber(qualityGate.score),
        premiumScore: finiteNumber(premium.score),
        issueCodes: mergedIssueCodes,
        sourcePath,
        valid: true
      };
    }
  }
  return { score: 0, status: 'invalid_metrics', qualityGateScore: finiteNumber(qualityGate.score), premiumScore: finiteNumber(premium.score), issueCodes: ['INVALID_METRICS'], sourcePath: '', valid: false, reason: 'No se encontró ningún score numérico en la salida del pipeline.' };
}
