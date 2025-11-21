import { Container } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import type { AdaptiveDecision, RenderQualityOptions, TelemetrySample } from '../core/types.js';
interface HudMetrics {
    quality: RenderQualityOptions;
    fps: number;
    lastDecision?: AdaptiveDecision;
    telemetry: TelemetrySample[];
}
export declare class GlassHUD {
    private readonly renderer;
    readonly container: Container<import("pixi.js").ContainerChild>;
    private readonly panel;
    private readonly text;
    private visible;
    constructor(renderer: Renderer);
    setVisible(visible: boolean): void;
    update(metrics: HudMetrics): void;
}
export {};
