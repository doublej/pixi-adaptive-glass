import type { Renderer } from 'pixi.js';
import { GlassSystem } from './system/GlassSystem.js';
import type { GlassPanel } from './panels/GlassPanel.js';
export type { PositionTransform, PositionTransformFn, LightFollowParams, GlassOverlayOptions, GlassItemConfig, } from './overlay/types.js';
import type { PositionTransformFn, LightFollowParams, GlassOverlayOptions, GlassItemConfig } from './overlay/types.js';
export { heightCircle, heightSquircle, smootherstep, getHeightAndDerivative, } from './geometry/height-functions.js';
export { getDistanceToBoundary } from './geometry/distance.js';
export { createRoundedRectNormalMap, createDisplacementMapData, createDisplacementMap, } from './geometry/normal-map.js';
/**
 * A high-level wrapper for GlassSystem that synchronizes GlassPanels with DOM elements.
 * Ideal for adding glass effects to existing UI overlays in Nuxt/Vue/React projects.
 */
export declare class GlassOverlay {
    readonly system: GlassSystem;
    private readonly tracked;
    private positionTransform?;
    private lightFollow;
    private domTracking;
    private animationHandlers;
    constructor(renderer: Renderer, options: GlassOverlayOptions);
    setLightFollowParams(params: LightFollowParams): void;
    autoMount(selector?: string): void;
    track(element: HTMLElement, config?: GlassItemConfig): GlassPanel;
    untrack(element: HTMLElement): void;
    update(): void;
    resize(): void;
    setPositionTransform(transform: PositionTransformFn | undefined): void;
    cleanup(): void;
    destroy(): void;
    private createMaterial;
    private detectCircleMode;
    private calculateRadius;
    private createNormalMap;
    private syncElement;
    private parseBorderRadius;
    private isCssVisible;
    private updatePanelGeometry;
}
