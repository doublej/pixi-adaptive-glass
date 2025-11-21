import { Application, Assets, Container, Sprite, Texture } from 'pixi.js';
import { GlassOverlay, GlassPresets, getHeightAndDerivative } from '../src/index.js';
import type { RenderQualityOptions, SurfaceShape } from '../src/core/types.js';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { createDebugLogger } from './debugLogger';
import type { DebugLogger } from './debugLogger';
import { setupDraggables } from './draggable';

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
function drawCrossSection(canvas: HTMLCanvasElement, shape: SurfaceShape, bevelSize: number, flipX: boolean, flipY: boolean): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const padding = 10;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, w, h);

  // Draw the cross-section line
  const drawWidth = w - padding * 2;
  const drawHeight = h - padding * 2;

  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 2;
  ctx.beginPath();

  // Draw cross-section - show only right half to make flip X visible
  for (let i = 0; i <= drawWidth; i++) {
    // Distance from left edge (0) to right edge (1)
    const normalizedPos = i / drawWidth;
    // t goes from 1 at left edge to 0 at center to 1 at right edge
    // But we only show right half: center (0) to right edge (1)
    const t = normalizedPos; // 0 at left (center of glass) to 1 at right (edge)

    // Apply bevel scaling
    const bevelStart = 1 - (bevelSize / 50);
    let bevelT = t <= bevelStart ? 0 : (t - bevelStart) / (1 - bevelStart);

    // Flip inverts the curve direction for smooth connection
    if (flipY) bevelT = 1 - bevelT;

    // Height is inverted: flat center at top, bevels curve down
    const { height } = getHeightAndDerivative(Math.min(1, bevelT), shape);
    let yVal = flipY ? height * drawHeight * 0.8 : (1 - height) * drawHeight * 0.8;
    const y = padding + yVal;
    const x = flipX ? (w - padding - i) : (padding + i);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();

  // Label
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('center → edge', padding, h - 3);
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

  // Stats folder
  const statsFolder = pane.addFolder({ title: 'Stats', expanded: true });

  const statsParams = {
    fps: 0,
    resolution: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
    renderRes: `${Math.round(window.innerWidth * window.devicePixelRatio)}x${Math.round(window.innerHeight * window.devicePixelRatio)}`,
  };

  statsFolder.addBinding(statsParams, 'fps', {
    readonly: true,
    label: 'FPS',
    format: (v: number) => v.toFixed(1),
  });

  statsFolder.addBinding(statsParams, 'resolution', {
    readonly: true,
    label: 'viewport',
  });

  statsFolder.addBinding(statsParams, 'dpr', {
    readonly: true,
    label: 'pixel ratio',
    format: (v: number) => v.toFixed(2),
  });

  statsFolder.addBinding(statsParams, 'renderRes', {
    readonly: true,
    label: 'render res',
  });

  // Update stats
  let frameCount = 0;
  let lastTime = performance.now();
  const updateStats = () => {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 500) {
      statsParams.fps = (frameCount * 1000) / (now - lastTime);
      statsParams.resolution = `${window.innerWidth}x${window.innerHeight}`;
      statsParams.dpr = window.devicePixelRatio;
      statsParams.renderRes = `${Math.round(window.innerWidth * window.devicePixelRatio)}x${Math.round(window.innerHeight * window.devicePixelRatio)}`;
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(updateStats);
  };
  updateStats();

  // Stress test folder
  const stressFolder = pane.addFolder({ title: 'Stress Test', expanded: false });

  const stressParams = {
    panelCount: 4,
    spawnCount: 10,
  };

  // Debug folder
  const debugFolder = pane.addFolder({ title: 'Debug', expanded: false });

  const debugParams = {
    showOutlines: false,
  };

  debugFolder.addBinding(debugParams, 'showOutlines', {
    label: 'container outlines',
  }).on('change', (ev: any) => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      if (ev.value) {
        el.style.outline = '2px solid #ff00ff';
        el.style.outlineOffset = '-1px';
      } else {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }
    });
  });

  // Animation test folder
  const animFolder = debugFolder.addFolder({ title: 'Animation Tests', expanded: true });

  animFolder.addButton({ title: 'Pulse All' }).on('click', () => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      el.classList.add('animate-pulse');
      el.addEventListener('animationend', () => el.classList.remove('animate-pulse'), { once: true });
    });
    loggerInstance.log('anim:test', 'Triggered pulse animation');
  });

  animFolder.addButton({ title: 'Bounce All' }).on('click', () => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      el.classList.add('animate-bounce');
      el.addEventListener('animationend', () => el.classList.remove('animate-bounce'), { once: true });
    });
    loggerInstance.log('anim:test', 'Triggered bounce animation');
  });

  animFolder.addButton({ title: 'Toggle Grow' }).on('click', () => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      el.classList.toggle('animate-grow');
    });
    loggerInstance.log('anim:test', 'Toggled grow transition');
  });

  animFolder.addButton({ title: 'Toggle Move' }).on('click', () => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      el.classList.toggle('animate-move');
    });
    loggerInstance.log('anim:test', 'Toggled move transition');
  });

  animFolder.addButton({ title: 'Resize Alpha' }).on('click', () => {
    const el = document.getElementById('panel-alpha');
    if (!el) return;
    const isLarge = el.style.width === '300px';
    el.style.width = isLarge ? '200px' : '300px';
    el.style.height = isLarge ? '250px' : '350px';
    loggerInstance.log('anim:test', `Resized Alpha to ${isLarge ? '200x250' : '300x350'}`);
  });

  // Canvas transform controls (for when canvas differs from HTML screenspace)
  const transformFolder = debugFolder.addFolder({ title: 'Canvas Transform', expanded: false });

  transformFolder.addBinding(transformParams, 'offsetX', {
    min: -500, max: 500, step: 1,
    label: 'offset X',
  });

  transformFolder.addBinding(transformParams, 'offsetY', {
    min: -500, max: 500, step: 1,
    label: 'offset Y',
  });

  transformFolder.addBinding(transformParams, 'scale', {
    min: 0.1, max: 3, step: 0.01,
    label: 'scale',
  });

  transformFolder.addBinding(transformParams, 'rotation', {
    min: -Math.PI, max: Math.PI, step: 0.01,
    label: 'rotation',
  });

  statsFolder.addBinding(stressParams, 'panelCount', {
    readonly: true,
    label: 'panels',
  });

  stressFolder.addBinding(stressParams, 'spawnCount', {
    min: 1, max: 100, step: 1,
    label: 'spawn count',
  });

  stressFolder.addButton({ title: 'Spawn Panels' }).on('click', () => {
    const container = document.getElementById('app');
    if (!container) return;

    const shapes = ['squircle', 'circle', 'dome', 'ridge', 'wave', 'flat'];
    const baseCount = stressParams.panelCount;

    for (let i = 0; i < stressParams.spawnCount; i++) {
      const panel = document.createElement('div');
      const id = `stress-panel-${baseCount + i}`;
      panel.id = id;
      panel.className = 'draggable-item glass-panel';

      const size = 80 + Math.random() * 120;
      const x = Math.random() * (window.innerWidth - size);
      const y = Math.random() * (window.innerHeight - size);
      const radius = Math.random() * 40 + 10;

      panel.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: ${radius}px;
      `;

      container.appendChild(panel);

      overlay.track(panel, {
        cornerRadius: radius,
        surfaceShape: shapes[Math.floor(Math.random() * shapes.length)] as any,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
          noiseScale: matParams.noiseScale,
          noiseIntensity: matParams.noiseIntensity,
          noiseRotation: matParams.noiseRotation,
          noiseThreshold: matParams.noiseThreshold,
          edgeSmoothWidth: matParams.edgeSmoothWidth,
          edgeContrast: matParams.edgeContrast,
          edgeAlphaFalloff: matParams.edgeAlphaFalloff,
          edgeMaskCutoff: matParams.edgeMaskCutoff,
          enableEdgeSmoothing: matParams.enableEdgeSmoothing,
          enableContrastReduction: matParams.enableContrastReduction,
          enableAlphaFalloff: matParams.enableAlphaFalloff,
          enableTintOpacity: matParams.enableTintOpacity,
          edgeBlur: matParams.edgeBlur,
          glassSupersampling: matParams.glassSupersampling,
        },
      });
    }

    stressParams.panelCount += stressParams.spawnCount;
    loggerInstance.log('stress:spawn', `spawned ${stressParams.spawnCount} panels, total=${stressParams.panelCount}`);
  });

  stressFolder.addButton({ title: 'Clear Stress Panels' }).on('click', () => {
    document.querySelectorAll<HTMLElement>('[id^="stress-panel-"]').forEach((el) => {
      overlay.untrack(el);
      el.remove();
    });
    stressParams.panelCount = 4;
    loggerInstance.log('stress:clear', 'cleared all stress test panels');
  });

  const settingsFolder = pane.addFolder({ title: 'Settings', expanded: true });

  // Quality
  const qualityParams = {
    preset: 'high',
  };
  settingsFolder
    .addBinding(qualityParams, 'preset', {
      options: {
        High: 'high',
        Balanced: 'balanced',
        Low: 'low',
      },
    })
    .on('change', (ev: any) => {
      const preset = ev.value as QualityPreset;
      const overrides = QUALITY_PRESETS[preset];
      system.setQuality(overrides);
      loggerInstance.log('ui:quality', `preset=${preset}`, overrides);
    });

  // View toggles
  // const hudLayer = system.getHudLayer();
  // if (hudLayer) {
  //   hudLayer.visible = true; // Make HUD visible by default
  //   // settingsFolder.addBinding({ hud: hudLayer.visible }, 'hud', { label: 'HUD' }).on('change', (ev) => {
  //   //   hudLayer.visible = ev.value;
  //   //   loggerInstance.log('ui:hud-toggle', `visible=${ev.value}`);
  //   // });
  // }

  const defaultMat = GlassPresets.water(); // Start with water preset defaults

  const matParams = {
    // Refraction
    ior: 1.6630434782608696,
    thickness: 1.2608695652173914,
    opacity: 1,
    tint: '#dde1ff',
    // Dispersion
    dispersion: 0.1826086956521739,
    aberrationR: 1.4782608695652173,
    aberrationB: 1,
    // Blur
    roughness: 0.8586956521739131,
    blurSamples: 10,
    blurSpread: 6.7771739130434785,
    blurAngle: 0,
    blurAnisotropy: 0,
    blurGamma: 1,
    // Lighting
    specular: 0.3695652173913043,
    shininess: 86.92391304347827,
    shadow: 0.21739130434782608,
    lightX: 0.5,
    lightY: 0.4782608695652173,
    lightZ: 1,
    // Bevel
    surfaceShape: 'circle' as SurfaceShape,
    bevelSize: 16,
    flipX: false,
    flipY: true,
    // AO
    ao: 0.3,
    aoRadius: 0.5,
    // Noise
    noiseScale: 2,
    noiseIntensity: 0,
    noiseRotation: 0,
    noiseThreshold: 0,
    // Corners
    cornerRadius: 20,
    useHtmlRadius: false,
    // Edges
    edgeSmoothWidth: 0.15,
    edgeContrast: 0.7,
    edgeAlphaFalloff: 1,
    edgeMaskCutoff: 0.001,
    enableEdgeSmoothing: true,
    enableContrastReduction: true,
    enableAlphaFalloff: true,
    enableTintOpacity: true,
    edgeBlur: 1,
    glassSupersampling: 1,
  };

  const applyToAll = (partial: any) => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      const panel = overlay.track(el);
      panel.setMaterial(partial);
    });
  };

  // Apply initial tint on load
  setTimeout(() => {
    applyToAll({ tint: 0xdde1ff });
  }, 100);

  // === TABS STRUCTURE ===
  const tab = pane.addTab({
    pages: [
      { title: 'Appearance' },
      { title: 'Lighting' },
      { title: 'Surface' },
    ],
  });

  // === APPEARANCE TAB ===
  const appearanceTab = tab.pages[0];

  // Refraction folder
  const refractionFolder = appearanceTab.addFolder({ title: 'Refraction', expanded: true });

  refractionFolder.addBinding(matParams, 'ior', {
    min: 1.0, max: 2.5, step: 0.01,
    label: 'IOR',
  }).on('change', (ev: any) => {
    applyToAll({ ior: ev.value });
  });

  refractionFolder.addBinding(matParams, 'thickness', {
    min: 0, max: 5, step: 0.01,
    label: 'thickness',
  }).on('change', (ev: any) => {
    applyToAll({ thickness: ev.value });
  });

  refractionFolder.addBinding(matParams, 'tint', {
    label: 'tint color',
  }).on('change', (ev: any) => {
    const color = parseInt(ev.value.replace('#', ''), 16);
    applyToAll({ tint: color });
  });

  refractionFolder.addBinding(matParams, 'opacity', {
    min: 0, max: 1, step: 0.01,
    label: 'opacity',
  }).on('change', (ev: any) => {
    applyToAll({ opacity: ev.value });
  });

  // Dispersion folder
  const dispersionFolder = appearanceTab.addFolder({ title: 'Dispersion', expanded: false });

  dispersionFolder.addBinding(matParams, 'dispersion', {
    min: 0, max: 1, step: 0.01,
    label: 'strength',
  }).on('change', (ev: any) => {
    applyToAll({ dispersion: ev.value });
  });

  dispersionFolder.addBinding(matParams, 'aberrationR', {
    min: 0, max: 1, step: 0.01,
    label: 'red/blue bias',
  }).on('change', (ev: any) => {
    applyToAll({ aberrationR: ev.value });
    applyToAll({ aberrationB: 2 - ev.value }); // Inverse relationship
  });

  // Blur folder
  const blurFolder = appearanceTab.addFolder({ title: 'Blur', expanded: true });

  blurFolder.addBinding(matParams, 'roughness', {
    min: 0, max: 1, step: 0.01,
    label: 'roughness',
  }).on('change', (ev: any) => {
    applyToAll({ roughness: ev.value });
  });

  blurFolder.addBinding(matParams, 'blurSamples', {
    min: 1, max: 32, step: 1,
    label: 'samples',
  }).on('change', (ev: any) => {
    applyToAll({ blurSamples: ev.value });
  });

  blurFolder.addBinding(matParams, 'blurSpread', {
    min: 0, max: 20, step: 0.1,
    label: 'blur radius',
  }).on('change', (ev: any) => {
    applyToAll({ blurSpread: ev.value });
  });

  blurFolder.addBinding(matParams, 'blurAngle', {
    min: 0, max: 360, step: 1,
    label: 'direction',
  }).on('change', (ev: any) => {
    applyToAll({ blurAngle: ev.value });
  });

  blurFolder.addBinding(matParams, 'blurAnisotropy', {
    min: 0, max: 1, step: 0.01,
    label: 'directional',
  }).on('change', (ev: any) => {
    applyToAll({ blurAnisotropy: ev.value });
  });

  blurFolder.addBinding(matParams, 'blurGamma', {
    min: 0.2, max: 3, step: 0.01,
    label: 'falloff curve',
  }).on('change', (ev: any) => {
    applyToAll({ blurGamma: ev.value });
  });

  // === LIGHTING TAB ===
  const lightingTab = tab.pages[1];

  lightingTab.addBinding(matParams, 'specular', {
    min: 0, max: 1, step: 0.01,
    label: 'specular',
  }).on('change', (ev: any) => {
    applyToAll({ specular: ev.value });
  });

  lightingTab.addBinding(matParams, 'shininess', {
    min: 0, max: 100, step: 0.01,
    label: 'glossiness',
  }).on('change', (ev: any) => {
    applyToAll({ shininess: ev.value });
  });

  lightingTab.addBinding(matParams, 'shadow', {
    min: 0, max: 1, step: 0.01,
    label: 'shadow',
  }).on('change', (ev: any) => {
    applyToAll({ shadow: ev.value });
  });

  // Cursor-follow light
  const lightFollowParams = { followCursor: false };

  lightingTab.addBinding(lightFollowParams, 'followCursor', {
    label: 'follow cursor',
  }).on('change', (ev: any) => {
    if (ev.value) {
      window.addEventListener('mousemove', updateLightFromCursor);
    } else {
      window.removeEventListener('mousemove', updateLightFromCursor);
    }
  });

  const updateLightFromCursor = (e: MouseEvent) => {
    // Convert cursor position to -1 to 1 range
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1); // Invert Y
    const z = 1 - Math.sqrt(x * x + y * y) * 0.5; // Z decreases toward edges

    matParams.lightX = x;
    matParams.lightY = y;
    matParams.lightZ = Math.min(0.8, Math.max(0.3, z)); // Cap Z to 0.8

    applyToAll({ lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] });
    pane.refresh();
  };

  lightingTab.addBinding(matParams, 'lightX', {
    min: -1, max: 1, step: 0.01,
    label: 'light X',
  }).on('change', (ev: any) => {
    applyToAll({ lightDir: [ev.value, matParams.lightY, matParams.lightZ] });
  });

  lightingTab.addBinding(matParams, 'lightY', {
    min: -1, max: 1, step: 0.01,
    label: 'light Y',
  }).on('change', (ev: any) => {
    applyToAll({ lightDir: [matParams.lightX, ev.value, matParams.lightZ] });
  });

  lightingTab.addBinding(matParams, 'lightZ', {
    min: -1, max: 1, step: 0.01,
    label: 'light Z',
  }).on('change', (ev: any) => {
    applyToAll({ lightDir: [matParams.lightX, matParams.lightY, ev.value] });
  });

  lightingTab.addBinding(matParams, 'ao', {
    min: 0, max: 1, step: 0.01,
    label: 'AO intensity',
  }).on('change', (ev: any) => {
    applyToAll({ ao: ev.value });
  });

  lightingTab.addBinding(matParams, 'aoRadius', {
    min: 0, max: 2, step: 0.01,
    label: 'AO radius',
  }).on('change', (ev: any) => {
    applyToAll({ aoRadius: ev.value });
  });

  // === SURFACE TAB ===
  const surfaceTab = tab.pages[2];

  // Noise folder
  const noiseFolder = surfaceTab.addFolder({ title: 'Noise', expanded: false });

  noiseFolder.addBinding(matParams, 'noiseIntensity', {
    min: 0, max: 1, step: 0.01,
    label: 'intensity',
  }).on('change', (ev: any) => {
    applyToAll({ noiseIntensity: ev.value });
  });

  noiseFolder.addBinding(matParams, 'noiseScale', {
    min: 0.1, max: 10, step: 0.01,
    label: 'scale',
  }).on('change', (ev: any) => {
    applyToAll({ noiseScale: ev.value });
  });

  noiseFolder.addBinding(matParams, 'noiseRotation', {
    min: 0, max: 360, step: 0.01,
    label: 'rotation',
  }).on('change', (ev: any) => {
    applyToAll({ noiseRotation: ev.value });
  });

  noiseFolder.addBinding(matParams, 'noiseThreshold', {
    min: 0, max: 1, step: 0.01,
    label: 'threshold',
  }).on('change', (ev: any) => {
    applyToAll({ noiseThreshold: ev.value });
  });

  // Corners folder
  const cornersFolder = surfaceTab.addFolder({ title: 'Corners', expanded: false });

  cornersFolder.addBinding(matParams, 'useHtmlRadius', {
    label: 'use CSS radius',
  }).on('change', (ev: any) => {
    // Regenerate panels to use CSS or manual radius
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      overlay.untrack(el);
      overlay.track(el, {
        cornerRadius: ev.value ? undefined : matParams.cornerRadius,
        surfaceShape: matParams.surfaceShape,
        bevelSize: matParams.bevelSize,
        flipX: matParams.flipX,
        flipY: matParams.flipY,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
          noiseScale: matParams.noiseScale,
          noiseIntensity: matParams.noiseIntensity,
          noiseRotation: matParams.noiseRotation,
          noiseThreshold: matParams.noiseThreshold,
          edgeSmoothWidth: matParams.edgeSmoothWidth,
          edgeContrast: matParams.edgeContrast,
          edgeAlphaFalloff: matParams.edgeAlphaFalloff,
          edgeMaskCutoff: matParams.edgeMaskCutoff,
          enableEdgeSmoothing: matParams.enableEdgeSmoothing,
          enableContrastReduction: matParams.enableContrastReduction,
          enableAlphaFalloff: matParams.enableAlphaFalloff,
          enableTintOpacity: matParams.enableTintOpacity,
          edgeBlur: matParams.edgeBlur,
          glassSupersampling: matParams.glassSupersampling,
        },
      });
    });
  });

  cornersFolder.addBinding(matParams, 'cornerRadius', {
    min: 0, max: 200, step: 1,
    label: 'radius',
  }).on('change', (ev: any) => {
    if (matParams.useHtmlRadius) return; // Ignore when using CSS radius
    // Regenerate panels with new corner radius
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      overlay.untrack(el);
      overlay.track(el, {
        cornerRadius: ev.value,
        surfaceShape: matParams.surfaceShape,
        bevelSize: matParams.bevelSize,
        flipX: matParams.flipX,
        flipY: matParams.flipY,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
          noiseScale: matParams.noiseScale,
          noiseIntensity: matParams.noiseIntensity,
          noiseRotation: matParams.noiseRotation,
          noiseThreshold: matParams.noiseThreshold,
          edgeSmoothWidth: matParams.edgeSmoothWidth,
          edgeContrast: matParams.edgeContrast,
          edgeAlphaFalloff: matParams.edgeAlphaFalloff,
          edgeMaskCutoff: matParams.edgeMaskCutoff,
          enableEdgeSmoothing: matParams.enableEdgeSmoothing,
          enableContrastReduction: matParams.enableContrastReduction,
          enableAlphaFalloff: matParams.enableAlphaFalloff,
          enableTintOpacity: matParams.enableTintOpacity,
          edgeBlur: matParams.edgeBlur,
          glassSupersampling: matParams.glassSupersampling,
        },
      });
    });
  });

  // Edges folder
  const edgesFolder = surfaceTab.addFolder({ title: 'Edges', expanded: false });

  edgesFolder.addBinding(matParams, 'glassSupersampling', {
    min: 1, max: 4, step: 1,
    label: 'supersampling',
  }).on('change', (ev: any) => {
    applyToAll({ glassSupersampling: ev.value });
  });

  edgesFolder.addBinding(matParams, 'edgeBlur', {
    min: 0, max: 5, step: 0.1,
    label: 'edge blur',
  }).on('change', (ev: any) => {
    applyToAll({ edgeBlur: ev.value });
  });

  edgesFolder.addBinding(matParams, 'edgeSmoothWidth', {
    min: 0, max: 1, step: 0.01,
    label: 'smooth width',
  }).on('change', (ev: any) => {
    applyToAll({ edgeSmoothWidth: ev.value });
  });

  edgesFolder.addBinding(matParams, 'edgeContrast', {
    min: 0, max: 1, step: 0.01,
    label: 'edge contrast',
  }).on('change', (ev: any) => {
    applyToAll({ edgeContrast: ev.value });
  });

  edgesFolder.addBinding(matParams, 'edgeAlphaFalloff', {
    min: 0, max: 1, step: 0.01,
    label: 'alpha falloff',
  }).on('change', (ev: any) => {
    applyToAll({ edgeAlphaFalloff: ev.value });
  });

  edgesFolder.addBinding(matParams, 'edgeMaskCutoff', {
    min: 0, max: 0.1, step: 0.001,
    label: 'mask cutoff',
  }).on('change', (ev: any) => {
    applyToAll({ edgeMaskCutoff: ev.value });
  });

  edgesFolder.addBinding(matParams, 'enableEdgeSmoothing', {
    label: 'smoothing',
  }).on('change', (ev: any) => {
    applyToAll({ enableEdgeSmoothing: ev.value });
  });

  edgesFolder.addBinding(matParams, 'enableContrastReduction', {
    label: 'contrast',
  }).on('change', (ev: any) => {
    applyToAll({ enableContrastReduction: ev.value });
  });

  edgesFolder.addBinding(matParams, 'enableAlphaFalloff', {
    label: 'alpha falloff',
  }).on('change', (ev: any) => {
    applyToAll({ enableAlphaFalloff: ev.value });
  });


  // Bevel folder
  const bevelFolder = surfaceTab.addFolder({ title: 'Bevel', expanded: false });

  // Cross-section visualization canvas (declare early for use in handlers)
  const crossSectionCanvas = document.createElement('canvas');
  crossSectionCanvas.width = 320;
  crossSectionCanvas.height = 80;
  crossSectionCanvas.style.width = '100%';
  crossSectionCanvas.style.borderRadius = '4px';
  crossSectionCanvas.style.marginTop = '8px';

  // Flip toggles for cross-section (included in matParams for saving)
  const redrawCrossSection = () => drawCrossSection(crossSectionCanvas, matParams.surfaceShape, matParams.bevelSize, matParams.flipX, matParams.flipY);

  // Shape navigation with prev/next
  const shapes: SurfaceShape[] = ['circle', 'squircle', 'concave', 'lip', 'dome', 'ridge', 'wave', 'flat'];
  const shapeLabels: Record<SurfaceShape, string> = {
    circle: 'Circle', squircle: 'Squircle', concave: 'Concave', lip: 'Lip',
    dome: 'Dome', ridge: 'Ridge', wave: 'Wave', flat: 'Flat'
  };

  // Create buttons first
  bevelFolder.addButton({ title: '← Prev' }).on('click', () => {
    const idx = shapes.indexOf(matParams.surfaceShape);
    const newIdx = (idx - 1 + shapes.length) % shapes.length;
    applyShapeChange(shapes[newIdx]);
  });

  const shapeBtn = bevelFolder.addButton({ title: shapeLabels[matParams.surfaceShape] });

  bevelFolder.addButton({ title: 'Next →' }).on('click', () => {
    const idx = shapes.indexOf(matParams.surfaceShape);
    const newIdx = (idx + 1) % shapes.length;
    applyShapeChange(shapes[newIdx]);
  });

  const applyShapeChange = (shape: SurfaceShape) => {
    matParams.surfaceShape = shape;
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      overlay.untrack(el);
      overlay.track(el, {
        cornerRadius: matParams.cornerRadius,
        surfaceShape: shape,
        bevelSize: matParams.bevelSize,
        flipX: matParams.flipX,
        flipY: matParams.flipY,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
          noiseScale: matParams.noiseScale,
          noiseIntensity: matParams.noiseIntensity,
          noiseRotation: matParams.noiseRotation,
          noiseThreshold: matParams.noiseThreshold,
          edgeSmoothWidth: matParams.edgeSmoothWidth,
          edgeContrast: matParams.edgeContrast,
          edgeAlphaFalloff: matParams.edgeAlphaFalloff,
          edgeMaskCutoff: matParams.edgeMaskCutoff,
          enableEdgeSmoothing: matParams.enableEdgeSmoothing,
          enableContrastReduction: matParams.enableContrastReduction,
          enableAlphaFalloff: matParams.enableAlphaFalloff,
          enableTintOpacity: matParams.enableTintOpacity,
          edgeBlur: matParams.edgeBlur,
          glassSupersampling: matParams.glassSupersampling,
        },
      });
    });
    shapeBtn.title = shapeLabels[shape];
    redrawCrossSection();
  };

  // Helper to regenerate panels with current bevel settings
  const applyBevelChange = () => {
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      overlay.untrack(el);
      overlay.track(el, {
        cornerRadius: matParams.cornerRadius,
        surfaceShape: matParams.surfaceShape,
        bevelSize: matParams.bevelSize,
        flipX: matParams.flipX,
        flipY: matParams.flipY,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
          noiseScale: matParams.noiseScale,
          noiseIntensity: matParams.noiseIntensity,
          noiseRotation: matParams.noiseRotation,
          noiseThreshold: matParams.noiseThreshold,
          edgeSmoothWidth: matParams.edgeSmoothWidth,
          edgeContrast: matParams.edgeContrast,
          edgeAlphaFalloff: matParams.edgeAlphaFalloff,
          edgeMaskCutoff: matParams.edgeMaskCutoff,
          enableEdgeSmoothing: matParams.enableEdgeSmoothing,
          enableContrastReduction: matParams.enableContrastReduction,
          enableAlphaFalloff: matParams.enableAlphaFalloff,
          enableTintOpacity: matParams.enableTintOpacity,
          edgeBlur: matParams.edgeBlur,
          glassSupersampling: matParams.glassSupersampling,
        },
      });
    });
    redrawCrossSection();
  };

  // Bevel size
  bevelFolder
    .addBinding(matParams, 'bevelSize', { label: 'size', min: 1, max: 100 })
    .on('change', (ev: any) => {
      loggerInstance.log('ui:bevel', `bevelSize=${ev.value}`);
      applyBevelChange();
    });

  // Flip toggles - these regenerate panels
  bevelFolder.addBinding(matParams, 'flipX', { label: 'flip X' }).on('change', applyBevelChange);
  bevelFolder.addBinding(matParams, 'flipY', { label: 'flip Y' }).on('change', applyBevelChange);

  // Append canvas to folder and do initial draw
  const canvasContainer = document.createElement('div');
  canvasContainer.appendChild(crossSectionCanvas);
  bevelFolder.element.appendChild(canvasContainer);
  redrawCrossSection();

  // Copy console to clipboard button
  pane.addButton({ title: 'Copy Console' }).on('click', () => {
    navigator.clipboard.writeText(loggerInstance.value).then(() => {
      console.log('Console output copied to clipboard');
    });
  });

  // Autosave to localStorage
  const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matParams));
  };

  // Load saved state or use defaults
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (savedState) {
    const saved = JSON.parse(savedState);
    // Remove legacy fields
    delete saved.useBezier;
    delete saved.bezierCurve;
    delete saved.extraBevel;
    Object.assign(matParams, saved);
    pane.refresh();
  }

  // Apply material values after panels are created (always, not just when saved)
  setTimeout(() => {
    // Load saved positions
    const savedPositions = localStorage.getItem(POSITIONS_KEY);
    const positions: Record<string, { left: string; top: string }> = savedPositions ? JSON.parse(savedPositions) : {};

    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      // Restore position if saved
      const id = el.id || el.dataset.panelId;
      if (id && positions[id]) {
        el.style.left = positions[id].left;
        el.style.top = positions[id].top;
      }

      overlay.untrack(el);
      overlay.track(el, {
        cornerRadius: matParams.cornerRadius,
        surfaceShape: matParams.surfaceShape,
        bevelSize: matParams.bevelSize,
        flipX: matParams.flipX,
        flipY: matParams.flipY,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
          noiseScale: matParams.noiseScale,
          noiseIntensity: matParams.noiseIntensity,
          noiseRotation: matParams.noiseRotation,
          noiseThreshold: matParams.noiseThreshold,
          edgeSmoothWidth: matParams.edgeSmoothWidth,
          edgeContrast: matParams.edgeContrast,
          edgeAlphaFalloff: matParams.edgeAlphaFalloff,
          edgeMaskCutoff: matParams.edgeMaskCutoff,
          enableEdgeSmoothing: matParams.enableEdgeSmoothing,
          enableContrastReduction: matParams.enableContrastReduction,
          enableAlphaFalloff: matParams.enableAlphaFalloff,
          enableTintOpacity: matParams.enableTintOpacity,
          edgeBlur: matParams.edgeBlur,
          glassSupersampling: matParams.glassSupersampling,
        },
      });
    });
    redrawCrossSection();
  }, 150);

  // Save on any change
  pane.on('change', saveState);

  // === PROFILES ===
  const profilesFolder = pane.addFolder({ title: 'Profiles', expanded: false });

  // Load profiles from storage
  const loadProfiles = (): Record<string, typeof matParams> => {
    const stored = localStorage.getItem(PROFILES_KEY);
    return stored ? JSON.parse(stored) : {};
  };

  const saveProfiles = (profiles: Record<string, typeof matParams>) => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  };

  // Profile name input
  const profileParams = { name: 'My Profile', selected: '' };

  profilesFolder.addBinding(profileParams, 'name', { label: 'name' });

  // Save profile button
  profilesFolder.addButton({ title: 'Save Profile' }).on('click', () => {
    const profiles = loadProfiles();
    profiles[profileParams.name] = { ...matParams };
    saveProfiles(profiles);
    loggerInstance.log('profile:save', `Saved "${profileParams.name}"`);
    updateProfileList();
  });

  // Profile selector
  let profileBinding: any = null;
  const updateProfileList = () => {
    const profiles = loadProfiles();
    const options: Record<string, string> = { '': '-- Select --' };
    Object.keys(profiles).forEach(name => {
      options[name] = name;
    });

    if (profileBinding) {
      profileBinding.dispose();
    }

    profileBinding = profilesFolder.addBinding(profileParams, 'selected', {
      label: 'load',
      options,
    }).on('change', (ev: any) => {
      if (!ev.value) return;
      const profiles = loadProfiles();
      const profile = profiles[ev.value];
      if (profile) {
        Object.assign(matParams, profile);
        pane.refresh();
        // Apply to all panels
        document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
          overlay.untrack(el);
          overlay.track(el, {
            surfaceShape: matParams.surfaceShape,
            bevelSize: matParams.bevelSize,
            flipX: matParams.flipX,
            flipY: matParams.flipY,
            material: {
              ior: matParams.ior,
              roughness: matParams.roughness,
              dispersion: matParams.dispersion,
              thickness: matParams.thickness,
              opacity: matParams.opacity,
              tint: parseInt(matParams.tint.replace('#', ''), 16),
              specular: matParams.specular,
              shininess: matParams.shininess,
              shadow: matParams.shadow,
              lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
              blurSamples: matParams.blurSamples,
              blurSpread: matParams.blurSpread,
              aberrationR: matParams.aberrationR,
              aberrationB: matParams.aberrationB,
              ao: matParams.ao,
              aoRadius: matParams.aoRadius,
            },
          });
        });
        redrawCrossSection();
        loggerInstance.log('profile:load', `Loaded "${ev.value}"`);
      }
    });
  };
  updateProfileList();

  // Delete profile button
  profilesFolder.addButton({ title: 'Delete Selected' }).on('click', () => {
    if (!profileParams.selected) return;
    const profiles = loadProfiles();
    delete profiles[profileParams.selected];
    saveProfiles(profiles);
    loggerInstance.log('profile:delete', `Deleted "${profileParams.selected}"`);
    profileParams.selected = '';
    updateProfileList();
  });

  // Reset all profiles button
  profilesFolder.addButton({ title: 'Reset All Profiles' }).on('click', () => {
    localStorage.removeItem(PROFILES_KEY);
    profileParams.selected = '';
    updateProfileList();
    loggerInstance.log('profile:reset', 'All profiles cleared');
  });

  // Export button
  profilesFolder.addButton({ title: 'Export to Clipboard' }).on('click', () => {
    const exportData = {
      current: matParams,
      profiles: loadProfiles(),
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    loggerInstance.log('profile:export', 'Exported to clipboard');
  });

  // Import button
  profilesFolder.addButton({ title: 'Import from Clipboard' }).on('click', async () => {
    const text = await navigator.clipboard.readText();
    const importData = JSON.parse(text);
    if (importData.current) {
      Object.assign(matParams, importData.current);
      pane.refresh();
    }
    if (importData.profiles) {
      const existing = loadProfiles();
      saveProfiles({ ...existing, ...importData.profiles });
      updateProfileList();
    }
    // Apply to all panels
    document.querySelectorAll<HTMLElement>('.draggable-item').forEach((el) => {
      overlay.untrack(el);
      overlay.track(el, {
        surfaceShape: matParams.surfaceShape,
        bevelSize: matParams.bevelSize,
        flipX: matParams.flipX,
        flipY: matParams.flipY,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
        },
      });
    });
    redrawCrossSection();
    loggerInstance.log('profile:import', 'Imported from clipboard');
  });

  // === BORDER RADIUS (per panel) ===
  const borderRadiusFolder = pane.addFolder({ title: 'Border Radius', expanded: false });

  const panels = [
    { id: 'panel-alpha', label: 'Alpha' },
    { id: 'panel-beta', label: 'Beta' },
    { id: 'panel-gamma', label: 'Gamma' },
    { id: 'panel-crystal', label: 'Crystal' },
  ];

  // Load saved radius values
  const savedRadius = localStorage.getItem(RADIUS_KEY);
  const radiusParams: Record<string, number> = savedRadius ? JSON.parse(savedRadius) : {};

  const saveRadiusState = () => {
    localStorage.setItem(RADIUS_KEY, JSON.stringify(radiusParams));
  };

  panels.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Use saved value or current computed value
    if (radiusParams[id] === undefined) {
      const computed = getComputedStyle(el);
      radiusParams[id] = parseInt(computed.borderRadius) || 0;
    }

    // Apply saved radius to element
    el.style.borderRadius = `${radiusParams[id]}px`;

    borderRadiusFolder.addBinding(radiusParams, id, {
      label,
      min: 0,
      max: 200,
      step: 1,
    }).on('change', (ev: any) => {
      el.style.borderRadius = `${ev.value}px`;
      saveRadiusState();
      overlay.untrack(el);
      overlay.track(el, {
        surfaceShape: matParams.surfaceShape,
        bevelSize: matParams.bevelSize,
        flipX: matParams.flipX,
        flipY: matParams.flipY,
        material: {
          ior: matParams.ior,
          roughness: matParams.roughness,
          dispersion: matParams.dispersion,
          thickness: matParams.thickness,
          opacity: matParams.opacity,
          tint: parseInt(matParams.tint.replace('#', ''), 16),
          specular: matParams.specular,
          shininess: matParams.shininess,
          shadow: matParams.shadow,
          lightDir: [matParams.lightX, matParams.lightY, matParams.lightZ] as [number, number, number],
          blurSamples: matParams.blurSamples,
          blurSpread: matParams.blurSpread,
          blurAngle: matParams.blurAngle,
          blurAnisotropy: matParams.blurAnisotropy,
          blurGamma: matParams.blurGamma,
          aberrationR: matParams.aberrationR,
          aberrationB: matParams.aberrationB,
          ao: matParams.ao,
          aoRadius: matParams.aoRadius,
        },
      });
    });
  });
}
