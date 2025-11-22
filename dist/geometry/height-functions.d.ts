import type { SurfaceShape } from '../core/types.js';
/**
 * Convert distance to boundary into normalized t parameter.
 * t=0 at boundary edge, t=1 at plateau/center.
 */
export declare function distanceToT(distToBoundary: number, bevel: number): number;
export declare function heightCircle(t: number): number;
export declare function heightSquircle(t: number): number;
export declare function smootherstep(t: number): number;
export declare function getHeightAndDerivative(t: number, shape: SurfaceShape): {
    height: number;
    derivative: number;
};
