import { Mesh } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { CapabilityTier, GlassMaterial, GlassPanelProps } from '../core/types.js';
export declare class GlassPanel extends Mesh {
    id: string;
    glassMaterial: GlassMaterial;
    normalMap?: Texture;
    dudvMap?: Texture;
    causticsAtlas?: Texture;
    sdfShadow?: Texture;
    private tier;
    constructor(props: GlassPanelProps);
    setMaterial(partial: Partial<GlassMaterial>): void;
    setTextures(textures: Partial<Omit<GlassPanelProps, 'material' | 'geometry'>>): void;
    setTier(tier: CapabilityTier): void;
    getTier(): CapabilityTier;
}
