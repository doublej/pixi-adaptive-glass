import type { Renderer } from 'pixi.js';
import type { LightFollowParams, TrackedItem } from './types.js';
export declare class LightFollowController {
    private params?;
    private currentDir;
    private targetDir;
    private delayedDir;
    private boundMouseMove?;
    private renderer;
    constructor(renderer: Renderer);
    setParams(params: LightFollowParams): void;
    update(tracked: Map<HTMLElement, TrackedItem>): void;
    destroy(): void;
}
