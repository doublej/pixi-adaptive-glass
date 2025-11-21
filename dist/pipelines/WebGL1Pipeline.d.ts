import type { Renderer } from 'pixi.js';
import type { Pipeline, PipelineContext } from './BasePipeline.js';
export declare class WebGL1Pipeline implements Pipeline {
    private readonly renderer;
    readonly id = "webgl1";
    private readonly filter;
    private readonly rtManager;
    private readonly blitSprite;
    constructor(renderer: Renderer);
    setup(): void;
    render(context: PipelineContext): void;
    dispose(): void;
    private applyFilter;
}
