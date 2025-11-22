import { MeshGeometry, Texture } from 'pixi.js';
import type { SurfaceShape } from '../core/types.js';
/**
 * Creates a pill/stadium geometry that can expand from circle to pill shape.
 * When expansion = 0, it's a perfect circle.
 * When expansion > 0, it becomes a pill/stadium shape.
 *
 * Uses normalized coordinates (-0.5 to 0.5) like the default QUAD_GEOMETRY,
 * so panel.scale controls the actual size.
 */
export declare function createPillGeometry(radius: number, expansion?: number, segments?: number): MeshGeometry;
/**
 * Updates an existing pill geometry with new expansion value.
 * More efficient than recreating the geometry.
 */
export declare function updatePillGeometry(geometry: MeshGeometry, radius: number, expansion: number, segments?: number): void;
/**
 * Creates a normal map for a pill/stadium shape with bevel effects.
 * The pill is a rectangle with semicircular caps on each end.
 */
export declare function createPillNormalMap(width: number, height: number, expansion: number, bevel: number, shape: SurfaceShape, invertNormals?: boolean): Texture;
