export interface VisualVariant {
    id: number;
    colors: {
        primary: string;
        primaryDark: string;
        secondary: string;
        accent: string;
        background: string;     // --color-bg
        text: string;           // --color-text
        cardBackground: string; // --card-bg
        cardText: string;       // --card-text
    };
    hero: {
        background: string;
        textAlign: 'center' | 'left' | 'right';
        hasGradient: boolean;
        hasOverlay: boolean;
    };
    buttons: {
        radius: string;
        padding: string;           // --btn-padding
        shadow: string;            // --btn-shadow
        hoverTransform: string;    // --btn-hover-transform
    };
    cards: {
        style: string;
        radius: string;
        shadow: string;            // --card-shadow
        hoverTransform: string;    // --card-hover-transform
    };
    spacing: {
        gap: string;               // --gap
        sectionPadding: string;    // --section-padding
    };
    sectionsOrder: string[];
}

export const VISUAL_VARIANTS: VisualVariant[] = [
    {
        id: 0,
        colors: {
            primary: '#D4AF37', primaryDark: '#b5952f', secondary: '#0A192F', accent: '#38bdf8',
            background: '#0A192F', text: '#ffffff', cardBackground: '#112240', cardText: '#ffffff'
        },
        hero: { background: 'radial-gradient(circle at top right, #112240, #0A192F)', textAlign: 'center', hasGradient: true, hasOverlay: true },
        buttons: { radius: '10px', padding: '18px 45px', shadow: '0 20px 40px -10px rgba(212, 175, 55, 0.5)', hoverTransform: 'translateY(-5px) scale(1.02)' },
        cards: { radius: '12px', style: 'border: 1px solid rgba(255,255,255,0.1);', shadow: '0 10px 30px -15px rgba(0,0,0,0.3)', hoverTransform: 'translateY(-10px)' },
        spacing: { gap: '40px', sectionPadding: '140px' },
        sectionsOrder: ['servicios', 'experiencia', 'faq', 'about', 'cobertura']
    },
    {
        id: 1,
        colors: {
            primary: '#2563eb', primaryDark: '#1e40af', secondary: '#0f172a', accent: '#60a5fa',
            background: '#ffffff', text: '#0f172a', cardBackground: '#f8fafc', cardText: '#0f172a'
        },
        hero: { background: '#0f172a', textAlign: 'left', hasGradient: false, hasOverlay: true },
        buttons: { radius: '4px', padding: '14px 28px', shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', hoverTransform: 'translateX(5px)' },
        cards: { radius: '4px', style: 'border-top: 4px solid var(--primary);', shadow: '0 1px 3px 0 rgba(0,0,0,0.1)', hoverTransform: 'translateY(-4px)' },
        spacing: { gap: '20px', sectionPadding: '80px' },
        sectionsOrder: ['experiencia', 'servicios', 'faq', 'cobertura', 'about']
    },
    {
        id: 2,
        colors: {
            primary: '#059669', primaryDark: '#047857', secondary: '#064e3b', accent: '#34d399',
            background: '#f0fdf4', text: '#064e3b', cardBackground: '#ffffff', cardText: '#064e3b'
        },
        hero: { background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', textAlign: 'center', hasGradient: true, hasOverlay: true },
        buttons: { radius: '50px', padding: '20px 40px', shadow: 'none', hoverTransform: 'scale(1.1)' },
        cards: { radius: '20px', style: 'background: rgba(255,255,255,0.8); backdrop-filter: blur(10px);', shadow: '0 20px 25px -5px rgba(0,0,0,0.05)', hoverTransform: 'scale(1.03)' },
        spacing: { gap: '30px', sectionPadding: '110px' },
        sectionsOrder: ['servicios', 'faq', 'experiencia', 'about', 'cobertura']
    },
    {
        id: 3,
        colors: {
            primary: '#dc2626', primaryDark: '#991b1b', secondary: '#450a0a', accent: '#f87171',
            background: '#ffffff', text: '#450a0a', cardBackground: '#fef2f2', cardText: '#450a0a'
        },
        hero: { background: '#450a0a', textAlign: 'right', hasGradient: false, hasOverlay: true },
        buttons: { radius: '0px', padding: '15px 35px', shadow: '5px 5px 0px var(--primary-dark)', hoverTransform: 'translate(-2px, -2px)' },
        cards: { radius: '0px', style: 'border: 2px solid var(--secondary);', shadow: 'none', hoverTransform: 'translate(4px, 4px)' },
        spacing: { gap: '25px', sectionPadding: '100px' },
        sectionsOrder: ['faq', 'servicios', 'experiencia', 'cobertura', 'about']
    },
    {
        id: 4,
        colors: {
            primary: '#7c3aed', primaryDark: '#5b21b6', secondary: '#2e1065', accent: '#a78bfa',
            background: '#f5f3ff', text: '#2e1065', cardBackground: '#ffffff', cardText: '#2e1065'
        },
        hero: { background: 'linear-gradient(to right, #2e1065, #7c3aed)', textAlign: 'center', hasGradient: true, hasOverlay: true },
        buttons: { radius: '15px', padding: '16px 32px', shadow: '0 0 15px var(--primary)', hoverTransform: 'rotate(-2deg)' },
        cards: { radius: '15px', style: 'box-shadow: 10px 10px 0px rgba(0,0,0,0.05);', shadow: '0 4px 6px -1px rgba(0,0,0,0.1)', hoverTransform: 'translateY(-6px)' },
        spacing: { gap: '35px', sectionPadding: '120px' },
        sectionsOrder: ['servicios', 'experiencia', 'cobertura', 'faq', 'about']
    },
    {
        id: 5,
        colors: {
            primary: '#ea580c', primaryDark: '#c2410c', secondary: '#431407', accent: '#f97316',
            background: '#fff7ed', text: '#431407', cardBackground: '#ffffff', cardText: '#431407'
        },
        hero: { background: '#ea580c', textAlign: 'center', hasGradient: false, hasOverlay: true },
        buttons: { radius: '12px', padding: '18px 36px', shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', hoverTransform: 'skewX(-5deg)' },
        cards: { radius: '24px', style: 'border: 2px dashed var(--primary);', shadow: '0 10px 15px -3px rgba(0,0,0,0.1)', hoverTransform: 'rotate(1deg)' },
        spacing: { gap: '45px', sectionPadding: '130px' },
        sectionsOrder: ['experiencia', 'faq', 'servicios', 'about', 'cobertura']
    },
    {
        id: 6,
        colors: {
            primary: '#0891b2', primaryDark: '#0e7490', secondary: '#164e63', accent: '#22d3ee',
            background: '#f0f9ff', text: '#164e63', cardBackground: '#ffffff', cardText: '#164e63'
        },
        hero: { background: 'linear-gradient(45deg, #164e63, #0891b2)', textAlign: 'left', hasGradient: true, hasOverlay: true },
        buttons: { radius: '8px', padding: '15px 30px', shadow: 'inset 0 2px 4px rgba(0,0,0,0.2)', hoverTransform: 'translateY(-2px)' },
        cards: { radius: '12px', style: 'border-left: 10px solid var(--primary);', shadow: '0 4px 6px -1px rgba(0,0,0,0.1)', hoverTransform: 'translateX(8px)' },
        spacing: { gap: '32px', sectionPadding: '90px' },
        sectionsOrder: ['about', 'servicios', 'faq', 'experiencia', 'cobertura']
    },
    {
        id: 7,
        colors: {
            primary: '#db2777', primaryDark: '#9d174d', secondary: '#500724', accent: '#f472b6',
            background: '#fdf2f8', text: '#500724', cardBackground: '#ffffff', cardText: '#500724'
        },
        hero: { background: '#500724', textAlign: 'center', hasGradient: false, hasOverlay: true },
        buttons: { radius: '30px', padding: '22px 44px', shadow: '0 0 20px rgba(219, 39, 119, 0.4)', hoverTransform: 'scale(0.95)' },
        cards: { radius: '30px', style: 'border: 1px solid var(--primary);', shadow: '20px 20px 60px #bebebe, -20px -20px 60px #ffffff', hoverTransform: 'translateY(-12px)' },
        spacing: { gap: '40px', sectionPadding: '150px' },
        sectionsOrder: ['servicios', 'cobertura', 'experiencia', 'about', 'faq']
    },
    {
        id: 8,
        colors: {
            primary: '#1e293b', primaryDark: '#0f172a', secondary: '#f8fafc', accent: '#334155',
            background: '#ffffff', text: '#1e293b', cardBackground: '#f1f5f9', cardText: '#1e293b'
        },
        hero: { background: '#f1f5f9', textAlign: 'center', hasGradient: false, hasOverlay: false },
        buttons: { radius: '6px', padding: '12px 24px', shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', hoverTransform: 'translateY(-1px)' },
        cards: { radius: '8px', style: 'border: 1px solid #e2e8f0;', shadow: '0 1px 2px 0 rgba(0,0,0,0.05)', hoverTransform: 'translateY(-2px)' },
        spacing: { gap: '24px', sectionPadding: '70px' },
        sectionsOrder: ['experiencia', 'servicios', 'about', 'faq', 'cobertura']
    },
    {
        id: 9,
        colors: {
            primary: '#f59e0b', primaryDark: '#d97706', secondary: '#451a03', accent: '#fbbf24',
            background: '#fdf9f0', text: '#451a03', cardBackground: '#ffffff', cardText: '#451a03'
        },
        hero: { background: '#451a03', textAlign: 'left', hasGradient: true, hasOverlay: true },
        buttons: { radius: '0px', padding: '16px 40px', shadow: 'none', hoverTransform: 'none' },
        cards: { radius: '0px', style: 'border: 5px double var(--primary);', shadow: 'none', hoverTransform: 'skewY(-1deg)' },
        spacing: { gap: '30px', sectionPadding: '110px' },
        sectionsOrder: ['servicios', 'about', 'experiencia', 'cobertura', 'faq']
    },
    {
        id: 10,
        colors: {
            primary: '#4f46e5', primaryDark: '#3730a3', secondary: '#1e1b4b', accent: '#818cf8',
            background: '#1e1b4b', text: '#ffffff', cardBackground: '#312e81', cardText: '#ffffff'
        },
        hero: { background: 'linear-gradient(to bottom, #1e1b4b, #4f46e5)', textAlign: 'center', hasGradient: true, hasOverlay: true },
        buttons: { radius: '10px', padding: '18px 36px', shadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)', hoverTransform: 'translateY(-3px)' },
        cards: { radius: '16px', style: 'box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);', shadow: '0 20px 25px -5px rgba(0,0,0,0.1)', hoverTransform: 'translateY(-5px)' },
        spacing: { gap: '35px', sectionPadding: '120px' },
        sectionsOrder: ['faq', 'experiencia', 'servicios', 'cobertura', 'about']
    },
    {
        id: 11,
        colors: {
            primary: '#10b981', primaryDark: '#059669', secondary: '#064e3b', accent: '#34d399',
            background: '#ecfdf5', text: '#064e3b', cardBackground: '#ffffff', cardText: '#064e3b'
        },
        hero: { background: '#064e3b', textAlign: 'center', hasGradient: false, hasOverlay: true },
        buttons: { radius: '20px', padding: '16px 32px', shadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', hoverTransform: 'scale(1.05)' },
        cards: { radius: '20px', style: 'border: 1px solid #d1fae5;', shadow: '0 4px 6px -1px rgba(0,0,0,0.1)', hoverTransform: 'scale(1.02)' },
        spacing: { gap: '40px', sectionPadding: '100px' },
        sectionsOrder: ['about', 'cobertura', 'servicios', 'experiencia', 'faq']
    }
];
