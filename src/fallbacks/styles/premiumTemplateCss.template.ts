export const PREMIUM_TEMPLATE_CSS = `
.pfb--magazine .pfb__inner{display:grid;gap:2rem;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr)}
.pfb--masonry .pfb__cards{columns:2 280px;display:block}.pfb--masonry .pfb__card{break-inside:avoid;margin:0 0 1rem}
.pfb--rail .pfb__inner{border-left:6px solid currentColor;padding-left:clamp(1rem,3vw,2.5rem)}
.pfb--matrix .pfb__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem}.pfb--matrix .pfb__card{min-height:150px}
.pfb--accordion .pfb__card{border-bottom:1px solid rgba(0,0,0,.12);box-shadow:none;border-radius:0}
.pfb--spotlight .pfb__lead{font-size:clamp(1.25rem,2vw,1.8rem);max-width:760px}.pfb--spotlight .pfb__card:first-child{grid-column:span 2}
.pfb--compact{padding-block:clamp(1.5rem,4vw,3rem)}.pfb--deep{padding-block:clamp(3rem,7vw,6rem)}.pfb--dense .pfb__cards{gap:.65rem}
.pfb--urgent{border:2px solid rgba(180,0,0,.18)}.pfb--technical .pfb__kicker{text-transform:uppercase;letter-spacing:.12em}.pfb--trust .pfb__card{background:rgba(255,255,255,.78)}
`;
