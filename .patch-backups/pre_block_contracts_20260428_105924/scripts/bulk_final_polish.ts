import fs from 'fs/promises';
import path from 'path';
import { finalHtmlPolish } from '../src/utils/finalHtmlPolish.js';

async function bulkPolish() {
    const outputDir = path.join(process.cwd(), 'output_sites');
    
    async function findHtmlFiles(dir: string, fileList: string[] = []) {
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
            const res = path.resolve(dir, file.name);
            if (file.isDirectory()) {
                await findHtmlFiles(res, fileList);
            } else if (file.name === 'index.html') {
                fileList.push(res);
            }
        }
        return fileList;
    }

    console.log('🔍 Finding index.html files in output_sites...');
    const htmlFiles = await findHtmlFiles(outputDir);
    console.log(`✨ Found ${htmlFiles.length} files to polish.`);

    for (const filePath of htmlFiles) {
        // Infer city from path (parent directory)
        const parentDir = path.basename(path.dirname(filePath));
        const cityMatch = parentDir.split('-').pop();
        const city = cityMatch ? cityMatch.charAt(0).toUpperCase() + cityMatch.slice(1) : undefined;
        
        console.log(`🛠 Polishing ${filePath} (Inferred City: ${city})...`);
        const content = await fs.readFile(filePath, 'utf8');
        const polished = finalHtmlPolish(content, { city });
        await fs.writeFile(filePath, polished, 'utf8');
    }
    
    console.log('✅ Bulk polish completed.');
}

bulkPolish().catch(console.error);
