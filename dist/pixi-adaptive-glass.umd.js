(function(b,c){typeof exports=="object"&&typeof module<"u"?c(exports,require("pixi.js")):typeof define=="function"&&define.amd?define(["exports","pixi.js"],c):(b=typeof globalThis<"u"?globalThis:b||self,c(b.PixiAdaptiveGlass={},b.PIXI))})(this,function(b,c){"use strict";class X{constructor(e){this.gl=e}run(){if(this.cached)return this.cached;const e=this.isWebGL2Context(this.gl),t=this.queryExtensions(["EXT_color_buffer_float","OES_texture_float_linear","OES_standard_derivatives","EXT_disjoint_timer_query_webgl2","EXT_disjoint_timer_query"]),s=e&&this.getMaxDrawBuffers()>1?"webgl2":"webgl1";return this.cached={tier:s,maxDrawBuffers:this.getMaxDrawBuffers(),extensions:t},this.cached}queryExtensions(e){return e.reduce((t,s)=>(t[s]=!!this.gl.getExtension(s),t),{})}getMaxDrawBuffers(){const e=this.gl.getExtension("WEBGL_draw_buffers"),t=this.isWebGL2Context(this.gl)?this.gl.MAX_DRAW_BUFFERS:e?e.MAX_DRAW_BUFFERS_WEBGL:0;return t?this.gl.getParameter(t)??1:1}isWebGL2Context(e){return typeof WebGL2RenderingContext<"u"&&e instanceof WebGL2RenderingContext}}const ae={renderScale:1,enableDispersion:!0,enableCaustics:!0,enableContactShadows:!0,maxBlurTaps:9,edgeSupersampling:1},re=[{check:o=>o.renderScale>.85,apply:o=>{o.renderScale=.85},action:"scale-rt-0-85",reason:"Frame budget exceeded"},{check:o=>o.renderScale>.7,apply:o=>{o.renderScale=.7},action:"scale-rt-0-7",reason:"Severe perf drop"},{check:o=>o.maxBlurTaps>5,apply:o=>{o.maxBlurTaps=5},action:"reduce-blur",reason:"Sustained frame drops"},{check:o=>o.enableDispersion,apply:o=>{o.enableDispersion=!1},action:"disable-dispersion",reason:"Dispersion too expensive"},{check:o=>o.enableCaustics||o.enableContactShadows,apply:o=>{o.enableCaustics=!1,o.enableContactShadows=!1},action:"disable-caustics",reason:"Optional overlays disabled"}];class Y{constructor(e=100){this.targetFrameMs=e,this.current={...ae},this.telemetry=[],this.overrides={}}getQuality(){return{...this.current}}record(e){this.telemetry.push(e),this.telemetry.length>120&&this.telemetry.shift()}setOverrides(e){this.overrides={...this.overrides,...e},this.current={...this.current,...this.overrides}}getTelemetry(){return[...this.telemetry]}evaluate(){if(this.telemetry.length<30)return;const e=this.telemetry.reduce((s,a)=>s+a.cpuMs,0)/this.telemetry.length,t=this.telemetry.reduce((s,a)=>s+(a.gpuMs??a.cpuMs),0)/this.telemetry.length;if(!(Math.max(e,t)<=this.targetFrameMs)){for(const s of re)if(s.check(this.current))return s.apply(this.current),{action:s.action,reason:s.reason}}}}class W{constructor(e,t){this.renderer=e,this.useDepth=t,this.scale=1,this.clearRect=new c.Rectangle}ensure(e,t,s){const a=this.renderer.resolution*s;return(!this.handles||this.handles.sceneColor.width!==e||this.handles.sceneColor.height!==t||this.handles.sceneColor.source.resolution!==a)&&(this.dispose(),this.handles={sceneColor:c.RenderTexture.create({width:e,height:t,resolution:a,scaleMode:"linear"}),sceneDepth:this.useDepth?c.RenderTexture.create({width:e,height:t,resolution:a,scaleMode:"nearest"}):void 0},this.scale=s),this.handles}clearTargets(){if(!this.handles)return;this.clearRect.width=this.handles.sceneColor.width,this.clearRect.height=this.handles.sceneColor.height;const e=this.renderer;e.renderTarget.bind(this.handles.sceneColor);const t=e.gl;t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),this.handles.sceneDepth&&(e.renderTarget.bind(this.handles.sceneDepth),t.clearColor(1,0,0,1),t.clearDepth(1),t.clear(t.DEPTH_BUFFER_BIT))}dispose(){var e,t,s;(e=this.handles)==null||e.sceneColor.destroy(!0),(s=(t=this.handles)==null?void 0:t.sceneDepth)==null||s.destroy(!0),this.handles=void 0}}class ${constructor(){this.listeners={}}on(e,t){let s=this.listeners[e];s||(s=new Set,this.listeners[e]=s),s.add(t)}off(e,t){var s;(s=this.listeners[e])==null||s.delete(t)}emit(e,t){const s=this.listeners[e];if(s)for(const a of s)a(t)}removeAll(){var e;for(const t of Object.keys(this.listeners))(e=this.listeners[t])==null||e.clear()}}const z=o=>o,_={water(){return z({ior:1.333,thickness:.6,roughness:.1,dispersion:.02,opacity:1,tint:10476031})},crownGlass(){return z({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},acrylic(){return z({ior:1.49,thickness:.7,roughness:.12,dispersion:.01,opacity:1,tint:16250871})},clear(){return z({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},fromIOR(o){const e=Math.min(Math.max(o,1),2);return z({ior:e,thickness:.75,roughness:.08,dispersion:(e-1)*.05,opacity:1,tint:16777215})}};let ie=0;const oe=new c.MeshGeometry({positions:new Float32Array([-.5,-.5,.5,-.5,.5,.5,-.5,.5]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])}),ne=`
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
`,le=`
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;class J extends c.Mesh{constructor(e){const t=c.State.for2d();t.culling=!1,super({geometry:e.geometry??oe,shader:c.Shader.from({gl:{vertex:ne,fragment:le}}),state:t}),this.tier="webgl1",this.id=e.id??`glass-panel-${++ie}`,this.glassMaterial=e.material,this.normalMap=e.normalMap,this.dudvMap=e.dudvMap,this.causticsAtlas=e.causticsAtlas,this.sdfShadow=e.sdfShadow,e.filters&&(this.filters=e.filters)}setMaterial(e){this.glassMaterial={...this.glassMaterial,...e}}setTextures(e){e.normalMap&&(this.normalMap=e.normalMap),e.dudvMap&&(this.dudvMap=e.dudvMap),e.causticsAtlas&&(this.causticsAtlas=e.causticsAtlas),e.sdfShadow&&(this.sdfShadow=e.sdfShadow)}setTier(e){this.tier=e}getTier(){return this.tier}}class ce{constructor(e,t){this.tracked=new Map,this.currentLightDir=[0,0,.15],this.targetLightDir=[0,0,.15],this.delayedLightDir=[0,0,.15],this.handleAnimationStart=a=>{const r=a.currentTarget;this.startPolling(r)},this.handleAnimationEnd=a=>{const r=a.currentTarget;r.getAnimations().length===0&&this.stopPolling(r)},this.renderer=e,this.background=t.background,this.system=new se(e,t.systemOptions),this.system.setOpaqueSceneCallback(a=>{e.render({container:this.background,target:a,clear:!0})});const s=this.system.getCompositeDisplay();s&&t.stage.addChild(s),t.lightFollowParams&&this.setLightFollowParams(t.lightFollowParams)}setLightFollowParams(e){this.lightFollowParams=e,e.followCursor&&!this.boundMouseMove?(this.boundMouseMove=t=>{const s=e.curve??1.5,a=e.zMin??.05,r=e.zMax??.2,n=e.edgeStretch??.5,l=this.renderer.canvas.getBoundingClientRect();let h=(t.clientX-l.left)/l.width*2-1,d=(t.clientY-l.top)/l.height*2-1;h=Math.sign(h)*Math.pow(Math.abs(h),n),d=Math.sign(d)*Math.pow(Math.abs(d),n);const f=Math.sqrt(h*h+d*d),p=Math.max(a,Math.min(r,r-Math.pow(f,s)*r*.5));this.targetLightDir=[h,d,p]},window.addEventListener("mousemove",this.boundMouseMove)):!e.followCursor&&this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0)}autoMount(e=".glass-panel"){this.resizeObserver=new ResizeObserver(s=>{for(const a of s){const r=a.target,n=this.tracked.get(r);if(!n)continue;const u=r.getBoundingClientRect(),l=n.lastRect;l&&(Math.abs(u.width-l.width)>1||Math.abs(u.height-l.height)>1)&&this.updatePanelGeometry(r,n),n.lastRect=u}}),this.intersectionObserver=new IntersectionObserver(s=>{for(const a of s){const r=a.target,n=this.tracked.get(r);if(!n)continue;n.visible=a.isIntersecting;const u=this.isCssVisible(r);n.panel.visible=n.visible&&u}}),document.querySelectorAll(e).forEach(s=>this.track(s)),this.observer=new MutationObserver(s=>{for(const a of s)if(a.type==="childList")a.addedNodes.forEach(r=>{r instanceof HTMLElement&&r.matches(e)&&this.track(r),r instanceof HTMLElement&&r.querySelectorAll(e).forEach(u=>this.track(u))}),a.removedNodes.forEach(r=>{r instanceof HTMLElement&&this.tracked.has(r)&&this.untrack(r)});else if(a.type==="attributes"){const r=a.target;if(a.attributeName==="class")r.matches(e)?this.track(r):this.untrack(r);else if(a.attributeName==="style"){const n=this.tracked.get(r);if(n){const u=this.isCssVisible(r);n.panel.visible=u&&n.visible;const l=r.getBoundingClientRect(),h=this.parseBorderRadius(r,l);Math.abs(h-n.lastRadius)>.5&&this.updatePanelGeometry(r,n)}}else if(a.attributeName==="hidden"){const n=this.tracked.get(r);if(n){const u=this.isCssVisible(r);n.panel.visible=u&&n.visible}}}this.cleanup()}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style","hidden"]})}track(e,t={}){var v,y;if(this.tracked.has(e))return this.tracked.get(e).panel;const s=e.dataset.glassIor?parseFloat(e.dataset.glassIor):void 0,a=e.dataset.glassRoughness?parseFloat(e.dataset.glassRoughness):void 0,r={..._.clear(),...t.material};s!==void 0&&(r.ior=s),a!==void 0&&(r.roughness=a);const n=e.getBoundingClientRect(),u=t.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle");let l;if(u)l=Math.min(n.width,n.height)/2;else{const M=this.parseBorderRadius(e,n);l=t.cornerRadius??M}const h=t.bevelSize??12,d=t.surfaceShape??"squircle",f=t.invertNormals??!1,p=t.invertCurve??!1,m=t.bezierCurve,g=Math.floor(Math.min(n.width,n.height)),i=u?g:n.width,D=u?g:n.height,T=t.normalMap||ee(i,D,l,h,d,f,p,m),E=this.system.createPanel({material:r,normalMap:T});return this.tracked.set(e,{panel:E,config:t,lastRect:n,lastRadius:l,visible:!0,isCircle:u,polling:!1}),(v=this.resizeObserver)==null||v.observe(e),(y=this.intersectionObserver)==null||y.observe(e),e.addEventListener("transitionrun",this.handleAnimationStart),e.addEventListener("transitionend",this.handleAnimationEnd),e.addEventListener("transitioncancel",this.handleAnimationEnd),e.addEventListener("animationstart",this.handleAnimationStart),e.addEventListener("animationend",this.handleAnimationEnd),e.addEventListener("animationcancel",this.handleAnimationEnd),this.syncElement(e,E),E}startPolling(e){const t=this.tracked.get(e);if(!t||t.polling)return;t.polling=!0;const s=()=>{t.polling&&(this.syncElement(e,t.panel),requestAnimationFrame(s))};requestAnimationFrame(s)}stopPolling(e){const t=this.tracked.get(e);t&&(t.polling=!1,this.updatePanelGeometry(e,t))}untrack(e){var s,a;const t=this.tracked.get(e);t&&(t.polling=!1,(s=this.resizeObserver)==null||s.unobserve(e),(a=this.intersectionObserver)==null||a.unobserve(e),e.removeEventListener("transitionrun",this.handleAnimationStart),e.removeEventListener("transitionend",this.handleAnimationEnd),e.removeEventListener("transitioncancel",this.handleAnimationEnd),e.removeEventListener("animationstart",this.handleAnimationStart),e.removeEventListener("animationend",this.handleAnimationEnd),e.removeEventListener("animationcancel",this.handleAnimationEnd),this.system.removePanel(t.panel),this.tracked.delete(e))}update(){var e;if((e=this.lightFollowParams)!=null&&e.followCursor){const s=1-(this.lightFollowParams.delay??.5)*.97;this.delayedLightDir[0]+=(this.targetLightDir[0]-this.delayedLightDir[0])*s,this.delayedLightDir[1]+=(this.targetLightDir[1]-this.delayedLightDir[1])*s,this.delayedLightDir[2]+=(this.targetLightDir[2]-this.delayedLightDir[2])*s;const r=1-(this.lightFollowParams.smoothing??.9)*.97;this.currentLightDir[0]+=(this.delayedLightDir[0]-this.currentLightDir[0])*r,this.currentLightDir[1]+=(this.delayedLightDir[1]-this.currentLightDir[1])*r,this.currentLightDir[2]+=(this.delayedLightDir[2]-this.currentLightDir[2])*r;for(const[,n]of this.tracked)n.panel.glassMaterial.lightDir=[...this.currentLightDir]}for(const[t,s]of this.tracked)this.syncElement(t,s.panel);this.system.render()}resize(){this.update()}setPositionTransform(e){this.positionTransform=e}cleanup(){for(const[e]of this.tracked)document.body.contains(e)||this.untrack(e)}destroy(){var e,t,s;this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0),(e=this.observer)==null||e.disconnect(),(t=this.resizeObserver)==null||t.disconnect(),(s=this.intersectionObserver)==null||s.disconnect(),this.system.destroy(),this.tracked.clear()}syncElement(e,t){const s=this.tracked.get(e),a=e.getBoundingClientRect(),r=a.left+a.width/2,n=a.top+a.height/2;let u=a.width,l=a.height;if(s!=null&&s.isCircle){const h=Math.floor(Math.min(a.width,a.height));u=h,l=h}if(this.positionTransform){const h=this.positionTransform(r,n,u,l);t.position.set(h.x,h.y),t.scale.set(u*h.scaleX,l*h.scaleY),t.rotation=h.rotation}else t.position.set(r,n),t.scale.set(u,l),t.rotation=0}parseBorderRadius(e,t){const s=window.getComputedStyle(e),a=s.borderTopLeftRadius,r=s.borderTopRightRadius,n=s.borderBottomRightRadius,u=s.borderBottomLeftRadius,l=(m,g)=>m.endsWith("%")?parseFloat(m)/100*g:parseFloat(m)||0,h=m=>m.split(" ")[0],d=(t.width+t.height)/2;return[l(h(a),d),l(h(r),d),l(h(n),d),l(h(u),d)].reduce((m,g)=>m+g,0)/4||20}isCssVisible(e){if(e.hidden)return!1;const t=window.getComputedStyle(e);return t.display!=="none"&&t.visibility!=="hidden"}updatePanelGeometry(e,t){const s=e.getBoundingClientRect(),a=t.config.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle");let r;if(a)r=Math.min(s.width,s.height)/2;else{const i=this.parseBorderRadius(e,s);r=t.config.cornerRadius??i}const n=t.config.bevelSize??12,u=t.config.surfaceShape??"squircle",l=t.config.invertNormals??!1,h=t.config.invertCurve??!1,d=t.config.bezierCurve,f=Math.floor(Math.min(s.width,s.height)),p=a?f:s.width,m=a?f:s.height,g=ee(p,m,r,n,u,l,h,d);t.panel.setTextures({normalMap:g}),t.lastRect=s,t.lastRadius=r}}function K(o){return Math.sqrt(Math.max(0,2*o-o*o))}function ue(o){const e=Math.sqrt(Math.max(1e-4,2*o-o*o));return(1-o)/e}function G(o){const e=1-Math.pow(1-o,4);return Math.pow(Math.max(0,e),.25)}function H(o){const e=1-Math.pow(1-o,4);return e<=1e-4?0:Math.pow(1-o,3)/Math.pow(e,.75)}function Z(o){const e=Math.max(0,Math.min(1,o));return e*e*e*(e*(e*6-15)+10)}function he(o){const e=Math.max(0,Math.min(1,o));return 30*e*e*(e-1)*(e-1)}function de(o,e,t,s,a){const r=1-o;return r*r*r*e+3*r*r*o*t+3*r*o*o*s+o*o*o*a}function fe(o,e,t,s,a){const r=1-o;return 3*r*r*(t-e)+6*r*o*(s-t)+3*o*o*(a-s)}function j(o,e){const t=de(o,0,e[1],e[3],1),s=fe(o,0,e[1],e[3],1);return{height:t,derivative:s}}function q(o,e,t){if(t)return j(o,t);switch(e){case"circle":{const s=1-o;return{height:K(s),derivative:-ue(s)}}case"squircle":{const s=1-o;return{height:G(s),derivative:-H(s)}}case"concave":{const s=1-o,a=G(s),r=H(s);return{height:1-a,derivative:r}}case"lip":{const s=G(o),a=H(o),r=1-s,n=-a,u=Z(o),l=he(o),h=s*(1-u)+r*u,d=a*(1-u)+n*u+(r-s)*l;return{height:h,derivative:d}}case"dome":{const s=Math.sqrt(Math.max(0,1-o*o)),a=o>.001?-o/s:0;return{height:s,derivative:a}}case"wave":{const s=(1-Math.cos(o*Math.PI))/2,a=Math.PI*Math.sin(o*Math.PI)/2;return{height:s,derivative:a}}case"flat":return{height:0,derivative:0};case"ramp":return{height:o,derivative:1}}}function ee(o,e,t,s,a,r=!1,n=!1,u){const l=Math.ceil(o),h=Math.ceil(e),d=new Uint8Array(l*h*4);for(let f=0;f<h;f++)for(let p=0;p<l;p++){let m=0,g=0,i=1,D=255;const T=(l-1)/2,E=(h-1)/2,v=Math.abs(p-T),y=Math.abs(f-E),M=l/2-t,S=h/2-t;let w=0,k=0,L=0,x=v,R=y;if(v<=M&&y<=S){const F=M+t,I=S+t;F-v<I-y?(x=M+t,R=y):(x=v,R=S+t),w=Math.min(F-v,I-y)}else if(v>M&&y<=S)x=M+t,R=y,w=t-(v-M);else if(y>S&&v<=M)x=v,R=S+t,w=t-(y-S);else{const F=v-M,I=y-S,N=Math.sqrt(F*F+I*I);w=t-N,N>0&&(x=M+F/N*t,R=S+I/N*t)}w<0&&(D=0);const B=x-v,P=R-y,C=Math.sqrt(B*B+P*P);if(C>.001&&(k=(p>T?1:-1)*(B/C),L=(f>E?1:-1)*(P/C)),s>0&&w<s&&w>=0){let F=1-w/s;n&&(F=1-F);const{derivative:I}=q(F,a,u),N=n?-1:1;m=k*I*.5*N,g=L*I*.5*N,r&&(m=-m,g=-g)}const A=Math.sqrt(m*m+g*g+i*i);m/=A,g/=A,i/=A;const U=(f*l+p)*4;d[U]=(m*.5+.5)*255|0,d[U+1]=(g*.5+.5)*255|0,d[U+2]=(i*.5+.5)*255|0,d[U+3]=D}return c.Texture.from({resource:d,width:l,height:h})}function ge(o,e=0,t=32){const s=e/2,a=1+t,r=new Float32Array(a*2),n=new Float32Array(a*2),u=o*2+e,l=o*2;r[0]=0,r[1]=0,n[0]=.5,n[1]=.5;for(let f=0;f<t;f++){const p=f/t*Math.PI*2-Math.PI/2,m=(f+1)*2;let g,i;p>=-Math.PI/2&&p<=Math.PI/2?(g=Math.cos(p)*o+s,i=Math.sin(p)*o):(g=Math.cos(p)*o-s,i=Math.sin(p)*o),r[m]=g/u,r[m+1]=i/l,n[m]=g/u+.5,n[m+1]=i/l+.5}const h=t,d=new Uint32Array(h*3);for(let f=0;f<t;f++){const p=f*3;d[p]=0,d[p+1]=f+1,d[p+2]=(f+1)%t+1}return new c.MeshGeometry({positions:r,uvs:n,indices:d})}function me(o,e,t,s=32){const a=o.getAttribute("aPosition"),r=o.getAttribute("aUV");if(!a||!r)return;const n=a.buffer.data,u=r.buffer.data,l=t/2,h=e*2+t,d=e*2;for(let f=0;f<s;f++){const p=f/s*Math.PI*2-Math.PI/2,m=(f+1)*2;let g,i;p>=-Math.PI/2&&p<=Math.PI/2?(g=Math.cos(p)*e+l,i=Math.sin(p)*e):(g=Math.cos(p)*e-l,i=Math.sin(p)*e),n[m]=g/h,n[m+1]=i/d,u[m]=g/h+.5,u[m+1]=i/d+.5}a.buffer.update(),r.buffer.update()}function pe(o,e,t,s,a,r=!1,n=!1){const u=Math.ceil(o),l=Math.ceil(e),h=new Uint8Array(u*l*4),d=l/2,f=t/2;for(let p=0;p<l;p++)for(let m=0;m<u;m++){let g=0,i=0,D=1,T=255;const E=(u-1)/2,v=(l-1)/2,y=m-E,M=p-v;let S=0,w=0,k=0;const L=Math.abs(y),x=Math.abs(M);if(L<=f)S=d-x,w=0,k=M>0?1:-1;else{const P=y>0?f:-f,C=y-P,A=M,U=Math.sqrt(C*C+A*A);S=d-U,U>.001&&(w=C/U,k=A/U)}if(S<0&&(T=0),s>0&&S<s&&S>=0){let P=1-S/s;n&&(P=1-P);const{derivative:C}=q(P,a),A=n?-1:1;g=w*C*.5*A,i=k*C*.5*A,r&&(g=-g,i=-i)}const R=Math.sqrt(g*g+i*i+D*D);g/=R,i/=R,D/=R;const B=(p*u+m)*4;h[B]=(g*.5+.5)*255|0,h[B+1]=(i*.5+.5)*255|0,h[B+2]=(D*.5+.5)*255|0,h[B+3]=T}return c.Texture.from({resource:h,width:u,height:l})}function Q(o){return[(o>>16&255)/255,(o>>8&255)/255,(o&255)/255]}function O(o){return{enabled:!1,rangeStart:0,rangeEnd:.3,strength:1,opacity:1,...o}}function ve(o){return{cutoff:.001,blur:0,invert:!1,smoothing:O({rangeEnd:.3,strength:1}),contrast:O({rangeEnd:.3,strength:.7}),alpha:O({rangeEnd:.2,strength:1}),tint:O({rangeEnd:.5,strength:.5}),darken:O({rangeEnd:.3,strength:.3}),desaturate:O({rangeEnd:.4,strength:.5}),...o}}class ye extends c.Filter{constructor(){const e=`
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
    `;super({glProgram:new c.GlProgram({vertex:`
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            void main(void){
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
          `,fragment:e}),resources:{uSceneColor:c.Texture.WHITE.source,uNormalMap:c.Texture.WHITE.source,uniforms:{uInvResolution:{value:[1,1],type:"vec2<f32>"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uDisplacementScale:{value:.01,type:"f32"},uTint:{value:[1,1,1],type:"vec3<f32>"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"}}}})}}class be{constructor(e){this.renderer=e,this.id="webgl1",this.filter=new ye,this.rtManager=new W(e,!1),this.blitSprite=new c.Sprite(c.Texture.WHITE)}setup(){}render(e){const{renderer:t,panels:s,quality:a,drawOpaqueScene:r}=e,n=this.rtManager.ensure(t.screen.width,t.screen.height,a.renderScale);r(n.sceneColor),this.blitSprite.texture=n.sceneColor,this.blitSprite.width=t.screen.width,this.blitSprite.height=t.screen.height,t.render({container:this.blitSprite,clear:!0});const u=[...s].sort((l,h)=>(l.zIndex??0)-(h.zIndex??0));for(const l of u)this.applyFilter(l,n.sceneColor,a),t.render({container:l})}dispose(){this.rtManager.dispose()}applyFilter(e,t,s){if(!(!!(e.normalMap||e.dudvMap)||e.glassMaterial.dispersion>.001||e.glassMaterial.roughness>.001)){e.filters=null;return}const r=this.filter.resources;r.uSceneColor=t.source,r.uNormalMap=(e.normalMap??e.dudvMap??c.Texture.WHITE).source;const n=r.uniforms;n.uInvResolution=[1/t.width,1/t.height],n.uDispersion=e.glassMaterial.dispersion,n.uRoughness=e.glassMaterial.roughness,n.uDisplacementScale=e.glassMaterial.thickness*.1,n.uTint=Q(e.glassMaterial.tint??16777215),n.uOpacity=e.glassMaterial.opacity,n.uEnableDispersion=s.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,e.filters=[this.filter]}}const V=`
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`,Se=`
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
`,Me=`
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
`,Te=`
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
`,te=`
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
`,De=`
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
`,Ee=`
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
`,we=`
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
`,Re=new c.MeshGeometry({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])});class xe{constructor(e,t){this.renderer=e,this.id="webgl2",this.jfaCache=new Map,this.rtManager=new W(e,t);const s=new c.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uInvResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uIOR:{value:1,type:"f32"},uThickness:{value:1,type:"f32"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"},uEnableCaustics:{value:0,type:"f32"},uTint:{value:new Float32Array([1,1,1]),type:"vec3<f32>"},uSpecular:{value:0,type:"f32"},uShininess:{value:32,type:"f32"},uShadow:{value:0,type:"f32"},uLightDir:{value:new Float32Array([.5,.5,1]),type:"vec3<f32>"},uBlurSamples:{value:8,type:"f32"},uBlurSpread:{value:4,type:"f32"},uBlurAngle:{value:0,type:"f32"},uBlurAnisotropy:{value:0,type:"f32"},uBlurGamma:{value:1,type:"f32"},uAberrationR:{value:1,type:"f32"},uAberrationB:{value:1,type:"f32"},uAO:{value:0,type:"f32"},uAORadius:{value:.5,type:"f32"},uNoiseScale:{value:20,type:"f32"},uNoiseIntensity:{value:0,type:"f32"},uNoiseRotation:{value:0,type:"f32"},uNoiseThreshold:{value:0,type:"f32"},uEdgeSupersampling:{value:1,type:"f32"},uGlassSupersampling:{value:1,type:"f32"},uEdgeIor:{value:new Float32Array([0,.15,1,1]),type:"vec4<f32>"},uPanelSize:{value:new Float32Array([200,200]),type:"vec2<f32>"},uEdgeMaskCutoff:{value:.001,type:"f32"},uEdgeMaskBlur:{value:0,type:"f32"},uEdgeMaskInvert:{value:0,type:"f32"},uEdgeSmoothing:{value:new Float32Array([0,.3,1,1]),type:"vec4<f32>"},uEdgeContrast:{value:new Float32Array([0,.3,.7,1]),type:"vec4<f32>"},uEdgeAlpha:{value:new Float32Array([0,.2,1,1]),type:"vec4<f32>"},uEdgeTint:{value:new Float32Array([0,.5,.5,1]),type:"vec4<f32>"},uEdgeDarken:{value:new Float32Array([0,.3,.3,1]),type:"vec4<f32>"},uEdgeDesaturate:{value:new Float32Array([0,.4,.5,1]),type:"vec4<f32>"},uEnableSmoothing:{value:0,type:"f32"},uEnableContrast:{value:0,type:"f32"},uEnableAlpha:{value:0,type:"f32"},uEnableTint:{value:0,type:"f32"},uEnableDarken:{value:0,type:"f32"},uEnableDesaturate:{value:0,type:"f32"},uDebugMode:{value:0,type:"f32"}});this.refractShader=c.Shader.from({gl:{vertex:te,fragment:De},resources:{uSceneColor:c.Texture.WHITE.source,uNormalMap:c.Texture.WHITE.source,uCausticsMap:c.Texture.WHITE.source,uDistanceField:c.Texture.WHITE.source,panelUniforms:s}});const a=new c.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uOpacity:{value:1,type:"f32"}});this.revealageShader=c.Shader.from({gl:{vertex:te,fragment:Ee},resources:{uNormalMap:c.Texture.WHITE.source,panelUniforms:a}}),this.compositeShader=c.Shader.from({gl:{vertex:V,fragment:we},resources:{uSceneColor:c.Texture.WHITE.source,uAccum:c.Texture.WHITE.source,uReveal:c.Texture.WHITE.source}}),this.fullScreenQuad=new c.Mesh({geometry:Re,shader:this.compositeShader}),this.fullScreenQuad.state=c.State.for2d(),this.fullScreenQuad.state.culling=!1,this.shadowSprite=new c.Sprite(c.Texture.WHITE),this.panelParent=new c.Container,this.panelParent.alpha=1,this.compositeSprite=new c.Sprite(c.Texture.EMPTY),this.compositeSprite.position.set(0,0),this.compositeSprite.visible=!0,this.compositeSprite.alpha=1,this.compositeSprite.zIndex=9999;const r=new c.UniformGroup({uTexelSize:{value:new Float32Array([1,1]),type:"vec2<f32>"}});this.jfaSeedShader=c.Shader.from({gl:{vertex:V,fragment:Se},resources:{uNormalMap:c.Texture.WHITE.source,jfaUniforms:r}});const n=new c.UniformGroup({uTexelSize:{value:new Float32Array([1,1]),type:"vec2<f32>"},uStepSize:{value:1,type:"f32"}});this.jfaFloodShader=c.Shader.from({gl:{vertex:V,fragment:Me},resources:{uPrevPass:c.Texture.WHITE.source,jfaUniforms:n}});const u=new c.UniformGroup({uMaxDistance:{value:.15,type:"f32"}});this.jfaDistanceShader=c.Shader.from({gl:{vertex:V,fragment:Te},resources:{uSeedMap:c.Texture.WHITE.source,jfaUniforms:u}})}setup(){}render(e){var h,d;const{renderer:t,panels:s,quality:a,drawOpaqueScene:r}=e,n=t.screen.width,u=t.screen.height,l=this.rtManager.ensure(n,u,a.renderScale);this.ensureAccumTargets(n,u),this.ensureCompositeTarget(n,u),r(l.sceneColor),this.clearTarget(this.accumRT,0,0,0,0),this.clearTarget(this.revealRT,1,1,1,1);for(const f of s)this.renderPanel(f,a,l.sceneColor);this.fullScreenQuad.shader=this.compositeShader,this.compositeShader.resources.uSceneColor=l.sceneColor.source,this.compositeShader.resources.uAccum=(h=this.accumRT)==null?void 0:h.source,this.compositeShader.resources.uReveal=(d=this.revealRT)==null?void 0:d.source,this.fullScreenQuad.width=t.screen.width,this.fullScreenQuad.height=t.screen.height,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),t.render({container:this.fullScreenQuad,target:this.compositeRT,clear:!0}),this.compositeRT&&(this.compositeSprite.texture=this.compositeRT,this.compositeSprite.width=n,this.compositeSprite.height=u,this.compositeSprite.visible=!0),this.renderContactShadows(s,a)}dispose(){var e,t,s,a,r;this.rtManager.dispose(),(e=this.accumRT)==null||e.destroy(!0),(t=this.revealRT)==null||t.destroy(!0),(s=this.compositeRT)==null||s.destroy(!0),(a=this.jfaPingRT)==null||a.destroy(!0),(r=this.jfaPongRT)==null||r.destroy(!0);for(const n of this.jfaCache.values())n.distanceField.destroy(!0);this.jfaCache.clear()}computeDistanceField(e){var y,M,S,w,k;const t=e.normalMap??c.Texture.WHITE,s=t.width,a=t.height,r=t.source.uid??0,n=t.source._updateID??t.source.updateId??0,u=this.jfaCache.get(e);(!this.jfaPingRT||this.jfaPingRT.width!==s||this.jfaPingRT.height!==a)&&((y=this.jfaPingRT)==null||y.destroy(!0),(M=this.jfaPongRT)==null||M.destroy(!0),this.jfaPingRT=c.RenderTexture.create({width:s,height:a,resolution:1}),this.jfaPongRT=c.RenderTexture.create({width:s,height:a,resolution:1}));let l=u==null?void 0:u.distanceField;(!l||l.width!==s||l.height!==a)&&(l==null||l.destroy(!0),l=c.RenderTexture.create({width:s,height:a,resolution:1}));const h=[1/s,1/a],d=this.jfaSeedShader.resources;d.uNormalMap=t.source;const f=(S=d.jfaUniforms)==null?void 0:S.uniforms;f&&(f.uTexelSize[0]=h[0],f.uTexelSize[1]=h[1]),this.fullScreenQuad.shader=this.jfaSeedShader,this.fullScreenQuad.width=1,this.fullScreenQuad.height=1,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),this.renderer.render({container:this.fullScreenQuad,target:this.jfaPingRT,clear:!0});const p=Math.max(s,a),m=Math.ceil(Math.log2(p));let g=this.jfaPingRT,i=this.jfaPongRT;const D=this.jfaFloodShader.resources,T=(w=D.jfaUniforms)==null?void 0:w.uniforms;for(let L=0;L<m;L++){const x=Math.pow(2,m-L-1);D.uPrevPass=g.source,T&&(T.uTexelSize[0]=h[0],T.uTexelSize[1]=h[1],T.uStepSize=x),this.fullScreenQuad.shader=this.jfaFloodShader,this.renderer.render({container:this.fullScreenQuad,target:i,clear:!0});const R=g;g=i,i=R}const E=this.jfaDistanceShader.resources;E.uSeedMap=g.source;const v=(k=E.jfaUniforms)==null?void 0:k.uniforms;return v&&(v.uMaxDistance=.05),this.fullScreenQuad.shader=this.jfaDistanceShader,this.renderer.render({container:this.fullScreenQuad,target:l,clear:!0}),console.log("JFA computed:",s,"x",a,"passes:",m),this.jfaCache.set(e,{distanceField:l,normalMapId:r,normalMapUpdateId:n,width:s,height:a}),l}ensureAccumTargets(e,t){var a,r;const s=this.renderer.resolution;(!this.accumRT||this.accumRT.width!==e||this.accumRT.height!==t||this.accumRT.source.resolution!==s)&&((a=this.accumRT)==null||a.destroy(!0),this.accumRT=c.RenderTexture.create({width:e,height:t,resolution:s})),(!this.revealRT||this.revealRT.width!==e||this.revealRT.height!==t||this.revealRT.source.resolution!==s)&&((r=this.revealRT)==null||r.destroy(!0),this.revealRT=c.RenderTexture.create({width:e,height:t,resolution:s}))}clearTarget(e,t,s,a,r){if(!e)return;const n=new c.Container;this.renderer.render({container:n,target:e,clear:!0,clearColor:[t,s,a,r]})}renderPanel(e,t,s){var f,p,m,g;if(!this.accumRT||!this.revealRT)return;const a=e.normalMap??c.Texture.WHITE,r=this.renderer.screen.width,n=this.renderer.screen.height,u=this.computeDistanceField(e),l=this.refractShader.resources;if(l){l.uSceneColor=s.source,l.uNormalMap=a.source,l.uCausticsMap=(e.causticsAtlas??c.Texture.WHITE).source,l.uDistanceField=u.source;const i=(f=l.panelUniforms)==null?void 0:f.uniforms;if(i){const D=((m=(p=this.accumRT)==null?void 0:p.source)==null?void 0:m._resolution)??this.renderer.resolution;i.uPosition[0]=e.position.x,i.uPosition[1]=e.position.y,i.uScale[0]=e.scale.x,i.uScale[1]=e.scale.y,i.uResolution[0]=r,i.uResolution[1]=n,i.uInvResolution[0]=1/(r*D),i.uInvResolution[1]=1/(n*D),i.uIOR=e.glassMaterial.ior,i.uThickness=e.glassMaterial.thickness,i.uDispersion=e.glassMaterial.dispersion,i.uRoughness=e.glassMaterial.roughness,i.uOpacity=e.glassMaterial.opacity??1,i.uEnableDispersion=t.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,i.uEnableCaustics=t.enableCaustics&&e.causticsAtlas?1:0;const T=Q(e.glassMaterial.tint??16777215);i.uTint[0]=T[0],i.uTint[1]=T[1],i.uTint[2]=T[2],i.uSpecular=e.glassMaterial.specular??0,i.uShininess=e.glassMaterial.shininess??32,i.uShadow=e.glassMaterial.shadow??0;const E=e.glassMaterial.lightDir??[.5,.5,1];i.uLightDir[0]=E[0],i.uLightDir[1]=E[1],i.uLightDir[2]=E[2],i.uBlurSamples=e.glassMaterial.blurSamples??8,i.uBlurSpread=e.glassMaterial.blurSpread??4,i.uBlurAngle=(e.glassMaterial.blurAngle??0)*Math.PI/180,i.uBlurAnisotropy=e.glassMaterial.blurAnisotropy??0,i.uBlurGamma=e.glassMaterial.blurGamma??1,i.uAberrationR=e.glassMaterial.aberrationR??1,i.uAberrationB=e.glassMaterial.aberrationB??1,i.uAO=e.glassMaterial.ao??0,i.uAORadius=e.glassMaterial.aoRadius??.5,i.uNoiseScale=e.glassMaterial.noiseScale??20,i.uNoiseIntensity=e.glassMaterial.noiseIntensity??0,i.uNoiseRotation=e.glassMaterial.noiseRotation??0,i.uNoiseThreshold=e.glassMaterial.noiseThreshold??0,i.uEdgeSupersampling=t.edgeSupersampling??1,i.uGlassSupersampling=e.glassMaterial.glassSupersampling??1,i.uEdgeIor[0]=e.glassMaterial.edgeIorRangeStart??0,i.uEdgeIor[1]=e.glassMaterial.edgeIorRangeEnd??.15,i.uEdgeIor[2]=e.glassMaterial.edgeIorStrength??1,i.uEdgeIor[3]=e.glassMaterial.edgeIorEnabled?1:0,i.uPanelSize[0]=e.scale.x,i.uPanelSize[1]=e.scale.y;const v=e.glassMaterial.edgeMask;if(v){i.uEdgeMaskCutoff=v.cutoff,i.uEdgeMaskBlur=v.blur,i.uEdgeMaskInvert=v.invert?1:0;const y=(M,S)=>{M[0]=S.rangeStart,M[1]=S.rangeEnd,M[2]=S.strength,M[3]=S.opacity};y(i.uEdgeSmoothing,v.smoothing),y(i.uEdgeContrast,v.contrast),y(i.uEdgeAlpha,v.alpha),y(i.uEdgeTint,v.tint),y(i.uEdgeDarken,v.darken),y(i.uEdgeDesaturate,v.desaturate),i.uEnableSmoothing=v.smoothing.enabled?1:0,i.uEnableContrast=v.contrast.enabled?1:0,i.uEnableAlpha=v.alpha.enabled?1:0,i.uEnableTint=v.tint.enabled?1:0,i.uEnableDarken=v.darken.enabled?1:0,i.uEnableDesaturate=v.desaturate.enabled?1:0,i.uDebugMode=v.debugMode??0}else i.uEdgeMaskCutoff=e.glassMaterial.edgeMaskCutoff??.001,i.uEdgeMaskBlur=e.glassMaterial.edgeBlur??0,i.uEdgeMaskInvert=0,i.uEnableSmoothing=0,i.uEnableContrast=0,i.uEnableAlpha=0,i.uEnableTint=0,i.uEnableDarken=0,i.uEnableDesaturate=0}}const h=e.shader;e.shader=this.refractShader,this.drawPanelToTarget(e,this.accumRT),e.shader=this.revealageShader;const d=this.revealageShader.resources;if(d){d.uNormalMap=a.source;const i=(g=d.panelUniforms)==null?void 0:g.uniforms;i&&(i.uPosition[0]=e.position.x,i.uPosition[1]=e.position.y,i.uScale[0]=e.scale.x,i.uScale[1]=e.scale.y,i.uResolution[0]=r,i.uResolution[1]=n,i.uOpacity=e.glassMaterial.opacity)}this.drawPanelToTarget(e,this.revealRT),e.shader=h}renderContactShadows(e,t){if(t.enableContactShadows)for(const s of e)s.sdfShadow&&(this.shadowSprite.texture=s.sdfShadow,this.shadowSprite.position.copyFrom(s.position),this.shadowSprite.scale.copyFrom(s.scale),this.shadowSprite.rotation=s.rotation,this.shadowSprite.alpha=Math.min(s.glassMaterial.opacity+.2,.9),this.renderer.render(this.shadowSprite))}getCompositeDisplay(){return this.compositeSprite}drawPanelToTarget(e,t){const s=this.renderer,a=s.gl;this.panelParent.removeChildren(),this.panelParent.addChild(e),e.updateLocalTransform(),e.worldTransform.copyFrom(e.localTransform),a&&(a.enable(a.BLEND),a.blendFunc(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA)),s.render({container:this.panelParent,target:t,clear:!1}),a&&a.blendFunc(a.ONE,a.ONE_MINUS_SRC_ALPHA)}ensureCompositeTarget(e,t){var a;const s=this.renderer.resolution;(!this.compositeRT||this.compositeRT.width!==e||this.compositeRT.height!==t||this.compositeRT.source.resolution!==s)&&((a=this.compositeRT)==null||a.destroy(!0),this.compositeRT=c.RenderTexture.create({width:e,height:t,resolution:s}),this.compositeSprite.texture=this.compositeRT)}}class se{constructor(e,t={}){this.renderer=e,this.panels=[],this.quality=new Y,this.drawOpaqueScene=()=>{},this.events=new $;const s=e.gl,a=new X(s).run();this.pipeline=a.tier==="webgl2"?new xe(e,!0):new be(e),a.tier==="webgl1"&&this.emitFallback("webgl","MRT unavailable, using compatibility pipeline")}setOpaqueSceneCallback(e){this.drawOpaqueScene=e}createPanel(e){const t=new J(e);return this.panels.push(t),t}removePanel(e){const t=this.panels.indexOf(e);t>=0&&(this.panels.splice(t,1),e.destroy({children:!0,texture:!1,textureSource:!1}))}render(){const e=performance.now(),t=this.quality.getQuality();this.pipeline.render({renderer:this.renderer,panels:this.panels,quality:t,drawOpaqueScene:this.drawOpaqueScene});const s=performance.now()-e;this.quality.record({cpuMs:s,timestamp:e});const a=this.quality.evaluate();a&&this.events.emit("quality:decision",a)}setQuality(e){this.quality.setOverrides(e)}destroy(){for(const e of this.panels)e.destroy({children:!0,texture:!1,textureSource:!1});this.panels.length=0,this.pipeline.dispose(),this.events.removeAll()}on(e,t){this.events.on(e,t)}off(e,t){this.events.off(e,t)}getPipelineId(){return this.pipeline.id}getCompositeDisplay(){if(typeof this.pipeline.getCompositeDisplay=="function")return this.pipeline.getCompositeDisplay()}emitFallback(e,t){const s={target:e,message:t,timestamp:performance.now()};console.warn(`GlassSystem fallback: ${e} - ${t}`),this.events.emit("fallback",s)}}class Ce{constructor(e){this.renderer=e,this.container=new c.Container,this.visible=!1,this.panel=new c.Graphics().beginFill(0,.65).drawRoundedRect(0,0,260,120,8).endFill(),this.text=new c.Text("Glass HUD",{fontSize:12,fill:16777215}),this.text.position.set(12,10),this.container.addChild(this.panel,this.text),this.container.visible=this.visible,this.container.position.set(12,12)}setVisible(e){this.visible=e,this.container.visible=e}update(e){if(!this.visible)return;const{quality:t,fps:s,lastDecision:a}=e,r=[`FPS: ${s.toFixed(1)}`,`Scale: ${(t.renderScale*100).toFixed(0)}%`,`Blur taps: ${t.maxBlurTaps}`,`Dispersion: ${t.enableDispersion?"on":"off"}`,`Caustics: ${t.enableCaustics?"on":"off"}`];a&&r.push(`Action: ${a.action}`),this.text.text=r.join(`
`)}}b.AdaptiveQualityController=Y,b.CapabilityProbe=X,b.EventBus=$,b.GlassHUD=Ce,b.GlassOverlay=ce,b.GlassPanel=J,b.GlassPresets=_,b.GlassSystem=se,b.SceneRTManager=W,b.createDefaultEdgeMask=ve,b.createDefaultEdgeTactic=O,b.createPillGeometry=ge,b.createPillNormalMap=pe,b.getBezierHeightAndDerivative=j,b.getHeightAndDerivative=q,b.heightCircle=K,b.heightSquircle=G,b.hexToVec3=Q,b.smootherstep=Z,b.updatePillGeometry=me,Object.defineProperty(b,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=pixi-adaptive-glass.umd.js.map
