import { Pane, FolderApi } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { buildTweakpaneFromConfig, setNestedValue } from '../src/core/tweakpane-builder.js';
import { GlassOverlay, GlassPresets, getHeightAndDerivative } from '../src/index.js';
import type { SurfaceShape, EdgeMaskConfig } from '../src/core/types.js';
import type { DebugLogger } from './debugLogger.js';

export interface GlassParams {
  // Refraction
  ior: number;
  thickness: number;
  opacity: number;
  tint: string;
  // Dispersion
  enableDispersion: boolean;
  dispersion: number;
  aberrationR: number;
  aberrationB: number;
  // Blur
  roughness: number;
  blurSamples: number;
  blurSpread: number;
  blurAngle: number;
  blurAnisotropy: number;
  blurGamma: number;
  // Lighting
  specular: number;
  shininess: number;
  shadow: number;
  ao: number;
  aoRadius: number;
  lightDir: [number, number, number];
  // Cursor follow
  followCursor: boolean;
  lightSmoothing: number;
  lightDelay: number;
  lightCurve: number;
  lightZMin: number;
  lightZMax: number;
  lightEdgeStretch: number;
  // Noise
  noiseIntensity: number;
  noiseScale: number;
  noiseRotation: number;
  noiseThreshold: number;
  // Surface
  surfaceShape: SurfaceShape;
  cornerRadius: number;
  bevelSize: number;
  invertNormals: boolean;
  isCircle: boolean;
  // Edge mask
  edgeMask: EdgeMaskConfig;
  edgeIorEnabled: boolean;
  edgeIorRangeStart: number;
  edgeIorRangeEnd: number;
  edgeIorStrength: number;
  // Quality
  renderScale: number;
  enableCaustics: boolean;
  enableContactShadows: boolean;
  maxBlurTaps: number;
  edgeSupersampling: number;
  glassSupersampling: number;
}

export function createDefaultParams(): GlassParams {
  return {
    ior: 1.45,
    thickness: 1,
    opacity: 1,
    tint: '#ffffff',
    enableDispersion: false,
    dispersion: 0,
    aberrationR: 1.0,
    aberrationB: 1.0,
    roughness: 0.1,
    blurSamples: 8,
    blurSpread: 5,
    blurAngle: 0,
    blurAnisotropy: 0,
    blurGamma: 1,
    specular: 0.3,
    shininess: 64,
    shadow: 0.2,
    ao: 0,
    aoRadius: 0.5,
    lightDir: [0, 0, 0.15],
    followCursor: false,
    lightSmoothing: 0.9,
    lightDelay: 0.5,
    lightCurve: 1.5,
    lightZMin: 0.05,
    lightZMax: 0.2,
    lightEdgeStretch: 0.5,
    noiseIntensity: 0,
    noiseScale: 10,
    noiseRotation: 0,
    noiseThreshold: 0,
    surfaceShape: 'squircle',
    cornerRadius: 20,
    bevelSize: 12,
    invertNormals: false,
    isCircle: false,
    edgeMask: {
      cutoff: 0,
      blur: 0,
      invert: false,
      debugMode: 0,
      smoothing: { enabled: false, rangeStart: 0, rangeEnd: 0.3, strength: 0.5, opacity: 1 },
      contrast: { enabled: false, rangeStart: 0, rangeEnd: 0.3, strength: 0.5, opacity: 1 },
      alpha: { enabled: false, rangeStart: 0, rangeEnd: 0.3, strength: 0.5, opacity: 1 },
      tint: { enabled: false, rangeStart: 0, rangeEnd: 0.3, strength: 0.5, opacity: 1 },
      darken: { enabled: false, rangeStart: 0, rangeEnd: 0.3, strength: 0.5, opacity: 1 },
      desaturate: { enabled: false, rangeStart: 0, rangeEnd: 0.3, strength: 0.5, opacity: 1 },
    },
    edgeIorEnabled: false,
    edgeIorRangeStart: 0,
    edgeIorRangeEnd: 0.3,
    edgeIorStrength: 0.5,
    renderScale: 1,
    enableCaustics: false,
    enableContactShadows: false,
    maxBlurTaps: 16,
    edgeSupersampling: 1,
    glassSupersampling: 1,
  };
}

export function setupTweakpaneFromConfig(
  overlay: GlassOverlay,
  logger: DebugLogger,
  params: GlassParams
): Pane {
  const pane = new Pane({ title: 'Glass Controls', expanded: true });
  pane.registerPlugin(EssentialsPlugin);

  // Position pane
  const paneElement = pane.element;
  paneElement.style.width = '340px';
  paneElement.style.position = 'fixed';
  paneElement.style.top = '8px';
  paneElement.style.left = '8px';

  // Apply changes to all panels
  const applyToAll = (partial: Record<string, unknown>) => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      const panel = overlay.track(el);
      panel.setMaterial(partial);
    });
  };

  // Rebuild panels when shape config changes
  const rebuildPanels = () => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      overlay.untrack(el);
      overlay.track(el, {
        cornerRadius: params.cornerRadius,
        surfaceShape: params.surfaceShape,
        bevelSize: params.bevelSize,
        invertNormals: params.invertNormals,
        isCircle: params.isCircle,
        material: buildMaterial(params),
      });
    });
  };

  // Build material object from params
  const buildMaterial = (p: GlassParams) => ({
    ior: p.ior,
    thickness: p.thickness,
    opacity: p.opacity,
    tint: parseInt(p.tint.replace('#', ''), 16),
    dispersion: p.dispersion,
    aberrationR: p.aberrationR,
    aberrationB: p.aberrationB,
    roughness: p.roughness,
    blurSamples: p.blurSamples,
    blurSpread: p.blurSpread,
    blurAngle: p.blurAngle,
    blurAnisotropy: p.blurAnisotropy,
    blurGamma: p.blurGamma,
    specular: p.specular,
    shininess: p.shininess,
    shadow: p.shadow,
    ao: p.ao,
    aoRadius: p.aoRadius,
    lightDir: p.lightDir,
    noiseIntensity: p.noiseIntensity,
    noiseScale: p.noiseScale,
    noiseRotation: p.noiseRotation,
    noiseThreshold: p.noiseThreshold,
    glassSupersampling: p.glassSupersampling,
    edgeIorEnabled: p.edgeIorEnabled,
    edgeIorRangeStart: p.edgeIorRangeStart,
    edgeIorRangeEnd: p.edgeIorRangeEnd,
    edgeIorStrength: p.edgeIorStrength,
    edgeMask: p.edgeMask,
  });

  // Handle parameter changes
  const handleChange = (key: string, value: unknown) => {
    setNestedValue(params as unknown as Record<string, unknown>, key, value);
    logger.log('ui:change', `${key}=${value}`);

    // Determine which action to take based on key
    if (key.startsWith('lightDir')) {
      applyToAll({ lightDir: params.lightDir });
    } else if (key === 'followCursor' || key.startsWith('light')) {
      overlay.setLightFollowParams({
        followCursor: params.followCursor,
        smoothing: params.lightSmoothing,
        delay: params.lightDelay,
        curve: params.lightCurve,
        zMin: params.lightZMin,
        zMax: params.lightZMax,
        edgeStretch: params.lightEdgeStretch,
      });
    } else if (key === 'surfaceShape' || key === 'cornerRadius' || key === 'bevelSize' ||
               key === 'invertNormals' || key === 'isCircle') {
      rebuildPanels();
    } else if (key.startsWith('edgeMask')) {
      applyToAll({ edgeMask: params.edgeMask });
    } else if (key === 'tint') {
      applyToAll({ tint: parseInt((value as string).replace('#', ''), 16) });
    } else if (key === 'renderScale' || key === 'maxBlurTaps' || key === 'edgeSupersampling') {
      overlay.system.setQuality({
        renderScale: params.renderScale,
        maxBlurTaps: params.maxBlurTaps,
        edgeSupersampling: params.edgeSupersampling,
        enableDispersion: params.enableDispersion,
        enableCaustics: params.enableCaustics,
        enableContactShadows: params.enableContactShadows,
      });
    } else {
      // Direct material property
      applyToAll({ [key]: value });
    }
  };

  // Build UI from config
  buildTweakpaneFromConfig(pane, params as unknown as Record<string, unknown>, handleChange);

  return pane;
}
