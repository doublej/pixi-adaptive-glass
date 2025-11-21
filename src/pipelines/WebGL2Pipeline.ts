import {
  Container,
  Mesh,
  MeshGeometry,
  RenderTexture,
  Shader,
  Sprite,
  State,
  Texture,
  UniformGroup,
} from 'pixi.js';
import type { Renderer } from 'pixi.js';
import { SceneRTManager } from '../core/SceneRTManager.js';
import type { GlassPanel } from '../panels/GlassPanel.js';
import {
  compositeFragment,
  fullscreenVertex,
  panelVertex,
  refractionFragment,
  revealageFragment,
} from '../shaders/webgl2.js';
import type { Pipeline, PipelineContext } from './BasePipeline.js';
import type { RenderQualityOptions } from '../core/types.js';
import { hexToVec3 } from '../utils/index.js';

// Fullscreen quad with 0..1 positions for clip space mapping
const QUAD_GEOMETRY = new MeshGeometry({
  positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
});

export class WebGL2Pipeline implements Pipeline {
  readonly id = 'webgl2';
  private readonly rtManager: SceneRTManager;
  private readonly refractShader: Shader;
  private readonly revealageShader: Shader;
  private readonly compositeShader: Shader;
  private readonly fullScreenQuad: Mesh<MeshGeometry, Shader>;
  private readonly shadowSprite: Sprite;
  private readonly panelParent: Container;
  private compositeRT?: RenderTexture;
  private readonly compositeSprite: Sprite;
  private accumRT?: RenderTexture;
  private revealRT?: RenderTexture;

  constructor(
    private readonly renderer: Renderer,
    useDepth: boolean,
  ) {
    this.rtManager = new SceneRTManager(renderer, useDepth);
    const refractUniforms = new UniformGroup({
      uPosition: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
      uScale: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
      uResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
      uInvResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
      uIOR: { value: 1, type: 'f32' },
      uThickness: { value: 1, type: 'f32' },
      uDispersion: { value: 0, type: 'f32' },
      uRoughness: { value: 0, type: 'f32' },
      uOpacity: { value: 1, type: 'f32' },
      uEnableDispersion: { value: 0, type: 'f32' },
      uEnableCaustics: { value: 0, type: 'f32' },
      uTint: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
      uSpecular: { value: 0, type: 'f32' },
      uShininess: { value: 32, type: 'f32' },
      uShadow: { value: 0, type: 'f32' },
      uLightDir: { value: new Float32Array([0.5, 0.5, 1]), type: 'vec3<f32>' },
      uBlurSamples: { value: 8, type: 'f32' },
      uBlurSpread: { value: 4, type: 'f32' },
      uBlurAngle: { value: 0, type: 'f32' },
      uBlurAnisotropy: { value: 0, type: 'f32' },
      uBlurGamma: { value: 1, type: 'f32' },
      uAberrationR: { value: 1, type: 'f32' },
      uAberrationB: { value: 1, type: 'f32' },
      uAO: { value: 0, type: 'f32' },
      uAORadius: { value: 0.5, type: 'f32' },
      uNoiseScale: { value: 20, type: 'f32' },
      uNoiseIntensity: { value: 0, type: 'f32' },
      uNoiseRotation: { value: 0, type: 'f32' },
      uNoiseThreshold: { value: 0, type: 'f32' },
      uEdgeSupersampling: { value: 1, type: 'f32' },
      uEdgeSmoothWidth: { value: 0.15, type: 'f32' },
      uEdgeContrast: { value: 0.7, type: 'f32' },
      uEdgeAlphaFalloff: { value: 1, type: 'f32' },
      uEdgeMaskCutoff: { value: 0.001, type: 'f32' },
      uEnableEdgeSmoothing: { value: 1, type: 'f32' },
      uEnableContrastReduction: { value: 1, type: 'f32' },
      uEnableAlphaFalloff: { value: 1, type: 'f32' },
      uEnableTintOpacity: { value: 1, type: 'f32' },
      uEdgeBlur: { value: 0, type: 'f32' },
      uGlassSupersampling: { value: 1, type: 'f32' },
      uPanelSize: { value: new Float32Array([200, 200]), type: 'vec2<f32>' },
    });
    this.refractShader = Shader.from({
      gl: { vertex: panelVertex, fragment: refractionFragment },
      resources: {
        uSceneColor: Texture.WHITE.source,
        uNormalMap: Texture.WHITE.source,
        uCausticsMap: Texture.WHITE.source,
        panelUniforms: refractUniforms,
      },
    });
    const revealUniforms = new UniformGroup({
      uPosition: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
      uScale: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
      uResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
      uOpacity: { value: 1, type: 'f32' },
    });
    this.revealageShader = Shader.from({
      gl: { vertex: panelVertex, fragment: revealageFragment },
      resources: {
        uNormalMap: Texture.WHITE.source,
        panelUniforms: revealUniforms,
      },
    });
    this.compositeShader = Shader.from({
      gl: { vertex: fullscreenVertex, fragment: compositeFragment },
      resources: {
        uSceneColor: Texture.WHITE.source,
        uAccum: Texture.WHITE.source,
        uReveal: Texture.WHITE.source,
      },
    });
    this.fullScreenQuad = new Mesh({
      geometry: QUAD_GEOMETRY,
      shader: this.compositeShader,
    });
    this.fullScreenQuad.state = State.for2d();
    this.fullScreenQuad.state.culling = false; // Disable culling
    this.shadowSprite = new Sprite(Texture.WHITE);
    this.panelParent = new Container();
    this.panelParent.alpha = 1;
    this.compositeSprite = new Sprite(Texture.EMPTY);
    // Ensure composite sprite is visible and on top
    this.compositeSprite.position.set(0, 0);
    this.compositeSprite.visible = true;
    this.compositeSprite.alpha = 1;
    this.compositeSprite.zIndex = 9999; // Force on top
  }

  setup(): void {}

  render(context: PipelineContext): void {
    const { renderer, panels, quality, drawOpaqueScene } = context;
    const width = renderer.screen.width;
    const height = renderer.screen.height;
    const targets = this.rtManager.ensure(width, height, quality.renderScale);
    this.ensureAccumTargets(width, height);
    this.ensureCompositeTarget(width, height);

    drawOpaqueScene(targets.sceneColor);

    this.clearTarget(this.accumRT, 0, 0, 0, 0);
    this.clearTarget(this.revealRT, 1, 1, 1, 1);

    for (const panel of panels) {
      this.renderPanel(panel, quality, targets.sceneColor);
    }

    this.fullScreenQuad.shader = this.compositeShader;
    (this.compositeShader as any).resources.uSceneColor = targets.sceneColor.source;
    (this.compositeShader as any).resources.uAccum = this.accumRT?.source;
    (this.compositeShader as any).resources.uReveal = this.revealRT?.source;

    this.fullScreenQuad.width = renderer.screen.width;
    this.fullScreenQuad.height = renderer.screen.height;

    this.fullScreenQuad.updateLocalTransform();
    this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform);

    // Render composite quad to texture
    renderer.render({ container: this.fullScreenQuad, target: this.compositeRT, clear: true });

    if (this.compositeRT) {
      this.compositeSprite.texture = this.compositeRT;
      this.compositeSprite.width = width;
      this.compositeSprite.height = height;
      this.compositeSprite.visible = true;
    }

    this.renderContactShadows(panels, quality);
  }

  dispose(): void {
    this.rtManager.dispose();
    this.accumRT?.destroy(true);
    this.revealRT?.destroy(true);
    this.compositeRT?.destroy(true);
  }

  private ensureAccumTargets(width: number, height: number): void {
    const targetResolution = this.renderer.resolution;
    if (!this.accumRT || this.accumRT.width !== width || this.accumRT.height !== height || this.accumRT.source.resolution !== targetResolution) {
      this.accumRT?.destroy(true);
      this.accumRT = RenderTexture.create({
        width,
        height,
        resolution: targetResolution,
      });
    }
    if (!this.revealRT || this.revealRT.width !== width || this.revealRT.height !== height || this.revealRT.source.resolution !== targetResolution) {
      this.revealRT?.destroy(true);
      this.revealRT = RenderTexture.create({
        width,
        height,
        resolution: targetResolution,
      });
    }
  }

  private clearTarget(
    target: RenderTexture | undefined,
    r: number,
    g: number,
    b: number,
    a: number,
  ): void {
    if (!target) return;
    const dummy = new Container();
    this.renderer.render({ container: dummy, target, clear: true, clearColor: [r, g, b, a] });
  }

  private renderPanel(
    panel: GlassPanel,
    quality: RenderQualityOptions,
    sceneTarget: RenderTexture,
  ): void {
    if (!this.accumRT || !this.revealRT) return;
    const normal = panel.normalMap ?? Texture.WHITE;
    const screenWidth = this.renderer.screen.width;
    const screenHeight = this.renderer.screen.height;

    const resources = (this.refractShader as any).resources;
    if (resources) {
      resources.uSceneColor = sceneTarget.source;
      resources.uNormalMap = normal.source;
      resources.uCausticsMap = (panel.causticsAtlas ?? Texture.WHITE).source;

      // Update uniforms through UniformGroup in v8
      const uniforms = resources.panelUniforms?.uniforms;
      if (uniforms) {
        // Use accumRT resolution since gl_FragCoord is in accumRT pixel space
        const res = this.accumRT?.source?._resolution ?? this.renderer.resolution;
        uniforms.uPosition[0] = panel.position.x;
        uniforms.uPosition[1] = panel.position.y;
        uniforms.uScale[0] = panel.scale.x;
        uniforms.uScale[1] = panel.scale.y;
        uniforms.uResolution[0] = screenWidth;
        uniforms.uResolution[1] = screenHeight;
        uniforms.uInvResolution[0] = 1 / (screenWidth * res);
        uniforms.uInvResolution[1] = 1 / (screenHeight * res);
        uniforms.uIOR = panel.glassMaterial.ior;
        uniforms.uThickness = panel.glassMaterial.thickness;
        uniforms.uDispersion = panel.glassMaterial.dispersion;
        uniforms.uRoughness = panel.glassMaterial.roughness;
        uniforms.uOpacity = panel.glassMaterial.opacity ?? 1;
        uniforms.uEnableDispersion =
          quality.enableDispersion && panel.glassMaterial.dispersion > 0.001 ? 1 : 0;
        uniforms.uEnableCaustics = quality.enableCaustics && Boolean(panel.causticsAtlas) ? 1 : 0;
        const tint = hexToVec3(panel.glassMaterial.tint ?? 0xffffff);
        uniforms.uTint[0] = tint[0];
        uniforms.uTint[1] = tint[1];
        uniforms.uTint[2] = tint[2];
        uniforms.uSpecular = panel.glassMaterial.specular ?? 0;
        uniforms.uShininess = panel.glassMaterial.shininess ?? 32;
        uniforms.uShadow = panel.glassMaterial.shadow ?? 0;
        const lightDir = panel.glassMaterial.lightDir ?? [0.5, 0.5, 1];
        uniforms.uLightDir[0] = lightDir[0];
        uniforms.uLightDir[1] = lightDir[1];
        uniforms.uLightDir[2] = lightDir[2];
        uniforms.uBlurSamples = panel.glassMaterial.blurSamples ?? 8;
        uniforms.uBlurSpread = panel.glassMaterial.blurSpread ?? 4;
        uniforms.uBlurAngle = (panel.glassMaterial.blurAngle ?? 0) * Math.PI / 180;
        uniforms.uBlurAnisotropy = panel.glassMaterial.blurAnisotropy ?? 0;
        uniforms.uBlurGamma = panel.glassMaterial.blurGamma ?? 1;
        uniforms.uAberrationR = panel.glassMaterial.aberrationR ?? 1;
        uniforms.uAberrationB = panel.glassMaterial.aberrationB ?? 1;
        uniforms.uAO = panel.glassMaterial.ao ?? 0;
        uniforms.uAORadius = panel.glassMaterial.aoRadius ?? 0.5;
        uniforms.uNoiseScale = panel.glassMaterial.noiseScale ?? 20;
        uniforms.uNoiseIntensity = panel.glassMaterial.noiseIntensity ?? 0;
        uniforms.uNoiseRotation = panel.glassMaterial.noiseRotation ?? 0;
        uniforms.uNoiseThreshold = panel.glassMaterial.noiseThreshold ?? 0;
        uniforms.uEdgeSupersampling = quality.edgeSupersampling ?? 1;
        uniforms.uEdgeSmoothWidth = panel.glassMaterial.edgeSmoothWidth ?? 0.15;
        uniforms.uEdgeContrast = panel.glassMaterial.edgeContrast ?? 0.7;
        uniforms.uEdgeAlphaFalloff = panel.glassMaterial.edgeAlphaFalloff ?? 1;
        uniforms.uEdgeMaskCutoff = panel.glassMaterial.edgeMaskCutoff ?? 0.001;
        uniforms.uEnableEdgeSmoothing = panel.glassMaterial.enableEdgeSmoothing === true ? 1 : 0;
        uniforms.uEnableContrastReduction = panel.glassMaterial.enableContrastReduction === true ? 1 : 0;
        uniforms.uEnableAlphaFalloff = panel.glassMaterial.enableAlphaFalloff === true ? 1 : 0;
        uniforms.uEnableTintOpacity = panel.glassMaterial.enableTintOpacity === true ? 1 : 0;
        uniforms.uEdgeBlur = panel.glassMaterial.edgeBlur ?? 0;
        uniforms.uGlassSupersampling = panel.glassMaterial.glassSupersampling ?? 1;
        uniforms.uPanelSize[0] = panel.scale.x;
        uniforms.uPanelSize[1] = panel.scale.y;
      }
    }

    const prevShader = panel.shader;
    panel.shader = this.refractShader as any;
    this.drawPanelToTarget(panel, this.accumRT);

    panel.shader = this.revealageShader as any;

    const revealResources = (this.revealageShader as any).resources;
    if (revealResources) {
      revealResources.uNormalMap = normal.source;

      const revealUniforms = revealResources.panelUniforms?.uniforms;
      if (revealUniforms) {
        revealUniforms.uPosition[0] = panel.position.x;
        revealUniforms.uPosition[1] = panel.position.y;
        revealUniforms.uScale[0] = panel.scale.x;
        revealUniforms.uScale[1] = panel.scale.y;
        revealUniforms.uResolution[0] = screenWidth;
        revealUniforms.uResolution[1] = screenHeight;
        revealUniforms.uOpacity = panel.glassMaterial.opacity;
      }
    }

    this.drawPanelToTarget(panel, this.revealRT);
    panel.shader = prevShader;
  }

  private renderContactShadows(panels: GlassPanel[], quality: RenderQualityOptions): void {
    if (!quality.enableContactShadows) return;
    for (const panel of panels) {
      if (!panel.sdfShadow) continue;
      this.shadowSprite.texture = panel.sdfShadow;
      this.shadowSprite.position.copyFrom(panel.position);
      this.shadowSprite.scale.copyFrom(panel.scale);
      this.shadowSprite.rotation = panel.rotation;
      this.shadowSprite.alpha = Math.min(panel.glassMaterial.opacity + 0.2, 0.9);
      // this.shadowSprite.state.blendMode = BLEND_MODES.MULTIPLY;
      this.renderer.render(this.shadowSprite);
    }
  }

  getCompositeDisplay(): Container | undefined {
    return this.compositeSprite;
  }

  private drawPanelToTarget(panel: GlassPanel, target: RenderTexture): void {
    const renderer = this.renderer;
    const gl = (renderer as any).gl as WebGL2RenderingContext;

    // Clear parent and add only this panel
    this.panelParent.removeChildren();
    this.panelParent.addChild(panel);

    // Update transforms for detached container in v8
    panel.updateLocalTransform();
    panel.worldTransform.copyFrom(panel.localTransform);

    // Use standard alpha blending
    if (gl) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    renderer.render({ container: this.panelParent, target, clear: false });

    // Reset blend state
    if (gl) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
  }

  private ensureCompositeTarget(width: number, height: number): void {
    const targetResolution = this.renderer.resolution;
    if (
      !this.compositeRT ||
      this.compositeRT.width !== width ||
      this.compositeRT.height !== height ||
      this.compositeRT.source.resolution !== targetResolution
    ) {
      this.compositeRT?.destroy(true);
      this.compositeRT = RenderTexture.create({
        width,
        height,
        resolution: targetResolution,
      });
      this.compositeSprite.texture = this.compositeRT;
    }
  }
}
