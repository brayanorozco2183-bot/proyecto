import { readFileSync } from 'node:fs';

const requiredFiles = [
  'src/design-system/finalDeliveryEmergencyCss.ts',
  'src/utils/finalDeliveryDomFixes.ts',
  'src/utils/finalDocumentSanitizer.ts'
];

const failures = [];
for (const file of requiredFiles) {
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    failures.push(`No existe ${file}`);
    continue;
  }
  if (file.endsWith('finalDeliveryEmergencyCss.ts') && !text.includes('gravity-final-delivery-lock')) {
    failures.push('El CSS final no contiene el scope gravity-final-delivery-lock.');
  }
  if (file.endsWith('finalDeliveryDomFixes.ts')) {
    for (const token of ['applyFinalDeliveryDomFixes', 'hardenNavigation', 'hardenHeroMedia', 'ensureFinalEmergencyCss']) {
      if (!text.includes(token)) failures.push(`Falta ${token} en finalDeliveryDomFixes.ts`);
    }
  }
  if (file.endsWith('finalDocumentSanitizer.ts') && !text.includes('applyFinalDeliveryDomFixes($, context);')) {
    failures.push('finalDocumentSanitizer no llama a applyFinalDeliveryDomFixes.');
  }
}

if (failures.length) {
  console.error('❌ Verificación Final Delivery Emergency Lock fallida:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('✅ Final Delivery Emergency Lock instalado correctamente.');
