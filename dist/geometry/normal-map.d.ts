import { Texture } from 'pixi.js';
import type { SurfaceShape } from '../core/types.js';
export declare function createRoundedRectNormalMap(width: number, height: number, radius: number, bevel: number, shape: SurfaceShape, invertNormals?: boolean): Texture;
export declare function createDisplacementMapData(width: number, height: number, radius: number, bevel: number, shape?: SurfaceShape, invert?: boolean): {
    data: Uint8Array;
    width: number;
    height: number;
};
export declare function createDisplacementMap(width: number, height: number, radius: number, bevel: number, shape?: SurfaceShape, invert?: boolean): Texture;
export declare function createUVMapData(width: number, height: number, radius: number): {
    data: Uint8Array;
    width: number;
    height: number;
};
export declare function createUVMap(width: number, height: number, radius: number): Texture;
export declare function createEdgeMapData(width: number, height: number, radius: number, bevel: number): {
    data: Uint8Array;
    width: number;
    height: number;
};
export declare function createEdgeMap(width: number, height: number, radius: number, bevel: number): Texture;
export declare function createNormalMapData(width: number, height: number, radius: number, bevel: number, shape: SurfaceShape, invertNormals: boolean): {
    data: Uint8Array;
    width: number;
    height: number;
};
export declare function createNormalMap(width: number, height: number, radius: number, bevel: number, shape?: SurfaceShape, invertNormals?: boolean): Texture;
export interface AllMapsResult {
    normalMap: Texture;
    displacementMap: Texture;
    uvMap: Texture;
    edgeMap: Texture;
}
export declare function createAllMaps(width: number, height: number, radius: number, bevel: number, shape?: SurfaceShape, invertNormals?: boolean, invertDisplacement?: boolean): AllMapsResult;
