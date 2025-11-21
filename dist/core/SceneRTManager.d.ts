import { RenderTexture } from 'pixi.js';
import type { Renderer } from 'pixi.js';
interface RtHandles {
    sceneColor: RenderTexture;
    sceneDepth?: RenderTexture;
}
export declare class SceneRTManager {
    private readonly renderer;
    private readonly useDepth;
    private handles?;
    private scale;
    private readonly clearRect;
    constructor(renderer: Renderer, useDepth: boolean);
    ensure(width: number, height: number, scale: number): RtHandles;
    clearTargets(): void;
    dispose(): void;
}
export {};
