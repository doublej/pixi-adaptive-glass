import type { EdgeMaskConfig, EdgeTactic } from '../core/types.js';

export function hexToVec3(hex: number): [number, number, number] {
  return [
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
  ];
}

export function createDefaultEdgeTactic(overrides?: Partial<EdgeTactic>): EdgeTactic {
  return {
    enabled: false,
    rangeStart: 0,
    rangeEnd: 0.3,
    strength: 1,
    opacity: 1,
    ...overrides,
  };
}

export function createDefaultEdgeMask(overrides?: Partial<EdgeMaskConfig>): EdgeMaskConfig {
  return {
    cutoff: 0.001,
    blur: 0,
    invert: false,
    smoothing: createDefaultEdgeTactic({ rangeEnd: 0.3, strength: 1 }),
    contrast: createDefaultEdgeTactic({ rangeEnd: 0.3, strength: 0.7 }),
    alpha: createDefaultEdgeTactic({ rangeEnd: 0.2, strength: 1 }),
    tint: createDefaultEdgeTactic({ rangeEnd: 0.5, strength: 0.5 }),
    darken: createDefaultEdgeTactic({ rangeEnd: 0.3, strength: 0.3 }),
    desaturate: createDefaultEdgeTactic({ rangeEnd: 0.4, strength: 0.5 }),
    ...overrides,
  };
}

export { createPillGeometry, updatePillGeometry, createPillNormalMap } from './PillGeometry.js';
