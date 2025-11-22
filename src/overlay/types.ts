import type { Container, Texture } from 'pixi.js';
import type { GlassPanel } from '../panels/GlassPanel.js';
import type { GlassMaterial, SurfaceShape } from '../core/types.js';

export interface PositionTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export type PositionTransformFn = (
  x: number,
  y: number,
  width: number,
  height: number,
) => PositionTransform;

export interface LightFollowParams {
  followCursor: boolean;
  smoothing?: number; // 0 - 1, amount of smoothing (0 = instant, 1 = very slow, default 0.9)
  delay?: number; // 0 - 1, lag before movement starts (0 = instant, 1 = max lag, default 0.5)
  curve?: number; // 0.5 - 3, z falloff curve (default 1.5)
  zMin?: number; // minimum z value (default 0.05)
  zMax?: number; // maximum z value (default 0.20)
  edgeStretch?: number; // 0.1 - 2, how much to stretch toward edges (< 1 = more edge, > 1 = more center, default 0.5)
}

export interface GlassOverlayOptions {
  /**
   * The container holding the background content that should be seen through the glass.
   * This will be rendered into the glass system's backdrop texture.
   */
  background: Container;

  /**
   * The container where the glass composite effect should be added.
   * Typically the same stage, or a layer above the background.
   */
  stage: Container;

  /**
   * Optional initial configuration for the GlassSystem.
   */
  systemOptions?: {
    hudEnabled?: boolean;
  };

  /**
   * Optional light follow cursor settings.
   */
  lightFollowParams?: LightFollowParams;
}

export interface GlassItemConfig {
  /**
   * Custom material overrides for this element.
   */
  material?: Partial<GlassMaterial>;

  /**
   * Optional custom normal map. If not provided, a default rounded rect map is generated.
   */
  normalMap?: Texture;

  /**
   * Corner radius for the default normal map generation. Defaults to 20.
   */
  cornerRadius?: number;

  /**
   * Surface shape for the glass bevel. Defaults to 'squircle'.
   * - circle: Simple circular arc (sharper edges)
   * - squircle: Softer flat->curve transition (smoother, default)
   * - concave: Bowl-like depression (light diverges outward)
   * - lip: Raised rim with shallow center dip
   */
  surfaceShape?: SurfaceShape;

  /**
   * How far the bevel extends from the edge toward center (in pixels).
   * Defaults to 12.
   */
  bevelSize?: number;

  /**
   * Invert the normals (makes convex appear concave). Defaults to false.
   */
  invertNormals?: boolean;

  /**
   * Render as a circle. Sets corner radius to half the minimum dimension.
   * Can also be triggered by adding 'glass-circle' class or data-glass-circle attribute.
   */
  isCircle?: boolean;

  /**
   * Use displacement map instead of normal map for the bevel effect.
   * Displacement maps use grayscale height values instead of RGB normals.
   */
  useDisplacementMap?: boolean;
}

export interface TrackedItem {
  panel: GlassPanel;
  config: GlassItemConfig;
  lastRect?: DOMRect;
  lastRadius: number;
  visible: boolean;
  isCircle: boolean;
  polling: boolean;
}
