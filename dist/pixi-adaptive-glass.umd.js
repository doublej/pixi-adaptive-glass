(function(y,h){typeof exports=="object"&&typeof module<"u"?h(exports,require("pixi.js")):typeof define=="function"&&define.amd?define(["exports","pixi.js"],h):(y=typeof globalThis<"u"?globalThis:y||self,h(y.PixiAdaptiveGlass={},y.PIXI))})(this,function(y,h){"use strict";class X{constructor(e){this.gl=e}run(){if(this.cached)return this.cached;const e=this.isWebGL2Context(this.gl),t=this.queryExtensions(["EXT_color_buffer_float","OES_texture_float_linear","OES_standard_derivatives","EXT_disjoint_timer_query_webgl2","EXT_disjoint_timer_query"]),s=e&&this.getMaxDrawBuffers()>1?"webgl2":"webgl1";return this.cached={tier:s,maxDrawBuffers:this.getMaxDrawBuffers(),extensions:t},this.cached}queryExtensions(e){return e.reduce((t,s)=>(t[s]=!!this.gl.getExtension(s),t),{})}getMaxDrawBuffers(){const e=this.gl.getExtension("WEBGL_draw_buffers"),t=this.isWebGL2Context(this.gl)?this.gl.MAX_DRAW_BUFFERS:e?e.MAX_DRAW_BUFFERS_WEBGL:0;return t?this.gl.getParameter(t)??1:1}isWebGL2Context(e){return typeof WebGL2RenderingContext<"u"&&e instanceof WebGL2RenderingContext}}const re={renderScale:1,enableDispersion:!0,enableCaustics:!0,enableContactShadows:!0,maxBlurTaps:9,edgeSupersampling:1},ie=[{check:i=>i.renderScale>.85,apply:i=>{i.renderScale=.85},action:"scale-rt-0-85",reason:"Frame budget exceeded"},{check:i=>i.renderScale>.7,apply:i=>{i.renderScale=.7},action:"scale-rt-0-7",reason:"Severe perf drop"},{check:i=>i.maxBlurTaps>5,apply:i=>{i.maxBlurTaps=5},action:"reduce-blur",reason:"Sustained frame drops"},{check:i=>i.enableDispersion,apply:i=>{i.enableDispersion=!1},action:"disable-dispersion",reason:"Dispersion too expensive"},{check:i=>i.enableCaustics||i.enableContactShadows,apply:i=>{i.enableCaustics=!1,i.enableContactShadows=!1},action:"disable-caustics",reason:"Optional overlays disabled"}];class Y{constructor(e=100){this.targetFrameMs=e,this.current={...re},this.telemetry=[],this.overrides={}}getQuality(){return{...this.current}}record(e){this.telemetry.push(e),this.telemetry.length>120&&this.telemetry.shift()}setOverrides(e){this.overrides={...this.overrides,...e},this.current={...this.current,...this.overrides}}getTelemetry(){return[...this.telemetry]}evaluate(){if(this.telemetry.length<30)return;const e=this.telemetry.reduce((s,a)=>s+a.cpuMs,0)/this.telemetry.length,t=this.telemetry.reduce((s,a)=>s+(a.gpuMs??a.cpuMs),0)/this.telemetry.length;if(!(Math.max(e,t)<=this.targetFrameMs)){for(const s of ie)if(s.check(this.current))return s.apply(this.current),{action:s.action,reason:s.reason}}}}class H{constructor(e,t){this.renderer=e,this.useDepth=t,this.scale=1,this.clearRect=new h.Rectangle}ensure(e,t,s){const a=this.renderer.resolution*s;return(!this.handles||this.handles.sceneColor.width!==e||this.handles.sceneColor.height!==t||this.handles.sceneColor.source.resolution!==a)&&(this.dispose(),this.handles={sceneColor:h.RenderTexture.create({width:e,height:t,resolution:a,scaleMode:"linear"}),sceneDepth:this.useDepth?h.RenderTexture.create({width:e,height:t,resolution:a,scaleMode:"nearest"}):void 0},this.scale=s),this.handles}clearTargets(){if(!this.handles)return;this.clearRect.width=this.handles.sceneColor.width,this.clearRect.height=this.handles.sceneColor.height;const e=this.renderer;e.renderTarget.bind(this.handles.sceneColor);const t=e.gl;t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),this.handles.sceneDepth&&(e.renderTarget.bind(this.handles.sceneDepth),t.clearColor(1,0,0,1),t.clearDepth(1),t.clear(t.DEPTH_BUFFER_BIT))}dispose(){var e,t,s;(e=this.handles)==null||e.sceneColor.destroy(!0),(s=(t=this.handles)==null?void 0:t.sceneDepth)==null||s.destroy(!0),this.handles=void 0}}class ${constructor(){this.listeners={}}on(e,t){let s=this.listeners[e];s||(s=new Set,this.listeners[e]=s),s.add(t)}off(e,t){var s;(s=this.listeners[e])==null||s.delete(t)}emit(e,t){const s=this.listeners[e];if(s)for(const a of s)a(t)}removeAll(){var e;for(const t of Object.keys(this.listeners))(e=this.listeners[t])==null||e.clear()}}const G=i=>i,_={water(){return G({ior:1.333,thickness:.6,roughness:.1,dispersion:.02,opacity:1,tint:10476031})},crownGlass(){return G({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},acrylic(){return G({ior:1.49,thickness:.7,roughness:.12,dispersion:.01,opacity:1,tint:16250871})},clear(){return G({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},fromIOR(i){const e=Math.min(Math.max(i,1),2);return G({ior:e,thickness:.75,roughness:.08,dispersion:(e-1)*.05,opacity:1,tint:16777215})}};let oe=0;const ne=new h.MeshGeometry({positions:new Float32Array([-.5,-.5,.5,-.5,.5,.5,-.5,.5]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])}),le=`
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
`,ce=`
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;class J extends h.Mesh{constructor(e){const t=h.State.for2d();t.culling=!1,super({geometry:e.geometry??ne,shader:h.Shader.from({gl:{vertex:le,fragment:ce}}),state:t}),this.tier="webgl1",this.id=e.id??`glass-panel-${++oe}`,this.glassMaterial=e.material,this.normalMap=e.normalMap,this.dudvMap=e.dudvMap,this.causticsAtlas=e.causticsAtlas,this.sdfShadow=e.sdfShadow,e.filters&&(this.filters=e.filters)}setMaterial(e){this.glassMaterial={...this.glassMaterial,...e}}setTextures(e){e.normalMap&&(this.normalMap=e.normalMap),e.dudvMap&&(this.dudvMap=e.dudvMap),e.causticsAtlas&&(this.causticsAtlas=e.causticsAtlas),e.sdfShadow&&(this.sdfShadow=e.sdfShadow)}setTier(e){this.tier=e}getTier(){return this.tier}}function W(i,e){return i/e}function K(i){return Math.sqrt(Math.max(0,2*i-i*i))}function ue(i){const e=Math.sqrt(Math.max(1e-4,2*i-i*i));return(1-i)/e}function Z(i){const e=1-Math.pow(1-i,3);return Math.pow(Math.max(0,e),1/3)}function de(i){const e=1-Math.pow(1-i,3);return e<=1e-4?0:Math.pow(1-i,2)/Math.pow(e,2/3)}function he(i){const e=Math.max(0,Math.min(1,i));return e*e*e*(e*(e*6-15)+10)}function z(i,e){switch(e){case"circle":return{height:K(i),derivative:ue(i)};case"squircle":return{height:Z(i),derivative:de(i)};case"concave":{const t=i*i,s=2*i;return{height:t,derivative:s}}case"lip":{const t=i<.5?2*i*i:1-2*(1-i)*(1-i),s=i<.5?4*i:4*(1-i);return{height:t,derivative:s}}case"dome":{const t=1-i,s=Math.sqrt(Math.max(0,1-t*t)),a=t>.001?t/s:0;return{height:s,derivative:a}}case"wave":{const t=(1-Math.cos(i*Math.PI))/2,s=Math.PI*Math.sin(i*Math.PI)/2;return{height:t,derivative:s}}case"flat":return{height:1,derivative:0};case"ramp":return{height:i,derivative:1}}}function fe(i,e=0,t=32){const s=e/2,a=1+t,l=new Float32Array(a*2),n=new Float32Array(a*2),c=i*2+e,r=i*2;l[0]=0,l[1]=0,n[0]=.5,n[1]=.5;for(let f=0;f<t;f++){const m=f/t*Math.PI*2-Math.PI/2,g=(f+1)*2;let p,o;m>=-Math.PI/2&&m<=Math.PI/2?(p=Math.cos(m)*i+s,o=Math.sin(m)*i):(p=Math.cos(m)*i-s,o=Math.sin(m)*i),l[g]=p/c,l[g+1]=o/r,n[g]=p/c+.5,n[g+1]=o/r+.5}const u=t,d=new Uint32Array(u*3);for(let f=0;f<t;f++){const m=f*3;d[m]=0,d[m+1]=f+1,d[m+2]=(f+1)%t+1}return new h.MeshGeometry({positions:l,uvs:n,indices:d})}function me(i,e,t,s=32){const a=i.getAttribute("aPosition"),l=i.getAttribute("aUV");if(!a||!l)return;const n=a.buffer.data,c=l.buffer.data,r=t/2,u=e*2+t,d=e*2;for(let f=0;f<s;f++){const m=f/s*Math.PI*2-Math.PI/2,g=(f+1)*2;let p,o;m>=-Math.PI/2&&m<=Math.PI/2?(p=Math.cos(m)*e+r,o=Math.sin(m)*e):(p=Math.cos(m)*e-r,o=Math.sin(m)*e),n[g]=p/u,n[g+1]=o/d,c[g]=p/u+.5,c[g+1]=o/d+.5}a.buffer.update(),l.buffer.update()}function ge(i,e,t,s,a,l=!1){const n=Math.ceil(i),c=Math.ceil(e),r=new Uint8Array(n*c*4),u=c/2,d=t/2;for(let f=0;f<c;f++)for(let m=0;m<n;m++){let g=0,p=0,o=1,C=255;const T=(n-1)/2,w=(c-1)/2,v=m-T,b=f-w;let S=0,M=0,D=0;const I=Math.abs(v),F=Math.abs(b);if(I<=d)S=u-F,M=0,D=b>0?1:-1;else{const O=v>0?d:-d,A=v-O,B=b,U=Math.sqrt(A*A+B*B);S=u-U,U>.001&&(M=A/U,D=B/U)}if(S<0&&(C=0),s>0&&S<s&&S>=0){const O=W(S,s),{derivative:A}=z(O,a);g=M*A*.5,p=D*A*.5,l&&(g=-g,p=-p)}const R=Math.sqrt(g*g+p*p+o*o);g/=R,p/=R,o/=R;const E=(f*n+m)*4;r[E]=(g*.5+.5)*255|0,r[E+1]=(p*.5+.5)*255|0,r[E+2]=(o*.5+.5)*255|0,r[E+3]=C}return h.Texture.from({resource:r,width:n,height:c})}function q(i){return[(i>>16&255)/255,(i>>8&255)/255,(i&255)/255]}function P(i){return{enabled:!1,rangeStart:0,rangeEnd:.3,strength:1,opacity:1,...i}}function pe(i){return{cutoff:.001,blur:0,invert:!1,smoothing:P({rangeEnd:.3,strength:1}),contrast:P({rangeEnd:.3,strength:.7}),alpha:P({rangeEnd:.2,strength:1}),tint:P({rangeEnd:.5,strength:.5}),darken:P({rangeEnd:.3,strength:.3}),desaturate:P({rangeEnd:.4,strength:.5}),...i}}class ve extends h.Filter{constructor(){const e=`
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
    `;super({glProgram:new h.GlProgram({vertex:`
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            void main(void){
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
          `,fragment:e}),resources:{uSceneColor:h.Texture.WHITE.source,uNormalMap:h.Texture.WHITE.source,uniforms:{uInvResolution:{value:[1,1],type:"vec2<f32>"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uDisplacementScale:{value:.01,type:"f32"},uTint:{value:[1,1,1],type:"vec3<f32>"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"}}}})}}class ye{constructor(e){this.renderer=e,this.id="webgl1",this.filter=new ve,this.rtManager=new H(e,!1),this.blitSprite=new h.Sprite(h.Texture.WHITE)}setup(){}render(e){const{renderer:t,panels:s,quality:a,drawOpaqueScene:l}=e,n=this.rtManager.ensure(t.screen.width,t.screen.height,a.renderScale);l(n.sceneColor),this.blitSprite.texture=n.sceneColor,this.blitSprite.width=t.screen.width,this.blitSprite.height=t.screen.height,t.render({container:this.blitSprite,clear:!0});const c=[...s].sort((r,u)=>(r.zIndex??0)-(u.zIndex??0));for(const r of c)this.applyFilter(r,n.sceneColor,a),t.render({container:r})}dispose(){this.rtManager.dispose()}applyFilter(e,t,s){if(!(!!(e.normalMap||e.dudvMap)||e.glassMaterial.dispersion>.001||e.glassMaterial.roughness>.001)){e.filters=null;return}const l=this.filter.resources;l.uSceneColor=t.source,l.uNormalMap=(e.normalMap??e.dudvMap??h.Texture.WHITE).source;const n=l.uniforms;n.uInvResolution=[1/t.width,1/t.height],n.uDispersion=e.glassMaterial.dispersion,n.uRoughness=e.glassMaterial.roughness,n.uDisplacementScale=e.glassMaterial.thickness*.1,n.uTint=q(e.glassMaterial.tint??16777215),n.uOpacity=e.glassMaterial.opacity,n.uEnableDispersion=s.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,e.filters=[this.filter]}}const V=`
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,be=`
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
`,Se=`
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
`,Me=`
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
`,j=`
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
`,Te=`
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
`,De=`
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
`,Ee=`
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
`,we=new h.MeshGeometry({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])});class Re{constructor(e,t){this.renderer=e,this.id="webgl2",this.jfaCache=new Map,this.rtManager=new H(e,t);const s=new h.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uInvResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uIOR:{value:1,type:"f32"},uThickness:{value:1,type:"f32"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"},uEnableCaustics:{value:0,type:"f32"},uTint:{value:new Float32Array([1,1,1]),type:"vec3<f32>"},uSpecular:{value:0,type:"f32"},uShininess:{value:32,type:"f32"},uShadow:{value:0,type:"f32"},uLightDir:{value:new Float32Array([.5,.5,1]),type:"vec3<f32>"},uBlurSamples:{value:8,type:"f32"},uBlurSpread:{value:4,type:"f32"},uBlurAngle:{value:0,type:"f32"},uBlurAnisotropy:{value:0,type:"f32"},uBlurGamma:{value:1,type:"f32"},uAberrationR:{value:1,type:"f32"},uAberrationB:{value:1,type:"f32"},uAO:{value:0,type:"f32"},uAORadius:{value:.5,type:"f32"},uNoiseScale:{value:20,type:"f32"},uNoiseIntensity:{value:0,type:"f32"},uNoiseRotation:{value:0,type:"f32"},uNoiseThreshold:{value:0,type:"f32"},uEdgeSupersampling:{value:1,type:"f32"},uGlassSupersampling:{value:1,type:"f32"},uEdgeIor:{value:new Float32Array([0,.15,1,1]),type:"vec4<f32>"},uPanelSize:{value:new Float32Array([200,200]),type:"vec2<f32>"},uEdgeMaskCutoff:{value:.001,type:"f32"},uEdgeMaskBlur:{value:0,type:"f32"},uEdgeMaskInvert:{value:0,type:"f32"},uEdgeSmoothing:{value:new Float32Array([0,.3,1,1]),type:"vec4<f32>"},uEdgeContrast:{value:new Float32Array([0,.3,.7,1]),type:"vec4<f32>"},uEdgeAlpha:{value:new Float32Array([0,.2,1,1]),type:"vec4<f32>"},uEdgeTint:{value:new Float32Array([0,.5,.5,1]),type:"vec4<f32>"},uEdgeDarken:{value:new Float32Array([0,.3,.3,1]),type:"vec4<f32>"},uEdgeDesaturate:{value:new Float32Array([0,.4,.5,1]),type:"vec4<f32>"},uEnableSmoothing:{value:0,type:"f32"},uEnableContrast:{value:0,type:"f32"},uEnableAlpha:{value:0,type:"f32"},uEnableTint:{value:0,type:"f32"},uEnableDarken:{value:0,type:"f32"},uEnableDesaturate:{value:0,type:"f32"},uDebugMode:{value:0,type:"f32"}});this.refractShader=h.Shader.from({gl:{vertex:j,fragment:Te},resources:{uSceneColor:h.Texture.WHITE.source,uNormalMap:h.Texture.WHITE.source,uCausticsMap:h.Texture.WHITE.source,uDistanceField:h.Texture.WHITE.source,panelUniforms:s}});const a=new h.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uOpacity:{value:1,type:"f32"}});this.revealageShader=h.Shader.from({gl:{vertex:j,fragment:De},resources:{uNormalMap:h.Texture.WHITE.source,panelUniforms:a}}),this.compositeShader=h.Shader.from({gl:{vertex:V,fragment:Ee},resources:{uSceneColor:h.Texture.WHITE.source,uAccum:h.Texture.WHITE.source,uReveal:h.Texture.WHITE.source}}),this.fullScreenQuad=new h.Mesh({geometry:we,shader:this.compositeShader}),this.fullScreenQuad.state=h.State.for2d(),this.fullScreenQuad.state.culling=!1,this.shadowSprite=new h.Sprite(h.Texture.WHITE),this.panelParent=new h.Container,this.panelParent.alpha=1,this.compositeSprite=new h.Sprite(h.Texture.EMPTY),this.compositeSprite.position.set(0,0),this.compositeSprite.visible=!0,this.compositeSprite.alpha=1,this.compositeSprite.zIndex=9999;const l=new h.UniformGroup({uTexelSize:{value:new Float32Array([1,1]),type:"vec2<f32>"}});this.jfaSeedShader=h.Shader.from({gl:{vertex:V,fragment:be},resources:{uNormalMap:h.Texture.WHITE.source,jfaUniforms:l}});const n=new h.UniformGroup({uTexelSize:{value:new Float32Array([1,1]),type:"vec2<f32>"},uStepSize:{value:1,type:"f32"}});this.jfaFloodShader=h.Shader.from({gl:{vertex:V,fragment:Se},resources:{uPrevPass:h.Texture.WHITE.source,jfaUniforms:n}});const c=new h.UniformGroup({uMaxDistance:{value:.15,type:"f32"}});this.jfaDistanceShader=h.Shader.from({gl:{vertex:V,fragment:Me},resources:{uSeedMap:h.Texture.WHITE.source,jfaUniforms:c}})}setup(){}render(e){var u,d;const{renderer:t,panels:s,quality:a,drawOpaqueScene:l}=e,n=t.screen.width,c=t.screen.height,r=this.rtManager.ensure(n,c,a.renderScale);this.ensureAccumTargets(n,c),this.ensureCompositeTarget(n,c),l(r.sceneColor),this.clearTarget(this.accumRT,0,0,0,0),this.clearTarget(this.revealRT,1,1,1,1);for(const f of s)this.renderPanel(f,a,r.sceneColor);this.fullScreenQuad.shader=this.compositeShader,this.compositeShader.resources.uSceneColor=r.sceneColor.source,this.compositeShader.resources.uAccum=(u=this.accumRT)==null?void 0:u.source,this.compositeShader.resources.uReveal=(d=this.revealRT)==null?void 0:d.source,this.fullScreenQuad.width=t.screen.width,this.fullScreenQuad.height=t.screen.height,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),t.render({container:this.fullScreenQuad,target:this.compositeRT,clear:!0}),this.compositeRT&&(this.compositeSprite.texture=this.compositeRT,this.compositeSprite.width=n,this.compositeSprite.height=c,this.compositeSprite.visible=!0),this.renderContactShadows(s,a)}dispose(){var e,t,s,a,l;this.rtManager.dispose(),(e=this.accumRT)==null||e.destroy(!0),(t=this.revealRT)==null||t.destroy(!0),(s=this.compositeRT)==null||s.destroy(!0),(a=this.jfaPingRT)==null||a.destroy(!0),(l=this.jfaPongRT)==null||l.destroy(!0);for(const n of this.jfaCache.values())n.distanceField.destroy(!0);this.jfaCache.clear()}computeDistanceField(e){var b,S,M,D,I;const t=e.normalMap??h.Texture.WHITE,s=t.width,a=t.height,l=t.source.uid??0,n=t.source._updateID??t.source.updateId??0,c=this.jfaCache.get(e);if(c&&c.normalMapId===l&&c.normalMapUpdateId===n&&c.width===s&&c.height===a)return c.distanceField;(!this.jfaPingRT||this.jfaPingRT.width!==s||this.jfaPingRT.height!==a)&&((b=this.jfaPingRT)==null||b.destroy(!0),(S=this.jfaPongRT)==null||S.destroy(!0),this.jfaPingRT=h.RenderTexture.create({width:s,height:a,resolution:1}),this.jfaPongRT=h.RenderTexture.create({width:s,height:a,resolution:1}));let r=c==null?void 0:c.distanceField;(!r||r.width!==s||r.height!==a)&&(r==null||r.destroy(!0),r=h.RenderTexture.create({width:s,height:a,resolution:1}));const u=[1/s,1/a],d=this.jfaSeedShader.resources;d.uNormalMap=t.source;const f=(M=d.jfaUniforms)==null?void 0:M.uniforms;f&&(f.uTexelSize[0]=u[0],f.uTexelSize[1]=u[1]),this.fullScreenQuad.shader=this.jfaSeedShader,this.fullScreenQuad.width=1,this.fullScreenQuad.height=1,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),this.renderer.render({container:this.fullScreenQuad,target:this.jfaPingRT,clear:!0});const m=Math.max(s,a),g=Math.ceil(Math.log2(m));let p=this.jfaPingRT,o=this.jfaPongRT;const C=this.jfaFloodShader.resources,T=(D=C.jfaUniforms)==null?void 0:D.uniforms;for(let F=0;F<g;F++){const R=Math.pow(2,g-F-1);C.uPrevPass=p.source,T&&(T.uTexelSize[0]=u[0],T.uTexelSize[1]=u[1],T.uStepSize=R),this.fullScreenQuad.shader=this.jfaFloodShader,this.renderer.render({container:this.fullScreenQuad,target:o,clear:!0});const E=p;p=o,o=E}const w=this.jfaDistanceShader.resources;w.uSeedMap=p.source;const v=(I=w.jfaUniforms)==null?void 0:I.uniforms;return v&&(v.uMaxDistance=.05),this.fullScreenQuad.shader=this.jfaDistanceShader,this.renderer.render({container:this.fullScreenQuad,target:r,clear:!0}),this.jfaCache.set(e,{distanceField:r,normalMapId:l,normalMapUpdateId:n,width:s,height:a}),r}ensureAccumTargets(e,t){var a,l;const s=this.renderer.resolution;(!this.accumRT||this.accumRT.width!==e||this.accumRT.height!==t||this.accumRT.source.resolution!==s)&&((a=this.accumRT)==null||a.destroy(!0),this.accumRT=h.RenderTexture.create({width:e,height:t,resolution:s})),(!this.revealRT||this.revealRT.width!==e||this.revealRT.height!==t||this.revealRT.source.resolution!==s)&&((l=this.revealRT)==null||l.destroy(!0),this.revealRT=h.RenderTexture.create({width:e,height:t,resolution:s}))}clearTarget(e,t,s,a,l){if(!e)return;const n=new h.Container;this.renderer.render({container:n,target:e,clear:!0,clearColor:[t,s,a,l]})}renderPanel(e,t,s){var f,m,g,p;if(!this.accumRT||!this.revealRT)return;const a=e.normalMap??h.Texture.WHITE,l=this.renderer.screen.width,n=this.renderer.screen.height,c=this.computeDistanceField(e),r=this.refractShader.resources;if(r){r.uSceneColor=s.source,r.uNormalMap=a.source,r.uCausticsMap=(e.causticsAtlas??h.Texture.WHITE).source,r.uDistanceField=c.source;const o=(f=r.panelUniforms)==null?void 0:f.uniforms;if(o){const C=((g=(m=this.accumRT)==null?void 0:m.source)==null?void 0:g._resolution)??this.renderer.resolution;o.uPosition[0]=e.position.x,o.uPosition[1]=e.position.y,o.uScale[0]=e.scale.x,o.uScale[1]=e.scale.y,o.uResolution[0]=l,o.uResolution[1]=n,o.uInvResolution[0]=1/(l*C),o.uInvResolution[1]=1/(n*C),o.uIOR=e.glassMaterial.ior,o.uThickness=e.glassMaterial.thickness,o.uDispersion=e.glassMaterial.dispersion,o.uRoughness=e.glassMaterial.roughness,o.uOpacity=e.glassMaterial.opacity??1,o.uEnableDispersion=t.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,o.uEnableCaustics=t.enableCaustics&&e.causticsAtlas?1:0;const T=q(e.glassMaterial.tint??16777215);o.uTint[0]=T[0],o.uTint[1]=T[1],o.uTint[2]=T[2],o.uSpecular=e.glassMaterial.specular??0,o.uShininess=e.glassMaterial.shininess??32,o.uShadow=e.glassMaterial.shadow??0;const w=e.glassMaterial.lightDir??[.5,.5,1];o.uLightDir[0]=-w[0],o.uLightDir[1]=-w[1],o.uLightDir[2]=w[2],o.uBlurSamples=e.glassMaterial.blurSamples??8,o.uBlurSpread=e.glassMaterial.blurSpread??4,o.uBlurAngle=(e.glassMaterial.blurAngle??0)*Math.PI/180,o.uBlurAnisotropy=e.glassMaterial.blurAnisotropy??0,o.uBlurGamma=e.glassMaterial.blurGamma??1,o.uAberrationR=e.glassMaterial.aberrationR??1,o.uAberrationB=e.glassMaterial.aberrationB??1,o.uAO=e.glassMaterial.ao??0,o.uAORadius=e.glassMaterial.aoRadius??.5,o.uNoiseScale=e.glassMaterial.noiseScale??20,o.uNoiseIntensity=e.glassMaterial.noiseIntensity??0,o.uNoiseRotation=e.glassMaterial.noiseRotation??0,o.uNoiseThreshold=e.glassMaterial.noiseThreshold??0,o.uEdgeSupersampling=t.edgeSupersampling??1,o.uGlassSupersampling=e.glassMaterial.glassSupersampling??1,o.uEdgeIor[0]=e.glassMaterial.edgeIorRangeStart??0,o.uEdgeIor[1]=e.glassMaterial.edgeIorRangeEnd??.15,o.uEdgeIor[2]=e.glassMaterial.edgeIorStrength??1,o.uEdgeIor[3]=e.glassMaterial.edgeIorEnabled?1:0,o.uPanelSize[0]=e.scale.x,o.uPanelSize[1]=e.scale.y;const v=e.glassMaterial.edgeMask;if(v){o.uEdgeMaskCutoff=v.cutoff,o.uEdgeMaskBlur=v.blur,o.uEdgeMaskInvert=v.invert?1:0;const b=(S,M)=>{S[0]=M.rangeStart,S[1]=M.rangeEnd,S[2]=M.strength,S[3]=M.opacity};b(o.uEdgeSmoothing,v.smoothing),b(o.uEdgeContrast,v.contrast),b(o.uEdgeAlpha,v.alpha),b(o.uEdgeTint,v.tint),b(o.uEdgeDarken,v.darken),b(o.uEdgeDesaturate,v.desaturate),o.uEnableSmoothing=v.smoothing.enabled?1:0,o.uEnableContrast=v.contrast.enabled?1:0,o.uEnableAlpha=v.alpha.enabled?1:0,o.uEnableTint=v.tint.enabled?1:0,o.uEnableDarken=v.darken.enabled?1:0,o.uEnableDesaturate=v.desaturate.enabled?1:0,o.uDebugMode=v.debugMode??0}else o.uEdgeMaskCutoff=e.glassMaterial.edgeMaskCutoff??.001,o.uEdgeMaskBlur=e.glassMaterial.edgeBlur??0,o.uEdgeMaskInvert=0,o.uEnableSmoothing=0,o.uEnableContrast=0,o.uEnableAlpha=0,o.uEnableTint=0,o.uEnableDarken=0,o.uEnableDesaturate=0}}const u=e.shader;e.shader=this.refractShader,this.drawPanelToTarget(e,this.accumRT),e.shader=this.revealageShader;const d=this.revealageShader.resources;if(d){d.uNormalMap=a.source;const o=(p=d.panelUniforms)==null?void 0:p.uniforms;o&&(o.uPosition[0]=e.position.x,o.uPosition[1]=e.position.y,o.uScale[0]=e.scale.x,o.uScale[1]=e.scale.y,o.uResolution[0]=l,o.uResolution[1]=n,o.uOpacity=e.glassMaterial.opacity)}this.drawPanelToTarget(e,this.revealRT),e.shader=u}renderContactShadows(e,t){if(t.enableContactShadows)for(const s of e)s.sdfShadow&&(this.shadowSprite.texture=s.sdfShadow,this.shadowSprite.position.copyFrom(s.position),this.shadowSprite.scale.copyFrom(s.scale),this.shadowSprite.rotation=s.rotation,this.shadowSprite.alpha=Math.min(s.glassMaterial.opacity+.2,.9),this.renderer.render(this.shadowSprite))}getCompositeDisplay(){return this.compositeSprite}drawPanelToTarget(e,t){const s=this.renderer,a=s.gl;this.panelParent.removeChildren(),this.panelParent.addChild(e),e.updateLocalTransform(),e.worldTransform.copyFrom(e.localTransform),a&&(a.enable(a.BLEND),a.blendFunc(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA)),s.render({container:this.panelParent,target:t,clear:!1}),a&&a.blendFunc(a.ONE,a.ONE_MINUS_SRC_ALPHA)}ensureCompositeTarget(e,t){var a;const s=this.renderer.resolution;(!this.compositeRT||this.compositeRT.width!==e||this.compositeRT.height!==t||this.compositeRT.source.resolution!==s)&&((a=this.compositeRT)==null||a.destroy(!0),this.compositeRT=h.RenderTexture.create({width:e,height:t,resolution:s}),this.compositeSprite.texture=this.compositeRT)}}class ee{constructor(e,t={}){this.renderer=e,this.panels=[],this.quality=new Y,this.drawOpaqueScene=()=>{},this.events=new $;const s=e.gl,a=new X(s).run();this.pipeline=a.tier==="webgl2"?new Re(e,!0):new ye(e),a.tier==="webgl1"&&this.emitFallback("webgl","MRT unavailable, using compatibility pipeline")}setOpaqueSceneCallback(e){this.drawOpaqueScene=e}createPanel(e){const t=new J(e);return this.panels.push(t),t}removePanel(e){const t=this.panels.indexOf(e);t>=0&&(this.panels.splice(t,1),e.destroy({children:!0,texture:!1,textureSource:!1}))}render(){const e=performance.now(),t=this.quality.getQuality();this.pipeline.render({renderer:this.renderer,panels:this.panels,quality:t,drawOpaqueScene:this.drawOpaqueScene});const s=performance.now()-e;this.quality.record({cpuMs:s,timestamp:e});const a=this.quality.evaluate();a&&this.events.emit("quality:decision",a)}setQuality(e){this.quality.setOverrides(e)}destroy(){for(const e of this.panels)e.destroy({children:!0,texture:!1,textureSource:!1});this.panels.length=0,this.pipeline.dispose(),this.events.removeAll()}on(e,t){this.events.on(e,t)}off(e,t){this.events.off(e,t)}getPipelineId(){return this.pipeline.id}getCompositeDisplay(){if(typeof this.pipeline.getCompositeDisplay=="function")return this.pipeline.getCompositeDisplay()}emitFallback(e,t){const s={target:e,message:t,timestamp:performance.now()};console.warn(`GlassSystem fallback: ${e} - ${t}`),this.events.emit("fallback",s)}}class xe{constructor(e){this.renderer=e,this.container=new h.Container,this.visible=!1,this.panel=new h.Graphics().beginFill(0,.65).drawRoundedRect(0,0,260,120,8).endFill(),this.text=new h.Text("Glass HUD",{fontSize:12,fill:16777215}),this.text.position.set(12,10),this.container.addChild(this.panel,this.text),this.container.visible=this.visible,this.container.position.set(12,12)}setVisible(e){this.visible=e,this.container.visible=e}update(e){if(!this.visible)return;const{quality:t,fps:s,lastDecision:a}=e,l=[`FPS: ${s.toFixed(1)}`,`Scale: ${(t.renderScale*100).toFixed(0)}%`,`Blur taps: ${t.maxBlurTaps}`,`Dispersion: ${t.enableDispersion?"on":"off"}`,`Caustics: ${t.enableCaustics?"on":"off"}`];a&&l.push(`Action: ${a.action}`),this.text.text=l.join(`
`)}}class Ce{constructor(e){this.currentDir=[0,0,.15],this.targetDir=[0,0,.15],this.delayedDir=[0,0,.15],this.renderer=e}setParams(e){this.params=e,e.followCursor&&!this.boundMouseMove?(this.boundMouseMove=t=>{const s=e.curve??1.5,a=e.zMin??.05,l=e.zMax??.2,n=e.edgeStretch??.5,r=this.renderer.canvas.getBoundingClientRect();let u=1-(t.clientX-r.left)/r.width*2,d=1-(t.clientY-r.top)/r.height*2;u=Math.sign(u)*Math.pow(Math.abs(u),n),d=Math.sign(d)*Math.pow(Math.abs(d),n);const f=Math.sqrt(u*u+d*d),m=Math.max(a,Math.min(l,l-Math.pow(f,s)*l*.5));this.targetDir=[u,d,m]},window.addEventListener("mousemove",this.boundMouseMove)):!e.followCursor&&this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0)}update(e){var n;if(!((n=this.params)!=null&&n.followCursor))return;const s=1-(this.params.delay??.5)*.97;this.delayedDir[0]+=(this.targetDir[0]-this.delayedDir[0])*s,this.delayedDir[1]+=(this.targetDir[1]-this.delayedDir[1])*s,this.delayedDir[2]+=(this.targetDir[2]-this.delayedDir[2])*s;const l=1-(this.params.smoothing??.9)*.97;this.currentDir[0]+=(this.delayedDir[0]-this.currentDir[0])*l,this.currentDir[1]+=(this.delayedDir[1]-this.currentDir[1])*l,this.currentDir[2]+=(this.delayedDir[2]-this.currentDir[2])*l;for(const[,c]of e)c.panel.glassMaterial.lightDir=[...this.currentDir]}destroy(){this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0)}}class Ae{constructor(e,t){this.tracked=e,this.callbacks=t}setupObservers(e,t,s,a){this.resizeObserver=new ResizeObserver(n=>{for(const c of n){const r=c.target,u=this.tracked.get(r);if(!u)continue;const d=r.getBoundingClientRect(),f=u.lastRect;f&&(Math.abs(d.width-f.width)>1||Math.abs(d.height-f.height)>1)&&this.callbacks.updateGeometry(r,u),u.lastRect=d}}),this.intersectionObserver=new IntersectionObserver(n=>{for(const c of n){const r=c.target,u=this.tracked.get(r);if(!u)continue;u.visible=c.isIntersecting;const d=this.callbacks.isCssVisible(r);u.panel.visible=u.visible&&d}}),document.querySelectorAll(e).forEach(n=>t(n)),this.observer=new MutationObserver(n=>{for(const c of n)if(c.type==="childList")c.addedNodes.forEach(r=>{r instanceof HTMLElement&&r.matches(e)&&t(r),r instanceof HTMLElement&&r.querySelectorAll(e).forEach(d=>t(d))}),c.removedNodes.forEach(r=>{r instanceof HTMLElement&&this.tracked.has(r)&&s(r)});else if(c.type==="attributes"){const r=c.target;if(c.attributeName==="class")r.matches(e)?t(r):s(r);else if(c.attributeName==="style"){const u=this.tracked.get(r);if(u){const d=this.callbacks.isCssVisible(r);u.panel.visible=d&&u.visible;const f=r.getBoundingClientRect(),m=this.callbacks.parseBorderRadius(r,f);Math.abs(m-u.lastRadius)>.5&&this.callbacks.updateGeometry(r,u)}}else if(c.attributeName==="hidden"){const u=this.tracked.get(r);if(u){const d=this.callbacks.isCssVisible(r);u.panel.visible=d&&u.visible}}}a()}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style","hidden"]})}observeElement(e){var t,s;(t=this.resizeObserver)==null||t.observe(e),(s=this.intersectionObserver)==null||s.observe(e)}unobserveElement(e){var t,s;(t=this.resizeObserver)==null||t.unobserve(e),(s=this.intersectionObserver)==null||s.unobserve(e)}destroy(){var e,t,s;(e=this.observer)==null||e.disconnect(),(t=this.resizeObserver)==null||t.disconnect(),(s=this.intersectionObserver)==null||s.disconnect()}}function ke(i,e,t){const s=c=>{const r=i.get(c);if(!r||r.polling)return;r.polling=!0;const u=()=>{r.polling&&(e(c,r.panel),requestAnimationFrame(u))};requestAnimationFrame(u)},a=c=>{const r=i.get(c);r&&(r.polling=!1,t(c,r))};return{handleAnimationStart:c=>{const r=c.currentTarget;s(r)},handleAnimationEnd:c=>{const r=c.currentTarget;r.getAnimations().length===0&&a(r)}}}function Q(i,e,t,s,a){const l=t/2,n=s/2,c=Math.abs(i+.5-l),r=Math.abs(e+.5-n),u=l-a,d=n-a;if(c<=u&&r<=d)return Math.min(u+a-c,d+a-r);if(c>u&&r<=d)return a-(c-u);if(r>d&&c<=u)return a-(r-d);{const f=c-u,m=r-d;return a-Math.sqrt(f*f+m*m)}}function te(i,e,t,s,a,l=!1){const n=Math.ceil(i),c=Math.ceil(e),r=new Uint8Array(n*c*4),u=[[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]];for(let d=0;d<c;d++)for(let f=0;f<n;f++){let m=0,g=0,p=1,o=0;for(const[k,x]of u){const N=Q(f+k,d+x,n,c,t);o+=N>=0?1:0}const C=o/u.length*255,T=n/2,w=c/2,v=Math.abs(f+.5-T),b=Math.abs(d+.5-w),S=T-t,M=w-t;let D=0,I=0,F=0,R=v,E=b;if(v<=S&&b<=M){const k=S+t,x=M+t;k-v<x-b?(R=S+t,E=b):(R=v,E=M+t),D=Math.min(k-v,x-b)}else if(v>S&&b<=M)R=S+t,E=b,D=t-(v-S);else if(b>M&&v<=S)R=v,E=M+t,D=t-(b-M);else{const k=v-S,x=b-M,N=Math.sqrt(k*k+x*x);D=t-N,N>0&&(R=S+k/N*t,E=M+x/N*t)}const O=R-v,A=E-b,B=Math.sqrt(O*O+A*A);if(B>.001&&(I=(f>T?1:-1)*(O/B),F=(d>w?1:-1)*(A/B)),s>0&&D<s&&D>=0){const k=W(D,s),{derivative:x}=z(k,a);m=I*x*.5,g=F*x*.5,l&&(m=-m,g=-g)}const U=Math.sqrt(m*m+g*g+p*p);m/=U,g/=U,p/=U;const L=(d*n+f)*4;r[L]=(m*.5+.5)*255|0,r[L+1]=(g*.5+.5)*255|0,r[L+2]=(p*.5+.5)*255|0,r[L+3]=C}return h.Texture.from({resource:r,width:n,height:c})}function se(i,e,t,s,a="squircle"){const l=Math.ceil(i),n=Math.ceil(e),c=new Uint8Array(l*n*4);for(let r=0;r<n;r++)for(let u=0;u<l;u++){const d=Q(u,r,l,n,t),f=d>=0?255:0;let m=0;if(s>0&&d>=0&&d<s){const p=W(d,s),{height:o}=z(p,a);m=(1-o)*255}else d<0&&(m=0);const g=(r*l+u)*4;c[g]=m,c[g+1]=m,c[g+2]=m,c[g+3]=f}return{data:c,width:l,height:n}}function ae(i,e,t,s,a="squircle"){const l=se(i,e,t,s,a);return h.Texture.from({resource:l.data,width:l.width,height:l.height})}class Fe{constructor(e,t){this.tracked=new Map,this.system=new ee(e,t.systemOptions),this.system.setOpaqueSceneCallback(a=>{e.render({container:t.background,target:a,clear:!0})});const s=this.system.getCompositeDisplay();s&&t.stage.addChild(s),this.lightFollow=new Ce(e),this.domTracking=new Ae(this.tracked,{syncElement:this.syncElement.bind(this),updateGeometry:this.updatePanelGeometry.bind(this),isCssVisible:this.isCssVisible.bind(this),parseBorderRadius:this.parseBorderRadius.bind(this)}),this.animationHandlers=ke(this.tracked,this.syncElement.bind(this),this.updatePanelGeometry.bind(this)),t.lightFollowParams&&this.setLightFollowParams(t.lightFollowParams)}setLightFollowParams(e){this.lightFollow.setParams(e)}autoMount(e=".glass-panel"){this.domTracking.setupObservers(e,t=>this.track(t),t=>this.untrack(t),()=>this.cleanup())}track(e,t={}){if(this.tracked.has(e))return this.tracked.get(e).panel;const s=this.createMaterial(e,t),a=e.getBoundingClientRect(),l=this.detectCircleMode(e,t),n=this.calculateRadius(e,a,t,l),c=this.createNormalMap(a,n,t,l),r=this.system.createPanel({material:s,normalMap:c}),u={panel:r,config:t,lastRect:a,lastRadius:n,visible:!0,isCircle:l,polling:!1};return this.tracked.set(e,u),this.domTracking.observeElement(e),e.addEventListener("transitionrun",this.animationHandlers.handleAnimationStart),e.addEventListener("transitionend",this.animationHandlers.handleAnimationEnd),e.addEventListener("transitioncancel",this.animationHandlers.handleAnimationEnd),e.addEventListener("animationstart",this.animationHandlers.handleAnimationStart),e.addEventListener("animationend",this.animationHandlers.handleAnimationEnd),e.addEventListener("animationcancel",this.animationHandlers.handleAnimationEnd),this.syncElement(e,r),r}untrack(e){const t=this.tracked.get(e);t&&(t.polling=!1,this.domTracking.unobserveElement(e),e.removeEventListener("transitionrun",this.animationHandlers.handleAnimationStart),e.removeEventListener("transitionend",this.animationHandlers.handleAnimationEnd),e.removeEventListener("transitioncancel",this.animationHandlers.handleAnimationEnd),e.removeEventListener("animationstart",this.animationHandlers.handleAnimationStart),e.removeEventListener("animationend",this.animationHandlers.handleAnimationEnd),e.removeEventListener("animationcancel",this.animationHandlers.handleAnimationEnd),this.system.removePanel(t.panel),this.tracked.delete(e))}update(){this.lightFollow.update(this.tracked);for(const[e,t]of this.tracked)this.syncElement(e,t.panel);this.system.render()}resize(){this.update()}setPositionTransform(e){this.positionTransform=e}cleanup(){for(const[e]of this.tracked)document.body.contains(e)||this.untrack(e)}destroy(){this.lightFollow.destroy(),this.domTracking.destroy(),this.system.destroy(),this.tracked.clear()}createMaterial(e,t){const s=e.dataset.glassIor?parseFloat(e.dataset.glassIor):void 0,a=e.dataset.glassRoughness?parseFloat(e.dataset.glassRoughness):void 0,l={..._.clear(),...t.material};return s!==void 0&&(l.ior=s),a!==void 0&&(l.roughness=a),l}detectCircleMode(e,t){return t.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle")}calculateRadius(e,t,s,a){if(a)return Math.min(t.width,t.height)/2;const l=this.parseBorderRadius(e,t);return s.cornerRadius??l}createNormalMap(e,t,s,a){if(s.normalMap)return s.normalMap;const l=s.bevelSize??12,n=s.surfaceShape??"squircle",c=s.invertNormals??!1,r=s.useDisplacementMap??!1,u=window.devicePixelRatio||1,d=Math.floor(Math.min(e.width,e.height)*u),f=a?d:e.width*u,m=a?d:e.height*u;return r?ae(f,m,t*u,l*u,n):te(f,m,t*u,l*u,n,c)}syncElement(e,t){const s=this.tracked.get(e),a=e.getBoundingClientRect(),l=s!=null&&s.isCircle?Math.floor(Math.min(a.width,a.height)):Math.round(a.width),n=s!=null&&s.isCircle?l:Math.round(a.height),c=Math.round(a.left)+l/2,r=Math.round(a.top)+n/2;if(this.positionTransform){const u=this.positionTransform(c,r,l,n);t.position.set(Math.round(u.x),Math.round(u.y)),t.scale.set(Math.round(l*u.scaleX),Math.round(n*u.scaleY)),t.rotation=u.rotation}else t.position.set(c,r),t.scale.set(l,n),t.rotation=0}parseBorderRadius(e,t){const s=window.getComputedStyle(e),a=s.borderTopLeftRadius,l=s.borderTopRightRadius,n=s.borderBottomRightRadius,c=s.borderBottomLeftRadius,r=(g,p)=>g.endsWith("%")?parseFloat(g)/100*p:parseFloat(g)||0,u=g=>g.split(" ")[0],d=(t.width+t.height)/2;return[r(u(a),d),r(u(l),d),r(u(n),d),r(u(c),d)].reduce((g,p)=>g+p,0)/4||20}isCssVisible(e){if(e.hidden)return!1;const t=window.getComputedStyle(e);return t.display!=="none"&&t.visibility!=="hidden"}updatePanelGeometry(e,t){const s=e.getBoundingClientRect(),a=this.detectCircleMode(e,t.config),l=this.calculateRadius(e,s,t.config,a),n=this.createNormalMap(s,l,t.config,a);t.panel.setTextures({normalMap:n}),t.lastRect=s,t.lastRadius=l}}y.AdaptiveQualityController=Y,y.CapabilityProbe=X,y.EventBus=$,y.GlassHUD=xe,y.GlassOverlay=Fe,y.GlassPanel=J,y.GlassPresets=_,y.GlassSystem=ee,y.SceneRTManager=H,y.createDefaultEdgeMask=pe,y.createDefaultEdgeTactic=P,y.createDisplacementMap=ae,y.createDisplacementMapData=se,y.createPillGeometry=fe,y.createPillNormalMap=ge,y.createRoundedRectNormalMap=te,y.getDistanceToBoundary=Q,y.getHeightAndDerivative=z,y.heightCircle=K,y.heightSquircle=Z,y.hexToVec3=q,y.smootherstep=he,y.updatePillGeometry=me,Object.defineProperty(y,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=pixi-adaptive-glass.umd.js.map
