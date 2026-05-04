import fs from 'fs';
const html = fs.readFileSync('debug_layout_test.html', 'utf8');

console.log("--- Section Analysis ---");
const sectionRegex = /<section class=\"([^\"]*)\" id=\"([^\"]*)\"/g;
let match;
while ((match = sectionRegex.exec(html)) !== null) {
    console.log(`ID: ${match[2]}, Classes: ${match[1]}`);
}

console.log("\n--- Layout Flow Analysis ---");
const flowRegex = /<div class=\"([^\"]*layout-flow[^\"]*)\"/g;
while ((match = flowRegex.exec(html)) !== null) {
    console.log(`Flow Classes: ${match[1]}`);
}

console.log("\n--- Body Classes Analysis ---");
const bodyRegex = /<body class=\"([^\"]*)\"/g;
if ((match = bodyRegex.exec(html)) !== null) {
    console.log(`Body Classes: ${match[1]}`);
}
