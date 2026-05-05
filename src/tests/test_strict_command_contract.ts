import { parseStrictServiceCommand } from '../input/strictCommandContract.js';

const parsed = parseStrictServiceCommand('crea una página de cerrajeros en Getafe sobre cambio de bombín');
if (parsed.niche !== 'cerrajeros') throw new Error(`Nicho inesperado: ${parsed.niche}`);
if (parsed.locations[0] !== 'Getafe') throw new Error('No detectó Getafe.');
if (parsed.topic !== 'cambio de bombín') throw new Error(`Focus inesperado: ${parsed.topic}`);

let failed = false;
try {
  parseStrictServiceCommand('haz algo rápido en Getafe');
} catch {
  failed = true;
}
if (!failed) throw new Error('El contrato estricto debería rechazar comandos ambiguos.');

console.log('OK: strict command contract');
