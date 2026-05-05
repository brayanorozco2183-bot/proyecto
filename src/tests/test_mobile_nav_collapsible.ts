import { renderHeader } from '../design-system/components/index.js';

const html = renderHeader({
  content: {
    businessName: 'Cerrajeros Getafe Pro',
    phone: '910112233',
    navItems: [
      { label: 'Servicios', href: '#servicios' },
      { label: 'Proceso', href: '#proceso' },
      { label: 'FAQ', href: '#faq' }
    ]
  },
  visualVariant: 'prestige'
} as any);

if (!html.includes('<details class="nav-mobile"')) throw new Error('Mobile collapsible navigation was not rendered.');
if (!html.includes('nav-mobile__summary')) throw new Error('Mobile nav summary missing.');
console.log('OK test_mobile_nav_collapsible');
