import { Container, Texture } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { GlassSystem } from './system/GlassSystem.js';
import type { GlassPanel } from './panels/GlassPanel.js';
import type { GlassMaterial, SurfaceShape } from './core/types.js';
export interface PositionTransform {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
}
export type PositionTransformFn = (x: number, y: number, width: number, height: number) => PositionTransform;
export interface LightFollowParams {
    followCursor: boolean;
    smoothing?: number;
    curve?: number;
    zMin?: number;
    zMax?: number;
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
export declare class GlassOverlay {
    readonly system: GlassSystem;
    private readonly tracked;
    private readonly background;
    private observer?;
    private resizeObserver?;
    private intersectionObserver?;
    private positionTransform?;
    private lightFollowParams?;
    private currentLightDir;
    private targetLightDir;
    private boundMouseMove?;
    private renderer;
    constructor(renderer: Renderer, options: GlassOverlayOptions);
    setLightFollowParams(params: LightFollowParams): void;
    autoMount(selector?: string): void;
    track(element: HTMLElement, config?: GlassItemConfig): GlassPanel;
    private handleAnimationStart;
    private handleAnimationEnd;
    private startPolling;
    private stopPolling;
    untrack(element: HTMLElement): void;
    update(): void;
    resize(): void;
    setPositionTransform(transform: PositionTransformFn | undefined): void;
    cleanup(): void;
    destroy(): void;
    private syncElement;
    private parseBorderRadius;
    private isCssVisible;
    private updatePanelGeometry;
}
export declare function heightCircle(t: number): number;
export declare function heightSquircle(t: number): number;
export declare function smootherstep(t: number): number;
export declare function getBezierHeightAndDerivative(t: number, curve: [number, number, number, number]): {
    height: number;
    derivative: number;
};
export declare function getHeightAndDerivative(t: number, shape: SurfaceShape, bezierCurve?: [number, number, number, number]): {
    height: number;
    derivative: number;
};
