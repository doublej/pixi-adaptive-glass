# Cleanup Plan: pixi-adaptive-glass

## Phase 1: Remove Dead Code & Fix Violations

### Files to Delete
- `src/core/Telemetry.ts` - exported but never imported
- `package 2.json` - duplicate file
- `DEBUG_STATUS.md` - internal artifact
- `tsconfig.tsbuildinfo` - should be gitignored

### Code to Remove
| Location | Item | Reason |
|----------|------|--------|
| `WebGL2Pipeline.ts:166-172` | try-catch block | Violates CLAUDE.md rules |
| `AdaptiveQualityController.ts:14` | `lastDecision` property | Assigned but never read |
| `GlassSystem.ts:30` | `lastDecision` property | Assigned but never read |
| `GlassSystem.ts:34` | `options` parameter storage | Stored but never used |
| `WebGL2Pipeline.ts:309` | `isReveal` parameter | Unused in function body |
| `WebGL2Pipeline.ts:171` | `debugLog()` call | Import missing, function undefined |
| `WebGL2Pipeline.ts:182` | `scale` parameter | Unused in `ensureAccumTargets` |

---

## Phase 2: Compact & Simplify Code

### AdaptiveQualityController.evaluate() (25 → 10 lines)
Replace if-chain with degradation steps array:
```typescript
private readonly degradationSteps = [
  { check: (q) => q.renderScale > 0.85, apply: (q) => q.renderScale = 0.85, action: 'scale-rt-0-85' },
  { check: (q) => q.renderScale > 0.7, apply: (q) => q.renderScale = 0.7, action: 'scale-rt-0-7' },
  // ...
];
```

### WebGL2Pipeline.renderPanel() (68 → 40 lines)
- Extract uniform updates to `updatePanelUniforms(panel, uniforms)`
- Extract reveal shader updates to `updateRevealUniforms(panel, uniforms)`

### WebGL2Pipeline.clearTarget() (5 → 1 line)
```typescript
// Before
private clearTarget(target, r, g, b, a) {
  if (!target) return;
  const dummy = new Container();
  this.renderer.render({ container: dummy, target, clear: true, clearColor: [r, g, b, a] });
}

// After - use direct clear or inline
```

### GlassOverlay.autoMount() (39 → 25 lines)
Extract mutation processing:
```typescript
private processAddedNode(node: Node, selector: string): void
private processRemovedNode(node: Node): void
```

### createRoundedRectNormalMap() (104 → 60 lines)
Extract shared logic:
```typescript
function calculateEdgeNormal(dist, radius, bevel, shape, flipX, flipY, dirX, dirY): { nx, ny, alpha }
```

---

## Phase 3: Extract Shared Code

### Create `src/utils/index.ts`
```typescript
export const QUAD_GEOMETRY = new MeshGeometry({
  positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
});

export function hexToVec3(hex: number): [number, number, number] {
  return [
    ((hex >> 16) & 0xff) / 255,
    ((hex >> 8) & 0xff) / 255,
    (hex & 0xff) / 255,
  ];
}
```

### Create `src/utils/normalMap.ts`
Move from GlassOverlay.ts:
- `createRoundedRectNormalMap()`
- `getHeightAndDerivative()`
- All height functions

---

## Phase 4: Remove Overengineering

### EventBus (consider inlining)
Only used for 2 events. Could be simplified to:
```typescript
private qualityListeners: ((d: AdaptiveDecision) => void)[] = [];
private fallbackListeners: ((e: FallbackEvent) => void)[] = [];
```

### GlassSystemEvents interface
Remove index signature hack:
```typescript
// Before
interface GlassSystemEvents {
  'quality:decision': AdaptiveDecision;
  fallback: FallbackEvent;
  [key: string]: any; // Remove this
}
```

### GlassHUD
Check if exported but never used externally - consider removing from public API.

---

## Phase 5: Improve Types

### Remove `as any` casts in WebGL2Pipeline
Locations requiring proper types:
- Line 145-147: `compositeShader.resources`
- Line 224, 231: `refractShader.resources`
- Line 259, 262: `panel.shader`
- Line 264, 268: `revealageShader.resources`
- Line 311: `renderer.gl`

### Add missing import
```typescript
import type { RenderQualityOptions } from '../core/types.js';
```

### Create proper shader resource types
```typescript
interface ShaderResources {
  uSceneColor: TextureSource;
  uNormalMap: TextureSource;
  panelUniforms: UniformGroup;
}
```

---

## Phase 6: Clean Project Files

### Add LICENSE file
```
MIT License

Copyright (c) 2024 [Author]

Permission is hereby granted...
```

### Update package.json
```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/[user]/pixi-adaptive-glass.git"
  },
  "author": "[Name] <email>",
  "license": "MIT",
  "keywords": ["pixi", "pixijs", "glass", "effect", "webgl", "refraction"],
  "bugs": {
    "url": "https://github.com/[user]/pixi-adaptive-glass/issues"
  },
  "homepage": "https://github.com/[user]/pixi-adaptive-glass#readme",
  "sideEffects": false,
  "engines": {
    "node": ">=18"
  }
}
```

### Update .gitignore
Add:
```
dist/
*.tsbuildinfo
```

---

## Phase 7: Verification

```bash
npm run lint
npm test
npm run build
npm pack --dry-run
```

Verify:
- All exports work correctly
- No TypeScript errors
- Tests pass
- Package contents are correct

---

## Expected Results

### Line Count Reduction
| File | Before | After | Saved |
|------|--------|-------|-------|
| GlassOverlay.ts | 425 | ~280 | 145 |
| WebGL2Pipeline.ts | 352 | ~250 | 102 |
| AdaptiveQualityController.ts | 78 | ~55 | 23 |
| **Total** | | | **~270 lines** |

### Files Removed
- `src/core/Telemetry.ts` (41 lines)
- `package 2.json`
- `DEBUG_STATUS.md`
- `tsconfig.tsbuildinfo`

### New Files
- `src/utils/index.ts` (~15 lines)
- `src/utils/normalMap.ts` (~120 lines, moved)
- `LICENSE`

### Quality Improvements
- Zero `as any` casts
- No try-catch blocks
- All functions ≤20 lines
- All files ≤200 lines
- No dead code
- Proper TypeScript types
