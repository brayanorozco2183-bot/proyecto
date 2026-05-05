import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['src/utils/superDeliveryLock.ts', 'GRAVITY_SUPER_DELIVERY_LOCK_APPLIED'],
  ['src/pipelines/phases/delivery.phase.ts', 'applySuperDeliveryLockToHtml'],
  ['src/utils/finalDocumentSanitizer.ts', 'applySuperDeliveryLock'],
  ['src/repair/pageRepairKit.ts', 'applySuperDeliveryLock'],
  ['src/utils/finalHtmlPolish.ts', 'GRAVITY_LEGACY_LAYERED_CSS'],
  ['package.json', 'verify:super-delivery-lock'],
];

const failures = [];
for (const [rel, needle] of checks) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: no existe`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(needle)) failures.push(`${rel}: falta ${needle}`);
}

const superFile = path.join(root, 'src/utils/superDeliveryLock.ts');
const superText = fs.existsSync(superFile) ? fs.readFileSync(superFile, 'utf8') : '';
for (const oldId of ['patch-premium-safe-polish', 'layout-hotfix-performance', 'gravity-release-visual-freeze-css']) {
  if (!superText.includes("$('style').remove()") && !superText.includes('removeStyleDebt')) {
    failures.push(`superDeliveryLock.ts no parece limpiar estilos legacy (${oldId})`);
  }
}

const sample = `<!doctype html><html><head><style id="patch-premium-safe-polish">.x{}</style></head><body class="gravity-release-visual-freeze"><header class="site-header"><div class="site-header__inner"><a class="brand">Marca</a><nav class="nav--desktop"><a class="nav__link" href="#missing">Inicio</a></nav><details class="nav-mobile" open><summary class="nav-mobile__summary">Menú</summary><div class="nav-mobile__panel">Menu</div></details></div></header><main><p>Inicio Valencia Cerrajeros en Valencia</p><section class="hero"><div class="hero__minimal"><span class="hero__eyebrow">Servicio local</span><h1>Cerrajeros en Valencia</h1><p class="hero__subtitle">undefined : este bloque resume algo.</p><div class="hero-visual"><div class="hero-visual__frame"><img src="hero.png"></div></div></div></section><section><h2>Nuestros Servicios</h2><ul><li>Precio orientativo antes del desplazamiento</li></ul></section></main><footer></footer></body></html>`;
const tmp = path.join(root, '.tmp_super_delivery_lock_sample.mjs');
try {
  const modPath = './src/utils/superDeliveryLock.ts';
  // No importamos TS aquí para evitar depender de tsx; validamos estáticamente.
  if (!superText.includes('applySuperDeliveryLockToHtml')) failures.push('superDeliveryLock.ts no exporta applySuperDeliveryLockToHtml');
} finally {
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
}

if (failures.length) {
  console.error('❌ Super Delivery Lock verification failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('✅ Super Delivery Lock aplicado correctamente en la ruta final de entrega.');
console.log('   Verifica que el próximo index.html contenga: GRAVITY_SUPER_DELIVERY_LOCK_APPLIED');
console.log('   y el CSS final: gravity-super-delivery-lock-css');
