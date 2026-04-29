export type PipelineErrorType =
  | 'ERROR_SCOPE'
  | 'ERROR_LLM_TIMEOUT'
  | 'ERROR_LLM_EMPTY_RESPONSE'
  | 'ERROR_JSON_PARSE'
  | 'ERROR_SCHEMA_VALIDATION'
  | 'ERROR_RENDER_BLOCK'
  | 'ERROR_SANITIZER'
  | 'ERROR_FILESYSTEM'
  | 'ERROR_STATE_WRITE'
  | 'ERROR_DOM_MALFORMED'
  | 'ERROR_NETWORK'
  | 'ERROR_UNKNOWN';

export interface ClassifiedPipelineError {
  type: PipelineErrorType;
  name: string;
  message: string;
  stack?: string;
  recoverable: boolean;
  hint: string;
}

function stringifyError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name || 'Error', message: error.message || String(error), stack: error.stack };
  }
  if (typeof error === 'object' && error !== null) {
    const anyError = error as { name?: unknown; message?: unknown; stack?: unknown; code?: unknown };
    return {
      name: String(anyError.name || anyError.code || 'Error'),
      message: String(anyError.message || JSON.stringify(error)),
      stack: typeof anyError.stack === 'string' ? anyError.stack : undefined,
    };
  }
  return { name: 'Error', message: String(error) };
}

export function classifyPipelineError(error: unknown, context?: { phase?: string; component?: string }): ClassifiedPipelineError {
  const parsed = stringifyError(error);
  const text = `${parsed.name} ${parsed.message} ${parsed.stack || ''} ${context?.phase || ''} ${context?.component || ''}`.toLowerCase();

  let type: PipelineErrorType = 'ERROR_UNKNOWN';
  let hint = 'Revisar stack trace y artefactos de la fase.';
  let recoverable = false;

  if (/is not defined|cannot access .* before initialization|referenceerror/.test(text)) {
    type = 'ERROR_SCOPE';
    hint = 'Variable fuera de scope o dependencia no propagada. Revisar parámetros de entrada de la fase.';
  } else if (/timeout|etimedout|timed out|abort/.test(text)) {
    type = 'ERROR_LLM_TIMEOUT';
    hint = 'La llamada tardó demasiado. En equipos lentos puede ser normal: aumentar timeout o permitir fallback.';
    recoverable = true;
  } else if (/empty response|respuesta vac[ií]a|no response/.test(text)) {
    type = 'ERROR_LLM_EMPTY_RESPONSE';
    hint = 'El modelo respondió vacío. Revisar prompt, modelo y fallbackResponse.';
    recoverable = true;
  } else if (/json|parse|unexpected token|unterminated string/.test(text)) {
    type = 'ERROR_JSON_PARSE';
    hint = 'Salida no parseable. Guardar raw response y aplicar reparador JSON o fallback.';
    recoverable = true;
  } else if (/zod|schema|contract|validation|invalid_type|required/.test(text)) {
    type = 'ERROR_SCHEMA_VALIDATION';
    hint = 'Contrato de datos incumplido. Revisar input/output de fase y normalizadores.';
  } else if (/render|renderer|block|html composed|procedural/.test(text)) {
    type = 'ERROR_RENDER_BLOCK';
    hint = 'Fallo de renderizado. Revisar bloque, variante visual y fallback HTML.';
    recoverable = true;
  } else if (/sanitize|sanitizer|guard|legal|claim/.test(text)) {
    type = 'ERROR_SANITIZER';
    hint = 'Fallo en guard/sanitizer. Revisar perfil de nicho, claims y fallback legal.';
    recoverable = true;
  } else if (/enoent|eacces|eperm|filesystem|file|directory|rename|writefile/.test(text)) {
    type = context?.component === 'state' ? 'ERROR_STATE_WRITE' : 'ERROR_FILESYSTEM';
    hint = 'Fallo de disco/ruta/permisos. Revisar carpeta debug_runs y escrituras atómicas.';
  } else if (/dom|malformed|cheerio|closing tag|doctype/.test(text)) {
    type = 'ERROR_DOM_MALFORMED';
    hint = 'HTML/DOM malformado. Tratar autopsia DOM como baja confianza y revisar renderer.';
    recoverable = true;
  } else if (/econnrefused|network|socket|axios|ollama/.test(text)) {
    type = 'ERROR_NETWORK';
    hint = 'Conexión externa o Ollama no disponible. Revisar servicio local y URL.';
    recoverable = true;
  }

  return { type, name: parsed.name, message: parsed.message, stack: parsed.stack, recoverable, hint };
}
