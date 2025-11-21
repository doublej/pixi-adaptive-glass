import type { Container, RenderTexture, Renderer, WebGLRenderer } from 'pixi.js';
import { AdaptiveQualityController } from '../core/AdaptiveQualityController.js';
import { CapabilityProbe } from '../core/CapabilityProbe.js';
import { EventBus } from '../core/EventBus.js';
import type {
  AdaptiveDecision,
  FallbackEvent,
  GlassPanelProps,
  GlassSystemOptions,
  RenderQualityOptions,
} from '../core/types.js';
import type { GlassPanel } from '../panels/GlassPanel.js';
import { GlassPanel as GlassPanelImpl } from '../panels/GlassPanel.js';
import type { Pipeline } from '../pipelines/BasePipeline.js';
import { WebGL1Pipeline } from '../pipelines/WebGL1Pipeline.js';
import { WebGL2Pipeline } from '../pipelines/WebGL2Pipeline.js';

interface GlassSystemEvents {
  'quality:decision': AdaptiveDecision;
  fallback: FallbackEvent;
  [key: string]: any; // Add index signature to satisfy EventMap
}

export class GlassSystem {
  private pipeline: Pipeline;
  private readonly panels: GlassPanel[] = [];
  private readonly quality = new AdaptiveQualityController();
  private drawOpaqueScene: (target: RenderTexture) => void = () => {};
  private readonly events = new EventBus<GlassSystemEvents>();

  constructor(
    private readonly renderer: Renderer,
    _options: GlassSystemOptions = {},
  ) {
    const gl = (renderer as WebGLRenderer).gl;
    const capability = new CapabilityProbe(gl).run();
    this.pipeline =
      capability.tier === 'webgl2'
        ? new WebGL2Pipeline(renderer, true)
        : new WebGL1Pipeline(renderer);
    if (capability.tier === 'webgl1') {
      this.emitFallback('webgl', 'MRT unavailable, using compatibility pipeline');
    }
  }

  setOpaqueSceneCallback(draw: (target: RenderTexture) => void): void {
    this.drawOpaqueScene = draw;
  }

  createPanel(props: GlassPanelProps): GlassPanel {
    const panel = new GlassPanelImpl(props);
    this.panels.push(panel);
    return panel;
  }

  removePanel(panel: GlassPanel): void {
    const idx = this.panels.indexOf(panel);
    if (idx >= 0) {
      this.panels.splice(idx, 1);
      panel.destroy({ children: true, texture: false, textureSource: false });
    }
  }

  render(): void {
    const start = performance.now();
    const quality = this.quality.getQuality();
    this.pipeline.render({
      renderer: this.renderer,
      panels: this.panels,
      quality,
      drawOpaqueScene: this.drawOpaqueScene,
    });
    const duration = performance.now() - start;
    this.quality.record({ cpuMs: duration, timestamp: start });
    const decision = this.quality.evaluate();
    if (decision) {
      this.events.emit('quality:decision', decision);
    }
  }

  setQuality(options: Partial<RenderQualityOptions>): void {
    this.quality.setOverrides(options);
  }

  destroy(): void {
    for (const panel of this.panels) {
      panel.destroy({ children: true, texture: false, textureSource: false });
    }
    this.panels.length = 0;
    this.pipeline.dispose();
    this.events.removeAll();
  }

  on<K extends keyof GlassSystemEvents>(
    event: K,
    listener: (payload: GlassSystemEvents[K]) => void,
  ): void {
    this.events.on(event, listener);
  }

  off<K extends keyof GlassSystemEvents>(
    event: K,
    listener: (payload: GlassSystemEvents[K]) => void,
  ): void {
    this.events.off(event, listener);
  }

  getPipelineId(): string {
    return this.pipeline.id;
  }

  getCompositeDisplay(): Container | undefined {
    if (typeof this.pipeline.getCompositeDisplay === 'function') {
      return this.pipeline.getCompositeDisplay();
    }
    return undefined;
  }

  private emitFallback(target: string, message: string): void {
    const event: FallbackEvent = { target, message, timestamp: performance.now() };
    console.warn(`GlassSystem fallback: ${target} - ${message}`);
    this.events.emit('fallback', event);
  }
}
