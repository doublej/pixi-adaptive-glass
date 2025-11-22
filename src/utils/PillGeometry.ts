import { MeshGeometry, Texture } from 'pixi.js';
import type { SurfaceShape } from '../core/types.js';
import { distanceToT, getHeightAndDerivative } from '../geometry/height-functions.js';

/**
 * Creates a pill/stadium geometry that can expand from circle to pill shape.
 * When expansion = 0, it's a perfect circle.
 * When expansion > 0, it becomes a pill/stadium shape.
 *
 * Uses normalized coordinates (-0.5 to 0.5) like the default QUAD_GEOMETRY,
 * so panel.scale controls the actual size.
 */
export function createPillGeometry(
  radius: number,
  expansion: number = 0,
  segments: number = 32
): MeshGeometry {
  const halfExpansion = expansion / 2;

  // Center vertex + vertices for both semicircles
  const vertexCount = 1 + segments;
  const positions = new Float32Array(vertexCount * 2);
  const uvs = new Float32Array(vertexCount * 2);

  // Total dimensions - scale is applied by panel
  const totalWidth = radius * 2 + expansion;
  const totalHeight = radius * 2;

  // Center vertex at origin
  positions[0] = 0;
  positions[1] = 0;
  uvs[0] = 0.5;
  uvs[1] = 0.5;

  // Generate vertices around the perimeter
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const idx = (i + 1) * 2;

    let x: number, y: number;

    // Right semicircle (angles -90° to 90°)
    if (angle >= -Math.PI / 2 && angle <= Math.PI / 2) {
      x = Math.cos(angle) * radius + halfExpansion;
      y = Math.sin(angle) * radius;
    }
    // Left semicircle (angles 90° to 270°)
    else {
      x = Math.cos(angle) * radius - halfExpansion;
      y = Math.sin(angle) * radius;
    }

    // Normalize: x to -0.5..0.5 over totalWidth, y to -0.5..0.5 over totalHeight
    // This keeps circle round when width=height, elongates when width>height
    positions[idx] = x / totalWidth;
    positions[idx + 1] = y / totalHeight;

    // UVs: 0..1 range
    uvs[idx] = x / totalWidth + 0.5;
    uvs[idx + 1] = y / totalHeight + 0.5;
  }

  // Create triangle fan from center
  const triangleCount = segments;
  const indices = new Uint32Array(triangleCount * 3);

  for (let i = 0; i < segments; i++) {
    const triIdx = i * 3;
    indices[triIdx] = 0; // center
    indices[triIdx + 1] = i + 1;
    indices[triIdx + 2] = ((i + 1) % segments) + 1;
  }

  return new MeshGeometry({
    positions,
    uvs,
    indices,
  });
}

/**
 * Updates an existing pill geometry with new expansion value.
 * More efficient than recreating the geometry.
 */
export function updatePillGeometry(
  geometry: MeshGeometry,
  radius: number,
  expansion: number,
  segments: number = 32
): void {
  const posAttr = geometry.getAttribute('aPosition');
  const uvAttr = geometry.getAttribute('aUV');
  if (!posAttr || !uvAttr) return;

  const positions = posAttr.buffer.data as Float32Array;
  const uvs = uvAttr.buffer.data as Float32Array;
  const halfExpansion = expansion / 2;

  const totalWidth = radius * 2 + expansion;
  const totalHeight = radius * 2;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
    const idx = (i + 1) * 2;

    let x: number, y: number;

    if (angle >= -Math.PI / 2 && angle <= Math.PI / 2) {
      x = Math.cos(angle) * radius + halfExpansion;
      y = Math.sin(angle) * radius;
    } else {
      x = Math.cos(angle) * radius - halfExpansion;
      y = Math.sin(angle) * radius;
    }

    // Normalize to -0.5 to 0.5 range
    positions[idx] = x / totalWidth;
    positions[idx + 1] = y / totalHeight;

    // UVs normalized to 0-1 range
    uvs[idx] = (x / totalWidth) + 0.5;
    uvs[idx + 1] = (y / totalHeight) + 0.5;
  }

  posAttr.buffer.update();
  uvAttr.buffer.update();
}

/**
 * Creates a normal map for a pill/stadium shape with bevel effects.
 * The pill is a rectangle with semicircular caps on each end.
 */
export function createPillNormalMap(
  width: number,
  height: number,
  expansion: number,
  bevel: number,
  shape: SurfaceShape,
  invertNormals: boolean = false,
): Texture {
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  const data = new Uint8Array(w * h * 4);

  // Pill dimensions: height determines the radius of the caps
  const radius = h / 2;
  const halfExpansion = expansion / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let nx = 0;
      let ny = 0;
      let nz = 1;
      let alpha = 255;

      // Use pixel centers for proper symmetry
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const relX = x - cx;
      const relY = y - cy;

      // Calculate distance to pill boundary
      let distToBoundary = 0;
      let dirX = 0;
      let dirY = 0;

      const absX = Math.abs(relX);
      const absY = Math.abs(relY);

      if (absX <= halfExpansion) {
        // In the rectangular middle section
        distToBoundary = radius - absY;
        dirX = 0;
        dirY = relY > 0 ? 1 : -1;
      } else {
        // In one of the semicircular caps
        const capCenterX = relX > 0 ? halfExpansion : -halfExpansion;
        const dx = relX - capCenterX;
        const dy = relY;
        const distFromCapCenter = Math.sqrt(dx * dx + dy * dy);
        distToBoundary = radius - distFromCapCenter;

        if (distFromCapCenter > 0.001) {
          dirX = dx / distFromCapCenter;
          dirY = dy / distFromCapCenter;
        }
      }

      // Hard cutoff for pixels outside the shape
      if (distToBoundary < 0) {
        alpha = 0;
      }

      // Apply bevel based on distance to boundary
      if (bevel > 0 && distToBoundary < bevel && distToBoundary >= 0) {
        const t = distanceToT(distToBoundary, bevel);
        const { derivative } = getHeightAndDerivative(t, shape);
        nx = dirX * derivative * 0.5;
        ny = dirY * derivative * 0.5;
        if (invertNormals) {
          nx = -nx;
          ny = -ny;
        }
      }

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const index = (y * w + x) * 4;
      data[index] = ((nx * 0.5 + 0.5) * 255) | 0;
      data[index + 1] = ((ny * 0.5 + 0.5) * 255) | 0;
      data[index + 2] = ((nz * 0.5 + 0.5) * 255) | 0;
      data[index + 3] = alpha;
    }
  }

  return Texture.from({
    resource: data,
    width: w,
    height: h,
  });
}
