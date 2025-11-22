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
  jfaDistanceFragment,
  jfaFloodFragment,
  jfaSeedFragment,
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

// Cache entry for JFA distance field per panel
interface JFACache {
  distanceField: RenderTexture;
  normalMapId: number; // Track which normal map was used
  normalMapUpdateId: number; // Track texture updates
  width: number;
  height: number;
}

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

  // JFA shaders and cache
  private readonly jfaSeedShader: Shader;
  private readonly jfaFloodShader: Shader;
  private readonly jfaDistanceShader: Shader;
  private jfaPingRT?: RenderTexture;
  private jfaPongRT?: RenderTexture;
  private readonly jfaCache: Map<GlassPanel, JFACache> = new Map();

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
      uGlassSupersampling: { value: 1, type: 'f32' },
      uEdgeIor: { value: new Float32Array([0, 0.15, 1, 1]), type: 'vec4<f32>' }, // rangeStart, rangeEnd, strength, enabled
      uPanelSize: { value: new Float32Array([200, 200]), type: 'vec2<f32>' },
      // Edge mask system
      uEdgeMaskCutoff: { value: 0.001, type: 'f32' },
      uEdgeMaskBlur: { value: 0, type: 'f32' },
      uEdgeMaskInvert: { value: 0, type: 'f32' },
      // Edge tactics: vec4(rangeStart, rangeEnd, strength, opacity)
      uEdgeSmoothing: { value: new Float32Array([0, 0.3, 1, 1]), type: 'vec4<f32>' },
      uEdgeContrast: { value: new Float32Array([0, 0.3, 0.7, 1]), type: 'vec4<f32>' },
      uEdgeAlpha: { value: new Float32Array([0, 0.2, 1, 1]), type: 'vec4<f32>' },
      uEdgeTint: { value: new Float32Array([0, 0.5, 0.5, 1]), type: 'vec4<f32>' },
      uEdgeDarken: { value: new Float32Array([0, 0.3, 0.3, 1]), type: 'vec4<f32>' },
      uEdgeDesaturate: { value: new Float32Array([0, 0.4, 0.5, 1]), type: 'vec4<f32>' },
      // Tactic enables
      uEnableSmoothing: { value: 0, type: 'f32' },
      uEnableContrast: { value: 0, type: 'f32' },
      uEnableAlpha: { value: 0, type: 'f32' },
      uEnableTint: { value: 0, type: 'f32' },
      uEnableDarken: { value: 0, type: 'f32' },
      uEnableDesaturate: { value: 0, type: 'f32' },
      uDebugMode: { value: 0, type: 'f32' },
    });
    this.refractShader = Shader.from({
      gl: { vertex: panelVertex, fragment: refractionFragment },
      resources: {
        uSceneColor: Texture.WHITE.source,
        uNormalMap: Texture.WHITE.source,
        uCausticsMap: Texture.WHITE.source,
        uDistanceField: Texture.WHITE.source,
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

    // JFA shaders
    const jfaSeedUniforms = new UniformGroup({
      uTexelSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    });
    this.jfaSeedShader = Shader.from({
      gl: { vertex: fullscreenVertex, fragment: jfaSeedFragment },
      resources: {
        uNormalMap: Texture.WHITE.source,
        jfaUniforms: jfaSeedUniforms,
      },
    });

    const jfaFloodUniforms = new UniformGroup({
      uTexelSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
      uStepSize: { value: 1, type: 'f32' },
    });
    this.jfaFloodShader = Shader.from({
      gl: { vertex: fullscreenVertex, fragment: jfaFloodFragment },
      resources: {
        uPrevPass: Texture.WHITE.source,
        jfaUniforms: jfaFloodUniforms,
      },
    });

    const jfaDistanceUniforms = new UniformGroup({
      uMaxDistance: { value: 0.15, type: 'f32' },
    });
    this.jfaDistanceShader = Shader.from({
      gl: { vertex: fullscreenVertex, fragment: jfaDistanceFragment },
      resources: {
        uSeedMap: Texture.WHITE.source,
        jfaUniforms: jfaDistanceUniforms,
      },
    });
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
    this.jfaPingRT?.destroy(true);
    this.jfaPongRT?.destroy(true);
    for (const cache of this.jfaCache.values()) {
      cache.distanceField.destroy(true);
    }
    this.jfaCache.clear();
  }

  // Compute JFA distance field for a panel's normal map
  private computeDistanceField(panel: GlassPanel): RenderTexture {
    const normalMap = panel.normalMap ?? Texture.WHITE;
    const width = normalMap.width;
    const height = normalMap.height;
    const normalMapId = (normalMap.source as any).uid ?? 0;
    const normalMapUpdateId = (normalMap.source as any)._updateID ?? (normalMap.source as any).updateId ?? 0;

    // Check cache
    const cached = this.jfaCache.get(panel);
    if (cached && cached.normalMapId === normalMapId && cached.normalMapUpdateId === normalMapUpdateId && cached.width === width && cached.height === height) {
      return cached.distanceField;
    }

    // Ensure ping-pong textures
    if (!this.jfaPingRT || this.jfaPingRT.width !== width || this.jfaPingRT.height !== height) {
      this.jfaPingRT?.destroy(true);
      this.jfaPongRT?.destroy(true);
      this.jfaPingRT = RenderTexture.create({ width, height, resolution: 1 });
      this.jfaPongRT = RenderTexture.create({ width, height, resolution: 1 });
    }

    // Create or reuse distance field texture
    let distanceField = cached?.distanceField;
    if (!distanceField || distanceField.width !== width || distanceField.height !== height) {
      distanceField?.destroy(true);
      distanceField = RenderTexture.create({ width, height, resolution: 1 });
    }

    const texelSize = [1 / width, 1 / height];

    // Step 1: Seed pass
    const seedResources = (this.jfaSeedShader as any).resources;
    seedResources.uNormalMap = normalMap.source;
    const seedUniforms = seedResources.jfaUniforms?.uniforms;
    if (seedUniforms) {
      seedUniforms.uTexelSize[0] = texelSize[0];
      seedUniforms.uTexelSize[1] = texelSize[1];
    }

    this.fullScreenQuad.shader = this.jfaSeedShader;
    this.fullScreenQuad.width = 1;
    this.fullScreenQuad.height = 1;
    this.fullScreenQuad.updateLocalTransform();
    this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform);
    this.renderer.render({ container: this.fullScreenQuad, target: this.jfaPingRT, clear: true });

    // Step 2: Flood passes (log2 iterations)
    const maxDim = Math.max(width, height);
    const passes = Math.ceil(Math.log2(maxDim));
    let readRT: RenderTexture = this.jfaPingRT!;
    let writeRT: RenderTexture = this.jfaPongRT!;

    const floodResources = (this.jfaFloodShader as any).resources;
    const floodUniforms = floodResources.jfaUniforms?.uniforms;

    for (let i = 0; i < passes; i++) {
      const stepSize = Math.pow(2, passes - i - 1);

      floodResources.uPrevPass = readRT.source;
      if (floodUniforms) {
        floodUniforms.uTexelSize[0] = texelSize[0];
        floodUniforms.uTexelSize[1] = texelSize[1];
        floodUniforms.uStepSize = stepSize;
      }

      this.fullScreenQuad.shader = this.jfaFloodShader;
      this.renderer.render({ container: this.fullScreenQuad, target: writeRT, clear: true });

      // Swap
      const temp = readRT;
      readRT = writeRT;
      writeRT = temp;
    }

    // Step 3: Distance pass
    const distResources = (this.jfaDistanceShader as any).resources;
    distResources.uSeedMap = readRT.source;
    const distUniforms = distResources.jfaUniforms?.uniforms;
    if (distUniforms) {
      distUniforms.uMaxDistance = 0.05; // Smaller = more detail in edge gradient
    }

    this.fullScreenQuad.shader = this.jfaDistanceShader;
    this.renderer.render({ container: this.fullScreenQuad, target: distanceField, clear: true });


    // Cache result
    this.jfaCache.set(panel, {
      distanceField,
      normalMapId,
      normalMapUpdateId,
      width,
      height,
    });

    return distanceField;
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

    // Compute JFA distance field for this panel
    const distanceField = this.computeDistanceField(panel);

    const resources = (this.refractShader as any).resources;
    if (resources) {
      resources.uSceneColor = sceneTarget.source;
      resources.uNormalMap = normal.source;
      resources.uCausticsMap = (panel.causticsAtlas ?? Texture.WHITE).source;
      resources.uDistanceField = distanceField.source;

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
        uniforms.uLightDir[0] = -lightDir[0];
        uniforms.uLightDir[1] = -lightDir[1];
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
        uniforms.uGlassSupersampling = panel.glassMaterial.glassSupersampling ?? 1;
        uniforms.uEdgeIor[0] = panel.glassMaterial.edgeIorRangeStart ?? 0;
        uniforms.uEdgeIor[1] = panel.glassMaterial.edgeIorRangeEnd ?? 0.15;
        uniforms.uEdgeIor[2] = panel.glassMaterial.edgeIorStrength ?? 1;
        uniforms.uEdgeIor[3] = panel.glassMaterial.edgeIorEnabled ? 1 : 0;
        uniforms.uPanelSize[0] = panel.scale.x;
        uniforms.uPanelSize[1] = panel.scale.y;

        // Edge mask system
        const edgeMask = panel.glassMaterial.edgeMask;
        if (edgeMask) {
          uniforms.uEdgeMaskCutoff = edgeMask.cutoff;
          uniforms.uEdgeMaskBlur = edgeMask.blur;
          uniforms.uEdgeMaskInvert = edgeMask.invert ? 1 : 0;

          // Set tactic uniforms
          const setTactic = (uniform: Float32Array, tactic: any) => {
            uniform[0] = tactic.rangeStart;
            uniform[1] = tactic.rangeEnd;
            uniform[2] = tactic.strength;
            uniform[3] = tactic.opacity;
          };

          setTactic(uniforms.uEdgeSmoothing, edgeMask.smoothing);
          setTactic(uniforms.uEdgeContrast, edgeMask.contrast);
          setTactic(uniforms.uEdgeAlpha, edgeMask.alpha);
          setTactic(uniforms.uEdgeTint, edgeMask.tint);
          setTactic(uniforms.uEdgeDarken, edgeMask.darken);
          setTactic(uniforms.uEdgeDesaturate, edgeMask.desaturate);

          uniforms.uEnableSmoothing = edgeMask.smoothing.enabled ? 1 : 0;
          uniforms.uEnableContrast = edgeMask.contrast.enabled ? 1 : 0;
          uniforms.uEnableAlpha = edgeMask.alpha.enabled ? 1 : 0;
          uniforms.uEnableTint = edgeMask.tint.enabled ? 1 : 0;
          uniforms.uEnableDarken = edgeMask.darken.enabled ? 1 : 0;
          uniforms.uEnableDesaturate = edgeMask.desaturate.enabled ? 1 : 0;
          uniforms.uDebugMode = (edgeMask as any).debugMode ?? 0;
        } else {
          // Legacy fallback
          uniforms.uEdgeMaskCutoff = panel.glassMaterial.edgeMaskCutoff ?? 0.001;
          uniforms.uEdgeMaskBlur = panel.glassMaterial.edgeBlur ?? 0;
          uniforms.uEdgeMaskInvert = 0;
          uniforms.uEnableSmoothing = 0;
          uniforms.uEnableContrast = 0;
          uniforms.uEnableAlpha = 0;
          uniforms.uEnableTint = 0;
          uniforms.uEnableDarken = 0;
          uniforms.uEnableDesaturate = 0;
        }
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
