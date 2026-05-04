import * as cheerio from 'cheerio';

export interface PremiumCopyGuardContext {
    niche: string;
    city: string;
    blockType?: string;
    localEntities?: string[];
    phone?: string;
}

function normalizeText(value: string): string {
    return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeKey(value: string): string {
    return normalizeText(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function pickVariant(options: string[], seed: string, fallback = ''): string {
    const pool = (options || []).map((item) => String(item || '').trim()).filter(Boolean);
    if (!pool.length) return fallback;
    return pool[hashString(seed) % pool.length] || fallback || pool[0];
}

function buildLocalReference(context: PremiumCopyGuardContext, salt = ''): string {
    const city = String(context.city || '').trim();
    const entities = Array.isArray(context.localEntities)
        ? context.localEntities.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
    return pickVariant(entities, `${city}|${salt}|local`, city) || city;
}

function detectPremiumCopyFamily(niche: string): 'locksmith' | 'carpentry' | 'electrician' | 'generic' {
    const value = String(niche || '');
    if (/(cerraj|cerradur|bombin|bombín|cilindro|llave|persiana|cierre)/i.test(value)) return 'locksmith';
    if (/(carpint|ebanist|madera|armario|vestidor|parqu|tarima|puerta|lacad|barniz)/i.test(value)) return 'carpentry';
    if (/(electric|cableado|enchufe|diferencial|cuadro|magneto)/i.test(value)) return 'electrician';
    return 'generic';
}

function looksInstructional(text: string): boolean {
    const value = normalizeKey(text);
    if (!value) return false;
    return /^(explica|describe|diferencia|aclara|prioriza|resume|indica|detalla|recomienda|habla de|define|orienta)\b/.test(value)
        || /^(respuesta directa \+|caso frecuente \+|advertencia \+)/.test(value);
}

function looksSemanticPlaceholder(text: string, city: string): boolean {
    const value = normalizeKey(text);
    const normalizedCity = normalizeKey(city);
    if (!value) return false;

    const patterns = [
        /^la respuesta depende del punto exacto a revisar/,
        /^en trabajos de [a-z\s]+ en [a-z\s]+ no solemos recomendar respuestas genericas/,
        /^lo importante es evitar improvisaciones/,
        /^depende de si hablamos de una actuacion puntual/,
        /^en [a-z\s]+ coordinamos los trabajos/,
        /^para abordar /,
        /^la resolucion de /,
        /zonas como [a-z\s]+/,
        /soporte o del elemento afectado/,
        /propuesta tecnica sin sorpresas finales/,
        /cuando hablamos de [a-z\s]+, siempre conviene empezar/,
        /valoracion clara para definir alcance, materiales y orden de intervencion/,
        /explicacion clara del criterio que conviene revisar antes de comparar propuestas/,
        /esta seccion se centra en criterios practicos para valorar el alcance/,
        /criterio tecnico proporcional al caso/,
        /sin prometer una medida universal/,
    ];

    if (patterns.some((pattern) => pattern.test(value))) return true;
    if (normalizedCity && value.includes(`zonas como ${normalizedCity}`)) return true;
    if (looksInstructional(value)) return true;
    return false;
}

function buildGenericAnswer(title: string, context: PremiumCopyGuardContext, index = 0): string {
    const city = String(context.city || '').trim();
    const local = buildLocalReference(context, `${title}|${index}`);
    const niche = String(context.niche || '').trim().toLowerCase();
    const normalizedTitle = normalizeKey(title);

    const family = detectPremiumCopyFamily(niche);

    if (family === 'locksmith') {
        if (context.blockType === 'process_steps') {
            return pickVariant([
                `En ${city}, este paso sirve para comprobar dónde está el fallo real: llave, bombín, cerradura, puerta o alineación del marco, antes de desmontar más de lo necesario.`,
                `Cuando la intervención se prepara en ${local}, conviene ordenar diagnóstico, propuesta técnica, ajuste y verificación final para no añadir daño ni rehacer fases.`,
                `En ${city}, cerrar este punto con una revisión del giro, del cierre y del asentamiento de la puerta evita recaídas por holguras o por piezas incompatibles.`
            ], `${title}|${city}|process|${index}`);
        }

        if (context.blockType === 'faq') {
            if (/abrir|apertura|romper|sin danos|sin danos|daños/.test(normalizedTitle)) {
                return `Depende del tipo de cierre, de si la llave está echada y del estado real del bombín o de la cerradura. En ${city}, lo razonable es intentar primero la vía menos invasiva y decidir después si basta con ajustar el conjunto o si toca sustituir alguna pieza.`;
            }
            if (/bombin|bombin|cilindro|cerradura/.test(normalizedTitle)) {
                return `Suele compensar cambiar solo el bombín cuando el cuerpo de la cerradura sigue funcionando bien y el problema está en desgaste, pérdida de llaves o mejora del nivel de seguridad. Si el mecanismo completo tiene holguras o fallos de cierre, en ${city} conviene revisar el conjunto antes de repetir trabajo.`;
            }
            if (/llaves|copia|copias|perdido|extraviad/.test(normalizedTitle)) {
                return `Cuando no tienes claro quién puede conservar una copia, lo prudente es valorar el cambio de cilindro o la sustitución del sistema que controla el acceso. En ${city}, la decisión depende de cuántas copias circulaban, del tipo de puerta y de si compensa aprovechar para mejorar bombín, escudo o ajuste del cierre.`;
            }
            if (/presupuesto|precio|coste|cuanto/.test(normalizedTitle)) {
                return `El presupuesto cambia según el tipo de cierre, la franja horaria, el estado previo del mecanismo y las piezas que realmente haya que sustituir. En ${city}, comparar bien significa pedir diagnóstico previo, alcance claro y comprobaciones finales, no solo una cifra rápida por teléfono.`;
            }
            if (/antibumping/.test(normalizedTitle)) {
                return `Una solución antibumping tiene sentido cuando quieres elevar la resistencia del acceso sin improvisar con piezas incompatibles. En ${city}, lo razonable es revisar primero bombín, escudo y cerradura para saber si basta con cambiar el cilindro o si conviene reforzar más partes del cierre.`;
            }
            if (/persiana|cierre metalico|cierre metalico|local comercial|comercio/.test(normalizedTitle)) {
                return `Sí, pero no todos los casos tienen el mismo alcance. En ${city}, en cierres metálicos y persianas comerciales conviene diferenciar si el problema está en lamas, eje, guías, motor o cerradura para no pedir una actuación genérica cuando quizá hace falta una visita técnica más concreta.`;
            }
        }

        if (context.blockType === 'local_proof') {
            return pickVariant([
                `En ${city}, este punto tiene valor cuando aterriza la cobertura en referencias concretas como ${local} y explica cómo se ordenan desplazamientos, validación previa y margen para una segunda revisión si hace falta.`,
                `Trabajar con referencia en ${local} ayuda a coordinar la visita con más criterio, sobre todo cuando el caso exige acceso condicionado, horario cerrado o comprobaciones posteriores.`,
                `En ${city}, hablar de cobertura real tiene sentido cuando se conecta con zonas concretas, logística asumible y un diagnóstico previo, no cuando repite fórmulas genéricas sobre presencia local.`
            ], `${title}|${city}|localproof|${index}`);
        }

        if (context.blockType === 'price_guidance' || /presupuesto|precio|comparar|coste/.test(normalizedTitle)) {
            return pickVariant([
                `En ${city}, este punto cambia según el tipo de cierre, el estado previo del mecanismo y si basta con ajustar o hace falta sustituir bombín, escudo o cerradura completa.`,
                `Tomar como referencia ${local} solo tiene sentido si antes se aclara qué incluye el trabajo, qué piezas entran y qué comprobaciones se hacen al final para evitar rehacer la intervención.`,
                `En ${city}, comparar con criterio evita aceptar una cifra rápida sin saber si el problema está en el bombín, en la alineación de la puerta o en el mecanismo completo.`
            ], `${title}|${city}|price|${index}`);
        }

        return pickVariant([
            `En ${city}, ${String(title || '').toLowerCase()} conviene resolverlo con diagnóstico previo, explicación del alcance y revisión final del cierre para no cambiar piezas sin criterio.`,
            `Cuando el trabajo se organiza con referencia en ${local}, ${String(title || '').toLowerCase()} se explica mejor desde el problema real: desgaste, compatibilidad de piezas o necesidad de reajustar la puerta.`,
            `En ${city}, este servicio funciona mejor cuando se aclara qué parte del cierre falla, qué se puede recuperar y qué comprobaciones conviene hacer al terminar.`
        ], `${title}|${city}|genericlocksmith|${index}`);
    }



    if (family === 'carpentry') {
        if (context.blockType === 'process_steps') {
            return pickVariant([
                `En ${city}, este paso sirve para revisar medidas, materiales, herrajes y acabados antes de fabricar o montar nada que luego haya que rehacer.`,
                `Cuando la intervención se ordena con referencia en ${local}, conviene separar visita técnica, definición de materiales, fabricación o ajuste y revisión final del montaje.`,
                `En ${city}, cerrar este punto con una comprobación de nivelación, remates y funcionamiento de puertas o guías evita ajustes posteriores evitables.`
            ], `${title}|${city}|process-carpentry|${index}`);
        }

        if (context.blockType === 'faq') {
            if (/madera|melamina|lacado|barnizado|material/.test(normalizedTitle)) {
                return `Depende del uso, de la humedad del espacio y del acabado que se busca. En ${city}, lo razonable es comparar melamina, DM lacado y madera maciza según presupuesto, mantenimiento y durabilidad real.`;
            }
            if (/armario|vestidor|medida|encaja/.test(normalizedTitle)) {
                return `La clave está en medir bien huecos, desplomes, remates y herrajes antes de fabricar. En ${city}, un mueble a medida funciona mejor cuando el presupuesto parte de una visita técnica y no de medidas aproximadas.`;
            }
            if (/humedad|sol|reparar|restaurar/.test(normalizedTitle)) {
                return `En muchos casos se puede recuperar la pieza, pero depende del daño, del acabado y del soporte. En ${city}, conviene distinguir entre un lijado y barnizado suficiente y una sustitución parcial cuando la estructura ya está comprometida.`;
            }
            if (/presupuesto|precio|coste|cuanto/.test(normalizedTitle)) {
                return `El presupuesto cambia según medidas, materiales, herrajes, complejidad de montaje y remates finales. En ${city}, comparar bien significa pedir visita, desglose y criterios de ejecución, no solo una cifra rápida.`;
            }
        }

        if (context.blockType === 'local_proof') {
            return pickVariant([
                `En ${city}, este punto tiene valor cuando aterriza la cobertura en visitas técnicas reales, coordinación de medición y margen para remates o ajustes posteriores si hacen falta.`,
                `Trabajar con referencia en ${local} ayuda a explicar mejor desplazamientos, toma de medidas y organización del montaje sin prometer coberturas vagas.`,
                `En ${city}, hablar de cobertura real tiene sentido cuando se conecta con logística asumible, revisión previa y un alcance técnico bien definido.`
            ], `${title}|${city}|localproof-carpentry|${index}`);
        }

        if (context.blockType === 'price_guidance' || /presupuesto|precio|comparar|coste/.test(normalizedTitle)) {
            return pickVariant([
                `En ${city}, este punto cambia según medidas útiles, tipo de tablero o madera, calidad de herrajes y complejidad del remate final.`,
                `Tomar como referencia ${local} solo tiene sentido si antes se aclara qué incluye el trabajo, qué materiales entran y cómo se valida el montaje al terminar.`,
                `En ${city}, comparar con criterio evita aceptar una cifra rápida sin saber si hay que fabricar a medida, ajustar in situ o resolver remates adicionales.`
            ], `${title}|${city}|price-carpentry|${index}`);
        }

        return pickVariant([
            `En ${city}, ${String(title || '').toLowerCase()} conviene abordarlo con medición previa, explicación del alcance y revisión final del montaje para no rehacer trabajo.`,
            `Cuando el servicio se organiza con referencia en ${local}, ${String(title || '').toLowerCase()} se entiende mejor desde medidas, materiales y remates reales, no desde promesas genéricas.`,
            `En ${city}, este servicio funciona mejor cuando se aclara qué se fabrica, qué se ajusta en obra y qué comprobaciones conviene hacer al terminar.`
        ], `${title}|${city}|genericcarpentry|${index}`);
    }

    if (family === 'electrician') {
        if (context.blockType === 'process_steps') {
            return pickVariant([
                `En ${city}, este paso sirve para diagnosticar el estado real de la instalación, comprobar derivaciones y asegurar que el cuadro eléctrico cumple la normativa antes de intervenir.`,
                `Cuando la reparación se organiza con referencia en ${local}, conviene separar diagnóstico, propuesta de materiales, ejecución y verificación final de seguridad.`,
                `En ${city}, cerrar este punto con una comprobación de aislamiento y disparo del diferencial evita averías recurrentes y asegura la instalación.`
            ], `${title}|${city}|process-electrician|${index}`);
        }

        if (context.blockType === 'faq') {
            if (/averia|falla|salta|diferencial|luz/.test(normalizedTitle)) {
                return `Un diferencial que salta en ${city} suele deberse a una derivación a tierra o a un exceso de consumo. Lo razonable es desconectar circuitos para aislar el fallo y revisar si hay humedad o algún componente dañado antes de volver a armar.`;
            }
            if (/cuadro|magneto|proteccion|normativa/.test(normalizedTitle)) {
                return `El cuadro eléctrico es el corazón de su seguridad. En ${city}, conviene revisar que los puentes sean del calibre adecuado y que las protecciones respondan según la normativa de baja tensión (REBT).`;
            }
            if (/presupuesto|precio|coste|cuanto/.test(normalizedTitle)) {
                return `El presupuesto cambia según la complejidad del diagnóstico, el tipo de componentes (marcas certificadas) y el estado previo del cableado. En ${city}, comparar bien significa pedir desglose de materiales y mano de obra técnica.`;
            }
        }

        if (context.blockType === 'local_proof') {
            return pickVariant([
                `En ${city}, la cobertura técnica se valida mediante visitas de diagnóstico real, cumplimiento de normativas locales y capacidad de respuesta ante averías urgentes en ${local}.`,
                `Contar con referencia en ${local} permite coordinar mejor la agenda de revisiones y asegurar que el técnico llega con el equipo necesario para el tipo de vivienda de la zona.`,
                `En ${city}, hablar de servicio local implica conocer la red de baja tensión de la zona y poder emitir boletines o informes técnicos si el caso lo requiere.`
            ], `${title}|${city}|localproof-electrician|${index}`);
        }

        return pickVariant([
            `En ${city}, ${String(title || '').toLowerCase()} conviene resolverlo con un diagnóstico técnico previo, explicación de la solución y verificación de seguridad al terminar.`,
            `Cuando el trabajo eléctrico se organiza con referencia en ${local}, ${String(title || '').toLowerCase()} se explica mejor desde la seguridad y el cumplimiento normativo.`,
            `En ${city}, este servicio eléctrico funciona mejor cuando se aclara el alcance de la intervención y se garantiza el uso de componentes certificados.`
        ], `${title}|${city}|genericelectrician|${index}`);
    }

    return pickVariant([
        `En ${city}, ${String(title || '').toLowerCase()} conviene abordarlo con una valoración previa del alcance, del estado real del punto de trabajo y de las comprobaciones necesarias al terminar.`,
        `Tomar como referencia ${local} solo tiene sentido si primero se explica qué incluye la intervención, qué preparación hace falta y qué resultado es razonable esperar.`,
        `En ${city}, este punto aporta más valor cuando aterriza el proceso, evita promesas genéricas y deja claro qué cambia según el caso.`
    ], `${title}|${city}|generic|${index}`);
}

function replaceTextIfWeak(value: string, title: string, context: PremiumCopyGuardContext, index = 0): string {
    const text = normalizeText(value);
    if (!text) return buildGenericAnswer(title, context, index);
    if (!looksSemanticPlaceholder(text, context.city)) return text;
    return buildGenericAnswer(title, context, index);
}

function dedupeOpenings(values: string[], context: PremiumCopyGuardContext, titleBase: string): string[] {
    const seen = new Set<string>();
    return values.map((value, index) => {
        const normalized = normalizeKey(value);
        const opening = normalized.split(/[.?!]/)[0].split(' ').slice(0, 6).join(' ');
        if (!opening || !seen.has(opening)) {
            if (opening) seen.add(opening);
            return value;
        }
        const replacement = buildGenericAnswer(`${titleBase} ${index + 1}`, context, index);
        const replacementOpening = normalizeKey(replacement).split(/[.?!]/)[0].split(' ').slice(0, 6).join(' ');
        if (replacementOpening) seen.add(replacementOpening);
        return replacement;
    });
}

export function refinePremiumBlockCopy(html: string, context: PremiumCopyGuardContext): string {
    const source = String(html || '').trim();
    if (!source) return source;

    const $ = cheerio.load(source, { decodeEntities: false } as any);
    const blockType = String(context.blockType || '').toLowerCase();

    const replacePairs = (selector: string) => {
        const updated: string[] = [];
        $(selector).each((index: number, el: any) => {
            const $el = $(el);
            const title = normalizeText($el.find('h3').first().text()) || `Punto ${index + 1}`;
            const $p = $el.find('p').first();
            if (!$p.length) return;
            const next = replaceTextIfWeak($p.text(), title, context, index);
            updated.push(next);
            $p.text(next);
        });

        const deduped = dedupeOpenings(updated, context, blockType || 'bloque');
        $(selector).each((index: number, el: any) => {
            const $p = $(el).find('p').first();
            if ($p.length && deduped[index]) $p.text(deduped[index]);
        });
    };

    if (blockType === 'faq') {
        replacePairs('.faq-entry, .faq-item, details[data-faq-item="true"], .faq-block [data-faq-item="true"]');
    } else if (blockType === 'services_grid') {
        replacePairs('.service-card, .semantic-card');
    } else if (blockType === 'process_steps') {
        replacePairs('.step-card, .semantic-card');
    } else if (blockType === 'local_proof') {
        replacePairs('.proof-row, .proof-card, .semantic-card');
    } else if (blockType === 'price_guidance') {
        replacePairs('.comparison-row, .semantic-card, .card, article');
        $('.price-guidance__intro p, .price-guidance p').each((index: number, el: any) => {
            const text = normalizeText($(el).text());
            if (looksSemanticPlaceholder(text, context.city)) {
                $(el).text(buildGenericAnswer(`precio ${index + 1}`, { ...context, blockType: 'price_guidance' }, index));
            }
        });
    }

    $('.faq-block__intro p, .cta-panel__intro p, .trust-band__intro p, .local-proof__intro p, .process-steps__intro p').each((index: number, el: any) => {
        const text = normalizeText($(el).text());
        if (looksSemanticPlaceholder(text, context.city)) {
            $(el).text(buildGenericAnswer(`introduccion ${blockType || 'bloque'} ${index + 1}`, context, index));
        }
    });

    const result = $.root().html() || source;
    return result
        .replace(/\s{2,}/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
}
