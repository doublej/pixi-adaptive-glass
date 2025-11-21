import type { AdaptiveDecision, RenderQualityOptions, TelemetrySample } from './types.js';
export declare class AdaptiveQualityController {
    private readonly targetFrameMs;
    private current;
    private readonly telemetry;
    private overrides;
    constructor(targetFrameMs?: number);
    getQuality(): RenderQualityOptions;
    record(sample: TelemetrySample): void;
    setOverrides(overrides: Partial<RenderQualityOptions>): void;
    getTelemetry(): TelemetrySample[];
    evaluate(): AdaptiveDecision | undefined;
}
