import type { Renderer } from 'pixi.js';
import type { LightFollowParams, TrackedItem } from './types.js';

export class LightFollowController {
  private params?: LightFollowParams;
  private currentDir: [number, number, number] = [0, 0, 0.15];
  private targetDir: [number, number, number] = [0, 0, 0.15];
  private delayedDir: [number, number, number] = [0, 0, 0.15];
  private boundMouseMove?: (e: MouseEvent) => void;
  private renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  setParams(params: LightFollowParams): void {
    this.params = params;

    if (params.followCursor && !this.boundMouseMove) {
      this.boundMouseMove = (e: MouseEvent) => {
        const curve = params.curve ?? 1.5;
        const zMin = params.zMin ?? 0.05;
        const zMax = params.zMax ?? 0.20;
        const edgeStretch = params.edgeStretch ?? 0.5;

        // Get canvas bounds for proper coordinate mapping
        const canvas = this.renderer.canvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        // Convert cursor position to -1 to 1 range relative to canvas
        let x = 1 - ((e.clientX - rect.left) / rect.width) * 2; // X: left=1, right=-1
        let y = 1 - ((e.clientY - rect.top) / rect.height) * 2; // Y: top=1, bottom=-1

        // Apply edge stretch - power curve controls how values spread
        // < 1 = stretch toward edges, > 1 = compress toward center
        x = Math.sign(x) * Math.pow(Math.abs(x), edgeStretch);
        y = Math.sign(y) * Math.pow(Math.abs(y), edgeStretch);

        // Z decreases toward edges based on curve, capped at zMax (0.20)
        const dist = Math.sqrt(x * x + y * y);
        const z = Math.max(zMin, Math.min(zMax, zMax - Math.pow(dist, curve) * zMax * 0.5));

        this.targetDir = [x, y, z];
      };
      window.addEventListener('mousemove', this.boundMouseMove);
    } else if (!params.followCursor && this.boundMouseMove) {
      window.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = undefined;
    }
  }

  update(tracked: Map<HTMLElement, TrackedItem>): void {
    if (!this.params?.followCursor) return;

    // Delay: lerp delayed toward target (0 = instant, 1 = very slow)
    const delay = this.params.delay ?? 0.5;
    const delayFactor = 1 - delay * 0.97; // Convert to lerp factor (0.03 to 1)
    this.delayedDir[0] += (this.targetDir[0] - this.delayedDir[0]) * delayFactor;
    this.delayedDir[1] += (this.targetDir[1] - this.delayedDir[1]) * delayFactor;
    this.delayedDir[2] += (this.targetDir[2] - this.delayedDir[2]) * delayFactor;

    // Smoothing: lerp current toward delayed (0 = instant, 1 = very slow)
    const smoothing = this.params.smoothing ?? 0.9;
    const smoothFactor = 1 - smoothing * 0.97; // Convert to lerp factor (0.03 to 1)
    this.currentDir[0] += (this.delayedDir[0] - this.currentDir[0]) * smoothFactor;
    this.currentDir[1] += (this.delayedDir[1] - this.currentDir[1]) * smoothFactor;
    this.currentDir[2] += (this.delayedDir[2] - this.currentDir[2]) * smoothFactor;

    // Apply to all panels
    for (const [, item] of tracked) {
      item.panel.glassMaterial.lightDir = [...this.currentDir];
    }
  }

  destroy(): void {
    if (this.boundMouseMove) {
      window.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = undefined;
    }
  }
}
