# Pixi Adaptive Glass

[![npm version](https://img.shields.io/npm/v/pixi-adaptive-glass.svg?style=flat-square)](https://www.npmjs.com/package/pixi-adaptive-glass)
[![License](https://img.shields.io/npm/l/pixi-adaptive-glass.svg?style=flat-square)](https://github.com/doublej/pixi-adaptive-glass/blob/main/LICENSE)

A high-performance, adaptive glass effect plugin for [PixiJS](https://pixijs.com/). It simulates realistic refraction, chromatic aberration, and other optical properties, scaling quality automatically based on device performance.

## Features

*   **Real-time Refraction:** Simulates light bending through glass surfaces.
*   **Chromatic Aberration (Dispersion):** Splits light into RGB components at the edges for a realistic crystal look.
*   **Adaptive Quality:** Automatically degrades quality (resolution, blur steps) on lower-end devices to maintain framerate.
*   **WebGL 2 Support:** Leverages WebGL 2 features for performance, falling back gracefully to WebGL 1 where necessary.
*   **Easy Integration:** Drop-in overlay system that can automatically track DOM elements or Pixi objects.
*   **Customizable:** Tweak IOR (Index of Refraction), roughness, thickness, tint, and more.

## Installation

```bash
npm install pixi-adaptive-glass
```

**Peer Dependencies:**
- `pixi.js` >= 8.0.0 (required)
- `tweakpane` >= 4.0.0 (optional, for GlassHUD debug controls)

## Usage

### Basic Setup

```typescript
import { Application, Container, Sprite, Texture } from 'pixi.js';
import { GlassOverlay, GlassPresets } from 'pixi-adaptive-glass';

const app = new Application();
await app.init({ resizeTo: window });
document.body.appendChild(app.canvas);

// 1. Create a background container (content to be refracted)
const background = new Container();
app.stage.addChild(background);

// Add some sprites to the background...
const bgSprite = Sprite.from('path/to/image.jpg');
background.addChild(bgSprite);

// 2. Initialize the Glass Overlay
const glass = new GlassOverlay({
  app: app,                 // Pass your PixiJS Application
  background: background,   // The container to "see through"
  classes: ['.glass-panel'], // CSS selector to automatically turn into glass
  
  // Optional: Coordinate mapping
  // offset: { x: 0, y: 0 }, // Adjust if canvas is not at (0,0)
  // scale: 1.0              // Adjust if canvas coord system is scaled (e.g. high-DPI or CSS zoom)
});

// 3. Create HTML elements with the specified class
// <div class="glass-panel">Hello Glass!</div>
```

### Manual Tracking

If you want to create glass panels programmatically without relying on DOM auto-mounting:

```typescript
const myElement = document.getElementById('my-custom-element');

// Track specific element
const panel = glass.track(myElement, {
  material: GlassPresets.water(), // Use a preset
  cornerRadius: 20
});

// Update material properties later
panel.setMaterial({
  ior: 1.5,
  roughness: 0.2,
  tint: 0x00ff00
});
```

### Material Properties

The `GlassMaterial` interface controls the optical properties:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ior` | `number` | `1.52` | Index of Refraction (1.0 = air, 1.33 = water, 1.5 = glass, 2.4 = diamond). |
| `roughness` | `number` | `0.0` | Surface roughness (0 = polished, 1 = frosted/blurry). |
| `dispersion` | `number` | `0.0` | Chromatic aberration intensity (separation of RGB channels). |
| `thickness` | `number` | `0.1` | Simulated glass thickness, affecting refraction magnitude. |
| `opacity` | `number` | `1.0` | Overall transparency of the glass panel. |
| `tint` | `number` | `0xffffff` | Hex color tint applied to the glass. |

### Presets

`GlassPresets` provides quick starting points:

*   `GlassPresets.clear()` - Standard clear glass.
*   `GlassPresets.water()` - High distortion, water-like properties.
*   `GlassPresets.crownGlass()` - Crown glass with moderate dispersion.
*   `GlassPresets.acrylic()` - Acrylic glass with low dispersion.
*   `GlassPresets.fromIOR(ior)` - Create a preset from a specific Index of Refraction value.

## Advanced API

For more control, you can use the lower-level components:

```typescript
import {
  GlassSystem,           // Core rendering system
  GlassPanel,            // Individual glass panel
  GlassHUD,              // Debug controls (requires tweakpane)
  EventBus,              // Event system
  CapabilityProbe,       // WebGL capability detection
  AdaptiveQualityController, // Performance-based quality scaling
  SceneRTManager         // Render target management
} from 'pixi-adaptive-glass';
```

### Debug HUD

To use the debug controls, install tweakpane:

```bash
npm install tweakpane @tweakpane/core
```

```typescript
import { GlassHUD } from 'pixi-adaptive-glass';

const hud = new GlassHUD(glassSystem);
```

## Running the Demo

Clone the repository and run:

```bash
npm install
npm run dev
```

This will start a local development server with an interactive demo where you can drag glass panels and tweak properties in real-time.

## License

MIT