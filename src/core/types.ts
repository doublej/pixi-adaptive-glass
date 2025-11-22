import type { Filter, MeshGeometry, Texture } from 'pixi.js';

export type CapabilityTier = 'webgl2' | 'webgl1';

export type SurfaceShape = 'circle' | 'squircle' | 'concave' | 'lip' | 'dome' | 'ridge' | 'wave' | 'flat';

// Individual edge tactic configuration
export interface EdgeTactic {
  enabled: boolean;
  rangeStart: number; // 0 - 1, where effect begins (0 = edge, 1 = center)
  rangeEnd: number;   // 0 - 1, where effect ends
  strength: number;   // 0 - 1, effect intensity
  opacity: number;    // 0 - 1, blending amount
}

// Complete edge mask configuration
export interface EdgeMaskConfig {
  // Base mask settings
  cutoff: number;        // 0 - 0.1, discard threshold
  blur: number;          // 0 - 5, mask blur radius
  invert: boolean;       // flip black/white
  debugMode?: number;    // 0=off, 1=edgeDist, 2=shapeMask, 3=normals

  // Individual tactics
  smoothing: EdgeTactic;    // softens edge transition
  contrast: EdgeTactic;     // reduces contrast at edges
  alpha: EdgeTactic;        // fades alpha at edges
  tint: EdgeTactic;         // applies tint opacity
  darken: EdgeTactic;       // darkens edges (vignette-like)
  desaturate: EdgeTactic;   // reduces saturation at edges
}

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
  // Legacy edge (deprecated - use edgeMask instead)
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
  // New modular edge mask system
  edgeMask?: EdgeMaskConfig;
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
