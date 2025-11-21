import type { CapabilityResult } from './types.js';
export declare class CapabilityProbe {
    private readonly gl;
    private cached?;
    constructor(gl: WebGLRenderingContext | WebGL2RenderingContext);
    run(): CapabilityResult;
    private queryExtensions;
    private getMaxDrawBuffers;
    private isWebGL2Context;
}
