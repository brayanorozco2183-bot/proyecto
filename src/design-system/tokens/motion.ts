import type { MotionTokens } from '../types.js';

export const calmMotion: MotionTokens = Object.freeze({
    durationInstant: '80ms',
    durationFast: '140ms',
    durationStandard: '220ms',
    durationSlow: '320ms',
    easeStandard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    easeEntrance: 'cubic-bezier(0.18, 0.9, 0.22, 1)',
    easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
    hoverLiftDistance: '-2px'
});

export const assertiveMotion: MotionTokens = Object.freeze({
    durationInstant: '70ms',
    durationFast: '120ms',
    durationStandard: '180ms',
    durationSlow: '260ms',
    easeStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    easeEntrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
    hoverLiftDistance: '-3px'
});

export const minimalMotion: MotionTokens = Object.freeze({
    durationInstant: '60ms',
    durationFast: '100ms',
    durationStandard: '140ms',
    durationSlow: '200ms',
    easeStandard: 'ease-out',
    easeEntrance: 'ease-out',
    easeExit: 'ease-in',
    hoverLiftDistance: '-1px'
});