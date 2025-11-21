import type { Filter, MeshGeometry, Texture } from 'pixi.js';

export type CapabilityTier = 'webgl2' | 'webgl1';

export type SurfaceShape = 'circle' | 'squircle' | 'concave' | 'lip' | 'dome' | 'ridge' | 'wave' | 'flat';

export interface RenderQualityOptions {
  renderScale: number; // 0.5 - 1.0 downscale factor
  enableDispersion: boolean;
  enableCaustics: boolean;
  enableContactShadows: boolean;
  maxBlurTaps: number;
  edgeSupersampling: number; // 1 = off, 2-4 = MSAA-like edge samples
}

export interface GlassMaterial {
  ior: number; // 1.0 - 2.0
  thickness: number; // normalized offset scale
  roughness: number; // 0 - 1, drives blur radius
  dispersion: number; // 0 - 1, rgb split intensity
  opacity: number; // 0 - 1, premultiplied alpha
  tint?: number; // hex color multiplier
  specular?: number; // 0 - 1, specular highlight intensity
  shininess?: number; // 1 - 256, specular hardness/tightness
  shadow?: number; // 0 - 1, shadow intensity
  lightDir?: [number, number, number]; // normalized light direction
  blurSamples?: number; // 3 - 32, number of blur samples
  blurSpread?: number; // 0 - 20, blur radius multiplier
  blurAngle?: number; // 0 - 360, direction of directional blur
  blurAnisotropy?: number; // 0 - 1, how directional (0 = circular, 1 = line)
  blurGamma?: number; // 0.5 - 3, blur falloff curve (< 1 = soft, > 1 = sharp edges)
  aberrationR?: number; // 0.5 - 1.5, red channel dispersion multiplier
  aberrationB?: number; // 0.5 - 1.5, blue channel dispersion multiplier
  ao?: number; // 0 - 1, ambient occlusion intensity at edges
  aoRadius?: number; // 0 - 1, how far AO extends from edges
  // Noise distortion
  noiseScale?: number; // 1 - 100, scale of noise pattern
  noiseIntensity?: number; // 0 - 1, strength of distortion
  noiseRotation?: number; // 0 - 360, rotation of noise pattern in degrees
  noiseThreshold?: number; // 0 - 1, cutoff threshold for noise
  // Edge optimization
  edgeSmoothWidth?: number; // 0 - 1, width of edge smoothing
  edgeContrast?: number; // 0 - 1, minimum contrast at edges
  edgeAlphaFalloff?: number; // 0 - 1, alpha falloff at edges
  edgeMaskCutoff?: number; // 0 - 0.1, mask discard threshold
  // Edge toggles
  enableEdgeSmoothing?: boolean;
  enableContrastReduction?: boolean;
  enableAlphaFalloff?: boolean;
  enableTintOpacity?: boolean;
  edgeBlur?: number; // 0 - 5, blur radius for edge mask
  glassSupersampling?: number; // 1 - 4, full panel supersampling
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

export type AdaptiveAction =
  | 'scale-rt-0-85'
  | 'scale-rt-0-7'
  | 'reduce-blur'
  | 'disable-dispersion'
  | 'disable-caustics'
  | 'fallback-webgl1';

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
