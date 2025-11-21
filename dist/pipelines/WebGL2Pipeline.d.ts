import { Container } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import type { Pipeline, PipelineContext } from './BasePipeline.js';
export declare class WebGL2Pipeline implements Pipeline {
    private readonly renderer;
    readonly id = "webgl2";
    private readonly rtManager;
    private readonly refractShader;
    private readonly revealageShader;
    private readonly compositeShader;
    private readonly fullScreenQuad;
    private readonly shadowSprite;
    private readonly panelParent;
    private compositeRT?;
    private readonly compositeSprite;
    private accumRT?;
    private revealRT?;
    constructor(renderer: Renderer, useDepth: boolean);
    setup(): void;
    render(context: PipelineContext): void;
    dispose(): void;
    private ensureAccumTargets;
    private clearTarget;
    private renderPanel;
    private renderContactShadows;
    getCompositeDisplay(): Container | undefined;
    private drawPanelToTarget;
    private ensureCompositeTarget;
}
