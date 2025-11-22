import { Rectangle as ee, RenderTexture as U, MeshGeometry as W, Mesh as Y, State as $, Shader as B, Texture as b, Sprite as H, Filter as te, GlProgram as se, UniformGroup as _, Container as j, Graphics as ae, Text as ie } from "pixi.js";
class re {
  constructor(e) {
    this.gl = e;
  }
  run() {
    if (this.cached)
      return this.cached;
    const e = this.isWebGL2Context(this.gl), t = this.queryExtensions([
      "EXT_color_buffer_float",
      "OES_texture_float_linear",
      "OES_standard_derivatives",
      "EXT_disjoint_timer_query_webgl2",
      "EXT_disjoint_timer_query"
    ]), s = e && this.getMaxDrawBuffers() > 1 ? "webgl2" : "webgl1";
    return this.cached = {
      tier: s,
      maxDrawBuffers: this.getMaxDrawBuffers(),
      extensions: t
    }, this.cached;
  }
  queryExtensions(e) {
    return e.reduce((t, s) => (t[s] = !!this.gl.getExtension(s), t), {});
  }
  getMaxDrawBuffers() {
    const e = this.gl.getExtension("WEBGL_draw_buffers"), t = this.isWebGL2Context(this.gl) ? this.gl.MAX_DRAW_BUFFERS : e ? e.MAX_DRAW_BUFFERS_WEBGL : 0;
    return t ? this.gl.getParameter(t) ?? 1 : 1;
  }
  isWebGL2Context(e) {
    return typeof WebGL2RenderingContext < "u" && e instanceof WebGL2RenderingContext;
  }
}
const oe = {
  renderScale: 1,
  enableDispersion: !0,
  enableCaustics: !0,
  enableContactShadows: !0,
  maxBlurTaps: 9,
  edgeSupersampling: 1
}, ne = [
  { check: (r) => r.renderScale > 0.85, apply: (r) => {
    r.renderScale = 0.85;
  }, action: "scale-rt-0-85", reason: "Frame budget exceeded" },
  { check: (r) => r.renderScale > 0.7, apply: (r) => {
    r.renderScale = 0.7;
  }, action: "scale-rt-0-7", reason: "Severe perf drop" },
  { check: (r) => r.maxBlurTaps > 5, apply: (r) => {
    r.maxBlurTaps = 5;
  }, action: "reduce-blur", reason: "Sustained frame drops" },
  { check: (r) => r.enableDispersion, apply: (r) => {
    r.enableDispersion = !1;
  }, action: "disable-dispersion", reason: "Dispersion too expensive" },
  { check: (r) => r.enableCaustics || r.enableContactShadows, apply: (r) => {
    r.enableCaustics = !1, r.enableContactShadows = !1;
  }, action: "disable-caustics", reason: "Optional overlays disabled" }
];
class le {
  constructor(e = 100) {
    this.targetFrameMs = e, this.current = { ...oe }, this.telemetry = [], this.overrides = {};
  }
  getQuality() {
    return { ...this.current };
  }
  record(e) {
    this.telemetry.push(e), this.telemetry.length > 120 && this.telemetry.shift();
  }
  setOverrides(e) {
    this.overrides = { ...this.overrides, ...e }, this.current = { ...this.current, ...this.overrides };
  }
  getTelemetry() {
    return [...this.telemetry];
  }
  evaluate() {
    if (this.telemetry.length < 30) return;
    const e = this.telemetry.reduce((s, a) => s + a.cpuMs, 0) / this.telemetry.length, t = this.telemetry.reduce((s, a) => s + (a.gpuMs ?? a.cpuMs), 0) / this.telemetry.length;
    if (!(Math.max(e, t) <= this.targetFrameMs)) {
      for (const s of ne)
        if (s.check(this.current))
          return s.apply(this.current), { action: s.action, reason: s.reason };
    }
  }
}
class J {
  constructor(e, t) {
    this.renderer = e, this.useDepth = t, this.scale = 1, this.clearRect = new ee();
  }
  ensure(e, t, s) {
    const a = this.renderer.resolution * s;
    return (!this.handles || this.handles.sceneColor.width !== e || this.handles.sceneColor.height !== t || this.handles.sceneColor.source.resolution !== a) && (this.dispose(), this.handles = {
      sceneColor: U.create({
        width: e,
        height: t,
        resolution: a,
        scaleMode: "linear"
      }),
      sceneDepth: this.useDepth ? U.create({
        width: e,
        height: t,
        resolution: a,
        scaleMode: "nearest"
      }) : void 0
    }, this.scale = s), this.handles;
  }
  clearTargets() {
    if (!this.handles) return;
    this.clearRect.width = this.handles.sceneColor.width, this.clearRect.height = this.handles.sceneColor.height;
    const e = this.renderer;
    e.renderTarget.bind(this.handles.sceneColor);
    const t = e.gl;
    t.clearColor(0, 0, 0, 0), t.clear(t.COLOR_BUFFER_BIT), this.handles.sceneDepth && (e.renderTarget.bind(this.handles.sceneDepth), t.clearColor(1, 0, 0, 1), t.clearDepth(1), t.clear(t.DEPTH_BUFFER_BIT));
  }
  dispose() {
    var e, t, s;
    (e = this.handles) == null || e.sceneColor.destroy(!0), (s = (t = this.handles) == null ? void 0 : t.sceneDepth) == null || s.destroy(!0), this.handles = void 0;
  }
}
class ce {
  constructor() {
    this.listeners = {};
  }
  on(e, t) {
    let s = this.listeners[e];
    s || (s = /* @__PURE__ */ new Set(), this.listeners[e] = s), s.add(t);
  }
  off(e, t) {
    var s;
    (s = this.listeners[e]) == null || s.delete(t);
  }
  emit(e, t) {
    const s = this.listeners[e];
    if (s)
      for (const a of s)
        a(t);
  }
  removeAll() {
    var e;
    for (const t of Object.keys(this.listeners))
      (e = this.listeners[t]) == null || e.clear();
  }
}
const L = (r) => r, ue = {
  water() {
    return L({
      ior: 1.333,
      thickness: 0.6,
      roughness: 0.1,
      dispersion: 0.02,
      opacity: 1,
      tint: 10476031
    });
  },
  crownGlass() {
    return L({
      ior: 1.52,
      thickness: 0.8,
      roughness: 0.05,
      dispersion: 0.04,
      opacity: 1,
      tint: 16777215
    });
  },
  acrylic() {
    return L({
      ior: 1.49,
      thickness: 0.7,
      roughness: 0.12,
      dispersion: 0.01,
      opacity: 1,
      tint: 16250871
    });
  },
  clear() {
    return L({
      ior: 1.52,
      thickness: 0.8,
      roughness: 0.05,
      dispersion: 0.04,
      opacity: 1,
      tint: 16777215
    });
  },
  fromIOR(r) {
    const e = Math.min(Math.max(r, 1), 2);
    return L({
      ior: e,
      thickness: 0.75,
      roughness: 0.08,
      dispersion: (e - 1) * 0.05,
      opacity: 1,
      tint: 16777215
    });
  }
};
let de = 0;
const he = new W({
  positions: new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3])
}), fe = `
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
`, pe = `
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;
class me extends Y {
  constructor(e) {
    const t = $.for2d();
    t.culling = !1, super({
      geometry: e.geometry ?? he,
      shader: B.from({
        gl: {
          vertex: fe,
          fragment: pe
        }
      }),
      state: t
    }), this.tier = "webgl1", this.id = e.id ?? `glass-panel-${++de}`, this.glassMaterial = e.material, this.normalMap = e.normalMap, this.dudvMap = e.dudvMap, this.causticsAtlas = e.causticsAtlas, this.sdfShadow = e.sdfShadow, e.filters && (this.filters = e.filters);
  }
  setMaterial(e) {
    this.glassMaterial = { ...this.glassMaterial, ...e };
  }
  setTextures(e) {
    e.normalMap && (this.normalMap = e.normalMap), e.dudvMap && (this.dudvMap = e.dudvMap), e.causticsAtlas && (this.causticsAtlas = e.causticsAtlas), e.sdfShadow && (this.sdfShadow = e.sdfShadow);
  }
  setTier(e) {
    this.tier = e;
  }
  getTier() {
    return this.tier;
  }
}
function q(r, e) {
  return r / e;
}
function ge(r) {
  return Math.sqrt(Math.max(0, 2 * r - r * r));
}
function ve(r) {
  const e = Math.sqrt(Math.max(1e-4, 2 * r - r * r));
  return (1 - r) / e;
}
function ye(r) {
  const e = 1 - Math.pow(1 - r, 3);
  return Math.pow(Math.max(0, e), 1 / 3);
}
function be(r) {
  const e = 1 - Math.pow(1 - r, 3);
  return e <= 1e-4 ? 0 : Math.pow(1 - r, 2) / Math.pow(e, 2 / 3);
}
function ze(r) {
  const e = Math.max(0, Math.min(1, r));
  return e * e * e * (e * (e * 6 - 15) + 10);
}
function Q(r, e) {
  switch (e) {
    case "circle":
      return { height: ge(r), derivative: ve(r) };
    case "squircle":
      return { height: ye(r), derivative: be(r) };
    case "concave": {
      const t = r * r, s = 2 * r;
      return { height: t, derivative: s };
    }
    case "lip": {
      const t = r < 0.5 ? 2 * r * r : 1 - 2 * (1 - r) * (1 - r), s = r < 0.5 ? 4 * r : 4 * (1 - r);
      return { height: t, derivative: s };
    }
    case "dome": {
      const t = 1 - r, s = Math.sqrt(Math.max(0, 1 - t * t)), a = t > 1e-3 ? t / s : 0;
      return { height: s, derivative: a };
    }
    case "wave": {
      const t = (1 - Math.cos(r * Math.PI)) / 2, s = Math.PI * Math.sin(r * Math.PI) / 2;
      return { height: t, derivative: s };
    }
    case "flat":
      return { height: 1, derivative: 0 };
    case "ramp":
      return { height: r, derivative: 1 };
  }
}
function _e(r, e = 0, t = 32) {
  const s = e / 2, a = 1 + t, l = new Float32Array(a * 2), n = new Float32Array(a * 2), c = r * 2 + e, i = r * 2;
  l[0] = 0, l[1] = 0, n[0] = 0.5, n[1] = 0.5;
  for (let h = 0; h < t; h++) {
    const f = h / t * Math.PI * 2 - Math.PI / 2, p = (h + 1) * 2;
    let m, o;
    f >= -Math.PI / 2 && f <= Math.PI / 2 ? (m = Math.cos(f) * r + s, o = Math.sin(f) * r) : (m = Math.cos(f) * r - s, o = Math.sin(f) * r), l[p] = m / c, l[p + 1] = o / i, n[p] = m / c + 0.5, n[p + 1] = o / i + 0.5;
  }
  const u = t, d = new Uint32Array(u * 3);
  for (let h = 0; h < t; h++) {
    const f = h * 3;
    d[f] = 0, d[f + 1] = h + 1, d[f + 2] = (h + 1) % t + 1;
  }
  return new W({
    positions: l,
    uvs: n,
    indices: d
  });
}
function Le(r, e, t, s = 32) {
  const a = r.getAttribute("aPosition"), l = r.getAttribute("aUV");
  if (!a || !l) return;
  const n = a.buffer.data, c = l.buffer.data, i = t / 2, u = e * 2 + t, d = e * 2;
  for (let h = 0; h < s; h++) {
    const f = h / s * Math.PI * 2 - Math.PI / 2, p = (h + 1) * 2;
    let m, o;
    f >= -Math.PI / 2 && f <= Math.PI / 2 ? (m = Math.cos(f) * e + i, o = Math.sin(f) * e) : (m = Math.cos(f) * e - i, o = Math.sin(f) * e), n[p] = m / u, n[p + 1] = o / d, c[p] = m / u + 0.5, c[p + 1] = o / d + 0.5;
  }
  a.buffer.update(), l.buffer.update();
}
function Ve(r, e, t, s, a, l = !1) {
  const n = Math.ceil(r), c = Math.ceil(e), i = new Uint8Array(n * c * 4), u = c / 2, d = t / 2;
  for (let h = 0; h < c; h++)
    for (let f = 0; f < n; f++) {
      let p = 0, m = 0, o = 1, R = 255;
      const S = (n - 1) / 2, w = (c - 1) / 2, g = f - S, v = h - w;
      let y = 0, M = 0, E = 0;
      const P = Math.abs(g), k = Math.abs(v);
      if (P <= d)
        y = u - k, M = 0, E = v > 0 ? 1 : -1;
      else {
        const I = g > 0 ? d : -d, C = g - I, O = v, F = Math.sqrt(C * C + O * O);
        y = u - F, F > 1e-3 && (M = C / F, E = O / F);
      }
      if (y < 0 && (R = 0), s > 0 && y < s && y >= 0) {
        const I = q(y, s), { derivative: C } = Q(I, a);
        p = M * C * 0.5, m = E * C * 0.5, l && (p = -p, m = -m);
      }
      const x = Math.sqrt(p * p + m * m + o * o);
      p /= x, m /= x, o /= x;
      const D = (h * n + f) * 4;
      i[D] = (p * 0.5 + 0.5) * 255 | 0, i[D + 1] = (m * 0.5 + 0.5) * 255 | 0, i[D + 2] = (o * 0.5 + 0.5) * 255 | 0, i[D + 3] = R;
    }
  return b.from({
    resource: i,
    width: n,
    height: c
  });
}
function K(r) {
  return [
    (r >> 16 & 255) / 255,
    (r >> 8 & 255) / 255,
    (r & 255) / 255
  ];
}
function z(r) {
  return {
    enabled: !1,
    rangeStart: 0,
    rangeEnd: 0.3,
    strength: 1,
    opacity: 1,
    ...r
  };
}
function Ge(r) {
  return {
    cutoff: 1e-3,
    blur: 0,
    invert: !1,
    smoothing: z({ rangeEnd: 0.3, strength: 1 }),
    contrast: z({ rangeEnd: 0.3, strength: 0.7 }),
    alpha: z({ rangeEnd: 0.2, strength: 1 }),
    tint: z({ rangeEnd: 0.5, strength: 0.5 }),
    darken: z({ rangeEnd: 0.3, strength: 0.3 }),
    desaturate: z({ rangeEnd: 0.4, strength: 0.5 }),
    ...r
  };
}
class Me extends te {
  constructor() {
    const e = `
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
      glProgram: new se({
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
        fragment: e
      }),
      resources: {
        uSceneColor: b.WHITE.source,
        uNormalMap: b.WHITE.source,
        uniforms: {
          uInvResolution: { value: [1, 1], type: "vec2<f32>" },
          uDispersion: { value: 0, type: "f32" },
          uRoughness: { value: 0, type: "f32" },
          uDisplacementScale: { value: 0.01, type: "f32" },
          uTint: { value: [1, 1, 1], type: "vec3<f32>" },
          uOpacity: { value: 1, type: "f32" },
          uEnableDispersion: { value: 0, type: "f32" }
          // boolean as float
        }
      }
    });
  }
}
class Se {
  constructor(e) {
    this.renderer = e, this.id = "webgl1", this.filter = new Me(), this.rtManager = new J(e, !1), this.blitSprite = new H(b.WHITE);
  }
  setup() {
  }
  render(e) {
    const { renderer: t, panels: s, quality: a, drawOpaqueScene: l } = e, n = this.rtManager.ensure(
      t.screen.width,
      t.screen.height,
      a.renderScale
    );
    l(n.sceneColor), this.blitSprite.texture = n.sceneColor, this.blitSprite.width = t.screen.width, this.blitSprite.height = t.screen.height, t.render({ container: this.blitSprite, clear: !0 });
    const c = [...s].sort((i, u) => (i.zIndex ?? 0) - (u.zIndex ?? 0));
    for (const i of c)
      this.applyFilter(i, n.sceneColor, a), t.render({ container: i });
  }
  dispose() {
    this.rtManager.dispose();
  }
  applyFilter(e, t, s) {
    if (!(!!(e.normalMap || e.dudvMap) || e.glassMaterial.dispersion > 1e-3 || e.glassMaterial.roughness > 1e-3)) {
      e.filters = null;
      return;
    }
    const l = this.filter.resources;
    l.uSceneColor = t.source, l.uNormalMap = (e.normalMap ?? e.dudvMap ?? b.WHITE).source;
    const n = l.uniforms;
    n.uInvResolution = [1 / t.width, 1 / t.height], n.uDispersion = e.glassMaterial.dispersion, n.uRoughness = e.glassMaterial.roughness, n.uDisplacementScale = e.glassMaterial.thickness * 0.1, n.uTint = K(e.glassMaterial.tint ?? 16777215), n.uOpacity = e.glassMaterial.opacity, n.uEnableDispersion = s.enableDispersion && e.glassMaterial.dispersion > 1e-3 ? 1 : 0, e.filters = [this.filter];
  }
}
const G = `
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`, Ee = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uNormalMap;
uniform vec2 uTexelSize;

void main() {
  float center = texture2D(uNormalMap, vUv).a;

  // Check if this is an edge pixel (shape mask transitions)
  bool isEdge = false;

  // Sample 8 neighbors for better edge detection
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;
      vec2 offset = vec2(float(dx), float(dy)) * uTexelSize;
      float neighbor = texture2D(uNormalMap, vUv + offset).a;

      // Edge if center is inside shape but any neighbor is outside
      if (center > 0.5 && neighbor < 0.5) {
        isEdge = true;
        break;
      }
    }
    if (isEdge) break;
  }

  // Also check UV boundaries as edges
  if (center > 0.5) {
    if (vUv.x < uTexelSize.x || vUv.x > 1.0 - uTexelSize.x ||
        vUv.y < uTexelSize.y || vUv.y > 1.0 - uTexelSize.y) {
      isEdge = true;
    }
  }

  if (isEdge) {
    // Store own position as seed (normalized 0-1)
    gl_FragColor = vec4(vUv, 0.0, 1.0);
  } else if (center > 0.5) {
    // Inside shape but not edge - mark as needing distance calc
    gl_FragColor = vec4(-1.0, -1.0, 0.0, 1.0);
  } else {
    // Outside shape
    gl_FragColor = vec4(-1.0, -1.0, 0.0, 0.0);
  }
}
`, De = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrevPass;
uniform vec2 uTexelSize;
uniform float uStepSize;

void main() {
  vec4 bestSeed = texture2D(uPrevPass, vUv);
  float bestDist = 999999.0;

  // Calculate distance to current best seed
  if (bestSeed.x >= 0.0) {
    vec2 diff = vUv - bestSeed.xy;
    bestDist = dot(diff, diff);
  }

  // Check 8 neighbors at current step size
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;

      vec2 neighborUV = vUv + vec2(float(dx), float(dy)) * uStepSize * uTexelSize;

      // Bounds check
      if (neighborUV.x < 0.0 || neighborUV.x > 1.0 || neighborUV.y < 0.0 || neighborUV.y > 1.0) {
        continue;
      }

      vec4 neighborSeed = texture2D(uPrevPass, neighborUV);

      // If neighbor has a valid seed
      if (neighborSeed.x >= 0.0) {
        vec2 diff = vUv - neighborSeed.xy;
        float dist = dot(diff, diff);

        if (dist < bestDist) {
          bestDist = dist;
          bestSeed = neighborSeed;
        }
      }
    }
  }

  gl_FragColor = bestSeed;
}
`, we = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSeedMap;
uniform float uMaxDistance;

void main() {
  vec4 seed = texture2D(uSeedMap, vUv);

  if (seed.x < 0.0) {
    // No seed found (outside shape or error)
    gl_FragColor = vec4(0.0, 0.0, 0.0, seed.a);
    return;
  }

  // Calculate actual distance
  vec2 diff = vUv - seed.xy;
  float dist = length(diff);

  // Normalize to 0-1 range based on max distance
  float normalizedDist = clamp(dist / uMaxDistance, 0.0, 1.0);

  gl_FragColor = vec4(normalizedDist, normalizedDist, normalizedDist, seed.a);
}
`, X = `
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
uniform vec2 uPosition;
uniform vec2 uScale;
uniform vec2 uResolution;
void main(void){
  vUv = aUV;
  vec2 worldPos = aPosition * uScale + uPosition;
  vec2 clipPos = (worldPos / uResolution) * 2.0 - 1.0;
  gl_Position = vec4(clipPos, 0.0, 1.0);
}
`, xe = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSceneColor;
uniform sampler2D uNormalMap;
uniform sampler2D uCausticsMap;
uniform sampler2D uDistanceField;
uniform vec2 uInvResolution;
uniform float uIOR;
uniform float uThickness;
uniform float uDispersion;
uniform float uRoughness;
uniform float uOpacity;
uniform bool uEnableDispersion;
uniform bool uEnableCaustics;
uniform vec3 uTint;
uniform float uSpecular;
uniform float uShininess;
uniform float uShadow;
uniform vec3 uLightDir;
uniform float uBlurSamples;
uniform float uBlurSpread;
uniform float uBlurAngle;
uniform float uBlurAnisotropy;
uniform float uBlurGamma;
uniform float uAberrationR;
uniform float uAberrationB;
uniform float uAO;
uniform float uAORadius;
uniform float uNoiseScale;
uniform float uNoiseIntensity;
uniform float uNoiseRotation;
uniform float uNoiseThreshold;
uniform float uEdgeSupersampling;
uniform float uGlassSupersampling;
uniform vec4 uEdgeIor; // rangeStart, rangeEnd, strength, enabled
uniform vec2 uPanelSize;

// Edge mask system
uniform float uEdgeMaskCutoff;
uniform float uEdgeMaskBlur;
uniform bool uEdgeMaskInvert;

// Edge tactics: vec4(rangeStart, rangeEnd, strength, opacity)
uniform vec4 uEdgeSmoothing;
uniform vec4 uEdgeContrast;
uniform vec4 uEdgeAlpha;
uniform vec4 uEdgeTint;
uniform vec4 uEdgeDarken;
uniform vec4 uEdgeDesaturate;

// Tactic enable flags
uniform bool uEnableSmoothing;
uniform bool uEnableContrast;
uniform bool uEnableAlpha;
uniform bool uEnableTint;
uniform bool uEnableDarken;
uniform bool uEnableDesaturate;
// Debug mode: 0=off, 1=edgeDist, 2=shapeMask, 3=normals
uniform float uDebugMode;

// Simple value noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec2 rotateUV(vec2 uv, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
}

vec3 sampleScene(vec2 uv){
  return texture2D(uSceneColor, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
}

vec3 sampleDispersion(vec2 baseUV, vec2 offset){
  if(!uEnableDispersion){
    return sampleScene(baseUV + offset);
  }
  vec3 result;
  result.r = sampleScene(baseUV + offset * (1.0 + uDispersion * uAberrationR)).r;
  result.g = sampleScene(baseUV + offset).g;
  result.b = sampleScene(baseUV + offset * (1.0 - uDispersion * uAberrationB)).b;
  return result;
}

vec3 sampleFrostedColor(vec2 baseUV, vec2 offset){
  float radius = uRoughness * uBlurSpread;
  vec3 accum = vec3(0.0);
  float totalWeight = 0.0;
  int samples = int(uBlurSamples);

  // Golden angle spiral for better sample distribution
  float goldenAngle = 2.39996323;

  // Directional blur rotation matrix
  float ca = cos(uBlurAngle);
  float sa = sin(uBlurAngle);

  for(int i=0;i<32;i++){
    if(i >= samples) break;

    // Normalized distance from center (0 to 1)
    float t = float(i) / float(samples - 1);

    // Apply gamma curve to sample distribution
    float curvedT = pow(t, uBlurGamma);
    float r = curvedT * radius;

    float angle = float(i) * goldenAngle;
    vec2 dir = vec2(cos(angle), sin(angle));

    // Apply anisotropy (stretch in one direction)
    if(uBlurAnisotropy > 0.001){
      // Rotate to blur angle, apply stretch, rotate back
      vec2 rotated = vec2(ca * dir.x + sa * dir.y, -sa * dir.x + ca * dir.y);
      rotated.y *= (1.0 - uBlurAnisotropy);
      dir = vec2(ca * rotated.x - sa * rotated.y, sa * rotated.x + ca * rotated.y);
    }

    vec2 sampleOffset = dir * r * uInvResolution;

    // Weight samples by distance (softer falloff)
    float w = 1.0 - curvedT * 0.5;
    accum += sampleDispersion(baseUV, offset + sampleOffset) * w;
    totalWeight += w;
  }
  return accum / max(totalWeight, 1.0);
}

// Apply a tactic based on edge mask value
// Returns a factor in [0, 1] based on mask position within tactic range
// mask: 0 at edge, 1 at center
// rangeStart/rangeEnd: define the mask region where effect applies (0=edge, 1=center)
float applyTactic(vec4 tactic, float mask) {
  float rangeStart = tactic.x;
  float rangeEnd = tactic.y;
  float strength = tactic.z;
  float opacity = tactic.w;

  // Effect is full (1.0) when mask < rangeStart
  // Effect fades to 0 as mask approaches rangeEnd
  // Effect is 0 when mask > rangeEnd
  float t = 1.0 - smoothstep(rangeStart, rangeEnd, mask);

  // Apply strength and opacity
  return t * strength * opacity;
}

// Calculate edge distance mask from shape mask (0 at edges, 1 at center)
// Uses sampling to find distance to nearest edge of the shape
float calculateEdgeMask(vec2 uv, sampler2D normalMap) {
  // Sample in multiple directions to find distance to edge
  float minDist = 1.0;

  // Check 8 directions for coverage
  for (int i = 0; i < 8; i++) {
    float angle = float(i) * 0.785398; // PI/4
    vec2 dir = vec2(cos(angle), sin(angle));

    // March along direction with fine steps (0-30% of distance to center)
    for (int step = 1; step <= 512; step++) {
      float t = float(step) / 512.0 * 0.15; // Max 0.15 in UV space (30% of 0.5)
      vec2 sampleUV = uv + dir * t;

      // Check bounds
      if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
        minDist = min(minDist, t);
        break;
      }

      // Check shape mask
      float mask = texture2D(normalMap, sampleUV).a;
      if (mask < 0.5) {
        minDist = min(minDist, t);
        break;
      }
    }
  }

  // Normalize to 0-1 range (0 at edge, 1 when dist >= 0.15)
  return clamp(minDist / 0.15, 0.0, 1.0);
}

void main(){
  vec2 screenUV = gl_FragCoord.xy * uInvResolution;

  vec4 normalSample = texture2D(uNormalMap, vUv);
  float shapeMask = normalSample.a;

  // Discard pixels outside the shape (border radius) - skip when in debug mode
  if (shapeMask < 0.5 && uDebugMode < 0.5) {
    discard;
  }

  // Get edge distance from pre-computed JFA distance field (0 at edges, 1 at center)
  float edgeDist = texture2D(uDistanceField, vUv).r;

  // Optionally blur the edge distance
  if (uEdgeMaskBlur > 0.0) {
    float blurredDist = 0.0;
    float blurWeight = 0.0;
    float blurSize = uEdgeMaskBlur * 0.01;
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 offset = vec2(float(x), float(y)) * blurSize;
        float sampleDist = texture2D(uDistanceField, vUv + offset).r;
        float weight = 1.0 - length(vec2(float(x), float(y))) * 0.2;
        blurredDist += sampleDist * weight;
        blurWeight += weight;
      }
    }
    edgeDist = blurredDist / blurWeight;
  }

  // Optionally invert the edge distance
  if (uEdgeMaskInvert) {
    edgeDist = 1.0 - edgeDist;
  }

  // Debug modes (early exit)
  if (uDebugMode > 0.5) {
    if (uDebugMode < 1.5) {
      // Mode 1: Edge distance (black at edges, white at center)
      gl_FragColor = vec4(vec3(edgeDist), 1.0);
    } else if (uDebugMode < 2.5) {
      // Mode 2: Shape mask (border radius alpha)
      gl_FragColor = vec4(vec3(shapeMask), 1.0);
    } else {
      // Mode 3: Normal map visualization
      gl_FragColor = vec4(normalSample.rgb, 1.0);
    }
    return;
  }

  // Simple refraction offset based on normal map
  vec2 normal = normalSample.xy * 2.0 - 1.0;

  // Calculate edge factors for each tactic
  float smoothingFactor = uEnableSmoothing ? applyTactic(uEdgeSmoothing, edgeDist) : 0.0;
  float contrastFactor = uEnableContrast ? applyTactic(uEdgeContrast, edgeDist) : 0.0;
  float alphaFactor = uEnableAlpha ? applyTactic(uEdgeAlpha, edgeDist) : 0.0;
  float tintFactor = uEnableTint ? applyTactic(uEdgeTint, edgeDist) : 0.0;
  float darkenFactor = uEnableDarken ? applyTactic(uEdgeDarken, edgeDist) : 0.0;
  float desaturateFactor = uEnableDesaturate ? applyTactic(uEdgeDesaturate, edgeDist) : 0.0;

  // Apply noise distortion to normal (anchored to container via vUv)
  if (uNoiseIntensity > 0.001) {
    vec2 noiseUV = rotateUV(vUv * uNoiseScale, uNoiseRotation * 3.14159 / 180.0);
    float n = valueNoise(noiseUV);
    float n2 = valueNoise(noiseUV + vec2(100.0, 100.0));
    // Apply threshold
    n = smoothstep(uNoiseThreshold, 1.0, n) * (1.0 - uNoiseThreshold) + n * uNoiseThreshold;
    n2 = smoothstep(uNoiseThreshold, 1.0, n2) * (1.0 - uNoiseThreshold) + n2 * uNoiseThreshold;
    vec2 noiseNormal = (vec2(n, n2) - 0.5) * 2.0 * uNoiseIntensity;
    normal += noiseNormal;
  }

  // Attenuate IOR effect at edges to prevent harsh distortion
  float effectiveIOR = uIOR;
  if (uEdgeIor.w > 0.5) {
    // Apply tactic: reduce IOR at edges based on range and strength
    float iorFactor = 1.0 - smoothstep(uEdgeIor.x, uEdgeIor.y, edgeDist);
    effectiveIOR = mix(uIOR, 1.0, iorFactor * uEdgeIor.z);
  }
  vec2 offset = normal * uThickness * 0.1 * (effectiveIOR - 1.0);

  vec3 refracted;
  if (uGlassSupersampling > 1.0) {
    // Supersample the entire glass panel
    vec3 ssColor = vec3(0.0);
    int samples = int(uGlassSupersampling * uGlassSupersampling);
    float ssStep = 1.0 / uGlassSupersampling;
    int sampleIdx = 0;
    for (int x = 0; x < 4; x++) {
      if (x >= int(uGlassSupersampling)) break;
      for (int y = 0; y < 4; y++) {
        if (y >= int(uGlassSupersampling)) break;
        vec2 ssOffset = (vec2(float(x), float(y)) * ssStep - 0.5 + ssStep * 0.5) * uInvResolution;
        ssColor += sampleFrostedColor(screenUV + ssOffset, offset);
        sampleIdx++;
      }
    }
    refracted = ssColor / float(sampleIdx);
  } else {
    refracted = sampleFrostedColor(screenUV, offset);
  }
  // Apply tint as color mix instead of multiply to preserve visibility
  float tintStrength = 0.3;
  refracted = mix(refracted, refracted * uTint + uTint * 0.1, tintStrength);

  // Calculate lighting from normal map (now includes noise)
  vec3 N = normalize(vec3(normal, normalSample.b * 2.0 - 1.0));
  float NdotL = max(0.0, dot(N, normalize(uLightDir)));

  // Specular highlight (Blinn-Phong)
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfDir = normalize(normalize(uLightDir) + viewDir);
  float spec = pow(max(0.0, dot(N, halfDir)), uShininess) * uSpecular;

  // Shadow from normal facing away from light
  float shadowFactor = 1.0 - uShadow * (1.0 - NdotL);

  // Ambient occlusion based on normal length (darker at edges/outside)
  float normalDist = length(normal);
  float aoFactor = 1.0 - uAO * smoothstep(0.0, uAORadius, normalDist);

  // Apply lighting
  refracted = refracted * shadowFactor * aoFactor + vec3(spec);

  // Apply modular edge tactics

  // Smoothing: reduce sharpness at edges by blending toward grey
  if (uEnableSmoothing && smoothingFactor > 0.0) {
    float lum = dot(refracted, vec3(0.299, 0.587, 0.114));
    refracted = mix(refracted, vec3(lum), smoothingFactor * 0.5);
  }

  // Contrast reduction at edges
  if (uEnableContrast && contrastFactor > 0.0) {
    float contrastMult = 1.0 - contrastFactor * 0.5;
    refracted *= contrastMult;
  }

  // Darken edges (vignette effect)
  if (uEnableDarken && darkenFactor > 0.0) {
    refracted *= (1.0 - darkenFactor * 0.7);
  }

  // Desaturate edges
  if (uEnableDesaturate && desaturateFactor > 0.0) {
    float luma = dot(refracted, vec3(0.299, 0.587, 0.114));
    refracted = mix(refracted, vec3(luma), desaturateFactor);
  }

  // Tint opacity at edges
  if (uEnableTint && tintFactor > 0.0) {
    refracted = mix(refracted, refracted * uTint, tintFactor);
  }

  // Alpha falloff at edges
  float finalAlpha = 1.0;
  if (uEnableAlpha && alphaFactor > 0.0) {
    finalAlpha = 1.0 - alphaFactor;
  }

  gl_FragColor = vec4(refracted, finalAlpha);
}
`, Te = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uNormalMap;
uniform float uOpacity;
void main(){
  vec4 normalSample = texture2D(uNormalMap, vUv);
  float mask = normalSample.a;

  // Discard pixels outside the masked area (border radius)
  if (mask < 0.01) {
    discard;
  }

  float alpha = uOpacity * mask;
  float revealage = exp(-3.0 * alpha);
  gl_FragColor = vec4(revealage);
}
`, Re = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uSceneColor;
uniform sampler2D uAccum;
uniform sampler2D uReveal;
void main(){
  vec4 accum = texture2D(uAccum, vUv);
  vec3 scene = texture2D(uSceneColor, vUv).rgb;

  // Simple alpha blend: accum.a is opacity
  vec3 result = mix(scene, accum.rgb, accum.a);
  gl_FragColor = vec4(result, 1.0);
}
`, Ce = new W({
  positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3])
});
class Ae {
  constructor(e, t) {
    this.renderer = e, this.id = "webgl2", this.jfaCache = /* @__PURE__ */ new Map(), this.rtManager = new J(e, t);
    const s = new _({
      uPosition: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uScale: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uResolution: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uInvResolution: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uIOR: { value: 1, type: "f32" },
      uThickness: { value: 1, type: "f32" },
      uDispersion: { value: 0, type: "f32" },
      uRoughness: { value: 0, type: "f32" },
      uOpacity: { value: 1, type: "f32" },
      uEnableDispersion: { value: 0, type: "f32" },
      uEnableCaustics: { value: 0, type: "f32" },
      uTint: { value: new Float32Array([1, 1, 1]), type: "vec3<f32>" },
      uSpecular: { value: 0, type: "f32" },
      uShininess: { value: 32, type: "f32" },
      uShadow: { value: 0, type: "f32" },
      uLightDir: { value: new Float32Array([0.5, 0.5, 1]), type: "vec3<f32>" },
      uBlurSamples: { value: 8, type: "f32" },
      uBlurSpread: { value: 4, type: "f32" },
      uBlurAngle: { value: 0, type: "f32" },
      uBlurAnisotropy: { value: 0, type: "f32" },
      uBlurGamma: { value: 1, type: "f32" },
      uAberrationR: { value: 1, type: "f32" },
      uAberrationB: { value: 1, type: "f32" },
      uAO: { value: 0, type: "f32" },
      uAORadius: { value: 0.5, type: "f32" },
      uNoiseScale: { value: 20, type: "f32" },
      uNoiseIntensity: { value: 0, type: "f32" },
      uNoiseRotation: { value: 0, type: "f32" },
      uNoiseThreshold: { value: 0, type: "f32" },
      uEdgeSupersampling: { value: 1, type: "f32" },
      uGlassSupersampling: { value: 1, type: "f32" },
      uEdgeIor: { value: new Float32Array([0, 0.15, 1, 1]), type: "vec4<f32>" },
      // rangeStart, rangeEnd, strength, enabled
      uPanelSize: { value: new Float32Array([200, 200]), type: "vec2<f32>" },
      // Edge mask system
      uEdgeMaskCutoff: { value: 1e-3, type: "f32" },
      uEdgeMaskBlur: { value: 0, type: "f32" },
      uEdgeMaskInvert: { value: 0, type: "f32" },
      // Edge tactics: vec4(rangeStart, rangeEnd, strength, opacity)
      uEdgeSmoothing: { value: new Float32Array([0, 0.3, 1, 1]), type: "vec4<f32>" },
      uEdgeContrast: { value: new Float32Array([0, 0.3, 0.7, 1]), type: "vec4<f32>" },
      uEdgeAlpha: { value: new Float32Array([0, 0.2, 1, 1]), type: "vec4<f32>" },
      uEdgeTint: { value: new Float32Array([0, 0.5, 0.5, 1]), type: "vec4<f32>" },
      uEdgeDarken: { value: new Float32Array([0, 0.3, 0.3, 1]), type: "vec4<f32>" },
      uEdgeDesaturate: { value: new Float32Array([0, 0.4, 0.5, 1]), type: "vec4<f32>" },
      // Tactic enables
      uEnableSmoothing: { value: 0, type: "f32" },
      uEnableContrast: { value: 0, type: "f32" },
      uEnableAlpha: { value: 0, type: "f32" },
      uEnableTint: { value: 0, type: "f32" },
      uEnableDarken: { value: 0, type: "f32" },
      uEnableDesaturate: { value: 0, type: "f32" },
      uDebugMode: { value: 0, type: "f32" }
    });
    this.refractShader = B.from({
      gl: { vertex: X, fragment: xe },
      resources: {
        uSceneColor: b.WHITE.source,
        uNormalMap: b.WHITE.source,
        uCausticsMap: b.WHITE.source,
        uDistanceField: b.WHITE.source,
        panelUniforms: s
      }
    });
    const a = new _({
      uPosition: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uScale: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uResolution: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uOpacity: { value: 1, type: "f32" }
    });
    this.revealageShader = B.from({
      gl: { vertex: X, fragment: Te },
      resources: {
        uNormalMap: b.WHITE.source,
        panelUniforms: a
      }
    }), this.compositeShader = B.from({
      gl: { vertex: G, fragment: Re },
      resources: {
        uSceneColor: b.WHITE.source,
        uAccum: b.WHITE.source,
        uReveal: b.WHITE.source
      }
    }), this.fullScreenQuad = new Y({
      geometry: Ce,
      shader: this.compositeShader
    }), this.fullScreenQuad.state = $.for2d(), this.fullScreenQuad.state.culling = !1, this.shadowSprite = new H(b.WHITE), this.panelParent = new j(), this.panelParent.alpha = 1, this.compositeSprite = new H(b.EMPTY), this.compositeSprite.position.set(0, 0), this.compositeSprite.visible = !0, this.compositeSprite.alpha = 1, this.compositeSprite.zIndex = 9999;
    const l = new _({
      uTexelSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" }
    });
    this.jfaSeedShader = B.from({
      gl: { vertex: G, fragment: Ee },
      resources: {
        uNormalMap: b.WHITE.source,
        jfaUniforms: l
      }
    });
    const n = new _({
      uTexelSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uStepSize: { value: 1, type: "f32" }
    });
    this.jfaFloodShader = B.from({
      gl: { vertex: G, fragment: De },
      resources: {
        uPrevPass: b.WHITE.source,
        jfaUniforms: n
      }
    });
    const c = new _({
      uMaxDistance: { value: 0.15, type: "f32" }
    });
    this.jfaDistanceShader = B.from({
      gl: { vertex: G, fragment: we },
      resources: {
        uSeedMap: b.WHITE.source,
        jfaUniforms: c
      }
    });
  }
  setup() {
  }
  render(e) {
    var u, d;
    const { renderer: t, panels: s, quality: a, drawOpaqueScene: l } = e, n = t.screen.width, c = t.screen.height, i = this.rtManager.ensure(n, c, a.renderScale);
    this.ensureAccumTargets(n, c), this.ensureCompositeTarget(n, c), l(i.sceneColor), this.clearTarget(this.accumRT, 0, 0, 0, 0), this.clearTarget(this.revealRT, 1, 1, 1, 1);
    for (const h of s)
      this.renderPanel(h, a, i.sceneColor);
    this.fullScreenQuad.shader = this.compositeShader, this.compositeShader.resources.uSceneColor = i.sceneColor.source, this.compositeShader.resources.uAccum = (u = this.accumRT) == null ? void 0 : u.source, this.compositeShader.resources.uReveal = (d = this.revealRT) == null ? void 0 : d.source, this.fullScreenQuad.width = t.screen.width, this.fullScreenQuad.height = t.screen.height, this.fullScreenQuad.updateLocalTransform(), this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform), t.render({ container: this.fullScreenQuad, target: this.compositeRT, clear: !0 }), this.compositeRT && (this.compositeSprite.texture = this.compositeRT, this.compositeSprite.width = n, this.compositeSprite.height = c, this.compositeSprite.visible = !0), this.renderContactShadows(s, a);
  }
  dispose() {
    var e, t, s, a, l;
    this.rtManager.dispose(), (e = this.accumRT) == null || e.destroy(!0), (t = this.revealRT) == null || t.destroy(!0), (s = this.compositeRT) == null || s.destroy(!0), (a = this.jfaPingRT) == null || a.destroy(!0), (l = this.jfaPongRT) == null || l.destroy(!0);
    for (const n of this.jfaCache.values())
      n.distanceField.destroy(!0);
    this.jfaCache.clear();
  }
  // Compute JFA distance field for a panel's normal map
  computeDistanceField(e) {
    var v, y, M, E, P;
    const t = e.normalMap ?? b.WHITE, s = t.width, a = t.height, l = t.source.uid ?? 0, n = t.source._updateID ?? t.source.updateId ?? 0, c = this.jfaCache.get(e);
    if (c && c.normalMapId === l && c.normalMapUpdateId === n && c.width === s && c.height === a)
      return c.distanceField;
    (!this.jfaPingRT || this.jfaPingRT.width !== s || this.jfaPingRT.height !== a) && ((v = this.jfaPingRT) == null || v.destroy(!0), (y = this.jfaPongRT) == null || y.destroy(!0), this.jfaPingRT = U.create({ width: s, height: a, resolution: 1 }), this.jfaPongRT = U.create({ width: s, height: a, resolution: 1 }));
    let i = c == null ? void 0 : c.distanceField;
    (!i || i.width !== s || i.height !== a) && (i == null || i.destroy(!0), i = U.create({ width: s, height: a, resolution: 1 }));
    const u = [1 / s, 1 / a], d = this.jfaSeedShader.resources;
    d.uNormalMap = t.source;
    const h = (M = d.jfaUniforms) == null ? void 0 : M.uniforms;
    h && (h.uTexelSize[0] = u[0], h.uTexelSize[1] = u[1]), this.fullScreenQuad.shader = this.jfaSeedShader, this.fullScreenQuad.width = 1, this.fullScreenQuad.height = 1, this.fullScreenQuad.updateLocalTransform(), this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform), this.renderer.render({ container: this.fullScreenQuad, target: this.jfaPingRT, clear: !0 });
    const f = Math.max(s, a), p = Math.ceil(Math.log2(f));
    let m = this.jfaPingRT, o = this.jfaPongRT;
    const R = this.jfaFloodShader.resources, S = (E = R.jfaUniforms) == null ? void 0 : E.uniforms;
    for (let k = 0; k < p; k++) {
      const x = Math.pow(2, p - k - 1);
      R.uPrevPass = m.source, S && (S.uTexelSize[0] = u[0], S.uTexelSize[1] = u[1], S.uStepSize = x), this.fullScreenQuad.shader = this.jfaFloodShader, this.renderer.render({ container: this.fullScreenQuad, target: o, clear: !0 });
      const D = m;
      m = o, o = D;
    }
    const w = this.jfaDistanceShader.resources;
    w.uSeedMap = m.source;
    const g = (P = w.jfaUniforms) == null ? void 0 : P.uniforms;
    return g && (g.uMaxDistance = 0.05), this.fullScreenQuad.shader = this.jfaDistanceShader, this.renderer.render({ container: this.fullScreenQuad, target: i, clear: !0 }), this.jfaCache.set(e, {
      distanceField: i,
      normalMapId: l,
      normalMapUpdateId: n,
      width: s,
      height: a
    }), i;
  }
  ensureAccumTargets(e, t) {
    var a, l;
    const s = this.renderer.resolution;
    (!this.accumRT || this.accumRT.width !== e || this.accumRT.height !== t || this.accumRT.source.resolution !== s) && ((a = this.accumRT) == null || a.destroy(!0), this.accumRT = U.create({
      width: e,
      height: t,
      resolution: s
    })), (!this.revealRT || this.revealRT.width !== e || this.revealRT.height !== t || this.revealRT.source.resolution !== s) && ((l = this.revealRT) == null || l.destroy(!0), this.revealRT = U.create({
      width: e,
      height: t,
      resolution: s
    }));
  }
  clearTarget(e, t, s, a, l) {
    if (!e) return;
    const n = new j();
    this.renderer.render({ container: n, target: e, clear: !0, clearColor: [t, s, a, l] });
  }
  renderPanel(e, t, s) {
    var h, f, p, m;
    if (!this.accumRT || !this.revealRT) return;
    const a = e.normalMap ?? b.WHITE, l = this.renderer.screen.width, n = this.renderer.screen.height, c = this.computeDistanceField(e), i = this.refractShader.resources;
    if (i) {
      i.uSceneColor = s.source, i.uNormalMap = a.source, i.uCausticsMap = (e.causticsAtlas ?? b.WHITE).source, i.uDistanceField = c.source;
      const o = (h = i.panelUniforms) == null ? void 0 : h.uniforms;
      if (o) {
        const R = ((p = (f = this.accumRT) == null ? void 0 : f.source) == null ? void 0 : p._resolution) ?? this.renderer.resolution;
        o.uPosition[0] = e.position.x, o.uPosition[1] = e.position.y, o.uScale[0] = e.scale.x, o.uScale[1] = e.scale.y, o.uResolution[0] = l, o.uResolution[1] = n, o.uInvResolution[0] = 1 / (l * R), o.uInvResolution[1] = 1 / (n * R), o.uIOR = e.glassMaterial.ior, o.uThickness = e.glassMaterial.thickness, o.uDispersion = e.glassMaterial.dispersion, o.uRoughness = e.glassMaterial.roughness, o.uOpacity = e.glassMaterial.opacity ?? 1, o.uEnableDispersion = t.enableDispersion && e.glassMaterial.dispersion > 1e-3 ? 1 : 0, o.uEnableCaustics = t.enableCaustics && e.causticsAtlas ? 1 : 0;
        const S = K(e.glassMaterial.tint ?? 16777215);
        o.uTint[0] = S[0], o.uTint[1] = S[1], o.uTint[2] = S[2], o.uSpecular = e.glassMaterial.specular ?? 0, o.uShininess = e.glassMaterial.shininess ?? 32, o.uShadow = e.glassMaterial.shadow ?? 0;
        const w = e.glassMaterial.lightDir ?? [0.5, 0.5, 1];
        o.uLightDir[0] = -w[0], o.uLightDir[1] = -w[1], o.uLightDir[2] = w[2], o.uBlurSamples = e.glassMaterial.blurSamples ?? 8, o.uBlurSpread = e.glassMaterial.blurSpread ?? 4, o.uBlurAngle = (e.glassMaterial.blurAngle ?? 0) * Math.PI / 180, o.uBlurAnisotropy = e.glassMaterial.blurAnisotropy ?? 0, o.uBlurGamma = e.glassMaterial.blurGamma ?? 1, o.uAberrationR = e.glassMaterial.aberrationR ?? 1, o.uAberrationB = e.glassMaterial.aberrationB ?? 1, o.uAO = e.glassMaterial.ao ?? 0, o.uAORadius = e.glassMaterial.aoRadius ?? 0.5, o.uNoiseScale = e.glassMaterial.noiseScale ?? 20, o.uNoiseIntensity = e.glassMaterial.noiseIntensity ?? 0, o.uNoiseRotation = e.glassMaterial.noiseRotation ?? 0, o.uNoiseThreshold = e.glassMaterial.noiseThreshold ?? 0, o.uEdgeSupersampling = t.edgeSupersampling ?? 1, o.uGlassSupersampling = e.glassMaterial.glassSupersampling ?? 1, o.uEdgeIor[0] = e.glassMaterial.edgeIorRangeStart ?? 0, o.uEdgeIor[1] = e.glassMaterial.edgeIorRangeEnd ?? 0.15, o.uEdgeIor[2] = e.glassMaterial.edgeIorStrength ?? 1, o.uEdgeIor[3] = e.glassMaterial.edgeIorEnabled ? 1 : 0, o.uPanelSize[0] = e.scale.x, o.uPanelSize[1] = e.scale.y;
        const g = e.glassMaterial.edgeMask;
        if (g) {
          o.uEdgeMaskCutoff = g.cutoff, o.uEdgeMaskBlur = g.blur, o.uEdgeMaskInvert = g.invert ? 1 : 0;
          const v = (y, M) => {
            y[0] = M.rangeStart, y[1] = M.rangeEnd, y[2] = M.strength, y[3] = M.opacity;
          };
          v(o.uEdgeSmoothing, g.smoothing), v(o.uEdgeContrast, g.contrast), v(o.uEdgeAlpha, g.alpha), v(o.uEdgeTint, g.tint), v(o.uEdgeDarken, g.darken), v(o.uEdgeDesaturate, g.desaturate), o.uEnableSmoothing = g.smoothing.enabled ? 1 : 0, o.uEnableContrast = g.contrast.enabled ? 1 : 0, o.uEnableAlpha = g.alpha.enabled ? 1 : 0, o.uEnableTint = g.tint.enabled ? 1 : 0, o.uEnableDarken = g.darken.enabled ? 1 : 0, o.uEnableDesaturate = g.desaturate.enabled ? 1 : 0, o.uDebugMode = g.debugMode ?? 0;
        } else
          o.uEdgeMaskCutoff = e.glassMaterial.edgeMaskCutoff ?? 1e-3, o.uEdgeMaskBlur = e.glassMaterial.edgeBlur ?? 0, o.uEdgeMaskInvert = 0, o.uEnableSmoothing = 0, o.uEnableContrast = 0, o.uEnableAlpha = 0, o.uEnableTint = 0, o.uEnableDarken = 0, o.uEnableDesaturate = 0;
      }
    }
    const u = e.shader;
    e.shader = this.refractShader, this.drawPanelToTarget(e, this.accumRT), e.shader = this.revealageShader;
    const d = this.revealageShader.resources;
    if (d) {
      d.uNormalMap = a.source;
      const o = (m = d.panelUniforms) == null ? void 0 : m.uniforms;
      o && (o.uPosition[0] = e.position.x, o.uPosition[1] = e.position.y, o.uScale[0] = e.scale.x, o.uScale[1] = e.scale.y, o.uResolution[0] = l, o.uResolution[1] = n, o.uOpacity = e.glassMaterial.opacity);
    }
    this.drawPanelToTarget(e, this.revealRT), e.shader = u;
  }
  renderContactShadows(e, t) {
    if (t.enableContactShadows)
      for (const s of e)
        s.sdfShadow && (this.shadowSprite.texture = s.sdfShadow, this.shadowSprite.position.copyFrom(s.position), this.shadowSprite.scale.copyFrom(s.scale), this.shadowSprite.rotation = s.rotation, this.shadowSprite.alpha = Math.min(s.glassMaterial.opacity + 0.2, 0.9), this.renderer.render(this.shadowSprite));
  }
  getCompositeDisplay() {
    return this.compositeSprite;
  }
  drawPanelToTarget(e, t) {
    const s = this.renderer, a = s.gl;
    this.panelParent.removeChildren(), this.panelParent.addChild(e), e.updateLocalTransform(), e.worldTransform.copyFrom(e.localTransform), a && (a.enable(a.BLEND), a.blendFunc(a.SRC_ALPHA, a.ONE_MINUS_SRC_ALPHA)), s.render({ container: this.panelParent, target: t, clear: !1 }), a && a.blendFunc(a.ONE, a.ONE_MINUS_SRC_ALPHA);
  }
  ensureCompositeTarget(e, t) {
    var a;
    const s = this.renderer.resolution;
    (!this.compositeRT || this.compositeRT.width !== e || this.compositeRT.height !== t || this.compositeRT.source.resolution !== s) && ((a = this.compositeRT) == null || a.destroy(!0), this.compositeRT = U.create({
      width: e,
      height: t,
      resolution: s
    }), this.compositeSprite.texture = this.compositeRT);
  }
}
class ke {
  constructor(e, t = {}) {
    this.renderer = e, this.panels = [], this.quality = new le(), this.drawOpaqueScene = () => {
    }, this.events = new ce();
    const s = e.gl, a = new re(s).run();
    this.pipeline = a.tier === "webgl2" ? new Ae(e, !0) : new Se(e), a.tier === "webgl1" && this.emitFallback("webgl", "MRT unavailable, using compatibility pipeline");
  }
  setOpaqueSceneCallback(e) {
    this.drawOpaqueScene = e;
  }
  createPanel(e) {
    const t = new me(e);
    return this.panels.push(t), t;
  }
  removePanel(e) {
    const t = this.panels.indexOf(e);
    t >= 0 && (this.panels.splice(t, 1), e.destroy({ children: !0, texture: !1, textureSource: !1 }));
  }
  render() {
    const e = performance.now(), t = this.quality.getQuality();
    this.pipeline.render({
      renderer: this.renderer,
      panels: this.panels,
      quality: t,
      drawOpaqueScene: this.drawOpaqueScene
    });
    const s = performance.now() - e;
    this.quality.record({ cpuMs: s, timestamp: e });
    const a = this.quality.evaluate();
    a && this.events.emit("quality:decision", a);
  }
  setQuality(e) {
    this.quality.setOverrides(e);
  }
  destroy() {
    for (const e of this.panels)
      e.destroy({ children: !0, texture: !1, textureSource: !1 });
    this.panels.length = 0, this.pipeline.dispose(), this.events.removeAll();
  }
  on(e, t) {
    this.events.on(e, t);
  }
  off(e, t) {
    this.events.off(e, t);
  }
  getPipelineId() {
    return this.pipeline.id;
  }
  getCompositeDisplay() {
    if (typeof this.pipeline.getCompositeDisplay == "function")
      return this.pipeline.getCompositeDisplay();
  }
  emitFallback(e, t) {
    const s = { target: e, message: t, timestamp: performance.now() };
    console.warn(`GlassSystem fallback: ${e} - ${t}`), this.events.emit("fallback", s);
  }
}
class He {
  constructor(e) {
    this.renderer = e, this.container = new j(), this.visible = !1, this.panel = new ae().beginFill(0, 0.65).drawRoundedRect(0, 0, 260, 120, 8).endFill(), this.text = new ie("Glass HUD", { fontSize: 12, fill: 16777215 }), this.text.position.set(12, 10), this.container.addChild(this.panel, this.text), this.container.visible = this.visible, this.container.position.set(12, 12);
  }
  setVisible(e) {
    this.visible = e, this.container.visible = e;
  }
  update(e) {
    if (!this.visible) return;
    const { quality: t, fps: s, lastDecision: a } = e, l = [
      `FPS: ${s.toFixed(1)}`,
      `Scale: ${(t.renderScale * 100).toFixed(0)}%`,
      `Blur taps: ${t.maxBlurTaps}`,
      `Dispersion: ${t.enableDispersion ? "on" : "off"}`,
      `Caustics: ${t.enableCaustics ? "on" : "off"}`
    ];
    a && l.push(`Action: ${a.action}`), this.text.text = l.join(`
`);
  }
}
class Fe {
  constructor(e) {
    this.currentDir = [0, 0, 0.15], this.targetDir = [0, 0, 0.15], this.delayedDir = [0, 0, 0.15], this.renderer = e;
  }
  setParams(e) {
    this.params = e, e.followCursor && !this.boundMouseMove ? (this.boundMouseMove = (t) => {
      const s = e.curve ?? 1.5, a = e.zMin ?? 0.05, l = e.zMax ?? 0.2, n = e.edgeStretch ?? 0.5, i = this.renderer.canvas.getBoundingClientRect();
      let u = 1 - (t.clientX - i.left) / i.width * 2, d = 1 - (t.clientY - i.top) / i.height * 2;
      u = Math.sign(u) * Math.pow(Math.abs(u), n), d = Math.sign(d) * Math.pow(Math.abs(d), n);
      const h = Math.sqrt(u * u + d * d), f = Math.max(a, Math.min(l, l - Math.pow(h, s) * l * 0.5));
      this.targetDir = [u, d, f];
    }, window.addEventListener("mousemove", this.boundMouseMove)) : !e.followCursor && this.boundMouseMove && (window.removeEventListener("mousemove", this.boundMouseMove), this.boundMouseMove = void 0);
  }
  update(e) {
    var n;
    if (!((n = this.params) != null && n.followCursor)) return;
    const s = 1 - (this.params.delay ?? 0.5) * 0.97;
    this.delayedDir[0] += (this.targetDir[0] - this.delayedDir[0]) * s, this.delayedDir[1] += (this.targetDir[1] - this.delayedDir[1]) * s, this.delayedDir[2] += (this.targetDir[2] - this.delayedDir[2]) * s;
    const l = 1 - (this.params.smoothing ?? 0.9) * 0.97;
    this.currentDir[0] += (this.delayedDir[0] - this.currentDir[0]) * l, this.currentDir[1] += (this.delayedDir[1] - this.currentDir[1]) * l, this.currentDir[2] += (this.delayedDir[2] - this.currentDir[2]) * l;
    for (const [, c] of e)
      c.panel.glassMaterial.lightDir = [...this.currentDir];
  }
  destroy() {
    this.boundMouseMove && (window.removeEventListener("mousemove", this.boundMouseMove), this.boundMouseMove = void 0);
  }
}
class Ue {
  constructor(e, t) {
    this.tracked = e, this.callbacks = t;
  }
  setupObservers(e, t, s, a) {
    this.resizeObserver = new ResizeObserver((n) => {
      for (const c of n) {
        const i = c.target, u = this.tracked.get(i);
        if (!u) continue;
        const d = i.getBoundingClientRect(), h = u.lastRect;
        h && (Math.abs(d.width - h.width) > 1 || Math.abs(d.height - h.height) > 1) && this.callbacks.updateGeometry(i, u), u.lastRect = d;
      }
    }), this.intersectionObserver = new IntersectionObserver((n) => {
      for (const c of n) {
        const i = c.target, u = this.tracked.get(i);
        if (!u) continue;
        u.visible = c.isIntersecting;
        const d = this.callbacks.isCssVisible(i);
        u.panel.visible = u.visible && d;
      }
    }), document.querySelectorAll(e).forEach((n) => t(n)), this.observer = new MutationObserver((n) => {
      for (const c of n)
        if (c.type === "childList")
          c.addedNodes.forEach((i) => {
            i instanceof HTMLElement && i.matches(e) && t(i), i instanceof HTMLElement && i.querySelectorAll(e).forEach((d) => t(d));
          }), c.removedNodes.forEach((i) => {
            i instanceof HTMLElement && this.tracked.has(i) && s(i);
          });
        else if (c.type === "attributes") {
          const i = c.target;
          if (c.attributeName === "class")
            i.matches(e) ? t(i) : s(i);
          else if (c.attributeName === "style") {
            const u = this.tracked.get(i);
            if (u) {
              const d = this.callbacks.isCssVisible(i);
              u.panel.visible = d && u.visible;
              const h = i.getBoundingClientRect(), f = this.callbacks.parseBorderRadius(i, h);
              Math.abs(f - u.lastRadius) > 0.5 && this.callbacks.updateGeometry(i, u);
            }
          } else if (c.attributeName === "hidden") {
            const u = this.tracked.get(i);
            if (u) {
              const d = this.callbacks.isCssVisible(i);
              u.panel.visible = d && u.visible;
            }
          }
        }
      a();
    }), this.observer.observe(document.body, {
      childList: !0,
      subtree: !0,
      attributes: !0,
      attributeFilter: ["class", "style", "hidden"]
    });
  }
  observeElement(e) {
    var t, s;
    (t = this.resizeObserver) == null || t.observe(e), (s = this.intersectionObserver) == null || s.observe(e);
  }
  unobserveElement(e) {
    var t, s;
    (t = this.resizeObserver) == null || t.unobserve(e), (s = this.intersectionObserver) == null || s.unobserve(e);
  }
  destroy() {
    var e, t, s;
    (e = this.observer) == null || e.disconnect(), (t = this.resizeObserver) == null || t.disconnect(), (s = this.intersectionObserver) == null || s.disconnect();
  }
}
function Pe(r, e, t) {
  const s = (c) => {
    const i = r.get(c);
    if (!i || i.polling) return;
    i.polling = !0;
    const u = () => {
      i.polling && (e(c, i.panel), requestAnimationFrame(u));
    };
    requestAnimationFrame(u);
  }, a = (c) => {
    const i = r.get(c);
    i && (i.polling = !1, t(c, i));
  };
  return { handleAnimationStart: (c) => {
    const i = c.currentTarget;
    s(i);
  }, handleAnimationEnd: (c) => {
    const i = c.currentTarget;
    i.getAnimations().length === 0 && a(i);
  } };
}
function Z(r, e, t, s, a) {
  const l = t / 2, n = s / 2, c = Math.abs(r + 0.5 - l), i = Math.abs(e + 0.5 - n), u = l - a, d = n - a;
  if (c <= u && i <= d)
    return Math.min(u + a - c, d + a - i);
  if (c > u && i <= d)
    return a - (c - u);
  if (i > d && c <= u)
    return a - (i - d);
  {
    const h = c - u, f = i - d;
    return a - Math.sqrt(h * h + f * f);
  }
}
function Ie(r, e, t, s, a, l = !1) {
  const n = Math.ceil(r), c = Math.ceil(e), i = new Uint8Array(n * c * 4), u = [
    [-0.25, -0.25],
    [0.25, -0.25],
    [-0.25, 0.25],
    [0.25, 0.25]
  ];
  for (let d = 0; d < c; d++)
    for (let h = 0; h < n; h++) {
      let f = 0, p = 0, m = 1, o = 0;
      for (const [A, T] of u) {
        const N = Z(h + A, d + T, n, c, t);
        o += N >= 0 ? 1 : 0;
      }
      const R = o / u.length * 255, S = n / 2, w = c / 2, g = Math.abs(h + 0.5 - S), v = Math.abs(d + 0.5 - w), y = S - t, M = w - t;
      let E = 0, P = 0, k = 0, x = g, D = v;
      if (g <= y && v <= M) {
        const A = y + t, T = M + t;
        A - g < T - v ? (x = y + t, D = v) : (x = g, D = M + t), E = Math.min(A - g, T - v);
      } else if (g > y && v <= M)
        x = y + t, D = v, E = t - (g - y);
      else if (v > M && g <= y)
        x = g, D = M + t, E = t - (v - M);
      else {
        const A = g - y, T = v - M, N = Math.sqrt(A * A + T * T);
        E = t - N, N > 0 && (x = y + A / N * t, D = M + T / N * t);
      }
      const I = x - g, C = D - v, O = Math.sqrt(I * I + C * C);
      if (O > 1e-3 && (P = (h > S ? 1 : -1) * (I / O), k = (d > w ? 1 : -1) * (C / O)), s > 0 && E < s && E >= 0) {
        const A = q(E, s), { derivative: T } = Q(A, a);
        f = P * T * 0.5, p = k * T * 0.5, l && (f = -f, p = -p);
      }
      const F = Math.sqrt(f * f + p * p + m * m);
      f /= F, p /= F, m /= F;
      const V = (d * n + h) * 4;
      i[V] = (f * 0.5 + 0.5) * 255 | 0, i[V + 1] = (p * 0.5 + 0.5) * 255 | 0, i[V + 2] = (m * 0.5 + 0.5) * 255 | 0, i[V + 3] = R;
    }
  return b.from({
    resource: i,
    width: n,
    height: c
  });
}
function Oe(r, e, t, s, a = "squircle") {
  const l = Math.ceil(r), n = Math.ceil(e), c = new Uint8Array(l * n * 4);
  for (let i = 0; i < n; i++)
    for (let u = 0; u < l; u++) {
      const d = Z(u, i, l, n, t), h = d >= 0 ? 255 : 0;
      let f = 0;
      if (s > 0 && d >= 0 && d < s) {
        const m = q(d, s), { height: o } = Q(m, a);
        f = (1 - o) * 255;
      } else d < 0 && (f = 0);
      const p = (i * l + u) * 4;
      c[p] = f, c[p + 1] = f, c[p + 2] = f, c[p + 3] = h;
    }
  return { data: c, width: l, height: n };
}
function Be(r, e, t, s, a = "squircle") {
  const l = Oe(r, e, t, s, a);
  return b.from({
    resource: l.data,
    width: l.width,
    height: l.height
  });
}
class je {
  constructor(e, t) {
    this.tracked = /* @__PURE__ */ new Map(), this.system = new ke(e, t.systemOptions), this.system.setOpaqueSceneCallback((a) => {
      e.render({ container: t.background, target: a, clear: !0 });
    });
    const s = this.system.getCompositeDisplay();
    s && t.stage.addChild(s), this.lightFollow = new Fe(e), this.domTracking = new Ue(this.tracked, {
      syncElement: this.syncElement.bind(this),
      updateGeometry: this.updatePanelGeometry.bind(this),
      isCssVisible: this.isCssVisible.bind(this),
      parseBorderRadius: this.parseBorderRadius.bind(this)
    }), this.animationHandlers = Pe(
      this.tracked,
      this.syncElement.bind(this),
      this.updatePanelGeometry.bind(this)
    ), t.lightFollowParams && this.setLightFollowParams(t.lightFollowParams);
  }
  setLightFollowParams(e) {
    this.lightFollow.setParams(e);
  }
  autoMount(e = ".glass-panel") {
    this.domTracking.setupObservers(
      e,
      (t) => this.track(t),
      (t) => this.untrack(t),
      () => this.cleanup()
    );
  }
  track(e, t = {}) {
    if (this.tracked.has(e))
      return this.tracked.get(e).panel;
    const s = this.createMaterial(e, t), a = e.getBoundingClientRect(), l = this.detectCircleMode(e, t), n = this.calculateRadius(e, a, t, l), c = this.createNormalMap(a, n, t, l), i = this.system.createPanel({ material: s, normalMap: c }), u = {
      panel: i,
      config: t,
      lastRect: a,
      lastRadius: n,
      visible: !0,
      isCircle: l,
      polling: !1
    };
    return this.tracked.set(e, u), this.domTracking.observeElement(e), e.addEventListener("transitionrun", this.animationHandlers.handleAnimationStart), e.addEventListener("transitionend", this.animationHandlers.handleAnimationEnd), e.addEventListener("transitioncancel", this.animationHandlers.handleAnimationEnd), e.addEventListener("animationstart", this.animationHandlers.handleAnimationStart), e.addEventListener("animationend", this.animationHandlers.handleAnimationEnd), e.addEventListener("animationcancel", this.animationHandlers.handleAnimationEnd), this.syncElement(e, i), i;
  }
  untrack(e) {
    const t = this.tracked.get(e);
    t && (t.polling = !1, this.domTracking.unobserveElement(e), e.removeEventListener("transitionrun", this.animationHandlers.handleAnimationStart), e.removeEventListener("transitionend", this.animationHandlers.handleAnimationEnd), e.removeEventListener("transitioncancel", this.animationHandlers.handleAnimationEnd), e.removeEventListener("animationstart", this.animationHandlers.handleAnimationStart), e.removeEventListener("animationend", this.animationHandlers.handleAnimationEnd), e.removeEventListener("animationcancel", this.animationHandlers.handleAnimationEnd), this.system.removePanel(t.panel), this.tracked.delete(e));
  }
  update() {
    this.lightFollow.update(this.tracked);
    for (const [e, t] of this.tracked)
      this.syncElement(e, t.panel);
    this.system.render();
  }
  resize() {
    this.update();
  }
  setPositionTransform(e) {
    this.positionTransform = e;
  }
  cleanup() {
    for (const [e] of this.tracked)
      document.body.contains(e) || this.untrack(e);
  }
  destroy() {
    this.lightFollow.destroy(), this.domTracking.destroy(), this.system.destroy(), this.tracked.clear();
  }
  createMaterial(e, t) {
    const s = e.dataset.glassIor ? parseFloat(e.dataset.glassIor) : void 0, a = e.dataset.glassRoughness ? parseFloat(e.dataset.glassRoughness) : void 0, l = {
      ...ue.clear(),
      ...t.material
    };
    return s !== void 0 && (l.ior = s), a !== void 0 && (l.roughness = a), l;
  }
  detectCircleMode(e, t) {
    return t.isCircle || e.classList.contains("glass-circle") || e.hasAttribute("data-glass-circle");
  }
  calculateRadius(e, t, s, a) {
    if (a)
      return Math.min(t.width, t.height) / 2;
    const l = this.parseBorderRadius(e, t);
    return s.cornerRadius ?? l;
  }
  createNormalMap(e, t, s, a) {
    if (s.normalMap) return s.normalMap;
    const l = s.bevelSize ?? 12, n = s.surfaceShape ?? "squircle", c = s.invertNormals ?? !1, i = s.useDisplacementMap ?? !1, u = window.devicePixelRatio || 1, d = Math.floor(Math.min(e.width, e.height) * u), h = a ? d : e.width * u, f = a ? d : e.height * u;
    return i ? Be(h, f, t * u, l * u, n) : Ie(h, f, t * u, l * u, n, c);
  }
  syncElement(e, t) {
    const s = this.tracked.get(e), a = e.getBoundingClientRect(), l = s != null && s.isCircle ? Math.floor(Math.min(a.width, a.height)) : Math.round(a.width), n = s != null && s.isCircle ? l : Math.round(a.height), c = Math.round(a.left) + l / 2, i = Math.round(a.top) + n / 2;
    if (this.positionTransform) {
      const u = this.positionTransform(c, i, l, n);
      t.position.set(Math.round(u.x), Math.round(u.y)), t.scale.set(Math.round(l * u.scaleX), Math.round(n * u.scaleY)), t.rotation = u.rotation;
    } else
      t.position.set(c, i), t.scale.set(l, n), t.rotation = 0;
  }
  parseBorderRadius(e, t) {
    const s = window.getComputedStyle(e), a = s.borderTopLeftRadius, l = s.borderTopRightRadius, n = s.borderBottomRightRadius, c = s.borderBottomLeftRadius, i = (p, m) => p.endsWith("%") ? parseFloat(p) / 100 * m : parseFloat(p) || 0, u = (p) => p.split(" ")[0], d = (t.width + t.height) / 2;
    return [
      i(u(a), d),
      i(u(l), d),
      i(u(n), d),
      i(u(c), d)
    ].reduce((p, m) => p + m, 0) / 4 || 20;
  }
  isCssVisible(e) {
    if (e.hidden) return !1;
    const t = window.getComputedStyle(e);
    return t.display !== "none" && t.visibility !== "hidden";
  }
  updatePanelGeometry(e, t) {
    const s = e.getBoundingClientRect(), a = this.detectCircleMode(e, t.config), l = this.calculateRadius(e, s, t.config, a), n = this.createNormalMap(s, l, t.config, a);
    t.panel.setTextures({ normalMap: n }), t.lastRect = s, t.lastRadius = l;
  }
}
export {
  le as AdaptiveQualityController,
  re as CapabilityProbe,
  ce as EventBus,
  He as GlassHUD,
  je as GlassOverlay,
  me as GlassPanel,
  ue as GlassPresets,
  ke as GlassSystem,
  J as SceneRTManager,
  Ge as createDefaultEdgeMask,
  z as createDefaultEdgeTactic,
  Be as createDisplacementMap,
  Oe as createDisplacementMapData,
  _e as createPillGeometry,
  Ve as createPillNormalMap,
  Ie as createRoundedRectNormalMap,
  Z as getDistanceToBoundary,
  Q as getHeightAndDerivative,
  ge as heightCircle,
  ye as heightSquircle,
  K as hexToVec3,
  ze as smootherstep,
  Le as updatePillGeometry
};
//# sourceMappingURL=pixi-adaptive-glass.es.js.map
