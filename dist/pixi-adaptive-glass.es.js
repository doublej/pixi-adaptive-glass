import { Rectangle as te, RenderTexture as N, MeshGeometry as X, Mesh as $, State as J, Shader as z, Texture as M, Sprite as q, Filter as se, GlProgram as ae, UniformGroup as _, Container as Q, Graphics as ie, Text as re } from "pixi.js";
class oe {
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
const ne = {
  renderScale: 1,
  enableDispersion: !0,
  enableCaustics: !0,
  enableContactShadows: !0,
  maxBlurTaps: 9,
  edgeSupersampling: 1
}, le = [
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
class ce {
  constructor(e = 100) {
    this.targetFrameMs = e, this.current = { ...ne }, this.telemetry = [], this.overrides = {};
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
      for (const s of le)
        if (s.check(this.current))
          return s.apply(this.current), { action: s.action, reason: s.reason };
    }
  }
}
class K {
  constructor(e, t) {
    this.renderer = e, this.useDepth = t, this.scale = 1, this.clearRect = new te();
  }
  ensure(e, t, s) {
    const a = this.renderer.resolution * s;
    return (!this.handles || this.handles.sceneColor.width !== e || this.handles.sceneColor.height !== t || this.handles.sceneColor.source.resolution !== a) && (this.dispose(), this.handles = {
      sceneColor: N.create({
        width: e,
        height: t,
        resolution: a,
        scaleMode: "linear"
      }),
      sceneDepth: this.useDepth ? N.create({
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
class ue {
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
const L = (r) => r, he = {
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
const fe = new X({
  positions: new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3])
}), pe = `
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
`, me = `
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;
class ge extends $ {
  constructor(e) {
    const t = J.for2d();
    t.culling = !1, super({
      geometry: e.geometry ?? fe,
      shader: z.from({
        gl: {
          vertex: pe,
          fragment: me
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
function j(r, e) {
  return r / e;
}
function ve(r) {
  return Math.sqrt(Math.max(0, 2 * r - r * r));
}
function ye(r) {
  const e = Math.sqrt(Math.max(1e-4, 2 * r - r * r));
  return (1 - r) / e;
}
function be(r) {
  const e = 1 - Math.pow(1 - r, 3);
  return Math.pow(Math.max(0, e), 1 / 3);
}
function Me(r) {
  const e = 1 - Math.pow(1 - r, 3);
  return e <= 1e-4 ? 0 : Math.pow(1 - r, 2) / Math.pow(e, 2 / 3);
}
function je(r) {
  const e = Math.max(0, Math.min(1, r));
  return e * e * e * (e * (e * 6 - 15) + 10);
}
function W(r, e) {
  switch (e) {
    case "circle":
      return { height: ve(r), derivative: ye(r) };
    case "squircle":
      return { height: be(r), derivative: Me(r) };
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
function We(r, e = 0, t = 32) {
  const s = e / 2, a = 1 + t, c = new Float32Array(a * 2), o = new Float32Array(a * 2), l = r * 2 + e, i = r * 2;
  c[0] = 0, c[1] = 0, o[0] = 0.5, o[1] = 0.5;
  for (let d = 0; d < t; d++) {
    const f = d / t * Math.PI * 2 - Math.PI / 2, p = (d + 1) * 2;
    let g, n;
    f >= -Math.PI / 2 && f <= Math.PI / 2 ? (g = Math.cos(f) * r + s, n = Math.sin(f) * r) : (g = Math.cos(f) * r - s, n = Math.sin(f) * r), c[p] = g / l, c[p + 1] = n / i, o[p] = g / l + 0.5, o[p + 1] = n / i + 0.5;
  }
  const u = t, h = new Uint32Array(u * 3);
  for (let d = 0; d < t; d++) {
    const f = d * 3;
    h[f] = 0, h[f + 1] = d + 1, h[f + 2] = (d + 1) % t + 1;
  }
  return new X({
    positions: c,
    uvs: o,
    indices: h
  });
}
function qe(r, e, t, s = 32) {
  const a = r.getAttribute("aPosition"), c = r.getAttribute("aUV");
  if (!a || !c) return;
  const o = a.buffer.data, l = c.buffer.data, i = t / 2, u = e * 2 + t, h = e * 2;
  for (let d = 0; d < s; d++) {
    const f = d / s * Math.PI * 2 - Math.PI / 2, p = (d + 1) * 2;
    let g, n;
    f >= -Math.PI / 2 && f <= Math.PI / 2 ? (g = Math.cos(f) * e + i, n = Math.sin(f) * e) : (g = Math.cos(f) * e - i, n = Math.sin(f) * e), o[p] = g / u, o[p + 1] = n / h, l[p] = g / u + 0.5, l[p + 1] = n / h + 0.5;
  }
  a.buffer.update(), c.buffer.update();
}
function Qe(r, e, t, s, a, c = !1) {
  const o = Math.ceil(r), l = Math.ceil(e), i = new Uint8Array(o * l * 4), u = l / 2, h = t / 2;
  for (let d = 0; d < l; d++)
    for (let f = 0; f < o; f++) {
      let p = 0, g = 0, n = 1, C = 255;
      const T = (o - 1) / 2, R = (l - 1) / 2, m = f - T, v = d - R;
      let y = 0, b = 0, w = 0;
      const O = Math.abs(m), U = Math.abs(v);
      if (O <= h)
        y = u - U, b = 0, w = v > 0 ? 1 : -1;
      else {
        const P = m > 0 ? h : -h, A = m - P, I = v, F = Math.sqrt(A * A + I * I);
        y = u - F, F > 1e-3 && (b = A / F, w = I / F);
      }
      if (y < 0 && (C = 0), s > 0 && y < s && y >= 0) {
        const P = j(y, s), { derivative: A } = W(P, a);
        p = b * A * 0.5, g = w * A * 0.5, c && (p = -p, g = -g);
      }
      const E = Math.sqrt(p * p + g * g + n * n);
      p /= E, g /= E, n /= E;
      const D = (d * o + f) * 4;
      i[D] = (p * 0.5 + 0.5) * 255 | 0, i[D + 1] = (g * 0.5 + 0.5) * 255 | 0, i[D + 2] = (n * 0.5 + 0.5) * 255 | 0, i[D + 3] = C;
    }
  return M.from({
    resource: i,
    width: o,
    height: l
  });
}
function Z(r) {
  return [
    (r >> 16 & 255) / 255,
    (r >> 8 & 255) / 255,
    (r & 255) / 255
  ];
}
function V(r) {
  return {
    enabled: !1,
    rangeStart: 0,
    rangeEnd: 0.3,
    strength: 1,
    opacity: 1,
    ...r
  };
}
function Xe(r) {
  return {
    cutoff: 1e-3,
    blur: 0,
    invert: !1,
    smoothing: V({ rangeEnd: 0.3, strength: 1 }),
    contrast: V({ rangeEnd: 0.3, strength: 0.7 }),
    alpha: V({ rangeEnd: 0.2, strength: 1 }),
    tint: V({ rangeEnd: 0.5, strength: 0.5 }),
    darken: V({ rangeEnd: 0.3, strength: 0.3 }),
    desaturate: V({ rangeEnd: 0.4, strength: 0.5 }),
    ...r
  };
}
class Se extends se {
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
      glProgram: new ae({
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
        uSceneColor: M.WHITE.source,
        uNormalMap: M.WHITE.source,
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
class we {
  constructor(e) {
    this.renderer = e, this.id = "webgl1", this.filter = new Se(), this.rtManager = new K(e, !1), this.blitSprite = new q(M.WHITE);
  }
  setup() {
  }
  render(e) {
    const { renderer: t, panels: s, quality: a, drawOpaqueScene: c } = e, o = this.rtManager.ensure(
      t.screen.width,
      t.screen.height,
      a.renderScale
    );
    c(o.sceneColor), this.blitSprite.texture = o.sceneColor, this.blitSprite.width = t.screen.width, this.blitSprite.height = t.screen.height, t.render({ container: this.blitSprite, clear: !0 });
    const l = [...s].sort((i, u) => (i.zIndex ?? 0) - (u.zIndex ?? 0));
    for (const i of l)
      this.applyFilter(i, o.sceneColor, a), t.render({ container: i });
  }
  dispose() {
    this.rtManager.dispose();
  }
  applyFilter(e, t, s) {
    if (!(!!(e.normalMap || e.dudvMap) || e.glassMaterial.dispersion > 1e-3 || e.glassMaterial.roughness > 1e-3)) {
      e.filters = null;
      return;
    }
    const c = this.filter.resources;
    c.uSceneColor = t.source, c.uNormalMap = (e.normalMap ?? e.dudvMap ?? M.WHITE).source;
    const o = c.uniforms;
    o.uInvResolution = [1 / t.width, 1 / t.height], o.uDispersion = e.glassMaterial.dispersion, o.uRoughness = e.glassMaterial.roughness, o.uDisplacementScale = e.glassMaterial.thickness * 0.1, o.uTint = Z(e.glassMaterial.tint ?? 16777215), o.uOpacity = e.glassMaterial.opacity, o.uEnableDispersion = s.enableDispersion && e.glassMaterial.dispersion > 1e-3 ? 1 : 0, e.filters = [this.filter];
  }
}
const H = `
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`, xe = `
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
`, Ee = `
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
`, Y = `
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
`, Te = `
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
`, Re = `
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
`, Ce = `
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
`, Ae = new X({
  positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3])
});
class ke {
  constructor(e, t) {
    this.renderer = e, this.id = "webgl2", this.jfaCache = /* @__PURE__ */ new Map(), this.rtManager = new K(e, t);
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
    this.refractShader = z.from({
      gl: { vertex: Y, fragment: Te },
      resources: {
        uSceneColor: M.WHITE.source,
        uNormalMap: M.WHITE.source,
        uCausticsMap: M.WHITE.source,
        uDistanceField: M.WHITE.source,
        panelUniforms: s
      }
    });
    const a = new _({
      uPosition: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uScale: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uResolution: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uOpacity: { value: 1, type: "f32" }
    });
    this.revealageShader = z.from({
      gl: { vertex: Y, fragment: Re },
      resources: {
        uNormalMap: M.WHITE.source,
        panelUniforms: a
      }
    }), this.compositeShader = z.from({
      gl: { vertex: H, fragment: Ce },
      resources: {
        uSceneColor: M.WHITE.source,
        uAccum: M.WHITE.source,
        uReveal: M.WHITE.source
      }
    }), this.fullScreenQuad = new $({
      geometry: Ae,
      shader: this.compositeShader
    }), this.fullScreenQuad.state = J.for2d(), this.fullScreenQuad.state.culling = !1, this.shadowSprite = new q(M.WHITE), this.panelParent = new Q(), this.panelParent.alpha = 1, this.compositeSprite = new q(M.EMPTY), this.compositeSprite.position.set(0, 0), this.compositeSprite.visible = !0, this.compositeSprite.alpha = 1, this.compositeSprite.zIndex = 9999;
    const c = new _({
      uTexelSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" }
    });
    this.jfaSeedShader = z.from({
      gl: { vertex: H, fragment: xe },
      resources: {
        uNormalMap: M.WHITE.source,
        jfaUniforms: c
      }
    });
    const o = new _({
      uTexelSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uStepSize: { value: 1, type: "f32" }
    });
    this.jfaFloodShader = z.from({
      gl: { vertex: H, fragment: De },
      resources: {
        uPrevPass: M.WHITE.source,
        jfaUniforms: o
      }
    });
    const l = new _({
      uMaxDistance: { value: 0.15, type: "f32" }
    });
    this.jfaDistanceShader = z.from({
      gl: { vertex: H, fragment: Ee },
      resources: {
        uSeedMap: M.WHITE.source,
        jfaUniforms: l
      }
    });
  }
  setup() {
  }
  render(e) {
    var u, h;
    const { renderer: t, panels: s, quality: a, drawOpaqueScene: c } = e, o = t.screen.width, l = t.screen.height, i = this.rtManager.ensure(o, l, a.renderScale);
    this.ensureAccumTargets(o, l), this.ensureCompositeTarget(o, l), c(i.sceneColor), this.clearTarget(this.accumRT, 0, 0, 0, 0), this.clearTarget(this.revealRT, 1, 1, 1, 1);
    for (const d of s)
      this.renderPanel(d, a, i.sceneColor);
    this.fullScreenQuad.shader = this.compositeShader, this.compositeShader.resources.uSceneColor = i.sceneColor.source, this.compositeShader.resources.uAccum = (u = this.accumRT) == null ? void 0 : u.source, this.compositeShader.resources.uReveal = (h = this.revealRT) == null ? void 0 : h.source, this.fullScreenQuad.width = t.screen.width, this.fullScreenQuad.height = t.screen.height, this.fullScreenQuad.updateLocalTransform(), this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform), t.render({ container: this.fullScreenQuad, target: this.compositeRT, clear: !0 }), this.compositeRT && (this.compositeSprite.texture = this.compositeRT, this.compositeSprite.width = o, this.compositeSprite.height = l, this.compositeSprite.visible = !0), this.renderContactShadows(s, a);
  }
  dispose() {
    var e, t, s, a, c;
    this.rtManager.dispose(), (e = this.accumRT) == null || e.destroy(!0), (t = this.revealRT) == null || t.destroy(!0), (s = this.compositeRT) == null || s.destroy(!0), (a = this.jfaPingRT) == null || a.destroy(!0), (c = this.jfaPongRT) == null || c.destroy(!0);
    for (const o of this.jfaCache.values())
      o.distanceField.destroy(!0);
    this.jfaCache.clear();
  }
  // Compute JFA distance field for a panel's normal map
  computeDistanceField(e) {
    var v, y, b, w, O;
    const t = e.normalMap ?? M.WHITE, s = t.width, a = t.height, c = t.source.uid ?? 0, o = t.source._updateID ?? t.source.updateId ?? 0, l = this.jfaCache.get(e);
    if (l && l.normalMapId === c && l.normalMapUpdateId === o && l.width === s && l.height === a)
      return l.distanceField;
    (!this.jfaPingRT || this.jfaPingRT.width !== s || this.jfaPingRT.height !== a) && ((v = this.jfaPingRT) == null || v.destroy(!0), (y = this.jfaPongRT) == null || y.destroy(!0), this.jfaPingRT = N.create({ width: s, height: a, resolution: 1 }), this.jfaPongRT = N.create({ width: s, height: a, resolution: 1 }));
    let i = l == null ? void 0 : l.distanceField;
    (!i || i.width !== s || i.height !== a) && (i == null || i.destroy(!0), i = N.create({ width: s, height: a, resolution: 1 }));
    const u = [1 / s, 1 / a], h = this.jfaSeedShader.resources;
    h.uNormalMap = t.source;
    const d = (b = h.jfaUniforms) == null ? void 0 : b.uniforms;
    d && (d.uTexelSize[0] = u[0], d.uTexelSize[1] = u[1]), this.fullScreenQuad.shader = this.jfaSeedShader, this.fullScreenQuad.width = 1, this.fullScreenQuad.height = 1, this.fullScreenQuad.updateLocalTransform(), this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform), this.renderer.render({ container: this.fullScreenQuad, target: this.jfaPingRT, clear: !0 });
    const f = Math.max(s, a), p = Math.ceil(Math.log2(f));
    let g = this.jfaPingRT, n = this.jfaPongRT;
    const C = this.jfaFloodShader.resources, T = (w = C.jfaUniforms) == null ? void 0 : w.uniforms;
    for (let U = 0; U < p; U++) {
      const E = Math.pow(2, p - U - 1);
      C.uPrevPass = g.source, T && (T.uTexelSize[0] = u[0], T.uTexelSize[1] = u[1], T.uStepSize = E), this.fullScreenQuad.shader = this.jfaFloodShader, this.renderer.render({ container: this.fullScreenQuad, target: n, clear: !0 });
      const D = g;
      g = n, n = D;
    }
    const R = this.jfaDistanceShader.resources;
    R.uSeedMap = g.source;
    const m = (O = R.jfaUniforms) == null ? void 0 : O.uniforms;
    return m && (m.uMaxDistance = 0.05), this.fullScreenQuad.shader = this.jfaDistanceShader, this.renderer.render({ container: this.fullScreenQuad, target: i, clear: !0 }), this.jfaCache.set(e, {
      distanceField: i,
      normalMapId: c,
      normalMapUpdateId: o,
      width: s,
      height: a
    }), i;
  }
  ensureAccumTargets(e, t) {
    var a, c;
    const s = this.renderer.resolution;
    (!this.accumRT || this.accumRT.width !== e || this.accumRT.height !== t || this.accumRT.source.resolution !== s) && ((a = this.accumRT) == null || a.destroy(!0), this.accumRT = N.create({
      width: e,
      height: t,
      resolution: s
    })), (!this.revealRT || this.revealRT.width !== e || this.revealRT.height !== t || this.revealRT.source.resolution !== s) && ((c = this.revealRT) == null || c.destroy(!0), this.revealRT = N.create({
      width: e,
      height: t,
      resolution: s
    }));
  }
  clearTarget(e, t, s, a, c) {
    if (!e) return;
    const o = new Q();
    this.renderer.render({ container: o, target: e, clear: !0, clearColor: [t, s, a, c] });
  }
  renderPanel(e, t, s) {
    var d, f, p, g;
    if (!this.accumRT || !this.revealRT) return;
    const a = e.normalMap ?? M.WHITE, c = this.renderer.screen.width, o = this.renderer.screen.height, l = this.computeDistanceField(e), i = this.refractShader.resources;
    if (i) {
      i.uSceneColor = s.source, i.uNormalMap = a.source, i.uCausticsMap = (e.causticsAtlas ?? M.WHITE).source, i.uDistanceField = l.source;
      const n = (d = i.panelUniforms) == null ? void 0 : d.uniforms;
      if (n) {
        const C = ((p = (f = this.accumRT) == null ? void 0 : f.source) == null ? void 0 : p._resolution) ?? this.renderer.resolution;
        n.uPosition[0] = e.position.x, n.uPosition[1] = e.position.y, n.uScale[0] = e.scale.x, n.uScale[1] = e.scale.y, n.uResolution[0] = c, n.uResolution[1] = o, n.uInvResolution[0] = 1 / (c * C), n.uInvResolution[1] = 1 / (o * C), n.uIOR = e.glassMaterial.ior, n.uThickness = e.glassMaterial.thickness, n.uDispersion = e.glassMaterial.dispersion, n.uRoughness = e.glassMaterial.roughness, n.uOpacity = e.glassMaterial.opacity ?? 1, n.uEnableDispersion = t.enableDispersion && e.glassMaterial.dispersion > 1e-3 ? 1 : 0, n.uEnableCaustics = t.enableCaustics && e.causticsAtlas ? 1 : 0;
        const T = Z(e.glassMaterial.tint ?? 16777215);
        n.uTint[0] = T[0], n.uTint[1] = T[1], n.uTint[2] = T[2], n.uSpecular = e.glassMaterial.specular ?? 0, n.uShininess = e.glassMaterial.shininess ?? 32, n.uShadow = e.glassMaterial.shadow ?? 0;
        const R = e.glassMaterial.lightDir ?? [0.5, 0.5, 1];
        n.uLightDir[0] = -R[0], n.uLightDir[1] = -R[1], n.uLightDir[2] = R[2], n.uBlurSamples = e.glassMaterial.blurSamples ?? 8, n.uBlurSpread = e.glassMaterial.blurSpread ?? 4, n.uBlurAngle = (e.glassMaterial.blurAngle ?? 0) * Math.PI / 180, n.uBlurAnisotropy = e.glassMaterial.blurAnisotropy ?? 0, n.uBlurGamma = e.glassMaterial.blurGamma ?? 1, n.uAberrationR = e.glassMaterial.aberrationR ?? 1, n.uAberrationB = e.glassMaterial.aberrationB ?? 1, n.uAO = e.glassMaterial.ao ?? 0, n.uAORadius = e.glassMaterial.aoRadius ?? 0.5, n.uNoiseScale = e.glassMaterial.noiseScale ?? 20, n.uNoiseIntensity = e.glassMaterial.noiseIntensity ?? 0, n.uNoiseRotation = e.glassMaterial.noiseRotation ?? 0, n.uNoiseThreshold = e.glassMaterial.noiseThreshold ?? 0, n.uEdgeSupersampling = t.edgeSupersampling ?? 1, n.uGlassSupersampling = e.glassMaterial.glassSupersampling ?? 1, n.uEdgeIor[0] = e.glassMaterial.edgeIorRangeStart ?? 0, n.uEdgeIor[1] = e.glassMaterial.edgeIorRangeEnd ?? 0.15, n.uEdgeIor[2] = e.glassMaterial.edgeIorStrength ?? 1, n.uEdgeIor[3] = e.glassMaterial.edgeIorEnabled ? 1 : 0, n.uPanelSize[0] = e.scale.x, n.uPanelSize[1] = e.scale.y;
        const m = e.glassMaterial.edgeMask;
        if (m) {
          n.uEdgeMaskCutoff = m.cutoff, n.uEdgeMaskBlur = m.blur, n.uEdgeMaskInvert = m.invert ? 1 : 0;
          const v = (y, b) => {
            y[0] = b.rangeStart, y[1] = b.rangeEnd, y[2] = b.strength, y[3] = b.opacity;
          };
          v(n.uEdgeSmoothing, m.smoothing), v(n.uEdgeContrast, m.contrast), v(n.uEdgeAlpha, m.alpha), v(n.uEdgeTint, m.tint), v(n.uEdgeDarken, m.darken), v(n.uEdgeDesaturate, m.desaturate), n.uEnableSmoothing = m.smoothing.enabled ? 1 : 0, n.uEnableContrast = m.contrast.enabled ? 1 : 0, n.uEnableAlpha = m.alpha.enabled ? 1 : 0, n.uEnableTint = m.tint.enabled ? 1 : 0, n.uEnableDarken = m.darken.enabled ? 1 : 0, n.uEnableDesaturate = m.desaturate.enabled ? 1 : 0, n.uDebugMode = m.debugMode ?? 0;
        } else
          n.uEdgeMaskCutoff = e.glassMaterial.edgeMaskCutoff ?? 1e-3, n.uEdgeMaskBlur = e.glassMaterial.edgeBlur ?? 0, n.uEdgeMaskInvert = 0, n.uEnableSmoothing = 0, n.uEnableContrast = 0, n.uEnableAlpha = 0, n.uEnableTint = 0, n.uEnableDarken = 0, n.uEnableDesaturate = 0;
      }
    }
    const u = e.shader;
    e.shader = this.refractShader, this.drawPanelToTarget(e, this.accumRT), e.shader = this.revealageShader;
    const h = this.revealageShader.resources;
    if (h) {
      h.uNormalMap = a.source;
      const n = (g = h.panelUniforms) == null ? void 0 : g.uniforms;
      n && (n.uPosition[0] = e.position.x, n.uPosition[1] = e.position.y, n.uScale[0] = e.scale.x, n.uScale[1] = e.scale.y, n.uResolution[0] = c, n.uResolution[1] = o, n.uOpacity = e.glassMaterial.opacity);
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
    (!this.compositeRT || this.compositeRT.width !== e || this.compositeRT.height !== t || this.compositeRT.source.resolution !== s) && ((a = this.compositeRT) == null || a.destroy(!0), this.compositeRT = N.create({
      width: e,
      height: t,
      resolution: s
    }), this.compositeSprite.texture = this.compositeRT);
  }
}
class Fe {
  constructor(e, t = {}) {
    this.renderer = e, this.panels = [], this.quality = new ce(), this.drawOpaqueScene = () => {
    }, this.events = new ue();
    const s = e.gl, a = new oe(s).run();
    this.pipeline = a.tier === "webgl2" ? new ke(e, !0) : new we(e), a.tier === "webgl1" && this.emitFallback("webgl", "MRT unavailable, using compatibility pipeline");
  }
  setOpaqueSceneCallback(e) {
    this.drawOpaqueScene = e;
  }
  createPanel(e) {
    const t = new ge(e);
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
class Ye {
  constructor(e) {
    this.renderer = e, this.container = new Q(), this.visible = !1, this.panel = new ie().beginFill(0, 0.65).drawRoundedRect(0, 0, 260, 120, 8).endFill(), this.text = new re("Glass HUD", { fontSize: 12, fill: 16777215 }), this.text.position.set(12, 10), this.container.addChild(this.panel, this.text), this.container.visible = this.visible, this.container.position.set(12, 12);
  }
  setVisible(e) {
    this.visible = e, this.container.visible = e;
  }
  update(e) {
    if (!this.visible) return;
    const { quality: t, fps: s, lastDecision: a } = e, c = [
      `FPS: ${s.toFixed(1)}`,
      `Scale: ${(t.renderScale * 100).toFixed(0)}%`,
      `Blur taps: ${t.maxBlurTaps}`,
      `Dispersion: ${t.enableDispersion ? "on" : "off"}`,
      `Caustics: ${t.enableCaustics ? "on" : "off"}`
    ];
    a && c.push(`Action: ${a.action}`), this.text.text = c.join(`
`);
  }
}
class Ue {
  constructor(e) {
    this.currentDir = [0, 0, 0.15], this.targetDir = [0, 0, 0.15], this.delayedDir = [0, 0, 0.15], this.renderer = e;
  }
  setParams(e) {
    this.params = e, e.followCursor && !this.boundMouseMove ? (this.boundMouseMove = (t) => {
      const s = e.curve ?? 1.5, a = e.zMin ?? 0.05, c = e.zMax ?? 0.2, o = e.edgeStretch ?? 0.5, i = this.renderer.canvas.getBoundingClientRect();
      let u = 1 - (t.clientX - i.left) / i.width * 2, h = 1 - (t.clientY - i.top) / i.height * 2;
      u = Math.sign(u) * Math.pow(Math.abs(u), o), h = Math.sign(h) * Math.pow(Math.abs(h), o);
      const d = Math.sqrt(u * u + h * h), f = Math.max(a, Math.min(c, c - Math.pow(d, s) * c * 0.5));
      this.targetDir = [u, h, f];
    }, window.addEventListener("mousemove", this.boundMouseMove)) : !e.followCursor && this.boundMouseMove && (window.removeEventListener("mousemove", this.boundMouseMove), this.boundMouseMove = void 0);
  }
  update(e) {
    var o;
    if (!((o = this.params) != null && o.followCursor)) return;
    const s = 1 - (this.params.delay ?? 0.5) * 0.97;
    this.delayedDir[0] += (this.targetDir[0] - this.delayedDir[0]) * s, this.delayedDir[1] += (this.targetDir[1] - this.delayedDir[1]) * s, this.delayedDir[2] += (this.targetDir[2] - this.delayedDir[2]) * s;
    const c = 1 - (this.params.smoothing ?? 0.9) * 0.97;
    this.currentDir[0] += (this.delayedDir[0] - this.currentDir[0]) * c, this.currentDir[1] += (this.delayedDir[1] - this.currentDir[1]) * c, this.currentDir[2] += (this.delayedDir[2] - this.currentDir[2]) * c;
    for (const [, l] of e)
      l.panel.glassMaterial.lightDir = [...this.currentDir];
  }
  destroy() {
    this.boundMouseMove && (window.removeEventListener("mousemove", this.boundMouseMove), this.boundMouseMove = void 0);
  }
}
class Pe {
  constructor(e, t) {
    this.tracked = e, this.callbacks = t;
  }
  setupObservers(e, t, s, a) {
    this.resizeObserver = new ResizeObserver((o) => {
      for (const l of o) {
        const i = l.target, u = this.tracked.get(i);
        if (!u) continue;
        const h = i.getBoundingClientRect(), d = u.lastRect;
        d && (Math.abs(h.width - d.width) > 1 || Math.abs(h.height - d.height) > 1) && this.callbacks.updateGeometry(i, u), u.lastRect = h;
      }
    }), this.intersectionObserver = new IntersectionObserver((o) => {
      for (const l of o) {
        const i = l.target, u = this.tracked.get(i);
        if (!u) continue;
        u.visible = l.isIntersecting;
        const h = this.callbacks.isCssVisible(i);
        u.panel.visible = u.visible && h;
      }
    }), document.querySelectorAll(e).forEach((o) => t(o)), this.observer = new MutationObserver((o) => {
      for (const l of o)
        if (l.type === "childList")
          l.addedNodes.forEach((i) => {
            i instanceof HTMLElement && i.matches(e) && t(i), i instanceof HTMLElement && i.querySelectorAll(e).forEach((h) => t(h));
          }), l.removedNodes.forEach((i) => {
            i instanceof HTMLElement && this.tracked.has(i) && s(i);
          });
        else if (l.type === "attributes") {
          const i = l.target;
          if (l.attributeName === "class")
            i.matches(e) ? t(i) : s(i);
          else if (l.attributeName === "style") {
            const u = this.tracked.get(i);
            if (u) {
              const h = this.callbacks.isCssVisible(i);
              u.panel.visible = h && u.visible;
              const d = i.getBoundingClientRect(), f = this.callbacks.parseBorderRadius(i, d);
              Math.abs(f - u.lastRadius) > 0.5 && this.callbacks.updateGeometry(i, u);
            }
          } else if (l.attributeName === "hidden") {
            const u = this.tracked.get(i);
            if (u) {
              const h = this.callbacks.isCssVisible(i);
              u.panel.visible = h && u.visible;
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
function Ie(r, e, t) {
  const s = (l) => {
    const i = r.get(l);
    if (!i || i.polling) return;
    i.polling = !0;
    const u = () => {
      i.polling && (e(l, i.panel), requestAnimationFrame(u));
    };
    requestAnimationFrame(u);
  }, a = (l) => {
    const i = r.get(l);
    i && (i.polling = !1, t(l, i));
  };
  return { handleAnimationStart: (l) => {
    const i = l.currentTarget;
    s(i);
  }, handleAnimationEnd: (l) => {
    const i = l.currentTarget;
    i.getAnimations().length === 0 && a(i);
  } };
}
function G(r, e, t, s, a) {
  const c = t / 2, o = s / 2, l = Math.abs(r + 0.5 - c), i = Math.abs(e + 0.5 - o), u = c - a, h = o - a;
  if (l <= u && i <= h)
    return Math.min(u + a - l, h + a - i);
  if (l > u && i <= h)
    return a - (l - u);
  if (i > h && l <= u)
    return a - (i - h);
  {
    const d = l - u, f = i - h;
    return a - Math.sqrt(d * d + f * f);
  }
}
function Oe(r, e, t, s, a, c = !1) {
  const o = Math.ceil(r), l = Math.ceil(e), i = new Uint8Array(o * l * 4), u = [
    [-0.25, -0.25],
    [0.25, -0.25],
    [-0.25, 0.25],
    [0.25, 0.25]
  ];
  for (let h = 0; h < l; h++)
    for (let d = 0; d < o; d++) {
      let f = 0, p = 0, g = 1, n = 0;
      for (const [x, S] of u) {
        const k = G(d + x, h + S, o, l, t);
        n += k >= 0 ? 1 : 0;
      }
      const C = n / u.length * 255, T = o / 2, R = l / 2, m = Math.abs(d + 0.5 - T), v = Math.abs(h + 0.5 - R), y = T - t, b = R - t;
      let w = 0, O = 0, U = 0, E = m, D = v;
      if (m <= y && v <= b) {
        const x = y + t, S = b + t;
        x - m < S - v ? (E = y + t, D = v) : (E = m, D = b + t), w = Math.min(x - m, S - v);
      } else if (m > y && v <= b)
        E = y + t, D = v, w = t - (m - y);
      else if (v > b && m <= y)
        E = m, D = b + t, w = t - (v - b);
      else {
        const x = m - y, S = v - b, k = Math.sqrt(x * x + S * S);
        w = t - k, k > 0 && (E = y + x / k * t, D = b + S / k * t);
      }
      const P = E - m, A = D - v, I = Math.sqrt(P * P + A * A);
      if (I > 1e-3 && (O = (d > T ? 1 : -1) * (P / I), U = (h > R ? 1 : -1) * (A / I)), s > 0 && w < s && w >= 0) {
        const x = j(w, s), { derivative: S } = W(x, a);
        f = O * S * 0.5, p = U * S * 0.5, c && (f = -f, p = -p);
      }
      const F = Math.sqrt(f * f + p * p + g * g);
      f /= F, p /= F, g /= F;
      const B = (h * o + d) * 4;
      i[B] = (f * 0.5 + 0.5) * 255 | 0, i[B + 1] = (p * 0.5 + 0.5) * 255 | 0, i[B + 2] = (g * 0.5 + 0.5) * 255 | 0, i[B + 3] = C;
    }
  return M.from({
    resource: i,
    width: o,
    height: l
  });
}
function Be(r, e, t, s, a = "squircle", c = !1) {
  const o = Math.ceil(r), l = Math.ceil(e), i = new Uint8Array(o * l * 4);
  for (let u = 0; u < l; u++)
    for (let h = 0; h < o; h++) {
      const d = G(h, u, o, l, t), f = d >= 0 ? 255 : 0;
      let p = 0;
      if (s > 0 && d >= 0 && d < s) {
        const n = j(d, s), { height: C } = W(n, a);
        p = (1 - C) * 255;
      } else d < 0 && (p = 0);
      c && (p = 255 - p);
      const g = (u * o + h) * 4;
      i[g] = p, i[g + 1] = p, i[g + 2] = p, i[g + 3] = f;
    }
  return { data: i, width: o, height: l };
}
function ee(r, e, t, s, a = "squircle", c = !1) {
  const o = Be(r, e, t, s, a, c);
  return M.from({
    resource: o.data,
    width: o.width,
    height: o.height
  });
}
function Ne(r, e, t) {
  const s = Math.ceil(r), a = Math.ceil(e), c = new Uint8Array(s * a * 4);
  for (let o = 0; o < a; o++)
    for (let l = 0; l < s; l++) {
      const u = G(l, o, s, a, t) >= 0 ? 255 : 0, h = l / (s - 1), d = o / (a - 1), f = (o * s + l) * 4;
      c[f] = h * 255 | 0, c[f + 1] = d * 255 | 0, c[f + 2] = 0, c[f + 3] = u;
    }
  return { data: c, width: s, height: a };
}
function ze(r, e, t) {
  const s = Ne(r, e, t);
  return M.from({
    resource: s.data,
    width: s.width,
    height: s.height
  });
}
function Ve(r, e, t, s) {
  const a = Math.ceil(r), c = Math.ceil(e), o = new Uint8Array(a * c * 4);
  for (let l = 0; l < c; l++)
    for (let i = 0; i < a; i++) {
      const u = G(i, l, a, c, t), h = u >= 0 ? 255 : 0;
      let d = 0;
      s > 0 && u >= 0 && u < s && (d = (s - u) / s * 255);
      const f = (l * a + i) * 4;
      o[f] = d, o[f + 1] = d, o[f + 2] = d, o[f + 3] = h;
    }
  return { data: o, width: a, height: c };
}
function _e(r, e, t, s) {
  const a = Ve(r, e, t, s);
  return M.from({
    resource: a.data,
    width: a.width,
    height: a.height
  });
}
function Le(r, e, t, s, a, c) {
  const o = Math.ceil(r), l = Math.ceil(e), i = new Uint8Array(o * l * 4), u = [
    [-0.25, -0.25],
    [0.25, -0.25],
    [-0.25, 0.25],
    [0.25, 0.25]
  ];
  for (let h = 0; h < l; h++)
    for (let d = 0; d < o; d++) {
      let f = 0, p = 0, g = 1, n = 0;
      for (const [x, S] of u) {
        const k = G(d + x, h + S, o, l, t);
        n += k >= 0 ? 1 : 0;
      }
      const C = n / u.length * 255, T = o / 2, R = l / 2, m = Math.abs(d + 0.5 - T), v = Math.abs(h + 0.5 - R), y = T - t, b = R - t;
      let w = 0, O = 0, U = 0, E = m, D = v;
      if (m <= y && v <= b) {
        const x = y + t, S = b + t;
        x - m < S - v ? (E = y + t, D = v) : (E = m, D = b + t), w = Math.min(x - m, S - v);
      } else if (m > y && v <= b)
        E = y + t, D = v, w = t - (m - y);
      else if (v > b && m <= y)
        E = m, D = b + t, w = t - (v - b);
      else {
        const x = m - y, S = v - b, k = Math.sqrt(x * x + S * S);
        w = t - k, k > 0 && (E = y + x / k * t, D = b + S / k * t);
      }
      const P = E - m, A = D - v, I = Math.sqrt(P * P + A * A);
      if (I > 1e-3 && (O = (d > T ? 1 : -1) * (P / I), U = (h > R ? 1 : -1) * (A / I)), s > 0 && w < s && w >= 0) {
        const x = j(w, s), { derivative: S } = W(x, a);
        f = O * S * 0.5, p = U * S * 0.5, c && (f = -f, p = -p);
      }
      const F = Math.sqrt(f * f + p * p + g * g);
      f /= F, p /= F, g /= F;
      const B = (h * o + d) * 4;
      i[B] = (f * 0.5 + 0.5) * 255 | 0, i[B + 1] = (p * 0.5 + 0.5) * 255 | 0, i[B + 2] = (g * 0.5 + 0.5) * 255 | 0, i[B + 3] = C;
    }
  return { data: i, width: o, height: l };
}
function Ge(r, e, t, s, a = "squircle", c = !1) {
  const o = Le(r, e, t, s, a, c);
  return M.from({
    resource: o.data,
    width: o.width,
    height: o.height
  });
}
function $e(r, e, t, s, a = "squircle", c = !1, o = !1) {
  return {
    normalMap: Ge(r, e, t, s, a, c),
    displacementMap: ee(r, e, t, s, a, o),
    uvMap: ze(r, e, t),
    edgeMap: _e(r, e, t, s)
  };
}
class Je {
  constructor(e, t) {
    this.tracked = /* @__PURE__ */ new Map(), this.system = new Fe(e, t.systemOptions), this.system.setOpaqueSceneCallback((a) => {
      e.render({ container: t.background, target: a, clear: !0 });
    });
    const s = this.system.getCompositeDisplay();
    s && t.stage.addChild(s), this.lightFollow = new Ue(e), this.domTracking = new Pe(this.tracked, {
      syncElement: this.syncElement.bind(this),
      updateGeometry: this.updatePanelGeometry.bind(this),
      isCssVisible: this.isCssVisible.bind(this),
      parseBorderRadius: this.parseBorderRadius.bind(this)
    }), this.animationHandlers = Ie(
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
    const s = this.createMaterial(e, t), a = e.getBoundingClientRect(), c = this.detectCircleMode(e, t), o = this.calculateRadius(e, a, t, c), l = this.createNormalMap(a, o, t, c), i = this.system.createPanel({ material: s, normalMap: l }), u = {
      panel: i,
      config: t,
      lastRect: a,
      lastRadius: o,
      visible: !0,
      isCircle: c,
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
    const s = e.dataset.glassIor ? parseFloat(e.dataset.glassIor) : void 0, a = e.dataset.glassRoughness ? parseFloat(e.dataset.glassRoughness) : void 0, c = {
      ...he.clear(),
      ...t.material
    };
    return s !== void 0 && (c.ior = s), a !== void 0 && (c.roughness = a), c;
  }
  detectCircleMode(e, t) {
    return t.isCircle || e.classList.contains("glass-circle") || e.hasAttribute("data-glass-circle");
  }
  calculateRadius(e, t, s, a) {
    if (a)
      return Math.min(t.width, t.height) / 2;
    const c = this.parseBorderRadius(e, t);
    return s.cornerRadius ?? c;
  }
  createNormalMap(e, t, s, a) {
    if (s.normalMap) return s.normalMap;
    const c = s.bevelSize ?? 12, o = s.surfaceShape ?? "squircle", l = s.invertNormals ?? !1, i = s.useDisplacementMap ?? !1, u = window.devicePixelRatio || 1, h = Math.floor(Math.min(e.width, e.height) * u), d = a ? h : e.width * u, f = a ? h : e.height * u;
    return i ? ee(d, f, t * u, c * u, o) : Oe(d, f, t * u, c * u, o, l);
  }
  syncElement(e, t) {
    const s = this.tracked.get(e), a = e.getBoundingClientRect(), c = s != null && s.isCircle ? Math.floor(Math.min(a.width, a.height)) : Math.round(a.width), o = s != null && s.isCircle ? c : Math.round(a.height), l = Math.round(a.left) + c / 2, i = Math.round(a.top) + o / 2;
    if (this.positionTransform) {
      const u = this.positionTransform(l, i, c, o);
      t.position.set(Math.round(u.x), Math.round(u.y)), t.scale.set(Math.round(c * u.scaleX), Math.round(o * u.scaleY)), t.rotation = u.rotation;
    } else
      t.position.set(l, i), t.scale.set(c, o), t.rotation = 0;
  }
  parseBorderRadius(e, t) {
    const s = window.getComputedStyle(e), a = s.borderTopLeftRadius, c = s.borderTopRightRadius, o = s.borderBottomRightRadius, l = s.borderBottomLeftRadius, i = (p, g) => p.endsWith("%") ? parseFloat(p) / 100 * g : parseFloat(p) || 0, u = (p) => p.split(" ")[0], h = (t.width + t.height) / 2;
    return [
      i(u(a), h),
      i(u(c), h),
      i(u(o), h),
      i(u(l), h)
    ].reduce((p, g) => p + g, 0) / 4 || 20;
  }
  isCssVisible(e) {
    if (e.hidden) return !1;
    const t = window.getComputedStyle(e);
    return t.display !== "none" && t.visibility !== "hidden";
  }
  updatePanelGeometry(e, t) {
    const s = e.getBoundingClientRect(), a = this.detectCircleMode(e, t.config), c = this.calculateRadius(e, s, t.config, a), o = this.createNormalMap(s, c, t.config, a);
    t.panel.setTextures({ normalMap: o }), t.lastRect = s, t.lastRadius = c;
  }
}
export {
  ce as AdaptiveQualityController,
  oe as CapabilityProbe,
  ue as EventBus,
  Ye as GlassHUD,
  Je as GlassOverlay,
  ge as GlassPanel,
  he as GlassPresets,
  Fe as GlassSystem,
  K as SceneRTManager,
  $e as createAllMaps,
  Xe as createDefaultEdgeMask,
  V as createDefaultEdgeTactic,
  ee as createDisplacementMap,
  Be as createDisplacementMapData,
  _e as createEdgeMap,
  Ve as createEdgeMapData,
  Ge as createNormalMap,
  Le as createNormalMapData,
  We as createPillGeometry,
  Qe as createPillNormalMap,
  Oe as createRoundedRectNormalMap,
  ze as createUVMap,
  Ne as createUVMapData,
  G as getDistanceToBoundary,
  W as getHeightAndDerivative,
  ve as heightCircle,
  be as heightSquircle,
  Z as hexToVec3,
  je as smootherstep,
  qe as updatePillGeometry
};
//# sourceMappingURL=pixi-adaptive-glass.es.js.map
