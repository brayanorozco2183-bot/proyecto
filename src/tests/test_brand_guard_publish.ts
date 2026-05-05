import { sanitizeBrandName, buildCanonicalBrandName, repairBrokenLocalFragments } from '../utils/brandGuard.js';

const brand = sanitizeBrandName('de cerrajeros getafe en Getafe', { niche: 'cerrajeros', city: 'Getafe' });
if (/Getafe\s+en\s+Getafe/i.test(brand)) throw new Error('No eliminó duplicidad de ciudad.');
if (!/Cerrajeros Getafe Pro/i.test(brand)) throw new Error(`Brand inesperado: ${brand}`);

const canonical = buildCanonicalBrandName({ niche: 'carpinteros', city: 'Madrid' });
if (canonical !== 'Carpinteros Madrid Pro') throw new Error(`Canonical brand inesperado: ${canonical}`);

const repaired = repairBrokenLocalFragments('En , conviene revisar si en compensa reparar.', 'Getafe');
if (!/En Getafe,/i.test(repaired) || !/en Getafe compensa/i.test(repaired)) throw new Error('No reparó fragmentos locales.');

console.log('OK: brand guard publish');
