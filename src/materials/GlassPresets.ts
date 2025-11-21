import type { GlassMaterial } from '../core/types.js';

const make = (material: GlassMaterial): GlassMaterial => material;

export const GlassPresets = {
  water(): GlassMaterial {
    return make({
      ior: 1.333,
      thickness: 0.6,
      roughness: 0.1,
      dispersion: 0.02,
      opacity: 1.0,
      tint: 0x9fd9ff,
    });
  },
  crownGlass(): GlassMaterial {
    return make({
      ior: 1.52,
      thickness: 0.8,
      roughness: 0.05,
      dispersion: 0.04,
      opacity: 1.0,
      tint: 0xffffff,
    });
  },
  acrylic(): GlassMaterial {
    return make({
      ior: 1.49,
      thickness: 0.7,
      roughness: 0.12,
      dispersion: 0.01,
      opacity: 1.0,
      tint: 0xf7f7f7,
    });
  },
  clear(): GlassMaterial {
    return make({
      ior: 1.52,
      thickness: 0.8,
      roughness: 0.05,
      dispersion: 0.04,
      opacity: 1.0,
      tint: 0xffffff,
    });
  },
  fromIOR(ior: number): GlassMaterial {
    const clamped = Math.min(Math.max(ior, 1.0), 2.0);
    return make({
      ior: clamped,
      thickness: 0.75,
      roughness: 0.08,
      dispersion: (clamped - 1) * 0.05,
      opacity: 1.0,
      tint: 0xffffff,
    });
  },
};
