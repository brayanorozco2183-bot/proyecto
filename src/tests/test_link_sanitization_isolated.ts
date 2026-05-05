
import { autoFixLayoutHtml } from '../utils/layoutGuard.js';
import { sanitizeFinalRenderedHtml } from '../utils/finalDocumentSanitizer.js';

async function testSanitizationIsolated() {
    console.log('🧪 Iniciando Test AISLADO de Sanitización de Links...');

    const sampleHtml = `
        <div class="test">
            <a href="../../fontaneros-alcorcon/servicios-tecnicos/">Link Ciudad A</a>
            <a href="../../fontaneros-mostoles/servicios-tecnicos/">Link Ciudad B</a>
            <a href="/aviso-legal/">Link Raíz</a>
        </div>
    `;

    const context = {
        city: 'Getafe',
        niche: 'fontaneros',
        businessName: 'Test Business',
        phone: '600000000'
    };

    console.log('\n1. Probando autoFixLayoutHtml (layoutGuard)...');
    const fixedLayout = autoFixLayoutHtml(sampleHtml, context, { isBlockOnly: true });
    
    if (fixedLayout.includes('href="/../../')) {
        console.error('❌ FALLO en layoutGuard: Se inyectó barra inicial "/../../"');
    } else {
        console.log('✅ ÉXITO en layoutGuard: Links relativos preservados.');
    }

    console.log('\n2. Probando sanitizeFinalRenderedHtml (finalDocumentSanitizer)...');
    const fixedFinal = sanitizeFinalRenderedHtml(sampleHtml, context);

    if (fixedFinal.includes('href="/../../')) {
        console.error('❌ FALLO en finalDocumentSanitizer: Se inyectó barra inicial "/../../"');
    } else {
        console.log('✅ ÉXITO en finalDocumentSanitizer: Links relativos preservados.');
    }

    // Verificación final del contenido
    console.log('\n--- Resultado Final (Fragmento) ---');
    const linkMatch = fixedFinal.match(/href="([^"]+)"/g);
    console.log(linkMatch);
}

testSanitizationIsolated().catch(console.error);
