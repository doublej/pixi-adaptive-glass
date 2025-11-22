import type { SurfaceShape } from '../core/types.js';

/**
 * Convert distance to boundary into normalized t parameter.
 * t=0 at boundary edge, t=1 at plateau/center.
 */
export function distanceToT(distToBoundary: number, bevel: number): number {
  return distToBoundary / bevel;
}

// Height functions for different surface shapes
// t is normalized distance into bevel: 0 at boundary edge, 1 at plateau
// height goes from 0 (edge) to 1 (plateau/center)
export function heightCircle(t: number): number {
  return Math.sqrt(Math.max(0, 2 * t - t * t));
}

function heightCircleDerivative(t: number): number {
  const h = Math.sqrt(Math.max(0.0001, 2 * t - t * t));
  return (1 - t) / h;
}

export function heightSquircle(t: number): number {
  // Superellipse with n=3 for gentler curve between circle (n=2) and box (n=infinity)
  // Using (1 - (1-t)^3)^(1/3) for smooth gradient
  const inner = 1 - Math.pow(1 - t, 3);
  return Math.pow(Math.max(0, inner), 1/3);
}

function heightSquircleDerivative(t: number): number {
  const inner = 1 - Math.pow(1 - t, 3);
  if (inner <= 0.0001) return 0;
  // d/dt of (1 - (1-t)^3)^(1/3) = (1-t)^2 / (1 - (1-t)^3)^(2/3)
  return Math.pow(1 - t, 2) / Math.pow(inner, 2/3);
}

export function smootherstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function smootherstepDerivative(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 30 * x * x * (x - 1) * (x - 1);
}

export function getHeightAndDerivative(
  t: number,
  shape: SurfaceShape
): { height: number; derivative: number } {

  switch (shape) {
    case 'circle': {
      // Circle profile: 0 at edge (t=0), 1 at plateau (t=1)
      return { height: heightCircle(t), derivative: heightCircleDerivative(t) };
    }
    case 'squircle': {
      // Squircle profile: 0 at edge (t=0), 1 at plateau (t=1)
      return { height: heightSquircle(t), derivative: heightSquircleDerivative(t) };
    }
    case 'concave': {
      // Quadratic ease-in: slow start, fast finish
      const h = t * t;
      const d = 2 * t;
      return { height: h, derivative: d };
    }
    case 'lip': {
      // S-curve: slow start, fast middle, slow end
      const h = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      const d = t < 0.5 ? 4 * t : 4 * (1 - t);
      return { height: h, derivative: d };
    }
    case 'dome': {
      // Full hemisphere - 0 at edge (t=0), 1 at plateau (t=1)
      const s = 1 - t;
      const h = Math.sqrt(Math.max(0, 1 - s * s));
      const d = s > 0.001 ? s / h : 0;
      return { height: h, derivative: d };
    }
    case 'wave': {
      // Sinusoidal wave
      const h = (1 - Math.cos(t * Math.PI)) / 2;
      const d = (Math.PI * Math.sin(t * Math.PI)) / 2;
      return { height: h, derivative: d };
    }
    case 'flat': {
      // No bevel, completely flat at max height
      return { height: 1, derivative: 0 };
    }
    case 'ramp': {
      // Linear test pattern - height = t, derivative = 1
      return { height: t, derivative: 1 };
    }
  }
}
