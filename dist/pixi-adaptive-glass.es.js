import { Rectangle as te, RenderTexture as B, MeshGeometry as Q, Mesh as $, State as J, Shader as z, Texture as S, Sprite as q, Filter as se, GlProgram as ie, UniformGroup as _, Container as H, Graphics as ae, Text as re } from "pixi.js";
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
  { check: (a) => a.renderScale > 0.85, apply: (a) => {
    a.renderScale = 0.85;
  }, action: "scale-rt-0-85", reason: "Frame budget exceeded" },
  { check: (a) => a.renderScale > 0.7, apply: (a) => {
    a.renderScale = 0.7;
  }, action: "scale-rt-0-7", reason: "Severe perf drop" },
  { check: (a) => a.maxBlurTaps > 5, apply: (a) => {
    a.maxBlurTaps = 5;
  }, action: "reduce-blur", reason: "Sustained frame drops" },
  { check: (a) => a.enableDispersion, apply: (a) => {
    a.enableDispersion = !1;
  }, action: "disable-dispersion", reason: "Dispersion too expensive" },
  { check: (a) => a.enableCaustics || a.enableContactShadows, apply: (a) => {
    a.enableCaustics = !1, a.enableContactShadows = !1;
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
    const e = this.telemetry.reduce((s, i) => s + i.cpuMs, 0) / this.telemetry.length, t = this.telemetry.reduce((s, i) => s + (i.gpuMs ?? i.cpuMs), 0) / this.telemetry.length;
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
    const i = this.renderer.resolution * s;
    return (!this.handles || this.handles.sceneColor.width !== e || this.handles.sceneColor.height !== t || this.handles.sceneColor.source.resolution !== i) && (this.dispose(), this.handles = {
      sceneColor: B.create({
        width: e,
        height: t,
        resolution: i,
        scaleMode: "linear"
      }),
      sceneDepth: this.useDepth ? B.create({
        width: e,
        height: t,
        resolution: i,
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
      for (const i of s)
        i(t);
  }
  removeAll() {
    var e;
    for (const t of Object.keys(this.listeners))
      (e = this.listeners[t]) == null || e.clear();
  }
}
const V = (a) => a, he = {
  water() {
    return V({
      ior: 1.333,
      thickness: 0.6,
      roughness: 0.1,
      dispersion: 0.02,
      opacity: 1,
      tint: 10476031
    });
  },
  crownGlass() {
    return V({
      ior: 1.52,
      thickness: 0.8,
      roughness: 0.05,
      dispersion: 0.04,
      opacity: 1,
      tint: 16777215
    });
  },
  acrylic() {
    return V({
      ior: 1.49,
      thickness: 0.7,
      roughness: 0.12,
      dispersion: 0.01,
      opacity: 1,
      tint: 16250871
    });
  },
  clear() {
    return V({
      ior: 1.52,
      thickness: 0.8,
      roughness: 0.05,
      dispersion: 0.04,
      opacity: 1,
      tint: 16777215
    });
  },
  fromIOR(a) {
    const e = Math.min(Math.max(a, 1), 2);
    return V({
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
const fe = new Q({
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
`, ge = `
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;
class me extends $ {
  constructor(e) {
    const t = J.for2d();
    t.culling = !1, super({
      geometry: e.geometry ?? fe,
      shader: z.from({
        gl: {
          vertex: pe,
          fragment: ge
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
class Be {
  constructor(e, t) {
    this.tracked = /* @__PURE__ */ new Map(), this.currentLightDir = [0, 0, 0.15], this.targetLightDir = [0, 0, 0.15], this.delayedLightDir = [0, 0, 0.15], this.handleAnimationStart = (i) => {
      const r = i.currentTarget;
      this.startPolling(r);
    }, this.handleAnimationEnd = (i) => {
      const r = i.currentTarget;
      r.getAnimations().length === 0 && this.stopPolling(r);
    }, this.renderer = e, this.background = t.background, this.system = new Ie(e, t.systemOptions), this.system.setOpaqueSceneCallback((i) => {
      e.render({ container: this.background, target: i, clear: !0 });
    });
    const s = this.system.getCompositeDisplay();
    s && t.stage.addChild(s), t.lightFollowParams && this.setLightFollowParams(t.lightFollowParams);
  }
  setLightFollowParams(e) {
    this.lightFollowParams = e, e.followCursor && !this.boundMouseMove ? (this.boundMouseMove = (t) => {
      const s = e.curve ?? 1.5, i = e.zMin ?? 0.05, r = e.zMax ?? 0.2, n = e.edgeStretch ?? 0.5, l = this.renderer.canvas.getBoundingClientRect();
      let u = (t.clientX - l.left) / l.width * 2 - 1, h = (t.clientY - l.top) / l.height * 2 - 1;
      u = Math.sign(u) * Math.pow(Math.abs(u), n), h = Math.sign(h) * Math.pow(Math.abs(h), n);
      const d = Math.sqrt(u * u + h * h), g = Math.max(i, Math.min(r, r - Math.pow(d, s) * r * 0.5));
      this.targetLightDir = [u, h, g];
    }, window.addEventListener("mousemove", this.boundMouseMove)) : !e.followCursor && this.boundMouseMove && (window.removeEventListener("mousemove", this.boundMouseMove), this.boundMouseMove = void 0);
  }
  autoMount(e = ".glass-panel") {
    this.resizeObserver = new ResizeObserver((s) => {
      for (const i of s) {
        const r = i.target, n = this.tracked.get(r);
        if (!n) continue;
        const c = r.getBoundingClientRect(), l = n.lastRect;
        l && (Math.abs(c.width - l.width) > 1 || Math.abs(c.height - l.height) > 1) && this.updatePanelGeometry(r, n), n.lastRect = c;
      }
    }), this.intersectionObserver = new IntersectionObserver((s) => {
      for (const i of s) {
        const r = i.target, n = this.tracked.get(r);
        if (!n) continue;
        n.visible = i.isIntersecting;
        const c = this.isCssVisible(r);
        n.panel.visible = n.visible && c;
      }
    }), document.querySelectorAll(e).forEach((s) => this.track(s)), this.observer = new MutationObserver((s) => {
      for (const i of s)
        if (i.type === "childList")
          i.addedNodes.forEach((r) => {
            r instanceof HTMLElement && r.matches(e) && this.track(r), r instanceof HTMLElement && r.querySelectorAll(e).forEach((c) => this.track(c));
          }), i.removedNodes.forEach((r) => {
            r instanceof HTMLElement && this.tracked.has(r) && this.untrack(r);
          });
        else if (i.type === "attributes") {
          const r = i.target;
          if (i.attributeName === "class")
            r.matches(e) ? this.track(r) : this.untrack(r);
          else if (i.attributeName === "style") {
            const n = this.tracked.get(r);
            if (n) {
              const c = this.isCssVisible(r);
              n.panel.visible = c && n.visible;
              const l = r.getBoundingClientRect(), u = this.parseBorderRadius(r, l);
              Math.abs(u - n.lastRadius) > 0.5 && this.updatePanelGeometry(r, n);
            }
          } else if (i.attributeName === "hidden") {
            const n = this.tracked.get(r);
            if (n) {
              const c = this.isCssVisible(r);
              n.panel.visible = c && n.visible;
            }
          }
        }
      this.cleanup();
    }), this.observer.observe(document.body, {
      childList: !0,
      subtree: !0,
      attributes: !0,
      attributeFilter: ["class", "style", "hidden"]
    });
  }
  track(e, t = {}) {
    var m, v;
    if (this.tracked.has(e))
      return this.tracked.get(e).panel;
    const s = e.dataset.glassIor ? parseFloat(e.dataset.glassIor) : void 0, i = e.dataset.glassRoughness ? parseFloat(e.dataset.glassRoughness) : void 0, r = {
      ...he.clear(),
      ...t.material
    };
    s !== void 0 && (r.ior = s), i !== void 0 && (r.roughness = i);
    const n = e.getBoundingClientRect(), c = t.isCircle || e.classList.contains("glass-circle") || e.hasAttribute("data-glass-circle");
    let l;
    if (c)
      l = Math.min(n.width, n.height) / 2;
    else {
      const b = this.parseBorderRadius(e, n);
      l = t.cornerRadius ?? b;
    }
    const u = t.bevelSize ?? 12, h = t.surfaceShape ?? "squircle", d = t.flipX ?? !1, g = t.flipY ?? !1, p = t.bezierCurve, f = Math.floor(Math.min(n.width, n.height)), o = c ? f : n.width, D = c ? f : n.height, M = t.normalMap || X(o, D, l, u, h, d, g, p), x = this.system.createPanel({
      material: r,
      normalMap: M
    });
    return this.tracked.set(e, { panel: x, config: t, lastRect: n, lastRadius: l, visible: !0, isCircle: c, polling: !1 }), (m = this.resizeObserver) == null || m.observe(e), (v = this.intersectionObserver) == null || v.observe(e), e.addEventListener("transitionrun", this.handleAnimationStart), e.addEventListener("transitionend", this.handleAnimationEnd), e.addEventListener("transitioncancel", this.handleAnimationEnd), e.addEventListener("animationstart", this.handleAnimationStart), e.addEventListener("animationend", this.handleAnimationEnd), e.addEventListener("animationcancel", this.handleAnimationEnd), this.syncElement(e, x), x;
  }
  startPolling(e) {
    const t = this.tracked.get(e);
    if (!t || t.polling) return;
    t.polling = !0;
    const s = () => {
      t.polling && (this.syncElement(e, t.panel), requestAnimationFrame(s));
    };
    requestAnimationFrame(s);
  }
  stopPolling(e) {
    const t = this.tracked.get(e);
    t && (t.polling = !1, this.updatePanelGeometry(e, t));
  }
  untrack(e) {
    var s, i;
    const t = this.tracked.get(e);
    t && (t.polling = !1, (s = this.resizeObserver) == null || s.unobserve(e), (i = this.intersectionObserver) == null || i.unobserve(e), e.removeEventListener("transitionrun", this.handleAnimationStart), e.removeEventListener("transitionend", this.handleAnimationEnd), e.removeEventListener("transitioncancel", this.handleAnimationEnd), e.removeEventListener("animationstart", this.handleAnimationStart), e.removeEventListener("animationend", this.handleAnimationEnd), e.removeEventListener("animationcancel", this.handleAnimationEnd), this.system.removePanel(t.panel), this.tracked.delete(e));
  }
  update() {
    var e;
    if ((e = this.lightFollowParams) != null && e.followCursor) {
      const s = 1 - (this.lightFollowParams.delay ?? 0.5) * 0.97;
      this.delayedLightDir[0] += (this.targetLightDir[0] - this.delayedLightDir[0]) * s, this.delayedLightDir[1] += (this.targetLightDir[1] - this.delayedLightDir[1]) * s, this.delayedLightDir[2] += (this.targetLightDir[2] - this.delayedLightDir[2]) * s;
      const r = 1 - (this.lightFollowParams.smoothing ?? 0.9) * 0.97;
      this.currentLightDir[0] += (this.delayedLightDir[0] - this.currentLightDir[0]) * r, this.currentLightDir[1] += (this.delayedLightDir[1] - this.currentLightDir[1]) * r, this.currentLightDir[2] += (this.delayedLightDir[2] - this.currentLightDir[2]) * r;
      for (const [, n] of this.tracked)
        n.panel.glassMaterial.lightDir = [...this.currentLightDir];
    }
    for (const [t, s] of this.tracked)
      this.syncElement(t, s.panel);
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
    var e, t, s;
    this.boundMouseMove && (window.removeEventListener("mousemove", this.boundMouseMove), this.boundMouseMove = void 0), (e = this.observer) == null || e.disconnect(), (t = this.resizeObserver) == null || t.disconnect(), (s = this.intersectionObserver) == null || s.disconnect(), this.system.destroy(), this.tracked.clear();
  }
  syncElement(e, t) {
    const s = this.tracked.get(e), i = e.getBoundingClientRect(), r = i.left + i.width / 2, n = i.top + i.height / 2;
    let c = i.width, l = i.height;
    if (s != null && s.isCircle) {
      const u = Math.floor(Math.min(i.width, i.height));
      c = u, l = u;
    }
    if (this.positionTransform) {
      const u = this.positionTransform(r, n, c, l);
      t.position.set(u.x, u.y), t.scale.set(c * u.scaleX, l * u.scaleY), t.rotation = u.rotation;
    } else
      t.position.set(r, n), t.scale.set(c, l), t.rotation = 0;
  }
  parseBorderRadius(e, t) {
    const s = window.getComputedStyle(e), i = s.borderTopLeftRadius, r = s.borderTopRightRadius, n = s.borderBottomRightRadius, c = s.borderBottomLeftRadius, l = (p, f) => p.endsWith("%") ? parseFloat(p) / 100 * f : parseFloat(p) || 0, u = (p) => p.split(" ")[0], h = (t.width + t.height) / 2;
    return [
      l(u(i), h),
      l(u(r), h),
      l(u(n), h),
      l(u(c), h)
    ].reduce((p, f) => p + f, 0) / 4 || 20;
  }
  isCssVisible(e) {
    if (e.hidden) return !1;
    const t = window.getComputedStyle(e);
    return t.display !== "none" && t.visibility !== "hidden";
  }
  updatePanelGeometry(e, t) {
    const s = e.getBoundingClientRect(), i = t.config.isCircle || e.classList.contains("glass-circle") || e.hasAttribute("data-glass-circle");
    let r;
    if (i)
      r = Math.min(s.width, s.height) / 2;
    else {
      const o = this.parseBorderRadius(e, s);
      r = t.config.cornerRadius ?? o;
    }
    const n = t.config.bevelSize ?? 12, c = t.config.surfaceShape ?? "squircle", l = t.config.flipX ?? !1, u = t.config.flipY ?? !1, h = t.config.bezierCurve, d = Math.floor(Math.min(s.width, s.height)), g = i ? d : s.width, p = i ? d : s.height, f = X(
      g,
      p,
      r,
      n,
      c,
      l,
      u,
      h
    );
    t.panel.setTextures({ normalMap: f }), t.lastRect = s, t.lastRadius = r;
  }
}
function ve(a) {
  return Math.sqrt(Math.max(0, 2 * a - a * a));
}
function ye(a) {
  const e = Math.sqrt(Math.max(1e-4, 2 * a - a * a));
  return (1 - a) / e;
}
function j(a) {
  const e = 1 - Math.pow(1 - a, 4);
  return Math.pow(Math.max(0, e), 0.25);
}
function W(a) {
  const e = 1 - Math.pow(1 - a, 4);
  return e <= 1e-4 ? 0 : Math.pow(1 - a, 3) / Math.pow(e, 0.75);
}
function be(a) {
  const e = Math.max(0, Math.min(1, a));
  return e * e * e * (e * (e * 6 - 15) + 10);
}
function Se(a) {
  const e = Math.max(0, Math.min(1, a));
  return 30 * e * e * (e - 1) * (e - 1);
}
function Me(a, e, t, s, i) {
  const r = 1 - a;
  return r * r * r * e + 3 * r * r * a * t + 3 * r * a * a * s + a * a * a * i;
}
function De(a, e, t, s, i) {
  const r = 1 - a;
  return 3 * r * r * (t - e) + 6 * r * a * (s - t) + 3 * a * a * (i - s);
}
function xe(a, e) {
  const t = Me(a, 0, e[1], e[3], 1), s = De(a, 0, e[1], e[3], 1);
  return { height: t, derivative: s };
}
function Z(a, e, t) {
  if (t)
    return xe(a, t);
  switch (e) {
    case "circle":
      return { height: ve(a), derivative: ye(a) };
    case "squircle":
      return { height: j(a), derivative: W(a) };
    case "concave": {
      const s = j(a), i = W(a);
      return { height: 1 - s, derivative: -i };
    }
    case "lip": {
      const s = j(a), i = W(a), r = 1 - s, n = -i, c = be(a), l = Se(a), u = s * (1 - c) + r * c, h = i * (1 - c) + n * c + (r - s) * l;
      return { height: u, derivative: h };
    }
    case "dome": {
      const s = Math.sqrt(Math.max(0, 1 - a * a)), i = a > 1e-3 ? -a / s : 0;
      return { height: s, derivative: i };
    }
    case "ridge": {
      const s = 1 - Math.sqrt(Math.max(0, 1 - a * a)), i = a > 1e-3 ? a / Math.sqrt(Math.max(1e-3, 1 - a * a)) : 0;
      return { height: s, derivative: i };
    }
    case "wave": {
      const s = (1 - Math.cos(a * Math.PI)) / 2, i = Math.PI * Math.sin(a * Math.PI) / 2;
      return { height: s, derivative: i };
    }
    case "flat":
      return { height: 0, derivative: 0 };
  }
}
function X(a, e, t, s, i, r = !1, n = !1, c) {
  const l = Math.ceil(a), u = Math.ceil(e), h = new Uint8Array(l * u * 4);
  for (let d = 0; d < u; d++)
    for (let g = 0; g < l; g++) {
      let p = 0, f = 0, o = 1, D = 255;
      const M = (l - 1) / 2, x = (u - 1) / 2, m = Math.abs(g - M), v = Math.abs(d - x), b = l / 2 - t, y = u / 2 - t;
      let w = 0, F = 0, I = 0, T = m, E = v;
      if (m <= b && v <= y) {
        const A = b + t, U = y + t;
        A - m < U - v ? (T = b + t, E = v) : (T = m, E = y + t), w = Math.min(A - m, U - v);
      } else if (m > b && v <= y)
        T = b + t, E = v, w = t - (m - b);
      else if (v > y && m <= b)
        T = m, E = y + t, w = t - (v - y);
      else {
        const A = m - b, U = v - y, O = Math.sqrt(A * A + U * U);
        w = t - O, O > 0 && (T = b + A / O * t, E = y + U / O * t);
      }
      w < 0 && (D = 0);
      const L = T - m, k = E - v, R = Math.sqrt(L * L + k * k);
      if (R > 1e-3 && (F = (g > M ? 1 : -1) * (L / R), I = (d > x ? 1 : -1) * (k / R)), s > 0 && w < s && w >= 0) {
        let A = 1 - w / s;
        n && (A = 1 - A);
        const { derivative: U } = Z(A, i, c), O = n ? -1 : 1;
        p = F * U * 0.5 * O, f = I * U * 0.5 * O, r && (p = -p, f = -f);
      }
      const C = Math.sqrt(p * p + f * f + o * o);
      p /= C, f /= C, o /= C;
      const P = (d * l + g) * 4;
      h[P] = (p * 0.5 + 0.5) * 255 | 0, h[P + 1] = (f * 0.5 + 0.5) * 255 | 0, h[P + 2] = (o * 0.5 + 0.5) * 255 | 0, h[P + 3] = D;
    }
  return S.from({
    resource: h,
    width: l,
    height: u
  });
}
function Oe(a, e = 0, t = 32) {
  const s = e / 2, i = 1 + t, r = new Float32Array(i * 2), n = new Float32Array(i * 2), c = a * 2 + e, l = a * 2;
  r[0] = 0, r[1] = 0, n[0] = 0.5, n[1] = 0.5;
  for (let d = 0; d < t; d++) {
    const g = d / t * Math.PI * 2 - Math.PI / 2, p = (d + 1) * 2;
    let f, o;
    g >= -Math.PI / 2 && g <= Math.PI / 2 ? (f = Math.cos(g) * a + s, o = Math.sin(g) * a) : (f = Math.cos(g) * a - s, o = Math.sin(g) * a), r[p] = f / c, r[p + 1] = o / l, n[p] = f / c + 0.5, n[p + 1] = o / l + 0.5;
  }
  const u = t, h = new Uint32Array(u * 3);
  for (let d = 0; d < t; d++) {
    const g = d * 3;
    h[g] = 0, h[g + 1] = d + 1, h[g + 2] = (d + 1) % t + 1;
  }
  return new Q({
    positions: r,
    uvs: n,
    indices: h
  });
}
function ze(a, e, t, s = 32) {
  const i = a.getAttribute("aPosition"), r = a.getAttribute("aUV");
  if (!i || !r) return;
  const n = i.buffer.data, c = r.buffer.data, l = t / 2, u = e * 2 + t, h = e * 2;
  for (let d = 0; d < s; d++) {
    const g = d / s * Math.PI * 2 - Math.PI / 2, p = (d + 1) * 2;
    let f, o;
    g >= -Math.PI / 2 && g <= Math.PI / 2 ? (f = Math.cos(g) * e + l, o = Math.sin(g) * e) : (f = Math.cos(g) * e - l, o = Math.sin(g) * e), n[p] = f / u, n[p + 1] = o / h, c[p] = f / u + 0.5, c[p + 1] = o / h + 0.5;
  }
  i.buffer.update(), r.buffer.update();
}
function Ne(a, e, t, s, i, r = !1, n = !1) {
  const c = Math.ceil(a), l = Math.ceil(e), u = new Uint8Array(c * l * 4), h = l / 2, d = t / 2;
  for (let g = 0; g < l; g++)
    for (let p = 0; p < c; p++) {
      let f = 0, o = 0, D = 1, M = 255;
      const x = (c - 1) / 2, m = (l - 1) / 2, v = p - x, b = g - m;
      let y = 0, w = 0, F = 0;
      const I = Math.abs(v), T = Math.abs(b);
      if (I <= d)
        y = h - T, w = 0, F = b > 0 ? 1 : -1;
      else {
        const k = v > 0 ? d : -d, R = v - k, C = b, P = Math.sqrt(R * R + C * C);
        y = h - P, P > 1e-3 && (w = R / P, F = C / P);
      }
      if (y < 0 && (M = 0), s > 0 && y < s && y >= 0) {
        let k = 1 - y / s;
        n && (k = 1 - k);
        const { derivative: R } = Z(k, i), C = n ? -1 : 1;
        f = w * R * 0.5 * C, o = F * R * 0.5 * C, r && (f = -f, o = -o);
      }
      const E = Math.sqrt(f * f + o * o + D * D);
      f /= E, o /= E, D /= E;
      const L = (g * c + p) * 4;
      u[L] = (f * 0.5 + 0.5) * 255 | 0, u[L + 1] = (o * 0.5 + 0.5) * 255 | 0, u[L + 2] = (D * 0.5 + 0.5) * 255 | 0, u[L + 3] = M;
    }
  return S.from({
    resource: u,
    width: c,
    height: l
  });
}
function ee(a) {
  return [
    (a >> 16 & 255) / 255,
    (a >> 8 & 255) / 255,
    (a & 255) / 255
  ];
}
function N(a) {
  return {
    enabled: !1,
    rangeStart: 0,
    rangeEnd: 0.3,
    strength: 1,
    opacity: 1,
    ...a
  };
}
function _e(a) {
  return {
    cutoff: 1e-3,
    blur: 0,
    invert: !1,
    smoothing: N({ rangeEnd: 0.3, strength: 1 }),
    contrast: N({ rangeEnd: 0.3, strength: 0.7 }),
    alpha: N({ rangeEnd: 0.2, strength: 1 }),
    tint: N({ rangeEnd: 0.5, strength: 0.5 }),
    darken: N({ rangeEnd: 0.3, strength: 0.3 }),
    desaturate: N({ rangeEnd: 0.4, strength: 0.5 }),
    ...a
  };
}
class we extends se {
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
      glProgram: new ie({
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
        uSceneColor: S.WHITE.source,
        uNormalMap: S.WHITE.source,
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
class Ee {
  constructor(e) {
    this.renderer = e, this.id = "webgl1", this.filter = new we(), this.rtManager = new K(e, !1), this.blitSprite = new q(S.WHITE);
  }
  setup() {
  }
  render(e) {
    const { renderer: t, panels: s, quality: i, drawOpaqueScene: r } = e, n = this.rtManager.ensure(
      t.screen.width,
      t.screen.height,
      i.renderScale
    );
    r(n.sceneColor), this.blitSprite.texture = n.sceneColor, this.blitSprite.width = t.screen.width, this.blitSprite.height = t.screen.height, t.render({ container: this.blitSprite, clear: !0 });
    const c = [...s].sort((l, u) => (l.zIndex ?? 0) - (u.zIndex ?? 0));
    for (const l of c)
      this.applyFilter(l, n.sceneColor, i), t.render({ container: l });
  }
  dispose() {
    this.rtManager.dispose();
  }
  applyFilter(e, t, s) {
    if (!(!!(e.normalMap || e.dudvMap) || e.glassMaterial.dispersion > 1e-3 || e.glassMaterial.roughness > 1e-3)) {
      e.filters = null;
      return;
    }
    const r = this.filter.resources;
    r.uSceneColor = t.source, r.uNormalMap = (e.normalMap ?? e.dudvMap ?? S.WHITE).source;
    const n = r.uniforms;
    n.uInvResolution = [1 / t.width, 1 / t.height], n.uDispersion = e.glassMaterial.dispersion, n.uRoughness = e.glassMaterial.roughness, n.uDisplacementScale = e.glassMaterial.thickness * 0.1, n.uTint = ee(e.glassMaterial.tint ?? 16777215), n.uOpacity = e.glassMaterial.opacity, n.uEnableDispersion = s.enableDispersion && e.glassMaterial.dispersion > 1e-3 ? 1 : 0, e.filters = [this.filter];
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
`, Te = `
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
`, Re = `
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
`, Ce = `
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
`, Ae = `
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

  // Discard pixels outside the shape (border radius)
  if (shapeMask < 0.5) {
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

  vec2 offset = normal * uThickness * 0.1 * (uIOR - 1.0);

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
`, Fe = `
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
`, ke = `
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
`, Pe = new Q({
  positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
  indices: new Uint32Array([0, 1, 2, 0, 2, 3])
});
class Ue {
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
      gl: { vertex: Y, fragment: Ae },
      resources: {
        uSceneColor: S.WHITE.source,
        uNormalMap: S.WHITE.source,
        uCausticsMap: S.WHITE.source,
        uDistanceField: S.WHITE.source,
        panelUniforms: s
      }
    });
    const i = new _({
      uPosition: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
      uScale: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uResolution: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uOpacity: { value: 1, type: "f32" }
    });
    this.revealageShader = z.from({
      gl: { vertex: Y, fragment: Fe },
      resources: {
        uNormalMap: S.WHITE.source,
        panelUniforms: i
      }
    }), this.compositeShader = z.from({
      gl: { vertex: G, fragment: ke },
      resources: {
        uSceneColor: S.WHITE.source,
        uAccum: S.WHITE.source,
        uReveal: S.WHITE.source
      }
    }), this.fullScreenQuad = new $({
      geometry: Pe,
      shader: this.compositeShader
    }), this.fullScreenQuad.state = J.for2d(), this.fullScreenQuad.state.culling = !1, this.shadowSprite = new q(S.WHITE), this.panelParent = new H(), this.panelParent.alpha = 1, this.compositeSprite = new q(S.EMPTY), this.compositeSprite.position.set(0, 0), this.compositeSprite.visible = !0, this.compositeSprite.alpha = 1, this.compositeSprite.zIndex = 9999;
    const r = new _({
      uTexelSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" }
    });
    this.jfaSeedShader = z.from({
      gl: { vertex: G, fragment: Te },
      resources: {
        uNormalMap: S.WHITE.source,
        jfaUniforms: r
      }
    });
    const n = new _({
      uTexelSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
      uStepSize: { value: 1, type: "f32" }
    });
    this.jfaFloodShader = z.from({
      gl: { vertex: G, fragment: Re },
      resources: {
        uPrevPass: S.WHITE.source,
        jfaUniforms: n
      }
    });
    const c = new _({
      uMaxDistance: { value: 0.15, type: "f32" }
    });
    this.jfaDistanceShader = z.from({
      gl: { vertex: G, fragment: Ce },
      resources: {
        uSeedMap: S.WHITE.source,
        jfaUniforms: c
      }
    });
  }
  setup() {
  }
  render(e) {
    var u, h;
    const { renderer: t, panels: s, quality: i, drawOpaqueScene: r } = e, n = t.screen.width, c = t.screen.height, l = this.rtManager.ensure(n, c, i.renderScale);
    this.ensureAccumTargets(n, c), this.ensureCompositeTarget(n, c), r(l.sceneColor), this.clearTarget(this.accumRT, 0, 0, 0, 0), this.clearTarget(this.revealRT, 1, 1, 1, 1);
    for (const d of s)
      this.renderPanel(d, i, l.sceneColor);
    this.fullScreenQuad.shader = this.compositeShader, this.compositeShader.resources.uSceneColor = l.sceneColor.source, this.compositeShader.resources.uAccum = (u = this.accumRT) == null ? void 0 : u.source, this.compositeShader.resources.uReveal = (h = this.revealRT) == null ? void 0 : h.source, this.fullScreenQuad.width = t.screen.width, this.fullScreenQuad.height = t.screen.height, this.fullScreenQuad.updateLocalTransform(), this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform), t.render({ container: this.fullScreenQuad, target: this.compositeRT, clear: !0 }), this.compositeRT && (this.compositeSprite.texture = this.compositeRT, this.compositeSprite.width = n, this.compositeSprite.height = c, this.compositeSprite.visible = !0), this.renderContactShadows(s, i);
  }
  dispose() {
    var e, t, s, i, r;
    this.rtManager.dispose(), (e = this.accumRT) == null || e.destroy(!0), (t = this.revealRT) == null || t.destroy(!0), (s = this.compositeRT) == null || s.destroy(!0), (i = this.jfaPingRT) == null || i.destroy(!0), (r = this.jfaPongRT) == null || r.destroy(!0);
    for (const n of this.jfaCache.values())
      n.distanceField.destroy(!0);
    this.jfaCache.clear();
  }
  // Compute JFA distance field for a panel's normal map
  computeDistanceField(e) {
    var v, b, y, w, F;
    const t = e.normalMap ?? S.WHITE, s = t.width, i = t.height, r = t.source.uid ?? 0, n = t.source._updateID ?? t.source.updateId ?? 0, c = this.jfaCache.get(e);
    (!this.jfaPingRT || this.jfaPingRT.width !== s || this.jfaPingRT.height !== i) && ((v = this.jfaPingRT) == null || v.destroy(!0), (b = this.jfaPongRT) == null || b.destroy(!0), this.jfaPingRT = B.create({ width: s, height: i, resolution: 1 }), this.jfaPongRT = B.create({ width: s, height: i, resolution: 1 }));
    let l = c == null ? void 0 : c.distanceField;
    (!l || l.width !== s || l.height !== i) && (l == null || l.destroy(!0), l = B.create({ width: s, height: i, resolution: 1 }));
    const u = [1 / s, 1 / i], h = this.jfaSeedShader.resources;
    h.uNormalMap = t.source;
    const d = (y = h.jfaUniforms) == null ? void 0 : y.uniforms;
    d && (d.uTexelSize[0] = u[0], d.uTexelSize[1] = u[1]), this.fullScreenQuad.shader = this.jfaSeedShader, this.fullScreenQuad.width = 1, this.fullScreenQuad.height = 1, this.fullScreenQuad.updateLocalTransform(), this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform), this.renderer.render({ container: this.fullScreenQuad, target: this.jfaPingRT, clear: !0 });
    const g = Math.max(s, i), p = Math.ceil(Math.log2(g));
    let f = this.jfaPingRT, o = this.jfaPongRT;
    const D = this.jfaFloodShader.resources, M = (w = D.jfaUniforms) == null ? void 0 : w.uniforms;
    for (let I = 0; I < p; I++) {
      const T = Math.pow(2, p - I - 1);
      D.uPrevPass = f.source, M && (M.uTexelSize[0] = u[0], M.uTexelSize[1] = u[1], M.uStepSize = T), this.fullScreenQuad.shader = this.jfaFloodShader, this.renderer.render({ container: this.fullScreenQuad, target: o, clear: !0 });
      const E = f;
      f = o, o = E;
    }
    const x = this.jfaDistanceShader.resources;
    x.uSeedMap = f.source;
    const m = (F = x.jfaUniforms) == null ? void 0 : F.uniforms;
    return m && (m.uMaxDistance = 0.15), this.fullScreenQuad.shader = this.jfaDistanceShader, this.renderer.render({ container: this.fullScreenQuad, target: l, clear: !0 }), console.log("JFA computed:", s, "x", i, "passes:", p), this.jfaCache.set(e, {
      distanceField: l,
      normalMapId: r,
      normalMapUpdateId: n,
      width: s,
      height: i
    }), l;
  }
  ensureAccumTargets(e, t) {
    var i, r;
    const s = this.renderer.resolution;
    (!this.accumRT || this.accumRT.width !== e || this.accumRT.height !== t || this.accumRT.source.resolution !== s) && ((i = this.accumRT) == null || i.destroy(!0), this.accumRT = B.create({
      width: e,
      height: t,
      resolution: s
    })), (!this.revealRT || this.revealRT.width !== e || this.revealRT.height !== t || this.revealRT.source.resolution !== s) && ((r = this.revealRT) == null || r.destroy(!0), this.revealRT = B.create({
      width: e,
      height: t,
      resolution: s
    }));
  }
  clearTarget(e, t, s, i, r) {
    if (!e) return;
    const n = new H();
    this.renderer.render({ container: n, target: e, clear: !0, clearColor: [t, s, i, r] });
  }
  renderPanel(e, t, s) {
    var d, g, p, f;
    if (!this.accumRT || !this.revealRT) return;
    const i = e.normalMap ?? S.WHITE, r = this.renderer.screen.width, n = this.renderer.screen.height, c = this.computeDistanceField(e), l = this.refractShader.resources;
    if (l) {
      l.uSceneColor = s.source, l.uNormalMap = i.source, l.uCausticsMap = (e.causticsAtlas ?? S.WHITE).source, l.uDistanceField = c.source;
      const o = (d = l.panelUniforms) == null ? void 0 : d.uniforms;
      if (o) {
        const D = ((p = (g = this.accumRT) == null ? void 0 : g.source) == null ? void 0 : p._resolution) ?? this.renderer.resolution;
        o.uPosition[0] = e.position.x, o.uPosition[1] = e.position.y, o.uScale[0] = e.scale.x, o.uScale[1] = e.scale.y, o.uResolution[0] = r, o.uResolution[1] = n, o.uInvResolution[0] = 1 / (r * D), o.uInvResolution[1] = 1 / (n * D), o.uIOR = e.glassMaterial.ior, o.uThickness = e.glassMaterial.thickness, o.uDispersion = e.glassMaterial.dispersion, o.uRoughness = e.glassMaterial.roughness, o.uOpacity = e.glassMaterial.opacity ?? 1, o.uEnableDispersion = t.enableDispersion && e.glassMaterial.dispersion > 1e-3 ? 1 : 0, o.uEnableCaustics = t.enableCaustics && e.causticsAtlas ? 1 : 0;
        const M = ee(e.glassMaterial.tint ?? 16777215);
        o.uTint[0] = M[0], o.uTint[1] = M[1], o.uTint[2] = M[2], o.uSpecular = e.glassMaterial.specular ?? 0, o.uShininess = e.glassMaterial.shininess ?? 32, o.uShadow = e.glassMaterial.shadow ?? 0;
        const x = e.glassMaterial.lightDir ?? [0.5, 0.5, 1];
        o.uLightDir[0] = x[0], o.uLightDir[1] = x[1], o.uLightDir[2] = x[2], o.uBlurSamples = e.glassMaterial.blurSamples ?? 8, o.uBlurSpread = e.glassMaterial.blurSpread ?? 4, o.uBlurAngle = (e.glassMaterial.blurAngle ?? 0) * Math.PI / 180, o.uBlurAnisotropy = e.glassMaterial.blurAnisotropy ?? 0, o.uBlurGamma = e.glassMaterial.blurGamma ?? 1, o.uAberrationR = e.glassMaterial.aberrationR ?? 1, o.uAberrationB = e.glassMaterial.aberrationB ?? 1, o.uAO = e.glassMaterial.ao ?? 0, o.uAORadius = e.glassMaterial.aoRadius ?? 0.5, o.uNoiseScale = e.glassMaterial.noiseScale ?? 20, o.uNoiseIntensity = e.glassMaterial.noiseIntensity ?? 0, o.uNoiseRotation = e.glassMaterial.noiseRotation ?? 0, o.uNoiseThreshold = e.glassMaterial.noiseThreshold ?? 0, o.uEdgeSupersampling = t.edgeSupersampling ?? 1, o.uGlassSupersampling = e.glassMaterial.glassSupersampling ?? 1, o.uPanelSize[0] = e.scale.x, o.uPanelSize[1] = e.scale.y;
        const m = e.glassMaterial.edgeMask;
        if (m) {
          o.uEdgeMaskCutoff = m.cutoff, o.uEdgeMaskBlur = m.blur, o.uEdgeMaskInvert = m.invert ? 1 : 0;
          const v = (b, y) => {
            b[0] = y.rangeStart, b[1] = y.rangeEnd, b[2] = y.strength, b[3] = y.opacity;
          };
          v(o.uEdgeSmoothing, m.smoothing), v(o.uEdgeContrast, m.contrast), v(o.uEdgeAlpha, m.alpha), v(o.uEdgeTint, m.tint), v(o.uEdgeDarken, m.darken), v(o.uEdgeDesaturate, m.desaturate), o.uEnableSmoothing = m.smoothing.enabled ? 1 : 0, o.uEnableContrast = m.contrast.enabled ? 1 : 0, o.uEnableAlpha = m.alpha.enabled ? 1 : 0, o.uEnableTint = m.tint.enabled ? 1 : 0, o.uEnableDarken = m.darken.enabled ? 1 : 0, o.uEnableDesaturate = m.desaturate.enabled ? 1 : 0, o.uDebugMode = m.debugMode ?? 0;
        } else
          o.uEdgeMaskCutoff = e.glassMaterial.edgeMaskCutoff ?? 1e-3, o.uEdgeMaskBlur = e.glassMaterial.edgeBlur ?? 0, o.uEdgeMaskInvert = 0, o.uEnableSmoothing = 0, o.uEnableContrast = 0, o.uEnableAlpha = 0, o.uEnableTint = 0, o.uEnableDarken = 0, o.uEnableDesaturate = 0;
      }
    }
    const u = e.shader;
    e.shader = this.refractShader, this.drawPanelToTarget(e, this.accumRT), e.shader = this.revealageShader;
    const h = this.revealageShader.resources;
    if (h) {
      h.uNormalMap = i.source;
      const o = (f = h.panelUniforms) == null ? void 0 : f.uniforms;
      o && (o.uPosition[0] = e.position.x, o.uPosition[1] = e.position.y, o.uScale[0] = e.scale.x, o.uScale[1] = e.scale.y, o.uResolution[0] = r, o.uResolution[1] = n, o.uOpacity = e.glassMaterial.opacity);
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
    const s = this.renderer, i = s.gl;
    this.panelParent.removeChildren(), this.panelParent.addChild(e), e.updateLocalTransform(), e.worldTransform.copyFrom(e.localTransform), i && (i.enable(i.BLEND), i.blendFunc(i.SRC_ALPHA, i.ONE_MINUS_SRC_ALPHA)), s.render({ container: this.panelParent, target: t, clear: !1 }), i && i.blendFunc(i.ONE, i.ONE_MINUS_SRC_ALPHA);
  }
  ensureCompositeTarget(e, t) {
    var i;
    const s = this.renderer.resolution;
    (!this.compositeRT || this.compositeRT.width !== e || this.compositeRT.height !== t || this.compositeRT.source.resolution !== s) && ((i = this.compositeRT) == null || i.destroy(!0), this.compositeRT = B.create({
      width: e,
      height: t,
      resolution: s
    }), this.compositeSprite.texture = this.compositeRT);
  }
}
class Ie {
  constructor(e, t = {}) {
    this.renderer = e, this.panels = [], this.quality = new ce(), this.drawOpaqueScene = () => {
    }, this.events = new ue();
    const s = e.gl, i = new oe(s).run();
    this.pipeline = i.tier === "webgl2" ? new Ue(e, !0) : new Ee(e), i.tier === "webgl1" && this.emitFallback("webgl", "MRT unavailable, using compatibility pipeline");
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
    const i = this.quality.evaluate();
    i && this.events.emit("quality:decision", i);
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
class Ve {
  constructor(e) {
    this.renderer = e, this.container = new H(), this.visible = !1, this.panel = new ae().beginFill(0, 0.65).drawRoundedRect(0, 0, 260, 120, 8).endFill(), this.text = new re("Glass HUD", { fontSize: 12, fill: 16777215 }), this.text.position.set(12, 10), this.container.addChild(this.panel, this.text), this.container.visible = this.visible, this.container.position.set(12, 12);
  }
  setVisible(e) {
    this.visible = e, this.container.visible = e;
  }
  update(e) {
    if (!this.visible) return;
    const { quality: t, fps: s, lastDecision: i } = e, r = [
      `FPS: ${s.toFixed(1)}`,
      `Scale: ${(t.renderScale * 100).toFixed(0)}%`,
      `Blur taps: ${t.maxBlurTaps}`,
      `Dispersion: ${t.enableDispersion ? "on" : "off"}`,
      `Caustics: ${t.enableCaustics ? "on" : "off"}`
    ];
    i && r.push(`Action: ${i.action}`), this.text.text = r.join(`
`);
  }
}
export {
  ce as AdaptiveQualityController,
  oe as CapabilityProbe,
  ue as EventBus,
  Ve as GlassHUD,
  Be as GlassOverlay,
  me as GlassPanel,
  he as GlassPresets,
  Ie as GlassSystem,
  K as SceneRTManager,
  _e as createDefaultEdgeMask,
  N as createDefaultEdgeTactic,
  Oe as createPillGeometry,
  Ne as createPillNormalMap,
  xe as getBezierHeightAndDerivative,
  Z as getHeightAndDerivative,
  ve as heightCircle,
  j as heightSquircle,
  ee as hexToVec3,
  be as smootherstep,
  ze as updatePillGeometry
};
//# sourceMappingURL=pixi-adaptive-glass.es.js.map
