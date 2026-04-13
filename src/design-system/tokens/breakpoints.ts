import type { BreakpointsTokens } from '../types.js';

export const DEFAULT_BREAKPOINTS: BreakpointsTokens = Object.freeze({
    xs: 360,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1536
});

export function minWidth(bp: keyof BreakpointsTokens, breakpoints = DEFAULT_BREAKPOINTS): string {
    return `@media (min-width: ${breakpoints[bp]}px)`;
}

export function maxWidth(bp: keyof BreakpointsTokens, breakpoints = DEFAULT_BREAKPOINTS): string {
    return `@media (max-width: ${breakpoints[bp] - 1}px)`;
}