const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('output_sites/fontaneros-sevilla/index.html', 'utf8');
const $ = cheerio.load(html);

const headings = [];
$('h1, h2, h3').each((i, el) => {
    headings.push($(el).text().trim());
});

console.log("=== HEADINGS ===");
headings.forEach(h => console.log("- " + h));

console.log("\n=== CONTEXT PREVIEW ===");
let text = $('p').text().replace(/\s+/g, ' ').trim();
console.log(text.slice(0, 2000));
console.log("\n...\n");
console.log(text.slice(text.length - 2000));
