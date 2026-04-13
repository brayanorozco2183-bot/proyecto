import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

const root = 'c:\\Users\\Bryan\\Desktop\\pruebaGravity';
const logFile = path.join(root, 'tmp', 'mock_ollama_log.txt');

function log(msg: string) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(logFile, entry);
    console.log(msg);
}

const FILLERS = [
    "Realizamos intervenciones diarias con herramientas de precisión y materiales homologados de máxima resistencia para asegurar que cada componente instalado cumpla con los estándares de seguridad europeos.",
    "Nuestro compromiso inquebrantable es su tranquilidad absoluta y la protección de su propiedad en todo momento, utilizando técnicas no invasivas que preservan la integridad de sus instalaciones originales.",
    "Trabajamos exclusivamente con marcas de prestigio como Fichet, Dierre y Tesa para asegurar resultados óptimos y duraderos en el tiempo, adaptándonos al entorno local.",
    "Nuestra metodología se basa en la transparencia total y la eficiencia operativa en cada rincón, garantizando una respuesta rápida ante cualquier incidencia técnica o emergencia imprevista.",
    "Cada especialista de nuestro equipo cuenta con una certificación técnica rigurosa y años de experiencia práctica en la resolución de problemas complejos relacionados con sistemas de acceso.",
    "Implementamos soluciones personalizadas que integran la última tecnología en cerrajería profesional, desde cilindros antibumping hasta escudos protectores de alta resistencia contra ataques externos dirigidos.",
    "La seguridad de su hogar o negocio es nuestra prioridad fundamental, por lo que aplicamos protocolos de verificación técnica en cada fase del proceso de instalación o reparación.",
    "Disponemos de unidades móviles equipadas con todo el material necesario para solventar la mayoría de las situaciones en una sola visita, optimizando al máximo el tiempo de respuesta.",
    "Atendemos solicitudes de mantenimiento preventivo para comunidades de vecinos y administradores de fincas que requieren un alto nivel de fiabilidad y cumplimiento normativo en sus accesos.",
    "La innovación constante nos permite ofrecer sistemas de control de acceso digital y cerraduras electrónicas que combinan comodidad con los más altos niveles de protección contra intrusiones.",
    "Realizamos aperturas judiciales y desahucios con la máxima discreción and profesionalidad, colaborando estrechamente con las autoridades para asegurar que el proceso se ejecute sin contratiempos de ningún tipo.",
    "Nuestros técnicos están en formación continua para conocer las últimas vulnerabilidades en sistemas de cierre y poder ofrecer así las contramedidas más eficaces a nuestros clientes.",
    "Valoramos la satisfacción del cliente por encima de todo, por lo que ofrecemos un servicio de post-venta excepcional para resolver cualquier duda o ajuste necesario tras la intervención.",
    "La rapidez no está reñida con la calidad; nuestros protocolos de actuación están diseñados para minimizar los tiempos de espera sin comprometer la precisión milimétrica requerida.",
    "Contamos con un almacén propio con stock permanente de las referencias más habituales, lo que nos permite actuar de forma inmediata sin depender de suministradores externos.",
    "Aplicamos tarifas competitivas y transparentes, proporcionando presupuestos cerrados antes de iniciar cualquier trabajo para evitar sorpresas desagradables y garantizar una relación de confianza estable.",
    "Nuestra presencia en los principales barrios nos permite conocer las particularidades de las instalaciones locales, adaptando nuestras soluciones al tipo de edificación y nivel de riesgo.",
    "El uso de repuestos originales es una norma estricta en nuestra empresa, ya que garantiza la compatibilidad total y prolonga la vida útil de los mecanismos de seguridad.",
    "La ética profesional guía cada una de nuestras intervenciones, asegurando que siempre recomendemos la solución más adecuada y costee-efectiva para el problema planteado.",
    "Disponemos de equipos especializados en la reparación y motorización de persianas metálicas comerciales, asegurando que su negocio esté protegido y operativo rápidamente.",
    "La cerrajería técnica requiere una atención al detalle absoluta; desde el ajuste de un pernio hasta la codificación de una llave maestra, todo se realiza bajo control.",
    "Nuestra visión es ser el referente de seguridad en el que confían las familias y empresas locales, aportando valor a través del conocimiento técnico y la honestidad.",
    "Entendemos que una emergencia de seguridad no puede esperar, por ello mantenemos una logística de guardia rotativa que cubre las 24 horas del día íntegramente.",
    "La protección contra el bumping, el ganzuado y la extracción es fundamental en la actualidad, por lo que solo instalamos cilindros con certificaciones comprobadas oficialmente.",
    "Realizamos auditorías de seguridad gratuitas para nuestros clientes, identificando puntos débiles en sus accesos y proponiendo mejoras graduales que se ajusten al presupuesto.",
    "La instalación de cierres de seguridad en locales comerciales es una de nuestras especialidades más demandadas para prevenir robos nocturnos y actos vandálicos.",
    "Ofrecemos asesoramiento personalizado para la elección de cajas fuertes, considerando tanto el nivel de resistencia como la facilidad de uso para el cliente final.",
    "Nuestros planes de amaestramiento de llaves permiten simplificar la gestión de accesos en empresas, reduciendo el número de llaves necesarias sin comprometer la seguridad.",
    "La tecnología de llaves incopiables aporta un nivel extra de control sobre quién puede realizar duplicados, evitando brechas de seguridad por copias no autorizadas.",
    "Resolvemos averías en puertas automáticas y cancelas, ajustando sensores y mecanismos de tracción para garantizar un funcionamiento fluido y seguro para los usuarios.",
    "La sustitución de pomos y manillas por modelos más ergonómicos y resistentes mejora tanto la estética como la funcionalidad de las puertas interiores y exteriores.",
    "Instalamos mirillas digitales de alta resolución que permiten ver con claridad quién llama a la puerta, aumentando la sensación de seguridad de los residentes.",
    "El refuerzo de marcos de madera con pletinas de acero es una solución económica y muy efectiva para evitar el apalancamiento de puertas convencionales.",
    "Disponemos de soluciones específicas para puertas de trastero, que suelen ser objetivos fáciles si no cuentan con una protección técnica mínima instalada.",
    "La unificación de cilindros permite abrir todas las puertas de una vivienda con una sola llave, aportando una comodidad sin precedentes para el usuario diario.",
    "Nuestras intervenciones en persianas domésticas incluyen el cambio de cintas, lamas y motores para asegurar un aislamiento térmico y acústico óptimo.",
    "La seguridad pasiva es tan importante como la activa; por ello analizamos el entorno para detectar posibles rutas de escalo o intrusión periférica.",
    "Los muelles cierrapuertas instalados por nuestros técnicos aseguran que las puertas de acceso nunca queden abiertas accidentalmente, manteniendo la seguridad del recinto.",
    "Realizamos la apertura de vehículos de todas las marcas sin causar daños en la carrocería o los sistemas eléctricos, recuperando sus llaves rápidamente.",
    "El servicio técnico de cajas fuertes incluye la apertura por olvido de clave o fallo mecánico, así como el cambio de combinaciones electrónicas obsoletas.",
    "Instalamos barras antipánico en salidas de emergencia, cumpliendo estrictamente con la normativa de seguridad contra incendios y evacuación de edificios públicos.",
    "La protección de ventanas con rejas fijas o extensibles es una medida disuasoria muy potente que complementa perfectamente a cualquier cerradura de alta seguridad."
];

const ITEM_STARTERS = [
    "Ejecutamos acciones profesionales de alta precisión en {city} de forma limpia.",
    "Nuestro equipo utiliza siempre herramientas de última generación en {city} hoy.",
    "Garantizamos resultados óptimos verificados en cada actuación en la zona de {city}.",
    "Aplicamos técnicas avanzadas de seguridad en todas nuestras obras en {city}.",
    "La rapidez y la eficacia son nuestras prioridades al trabajar en {city}.",
    "Cada intervención técnica se realiza bajo estrictos controles de calidad en {city}.",
    "Disponemos de un stock permanente de repuestos originales listos para {city}.",
    "Nuestra experiencia nos permite resolver cualquier imprevisto técnico en {city}.",
    "Aseguramos una integración perfecta de los nuevos sistemas instalados en {city}.",
    "La transparencia en el proceso es fundamental para nuestros clientes en {city}."
];

const BLOCK_INTROS = [
    "Ofrecemos un servicio especializado de {niche} en {city} orientado a resultados de alta calidad técnica.",
    "Como expertos en {niche} dentro de {city}, entendemos perfectamente las necesidades de seguridad locales.",
    "La excelencia técnica en {niche} es nuestra seña de identidad en toda el área metropolitana de {city}.",
    "Si busca profesionales de {niche} en {city}, disponemos de la tecnología más avanzada del sector actual.",
    "Garantizamos una respuesta inmediata de {niche} en {city} para cualquier tipo de emergencia de seguridad.",
    "Nuestra trayectoria como {niche} en {city} nos avala como líderes indiscutibles en confianza y rapidez.",
    "Brindamos soluciones integrales de {niche} en {city} con un enfoque centrado en la protección del cliente.",
    "La seguridad técnica es vital, por eso nuestro equipo de {niche} en {city} solo utiliza material homologado.",
    "Atendemos cada solicitud de {niche} en {city} con la máxima prioridad y rigor profesional garantizado.",
    "Desde instalaciones complejas hasta reparaciones rápidas, su {niche} en {city} le ofrece garantía total."
];

let fillerPool = [...FILLERS];
let introPool = [...BLOCK_INTROS];
let itemPool = [...ITEM_STARTERS];

function shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getVariedFiller(count = 2) { 
    if (fillerPool.length < count) {
        fillerPool = [...FILLERS];
        shuffle(fillerPool);
    }
    const selected = fillerPool.splice(0, count);
    const variations = ["con total garantía técnica", "uso de sistemas avanzados", "compromiso profesional directo", "seguridad certificada", "calidad verificada"];
    const randomVar = variations[Math.floor(Math.random() * variations.length)];
    const uniqueSalt = Math.random().toString(36).substring(7);
    return selected.join(" ") + " " + randomVar + " (TR-" + uniqueSalt + ").";
}

function getVariedIntro(niche: string, city: string) {
    if (introPool.length === 0) {
        introPool = [...BLOCK_INTROS];
        shuffle(introPool);
    }
    const template = introPool.splice(0, 1)[0];
    const adjectives = ["excepcional", "líder", "especializado", "de confianza", "profesional"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    return template.replace(/{niche}/g, niche).replace(/{city}/g, city) + " de forma " + adj + ".";
}

function getVariedItemBody(city: string) {
    if (itemPool.length === 0) {
        itemPool = [...ITEM_STARTERS];
        shuffle(itemPool);
    }
    const prefixes = ["Bajo supervisión directa,", "Como medida estándar,", "Principalmente,", "Efectivamente,", "De manera integral,", "Técnicamente,"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const starter = itemPool.splice(0, 1)[0].replace(/{city}/g, city);
    return `${prefix} ${starter} ${getVariedFiller(2)}`; 
}

app.post('/api/generate', (req, res) => {
    try {
        const { model, prompt } = req.body;
        const currentPrompt = prompt || "";
        const lowP = currentPrompt.toLowerCase();
        
        fs.appendFileSync(path.join(root, 'ollama_prompts.log'), `--- PROMPT ---\n${currentPrompt}\n\n`);
        log(`[Request] Prompt Snippet: ${lowP.substring(0, 300).replace(/\n/g, ' ')}...`);
        
        let responseObj: any = {};
        let isRawResponse = false;
        let rawResponse = "";

        // Smart extraction: Look for the command part first
        let commandPart = lowP;
        if (lowP.includes('command:')) {
            // The command is usually between quotes right after "command:"
            const match = lowP.match(/command:[:\s]*["']?([^"'\n}]+)["']?/);
            if (match) commandPart = match[1];
            else commandPart = lowP.split('command:')[1].substring(0, 100);
        }

        let nicheName = "Servicios";
        // Try commandPart first, then fall back to entire prompt
        const checkNiche = (text: string) => {
            if (text.includes('cerrajero') || text.includes('cerrajeria')) return "Cerrajeros";
            if (text.includes('electricista') || text.includes('electricidad')) return "Electricistas";
            if (text.includes('fontanero') || text.includes('fontaneria')) return "Fontaneros";
            if (text.includes('pintor') || text.includes('pintura')) return "Pintores";
            if (text.includes('carpintero') || text.includes('carpinteria')) return "Carpinteros";
            return null;
        };

        nicheName = checkNiche(commandPart) || checkNiche(lowP) || "Servicios";

        const isBarcelona = commandPart.includes('barcelona');
        const isValencia = commandPart.includes('valencia');
        const isMadrid = commandPart.includes('madrid');
        const isSevilla = commandPart.includes('sevilla');
        const isBilbao = commandPart.includes('bilbao');

        let cityName = "Madrid";
        if (isBarcelona) cityName = "Barcelona";
        else if (isValencia) cityName = "Valencia";
        else if (isSevilla) cityName = "Sevilla";
        else if (isBilbao) cityName = "Bilbao";
        else if (isMadrid) cityName = "Madrid";

        log(`[Niche Detection] Identified Niche: ${nicheName}, City: ${cityName}`);

        const phone = isBarcelona ? "930 112 233" : (isValencia ? "960 112 233" : (isSevilla ? "954 112 233" : (isBilbao ? "944 112 233" : "910 112 233")));
        const address = isBarcelona ? "Carrer de Balmes, 15, 08007 Barcelona" : `Calle Principal 123, ${cityName}`;
        const business_name = `${nicheName} ${cityName} Pro`;
        const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2993!2d2.16!3d41.38!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0!2zMTPCsDAwJzAwLjAiTiAywrAwMCcwMC4wIkU!5e0!3m2!1ses!2ses!4v1";

        // 1. ARCHITECT / COMPOSER
        if (lowP.includes('layout composer') || lowP.includes('maquetador') || lowP.includes('composer')) {
            const sequences = [
                ["hero", "urgencia", "servicios", "procesos", "zonas", "donde-estamos", "faq", "senales-confianza", "contacto"],
                ["hero", "servicios", "urgencia", "senales-confianza", "zonas", "donde-estamos", "faq", "procesos", "contacto"],
                ["hero", "procesos", "servicios", "zonas", "donde-estamos", "urgencia", "faq", "senales-confianza", "contacto"]
            ];
            const seqIndex = (cityName.length) % sequences.length;
            responseObj = {
                orderedSectionIds: sequences[seqIndex],
                sections: {
                    hero: { shell: "plain", flow: "stack" },
                    urgencia: { shell: "plain", flow: "stack" },
                    servicios: { shell: "panel", flow: "zigzag" },
                    procesos: { shell: "plain", flow: "stack" },
                    zonas: { shell: "plain", flow: "split" },
                    "donde-estamos": { shell: "plain", flow: "centered" },
                    faq: { shell: "panel", flow: "stack" },
                    "senales-confianza": { shell: "band", flow: "stack" },
                    contacto: { shell: "panel", flow: "stack" }
                }
            };
            log(`[Architect] Layout match.`);
        } 
        else if (lowP.includes('architecto') || lowP.includes('director general de estrategia')) {
            responseObj = {
                h1: `${nicheName} en ${cityName} Profesionales con Garantía Real 24h`,
                meta_title: `${nicheName} en ${cityName} de Confianza Servicio Técnico 24h`,
                meta_description: `Servicio especializado de ${nicheName} en ${cityName}. Expertos en ${nicheName.toLowerCase()} con garantía oficial por escrito de 12 meses.`,
                page_skeleton: "editorial-longform",
                sections: [
                    { section_id: "hero", h2: `Excelencia en ${nicheName}: Servicio en ${cityName}`, block_type: "hero", target_words: 150 },
                    { section_id: "urgencia", h2: `Asistencia de Emergencia en ${cityName}: Llegamos Hoy`, h3s: ["Servicio Urgente"], block_type: "urgency_panel", target_words: 350 },
                    { section_id: "servicios", h2: `Especialidades de ${nicheName} en ${cityName}`, h3s: nicheName === "Pintores" ? ["Pintura Pro", "Alisado"] : ["Aperturas", "Blindajes"], block_type: "services_grid", target_words: 350 },
                    { section_id: "procesos", h2: `Nuestra Metodología en la Zona de ${cityName}`, h3s: ["Análisis de Seguridad"], block_type: "process_steps", target_words: 350 },
                    { section_id: "zonas", h2: `Cobertura en ${cityName} y Distritos`, h3s: ["Técnicos de Proximidad"], block_type: "local_proof", target_words: 350 },
                    { section_id: "donde-estamos", h2: `Mapa de Cobertura en ${cityName}`, h3s: ["Nuestra Base"], block_type: "map", target_words: 250 },
                    { section_id: "faq", h2: `Preguntas sobre ${nicheName} en ${cityName}`, h3s: ["¿Cómo trabajamos?"], block_type: "faq", target_words: 450 },
                    { section_id: "senales-confianza", h2: `Por qué confiar en un ${nicheName} en ${cityName}`, h3s: ["Garantía Real"], block_type: "trust_band", target_words: 250 },
                    { section_id: "contacto", h2: `Pide tu Presupuesto en ${cityName}`, h3s: ["Atención Directa"], block_type: "cta_panel", target_words: 250 }
                ],
                schemaTypes: ["LocalBusiness", "Service", "FAQPage", "BreadcrumbList", "WebPage"]
            };
            log(`[Architect] Blueprint match.`);
        }
        // 2. WRITER (HIGER THAN QUALITY TO AVOID INTERCEPTION BY "auditor")
        else if (lowP.includes('redactor') || lowP.includes('writer') || lowP.includes('redactar') || lowP.includes('contar una historia') || lowP.includes('escribe solo el cuerpo')) {
            const introText = getVariedIntro(nicheName, cityName) + " " + getVariedFiller(2);
            responseObj = {
                intro: [introText, getVariedFiller(2), getVariedFiller(1)],
                items: [
                    { title: `Servicio de ${nicheName} en ${cityName}`, body: getVariedItemBody(cityName) },
                    { title: `Intervención profesional en ${cityName}`, body: getVariedItemBody(cityName) },
                    { title: `Calidad técnica en ${cityName}`, body: getVariedItemBody(cityName) }
                ],
                faqItems: [
                    { question: `¿Cuánto tarda en ${cityName}?`, answer: `Llegamos rápido a ${cityName}. ${getVariedFiller(1)}` },
                    { question: `¿Garantía en ${cityName}?`, answer: `Sí, en todo ${cityName}. ${getVariedFiller(1)}` }
                ],
                cta: { text: "Llamar ahora", phone: phone }
            };
            if (lowP.includes('mapa') || lowP.includes('block_type: map')) {
                responseObj.context = { mapEmbedUrl: mapUrl, businessName: business_name, phone: phone };
            }
            log(`[Writer] Content generated.`);
        }
        // 3. QUALITY / TECHNICAL
        else if (lowP.includes('quality') || lowP.includes('auditor') || lowP.includes('linguist') || lowP.includes('corrector') || lowP.includes('html a corregir')) {
            if (currentPrompt.includes('CÓDIGO HTML A ANALIZAR:') || currentPrompt.includes('HTML A CORREGIR:')) {
                isRawResponse = true;
                const parts = currentPrompt.split(/CÓDIGO HTML A ANALIZAR:|HTML A CORREGIR:/);
                rawResponse = parts[parts.length - 1].trim();
                log(`[Technical] Passthrough.`);
            } else {
                responseObj = { score: 99, issues: [], passed: true };
                log(`[Technical] JSON.`);
            }
        }
        // 4. SEO / OTHER
        else if (lowP.includes('mission data')) {
            responseObj = { niche: nicheName.toLowerCase(), locations: [cityName.toLowerCase()], is_cluster: false, scope: "city" };
        }
        else if (lowP.includes('analyst') || lowP.includes('estatuto')) {
            responseObj = {
                primaryKeyword: `${nicheName} ${cityName}`,
                secondaryKeywords: [`${nicheName} urgente ${cityName}`],
                entities: [cityName],
                pageTypeRecommendation: "service",
                primaryIntent: "transactional",
                wordCountTarget: 1950,
                strategyConfidence: "high"
            };
        }
        else if (lowP.includes('seo local') || lowP.includes('citaciones')) {
            responseObj = { business_name, address, phone, mapEmbedUrl: mapUrl, consistency_score: 98, citations: [], local_blurb: "Soporte cualificado local." };
        }
        else {
            responseObj = { success: true };
        }

        const jsonString = isRawResponse ? rawResponse : JSON.stringify(responseObj);
        res.json({ model: model || "qwen2.5:latest", created_at: new Date().toISOString(), response: jsonString, done: true });
        log(`[Response] Sent.`);
    } catch (err: any) {
        log(`[ERROR] ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 11434;
app.listen(PORT, () => {
    log(`Mock server on ${PORT}`);
});
