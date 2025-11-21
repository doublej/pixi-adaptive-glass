import type { CapabilityResult, CapabilityTier } from './types.js';

export class CapabilityProbe {
  private cached?: CapabilityResult;

  constructor(private readonly gl: WebGLRenderingContext | WebGL2RenderingContext) {}

  run(): CapabilityResult {
    if (this.cached) {
      return this.cached;
    }

    const isWebGL2 = this.isWebGL2Context(this.gl);
    const extensions = this.queryExtensions([
      'EXT_color_buffer_float',
      'OES_texture_float_linear',
      'OES_standard_derivatives',
      'EXT_disjoint_timer_query_webgl2',
      'EXT_disjoint_timer_query',
    ]);

    const tier: CapabilityTier = isWebGL2 && this.getMaxDrawBuffers() > 1 ? 'webgl2' : 'webgl1';

    this.cached = {
      tier,
      maxDrawBuffers: this.getMaxDrawBuffers(),
      extensions,
    };
    return this.cached;
  }

  private queryExtensions(names: string[]): Record<string, boolean> {
    return names.reduce<Record<string, boolean>>((map, name) => {
      map[name] = Boolean(this.gl.getExtension(name));
      return map;
    }, {});
  }

  private getMaxDrawBuffers(): number {
    const ext = this.gl.getExtension('WEBGL_draw_buffers');
    const param = this.isWebGL2Context(this.gl)
      ? this.gl.MAX_DRAW_BUFFERS
      : ext
        ? ext.MAX_DRAW_BUFFERS_WEBGL
        : 0;
    if (!param) return 1;
    const caps = this.gl.getParameter(param) as number | null;
    return caps ?? 1;
  }

  private isWebGL2Context(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
  ): gl is WebGL2RenderingContext {
    return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  }
}
