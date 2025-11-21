import type { AdaptiveAction, AdaptiveDecision, RenderQualityOptions, TelemetrySample } from './types.js';

const DEFAULT_QUALITY: RenderQualityOptions = {
  renderScale: 1,
  enableDispersion: true,
  enableCaustics: true,
  enableContactShadows: true,
  maxBlurTaps: 9,
  edgeSupersampling: 1,
};

type DegradationStep = {
  check: (q: RenderQualityOptions) => boolean;
  apply: (q: RenderQualityOptions) => void;
  action: AdaptiveAction;
  reason: string;
};

const DEGRADATION_STEPS: DegradationStep[] = [
  { check: q => q.renderScale > 0.85, apply: q => { q.renderScale = 0.85; }, action: 'scale-rt-0-85', reason: 'Frame budget exceeded' },
  { check: q => q.renderScale > 0.7, apply: q => { q.renderScale = 0.7; }, action: 'scale-rt-0-7', reason: 'Severe perf drop' },
  { check: q => q.maxBlurTaps > 5, apply: q => { q.maxBlurTaps = 5; }, action: 'reduce-blur', reason: 'Sustained frame drops' },
  { check: q => q.enableDispersion, apply: q => { q.enableDispersion = false; }, action: 'disable-dispersion', reason: 'Dispersion too expensive' },
  { check: q => q.enableCaustics || q.enableContactShadows, apply: q => { q.enableCaustics = false; q.enableContactShadows = false; }, action: 'disable-caustics', reason: 'Optional overlays disabled' },
];

export class AdaptiveQualityController {
  private current: RenderQualityOptions = { ...DEFAULT_QUALITY };
  private readonly telemetry: TelemetrySample[] = [];
  private overrides: Partial<RenderQualityOptions> = {};

  constructor(private readonly targetFrameMs = 100) {}

  getQuality(): RenderQualityOptions {
    return { ...this.current };
  }

  record(sample: TelemetrySample): void {
    this.telemetry.push(sample);
    if (this.telemetry.length > 120) {
      this.telemetry.shift();
    }
  }

  setOverrides(overrides: Partial<RenderQualityOptions>): void {
    this.overrides = { ...this.overrides, ...overrides };
    this.current = { ...this.current, ...this.overrides };
  }

  getTelemetry(): TelemetrySample[] {
    return [...this.telemetry];
  }

  evaluate(): AdaptiveDecision | undefined {
    if (this.telemetry.length < 30) return undefined;
    const avgCpu = this.telemetry.reduce((sum, s) => sum + s.cpuMs, 0) / this.telemetry.length;
    const avgGpu = this.telemetry.reduce((sum, s) => sum + (s.gpuMs ?? s.cpuMs), 0) / this.telemetry.length;
    if (Math.max(avgCpu, avgGpu) <= this.targetFrameMs) return undefined;

    for (const step of DEGRADATION_STEPS) {
      if (step.check(this.current)) {
        step.apply(this.current);
        return { action: step.action, reason: step.reason };
      }
    }
    return undefined;
  }
}
