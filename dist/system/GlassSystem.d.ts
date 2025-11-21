import type { Container, RenderTexture, Renderer } from 'pixi.js';
import type { AdaptiveDecision, FallbackEvent, GlassPanelProps, GlassSystemOptions, RenderQualityOptions } from '../core/types.js';
import type { GlassPanel } from '../panels/GlassPanel.js';
interface GlassSystemEvents {
    'quality:decision': AdaptiveDecision;
    fallback: FallbackEvent;
    [key: string]: any;
}
export declare class GlassSystem {
    private readonly renderer;
    private pipeline;
    private readonly panels;
    private readonly quality;
    private drawOpaqueScene;
    private readonly events;
    constructor(renderer: Renderer, _options?: GlassSystemOptions);
    setOpaqueSceneCallback(draw: (target: RenderTexture) => void): void;
    createPanel(props: GlassPanelProps): GlassPanel;
    removePanel(panel: GlassPanel): void;
    render(): void;
    setQuality(options: Partial<RenderQualityOptions>): void;
    destroy(): void;
    on<K extends keyof GlassSystemEvents>(event: K, listener: (payload: GlassSystemEvents[K]) => void): void;
    off<K extends keyof GlassSystemEvents>(event: K, listener: (payload: GlassSystemEvents[K]) => void): void;
    getPipelineId(): string;
    getCompositeDisplay(): Container | undefined;
    private emitFallback;
}
export {};
