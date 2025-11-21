import { Container, Texture } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { GlassSystem } from './system/GlassSystem.js';
import { GlassPresets } from './materials/GlassPresets.js';
import type { GlassPanel } from './panels/GlassPanel.js';
import type { GlassMaterial, SurfaceShape } from './core/types.js';

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
  smoothing?: number; // 0.01 - 1, lerp factor (default 0.03 for aggressive delay)
  curve?: number; // 0.5 - 3, z falloff curve (default 1.5)
  zMin?: number; // minimum z value (default 0.05)
  zMax?: number; // maximum z value (default 0.20)
  edgeBias?: number; // 0.1 - 1, power curve to bias away from center (default 0.5)
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
   * - squircle: Softer flat→curve transition (smoother, default)
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
   * Flip the normal map on X axis. Defaults to false.
   */
  flipX?: boolean;

  /**
   * Flip the normal map on Y axis. Defaults to false.
   */
  flipY?: boolean;

  /**
   * Bezier curve control points for custom bevel shape [x1, y1, x2, y2].
   * When provided, overrides surfaceShape.
   */
  bezierCurve?: [number, number, number, number];

  /**
   * Render as a circle. Sets corner radius to half the minimum dimension.
   * Can also be triggered by adding 'glass-circle' class or data-glass-circle attribute.
   */
  isCircle?: boolean;
}

/**
 * A high-level wrapper for GlassSystem that synchronizes GlassPanels with DOM elements.
 * Ideal for adding glass effects to existing UI overlays in Nuxt/Vue/React projects.
 */
interface TrackedItem {
  panel: GlassPanel;
  config: GlassItemConfig;
  lastRect?: DOMRect;
  lastRadius: number;
  visible: boolean;
  isCircle: boolean;
  polling: boolean;
}

export class GlassOverlay {
  public readonly system: GlassSystem;
  private readonly tracked = new Map<HTMLElement, TrackedItem>();
  private readonly background: Container;
  private observer?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private positionTransform?: PositionTransformFn;

  // Light follow cursor
  private lightFollowParams?: LightFollowParams;
  private currentLightDir: [number, number, number] = [0, 0, 0.15];
  private targetLightDir: [number, number, number] = [0, 0, 0.15];
  private boundMouseMove?: (e: MouseEvent) => void;

  private renderer: Renderer;

  constructor(renderer: Renderer, options: GlassOverlayOptions) {
    this.renderer = renderer;
    this.background = options.background;
    this.system = new GlassSystem(renderer, options.systemOptions);

    this.system.setOpaqueSceneCallback((target) => {
      renderer.render({ container: this.background, target, clear: true });
    });

    const composite = this.system.getCompositeDisplay();
    if (composite) {
      options.stage.addChild(composite);
    }

    // Set up light follow cursor
    if (options.lightFollowParams) {
      this.setLightFollowParams(options.lightFollowParams);
    }
  }

  setLightFollowParams(params: LightFollowParams): void {
    this.lightFollowParams = params;

    if (params.followCursor && !this.boundMouseMove) {
      this.boundMouseMove = (e: MouseEvent) => {
        const curve = params.curve ?? 1.5;
        const zMin = params.zMin ?? 0.05;
        const zMax = params.zMax ?? 0.20;
        const edgeBias = params.edgeBias ?? 0.5;

        // Get canvas bounds for proper coordinate mapping
        const canvas = this.renderer.canvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        // Convert cursor position to -1 to 1 range relative to canvas
        let x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        let y = ((e.clientY - rect.top) / rect.height) * 2 - 1; // Y: top=-1, bottom=1

        // Apply edge bias - power curve pushes values away from center
        // edgeBias < 1 biases toward edges, > 1 biases toward center
        x = Math.sign(x) * Math.pow(Math.abs(x), edgeBias);
        y = Math.sign(y) * Math.pow(Math.abs(y), edgeBias);

        // Z decreases toward edges based on curve, capped at zMax (0.20)
        const dist = Math.sqrt(x * x + y * y);
        const z = Math.max(zMin, Math.min(zMax, zMax - Math.pow(dist, curve) * zMax * 0.5));

        this.targetLightDir = [x, y, z];
      };
      window.addEventListener('mousemove', this.boundMouseMove);
    } else if (!params.followCursor && this.boundMouseMove) {
      window.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = undefined;
    }
  }

  autoMount(selector: string = '.glass-panel'): void {
    // Set up ResizeObserver for size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const item = this.tracked.get(element);
        if (!item) continue;

        const rect = element.getBoundingClientRect();
        const lastRect = item.lastRect;

        // Check if size changed significantly (more than 1px)
        if (lastRect && (
          Math.abs(rect.width - lastRect.width) > 1 ||
          Math.abs(rect.height - lastRect.height) > 1
        )) {
          this.updatePanelGeometry(element, item);
        }
        item.lastRect = rect;
      }
    });

    // Set up IntersectionObserver for visibility
    this.intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        const item = this.tracked.get(element);
        if (!item) continue;

        item.visible = entry.isIntersecting;
        const cssVisible = this.isCssVisible(element);
        item.panel.visible = item.visible && cssVisible;
      }
    });

    const existing = document.querySelectorAll<HTMLElement>(selector);
    existing.forEach((el) => this.track(el));

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.matches(selector)) {
              this.track(node);
            }
            if (node instanceof HTMLElement) {
              const children = node.querySelectorAll<HTMLElement>(selector);
              children.forEach((child) => this.track(child));
            }
          });
          mutation.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement && this.tracked.has(node)) {
              this.untrack(node);
            }
          });
        } else if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (mutation.attributeName === 'class') {
            if (target.matches(selector)) {
              this.track(target);
            } else {
              this.untrack(target);
            }
          } else if (mutation.attributeName === 'style') {
            const item = this.tracked.get(target);
            if (item) {
              // Check for visibility changes
              const cssVisible = this.isCssVisible(target);
              item.panel.visible = cssVisible && item.visible;

              // Check for border-radius changes
              const rect = target.getBoundingClientRect();
              const newRadius = this.parseBorderRadius(target, rect);
              if (Math.abs(newRadius - item.lastRadius) > 0.5) {
                this.updatePanelGeometry(target, item);
              }
            }
          } else if (mutation.attributeName === 'hidden') {
            const item = this.tracked.get(target);
            if (item) {
              const cssVisible = this.isCssVisible(target);
              item.panel.visible = cssVisible && item.visible;
            }
          }
        }
      }
      this.cleanup();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden'],
    });
  }

  track(element: HTMLElement, config: GlassItemConfig = {}): GlassPanel {
    if (this.tracked.has(element)) {
      return this.tracked.get(element)!.panel;
    }

    const dataIor = element.dataset.glassIor ? parseFloat(element.dataset.glassIor) : undefined;
    const dataRoughness = element.dataset.glassRoughness
      ? parseFloat(element.dataset.glassRoughness)
      : undefined;

    const material = {
      ...GlassPresets.clear(),
      ...config.material,
    };

    if (dataIor !== undefined) material.ior = dataIor;
    if (dataRoughness !== undefined) material.roughness = dataRoughness;

    // Calculate dynamic normal map based on initial size
    const rect = element.getBoundingClientRect();

    // Detect circle mode from config, class, or data attribute
    const isCircle = config.isCircle ||
                     element.classList.contains('glass-circle') ||
                     element.hasAttribute('data-glass-circle');

    let radius: number;
    if (isCircle) {
      // Circle: radius = half the smaller dimension
      radius = Math.min(rect.width, rect.height) / 2;
    } else {
      const cssRadius = this.parseBorderRadius(element, rect);
      radius = config.cornerRadius ?? cssRadius; // Config overrides CSS
    }
    const bevel = config.bevelSize ?? 12;

    const shape = config.surfaceShape ?? 'squircle';
    const flipX = config.flipX ?? false;
    const flipY = config.flipY ?? false;
    const bezierCurve = config.bezierCurve;

    // For circles, use square dimensions
    const circleSize = Math.floor(Math.min(rect.width, rect.height));
    const mapWidth = isCircle ? circleSize : rect.width;
    const mapHeight = isCircle ? circleSize : rect.height;

    const normalMap =
      config.normalMap || createRoundedRectNormalMap(mapWidth, mapHeight, radius, bevel, shape, flipX, flipY, bezierCurve);

    const panel = this.system.createPanel({
      material,
      normalMap,
    });

    this.tracked.set(element, { panel, config, lastRect: rect, lastRadius: radius, visible: true, isCircle, polling: false });

    // Set up observers for this element
    this.resizeObserver?.observe(element);
    this.intersectionObserver?.observe(element);

    // Set up animation/transition listeners
    element.addEventListener('transitionrun', this.handleAnimationStart);
    element.addEventListener('transitionend', this.handleAnimationEnd);
    element.addEventListener('transitioncancel', this.handleAnimationEnd);
    element.addEventListener('animationstart', this.handleAnimationStart);
    element.addEventListener('animationend', this.handleAnimationEnd);
    element.addEventListener('animationcancel', this.handleAnimationEnd);

    this.syncElement(element, panel);

    return panel;
  }

  private handleAnimationStart = (e: Event) => {
    const element = e.currentTarget as HTMLElement;
    this.startPolling(element);
  };

  private handleAnimationEnd = (e: Event) => {
    const element = e.currentTarget as HTMLElement;
    // Check if any animations are still running
    const animations = element.getAnimations();
    if (animations.length === 0) {
      this.stopPolling(element);
    }
  };

  private startPolling(element: HTMLElement): void {
    const item = this.tracked.get(element);
    if (!item || item.polling) return;

    item.polling = true;
    const poll = () => {
      if (!item.polling) return;
      this.syncElement(element, item.panel);
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }

  private stopPolling(element: HTMLElement): void {
    const item = this.tracked.get(element);
    if (!item) return;

    item.polling = false;
    this.updatePanelGeometry(element, item);
  }

  untrack(element: HTMLElement): void {
    const item = this.tracked.get(element);
    if (item) {
      item.polling = false;
      this.resizeObserver?.unobserve(element);
      this.intersectionObserver?.unobserve(element);
      element.removeEventListener('transitionrun', this.handleAnimationStart);
      element.removeEventListener('transitionend', this.handleAnimationEnd);
      element.removeEventListener('transitioncancel', this.handleAnimationEnd);
      element.removeEventListener('animationstart', this.handleAnimationStart);
      element.removeEventListener('animationend', this.handleAnimationEnd);
      element.removeEventListener('animationcancel', this.handleAnimationEnd);
      this.system.removePanel(item.panel);
      this.tracked.delete(element);
    }
  }

  update(): void {
    // Update light direction with aggressive smoothing/delay
    if (this.lightFollowParams?.followCursor) {
      const smoothing = this.lightFollowParams.smoothing ?? 0.03;
      this.currentLightDir[0] += (this.targetLightDir[0] - this.currentLightDir[0]) * smoothing;
      this.currentLightDir[1] += (this.targetLightDir[1] - this.currentLightDir[1]) * smoothing;
      this.currentLightDir[2] += (this.targetLightDir[2] - this.currentLightDir[2]) * smoothing;

      // Apply to all panels
      for (const [, item] of this.tracked) {
        item.panel.glassMaterial.lightDir = [...this.currentLightDir];
      }
    }

    for (const [element, item] of this.tracked) {
      this.syncElement(element, item.panel);
    }
    this.system.render();
  }

  resize(): void {
    this.update();
  }

  setPositionTransform(transform: PositionTransformFn | undefined): void {
    this.positionTransform = transform;
  }

  cleanup(): void {
    for (const [element] of this.tracked) {
      if (!document.body.contains(element)) {
        this.untrack(element);
      }
    }
  }

  destroy(): void {
    if (this.boundMouseMove) {
      window.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = undefined;
    }
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.system.destroy();
    this.tracked.clear();
  }

  private syncElement(element: HTMLElement, panel: GlassPanel) {
    const item = this.tracked.get(element);
    const rect = element.getBoundingClientRect();

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // For circles, use the smaller dimension for both width and height
    let width = rect.width;
    let height = rect.height;
    if (item?.isCircle) {
      const size = Math.floor(Math.min(rect.width, rect.height));
      width = size;
      height = size;
    }

    if (this.positionTransform) {
      const t = this.positionTransform(x, y, width, height);
      panel.position.set(t.x, t.y);
      panel.scale.set(width * t.scaleX, height * t.scaleY);
      panel.rotation = t.rotation;
    } else {
      panel.position.set(x, y);
      panel.scale.set(width, height);
      panel.rotation = 0;
    }
  }

  private parseBorderRadius(element: HTMLElement, rect: DOMRect): number {
    const style = window.getComputedStyle(element);

    // Get all four corner radii (computed style always returns individual values)
    const topLeft = style.borderTopLeftRadius;
    const topRight = style.borderTopRightRadius;
    const bottomRight = style.borderBottomRightRadius;
    const bottomLeft = style.borderBottomLeftRadius;

    // Parse a single radius value (handles px and %)
    const parseValue = (value: string, dimension: number): number => {
      if (value.endsWith('%')) {
        return (parseFloat(value) / 100) * dimension;
      }
      return parseFloat(value) || 0;
    };

    // For elliptical corners (e.g., "10px 20px"), use the first value (horizontal)
    const getFirstValue = (radius: string): string => {
      return radius.split(' ')[0];
    };

    // Use average of width/height for percentage calculations
    const avgDimension = (rect.width + rect.height) / 2;

    // Parse all corners and return the average
    const radii = [
      parseValue(getFirstValue(topLeft), avgDimension),
      parseValue(getFirstValue(topRight), avgDimension),
      parseValue(getFirstValue(bottomRight), avgDimension),
      parseValue(getFirstValue(bottomLeft), avgDimension),
    ];

    // Return average radius, or use the most common value
    const avg = radii.reduce((a, b) => a + b, 0) / 4;
    return avg || 20; // Default to 20 if parsing fails
  }

  private isCssVisible(element: HTMLElement): boolean {
    if (element.hidden) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden';
  }

  private updatePanelGeometry(element: HTMLElement, item: TrackedItem): void {
    const rect = element.getBoundingClientRect();

    // Detect circle mode
    const isCircle = item.config.isCircle ||
                     element.classList.contains('glass-circle') ||
                     element.hasAttribute('data-glass-circle');

    let radius: number;
    if (isCircle) {
      radius = Math.min(rect.width, rect.height) / 2;
    } else {
      const cssRadius = this.parseBorderRadius(element, rect);
      radius = item.config.cornerRadius ?? cssRadius;
    }
    const bevel = item.config.bevelSize ?? 12;
    const shape = item.config.surfaceShape ?? 'squircle';
    const flipX = item.config.flipX ?? false;
    const flipY = item.config.flipY ?? false;
    const bezierCurve = item.config.bezierCurve;

    // For circles, use square dimensions
    const circleSize = Math.floor(Math.min(rect.width, rect.height));
    const mapWidth = isCircle ? circleSize : rect.width;
    const mapHeight = isCircle ? circleSize : rect.height;

    // Regenerate normal map with new dimensions/radius
    const normalMap = createRoundedRectNormalMap(
      mapWidth, mapHeight, radius, bevel, shape, flipX, flipY, bezierCurve
    );

    // Update the panel's normal map
    item.panel.setTextures({ normalMap });
    item.lastRect = rect;
    item.lastRadius = radius;
  }
}

// Height functions for different surface shapes
// t is normalized distance from inner edge (0) to outer edge (1)
export function heightCircle(t: number): number {
  return Math.sqrt(Math.max(0, 2 * t - t * t));
}

function heightCircleDerivative(t: number): number {
  const h = Math.sqrt(Math.max(0.0001, 2 * t - t * t));
  return (1 - t) / h;
}

export function heightSquircle(t: number): number {
  const inner = 1 - Math.pow(1 - t, 4);
  return Math.pow(Math.max(0, inner), 0.25);
}

function heightSquircleDerivative(t: number): number {
  const inner = 1 - Math.pow(1 - t, 4);
  if (inner <= 0.0001) return 0;
  return Math.pow(1 - t, 3) / Math.pow(inner, 0.75);
}

export function smootherstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function smootherstepDerivative(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 30 * x * x * (x - 1) * (x - 1);
}

// Cubic bezier evaluation
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function cubicBezierDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

export function getBezierHeightAndDerivative(
  t: number,
  curve: [number, number, number, number],
): { height: number; derivative: number } {
  // curve = [x1, y1, x2, y2] control points for cubic bezier from (0,0) to (1,1)
  const height = cubicBezier(t, 0, curve[1], curve[3], 1);
  const derivative = cubicBezierDerivative(t, 0, curve[1], curve[3], 1);
  return { height, derivative };
}

export function getHeightAndDerivative(
  t: number,
  shape: SurfaceShape,
  bezierCurve?: [number, number, number, number],
): { height: number; derivative: number } {
  // Use bezier curve if provided
  if (bezierCurve) {
    return getBezierHeightAndDerivative(t, bezierCurve);
  }
  switch (shape) {
    case 'circle': {
      return { height: heightCircle(t), derivative: heightCircleDerivative(t) };
    }
    case 'squircle': {
      return { height: heightSquircle(t), derivative: heightSquircleDerivative(t) };
    }
    case 'concave': {
      const h = heightSquircle(t);
      const d = heightSquircleDerivative(t);
      return { height: 1 - h, derivative: -d };
    }
    case 'lip': {
      const convexH = heightSquircle(t);
      const convexD = heightSquircleDerivative(t);
      const concaveH = 1 - convexH;
      const concaveD = -convexD;
      const blend = smootherstep(t);
      const blendD = smootherstepDerivative(t);
      const height = convexH * (1 - blend) + concaveH * blend;
      const derivative = convexD * (1 - blend) + concaveD * blend + (concaveH - convexH) * blendD;
      return { height, derivative };
    }
    case 'dome': {
      // Full hemisphere - height goes from 0 at edge to 1 at center
      const h = Math.sqrt(Math.max(0, 1 - t * t));
      const d = t > 0.001 ? -t / h : 0;
      return { height: h, derivative: d };
    }
    case 'ridge': {
      // Sharp peak - inverse of dome
      const h = 1 - Math.sqrt(Math.max(0, 1 - t * t));
      const d = t > 0.001 ? t / Math.sqrt(Math.max(0.001, 1 - t * t)) : 0;
      return { height: h, derivative: d };
    }
    case 'wave': {
      // Sinusoidal wave
      const h = (1 - Math.cos(t * Math.PI)) / 2;
      const d = (Math.PI * Math.sin(t * Math.PI)) / 2;
      return { height: h, derivative: d };
    }
    case 'flat': {
      // No bevel, completely flat
      return { height: 0, derivative: 0 };
    }
  }
}

function createRoundedRectNormalMap(
  width: number,
  height: number,
  radius: number,
  bevel: number,
  shape: SurfaceShape,
  flipX: boolean = false,
  flipY: boolean = false,
  bezierCurve?: [number, number, number, number],
): Texture {
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  const data = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let nx = 0;
      let ny = 0;
      let nz = 1;
      let alpha = 255;

      // Use pixel centers for proper symmetry (pixels go 0 to w-1)
      const cx = (w - 1) / 2;
      const cy = (h - 1) / 2;
      const relX = Math.abs(x - cx);
      const relY = Math.abs(y - cy);

      const innerW = w / 2 - radius;
      const innerH = h / 2 - radius;

      // Calculate distance to boundary and direction to boundary
      let distToBoundary = 0;
      let dirX = 0;
      let dirY = 0;

      // Find closest point on rounded rect boundary
      let closestX = relX;
      let closestY = relY;

      if (relX <= innerW && relY <= innerH) {
        // Inside flat center - closest point is on nearest edge
        const toEdgeX = innerW + radius;
        const toEdgeY = innerH + radius;
        if (toEdgeX - relX < toEdgeY - relY) {
          closestX = innerW + radius;
          closestY = relY;
        } else {
          closestX = relX;
          closestY = innerH + radius;
        }
        distToBoundary = Math.min(toEdgeX - relX, toEdgeY - relY);
      } else if (relX > innerW && relY <= innerH) {
        // Edge region (right/left)
        closestX = innerW + radius;
        closestY = relY;
        distToBoundary = radius - (relX - innerW);
      } else if (relY > innerH && relX <= innerW) {
        // Edge region (top/bottom)
        closestX = relX;
        closestY = innerH + radius;
        distToBoundary = radius - (relY - innerH);
      } else {
        // Corner region
        const dx = relX - innerW;
        const dy = relY - innerH;
        const cornerDist = Math.sqrt(dx * dx + dy * dy);
        distToBoundary = radius - cornerDist;
        if (cornerDist > 0) {
          closestX = innerW + (dx / cornerDist) * radius;
          closestY = innerH + (dy / cornerDist) * radius;
        }
      }

      // Hard cutoff for pixels outside the shape
      if (distToBoundary < 0) {
        alpha = 0;
      }

      // Direction points from pixel toward closest boundary point
      const toDirX = closestX - relX;
      const toDirY = closestY - relY;
      const dirLen = Math.sqrt(toDirX * toDirX + toDirY * toDirY);
      if (dirLen > 0.001) {
        dirX = (x > cx ? 1 : -1) * (toDirX / dirLen);
        dirY = (y > cy ? 1 : -1) * (toDirY / dirLen);
      }

      // Apply bevel based on distance to boundary
      if (bevel > 0 && distToBoundary < bevel && distToBoundary >= 0) {
        let t = 1 - distToBoundary / bevel;
        if (flipY) t = 1 - t;
        const { derivative } = getHeightAndDerivative(t, shape, bezierCurve);
        const sign = flipY ? -1 : 1;
        nx = dirX * derivative * 0.5 * sign;
        ny = dirY * derivative * 0.5 * sign;
        if (flipX) {
          nx = -nx;
          ny = -ny;
        }
      }

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const index = (y * w + x) * 4;
      data[index] = ((nx * 0.5 + 0.5) * 255) | 0;
      data[index + 1] = ((ny * 0.5 + 0.5) * 255) | 0;
      data[index + 2] = ((nz * 0.5 + 0.5) * 255) | 0;
      data[index + 3] = alpha;
    }
  }
  return Texture.from({
    resource: data,
    width: w,
    height: h,
  });
}
