import axios from 'axios';
import { vault } from '../src/tools/vault.js';

type TagsResponse = { models?: Array<{ name?: string; model?: string }> };

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

async function main() {
  const endpoint = `${vault.OLLAMA_URL}/api/tags`;
  const response = await axios.get<TagsResponse>(endpoint, { timeout: 10000 });
  const installed = unique((response.data?.models || []).map((m) => String(m.name || m.model || '').trim()));

  const expected = unique([
    vault.OLLAMA_MODEL_RESEARCH,
    vault.OLLAMA_MODEL_COPY,
    vault.OLLAMA_MODEL_FAST,
    vault.OLLAMA_MODEL_STANDARD,
    vault.OLLAMA_MODEL_PREMIUM,
    vault.OLLAMA_MODEL_CODER,
  ]);

  const missing = expected.filter((name) => !installed.includes(name));

  console.log('\n=== OLLAMA MODELS: INSTALLED ===');
  installed.forEach((name) => console.log(`- ${name}`));

  console.log('\n=== OLLAMA MODELS: EXPECTED BY .env ===');
  expected.forEach((name) => console.log(`- ${name}`));

  if (!missing.length) {
    console.log('\n✅ Todos los modelos del .env están instalados.');
    return;
  }

  console.log('\n⚠️ Faltan modelos:');
  missing.forEach((name) => console.log(`- ${name}`));

  console.log('\nComandos sugeridos:');
  missing.forEach((name) => console.log(`ollama pull ${name}`));
  process.exitCode = 1;
}

main().catch((error) => {
  console.error('❌ Error comprobando modelos de Ollama:', error?.message || error);
  process.exit(1);
});
