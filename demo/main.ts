import { Application, Assets, Container, Sprite, Texture, MeshGeometry } from 'pixi.js';
import { GlassOverlay, GlassPresets, getHeightAndDerivative, createPillGeometry, updatePillGeometry, createPillNormalMap, GlassPanel, createDefaultEdgeMask, createDisplacementMap } from '../src/index.js';
import type { RenderQualityOptions, SurfaceShape, EdgeMaskConfig, EdgeTactic } from '../src/core/types.js';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { createDebugLogger } from './debugLogger';
import type { DebugLogger } from './debugLogger';
import { setupDraggables } from './draggable';
import { buildTweakpaneFromConfig, setNestedValue } from '../src/core/tweakpane-builder.js';
import tweakpaneConfig from '../src/core/tweakpane-config.json';

import './style.css';

const STORAGE_KEY = 'adaptive-glass-tweakpane';
const POSITIONS_KEY = 'adaptive-glass-positions';
const PROFILES_KEY = 'adaptive-glass-profiles';
const RADIUS_KEY = 'adaptive-glass-radius';

setupDraggables();

type QualityPreset = 'high' | 'balanced' | 'low';

const QUALITY_PRESETS: Record<QualityPreset, Partial<RenderQualityOptions>> = {
  high: {
    renderScale: 1,
    maxBlurTaps: 9,
    enableDispersion: true,
    enableCaustics: true,
    enableContactShadows: true,
    edgeSupersampling: 4,
  },
  balanced: {
    renderScale: 0.85,
    maxBlurTaps: 7,
    enableDispersion: true,
    enableCaustics: true,
    enableContactShadows: false,
    edgeSupersampling: 2,
  },
  low: {
    renderScale: 0.5,
    maxBlurTaps: 3,
    enableDispersion: false,
    enableCaustics: false,
    enableContactShadows: false,
    edgeSupersampling: 1,
  },
};

(async () => {
const logger = createDebugLogger();
const { log } = logger;
type LogFn = DebugLogger['log'];
(window as unknown as { __glassDebugLog?: LogFn }).__glassDebugLog = log;
log('app:init', 'Booting adaptive glass renderer demo');

const mount = document.querySelector<HTMLElement>('#app');
if (!mount) throw new Error('Missing #app mount element.');
log('dom:mount', `found #app ${mount.clientWidth}x${mount.clientHeight}`);

const app = new Application();
log('pixi:init', 'Starting app.init()...');
await app.init({
  backgroundAlpha: 0,
  antialias: true,
  resizeTo: window,
  preference: 'webgl',
});
log('pixi:init', 'app.init() completed');
app.stage.sortableChildren = true;
log('pixi:application', `resizeTo=window, dpr=${window.devicePixelRatio.toFixed(2)}`);
// Pixi v8 background system can be left default; no manual clear tweak needed.
const canvas =
  (app as unknown as { canvas?: HTMLCanvasElement }).canvas ?? (app.view as HTMLCanvasElement);
mount.appendChild(canvas);
log('canvas:attached', `screen=${app.renderer.screen.width}x${app.renderer.screen.height}`);

const stageBackground = createBackgroundLayer();
stageBackground.container.zIndex = -10;
app.stage.addChild(stageBackground.container);
log('background:init', 'prepared animated gradient layer');


// --- GLASS OVERLAY SETUP ---
// (temporarily disabled for debugging)
// const overlay = new GlassOverlay(app.renderer, {
//   background: stageBackground.container,
//   stage: app.stage,
//   systemOptions: { hudEnabled: true },
// });
// log('glass:init', 'GlassOverlay initialized');
// overlay.autoMount('.draggable-item');
// log('glass:mount', 'Watching for .draggable-item elements');
// setupTweakpane(overlay, logger);
// log('ui:init', 'bound Tweakpane controls');

const overlay = new GlassOverlay(app.renderer, {
  background: stageBackground.container,
  stage: app.stage,
  systemOptions: { hudEnabled: true },
});

// Transform params for demo - can be adjusted via Tweakpane
const transformParams = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
};

// Set position transform to map DOM coordinates to canvas coordinates
overlay.setPositionTransform((x, y, width, height) => ({
  x: (x - transformParams.offsetX) * transformParams.scale,
  y: (y - transformParams.offsetY) * transformParams.scale,
  scaleX: transformParams.scale,
  scaleY: transformParams.scale,
  rotation: transformParams.rotation,
}));

log('glass:init', 'GlassOverlay initialized');
overlay.autoMount('.draggable-item');
log('glass:mount', 'Watching for .draggable-item elements');
setupTweakpane(overlay, logger, transformParams);
log('ui:init', 'bound Tweakpane controls');

// const debugRect = new Graphics().rect(100, 100, 100, 100).fill(0xff0000);
// app.stage.addChild(debugRect);
// log('debug:init', 'Added red debug rect to stage');

let loggedFirstFrame = false;
app.ticker.add((ticker: any) => {
  try {
    const width = app.renderer.screen.width;
    const height = app.renderer.screen.height;
    const time = ticker.lastTime ? ticker.lastTime / 1000 : performance.now() / 1000;

    stageBackground.update(width, height, time);

    if (!loggedFirstFrame) {
      loggedFirstFrame = true;
      log('ticker:first-frame', `screen=${width}x${height}`, {
        deltaMS: ticker.deltaMS,
      });
    }

    overlay.update();
  } catch (e) {
    console.error('ticker loop error', e);
  }
});
})();

function createBackgroundLayer() {
  const container = new Container();
  const sprite = new Sprite(Texture.EMPTY);
  sprite.anchor.set(0.5);
  container.addChild(sprite);

  // Load texture asynchronously
  Assets.load('/room_turn_night.avif').then((tex) => {
    sprite.texture = tex;
  });

  const update = (width: number, height: number, t: number) => {
    sprite.position.set(width / 2, height / 2);

    // Check both for sprite.texture (async load might not be done) and if valid
    if (sprite.texture && sprite.texture !== Texture.EMPTY) {
      const texture = sprite.texture;
      // Only scale if we have valid dimensions
      if (texture.width > 1 && texture.height > 1) {
        const scaleX = width / texture.width;
        const scaleY = height / texture.height;
        const scale = Math.max(scaleX, scaleY);
        sprite.scale.set(scale);
      }
    }
  };

  return { container, update };
}

// Cross-section visualization
function drawCrossSection(canvas: HTMLCanvasElement, shape: SurfaceShape, bevelSize: number, invertNormals: boolean): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const padding = 10;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, w, h);

  // Draw the cross-section showing: edge | bevel curve | plateau | bevel curve | edge
  const drawWidth = w - padding * 2;
  const drawHeight = h - padding * 2;

  // Layout: 10% edge | 30% bevel | 20% plateau | 30% bevel | 10% edge
  const edgeWidth = drawWidth * 0.1;
  const bevelWidth = drawWidth * 0.3;
  const plateauWidth = drawWidth * 0.2;

  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 2;
  ctx.beginPath();

  // Helper to map height to y coordinate
  const heightToY = (height: number) => {
    let h = height;
    if (invertNormals) h = 1 - h;
    return padding + (1 - h) * drawHeight * 0.8;
  };

  // Left edge (flat at 0)
  let x = padding;
  ctx.moveTo(x, heightToY(0));
  x += edgeWidth;
  ctx.lineTo(x, heightToY(0));

  // Left bevel curve (rising from 0 to 1)
  for (let i = 0; i <= bevelWidth; i++) {
    const t = i / bevelWidth;
    const { height } = getHeightAndDerivative(t, shape);
    ctx.lineTo(x + i, heightToY(height));
  }
  x += bevelWidth;

  // Plateau (flat at 1)
  ctx.lineTo(x + plateauWidth, heightToY(1));
  x += plateauWidth;

  // Right bevel curve (falling from 1 to 0)
  for (let i = 0; i <= bevelWidth; i++) {
    const t = 1 - i / bevelWidth;
    const { height } = getHeightAndDerivative(t, shape);
    ctx.lineTo(x + i, heightToY(height));
  }
  x += bevelWidth;

  // Right edge (flat at 0)
  ctx.lineTo(x + edgeWidth, heightToY(0));

  ctx.stroke();
}

function setupTweakpane(overlay: GlassOverlay, loggerInstance: DebugLogger, transformParams: { offsetX: number; offsetY: number; scale: number; rotation: number }): void {
  const pane = new Pane({ title: 'Adaptive Glass', expanded: true });
  pane.registerPlugin(EssentialsPlugin);
  const system = overlay.system;

  // Make pane wider and ensure it stays in viewport
  const paneElement = pane.element;
  paneElement.style.width = '340px';
  paneElement.style.position = 'fixed';
  paneElement.style.top = '8px';
  paneElement.style.left = '8px';
  paneElement.style.right = 'auto';

  // Material params - flat structure with categorized keys
  const matParams: Record<string, any> = {
    // glass.refraction
    'glass.ior': 1.663,
    'glass.thickness': 1.261,
    'glass.roughness': 0.859,
    'glass.opacity': 1,
    // glass.dispersion
    'glass.enableDispersion': true,
    'glass.dispersion': 0.183,
    'glass.aberrationR': 1.478,
    'glass.aberrationB': 1,
    // glass.blur
    'glass.blurSamples': 10,
    'glass.blurSpread': 6.777,
    'glass.blurAngle': 0,
    'glass.blurAnisotropy': 0,
    'glass.blurGamma': 1,
    // glass.tint
    'glass.tint': 0xdde1ff,
    // lighting.specular
    'lighting.specular': 0.370,
    'lighting.shininess': 86.924,
    'lighting.shadow': 0.217,
    // lighting.ao
    'lighting.ao': 0.3,
    'lighting.aoRadius': 0.5,
    // lighting.direction
    'lighting.dirX': 0.5,
    'lighting.dirY': 0.478,
    'lighting.dirZ': 1,
    // lighting.cursor
    'lighting.followCursor': false,
    'lighting.smoothing': 0.9,
    'lighting.delay': 0.5,
    'lighting.curve': 1.5,
    'lighting.zMin': 0.05,
    'lighting.zMax': 0.20,
    'lighting.edgeStretch': 0.5,
    // noise
    'noise.intensity': 0,
    'noise.scale': 2,
    'noise.rotation': 0,
    'noise.threshold': 0,
    // surface
    'surface.shape': 'circle',
    'surface.cornerRadius': 20,
    'surface.bevelSize': 16,
    'surface.invertNormals': false,
    'surface.isCircle': false,
    'surface.useDisplacementMap': false,
    // edgeMask.base
    'edgeMask.cutoff': 0.001,
    'edgeMask.blur': 1,
    'edgeMask.invert': false,
    'edgeMask.debugMode': 0,
    // edgeMask.ior
    'edgeMask.iorEnabled': true,
    'edgeMask.iorRangeStart': 0,
    'edgeMask.iorRangeEnd': 0.15,
    'edgeMask.iorStrength': 1,
    // edgeMask.smoothing
    'edgeMask.smoothing.enabled': false,
    'edgeMask.smoothing.rangeStart': 0,
    'edgeMask.smoothing.rangeEnd': 0.3,
    'edgeMask.smoothing.strength': 1,
    'edgeMask.smoothing.opacity': 1,
    // edgeMask.contrast
    'edgeMask.contrast.enabled': false,
    'edgeMask.contrast.rangeStart': 0,
    'edgeMask.contrast.rangeEnd': 0.3,
    'edgeMask.contrast.strength': 0.7,
    'edgeMask.contrast.opacity': 1,
    // edgeMask.alpha
    'edgeMask.alpha.enabled': false,
    'edgeMask.alpha.rangeStart': 0,
    'edgeMask.alpha.rangeEnd': 0.2,
    'edgeMask.alpha.strength': 1,
    'edgeMask.alpha.opacity': 1,
    // edgeMask.tint
    'edgeMask.tint.enabled': false,
    'edgeMask.tint.rangeStart': 0,
    'edgeMask.tint.rangeEnd': 0.5,
    'edgeMask.tint.strength': 0.5,
    'edgeMask.tint.opacity': 1,
    // edgeMask.darken
    'edgeMask.darken.enabled': false,
    'edgeMask.darken.rangeStart': 0,
    'edgeMask.darken.rangeEnd': 0.3,
    'edgeMask.darken.strength': 0.3,
    'edgeMask.darken.opacity': 1,
    // edgeMask.desaturate
    'edgeMask.desaturate.enabled': false,
    'edgeMask.desaturate.rangeStart': 0,
    'edgeMask.desaturate.rangeEnd': 0.4,
    'edgeMask.desaturate.strength': 0.5,
    'edgeMask.desaturate.opacity': 1,
    // quality
    'quality.renderScale': 1,
    'quality.enableDispersion': true,
    'quality.enableCaustics': true,
    'quality.enableContactShadows': true,
    'quality.maxBlurTaps': 9,
    'quality.edgeSupersampling': 4,
    'quality.glassSupersampling': 1,
  };

  // Helper to build EdgeMaskConfig from flat params
  const buildEdgeMask = (): EdgeMaskConfig => ({
    cutoff: matParams['edgeMask.cutoff'],
    blur: matParams['edgeMask.blur'],
    invert: matParams['edgeMask.invert'],
    debugMode: matParams['edgeMask.debugMode'],
    smoothing: {
      enabled: matParams['edgeMask.smoothing.enabled'],
      rangeStart: matParams['edgeMask.smoothing.rangeStart'],
      rangeEnd: matParams['edgeMask.smoothing.rangeEnd'],
      strength: matParams['edgeMask.smoothing.strength'],
      opacity: matParams['edgeMask.smoothing.opacity'],
    },
    contrast: {
      enabled: matParams['edgeMask.contrast.enabled'],
      rangeStart: matParams['edgeMask.contrast.rangeStart'],
      rangeEnd: matParams['edgeMask.contrast.rangeEnd'],
      strength: matParams['edgeMask.contrast.strength'],
      opacity: matParams['edgeMask.contrast.opacity'],
    },
    alpha: {
      enabled: matParams['edgeMask.alpha.enabled'],
      rangeStart: matParams['edgeMask.alpha.rangeStart'],
      rangeEnd: matParams['edgeMask.alpha.rangeEnd'],
      strength: matParams['edgeMask.alpha.strength'],
      opacity: matParams['edgeMask.alpha.opacity'],
    },
    tint: {
      enabled: matParams['edgeMask.tint.enabled'],
      rangeStart: matParams['edgeMask.tint.rangeStart'],
      rangeEnd: matParams['edgeMask.tint.rangeEnd'],
      strength: matParams['edgeMask.tint.strength'],
      opacity: matParams['edgeMask.tint.opacity'],
    },
    darken: {
      enabled: matParams['edgeMask.darken.enabled'],
      rangeStart: matParams['edgeMask.darken.rangeStart'],
      rangeEnd: matParams['edgeMask.darken.rangeEnd'],
      strength: matParams['edgeMask.darken.strength'],
      opacity: matParams['edgeMask.darken.opacity'],
    },
    desaturate: {
      enabled: matParams['edgeMask.desaturate.enabled'],
      rangeStart: matParams['edgeMask.desaturate.rangeStart'],
      rangeEnd: matParams['edgeMask.desaturate.rangeEnd'],
      strength: matParams['edgeMask.desaturate.strength'],
      opacity: matParams['edgeMask.desaturate.opacity'],
    },
  });

  // Helper to build full material
  const buildMaterial = () => ({
    ior: matParams['glass.ior'],
    thickness: matParams['glass.thickness'],
    roughness: matParams['glass.roughness'],
    opacity: matParams['glass.opacity'],
    dispersion: matParams['glass.dispersion'],
    aberrationR: matParams['glass.aberrationR'],
    aberrationB: matParams['glass.aberrationB'],
    tint: matParams['glass.tint'],
    specular: matParams['lighting.specular'],
    shininess: matParams['lighting.shininess'],
    shadow: matParams['lighting.shadow'],
    ao: matParams['lighting.ao'],
    aoRadius: matParams['lighting.aoRadius'],
    lightDir: [matParams['lighting.dirX'], matParams['lighting.dirY'], matParams['lighting.dirZ']] as [number, number, number],
    blurSamples: matParams['glass.blurSamples'],
    blurSpread: matParams['glass.blurSpread'],
    blurAngle: matParams['glass.blurAngle'],
    blurAnisotropy: matParams['glass.blurAnisotropy'],
    blurGamma: matParams['glass.blurGamma'],
    noiseIntensity: matParams['noise.intensity'],
    noiseScale: matParams['noise.scale'],
    noiseRotation: matParams['noise.rotation'],
    noiseThreshold: matParams['noise.threshold'],
    glassSupersampling: matParams['quality.glassSupersampling'],
    edgeIorEnabled: matParams['edgeMask.iorEnabled'],
    edgeIorRangeStart: matParams['edgeMask.iorRangeStart'],
    edgeIorRangeEnd: matParams['edgeMask.iorRangeEnd'],
    edgeIorStrength: matParams['edgeMask.iorStrength'],
    edgeMask: buildEdgeMask(),
  });

  // Apply to all panels
  const applyToAll = (partial: any) => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      const panel = overlay.track(el);
      panel.setMaterial(partial);
    });
  };

  // Rebuild panels (for shape changes)
  const rebuildPanels = () => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      overlay.untrack(el);
      overlay.track(el, {
        cornerRadius: matParams['surface.cornerRadius'],
        surfaceShape: matParams['surface.shape'] as SurfaceShape,
        bevelSize: matParams['surface.bevelSize'],
        invertNormals: matParams['surface.invertNormals'],
        isCircle: matParams['surface.isCircle'],
        useDisplacementMap: matParams['surface.useDisplacementMap'],
        material: buildMaterial(),
      });
    });
  };

  // Callback for redrawing cross-section (set later)
  let redrawCrossSection: (() => void) | null = null;

  // Handle change from config-driven UI
  const handleChange = (key: string, value: unknown) => {
    matParams[key] = value;
    loggerInstance.log('ui:change', `${key}=${JSON.stringify(value)}`);

    // Route to appropriate handler based on categorized key
    if (key.startsWith('lighting.dir')) {
      applyToAll({ lightDir: [matParams['lighting.dirX'], matParams['lighting.dirY'], matParams['lighting.dirZ']] });
    } else if (key.startsWith('lighting.') && (key.includes('followCursor') || key.includes('smoothing') ||
               key.includes('delay') || key.includes('curve') || key.includes('zMin') ||
               key.includes('zMax') || key.includes('edgeStretch'))) {
      overlay.setLightFollowParams({
        followCursor: matParams['lighting.followCursor'],
        smoothing: matParams['lighting.smoothing'],
        delay: matParams['lighting.delay'],
        curve: matParams['lighting.curve'],
        zMin: matParams['lighting.zMin'],
        zMax: matParams['lighting.zMax'],
        edgeStretch: matParams['lighting.edgeStretch'],
      });
    } else if (key.startsWith('surface.')) {
      rebuildPanels();
      if (redrawCrossSection) redrawCrossSection();
    } else if (key.startsWith('edgeMask.')) {
      applyToAll({ edgeMask: buildEdgeMask() });
      // Also update IOR params
      if (key.includes('ior')) {
        applyToAll({
          edgeIorEnabled: matParams['edgeMask.iorEnabled'],
          edgeIorRangeStart: matParams['edgeMask.iorRangeStart'],
          edgeIorRangeEnd: matParams['edgeMask.iorRangeEnd'],
          edgeIorStrength: matParams['edgeMask.iorStrength'],
        });
      }
    } else if (key.startsWith('quality.')) {
      system.setQuality({
        renderScale: matParams['quality.renderScale'],
        maxBlurTaps: matParams['quality.maxBlurTaps'],
        edgeSupersampling: matParams['quality.edgeSupersampling'],
        enableDispersion: matParams['quality.enableDispersion'],
        enableCaustics: matParams['quality.enableCaustics'],
        enableContactShadows: matParams['quality.enableContactShadows'],
      });
    } else if (key.startsWith('glass.')) {
      // Map glass params to material properties
      const prop = key.replace('glass.', '');
      applyToAll({ [prop]: value });
    } else if (key.startsWith('lighting.')) {
      // Map lighting params
      const prop = key.replace('lighting.', '');
      applyToAll({ [prop]: value });
    } else if (key.startsWith('noise.')) {
      // Map noise params
      const prop = 'noise' + key.replace('noise.', '').charAt(0).toUpperCase() + key.replace('noise.', '').slice(1);
      applyToAll({ [prop]: value });
    } else {
      // Direct property
      applyToAll({ [key]: value });
    }
  };

  // Build UI from JSON config
  buildTweakpaneFromConfig(pane, matParams, handleChange, tweakpaneConfig as any);

  // Load saved state
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (savedState) {
    const saved = JSON.parse(savedState);
    Object.assign(matParams, saved);
    pane.refresh();
  }

  // === SAVE/LOAD BUTTONS ===
  const settingsFolder = pane.addFolder({ title: 'Settings', expanded: false });

  settingsFolder.addButton({ title: 'Save to Browser' }).on('click', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matParams));
    console.log('Settings saved to browser storage');
  });

  settingsFolder.addButton({ title: 'Export to Clipboard' }).on('click', () => {
    const replacer = (_key: string, value: unknown) => {
      if (typeof value === 'number') {
        return Math.round(value * 1000) / 1000;
      }
      return value;
    };
    navigator.clipboard.writeText(JSON.stringify(matParams, replacer, 2));
    console.log('Settings exported to clipboard');
  });

  settingsFolder.addButton({ title: 'Import from Clipboard' }).on('click', async () => {
    const text = await navigator.clipboard.readText();
    const importData = JSON.parse(text);
    Object.assign(matParams, importData);
    pane.refresh();
    rebuildPanels();
    redrawCrossSection?.();
    console.log('Settings imported from clipboard');
  });

  // Apply initial state after panels are created
  setTimeout(() => {
    rebuildPanels();
    overlay.setLightFollowParams({
      followCursor: matParams['lighting.followCursor'],
      smoothing: matParams['lighting.smoothing'],
      delay: matParams['lighting.delay'],
      curve: matParams['lighting.curve'],
      zMin: matParams['lighting.zMin'],
      zMax: matParams['lighting.zMax'],
      edgeStretch: matParams['lighting.edgeStretch'],
    });
  }, 150);

  // === SURFACE SHAPE DIAGRAMS ===
  // Find the surface folder in the pane
  const surfaceFolder = (pane as any).children?.find((c: any) => c.title === 'Surface Shape');
  if (!surfaceFolder) return;

  const shapes: SurfaceShape[] = ['circle', 'squircle', 'concave', 'lip', 'dome', 'wave', 'flat', 'ramp'];
  const shapeLabels: Record<SurfaceShape, string> = {
    circle: 'Circle', squircle: 'Squircle', concave: 'Concave', lip: 'Lip',
    dome: 'Dome', wave: 'Wave', flat: 'Flat', ramp: 'Ramp'
  };

  // Grid container for shape thumbnails
  const gridContainer = document.createElement('div');
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
  gridContainer.style.gap = '4px';
  gridContainer.style.marginBottom = '8px';

  const shapeCanvases: Map<SurfaceShape, HTMLCanvasElement> = new Map();

  // Large canvas for current selection
  const crossSectionCanvas = document.createElement('canvas');
  crossSectionCanvas.width = 320;
  crossSectionCanvas.height = 80;
  crossSectionCanvas.style.width = '100%';
  crossSectionCanvas.style.borderRadius = '4px';
  crossSectionCanvas.style.marginTop = '8px';

  // Redraw functions
  const redrawAllCurves = () => {
    shapes.forEach(shapeItem => {
      const canvas = shapeCanvases.get(shapeItem);
      if (canvas) {
        drawCrossSection(canvas, shapeItem, matParams['surface.bevelSize'], matParams['surface.invertNormals']);
        const wrapper = canvas.parentElement;
        if (wrapper) {
          wrapper.style.border = shapeItem === matParams['surface.shape'] ? '2px solid #4a9eff' : '2px solid transparent';
        }
      }
    });
  };

  // Assign to the outer variable so handleChange can call it
  redrawCrossSection = () => {
    drawCrossSection(crossSectionCanvas, matParams['surface.shape'] as SurfaceShape, matParams['surface.bevelSize'], matParams['surface.invertNormals']);
    redrawAllCurves();
  };

  // Create grid tiles
  shapes.forEach(shape => {
    const wrapper = document.createElement('div');
    wrapper.style.cursor = 'pointer';
    wrapper.style.borderRadius = '4px';
    wrapper.style.overflow = 'hidden';
    wrapper.style.border = shape === matParams.surfaceShape ? '2px solid #4a9eff' : '2px solid transparent';

    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 40;
    canvas.style.width = '100%';
    canvas.style.display = 'block';

    const label = document.createElement('div');
    label.textContent = shapeLabels[shape];
    label.style.fontSize = '9px';
    label.style.textAlign = 'center';
    label.style.padding = '2px';
    label.style.background = '#1a1a1a';
    label.style.color = '#888';

    wrapper.appendChild(canvas);
    wrapper.appendChild(label);
    gridContainer.appendChild(wrapper);
    shapeCanvases.set(shape, canvas);

    wrapper.addEventListener('click', () => {
      matParams['surface.shape'] = shape;
      rebuildPanels();
      redrawCrossSection();
      pane.refresh();
    });
  });

  // Append to surface folder
  const canvasContainer = document.createElement('div');
  canvasContainer.appendChild(gridContainer);
  canvasContainer.appendChild(crossSectionCanvas);
  surfaceFolder.element.appendChild(canvasContainer);

  // Initial draw
  redrawCrossSection();

  // Export displacement map button
  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export Displacement Map';
  exportBtn.style.cssText = 'width: 100%; padding: 8px; margin-top: 8px; cursor: pointer; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px;';
  exportBtn.addEventListener('click', () => {
    const panel = document.querySelector<HTMLElement>('.draggable-item');
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const texture = createDisplacementMap(
      rect.width,
      rect.height,
      matParams['surface.cornerRadius'],
      matParams['surface.bevelSize'],
      matParams['surface.shape'] as SurfaceShape
    );

    // Extract texture to canvas and download
    const canvas = document.createElement('canvas');
    canvas.width = texture.width;
    canvas.height = texture.height;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(texture.width, texture.height);
    const source = texture.source as any;
    const data = source.resource as Uint8Array;
    imageData.data.set(data);
    ctx.putImageData(imageData, 0, 0);

    const link = document.createElement('a');
    link.download = 'displacement-map.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    texture.destroy();
  });
  surfaceFolder.element.appendChild(exportBtn);
}
