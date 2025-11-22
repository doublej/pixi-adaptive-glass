import { Texture } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { GlassSystem } from './system/GlassSystem.js';
import { GlassPresets } from './materials/GlassPresets.js';
import type { GlassPanel } from './panels/GlassPanel.js';

// Re-export types for external consumers
export type {
  PositionTransform,
  PositionTransformFn,
  LightFollowParams,
  GlassOverlayOptions,
  GlassItemConfig,
} from './overlay/types.js';

import type {
  PositionTransformFn,
  LightFollowParams,
  GlassOverlayOptions,
  GlassItemConfig,
  TrackedItem,
} from './overlay/types.js';

import { LightFollowController } from './overlay/light-follow.js';
import { DomTrackingController, createAnimationHandlers } from './overlay/dom-tracking.js';
import { createRoundedRectNormalMap, createDisplacementMap } from './geometry/normal-map.js';

// Re-export geometry functions for external use
export {
  heightCircle,
  heightSquircle,
  smootherstep,
  getHeightAndDerivative,
} from './geometry/height-functions.js';

export { getDistanceToBoundary } from './geometry/distance.js';

export {
  createRoundedRectNormalMap,
  createDisplacementMapData,
  createDisplacementMap,
} from './geometry/normal-map.js';

/**
 * A high-level wrapper for GlassSystem that synchronizes GlassPanels with DOM elements.
 * Ideal for adding glass effects to existing UI overlays in Nuxt/Vue/React projects.
 */
export class GlassOverlay {
  public readonly system: GlassSystem;
  private readonly tracked = new Map<HTMLElement, TrackedItem>();
  private positionTransform?: PositionTransformFn;
  private lightFollow: LightFollowController;
  private domTracking: DomTrackingController;
  private animationHandlers: ReturnType<typeof createAnimationHandlers>;

  constructor(renderer: Renderer, options: GlassOverlayOptions) {
    this.system = new GlassSystem(renderer, options.systemOptions);

    this.system.setOpaqueSceneCallback((target) => {
      renderer.render({ container: options.background, target, clear: true });
    });

    const composite = this.system.getCompositeDisplay();
    if (composite) {
      options.stage.addChild(composite);
    }

    // Initialize controllers
    this.lightFollow = new LightFollowController(renderer);
    this.domTracking = new DomTrackingController(this.tracked, {
      syncElement: this.syncElement.bind(this),
      updateGeometry: this.updatePanelGeometry.bind(this),
      isCssVisible: this.isCssVisible.bind(this),
      parseBorderRadius: this.parseBorderRadius.bind(this),
    });

    this.animationHandlers = createAnimationHandlers(
      this.tracked,
      this.syncElement.bind(this),
      this.updatePanelGeometry.bind(this)
    );

    // Set up light follow cursor
    if (options.lightFollowParams) {
      this.setLightFollowParams(options.lightFollowParams);
    }
  }

  setLightFollowParams(params: LightFollowParams): void {
    this.lightFollow.setParams(params);
  }

  autoMount(selector: string = '.glass-panel'): void {
    this.domTracking.setupObservers(
      selector,
      (el) => this.track(el),
      (el) => this.untrack(el),
      () => this.cleanup()
    );
  }

  track(element: HTMLElement, config: GlassItemConfig = {}): GlassPanel {
    if (this.tracked.has(element)) {
      return this.tracked.get(element)!.panel;
    }

    const material = this.createMaterial(element, config);
    const rect = element.getBoundingClientRect();
    const isCircle = this.detectCircleMode(element, config);
    const radius = this.calculateRadius(element, rect, config, isCircle);
    const normalMap = this.createNormalMap(rect, radius, config, isCircle);

    const panel = this.system.createPanel({ material, normalMap });
    const item: TrackedItem = {
      panel,
      config,
      lastRect: rect,
      lastRadius: radius,
      visible: true,
      isCircle,
      polling: false,
    };

    this.tracked.set(element, item);

    // Set up observers
    this.domTracking.observeElement(element);

    // Set up animation listeners
    element.addEventListener('transitionrun', this.animationHandlers.handleAnimationStart);
    element.addEventListener('transitionend', this.animationHandlers.handleAnimationEnd);
    element.addEventListener('transitioncancel', this.animationHandlers.handleAnimationEnd);
    element.addEventListener('animationstart', this.animationHandlers.handleAnimationStart);
    element.addEventListener('animationend', this.animationHandlers.handleAnimationEnd);
    element.addEventListener('animationcancel', this.animationHandlers.handleAnimationEnd);

    this.syncElement(element, panel);

    return panel;
  }

  untrack(element: HTMLElement): void {
    const item = this.tracked.get(element);
    if (!item) return;

    item.polling = false;
    this.domTracking.unobserveElement(element);

    element.removeEventListener('transitionrun', this.animationHandlers.handleAnimationStart);
    element.removeEventListener('transitionend', this.animationHandlers.handleAnimationEnd);
    element.removeEventListener('transitioncancel', this.animationHandlers.handleAnimationEnd);
    element.removeEventListener('animationstart', this.animationHandlers.handleAnimationStart);
    element.removeEventListener('animationend', this.animationHandlers.handleAnimationEnd);
    element.removeEventListener('animationcancel', this.animationHandlers.handleAnimationEnd);

    this.system.removePanel(item.panel);
    this.tracked.delete(element);
  }

  update(): void {
    this.lightFollow.update(this.tracked);

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
    this.lightFollow.destroy();
    this.domTracking.destroy();
    this.system.destroy();
    this.tracked.clear();
  }

  private createMaterial(element: HTMLElement, config: GlassItemConfig) {
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

    return material;
  }

  private detectCircleMode(element: HTMLElement, config: GlassItemConfig): boolean {
    return config.isCircle ||
           element.classList.contains('glass-circle') ||
           element.hasAttribute('data-glass-circle');
  }

  private calculateRadius(element: HTMLElement, rect: DOMRect, config: GlassItemConfig, isCircle: boolean): number {
    if (isCircle) {
      return Math.min(rect.width, rect.height) / 2;
    }
    const cssRadius = this.parseBorderRadius(element, rect);
    return config.cornerRadius ?? cssRadius;
  }

  private createNormalMap(rect: DOMRect, radius: number, config: GlassItemConfig, isCircle: boolean): Texture {
    if (config.normalMap) return config.normalMap;

    const bevel = config.bevelSize ?? 12;
    const shape = config.surfaceShape ?? 'squircle';
    const invertNormals = config.invertNormals ?? false;
    const useDisplacementMap = config.useDisplacementMap ?? false;

    const dpr = window.devicePixelRatio || 1;
    const circleSize = Math.floor(Math.min(rect.width, rect.height) * dpr);
    const mapWidth = isCircle ? circleSize : rect.width * dpr;
    const mapHeight = isCircle ? circleSize : rect.height * dpr;

    return useDisplacementMap
      ? createDisplacementMap(mapWidth, mapHeight, radius * dpr, bevel * dpr, shape)
      : createRoundedRectNormalMap(mapWidth, mapHeight, radius * dpr, bevel * dpr, shape, invertNormals);
  }

  private syncElement(element: HTMLElement, panel: GlassPanel): void {
    const item = this.tracked.get(element);
    const rect = element.getBoundingClientRect();

    // Round to whole pixels to avoid subpixel blurring
    const width = item?.isCircle ? Math.floor(Math.min(rect.width, rect.height)) : Math.round(rect.width);
    const height = item?.isCircle ? width : Math.round(rect.height);
    const x = Math.round(rect.left) + width / 2;
    const y = Math.round(rect.top) + height / 2;

    if (this.positionTransform) {
      const t = this.positionTransform(x, y, width, height);
      panel.position.set(Math.round(t.x), Math.round(t.y));
      panel.scale.set(Math.round(width * t.scaleX), Math.round(height * t.scaleY));
      panel.rotation = t.rotation;
    } else {
      panel.position.set(x, y);
      panel.scale.set(width, height);
      panel.rotation = 0;
    }
  }

  private parseBorderRadius(element: HTMLElement, rect: DOMRect): number {
    const style = window.getComputedStyle(element);

    const topLeft = style.borderTopLeftRadius;
    const topRight = style.borderTopRightRadius;
    const bottomRight = style.borderBottomRightRadius;
    const bottomLeft = style.borderBottomLeftRadius;

    const parseValue = (value: string, dimension: number): number => {
      if (value.endsWith('%')) {
        return (parseFloat(value) / 100) * dimension;
      }
      return parseFloat(value) || 0;
    };

    const getFirstValue = (radius: string): string => {
      return radius.split(' ')[0];
    };

    const avgDimension = (rect.width + rect.height) / 2;

    const radii = [
      parseValue(getFirstValue(topLeft), avgDimension),
      parseValue(getFirstValue(topRight), avgDimension),
      parseValue(getFirstValue(bottomRight), avgDimension),
      parseValue(getFirstValue(bottomLeft), avgDimension),
    ];

    const avg = radii.reduce((a, b) => a + b, 0) / 4;
    return avg || 20;
  }

  private isCssVisible(element: HTMLElement): boolean {
    if (element.hidden) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden';
  }

  private updatePanelGeometry(element: HTMLElement, item: TrackedItem): void {
    const rect = element.getBoundingClientRect();
    const isCircle = this.detectCircleMode(element, item.config);
    const radius = this.calculateRadius(element, rect, item.config, isCircle);
    const normalMap = this.createNormalMap(rect, radius, item.config, isCircle);

    item.panel.setTextures({ normalMap });
    item.lastRect = rect;
    item.lastRadius = radius;
  }
}
