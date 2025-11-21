import type { Filter, MeshGeometry, Texture } from 'pixi.js';
export type CapabilityTier = 'webgl2' | 'webgl1';
export type SurfaceShape = 'circle' | 'squircle' | 'concave' | 'lip' | 'dome' | 'ridge' | 'wave' | 'flat';
export interface RenderQualityOptions {
    renderScale: number;
    enableDispersion: boolean;
    enableCaustics: boolean;
    enableContactShadows: boolean;
    maxBlurTaps: number;
    edgeSupersampling: number;
}
export interface GlassMaterial {
    ior: number;
    thickness: number;
    roughness: number;
    dispersion: number;
    opacity: number;
    tint?: number;
    specular?: number;
    shininess?: number;
    shadow?: number;
    lightDir?: [number, number, number];
    blurSamples?: number;
    blurSpread?: number;
    blurAngle?: number;
    blurAnisotropy?: number;
    blurGamma?: number;
    aberrationR?: number;
    aberrationB?: number;
    ao?: number;
    aoRadius?: number;
    noiseScale?: number;
    noiseIntensity?: number;
    noiseRotation?: number;
    noiseThreshold?: number;
    edgeSmoothWidth?: number;
    edgeContrast?: number;
    edgeAlphaFalloff?: number;
    edgeMaskCutoff?: number;
    enableEdgeSmoothing?: boolean;
    enableContrastReduction?: boolean;
    enableAlphaFalloff?: boolean;
    enableTintOpacity?: boolean;
    edgeBlur?: number;
    glassSupersampling?: number;
}
export interface GlassPanelProps {
    id?: string;
    geometry?: MeshGeometry;
    material: GlassMaterial;
    normalMap?: Texture;
    dudvMap?: Texture;
    causticsAtlas?: Texture;
    sdfShadow?: Texture;
    filters?: Filter[];
}
export interface GlassSystemOptions {
    hudEnabled?: boolean;
    maxRtMemoryMB?: number;
    quality?: Partial<RenderQualityOptions>;
    safetyMode?: boolean;
}
export interface TelemetrySample {
    cpuMs: number;
    gpuMs?: number;
    timestamp: number;
}
export type AdaptiveAction = 'scale-rt-0-85' | 'scale-rt-0-7' | 'reduce-blur' | 'disable-dispersion' | 'disable-caustics' | 'fallback-webgl1';
export interface AdaptiveDecision {
    action: AdaptiveAction;
    reason: string;
}
export interface FallbackEvent {
    target: string;
    message: string;
    timestamp: number;
}
export interface PerformanceBudget {
    targetMs: number;
    glassPassMs: number;
    compositePassMs: number;
}
export interface CapabilityResult {
    tier: CapabilityTier;
    maxDrawBuffers: number;
    extensions: Record<string, boolean>;
}
