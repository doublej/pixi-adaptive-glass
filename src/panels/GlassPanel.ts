  import { Mesh, MeshGeometry, Shader, State } from 'pixi.js';
import type { Texture } from 'pixi.js';
import type { CapabilityTier, GlassMaterial, GlassPanelProps } from '../core/types.js';

let PANEL_COUNTER = 0;

// Use MeshGeometry which auto-maps to aPosition and aUV attributes
// Centered geometry (-0.5 to 0.5) - position is center, scale is size
const QUAD_GEOMETRY = new MeshGeometry({
  positions: new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
});

const BASIC_VERT = `
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;
uniform mat3 uTextureMatrix;
void main(void){
  vUv = aUV;
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
}
`;

const BASIC_FRAG = `
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;

export class GlassPanel extends Mesh {
  id: string;
  glassMaterial: GlassMaterial;
  normalMap?: Texture;
  dudvMap?: Texture;
  causticsAtlas?: Texture;
  sdfShadow?: Texture;
  private tier: CapabilityTier = 'webgl1';

  constructor(props: GlassPanelProps) {
    const state = State.for2d();
    state.culling = false; // Disable culling to avoid winding order issues

    super({
      geometry: props.geometry ?? QUAD_GEOMETRY,
      shader: Shader.from({
        gl: {
          vertex: BASIC_VERT,
          fragment: BASIC_FRAG,
        },
      }) as any,
      state,
    });
    this.id = props.id ?? `glass-panel-${++PANEL_COUNTER}`;
    this.glassMaterial = props.material;
    this.normalMap = props.normalMap;
    this.dudvMap = props.dudvMap;
    this.causticsAtlas = props.causticsAtlas;
    this.sdfShadow = props.sdfShadow;
    if (props.filters) {
      this.filters = props.filters;
    }
  }

  setMaterial(partial: Partial<GlassMaterial>): void {
    this.glassMaterial = { ...this.glassMaterial, ...partial };
  }

  setTextures(textures: Partial<Omit<GlassPanelProps, 'material' | 'geometry'>>): void {
    if (textures.normalMap) this.normalMap = textures.normalMap;
    if (textures.dudvMap) this.dudvMap = textures.dudvMap;
    if (textures.causticsAtlas) this.causticsAtlas = textures.causticsAtlas;
    if (textures.sdfShadow) this.sdfShadow = textures.sdfShadow;
  }

  setTier(tier: CapabilityTier): void {
    this.tier = tier;
  }

  getTier(): CapabilityTier {
    return this.tier;
  }
}
