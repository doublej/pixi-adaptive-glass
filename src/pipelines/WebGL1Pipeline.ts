import { Filter, Sprite, Texture, GlProgram } from 'pixi.js';
import type { RenderTexture, Renderer } from 'pixi.js';
import { SceneRTManager } from '../core/SceneRTManager.js';
import type { RenderQualityOptions } from '../core/types.js';
import type { GlassPanel } from '../panels/GlassPanel.js';
import type { Pipeline, PipelineContext } from './BasePipeline.js';
import { hexToVec3 } from '../utils/index.js';

class CompatibilityFilter extends Filter {
  constructor() {
    const fragment = `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSceneColor;
      uniform sampler2D uNormalMap;
      uniform vec2 uInvResolution;
      uniform float uDispersion;
      uniform float uRoughness;
      uniform float uDisplacementScale;
      uniform vec3 uTint;
      uniform float uOpacity;
      uniform bool uEnableDispersion;
      vec3 sampleScene(vec2 uv){
        return texture2D(uSceneColor, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
      }
      void main(){
        vec3 normal = texture2D(uNormalMap, vTextureCoord).xyz * 2.0 - 1.0;
        vec2 offset = normal.xy * uDisplacementScale;
        vec2 baseUV = vTextureCoord + offset;
        vec3 color = sampleScene(baseUV);
        if(uEnableDispersion){
          color.r = sampleScene(baseUV + offset * (1.0 + uDispersion)).r;
          color.b = sampleScene(baseUV - offset * (1.0 + uDispersion)).b;
        }
        float radius = uRoughness * 4.0;
        if(radius > 0.001){
          vec3 blurAccum = vec3(0.0);
          float taps = 0.0;
          for(int i=0;i<4;i++){
            float angle = 6.2831853 * float(i) / 4.0;
            vec2 sampleOffset = vec2(cos(angle), sin(angle)) * radius * uInvResolution;
            blurAccum += sampleScene(baseUV + sampleOffset);
            taps += 1.0;
          }
          color = mix(color, blurAccum / max(taps, 1.0), 0.7);
        }
        gl_FragColor = vec4(color * uTint * uOpacity, uOpacity);
      }
    `;
    super({
      glProgram: new GlProgram({
          vertex: `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            void main(void){
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
          `,
          fragment,
      }),
      resources: {
        uSceneColor: Texture.WHITE.source,
        uNormalMap: Texture.WHITE.source,
        uniforms: {
            uInvResolution: { value: [1, 1], type: 'vec2<f32>' },
            uDispersion: { value: 0, type: 'f32' },
            uRoughness: { value: 0, type: 'f32' },
            uDisplacementScale: { value: 0.01, type: 'f32' },
            uTint: { value: [1, 1, 1], type: 'vec3<f32>' },
            uOpacity: { value: 1, type: 'f32' },
            uEnableDispersion: { value: 0, type: 'f32' }, // boolean as float
        }
      },
    });
  }
}

export class WebGL1Pipeline implements Pipeline {
  readonly id = 'webgl1';
  private readonly filter = new CompatibilityFilter();
  private readonly rtManager: SceneRTManager;
  private readonly blitSprite: Sprite;

  constructor(private readonly renderer: Renderer) {
    this.rtManager = new SceneRTManager(renderer, false);
    this.blitSprite = new Sprite(Texture.WHITE);
  }

  setup(): void {}

  render(context: PipelineContext): void {
    const { renderer, panels, quality, drawOpaqueScene } = context;
    const targets = this.rtManager.ensure(
      renderer.screen.width,
      renderer.screen.height,
      quality.renderScale,
    );
    
    drawOpaqueScene(targets.sceneColor);
    
    this.blitSprite.texture = targets.sceneColor;
    this.blitSprite.width = renderer.screen.width;
    this.blitSprite.height = renderer.screen.height;
    
    renderer.render({ container: this.blitSprite, clear: true });
    
    const orderedPanels = [...panels].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    for (const panel of orderedPanels) {
      this.applyFilter(panel, targets.sceneColor, quality);
      renderer.render({ container: panel });
    }
  }

  dispose(): void {
    this.rtManager.dispose();
  }

  private applyFilter(
    panel: GlassPanel,
    sceneTexture: RenderTexture,
    quality: RenderQualityOptions,
  ): void {
    const needsFilter =
      Boolean(panel.normalMap || panel.dudvMap) ||
      panel.glassMaterial.dispersion > 0.001 ||
      panel.glassMaterial.roughness > 0.001;
    if (!needsFilter) {
      panel.filters = null;
      return;
    }
    const resources = this.filter.resources;
    // Assign textures to resources
    (resources as any).uSceneColor = sceneTexture.source;
    (resources as any).uNormalMap = (panel.normalMap ?? panel.dudvMap ?? Texture.WHITE).source;
    
    const uniforms = (resources as any).uniforms;
    uniforms.uInvResolution = [1 / sceneTexture.width, 1 / sceneTexture.height];
    uniforms.uDispersion = panel.glassMaterial.dispersion;
    uniforms.uRoughness = panel.glassMaterial.roughness;
    uniforms.uDisplacementScale = panel.glassMaterial.thickness * 0.1;
    uniforms.uTint = hexToVec3(panel.glassMaterial.tint ?? 0xffffff);
    uniforms.uOpacity = panel.glassMaterial.opacity;
    uniforms.uEnableDispersion = quality.enableDispersion && panel.glassMaterial.dispersion > 0.001 ? 1 : 0;
    
    panel.filters = [this.filter];
  }
}
