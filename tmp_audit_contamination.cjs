const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('output_sites/fontaneros-sevilla/index.html', 'utf8');
const $ = cheerio.load(html);

const text = $('body').text().replace(/\s+/g, ' ');

// Términos de cerrajería que NO deberían estar
const contamination = [
    'seguridad', 'cerradura', 'acceso', 'robos', 'vandálico', 'intrusión',
    'blindaje', 'bombín', 'cilindro', 'cancela', 'pomo', 'manilla', 'apertura',
    'ganzúa', 'cerrojo', 'sistema de cierre', 'cierre de seguridad', 'emergencia de seguridad',
    'nivel de riesgo', 'protección de su propiedad', 'análisis de seguridad',
    'cumplimiento normativo en sus accesos', 'nivel de riesgo'
];

console.log("\n=== TÉRMINOS DE CONTAMINACIÓN DETECTADOS EN EL HTML FINAL ===");
let found = 0;
contamination.forEach(term => {
    const regex = new RegExp(term, 'gi');
    const matches = text.match(regex);
    if (matches) {
        console.log(`❌ ENCONTRADO (${matches.length}x): "${term}"`);
        found++;
    }
});
if (found === 0) console.log("✅ Sin contaminación detectada.");

console.log("\n=== HEADINGS H2/H3 PROBLEMÁTICOS ===");
$('h2, h3').each((i, el) => {
    const txt = $(el).text().trim();
    const problematic = contamination.some(t => txt.toLowerCase().includes(t));
    if (problematic) {
        console.log(`❌ ${$(el).prop('tagName')}: "${txt}"`);
    }
});
