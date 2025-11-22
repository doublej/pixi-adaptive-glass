// Glass Effect Parameter Enums and Constants

export enum SurfaceShapeType {
  CIRCLE = 'circle',
  SQUIRCLE = 'squircle',
  CONCAVE = 'concave',
  LIP = 'lip',
  DOME = 'dome',
  WAVE = 'wave',
  FLAT = 'flat',
  RAMP = 'ramp',
}

export enum DebugMode {
  OFF = 0,
  EDGE_DISTANCE = 1,
  SHAPE_MASK = 2,
  NORMALS = 3,
}

export enum CapabilityTierType {
  WEBGL2 = 'webgl2',
  WEBGL1 = 'webgl1',
}

export enum AdaptiveActionType {
  SCALE_RT_085 = 'scale-rt-0-85',
  SCALE_RT_070 = 'scale-rt-0-7',
  REDUCE_BLUR = 'reduce-blur',
  DISABLE_DISPERSION = 'disable-dispersion',
  DISABLE_CAUSTICS = 'disable-caustics',
  FALLBACK_WEBGL1 = 'fallback-webgl1',
}

// Parameter ranges and defaults
export const PARAM_RANGES = {
  // GlassMaterial
  ior: { min: 1.0, max: 2.0, default: 1.45, step: 0.01 },
  thickness: { min: 0, max: 10, default: 1, step: 0.1 },
  roughness: { min: 0, max: 1, default: 0.1, step: 0.01 },
  dispersion: { min: 0, max: 1, default: 0, step: 0.01 },
  opacity: { min: 0, max: 1, default: 1, step: 0.01 },
  specular: { min: 0, max: 1, default: 0.3, step: 0.01 },
  shininess: { min: 1, max: 256, default: 64, step: 1 },
  shadow: { min: 0, max: 1, default: 0.2, step: 0.01 },
  blurSamples: { min: 3, max: 32, default: 8, step: 1 },
  blurSpread: { min: 0, max: 20, default: 5, step: 0.1 },
  blurAngle: { min: 0, max: 360, default: 0, step: 1 },
  blurAnisotropy: { min: 0, max: 1, default: 0, step: 0.01 },
  blurGamma: { min: 0.5, max: 3, default: 1, step: 0.1 },
  aberrationR: { min: 0.5, max: 1.5, default: 1.0, step: 0.01 },
  aberrationB: { min: 0.5, max: 1.5, default: 1.0, step: 0.01 },
  ao: { min: 0, max: 1, default: 0, step: 0.01 },
  aoRadius: { min: 0, max: 1, default: 0.5, step: 0.01 },
  noiseScale: { min: 1, max: 100, default: 10, step: 1 },
  noiseIntensity: { min: 0, max: 1, default: 0, step: 0.01 },
  noiseRotation: { min: 0, max: 360, default: 0, step: 1 },
  noiseThreshold: { min: 0, max: 1, default: 0, step: 0.01 },
  glassSupersampling: { min: 1, max: 4, default: 1, step: 1 },

  // Edge IOR
  edgeIorRangeStart: { min: 0, max: 1, default: 0, step: 0.01 },
  edgeIorRangeEnd: { min: 0, max: 1, default: 0.3, step: 0.01 },
  edgeIorStrength: { min: 0, max: 1, default: 0.5, step: 0.01 },

  // EdgeMaskConfig
  edgeMaskCutoff: { min: 0, max: 0.1, default: 0, step: 0.001 },
  edgeMaskBlur: { min: 0, max: 5, default: 0, step: 0.1 },

  // EdgeTactic (applies to all tactics: smoothing, contrast, alpha, tint, darken, desaturate)
  tacticRangeStart: { min: 0, max: 1, default: 0, step: 0.01 },
  tacticRangeEnd: { min: 0, max: 1, default: 0.3, step: 0.01 },
  tacticStrength: { min: 0, max: 1, default: 0.5, step: 0.01 },
  tacticOpacity: { min: 0, max: 1, default: 1, step: 0.01 },

  // LightFollowParams
  lightSmoothing: { min: 0, max: 1, default: 0.9, step: 0.01 },
  lightDelay: { min: 0, max: 1, default: 0.5, step: 0.01 },
  lightCurve: { min: 0.5, max: 3, default: 1.5, step: 0.1 },
  lightZMin: { min: 0, max: 0.5, default: 0.05, step: 0.01 },
  lightZMax: { min: 0, max: 0.5, default: 0.2, step: 0.01 },
  lightEdgeStretch: { min: 0.1, max: 2, default: 0.5, step: 0.1 },

  // GlassItemConfig
  cornerRadius: { min: 0, max: 200, default: 20, step: 1 },
  bevelSize: { min: 0, max: 100, default: 12, step: 1 },

  // RenderQualityOptions
  renderScale: { min: 0.5, max: 1, default: 1, step: 0.05 },
  maxBlurTaps: { min: 4, max: 32, default: 16, step: 1 },
  edgeSupersampling: { min: 1, max: 4, default: 1, step: 1 },

  // Light direction components
  lightDirX: { min: -1, max: 1, default: 0, step: 0.01 },
  lightDirY: { min: -1, max: 1, default: 0, step: 0.01 },
  lightDirZ: { min: 0, max: 1, default: 0.15, step: 0.01 },
} as const;

export type ParamKey = keyof typeof PARAM_RANGES;
