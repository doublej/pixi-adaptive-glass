(function(m,l){typeof exports=="object"&&typeof module<"u"?l(exports,require("pixi.js")):typeof define=="function"&&define.amd?define(["exports","pixi.js"],l):(m=typeof globalThis<"u"?globalThis:m||self,l(m.PixiAdaptiveGlass={},m.PIXI))})(this,function(m,l){"use strict";class z{constructor(e){this.gl=e}run(){if(this.cached)return this.cached;const e=this.isWebGL2Context(this.gl),t=this.queryExtensions(["EXT_color_buffer_float","OES_texture_float_linear","OES_standard_derivatives","EXT_disjoint_timer_query_webgl2","EXT_disjoint_timer_query"]),s=e&&this.getMaxDrawBuffers()>1?"webgl2":"webgl1";return this.cached={tier:s,maxDrawBuffers:this.getMaxDrawBuffers(),extensions:t},this.cached}queryExtensions(e){return e.reduce((t,s)=>(t[s]=!!this.gl.getExtension(s),t),{})}getMaxDrawBuffers(){const e=this.gl.getExtension("WEBGL_draw_buffers"),t=this.isWebGL2Context(this.gl)?this.gl.MAX_DRAW_BUFFERS:e?e.MAX_DRAW_BUFFERS_WEBGL:0;return t?this.gl.getParameter(t)??1:1}isWebGL2Context(e){return typeof WebGL2RenderingContext<"u"&&e instanceof WebGL2RenderingContext}}const te={renderScale:1,enableDispersion:!0,enableCaustics:!0,enableContactShadows:!0,maxBlurTaps:9,edgeSupersampling:1},se=[{check:r=>r.renderScale>.85,apply:r=>{r.renderScale=.85},action:"scale-rt-0-85",reason:"Frame budget exceeded"},{check:r=>r.renderScale>.7,apply:r=>{r.renderScale=.7},action:"scale-rt-0-7",reason:"Severe perf drop"},{check:r=>r.maxBlurTaps>5,apply:r=>{r.maxBlurTaps=5},action:"reduce-blur",reason:"Sustained frame drops"},{check:r=>r.enableDispersion,apply:r=>{r.enableDispersion=!1},action:"disable-dispersion",reason:"Dispersion too expensive"},{check:r=>r.enableCaustics||r.enableContactShadows,apply:r=>{r.enableCaustics=!1,r.enableContactShadows=!1},action:"disable-caustics",reason:"Optional overlays disabled"}];class W{constructor(e=100){this.targetFrameMs=e,this.current={...te},this.telemetry=[],this.overrides={}}getQuality(){return{...this.current}}record(e){this.telemetry.push(e),this.telemetry.length>120&&this.telemetry.shift()}setOverrides(e){this.overrides={...this.overrides,...e},this.current={...this.current,...this.overrides}}getTelemetry(){return[...this.telemetry]}evaluate(){if(this.telemetry.length<30)return;const e=this.telemetry.reduce((s,i)=>s+i.cpuMs,0)/this.telemetry.length,t=this.telemetry.reduce((s,i)=>s+(i.gpuMs??i.cpuMs),0)/this.telemetry.length;if(!(Math.max(e,t)<=this.targetFrameMs)){for(const s of se)if(s.check(this.current))return s.apply(this.current),{action:s.action,reason:s.reason}}}}class B{constructor(e,t){this.renderer=e,this.useDepth=t,this.scale=1,this.clearRect=new l.Rectangle}ensure(e,t,s){const i=this.renderer.resolution*s;return(!this.handles||this.handles.sceneColor.width!==e||this.handles.sceneColor.height!==t||this.handles.sceneColor.source.resolution!==i)&&(this.dispose(),this.handles={sceneColor:l.RenderTexture.create({width:e,height:t,resolution:i,scaleMode:"linear"}),sceneDepth:this.useDepth?l.RenderTexture.create({width:e,height:t,resolution:i,scaleMode:"nearest"}):void 0},this.scale=s),this.handles}clearTargets(){if(!this.handles)return;this.clearRect.width=this.handles.sceneColor.width,this.clearRect.height=this.handles.sceneColor.height;const e=this.renderer;e.renderTarget.bind(this.handles.sceneColor);const t=e.gl;t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),this.handles.sceneDepth&&(e.renderTarget.bind(this.handles.sceneDepth),t.clearColor(1,0,0,1),t.clearDepth(1),t.clear(t.DEPTH_BUFFER_BIT))}dispose(){var e,t,s;(e=this.handles)==null||e.sceneColor.destroy(!0),(s=(t=this.handles)==null?void 0:t.sceneDepth)==null||s.destroy(!0),this.handles=void 0}}class V{constructor(){this.listeners={}}on(e,t){let s=this.listeners[e];s||(s=new Set,this.listeners[e]=s),s.add(t)}off(e,t){var s;(s=this.listeners[e])==null||s.delete(t)}emit(e,t){const s=this.listeners[e];if(s)for(const i of s)i(t)}removeAll(){var e;for(const t of Object.keys(this.listeners))(e=this.listeners[t])==null||e.clear()}}const F=r=>r,q={water(){return F({ior:1.333,thickness:.6,roughness:.1,dispersion:.02,opacity:1,tint:10476031})},crownGlass(){return F({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},acrylic(){return F({ior:1.49,thickness:.7,roughness:.12,dispersion:.01,opacity:1,tint:16250871})},clear(){return F({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},fromIOR(r){const e=Math.min(Math.max(r,1),2);return F({ior:e,thickness:.75,roughness:.08,dispersion:(e-1)*.05,opacity:1,tint:16777215})}};let ie=0;const re=new l.MeshGeometry({positions:new Float32Array([-.5,-.5,.5,-.5,.5,.5,-.5,.5]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])}),ae=`
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
`,oe=`
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;class H extends l.Mesh{constructor(e){const t=l.State.for2d();t.culling=!1,super({geometry:e.geometry??re,shader:l.Shader.from({gl:{vertex:ae,fragment:oe}}),state:t}),this.tier="webgl1",this.id=e.id??`glass-panel-${++ie}`,this.glassMaterial=e.material,this.normalMap=e.normalMap,this.dudvMap=e.dudvMap,this.causticsAtlas=e.causticsAtlas,this.sdfShadow=e.sdfShadow,e.filters&&(this.filters=e.filters)}setMaterial(e){this.glassMaterial={...this.glassMaterial,...e}}setTextures(e){e.normalMap&&(this.normalMap=e.normalMap),e.dudvMap&&(this.dudvMap=e.dudvMap),e.causticsAtlas&&(this.causticsAtlas=e.causticsAtlas),e.sdfShadow&&(this.sdfShadow=e.sdfShadow)}setTier(e){this.tier=e}getTier(){return this.tier}}function Q(r){return[(r>>16&255)/255,(r>>8&255)/255,(r&255)/255]}class ne extends l.Filter{constructor(){const e=`
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
    `;super({glProgram:new l.GlProgram({vertex:`
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            void main(void){
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
          `,fragment:e}),resources:{uSceneColor:l.Texture.WHITE.source,uNormalMap:l.Texture.WHITE.source,uniforms:{uInvResolution:{value:[1,1],type:"vec2<f32>"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uDisplacementScale:{value:.01,type:"f32"},uTint:{value:[1,1,1],type:"vec3<f32>"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"}}}})}}class le{constructor(e){this.renderer=e,this.id="webgl1",this.filter=new ne,this.rtManager=new B(e,!1),this.blitSprite=new l.Sprite(l.Texture.WHITE)}setup(){}render(e){const{renderer:t,panels:s,quality:i,drawOpaqueScene:a}=e,n=this.rtManager.ensure(t.screen.width,t.screen.height,i.renderScale);a(n.sceneColor),this.blitSprite.texture=n.sceneColor,this.blitSprite.width=t.screen.width,this.blitSprite.height=t.screen.height,t.render({container:this.blitSprite,clear:!0});const u=[...s].sort((c,h)=>(c.zIndex??0)-(h.zIndex??0));for(const c of u)this.applyFilter(c,n.sceneColor,i),t.render({container:c})}dispose(){this.rtManager.dispose()}applyFilter(e,t,s){if(!(!!(e.normalMap||e.dudvMap)||e.glassMaterial.dispersion>.001||e.glassMaterial.roughness>.001)){e.filters=null;return}const a=this.filter.resources;a.uSceneColor=t.source,a.uNormalMap=(e.normalMap??e.dudvMap??l.Texture.WHITE).source;const n=a.uniforms;n.uInvResolution=[1/t.width,1/t.height],n.uDispersion=e.glassMaterial.dispersion,n.uRoughness=e.glassMaterial.roughness,n.uDisplacementScale=e.glassMaterial.thickness*.1,n.uTint=Q(e.glassMaterial.tint??16777215),n.uOpacity=e.glassMaterial.opacity,n.uEnableDispersion=s.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,e.filters=[this.filter]}}const ce=`
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,X=`
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
`,ue=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uSceneColor;
uniform sampler2D uNormalMap;
uniform sampler2D uCausticsMap;
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
uniform float uEdgeSmoothWidth;
uniform float uEdgeContrast;
uniform float uEdgeAlphaFalloff;
uniform float uEdgeMaskCutoff;
uniform bool uEnableEdgeSmoothing;
uniform bool uEnableContrastReduction;
uniform bool uEnableAlphaFalloff;
uniform bool uEnableTintOpacity;
uniform float uEdgeBlur;
uniform float uGlassSupersampling;
uniform vec2 uPanelSize;

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
  // Scale blur by panel size relative to reference (200px)
  float referenceSize = 200.0;
  float avgPanelSize = (uPanelSize.x + uPanelSize.y) * 0.5;
  float sizeScale = avgPanelSize / referenceSize;

  float radius = uRoughness * uBlurSpread * sizeScale;
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

void main(){
  vec2 screenUV = gl_FragCoord.xy * uInvResolution;

  vec4 normalSample = texture2D(uNormalMap, vUv);
  float mask = normalSample.a;

  // Blur the mask at edges for softer borders
  if (uEdgeBlur > 0.0 && mask < 0.9) {
    float blurredMask = 0.0;
    float blurWeight = 0.0;
    vec2 texelSize = uInvResolution * uEdgeBlur;
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 offset = vec2(float(x), float(y)) * texelSize;
        float sampleMask = texture2D(uNormalMap, vUv + offset).a;
        float weight = 1.0 - length(vec2(float(x), float(y))) * 0.2;
        blurredMask += sampleMask * weight;
        blurWeight += weight;
      }
    }
    mask = blurredMask / blurWeight;
  }

  // Discard pixels outside the masked area (border radius)
  if (mask < uEdgeMaskCutoff) {
    discard;
  }

  // Simple refraction offset based on normal map
  vec2 normal = normalSample.xy * 2.0 - 1.0;

  // Edge smoothing with configurable width
  float edgeSmoothness = 1.0;
  if (uEnableEdgeSmoothing) {
    float smoothWidth = uEdgeSmoothWidth * (0.5 + 0.5 * uEdgeSupersampling);
    edgeSmoothness = smoothstep(0.0, smoothWidth, mask);
  }

  float contrastReduction = 1.0;
  if (uEnableContrastReduction) {
    contrastReduction = mix(uEdgeContrast, 1.0, edgeSmoothness);
  }

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

  // Ambient occlusion based on edge distance (darker at edges/outside)
  float edgeDist = length(normal);
  float aoFactor = 1.0 - uAO * smoothstep(0.0, uAORadius, edgeDist);

  // Apply lighting
  refracted = refracted * shadowFactor * aoFactor + vec3(spec);

  // Apply contrast reduction at edges and tint intensity to overall opacity
  if (uEnableContrastReduction) {
    refracted *= contrastReduction;
  }

  // Use normal map alpha as shape mask
  float shapeMask = normalSample.a;
  if (shapeMask < 0.5) discard;

  gl_FragColor = vec4(refracted, 1.0);
}
`,he=`
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
`,de=`
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
`,fe=new l.MeshGeometry({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])});class me{constructor(e,t){this.renderer=e,this.id="webgl2",this.rtManager=new B(e,t);const s=new l.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uInvResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uIOR:{value:1,type:"f32"},uThickness:{value:1,type:"f32"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"},uEnableCaustics:{value:0,type:"f32"},uTint:{value:new Float32Array([1,1,1]),type:"vec3<f32>"},uSpecular:{value:0,type:"f32"},uShininess:{value:32,type:"f32"},uShadow:{value:0,type:"f32"},uLightDir:{value:new Float32Array([.5,.5,1]),type:"vec3<f32>"},uBlurSamples:{value:8,type:"f32"},uBlurSpread:{value:4,type:"f32"},uBlurAngle:{value:0,type:"f32"},uBlurAnisotropy:{value:0,type:"f32"},uBlurGamma:{value:1,type:"f32"},uAberrationR:{value:1,type:"f32"},uAberrationB:{value:1,type:"f32"},uAO:{value:0,type:"f32"},uAORadius:{value:.5,type:"f32"},uNoiseScale:{value:20,type:"f32"},uNoiseIntensity:{value:0,type:"f32"},uNoiseRotation:{value:0,type:"f32"},uNoiseThreshold:{value:0,type:"f32"},uEdgeSupersampling:{value:1,type:"f32"},uEdgeSmoothWidth:{value:.15,type:"f32"},uEdgeContrast:{value:.7,type:"f32"},uEdgeAlphaFalloff:{value:1,type:"f32"},uEdgeMaskCutoff:{value:.001,type:"f32"},uEnableEdgeSmoothing:{value:1,type:"f32"},uEnableContrastReduction:{value:1,type:"f32"},uEnableAlphaFalloff:{value:1,type:"f32"},uEnableTintOpacity:{value:1,type:"f32"},uEdgeBlur:{value:0,type:"f32"},uGlassSupersampling:{value:1,type:"f32"},uPanelSize:{value:new Float32Array([200,200]),type:"vec2<f32>"}});this.refractShader=l.Shader.from({gl:{vertex:X,fragment:ue},resources:{uSceneColor:l.Texture.WHITE.source,uNormalMap:l.Texture.WHITE.source,uCausticsMap:l.Texture.WHITE.source,panelUniforms:s}});const i=new l.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uOpacity:{value:1,type:"f32"}});this.revealageShader=l.Shader.from({gl:{vertex:X,fragment:he},resources:{uNormalMap:l.Texture.WHITE.source,panelUniforms:i}}),this.compositeShader=l.Shader.from({gl:{vertex:ce,fragment:de},resources:{uSceneColor:l.Texture.WHITE.source,uAccum:l.Texture.WHITE.source,uReveal:l.Texture.WHITE.source}}),this.fullScreenQuad=new l.Mesh({geometry:fe,shader:this.compositeShader}),this.fullScreenQuad.state=l.State.for2d(),this.fullScreenQuad.state.culling=!1,this.shadowSprite=new l.Sprite(l.Texture.WHITE),this.panelParent=new l.Container,this.panelParent.alpha=1,this.compositeSprite=new l.Sprite(l.Texture.EMPTY),this.compositeSprite.position.set(0,0),this.compositeSprite.visible=!0,this.compositeSprite.alpha=1,this.compositeSprite.zIndex=9999}setup(){}render(e){var h,d;const{renderer:t,panels:s,quality:i,drawOpaqueScene:a}=e,n=t.screen.width,u=t.screen.height,c=this.rtManager.ensure(n,u,i.renderScale);this.ensureAccumTargets(n,u),this.ensureCompositeTarget(n,u),a(c.sceneColor),this.clearTarget(this.accumRT,0,0,0,0),this.clearTarget(this.revealRT,1,1,1,1);for(const p of s)this.renderPanel(p,i,c.sceneColor);this.fullScreenQuad.shader=this.compositeShader,this.compositeShader.resources.uSceneColor=c.sceneColor.source,this.compositeShader.resources.uAccum=(h=this.accumRT)==null?void 0:h.source,this.compositeShader.resources.uReveal=(d=this.revealRT)==null?void 0:d.source,this.fullScreenQuad.width=t.screen.width,this.fullScreenQuad.height=t.screen.height,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),t.render({container:this.fullScreenQuad,target:this.compositeRT,clear:!0}),this.compositeRT&&(this.compositeSprite.texture=this.compositeRT,this.compositeSprite.width=n,this.compositeSprite.height=u,this.compositeSprite.visible=!0),this.renderContactShadows(s,i)}dispose(){var e,t,s;this.rtManager.dispose(),(e=this.accumRT)==null||e.destroy(!0),(t=this.revealRT)==null||t.destroy(!0),(s=this.compositeRT)==null||s.destroy(!0)}ensureAccumTargets(e,t){var i,a;const s=this.renderer.resolution;(!this.accumRT||this.accumRT.width!==e||this.accumRT.height!==t||this.accumRT.source.resolution!==s)&&((i=this.accumRT)==null||i.destroy(!0),this.accumRT=l.RenderTexture.create({width:e,height:t,resolution:s})),(!this.revealRT||this.revealRT.width!==e||this.revealRT.height!==t||this.revealRT.source.resolution!==s)&&((a=this.revealRT)==null||a.destroy(!0),this.revealRT=l.RenderTexture.create({width:e,height:t,resolution:s}))}clearTarget(e,t,s,i,a){if(!e)return;const n=new l.Container;this.renderer.render({container:n,target:e,clear:!0,clearColor:[t,s,i,a]})}renderPanel(e,t,s){var d,p,g,f;if(!this.accumRT||!this.revealRT)return;const i=e.normalMap??l.Texture.WHITE,a=this.renderer.screen.width,n=this.renderer.screen.height,u=this.refractShader.resources;if(u){u.uSceneColor=s.source,u.uNormalMap=i.source,u.uCausticsMap=(e.causticsAtlas??l.Texture.WHITE).source;const o=(d=u.panelUniforms)==null?void 0:d.uniforms;if(o){const b=((g=(p=this.accumRT)==null?void 0:p.source)==null?void 0:g._resolution)??this.renderer.resolution;o.uPosition[0]=e.position.x,o.uPosition[1]=e.position.y,o.uScale[0]=e.scale.x,o.uScale[1]=e.scale.y,o.uResolution[0]=a,o.uResolution[1]=n,o.uInvResolution[0]=1/(a*b),o.uInvResolution[1]=1/(n*b),o.uIOR=e.glassMaterial.ior,o.uThickness=e.glassMaterial.thickness,o.uDispersion=e.glassMaterial.dispersion,o.uRoughness=e.glassMaterial.roughness,o.uOpacity=e.glassMaterial.opacity??1,o.uEnableDispersion=t.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,o.uEnableCaustics=t.enableCaustics&&e.causticsAtlas?1:0;const R=Q(e.glassMaterial.tint??16777215);o.uTint[0]=R[0],o.uTint[1]=R[1],o.uTint[2]=R[2],o.uSpecular=e.glassMaterial.specular??0,o.uShininess=e.glassMaterial.shininess??32,o.uShadow=e.glassMaterial.shadow??0;const C=e.glassMaterial.lightDir??[.5,.5,1];o.uLightDir[0]=C[0],o.uLightDir[1]=C[1],o.uLightDir[2]=C[2],o.uBlurSamples=e.glassMaterial.blurSamples??8,o.uBlurSpread=e.glassMaterial.blurSpread??4,o.uBlurAngle=(e.glassMaterial.blurAngle??0)*Math.PI/180,o.uBlurAnisotropy=e.glassMaterial.blurAnisotropy??0,o.uBlurGamma=e.glassMaterial.blurGamma??1,o.uAberrationR=e.glassMaterial.aberrationR??1,o.uAberrationB=e.glassMaterial.aberrationB??1,o.uAO=e.glassMaterial.ao??0,o.uAORadius=e.glassMaterial.aoRadius??.5,o.uNoiseScale=e.glassMaterial.noiseScale??20,o.uNoiseIntensity=e.glassMaterial.noiseIntensity??0,o.uNoiseRotation=e.glassMaterial.noiseRotation??0,o.uNoiseThreshold=e.glassMaterial.noiseThreshold??0,o.uEdgeSupersampling=t.edgeSupersampling??1,o.uEdgeSmoothWidth=e.glassMaterial.edgeSmoothWidth??.15,o.uEdgeContrast=e.glassMaterial.edgeContrast??.7,o.uEdgeAlphaFalloff=e.glassMaterial.edgeAlphaFalloff??1,o.uEdgeMaskCutoff=e.glassMaterial.edgeMaskCutoff??.001,o.uEnableEdgeSmoothing=e.glassMaterial.enableEdgeSmoothing===!0?1:0,o.uEnableContrastReduction=e.glassMaterial.enableContrastReduction===!0?1:0,o.uEnableAlphaFalloff=e.glassMaterial.enableAlphaFalloff===!0?1:0,o.uEnableTintOpacity=e.glassMaterial.enableTintOpacity===!0?1:0,o.uEdgeBlur=e.glassMaterial.edgeBlur??0,o.uGlassSupersampling=e.glassMaterial.glassSupersampling??1,o.uPanelSize[0]=e.scale.x,o.uPanelSize[1]=e.scale.y}}const c=e.shader;e.shader=this.refractShader,this.drawPanelToTarget(e,this.accumRT),e.shader=this.revealageShader;const h=this.revealageShader.resources;if(h){h.uNormalMap=i.source;const o=(f=h.panelUniforms)==null?void 0:f.uniforms;o&&(o.uPosition[0]=e.position.x,o.uPosition[1]=e.position.y,o.uScale[0]=e.scale.x,o.uScale[1]=e.scale.y,o.uResolution[0]=a,o.uResolution[1]=n,o.uOpacity=e.glassMaterial.opacity)}this.drawPanelToTarget(e,this.revealRT),e.shader=c}renderContactShadows(e,t){if(t.enableContactShadows)for(const s of e)s.sdfShadow&&(this.shadowSprite.texture=s.sdfShadow,this.shadowSprite.position.copyFrom(s.position),this.shadowSprite.scale.copyFrom(s.scale),this.shadowSprite.rotation=s.rotation,this.shadowSprite.alpha=Math.min(s.glassMaterial.opacity+.2,.9),this.renderer.render(this.shadowSprite))}getCompositeDisplay(){return this.compositeSprite}drawPanelToTarget(e,t){const s=this.renderer,i=s.gl;this.panelParent.removeChildren(),this.panelParent.addChild(e),e.updateLocalTransform(),e.worldTransform.copyFrom(e.localTransform),i&&(i.enable(i.BLEND),i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA)),s.render({container:this.panelParent,target:t,clear:!1}),i&&i.blendFunc(i.ONE,i.ONE_MINUS_SRC_ALPHA)}ensureCompositeTarget(e,t){var i;const s=this.renderer.resolution;(!this.compositeRT||this.compositeRT.width!==e||this.compositeRT.height!==t||this.compositeRT.source.resolution!==s)&&((i=this.compositeRT)==null||i.destroy(!0),this.compositeRT=l.RenderTexture.create({width:e,height:t,resolution:s}),this.compositeSprite.texture=this.compositeRT)}}class Y{constructor(e,t={}){this.renderer=e,this.panels=[],this.quality=new W,this.drawOpaqueScene=()=>{},this.events=new V;const s=e.gl,i=new z(s).run();this.pipeline=i.tier==="webgl2"?new me(e,!0):new le(e),i.tier==="webgl1"&&this.emitFallback("webgl","MRT unavailable, using compatibility pipeline")}setOpaqueSceneCallback(e){this.drawOpaqueScene=e}createPanel(e){const t=new H(e);return this.panels.push(t),t}removePanel(e){const t=this.panels.indexOf(e);t>=0&&(this.panels.splice(t,1),e.destroy({children:!0,texture:!1,textureSource:!1}))}render(){const e=performance.now(),t=this.quality.getQuality();this.pipeline.render({renderer:this.renderer,panels:this.panels,quality:t,drawOpaqueScene:this.drawOpaqueScene});const s=performance.now()-e;this.quality.record({cpuMs:s,timestamp:e});const i=this.quality.evaluate();i&&this.events.emit("quality:decision",i)}setQuality(e){this.quality.setOverrides(e)}destroy(){for(const e of this.panels)e.destroy({children:!0,texture:!1,textureSource:!1});this.panels.length=0,this.pipeline.dispose(),this.events.removeAll()}on(e,t){this.events.on(e,t)}off(e,t){this.events.off(e,t)}getPipelineId(){return this.pipeline.id}getCompositeDisplay(){if(typeof this.pipeline.getCompositeDisplay=="function")return this.pipeline.getCompositeDisplay()}emitFallback(e,t){const s={target:e,message:t,timestamp:performance.now()};console.warn(`GlassSystem fallback: ${e} - ${t}`),this.events.emit("fallback",s)}}class pe{constructor(e){this.renderer=e,this.container=new l.Container,this.visible=!1,this.panel=new l.Graphics().beginFill(0,.65).drawRoundedRect(0,0,260,120,8).endFill(),this.text=new l.Text("Glass HUD",{fontSize:12,fill:16777215}),this.text.position.set(12,10),this.container.addChild(this.panel,this.text),this.container.visible=this.visible,this.container.position.set(12,12)}setVisible(e){this.visible=e,this.container.visible=e}update(e){if(!this.visible)return;const{quality:t,fps:s,lastDecision:i}=e,a=[`FPS: ${s.toFixed(1)}`,`Scale: ${(t.renderScale*100).toFixed(0)}%`,`Blur taps: ${t.maxBlurTaps}`,`Dispersion: ${t.enableDispersion?"on":"off"}`,`Caustics: ${t.enableCaustics?"on":"off"}`];i&&a.push(`Action: ${i.action}`),this.text.text=a.join(`
`)}}class ge{constructor(e,t){this.tracked=new Map,this.currentLightDir=[0,0,.15],this.targetLightDir=[0,0,.15],this.delayedLightDir=[0,0,.15],this.handleAnimationStart=i=>{const a=i.currentTarget;this.startPolling(a)},this.handleAnimationEnd=i=>{const a=i.currentTarget;a.getAnimations().length===0&&this.stopPolling(a)},this.renderer=e,this.background=t.background,this.system=new Y(e,t.systemOptions),this.system.setOpaqueSceneCallback(i=>{e.render({container:this.background,target:i,clear:!0})});const s=this.system.getCompositeDisplay();s&&t.stage.addChild(s),t.lightFollowParams&&this.setLightFollowParams(t.lightFollowParams)}setLightFollowParams(e){this.lightFollowParams=e,e.followCursor&&!this.boundMouseMove?(this.boundMouseMove=t=>{const s=e.curve??1.5,i=e.zMin??.05,a=e.zMax??.2,n=e.edgeStretch??.5,c=this.renderer.canvas.getBoundingClientRect();let h=(t.clientX-c.left)/c.width*2-1,d=(t.clientY-c.top)/c.height*2-1;h=Math.sign(h)*Math.pow(Math.abs(h),n),d=Math.sign(d)*Math.pow(Math.abs(d),n);const p=Math.sqrt(h*h+d*d),g=Math.max(i,Math.min(a,a-Math.pow(p,s)*a*.5));this.targetLightDir=[h,d,g]},window.addEventListener("mousemove",this.boundMouseMove)):!e.followCursor&&this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0)}autoMount(e=".glass-panel"){this.resizeObserver=new ResizeObserver(s=>{for(const i of s){const a=i.target,n=this.tracked.get(a);if(!n)continue;const u=a.getBoundingClientRect(),c=n.lastRect;c&&(Math.abs(u.width-c.width)>1||Math.abs(u.height-c.height)>1)&&this.updatePanelGeometry(a,n),n.lastRect=u}}),this.intersectionObserver=new IntersectionObserver(s=>{for(const i of s){const a=i.target,n=this.tracked.get(a);if(!n)continue;n.visible=i.isIntersecting;const u=this.isCssVisible(a);n.panel.visible=n.visible&&u}}),document.querySelectorAll(e).forEach(s=>this.track(s)),this.observer=new MutationObserver(s=>{for(const i of s)if(i.type==="childList")i.addedNodes.forEach(a=>{a instanceof HTMLElement&&a.matches(e)&&this.track(a),a instanceof HTMLElement&&a.querySelectorAll(e).forEach(u=>this.track(u))}),i.removedNodes.forEach(a=>{a instanceof HTMLElement&&this.tracked.has(a)&&this.untrack(a)});else if(i.type==="attributes"){const a=i.target;if(i.attributeName==="class")a.matches(e)?this.track(a):this.untrack(a);else if(i.attributeName==="style"){const n=this.tracked.get(a);if(n){const u=this.isCssVisible(a);n.panel.visible=u&&n.visible;const c=a.getBoundingClientRect(),h=this.parseBorderRadius(a,c);Math.abs(h-n.lastRadius)>.5&&this.updatePanelGeometry(a,n)}}else if(i.attributeName==="hidden"){const n=this.tracked.get(a);if(n){const u=this.isCssVisible(a);n.panel.visible=u&&n.visible}}}this.cleanup()}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style","hidden"]})}track(e,t={}){var v,y;if(this.tracked.has(e))return this.tracked.get(e).panel;const s=e.dataset.glassIor?parseFloat(e.dataset.glassIor):void 0,i=e.dataset.glassRoughness?parseFloat(e.dataset.glassRoughness):void 0,a={...q.clear(),...t.material};s!==void 0&&(a.ior=s),i!==void 0&&(a.roughness=i);const n=e.getBoundingClientRect(),u=t.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle");let c;if(u)c=Math.min(n.width,n.height)/2;else{const S=this.parseBorderRadius(e,n);c=t.cornerRadius??S}const h=t.bevelSize??12,d=t.surfaceShape??"squircle",p=t.flipX??!1,g=t.flipY??!1,f=t.bezierCurve,o=Math.floor(Math.min(n.width,n.height)),b=u?o:n.width,R=u?o:n.height,C=t.normalMap||Z(b,R,c,h,d,p,g,f),A=this.system.createPanel({material:a,normalMap:C});return this.tracked.set(e,{panel:A,config:t,lastRect:n,lastRadius:c,visible:!0,isCircle:u,polling:!1}),(v=this.resizeObserver)==null||v.observe(e),(y=this.intersectionObserver)==null||y.observe(e),e.addEventListener("transitionrun",this.handleAnimationStart),e.addEventListener("transitionend",this.handleAnimationEnd),e.addEventListener("transitioncancel",this.handleAnimationEnd),e.addEventListener("animationstart",this.handleAnimationStart),e.addEventListener("animationend",this.handleAnimationEnd),e.addEventListener("animationcancel",this.handleAnimationEnd),this.syncElement(e,A),A}startPolling(e){const t=this.tracked.get(e);if(!t||t.polling)return;t.polling=!0;const s=()=>{t.polling&&(this.syncElement(e,t.panel),requestAnimationFrame(s))};requestAnimationFrame(s)}stopPolling(e){const t=this.tracked.get(e);t&&(t.polling=!1,this.updatePanelGeometry(e,t))}untrack(e){var s,i;const t=this.tracked.get(e);t&&(t.polling=!1,(s=this.resizeObserver)==null||s.unobserve(e),(i=this.intersectionObserver)==null||i.unobserve(e),e.removeEventListener("transitionrun",this.handleAnimationStart),e.removeEventListener("transitionend",this.handleAnimationEnd),e.removeEventListener("transitioncancel",this.handleAnimationEnd),e.removeEventListener("animationstart",this.handleAnimationStart),e.removeEventListener("animationend",this.handleAnimationEnd),e.removeEventListener("animationcancel",this.handleAnimationEnd),this.system.removePanel(t.panel),this.tracked.delete(e))}update(){var e;if((e=this.lightFollowParams)!=null&&e.followCursor){const s=1-(this.lightFollowParams.delay??.5)*.97;this.delayedLightDir[0]+=(this.targetLightDir[0]-this.delayedLightDir[0])*s,this.delayedLightDir[1]+=(this.targetLightDir[1]-this.delayedLightDir[1])*s,this.delayedLightDir[2]+=(this.targetLightDir[2]-this.delayedLightDir[2])*s;const a=1-(this.lightFollowParams.smoothing??.9)*.97;this.currentLightDir[0]+=(this.delayedLightDir[0]-this.currentLightDir[0])*a,this.currentLightDir[1]+=(this.delayedLightDir[1]-this.currentLightDir[1])*a,this.currentLightDir[2]+=(this.delayedLightDir[2]-this.currentLightDir[2])*a;for(const[,n]of this.tracked)n.panel.glassMaterial.lightDir=[...this.currentLightDir]}for(const[t,s]of this.tracked)this.syncElement(t,s.panel);this.system.render()}resize(){this.update()}setPositionTransform(e){this.positionTransform=e}cleanup(){for(const[e]of this.tracked)document.body.contains(e)||this.untrack(e)}destroy(){var e,t,s;this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0),(e=this.observer)==null||e.disconnect(),(t=this.resizeObserver)==null||t.disconnect(),(s=this.intersectionObserver)==null||s.disconnect(),this.system.destroy(),this.tracked.clear()}syncElement(e,t){const s=this.tracked.get(e),i=e.getBoundingClientRect(),a=i.left+i.width/2,n=i.top+i.height/2;let u=i.width,c=i.height;if(s!=null&&s.isCircle){const h=Math.floor(Math.min(i.width,i.height));u=h,c=h}if(this.positionTransform){const h=this.positionTransform(a,n,u,c);t.position.set(h.x,h.y),t.scale.set(u*h.scaleX,c*h.scaleY),t.rotation=h.rotation}else t.position.set(a,n),t.scale.set(u,c),t.rotation=0}parseBorderRadius(e,t){const s=window.getComputedStyle(e),i=s.borderTopLeftRadius,a=s.borderTopRightRadius,n=s.borderBottomRightRadius,u=s.borderBottomLeftRadius,c=(f,o)=>f.endsWith("%")?parseFloat(f)/100*o:parseFloat(f)||0,h=f=>f.split(" ")[0],d=(t.width+t.height)/2;return[c(h(i),d),c(h(a),d),c(h(n),d),c(h(u),d)].reduce((f,o)=>f+o,0)/4||20}isCssVisible(e){if(e.hidden)return!1;const t=window.getComputedStyle(e);return t.display!=="none"&&t.visibility!=="hidden"}updatePanelGeometry(e,t){const s=e.getBoundingClientRect(),i=t.config.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle");let a;if(i)a=Math.min(s.width,s.height)/2;else{const b=this.parseBorderRadius(e,s);a=t.config.cornerRadius??b}const n=t.config.bevelSize??12,u=t.config.surfaceShape??"squircle",c=t.config.flipX??!1,h=t.config.flipY??!1,d=t.config.bezierCurve,p=Math.floor(Math.min(s.width,s.height)),g=i?p:s.width,f=i?p:s.height,o=Z(g,f,a,n,u,c,h,d);t.panel.setTextures({normalMap:o}),t.lastRect=s,t.lastRadius=a}}function $(r){return Math.sqrt(Math.max(0,2*r-r*r))}function ve(r){const e=Math.sqrt(Math.max(1e-4,2*r-r*r));return(1-r)/e}function k(r){const e=1-Math.pow(1-r,4);return Math.pow(Math.max(0,e),.25)}function O(r){const e=1-Math.pow(1-r,4);return e<=1e-4?0:Math.pow(1-r,3)/Math.pow(e,.75)}function _(r){const e=Math.max(0,Math.min(1,r));return e*e*e*(e*(e*6-15)+10)}function ye(r){const e=Math.max(0,Math.min(1,r));return 30*e*e*(e-1)*(e-1)}function be(r,e,t,s,i){const a=1-r;return a*a*a*e+3*a*a*r*t+3*a*r*r*s+r*r*r*i}function Se(r,e,t,s,i){const a=1-r;return 3*a*a*(t-e)+6*a*r*(s-t)+3*r*r*(i-s)}function J(r,e){const t=be(r,0,e[1],e[3],1),s=Se(r,0,e[1],e[3],1);return{height:t,derivative:s}}function K(r,e,t){if(t)return J(r,t);switch(e){case"circle":return{height:$(r),derivative:ve(r)};case"squircle":return{height:k(r),derivative:O(r)};case"concave":{const s=k(r),i=O(r);return{height:1-s,derivative:-i}}case"lip":{const s=k(r),i=O(r),a=1-s,n=-i,u=_(r),c=ye(r),h=s*(1-u)+a*u,d=i*(1-u)+n*u+(a-s)*c;return{height:h,derivative:d}}case"dome":{const s=Math.sqrt(Math.max(0,1-r*r)),i=r>.001?-r/s:0;return{height:s,derivative:i}}case"ridge":{const s=1-Math.sqrt(Math.max(0,1-r*r)),i=r>.001?r/Math.sqrt(Math.max(.001,1-r*r)):0;return{height:s,derivative:i}}case"wave":{const s=(1-Math.cos(r*Math.PI))/2,i=Math.PI*Math.sin(r*Math.PI)/2;return{height:s,derivative:i}}case"flat":return{height:0,derivative:0}}}function Z(r,e,t,s,i,a=!1,n=!1,u){const c=Math.ceil(r),h=Math.ceil(e),d=new Uint8Array(c*h*4);for(let p=0;p<h;p++)for(let g=0;g<c;g++){let f=0,o=0,b=1,R=255;const C=(c-1)/2,A=(h-1)/2,v=Math.abs(g-C),y=Math.abs(p-A),S=c/2-t,w=h/2-t;let E=0,j=0,ee=0,x=v,P=y;if(v<=S&&y<=w){const M=S+t,T=w+t;M-v<T-y?(x=S+t,P=y):(x=v,P=w+t),E=Math.min(M-v,T-y)}else if(v>S&&y<=w)x=S+t,P=y,E=t-(v-S);else if(y>w&&v<=S)x=v,P=w+t,E=t-(y-w);else{const M=v-S,T=y-w,D=Math.sqrt(M*M+T*T);E=t-D,D>0&&(x=S+M/D*t,P=w+T/D*t)}E<0&&(R=0);const U=x-v,I=P-y,N=Math.sqrt(U*U+I*I);if(N>.001&&(j=(g>C?1:-1)*(U/N),ee=(p>A?1:-1)*(I/N)),s>0&&E<s&&E>=0){let M=1-E/s;n&&(M=1-M);const{derivative:T}=K(M,i,u),D=n?-1:1;f=j*T*.5*D,o=ee*T*.5*D,a&&(f=-f,o=-o)}const G=Math.sqrt(f*f+o*o+b*b);f/=G,o/=G,b/=G;const L=(p*c+g)*4;d[L]=(f*.5+.5)*255|0,d[L+1]=(o*.5+.5)*255|0,d[L+2]=(b*.5+.5)*255|0,d[L+3]=R}return l.Texture.from({resource:d,width:c,height:h})}m.AdaptiveQualityController=W,m.CapabilityProbe=z,m.EventBus=V,m.GlassHUD=pe,m.GlassOverlay=ge,m.GlassPanel=H,m.GlassPresets=q,m.GlassSystem=Y,m.SceneRTManager=B,m.getBezierHeightAndDerivative=J,m.getHeightAndDerivative=K,m.heightCircle=$,m.heightSquircle=k,m.smootherstep=_,Object.defineProperty(m,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=pixi-adaptive-glass.umd.js.map
