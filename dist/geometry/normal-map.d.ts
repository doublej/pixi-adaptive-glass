import { Texture } from 'pixi.js';
import type { SurfaceShape } from '../core/types.js';
export declare function createRoundedRectNormalMap(width: number, height: number, radius: number, bevel: number, shape: SurfaceShape, invertNormals?: boolean): Texture;
export declare function createDisplacementMapData(width: number, height: number, radius: number, bevel: number, shape?: SurfaceShape): {
    data: Uint8Array;
    width: number;
    height: number;
};
export declare function createDisplacementMap(width: number, height: number, radius: number, bevel: number, shape?: SurfaceShape): Texture;
