import { Texture } from 'pixi.js';
import type { SurfaceShape } from '../core/types.js';
import { getDistanceToBoundary } from './distance.js';
import { distanceToT, getHeightAndDerivative } from './height-functions.js';

export function createRoundedRectNormalMap(
  width: number,
  height: number,
  radius: number,
  bevel: number,
  shape: SurfaceShape,
  invertNormals: boolean = false,
): Texture {
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  const data = new Uint8Array(w * h * 4);

  // Subpixel offsets for 4x MSAA pattern
  const subpixelOffsets = [
    [-0.25, -0.25],
    [0.25, -0.25],
    [-0.25, 0.25],
    [0.25, 0.25],
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let nx = 0;
      let ny = 0;
      let nz = 1;

      // Subpixel sampling for alpha
      let alphaSum = 0;
      for (const [ox, oy] of subpixelOffsets) {
        const dist = getDistanceToBoundary(x + ox, y + oy, w, h, radius);
        alphaSum += dist >= 0 ? 1 : 0;
      }
      const alpha = (alphaSum / subpixelOffsets.length) * 255;

      // Use pixel center for normal calculation
      const cx = w / 2;
      const cy = h / 2;
      const relX = Math.abs(x + 0.5 - cx);
      const relY = Math.abs(y + 0.5 - cy);

      const innerW = cx - radius;
      const innerH = cy - radius;

      // Calculate distance to boundary and direction
      let distToBoundary = 0;
      let dirX = 0;
      let dirY = 0;
      let closestX = relX;
      let closestY = relY;

      if (relX <= innerW && relY <= innerH) {
        const toEdgeX = innerW + radius;
        const toEdgeY = innerH + radius;
        if (toEdgeX - relX < toEdgeY - relY) {
          closestX = innerW + radius;
          closestY = relY;
        } else {
          closestX = relX;
          closestY = innerH + radius;
        }
        distToBoundary = Math.min(toEdgeX - relX, toEdgeY - relY);
      } else if (relX > innerW && relY <= innerH) {
        closestX = innerW + radius;
        closestY = relY;
        distToBoundary = radius - (relX - innerW);
      } else if (relY > innerH && relX <= innerW) {
        closestX = relX;
        closestY = innerH + radius;
        distToBoundary = radius - (relY - innerH);
      } else {
        const dx = relX - innerW;
        const dy = relY - innerH;
        const cornerDist = Math.sqrt(dx * dx + dy * dy);
        distToBoundary = radius - cornerDist;
        if (cornerDist > 0) {
          closestX = innerW + (dx / cornerDist) * radius;
          closestY = innerH + (dy / cornerDist) * radius;
        }
      }

      // Direction points from pixel toward closest boundary point
      const toDirX = closestX - relX;
      const toDirY = closestY - relY;
      const dirLen = Math.sqrt(toDirX * toDirX + toDirY * toDirY);
      if (dirLen > 0.001) {
        dirX = (x > cx ? 1 : -1) * (toDirX / dirLen);
        dirY = (y > cy ? 1 : -1) * (toDirY / dirLen);
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

export function createDisplacementMapData(
  width: number,
  height: number,
  radius: number,
  bevel: number,
  shape: SurfaceShape = 'squircle',
  invert: boolean = false,
): { data: Uint8Array; width: number; height: number } {
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  const data = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dist = getDistanceToBoundary(x, y, w, h, radius);
      const alpha = dist >= 0 ? 255 : 0;

      let displacement = 0; // Center is min height (black)
      if (bevel > 0 && dist >= 0 && dist < bevel) {
        const t = distanceToT(dist, bevel);
        const { height: ht } = getHeightAndDerivative(t, shape);
        displacement = (1 - ht) * 255; // Inverted: white at edge, black at center
      } else if (dist < 0) {
        displacement = 0; // Outside shape
      }

      if (invert) {
        displacement = 255 - displacement;
      }

      const index = (y * w + x) * 4;
      data[index] = displacement;
      data[index + 1] = displacement;
      data[index + 2] = displacement;
      data[index + 3] = alpha;
    }
  }

  return { data, width: w, height: h };
}

export function createDisplacementMap(
  width: number,
  height: number,
  radius: number,
  bevel: number,
  shape: SurfaceShape = 'squircle',
  invert: boolean = false,
): Texture {
  const result = createDisplacementMapData(width, height, radius, bevel, shape, invert);
  return Texture.from({
    resource: result.data,
    width: result.width,
    height: result.height,
  });
}
