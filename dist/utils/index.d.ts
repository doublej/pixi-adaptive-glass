import type { EdgeMaskConfig, EdgeTactic } from '../core/types.js';
export declare function hexToVec3(hex: number): [number, number, number];
export declare function createDefaultEdgeTactic(overrides?: Partial<EdgeTactic>): EdgeTactic;
export declare function createDefaultEdgeMask(overrides?: Partial<EdgeMaskConfig>): EdgeMaskConfig;
export { createPillGeometry, updatePillGeometry, createPillNormalMap } from './PillGeometry.js';
