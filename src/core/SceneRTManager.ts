import { Rectangle, RenderTexture } from 'pixi.js';
import type { Renderer, WebGLRenderer } from 'pixi.js';

interface RtHandles {
  sceneColor: RenderTexture;
  sceneDepth?: RenderTexture;
}

export class SceneRTManager {
  private handles?: RtHandles;
  private scale = 1;
  private readonly clearRect = new Rectangle();

  constructor(
    private readonly renderer: Renderer,
    private readonly useDepth: boolean,
  ) {}

  ensure(width: number, height: number, scale: number): RtHandles {
    const targetResolution = this.renderer.resolution * scale;
    if (
      !this.handles ||
      this.handles.sceneColor.width !== width ||
      this.handles.sceneColor.height !== height ||
      this.handles.sceneColor.source.resolution !== targetResolution
    ) {
      this.dispose();
      this.handles = {
        sceneColor: RenderTexture.create({
          width,
          height,
          resolution: targetResolution,
          scaleMode: 'linear',
        }),
        sceneDepth: this.useDepth
          ? RenderTexture.create({
              width,
              height,
              resolution: targetResolution,
              scaleMode: 'nearest',
            })
          : undefined,
      };
      this.scale = scale;
    }
    return this.handles;
  }

  clearTargets(): void {
    if (!this.handles) return;
    this.clearRect.width = this.handles.sceneColor.width;
    this.clearRect.height = this.handles.sceneColor.height;
    
    const renderer = this.renderer as WebGLRenderer;
    renderer.renderTarget.bind(this.handles.sceneColor);
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (this.handles.sceneDepth) {
      renderer.renderTarget.bind(this.handles.sceneDepth);
      gl.clearColor(1, 0, 0, 1); 
      gl.clearDepth(1.0);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }
  }

  dispose(): void {
    this.handles?.sceneColor.destroy(true);
    this.handles?.sceneDepth?.destroy(true);
    this.handles = undefined;
  }
}
