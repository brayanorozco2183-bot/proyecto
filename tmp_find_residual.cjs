const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('output_sites/fontaneros-sevilla/index.html', 'utf8');
const $ = cheerio.load(html);

const text = $('body').text().replace(/\s+/g, ' ');
const idx = text.toLowerCase().indexOf('seguridad');
if (idx >= 0) {
    console.log(`CONTEXT: ...${text.slice(Math.max(0, idx-100), idx+150)}...`);
} else {
    console.log('No match found.');
}
