import type { GlassMaterial } from '../core/types.js';
export declare const GlassPresets: {
    water(): GlassMaterial;
    crownGlass(): GlassMaterial;
    acrylic(): GlassMaterial;
    clear(): GlassMaterial;
    fromIOR(ior: number): GlassMaterial;
};
