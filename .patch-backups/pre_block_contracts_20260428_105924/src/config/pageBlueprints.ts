export const PAGE_BLUEPRINTS = {
    service: {
        requiredSections: [
            'Introducción orientada a conversión',
            'Servicios principales',
            'Urgencias / disponibilidad',
            'Proceso de trabajo',
            'Cobertura local',
            'FAQ',
            'CTA final'
        ]
    },
    urgent: {
        requiredSections: [
            'Respuesta inmediata',
            'Disponibilidad 24 horas',
            'Problemas frecuentes',
            'Cobertura',
            'FAQ',
            'CTA urgente'
        ]
    },
    service_area: {
        requiredSections: [
            'Servicio en la zona',
            'Cobertura por barrios',
            'Casos habituales del área',
            'Proceso',
            'FAQ',
            'CTA local'
        ]
    },
    guide: {
        requiredSections: [
            'Introducción editorial',
            'Conceptos clave',
            'Errores frecuentes',
            'Recomendaciones',
            'FAQ',
            'Conclusión'
        ]
    },
    home_local: {
        requiredSections: [
            'Presentación del negocio',
            'Servicios destacados',
            'Cobertura',
            'Prueba de confianza',
            'FAQ',
            'CTA'
        ]
    }
} as const;