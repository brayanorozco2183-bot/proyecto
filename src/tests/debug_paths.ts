
import path from 'path';
import * as cheerio from 'cheerio';

function toRelativeHref(targetFilePath: string, currentFilePath: string): string {
  const currentDir = path.dirname(currentFilePath);
  const targetDir = path.dirname(targetFilePath);

  let relative = path.relative(currentDir, targetDir).replace(/\\/g, '/');
  if (!relative) return './';

  if (!relative.endsWith('/')) {
    relative = `${relative}/`;
  }

  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }

  return relative;
}

function autoFixLinksMock(html: string) {
    const $ = cheerio.load(html);
    $('a').each((_, el) => {
        const href = ($(el).attr('href') || '').trim();
        let normalizedHref = href
            .replace(/\/index\.html\/?$/i, '/')
            .replace(/([^:])\/\/+?/g, '$1/')
            .replace(/\s+/g, '');

        if (normalizedHref.startsWith('./')) normalizedHref = normalizedHref.slice(1);
        
        // La lógica que arreglé
        if (!normalizedHref.startsWith('/') && !normalizedHref.startsWith('.') && !normalizedHref.startsWith('#') && !normalizedHref.startsWith('mailto:') && !normalizedHref.startsWith('tel:')) {
            normalizedHref = `/${normalizedHref}`;
        }

        $(el).attr('href', normalizedHref);
    });
    return $.html();
}

const current = 'C:/Users/Bryan/Desktop/pruebaGravity/output_sites/fontaneros-getafe/servicios-tecnicos/index.html';
const target = 'C:/Users/Bryan/Desktop/pruebaGravity/output_sites/fontaneros-alcorcon/servicios-tecnicos/index.html';

const rel = toRelativeHref(target, current);
console.log(`Relative calculated: "${rel}"`);

const html = `<a href="${rel}">Link</a>`;
const fixed = autoFixLinksMock(html);
console.log(`HTML fixed: ${fixed}`);
