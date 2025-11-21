import type { Container, RenderTexture, Renderer } from 'pixi.js';
import type { RenderQualityOptions } from '../core/types.js';
import type { GlassPanel } from '../panels/GlassPanel.js';
export interface PipelineContext {
    renderer: Renderer;
    panels: GlassPanel[];
    quality: RenderQualityOptions;
    drawOpaqueScene: (target: RenderTexture) => void;
}
export interface Pipeline {
    readonly id: string;
    setup(): void;
    render(context: PipelineContext): void;
    dispose(): void;
    getCompositeDisplay?(): Container | undefined;
}
