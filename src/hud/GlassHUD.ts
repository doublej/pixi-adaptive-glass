import { Container, Graphics, Text } from 'pixi.js';
import type { Renderer } from 'pixi.js';
import type { AdaptiveDecision, RenderQualityOptions, TelemetrySample } from '../core/types.js';

interface HudMetrics {
  quality: RenderQualityOptions;
  fps: number;
  lastDecision?: AdaptiveDecision;
  telemetry: TelemetrySample[];
}

export class GlassHUD {
  readonly container = new Container();
  private readonly panel: Graphics;
  private readonly text: Text;
  private visible = false;

  constructor(private readonly renderer: Renderer) {
    this.panel = new Graphics()
      .beginFill(0x000000, 0.65)
      .drawRoundedRect(0, 0, 260, 120, 8)
      .endFill();
    this.text = new Text('Glass HUD', { fontSize: 12, fill: 0xffffff });
    this.text.position.set(12, 10);
    this.container.addChild(this.panel, this.text);
    this.container.visible = this.visible;
    this.container.position.set(12, 12);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.container.visible = visible;
  }

  update(metrics: HudMetrics): void {
    if (!this.visible) return;
    const { quality, fps, lastDecision } = metrics;
    const lines = [
      `FPS: ${fps.toFixed(1)}`,
      `Scale: ${(quality.renderScale * 100).toFixed(0)}%`,
      `Blur taps: ${quality.maxBlurTaps}`,
      `Dispersion: ${quality.enableDispersion ? 'on' : 'off'}`,
      `Caustics: ${quality.enableCaustics ? 'on' : 'off'}`,
    ];
    if (lastDecision) {
      lines.push(`Action: ${lastDecision.action}`);
    }
    this.text.text = lines.join('\n');
  }
}
