(function(b,f){typeof exports=="object"&&typeof module<"u"?f(exports,require("pixi.js")):typeof define=="function"&&define.amd?define(["exports","pixi.js"],f):(b=typeof globalThis<"u"?globalThis:b||self,f(b.PixiAdaptiveGlass={},b.PIXI))})(this,function(b,f){"use strict";class Y{constructor(e){this.gl=e}run(){if(this.cached)return this.cached;const e=this.isWebGL2Context(this.gl),t=this.queryExtensions(["EXT_color_buffer_float","OES_texture_float_linear","OES_standard_derivatives","EXT_disjoint_timer_query_webgl2","EXT_disjoint_timer_query"]),a=e&&this.getMaxDrawBuffers()>1?"webgl2":"webgl1";return this.cached={tier:a,maxDrawBuffers:this.getMaxDrawBuffers(),extensions:t},this.cached}queryExtensions(e){return e.reduce((t,a)=>(t[a]=!!this.gl.getExtension(a),t),{})}getMaxDrawBuffers(){const e=this.gl.getExtension("WEBGL_draw_buffers"),t=this.isWebGL2Context(this.gl)?this.gl.MAX_DRAW_BUFFERS:e?e.MAX_DRAW_BUFFERS_WEBGL:0;return t?this.gl.getParameter(t)??1:1}isWebGL2Context(e){return typeof WebGL2RenderingContext<"u"&&e instanceof WebGL2RenderingContext}}const ue={renderScale:1,enableDispersion:!0,enableCaustics:!0,enableContactShadows:!0,maxBlurTaps:9,edgeSupersampling:1},de=[{check:i=>i.renderScale>.85,apply:i=>{i.renderScale=.85},action:"scale-rt-0-85",reason:"Frame budget exceeded"},{check:i=>i.renderScale>.7,apply:i=>{i.renderScale=.7},action:"scale-rt-0-7",reason:"Severe perf drop"},{check:i=>i.maxBlurTaps>5,apply:i=>{i.maxBlurTaps=5},action:"reduce-blur",reason:"Sustained frame drops"},{check:i=>i.enableDispersion,apply:i=>{i.enableDispersion=!1},action:"disable-dispersion",reason:"Dispersion too expensive"},{check:i=>i.enableCaustics||i.enableContactShadows,apply:i=>{i.enableCaustics=!1,i.enableContactShadows=!1},action:"disable-caustics",reason:"Optional overlays disabled"}];class ${constructor(e=100){this.targetFrameMs=e,this.current={...ue},this.telemetry=[],this.overrides={}}getQuality(){return{...this.current}}record(e){this.telemetry.push(e),this.telemetry.length>120&&this.telemetry.shift()}setOverrides(e){this.overrides={...this.overrides,...e},this.current={...this.current,...this.overrides}}getTelemetry(){return[...this.telemetry]}evaluate(){if(this.telemetry.length<30)return;const e=this.telemetry.reduce((a,s)=>a+s.cpuMs,0)/this.telemetry.length,t=this.telemetry.reduce((a,s)=>a+(s.gpuMs??s.cpuMs),0)/this.telemetry.length;if(!(Math.max(e,t)<=this.targetFrameMs)){for(const a of de)if(a.check(this.current))return a.apply(this.current),{action:a.action,reason:a.reason}}}}class q{constructor(e,t){this.renderer=e,this.useDepth=t,this.scale=1,this.clearRect=new f.Rectangle}ensure(e,t,a){const s=this.renderer.resolution*a;return(!this.handles||this.handles.sceneColor.width!==e||this.handles.sceneColor.height!==t||this.handles.sceneColor.source.resolution!==s)&&(this.dispose(),this.handles={sceneColor:f.RenderTexture.create({width:e,height:t,resolution:s,scaleMode:"linear"}),sceneDepth:this.useDepth?f.RenderTexture.create({width:e,height:t,resolution:s,scaleMode:"nearest"}):void 0},this.scale=a),this.handles}clearTargets(){if(!this.handles)return;this.clearRect.width=this.handles.sceneColor.width,this.clearRect.height=this.handles.sceneColor.height;const e=this.renderer;e.renderTarget.bind(this.handles.sceneColor);const t=e.gl;t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),this.handles.sceneDepth&&(e.renderTarget.bind(this.handles.sceneDepth),t.clearColor(1,0,0,1),t.clearDepth(1),t.clear(t.DEPTH_BUFFER_BIT))}dispose(){var e,t,a;(e=this.handles)==null||e.sceneColor.destroy(!0),(a=(t=this.handles)==null?void 0:t.sceneDepth)==null||a.destroy(!0),this.handles=void 0}}class J{constructor(){this.listeners={}}on(e,t){let a=this.listeners[e];a||(a=new Set,this.listeners[e]=a),a.add(t)}off(e,t){var a;(a=this.listeners[e])==null||a.delete(t)}emit(e,t){const a=this.listeners[e];if(a)for(const s of a)s(t)}removeAll(){var e;for(const t of Object.keys(this.listeners))(e=this.listeners[t])==null||e.clear()}}const z=i=>i,K={water(){return z({ior:1.333,thickness:.6,roughness:.1,dispersion:.02,opacity:1,tint:10476031})},crownGlass(){return z({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},acrylic(){return z({ior:1.49,thickness:.7,roughness:.12,dispersion:.01,opacity:1,tint:16250871})},clear(){return z({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},fromIOR(i){const e=Math.min(Math.max(i,1),2);return z({ior:e,thickness:.75,roughness:.08,dispersion:(e-1)*.05,opacity:1,tint:16777215})}};let he=0;const fe=new f.MeshGeometry({positions:new Float32Array([-.5,-.5,.5,-.5,.5,.5,-.5,.5]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])}),me=`
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
`,ge=`
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;class Z extends f.Mesh{constructor(e){const t=f.State.for2d();t.culling=!1,super({geometry:e.geometry??fe,shader:f.Shader.from({gl:{vertex:me,fragment:ge}}),state:t}),this.tier="webgl1",this.id=e.id??`glass-panel-${++he}`,this.glassMaterial=e.material,this.normalMap=e.normalMap,this.dudvMap=e.dudvMap,this.causticsAtlas=e.causticsAtlas,this.sdfShadow=e.sdfShadow,e.filters&&(this.filters=e.filters)}setMaterial(e){this.glassMaterial={...this.glassMaterial,...e}}setTextures(e){e.normalMap&&(this.normalMap=e.normalMap),e.dudvMap&&(this.dudvMap=e.dudvMap),e.causticsAtlas&&(this.causticsAtlas=e.causticsAtlas),e.sdfShadow&&(this.sdfShadow=e.sdfShadow)}setTier(e){this.tier=e}getTier(){return this.tier}}function H(i,e){return i/e}function _(i){return Math.sqrt(Math.max(0,2*i-i*i))}function pe(i){const e=Math.sqrt(Math.max(1e-4,2*i-i*i));return(1-i)/e}function j(i){const e=1-Math.pow(1-i,3);return Math.pow(Math.max(0,e),1/3)}function ve(i){const e=1-Math.pow(1-i,3);return e<=1e-4?0:Math.pow(1-i,2)/Math.pow(e,2/3)}function ye(i){const e=Math.max(0,Math.min(1,i));return e*e*e*(e*(e*6-15)+10)}function L(i,e){switch(e){case"circle":return{height:_(i),derivative:pe(i)};case"squircle":return{height:j(i),derivative:ve(i)};case"concave":{const t=i*i,a=2*i;return{height:t,derivative:a}}case"lip":{const t=i<.5?2*i*i:1-2*(1-i)*(1-i),a=i<.5?4*i:4*(1-i);return{height:t,derivative:a}}case"dome":{const t=1-i,a=Math.sqrt(Math.max(0,1-t*t)),s=t>.001?t/a:0;return{height:a,derivative:s}}case"wave":{const t=(1-Math.cos(i*Math.PI))/2,a=Math.PI*Math.sin(i*Math.PI)/2;return{height:t,derivative:a}}case"flat":return{height:1,derivative:0};case"ramp":return{height:i,derivative:1}}}function be(i,e=0,t=32){const a=e/2,s=1+t,c=new Float32Array(s*2),o=new Float32Array(s*2),l=i*2+e,r=i*2;c[0]=0,c[1]=0,o[0]=.5,o[1]=.5;for(let h=0;h<t;h++){const m=h/t*Math.PI*2-Math.PI/2,g=(h+1)*2;let v,n;m>=-Math.PI/2&&m<=Math.PI/2?(v=Math.cos(m)*i+a,n=Math.sin(m)*i):(v=Math.cos(m)*i-a,n=Math.sin(m)*i),c[g]=v/l,c[g+1]=n/r,o[g]=v/l+.5,o[g+1]=n/r+.5}const u=t,d=new Uint32Array(u*3);for(let h=0;h<t;h++){const m=h*3;d[m]=0,d[m+1]=h+1,d[m+2]=(h+1)%t+1}return new f.MeshGeometry({positions:c,uvs:o,indices:d})}function Me(i,e,t,a=32){const s=i.getAttribute("aPosition"),c=i.getAttribute("aUV");if(!s||!c)return;const o=s.buffer.data,l=c.buffer.data,r=t/2,u=e*2+t,d=e*2;for(let h=0;h<a;h++){const m=h/a*Math.PI*2-Math.PI/2,g=(h+1)*2;let v,n;m>=-Math.PI/2&&m<=Math.PI/2?(v=Math.cos(m)*e+r,n=Math.sin(m)*e):(v=Math.cos(m)*e-r,n=Math.sin(m)*e),o[g]=v/u,o[g+1]=n/d,l[g]=v/u+.5,l[g+1]=n/d+.5}s.buffer.update(),c.buffer.update()}function Se(i,e,t,a,s,c=!1){const o=Math.ceil(i),l=Math.ceil(e),r=new Uint8Array(o*l*4),u=l/2,d=t/2;for(let h=0;h<l;h++)for(let m=0;m<o;m++){let g=0,v=0,n=1,A=255;const x=(o-1)/2,C=(l-1)/2,p=m-x,y=h-C;let M=0,S=0,D=0;const N=Math.abs(p),P=Math.abs(y);if(N<=d)M=u-P,S=0,D=y>0?1:-1;else{const I=p>0?d:-d,k=p-I,O=y,U=Math.sqrt(k*k+O*O);M=u-U,U>.001&&(S=k/U,D=O/U)}if(M<0&&(A=0),a>0&&M<a&&M>=0){const I=H(M,a),{derivative:k}=L(I,s);g=S*k*.5,v=D*k*.5,c&&(g=-g,v=-v)}const R=Math.sqrt(g*g+v*v+n*n);g/=R,v/=R,n/=R;const E=(h*o+m)*4;r[E]=(g*.5+.5)*255|0,r[E+1]=(v*.5+.5)*255|0,r[E+2]=(n*.5+.5)*255|0,r[E+3]=A}return f.Texture.from({resource:r,width:o,height:l})}function Q(i){return[(i>>16&255)/255,(i>>8&255)/255,(i&255)/255]}function G(i){return{enabled:!1,rangeStart:0,rangeEnd:.3,strength:1,opacity:1,...i}}function Te(i){return{cutoff:.001,blur:0,invert:!1,smoothing:G({rangeEnd:.3,strength:1}),contrast:G({rangeEnd:.3,strength:.7}),alpha:G({rangeEnd:.2,strength:1}),tint:G({rangeEnd:.5,strength:.5}),darken:G({rangeEnd:.3,strength:.3}),desaturate:G({rangeEnd:.4,strength:.5}),...i}}class De extends f.Filter{constructor(){const e=`
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
    `;super({glProgram:new f.GlProgram({vertex:`
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            void main(void){
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
          `,fragment:e}),resources:{uSceneColor:f.Texture.WHITE.source,uNormalMap:f.Texture.WHITE.source,uniforms:{uInvResolution:{value:[1,1],type:"vec2<f32>"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uDisplacementScale:{value:.01,type:"f32"},uTint:{value:[1,1,1],type:"vec3<f32>"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"}}}})}}class we{constructor(e){this.renderer=e,this.id="webgl1",this.filter=new De,this.rtManager=new q(e,!1),this.blitSprite=new f.Sprite(f.Texture.WHITE)}setup(){}render(e){const{renderer:t,panels:a,quality:s,drawOpaqueScene:c}=e,o=this.rtManager.ensure(t.screen.width,t.screen.height,s.renderScale);c(o.sceneColor),this.blitSprite.texture=o.sceneColor,this.blitSprite.width=t.screen.width,this.blitSprite.height=t.screen.height,t.render({container:this.blitSprite,clear:!0});const l=[...a].sort((r,u)=>(r.zIndex??0)-(u.zIndex??0));for(const r of l)this.applyFilter(r,o.sceneColor,s),t.render({container:r})}dispose(){this.rtManager.dispose()}applyFilter(e,t,a){if(!(!!(e.normalMap||e.dudvMap)||e.glassMaterial.dispersion>.001||e.glassMaterial.roughness>.001)){e.filters=null;return}const c=this.filter.resources;c.uSceneColor=t.source,c.uNormalMap=(e.normalMap??e.dudvMap??f.Texture.WHITE).source;const o=c.uniforms;o.uInvResolution=[1/t.width,1/t.height],o.uDispersion=e.glassMaterial.dispersion,o.uRoughness=e.glassMaterial.roughness,o.uDisplacementScale=e.glassMaterial.thickness*.1,o.uTint=Q(e.glassMaterial.tint??16777215),o.uOpacity=e.glassMaterial.opacity,o.uEnableDispersion=a.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,e.filters=[this.filter]}}const W=`
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,Ee=`
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
`,Re=`
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
`,xe=`
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
`,ee=`
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
`,Ce=`
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
`,Ae=`
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
`,ke=`
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
`,Fe=new f.MeshGeometry({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])});class Ue{constructor(e,t){this.renderer=e,this.id="webgl2",this.jfaCache=new Map,this.rtManager=new q(e,t);const a=new f.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uInvResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uIOR:{value:1,type:"f32"},uThickness:{value:1,type:"f32"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"},uEnableCaustics:{value:0,type:"f32"},uTint:{value:new Float32Array([1,1,1]),type:"vec3<f32>"},uSpecular:{value:0,type:"f32"},uShininess:{value:32,type:"f32"},uShadow:{value:0,type:"f32"},uLightDir:{value:new Float32Array([.5,.5,1]),type:"vec3<f32>"},uBlurSamples:{value:8,type:"f32"},uBlurSpread:{value:4,type:"f32"},uBlurAngle:{value:0,type:"f32"},uBlurAnisotropy:{value:0,type:"f32"},uBlurGamma:{value:1,type:"f32"},uAberrationR:{value:1,type:"f32"},uAberrationB:{value:1,type:"f32"},uAO:{value:0,type:"f32"},uAORadius:{value:.5,type:"f32"},uNoiseScale:{value:20,type:"f32"},uNoiseIntensity:{value:0,type:"f32"},uNoiseRotation:{value:0,type:"f32"},uNoiseThreshold:{value:0,type:"f32"},uEdgeSupersampling:{value:1,type:"f32"},uGlassSupersampling:{value:1,type:"f32"},uEdgeIor:{value:new Float32Array([0,.15,1,1]),type:"vec4<f32>"},uPanelSize:{value:new Float32Array([200,200]),type:"vec2<f32>"},uEdgeMaskCutoff:{value:.001,type:"f32"},uEdgeMaskBlur:{value:0,type:"f32"},uEdgeMaskInvert:{value:0,type:"f32"},uEdgeSmoothing:{value:new Float32Array([0,.3,1,1]),type:"vec4<f32>"},uEdgeContrast:{value:new Float32Array([0,.3,.7,1]),type:"vec4<f32>"},uEdgeAlpha:{value:new Float32Array([0,.2,1,1]),type:"vec4<f32>"},uEdgeTint:{value:new Float32Array([0,.5,.5,1]),type:"vec4<f32>"},uEdgeDarken:{value:new Float32Array([0,.3,.3,1]),type:"vec4<f32>"},uEdgeDesaturate:{value:new Float32Array([0,.4,.5,1]),type:"vec4<f32>"},uEnableSmoothing:{value:0,type:"f32"},uEnableContrast:{value:0,type:"f32"},uEnableAlpha:{value:0,type:"f32"},uEnableTint:{value:0,type:"f32"},uEnableDarken:{value:0,type:"f32"},uEnableDesaturate:{value:0,type:"f32"},uDebugMode:{value:0,type:"f32"}});this.refractShader=f.Shader.from({gl:{vertex:ee,fragment:Ce},resources:{uSceneColor:f.Texture.WHITE.source,uNormalMap:f.Texture.WHITE.source,uCausticsMap:f.Texture.WHITE.source,uDistanceField:f.Texture.WHITE.source,panelUniforms:a}});const s=new f.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uOpacity:{value:1,type:"f32"}});this.revealageShader=f.Shader.from({gl:{vertex:ee,fragment:Ae},resources:{uNormalMap:f.Texture.WHITE.source,panelUniforms:s}}),this.compositeShader=f.Shader.from({gl:{vertex:W,fragment:ke},resources:{uSceneColor:f.Texture.WHITE.source,uAccum:f.Texture.WHITE.source,uReveal:f.Texture.WHITE.source}}),this.fullScreenQuad=new f.Mesh({geometry:Fe,shader:this.compositeShader}),this.fullScreenQuad.state=f.State.for2d(),this.fullScreenQuad.state.culling=!1,this.shadowSprite=new f.Sprite(f.Texture.WHITE),this.panelParent=new f.Container,this.panelParent.alpha=1,this.compositeSprite=new f.Sprite(f.Texture.EMPTY),this.compositeSprite.position.set(0,0),this.compositeSprite.visible=!0,this.compositeSprite.alpha=1,this.compositeSprite.zIndex=9999;const c=new f.UniformGroup({uTexelSize:{value:new Float32Array([1,1]),type:"vec2<f32>"}});this.jfaSeedShader=f.Shader.from({gl:{vertex:W,fragment:Ee},resources:{uNormalMap:f.Texture.WHITE.source,jfaUniforms:c}});const o=new f.UniformGroup({uTexelSize:{value:new Float32Array([1,1]),type:"vec2<f32>"},uStepSize:{value:1,type:"f32"}});this.jfaFloodShader=f.Shader.from({gl:{vertex:W,fragment:Re},resources:{uPrevPass:f.Texture.WHITE.source,jfaUniforms:o}});const l=new f.UniformGroup({uMaxDistance:{value:.15,type:"f32"}});this.jfaDistanceShader=f.Shader.from({gl:{vertex:W,fragment:xe},resources:{uSeedMap:f.Texture.WHITE.source,jfaUniforms:l}})}setup(){}render(e){var u,d;const{renderer:t,panels:a,quality:s,drawOpaqueScene:c}=e,o=t.screen.width,l=t.screen.height,r=this.rtManager.ensure(o,l,s.renderScale);this.ensureAccumTargets(o,l),this.ensureCompositeTarget(o,l),c(r.sceneColor),this.clearTarget(this.accumRT,0,0,0,0),this.clearTarget(this.revealRT,1,1,1,1);for(const h of a)this.renderPanel(h,s,r.sceneColor);this.fullScreenQuad.shader=this.compositeShader,this.compositeShader.resources.uSceneColor=r.sceneColor.source,this.compositeShader.resources.uAccum=(u=this.accumRT)==null?void 0:u.source,this.compositeShader.resources.uReveal=(d=this.revealRT)==null?void 0:d.source,this.fullScreenQuad.width=t.screen.width,this.fullScreenQuad.height=t.screen.height,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),t.render({container:this.fullScreenQuad,target:this.compositeRT,clear:!0}),this.compositeRT&&(this.compositeSprite.texture=this.compositeRT,this.compositeSprite.width=o,this.compositeSprite.height=l,this.compositeSprite.visible=!0),this.renderContactShadows(a,s)}dispose(){var e,t,a,s,c;this.rtManager.dispose(),(e=this.accumRT)==null||e.destroy(!0),(t=this.revealRT)==null||t.destroy(!0),(a=this.compositeRT)==null||a.destroy(!0),(s=this.jfaPingRT)==null||s.destroy(!0),(c=this.jfaPongRT)==null||c.destroy(!0);for(const o of this.jfaCache.values())o.distanceField.destroy(!0);this.jfaCache.clear()}computeDistanceField(e){var y,M,S,D,N;const t=e.normalMap??f.Texture.WHITE,a=t.width,s=t.height,c=t.source.uid??0,o=t.source._updateID??t.source.updateId??0,l=this.jfaCache.get(e);if(l&&l.normalMapId===c&&l.normalMapUpdateId===o&&l.width===a&&l.height===s)return l.distanceField;(!this.jfaPingRT||this.jfaPingRT.width!==a||this.jfaPingRT.height!==s)&&((y=this.jfaPingRT)==null||y.destroy(!0),(M=this.jfaPongRT)==null||M.destroy(!0),this.jfaPingRT=f.RenderTexture.create({width:a,height:s,resolution:1}),this.jfaPongRT=f.RenderTexture.create({width:a,height:s,resolution:1}));let r=l==null?void 0:l.distanceField;(!r||r.width!==a||r.height!==s)&&(r==null||r.destroy(!0),r=f.RenderTexture.create({width:a,height:s,resolution:1}));const u=[1/a,1/s],d=this.jfaSeedShader.resources;d.uNormalMap=t.source;const h=(S=d.jfaUniforms)==null?void 0:S.uniforms;h&&(h.uTexelSize[0]=u[0],h.uTexelSize[1]=u[1]),this.fullScreenQuad.shader=this.jfaSeedShader,this.fullScreenQuad.width=1,this.fullScreenQuad.height=1,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),this.renderer.render({container:this.fullScreenQuad,target:this.jfaPingRT,clear:!0});const m=Math.max(a,s),g=Math.ceil(Math.log2(m));let v=this.jfaPingRT,n=this.jfaPongRT;const A=this.jfaFloodShader.resources,x=(D=A.jfaUniforms)==null?void 0:D.uniforms;for(let P=0;P<g;P++){const R=Math.pow(2,g-P-1);A.uPrevPass=v.source,x&&(x.uTexelSize[0]=u[0],x.uTexelSize[1]=u[1],x.uStepSize=R),this.fullScreenQuad.shader=this.jfaFloodShader,this.renderer.render({container:this.fullScreenQuad,target:n,clear:!0});const E=v;v=n,n=E}const C=this.jfaDistanceShader.resources;C.uSeedMap=v.source;const p=(N=C.jfaUniforms)==null?void 0:N.uniforms;return p&&(p.uMaxDistance=.05),this.fullScreenQuad.shader=this.jfaDistanceShader,this.renderer.render({container:this.fullScreenQuad,target:r,clear:!0}),this.jfaCache.set(e,{distanceField:r,normalMapId:c,normalMapUpdateId:o,width:a,height:s}),r}ensureAccumTargets(e,t){var s,c;const a=this.renderer.resolution;(!this.accumRT||this.accumRT.width!==e||this.accumRT.height!==t||this.accumRT.source.resolution!==a)&&((s=this.accumRT)==null||s.destroy(!0),this.accumRT=f.RenderTexture.create({width:e,height:t,resolution:a})),(!this.revealRT||this.revealRT.width!==e||this.revealRT.height!==t||this.revealRT.source.resolution!==a)&&((c=this.revealRT)==null||c.destroy(!0),this.revealRT=f.RenderTexture.create({width:e,height:t,resolution:a}))}clearTarget(e,t,a,s,c){if(!e)return;const o=new f.Container;this.renderer.render({container:o,target:e,clear:!0,clearColor:[t,a,s,c]})}renderPanel(e,t,a){var h,m,g,v;if(!this.accumRT||!this.revealRT)return;const s=e.normalMap??f.Texture.WHITE,c=this.renderer.screen.width,o=this.renderer.screen.height,l=this.computeDistanceField(e),r=this.refractShader.resources;if(r){r.uSceneColor=a.source,r.uNormalMap=s.source,r.uCausticsMap=(e.causticsAtlas??f.Texture.WHITE).source,r.uDistanceField=l.source;const n=(h=r.panelUniforms)==null?void 0:h.uniforms;if(n){const A=((g=(m=this.accumRT)==null?void 0:m.source)==null?void 0:g._resolution)??this.renderer.resolution;n.uPosition[0]=e.position.x,n.uPosition[1]=e.position.y,n.uScale[0]=e.scale.x,n.uScale[1]=e.scale.y,n.uResolution[0]=c,n.uResolution[1]=o,n.uInvResolution[0]=1/(c*A),n.uInvResolution[1]=1/(o*A),n.uIOR=e.glassMaterial.ior,n.uThickness=e.glassMaterial.thickness,n.uDispersion=e.glassMaterial.dispersion,n.uRoughness=e.glassMaterial.roughness,n.uOpacity=e.glassMaterial.opacity??1,n.uEnableDispersion=t.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,n.uEnableCaustics=t.enableCaustics&&e.causticsAtlas?1:0;const x=Q(e.glassMaterial.tint??16777215);n.uTint[0]=x[0],n.uTint[1]=x[1],n.uTint[2]=x[2],n.uSpecular=e.glassMaterial.specular??0,n.uShininess=e.glassMaterial.shininess??32,n.uShadow=e.glassMaterial.shadow??0;const C=e.glassMaterial.lightDir??[.5,.5,1];n.uLightDir[0]=-C[0],n.uLightDir[1]=-C[1],n.uLightDir[2]=C[2],n.uBlurSamples=e.glassMaterial.blurSamples??8,n.uBlurSpread=e.glassMaterial.blurSpread??4,n.uBlurAngle=(e.glassMaterial.blurAngle??0)*Math.PI/180,n.uBlurAnisotropy=e.glassMaterial.blurAnisotropy??0,n.uBlurGamma=e.glassMaterial.blurGamma??1,n.uAberrationR=e.glassMaterial.aberrationR??1,n.uAberrationB=e.glassMaterial.aberrationB??1,n.uAO=e.glassMaterial.ao??0,n.uAORadius=e.glassMaterial.aoRadius??.5,n.uNoiseScale=e.glassMaterial.noiseScale??20,n.uNoiseIntensity=e.glassMaterial.noiseIntensity??0,n.uNoiseRotation=e.glassMaterial.noiseRotation??0,n.uNoiseThreshold=e.glassMaterial.noiseThreshold??0,n.uEdgeSupersampling=t.edgeSupersampling??1,n.uGlassSupersampling=e.glassMaterial.glassSupersampling??1,n.uEdgeIor[0]=e.glassMaterial.edgeIorRangeStart??0,n.uEdgeIor[1]=e.glassMaterial.edgeIorRangeEnd??.15,n.uEdgeIor[2]=e.glassMaterial.edgeIorStrength??1,n.uEdgeIor[3]=e.glassMaterial.edgeIorEnabled?1:0,n.uPanelSize[0]=e.scale.x,n.uPanelSize[1]=e.scale.y;const p=e.glassMaterial.edgeMask;if(p){n.uEdgeMaskCutoff=p.cutoff,n.uEdgeMaskBlur=p.blur,n.uEdgeMaskInvert=p.invert?1:0;const y=(M,S)=>{M[0]=S.rangeStart,M[1]=S.rangeEnd,M[2]=S.strength,M[3]=S.opacity};y(n.uEdgeSmoothing,p.smoothing),y(n.uEdgeContrast,p.contrast),y(n.uEdgeAlpha,p.alpha),y(n.uEdgeTint,p.tint),y(n.uEdgeDarken,p.darken),y(n.uEdgeDesaturate,p.desaturate),n.uEnableSmoothing=p.smoothing.enabled?1:0,n.uEnableContrast=p.contrast.enabled?1:0,n.uEnableAlpha=p.alpha.enabled?1:0,n.uEnableTint=p.tint.enabled?1:0,n.uEnableDarken=p.darken.enabled?1:0,n.uEnableDesaturate=p.desaturate.enabled?1:0,n.uDebugMode=p.debugMode??0}else n.uEdgeMaskCutoff=e.glassMaterial.edgeMaskCutoff??.001,n.uEdgeMaskBlur=e.glassMaterial.edgeBlur??0,n.uEdgeMaskInvert=0,n.uEnableSmoothing=0,n.uEnableContrast=0,n.uEnableAlpha=0,n.uEnableTint=0,n.uEnableDarken=0,n.uEnableDesaturate=0}}const u=e.shader;e.shader=this.refractShader,this.drawPanelToTarget(e,this.accumRT),e.shader=this.revealageShader;const d=this.revealageShader.resources;if(d){d.uNormalMap=s.source;const n=(v=d.panelUniforms)==null?void 0:v.uniforms;n&&(n.uPosition[0]=e.position.x,n.uPosition[1]=e.position.y,n.uScale[0]=e.scale.x,n.uScale[1]=e.scale.y,n.uResolution[0]=c,n.uResolution[1]=o,n.uOpacity=e.glassMaterial.opacity)}this.drawPanelToTarget(e,this.revealRT),e.shader=u}renderContactShadows(e,t){if(t.enableContactShadows)for(const a of e)a.sdfShadow&&(this.shadowSprite.texture=a.sdfShadow,this.shadowSprite.position.copyFrom(a.position),this.shadowSprite.scale.copyFrom(a.scale),this.shadowSprite.rotation=a.rotation,this.shadowSprite.alpha=Math.min(a.glassMaterial.opacity+.2,.9),this.renderer.render(this.shadowSprite))}getCompositeDisplay(){return this.compositeSprite}drawPanelToTarget(e,t){const a=this.renderer,s=a.gl;this.panelParent.removeChildren(),this.panelParent.addChild(e),e.updateLocalTransform(),e.worldTransform.copyFrom(e.localTransform),s&&(s.enable(s.BLEND),s.blendFunc(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA)),a.render({container:this.panelParent,target:t,clear:!1}),s&&s.blendFunc(s.ONE,s.ONE_MINUS_SRC_ALPHA)}ensureCompositeTarget(e,t){var s;const a=this.renderer.resolution;(!this.compositeRT||this.compositeRT.width!==e||this.compositeRT.height!==t||this.compositeRT.source.resolution!==a)&&((s=this.compositeRT)==null||s.destroy(!0),this.compositeRT=f.RenderTexture.create({width:e,height:t,resolution:a}),this.compositeSprite.texture=this.compositeRT)}}class te{constructor(e,t={}){this.renderer=e,this.panels=[],this.quality=new $,this.drawOpaqueScene=()=>{},this.events=new J;const a=e.gl,s=new Y(a).run();this.pipeline=s.tier==="webgl2"?new Ue(e,!0):new we(e),s.tier==="webgl1"&&this.emitFallback("webgl","MRT unavailable, using compatibility pipeline")}setOpaqueSceneCallback(e){this.drawOpaqueScene=e}createPanel(e){const t=new Z(e);return this.panels.push(t),t}removePanel(e){const t=this.panels.indexOf(e);t>=0&&(this.panels.splice(t,1),e.destroy({children:!0,texture:!1,textureSource:!1}))}render(){const e=performance.now(),t=this.quality.getQuality();this.pipeline.render({renderer:this.renderer,panels:this.panels,quality:t,drawOpaqueScene:this.drawOpaqueScene});const a=performance.now()-e;this.quality.record({cpuMs:a,timestamp:e});const s=this.quality.evaluate();s&&this.events.emit("quality:decision",s)}setQuality(e){this.quality.setOverrides(e)}destroy(){for(const e of this.panels)e.destroy({children:!0,texture:!1,textureSource:!1});this.panels.length=0,this.pipeline.dispose(),this.events.removeAll()}on(e,t){this.events.on(e,t)}off(e,t){this.events.off(e,t)}getPipelineId(){return this.pipeline.id}getCompositeDisplay(){if(typeof this.pipeline.getCompositeDisplay=="function")return this.pipeline.getCompositeDisplay()}emitFallback(e,t){const a={target:e,message:t,timestamp:performance.now()};console.warn(`GlassSystem fallback: ${e} - ${t}`),this.events.emit("fallback",a)}}class Pe{constructor(e){this.renderer=e,this.container=new f.Container,this.visible=!1,this.panel=new f.Graphics().beginFill(0,.65).drawRoundedRect(0,0,260,120,8).endFill(),this.text=new f.Text("Glass HUD",{fontSize:12,fill:16777215}),this.text.position.set(12,10),this.container.addChild(this.panel,this.text),this.container.visible=this.visible,this.container.position.set(12,12)}setVisible(e){this.visible=e,this.container.visible=e}update(e){if(!this.visible)return;const{quality:t,fps:a,lastDecision:s}=e,c=[`FPS: ${a.toFixed(1)}`,`Scale: ${(t.renderScale*100).toFixed(0)}%`,`Blur taps: ${t.maxBlurTaps}`,`Dispersion: ${t.enableDispersion?"on":"off"}`,`Caustics: ${t.enableCaustics?"on":"off"}`];s&&c.push(`Action: ${s.action}`),this.text.text=c.join(`
`)}}class Ie{constructor(e){this.currentDir=[0,0,.15],this.targetDir=[0,0,.15],this.delayedDir=[0,0,.15],this.renderer=e}setParams(e){this.params=e,e.followCursor&&!this.boundMouseMove?(this.boundMouseMove=t=>{const a=e.curve??1.5,s=e.zMin??.05,c=e.zMax??.2,o=e.edgeStretch??.5,r=this.renderer.canvas.getBoundingClientRect();let u=1-(t.clientX-r.left)/r.width*2,d=1-(t.clientY-r.top)/r.height*2;u=Math.sign(u)*Math.pow(Math.abs(u),o),d=Math.sign(d)*Math.pow(Math.abs(d),o);const h=Math.sqrt(u*u+d*d),m=Math.max(s,Math.min(c,c-Math.pow(h,a)*c*.5));this.targetDir=[u,d,m]},window.addEventListener("mousemove",this.boundMouseMove)):!e.followCursor&&this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0)}update(e){var o;if(!((o=this.params)!=null&&o.followCursor))return;const a=1-(this.params.delay??.5)*.97;this.delayedDir[0]+=(this.targetDir[0]-this.delayedDir[0])*a,this.delayedDir[1]+=(this.targetDir[1]-this.delayedDir[1])*a,this.delayedDir[2]+=(this.targetDir[2]-this.delayedDir[2])*a;const c=1-(this.params.smoothing??.9)*.97;this.currentDir[0]+=(this.delayedDir[0]-this.currentDir[0])*c,this.currentDir[1]+=(this.delayedDir[1]-this.currentDir[1])*c,this.currentDir[2]+=(this.delayedDir[2]-this.currentDir[2])*c;for(const[,l]of e)l.panel.glassMaterial.lightDir=[...this.currentDir]}destroy(){this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0)}}class Oe{constructor(e,t){this.tracked=e,this.callbacks=t}setupObservers(e,t,a,s){this.resizeObserver=new ResizeObserver(o=>{for(const l of o){const r=l.target,u=this.tracked.get(r);if(!u)continue;const d=r.getBoundingClientRect(),h=u.lastRect;h&&(Math.abs(d.width-h.width)>1||Math.abs(d.height-h.height)>1)&&this.callbacks.updateGeometry(r,u),u.lastRect=d}}),this.intersectionObserver=new IntersectionObserver(o=>{for(const l of o){const r=l.target,u=this.tracked.get(r);if(!u)continue;u.visible=l.isIntersecting;const d=this.callbacks.isCssVisible(r);u.panel.visible=u.visible&&d}}),document.querySelectorAll(e).forEach(o=>t(o)),this.observer=new MutationObserver(o=>{for(const l of o)if(l.type==="childList")l.addedNodes.forEach(r=>{r instanceof HTMLElement&&r.matches(e)&&t(r),r instanceof HTMLElement&&r.querySelectorAll(e).forEach(d=>t(d))}),l.removedNodes.forEach(r=>{r instanceof HTMLElement&&this.tracked.has(r)&&a(r)});else if(l.type==="attributes"){const r=l.target;if(l.attributeName==="class")r.matches(e)?t(r):a(r);else if(l.attributeName==="style"){const u=this.tracked.get(r);if(u){const d=this.callbacks.isCssVisible(r);u.panel.visible=d&&u.visible;const h=r.getBoundingClientRect(),m=this.callbacks.parseBorderRadius(r,h);Math.abs(m-u.lastRadius)>.5&&this.callbacks.updateGeometry(r,u)}}else if(l.attributeName==="hidden"){const u=this.tracked.get(r);if(u){const d=this.callbacks.isCssVisible(r);u.panel.visible=d&&u.visible}}}s()}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style","hidden"]})}observeElement(e){var t,a;(t=this.resizeObserver)==null||t.observe(e),(a=this.intersectionObserver)==null||a.observe(e)}unobserveElement(e){var t,a;(t=this.resizeObserver)==null||t.unobserve(e),(a=this.intersectionObserver)==null||a.unobserve(e)}destroy(){var e,t,a;(e=this.observer)==null||e.disconnect(),(t=this.resizeObserver)==null||t.disconnect(),(a=this.intersectionObserver)==null||a.disconnect()}}function Ne(i,e,t){const a=l=>{const r=i.get(l);if(!r||r.polling)return;r.polling=!0;const u=()=>{r.polling&&(e(l,r.panel),requestAnimationFrame(u))};requestAnimationFrame(u)},s=l=>{const r=i.get(l);r&&(r.polling=!1,t(l,r))};return{handleAnimationStart:l=>{const r=l.currentTarget;a(r)},handleAnimationEnd:l=>{const r=l.currentTarget;r.getAnimations().length===0&&s(r)}}}function V(i,e,t,a,s){const c=t/2,o=a/2,l=Math.abs(i+.5-c),r=Math.abs(e+.5-o),u=c-s,d=o-s;if(l<=u&&r<=d)return Math.min(u+s-l,d+s-r);if(l>u&&r<=d)return s-(l-u);if(r>d&&l<=u)return s-(r-d);{const h=l-u,m=r-d;return s-Math.sqrt(h*h+m*m)}}function ae(i,e,t,a,s,c=!1){const o=Math.ceil(i),l=Math.ceil(e),r=new Uint8Array(o*l*4),u=[[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]];for(let d=0;d<l;d++)for(let h=0;h<o;h++){let m=0,g=0,v=1,n=0;for(const[w,T]of u){const F=V(h+w,d+T,o,l,t);n+=F>=0?1:0}const A=n/u.length*255,x=o/2,C=l/2,p=Math.abs(h+.5-x),y=Math.abs(d+.5-C),M=x-t,S=C-t;let D=0,N=0,P=0,R=p,E=y;if(p<=M&&y<=S){const w=M+t,T=S+t;w-p<T-y?(R=M+t,E=y):(R=p,E=S+t),D=Math.min(w-p,T-y)}else if(p>M&&y<=S)R=M+t,E=y,D=t-(p-M);else if(y>S&&p<=M)R=p,E=S+t,D=t-(y-S);else{const w=p-M,T=y-S,F=Math.sqrt(w*w+T*T);D=t-F,F>0&&(R=M+w/F*t,E=S+T/F*t)}const I=R-p,k=E-y,O=Math.sqrt(I*I+k*k);if(O>.001&&(N=(h>x?1:-1)*(I/O),P=(d>C?1:-1)*(k/O)),a>0&&D<a&&D>=0){const w=H(D,a),{derivative:T}=L(w,s);m=N*T*.5,g=P*T*.5,c&&(m=-m,g=-g)}const U=Math.sqrt(m*m+g*g+v*v);m/=U,g/=U,v/=U;const B=(d*o+h)*4;r[B]=(m*.5+.5)*255|0,r[B+1]=(g*.5+.5)*255|0,r[B+2]=(v*.5+.5)*255|0,r[B+3]=A}return f.Texture.from({resource:r,width:o,height:l})}function se(i,e,t,a,s="squircle",c=!1){const o=Math.ceil(i),l=Math.ceil(e),r=new Uint8Array(o*l*4);for(let u=0;u<l;u++)for(let d=0;d<o;d++){const h=V(d,u,o,l,t),m=h>=0?255:0;let g=0;if(a>0&&h>=0&&h<a){const n=H(h,a),{height:A}=L(n,s);g=(1-A)*255}else h<0&&(g=0);c&&(g=255-g);const v=(u*o+d)*4;r[v]=g,r[v+1]=g,r[v+2]=g,r[v+3]=m}return{data:r,width:o,height:l}}function X(i,e,t,a,s="squircle",c=!1){const o=se(i,e,t,a,s,c);return f.Texture.from({resource:o.data,width:o.width,height:o.height})}function re(i,e,t){const a=Math.ceil(i),s=Math.ceil(e),c=new Uint8Array(a*s*4);for(let o=0;o<s;o++)for(let l=0;l<a;l++){const u=V(l,o,a,s,t)>=0?255:0,d=l/(a-1),h=o/(s-1),m=(o*a+l)*4;c[m]=d*255|0,c[m+1]=h*255|0,c[m+2]=0,c[m+3]=u}return{data:c,width:a,height:s}}function ie(i,e,t){const a=re(i,e,t);return f.Texture.from({resource:a.data,width:a.width,height:a.height})}function oe(i,e,t,a){const s=Math.ceil(i),c=Math.ceil(e),o=new Uint8Array(s*c*4);for(let l=0;l<c;l++)for(let r=0;r<s;r++){const u=V(r,l,s,c,t),d=u>=0?255:0;let h=0;a>0&&u>=0&&u<a&&(h=(a-u)/a*255);const m=(l*s+r)*4;o[m]=h,o[m+1]=h,o[m+2]=h,o[m+3]=d}return{data:o,width:s,height:c}}function ne(i,e,t,a){const s=oe(i,e,t,a);return f.Texture.from({resource:s.data,width:s.width,height:s.height})}function le(i,e,t,a,s,c){const o=Math.ceil(i),l=Math.ceil(e),r=new Uint8Array(o*l*4),u=[[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]];for(let d=0;d<l;d++)for(let h=0;h<o;h++){let m=0,g=0,v=1,n=0;for(const[w,T]of u){const F=V(h+w,d+T,o,l,t);n+=F>=0?1:0}const A=n/u.length*255,x=o/2,C=l/2,p=Math.abs(h+.5-x),y=Math.abs(d+.5-C),M=x-t,S=C-t;let D=0,N=0,P=0,R=p,E=y;if(p<=M&&y<=S){const w=M+t,T=S+t;w-p<T-y?(R=M+t,E=y):(R=p,E=S+t),D=Math.min(w-p,T-y)}else if(p>M&&y<=S)R=M+t,E=y,D=t-(p-M);else if(y>S&&p<=M)R=p,E=S+t,D=t-(y-S);else{const w=p-M,T=y-S,F=Math.sqrt(w*w+T*T);D=t-F,F>0&&(R=M+w/F*t,E=S+T/F*t)}const I=R-p,k=E-y,O=Math.sqrt(I*I+k*k);if(O>.001&&(N=(h>x?1:-1)*(I/O),P=(d>C?1:-1)*(k/O)),a>0&&D<a&&D>=0){const w=H(D,a),{derivative:T}=L(w,s);m=N*T*.5,g=P*T*.5,c&&(m=-m,g=-g)}const U=Math.sqrt(m*m+g*g+v*v);m/=U,g/=U,v/=U;const B=(d*o+h)*4;r[B]=(m*.5+.5)*255|0,r[B+1]=(g*.5+.5)*255|0,r[B+2]=(v*.5+.5)*255|0,r[B+3]=A}return{data:r,width:o,height:l}}function ce(i,e,t,a,s="squircle",c=!1){const o=le(i,e,t,a,s,c);return f.Texture.from({resource:o.data,width:o.width,height:o.height})}function Be(i,e,t,a,s="squircle",c=!1,o=!1){return{normalMap:ce(i,e,t,a,s,c),displacementMap:X(i,e,t,a,s,o),uvMap:ie(i,e,t),edgeMap:ne(i,e,t,a)}}class Ge{constructor(e,t){this.tracked=new Map,this.system=new te(e,t.systemOptions),this.system.setOpaqueSceneCallback(s=>{e.render({container:t.background,target:s,clear:!0})});const a=this.system.getCompositeDisplay();a&&t.stage.addChild(a),this.lightFollow=new Ie(e),this.domTracking=new Oe(this.tracked,{syncElement:this.syncElement.bind(this),updateGeometry:this.updatePanelGeometry.bind(this),isCssVisible:this.isCssVisible.bind(this),parseBorderRadius:this.parseBorderRadius.bind(this)}),this.animationHandlers=Ne(this.tracked,this.syncElement.bind(this),this.updatePanelGeometry.bind(this)),t.lightFollowParams&&this.setLightFollowParams(t.lightFollowParams)}setLightFollowParams(e){this.lightFollow.setParams(e)}autoMount(e=".glass-panel"){this.domTracking.setupObservers(e,t=>this.track(t),t=>this.untrack(t),()=>this.cleanup())}track(e,t={}){if(this.tracked.has(e))return this.tracked.get(e).panel;const a=this.createMaterial(e,t),s=e.getBoundingClientRect(),c=this.detectCircleMode(e,t),o=this.calculateRadius(e,s,t,c),l=this.createNormalMap(s,o,t,c),r=this.system.createPanel({material:a,normalMap:l}),u={panel:r,config:t,lastRect:s,lastRadius:o,visible:!0,isCircle:c,polling:!1};return this.tracked.set(e,u),this.domTracking.observeElement(e),e.addEventListener("transitionrun",this.animationHandlers.handleAnimationStart),e.addEventListener("transitionend",this.animationHandlers.handleAnimationEnd),e.addEventListener("transitioncancel",this.animationHandlers.handleAnimationEnd),e.addEventListener("animationstart",this.animationHandlers.handleAnimationStart),e.addEventListener("animationend",this.animationHandlers.handleAnimationEnd),e.addEventListener("animationcancel",this.animationHandlers.handleAnimationEnd),this.syncElement(e,r),r}untrack(e){const t=this.tracked.get(e);t&&(t.polling=!1,this.domTracking.unobserveElement(e),e.removeEventListener("transitionrun",this.animationHandlers.handleAnimationStart),e.removeEventListener("transitionend",this.animationHandlers.handleAnimationEnd),e.removeEventListener("transitioncancel",this.animationHandlers.handleAnimationEnd),e.removeEventListener("animationstart",this.animationHandlers.handleAnimationStart),e.removeEventListener("animationend",this.animationHandlers.handleAnimationEnd),e.removeEventListener("animationcancel",this.animationHandlers.handleAnimationEnd),this.system.removePanel(t.panel),this.tracked.delete(e))}update(){this.lightFollow.update(this.tracked);for(const[e,t]of this.tracked)this.syncElement(e,t.panel);this.system.render()}resize(){this.update()}setPositionTransform(e){this.positionTransform=e}cleanup(){for(const[e]of this.tracked)document.body.contains(e)||this.untrack(e)}destroy(){this.lightFollow.destroy(),this.domTracking.destroy(),this.system.destroy(),this.tracked.clear()}createMaterial(e,t){const a=e.dataset.glassIor?parseFloat(e.dataset.glassIor):void 0,s=e.dataset.glassRoughness?parseFloat(e.dataset.glassRoughness):void 0,c={...K.clear(),...t.material};return a!==void 0&&(c.ior=a),s!==void 0&&(c.roughness=s),c}detectCircleMode(e,t){return t.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle")}calculateRadius(e,t,a,s){if(s)return Math.min(t.width,t.height)/2;const c=this.parseBorderRadius(e,t);return a.cornerRadius??c}createNormalMap(e,t,a,s){if(a.normalMap)return a.normalMap;const c=a.bevelSize??12,o=a.surfaceShape??"squircle",l=a.invertNormals??!1,r=a.useDisplacementMap??!1,u=window.devicePixelRatio||1,d=Math.floor(Math.min(e.width,e.height)*u),h=s?d:e.width*u,m=s?d:e.height*u;return r?X(h,m,t*u,c*u,o):ae(h,m,t*u,c*u,o,l)}syncElement(e,t){const a=this.tracked.get(e),s=e.getBoundingClientRect(),c=a!=null&&a.isCircle?Math.floor(Math.min(s.width,s.height)):Math.round(s.width),o=a!=null&&a.isCircle?c:Math.round(s.height),l=Math.round(s.left)+c/2,r=Math.round(s.top)+o/2;if(this.positionTransform){const u=this.positionTransform(l,r,c,o);t.position.set(Math.round(u.x),Math.round(u.y)),t.scale.set(Math.round(c*u.scaleX),Math.round(o*u.scaleY)),t.rotation=u.rotation}else t.position.set(l,r),t.scale.set(c,o),t.rotation=0}parseBorderRadius(e,t){const a=window.getComputedStyle(e),s=a.borderTopLeftRadius,c=a.borderTopRightRadius,o=a.borderBottomRightRadius,l=a.borderBottomLeftRadius,r=(g,v)=>g.endsWith("%")?parseFloat(g)/100*v:parseFloat(g)||0,u=g=>g.split(" ")[0],d=(t.width+t.height)/2;return[r(u(s),d),r(u(c),d),r(u(o),d),r(u(l),d)].reduce((g,v)=>g+v,0)/4||20}isCssVisible(e){if(e.hidden)return!1;const t=window.getComputedStyle(e);return t.display!=="none"&&t.visibility!=="hidden"}updatePanelGeometry(e,t){const a=e.getBoundingClientRect(),s=this.detectCircleMode(e,t.config),c=this.calculateRadius(e,a,t.config,s),o=this.createNormalMap(a,c,t.config,s);t.panel.setTextures({normalMap:o}),t.lastRect=a,t.lastRadius=c}}b.AdaptiveQualityController=$,b.CapabilityProbe=Y,b.EventBus=J,b.GlassHUD=Pe,b.GlassOverlay=Ge,b.GlassPanel=Z,b.GlassPresets=K,b.GlassSystem=te,b.SceneRTManager=q,b.createAllMaps=Be,b.createDefaultEdgeMask=Te,b.createDefaultEdgeTactic=G,b.createDisplacementMap=X,b.createDisplacementMapData=se,b.createEdgeMap=ne,b.createEdgeMapData=oe,b.createNormalMap=ce,b.createNormalMapData=le,b.createPillGeometry=be,b.createPillNormalMap=Se,b.createRoundedRectNormalMap=ae,b.createUVMap=ie,b.createUVMapData=re,b.getDistanceToBoundary=V,b.getHeightAndDerivative=L,b.heightCircle=_,b.heightSquircle=j,b.hexToVec3=Q,b.smootherstep=ye,b.updatePillGeometry=Me,Object.defineProperty(b,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=pixi-adaptive-glass.umd.js.map
