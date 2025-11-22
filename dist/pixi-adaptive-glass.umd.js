(function(v,h){typeof exports=="object"&&typeof module<"u"?h(exports,require("pixi.js")):typeof define=="function"&&define.amd?define(["exports","pixi.js"],h):(v=typeof globalThis<"u"?globalThis:v||self,h(v.PixiAdaptiveGlass={},v.PIXI))})(this,function(v,h){"use strict";class X{constructor(e){this.gl=e}run(){if(this.cached)return this.cached;const e=this.isWebGL2Context(this.gl),t=this.queryExtensions(["EXT_color_buffer_float","OES_texture_float_linear","OES_standard_derivatives","EXT_disjoint_timer_query_webgl2","EXT_disjoint_timer_query"]),s=e&&this.getMaxDrawBuffers()>1?"webgl2":"webgl1";return this.cached={tier:s,maxDrawBuffers:this.getMaxDrawBuffers(),extensions:t},this.cached}queryExtensions(e){return e.reduce((t,s)=>(t[s]=!!this.gl.getExtension(s),t),{})}getMaxDrawBuffers(){const e=this.gl.getExtension("WEBGL_draw_buffers"),t=this.isWebGL2Context(this.gl)?this.gl.MAX_DRAW_BUFFERS:e?e.MAX_DRAW_BUFFERS_WEBGL:0;return t?this.gl.getParameter(t)??1:1}isWebGL2Context(e){return typeof WebGL2RenderingContext<"u"&&e instanceof WebGL2RenderingContext}}const se={renderScale:1,enableDispersion:!0,enableCaustics:!0,enableContactShadows:!0,maxBlurTaps:9,edgeSupersampling:1},ae=[{check:i=>i.renderScale>.85,apply:i=>{i.renderScale=.85},action:"scale-rt-0-85",reason:"Frame budget exceeded"},{check:i=>i.renderScale>.7,apply:i=>{i.renderScale=.7},action:"scale-rt-0-7",reason:"Severe perf drop"},{check:i=>i.maxBlurTaps>5,apply:i=>{i.maxBlurTaps=5},action:"reduce-blur",reason:"Sustained frame drops"},{check:i=>i.enableDispersion,apply:i=>{i.enableDispersion=!1},action:"disable-dispersion",reason:"Dispersion too expensive"},{check:i=>i.enableCaustics||i.enableContactShadows,apply:i=>{i.enableCaustics=!1,i.enableContactShadows=!1},action:"disable-caustics",reason:"Optional overlays disabled"}];class Q{constructor(e=100){this.targetFrameMs=e,this.current={...se},this.telemetry=[],this.overrides={}}getQuality(){return{...this.current}}record(e){this.telemetry.push(e),this.telemetry.length>120&&this.telemetry.shift()}setOverrides(e){this.overrides={...this.overrides,...e},this.current={...this.current,...this.overrides}}getTelemetry(){return[...this.telemetry]}evaluate(){if(this.telemetry.length<30)return;const e=this.telemetry.reduce((s,a)=>s+a.cpuMs,0)/this.telemetry.length,t=this.telemetry.reduce((s,a)=>s+(a.gpuMs??a.cpuMs),0)/this.telemetry.length;if(!(Math.max(e,t)<=this.targetFrameMs)){for(const s of ae)if(s.check(this.current))return s.apply(this.current),{action:s.action,reason:s.reason}}}}class z{constructor(e,t){this.renderer=e,this.useDepth=t,this.scale=1,this.clearRect=new h.Rectangle}ensure(e,t,s){const a=this.renderer.resolution*s;return(!this.handles||this.handles.sceneColor.width!==e||this.handles.sceneColor.height!==t||this.handles.sceneColor.source.resolution!==a)&&(this.dispose(),this.handles={sceneColor:h.RenderTexture.create({width:e,height:t,resolution:a,scaleMode:"linear"}),sceneDepth:this.useDepth?h.RenderTexture.create({width:e,height:t,resolution:a,scaleMode:"nearest"}):void 0},this.scale=s),this.handles}clearTargets(){if(!this.handles)return;this.clearRect.width=this.handles.sceneColor.width,this.clearRect.height=this.handles.sceneColor.height;const e=this.renderer;e.renderTarget.bind(this.handles.sceneColor);const t=e.gl;t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),this.handles.sceneDepth&&(e.renderTarget.bind(this.handles.sceneDepth),t.clearColor(1,0,0,1),t.clearDepth(1),t.clear(t.DEPTH_BUFFER_BIT))}dispose(){var e,t,s;(e=this.handles)==null||e.sceneColor.destroy(!0),(s=(t=this.handles)==null?void 0:t.sceneDepth)==null||s.destroy(!0),this.handles=void 0}}class Y{constructor(){this.listeners={}}on(e,t){let s=this.listeners[e];s||(s=new Set,this.listeners[e]=s),s.add(t)}off(e,t){var s;(s=this.listeners[e])==null||s.delete(t)}emit(e,t){const s=this.listeners[e];if(s)for(const a of s)a(t)}removeAll(){var e;for(const t of Object.keys(this.listeners))(e=this.listeners[t])==null||e.clear()}}const N=i=>i,_={water(){return N({ior:1.333,thickness:.6,roughness:.1,dispersion:.02,opacity:1,tint:10476031})},crownGlass(){return N({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},acrylic(){return N({ior:1.49,thickness:.7,roughness:.12,dispersion:.01,opacity:1,tint:16250871})},clear(){return N({ior:1.52,thickness:.8,roughness:.05,dispersion:.04,opacity:1,tint:16777215})},fromIOR(i){const e=Math.min(Math.max(i,1),2);return N({ior:e,thickness:.75,roughness:.08,dispersion:(e-1)*.05,opacity:1,tint:16777215})}};let ie=0;const re=new h.MeshGeometry({positions:new Float32Array([-.5,-.5,.5,-.5,.5,.5,-.5,.5]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])}),oe=`
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
`,ne=`
precision mediump float;
varying vec2 vUv;
void main(void){
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;class $ extends h.Mesh{constructor(e){const t=h.State.for2d();t.culling=!1,super({geometry:e.geometry??re,shader:h.Shader.from({gl:{vertex:oe,fragment:ne}}),state:t}),this.tier="webgl1",this.id=e.id??`glass-panel-${++ie}`,this.glassMaterial=e.material,this.normalMap=e.normalMap,this.dudvMap=e.dudvMap,this.causticsAtlas=e.causticsAtlas,this.sdfShadow=e.sdfShadow,e.filters&&(this.filters=e.filters)}setMaterial(e){this.glassMaterial={...this.glassMaterial,...e}}setTextures(e){e.normalMap&&(this.normalMap=e.normalMap),e.dudvMap&&(this.dudvMap=e.dudvMap),e.causticsAtlas&&(this.causticsAtlas=e.causticsAtlas),e.sdfShadow&&(this.sdfShadow=e.sdfShadow)}setTier(e){this.tier=e}getTier(){return this.tier}}class le{constructor(e,t){this.tracked=new Map,this.currentLightDir=[0,0,.15],this.targetLightDir=[0,0,.15],this.delayedLightDir=[0,0,.15],this.handleAnimationStart=a=>{const o=a.currentTarget;this.startPolling(o)},this.handleAnimationEnd=a=>{const o=a.currentTarget;o.getAnimations().length===0&&this.stopPolling(o)},this.renderer=e,this.background=t.background,this.system=new te(e,t.systemOptions),this.system.setOpaqueSceneCallback(a=>{e.render({container:this.background,target:a,clear:!0})});const s=this.system.getCompositeDisplay();s&&t.stage.addChild(s),t.lightFollowParams&&this.setLightFollowParams(t.lightFollowParams)}setLightFollowParams(e){this.lightFollowParams=e,e.followCursor&&!this.boundMouseMove?(this.boundMouseMove=t=>{const s=e.curve??1.5,a=e.zMin??.05,o=e.zMax??.2,n=e.edgeStretch??.5,l=this.renderer.canvas.getBoundingClientRect();let u=(t.clientX-l.left)/l.width*2-1,d=(t.clientY-l.top)/l.height*2-1;u=Math.sign(u)*Math.pow(Math.abs(u),n),d=Math.sign(d)*Math.pow(Math.abs(d),n);const f=Math.sqrt(u*u+d*d),g=Math.max(a,Math.min(o,o-Math.pow(f,s)*o*.5));this.targetLightDir=[u,d,g]},window.addEventListener("mousemove",this.boundMouseMove)):!e.followCursor&&this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0)}autoMount(e=".glass-panel"){this.resizeObserver=new ResizeObserver(s=>{for(const a of s){const o=a.target,n=this.tracked.get(o);if(!n)continue;const c=o.getBoundingClientRect(),l=n.lastRect;l&&(Math.abs(c.width-l.width)>1||Math.abs(c.height-l.height)>1)&&this.updatePanelGeometry(o,n),n.lastRect=c}}),this.intersectionObserver=new IntersectionObserver(s=>{for(const a of s){const o=a.target,n=this.tracked.get(o);if(!n)continue;n.visible=a.isIntersecting;const c=this.isCssVisible(o);n.panel.visible=n.visible&&c}}),document.querySelectorAll(e).forEach(s=>this.track(s)),this.observer=new MutationObserver(s=>{for(const a of s)if(a.type==="childList")a.addedNodes.forEach(o=>{o instanceof HTMLElement&&o.matches(e)&&this.track(o),o instanceof HTMLElement&&o.querySelectorAll(e).forEach(c=>this.track(c))}),a.removedNodes.forEach(o=>{o instanceof HTMLElement&&this.tracked.has(o)&&this.untrack(o)});else if(a.type==="attributes"){const o=a.target;if(a.attributeName==="class")o.matches(e)?this.track(o):this.untrack(o);else if(a.attributeName==="style"){const n=this.tracked.get(o);if(n){const c=this.isCssVisible(o);n.panel.visible=c&&n.visible;const l=o.getBoundingClientRect(),u=this.parseBorderRadius(o,l);Math.abs(u-n.lastRadius)>.5&&this.updatePanelGeometry(o,n)}}else if(a.attributeName==="hidden"){const n=this.tracked.get(o);if(n){const c=this.isCssVisible(o);n.panel.visible=c&&n.visible}}}this.cleanup()}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style","hidden"]})}track(e,t={}){var b,M;if(this.tracked.has(e))return this.tracked.get(e).panel;const s=e.dataset.glassIor?parseFloat(e.dataset.glassIor):void 0,a=e.dataset.glassRoughness?parseFloat(e.dataset.glassRoughness):void 0,o={..._.clear(),...t.material};s!==void 0&&(o.ior=s),a!==void 0&&(o.roughness=a);const n=e.getBoundingClientRect(),c=t.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle");let l;if(c)l=Math.min(n.width,n.height)/2;else{const S=this.parseBorderRadius(e,n);l=t.cornerRadius??S}const u=t.bevelSize??12,d=t.surfaceShape??"squircle",f=t.flipX??!1,g=t.flipY??!1,m=t.bezierCurve,r=Math.floor(Math.min(n.width,n.height)),p=c?r:n.width,w=c?r:n.height,D=t.normalMap||j(p,w,l,u,d,f,g,m),y=this.system.createPanel({material:o,normalMap:D});return this.tracked.set(e,{panel:y,config:t,lastRect:n,lastRadius:l,visible:!0,isCircle:c,polling:!1}),(b=this.resizeObserver)==null||b.observe(e),(M=this.intersectionObserver)==null||M.observe(e),e.addEventListener("transitionrun",this.handleAnimationStart),e.addEventListener("transitionend",this.handleAnimationEnd),e.addEventListener("transitioncancel",this.handleAnimationEnd),e.addEventListener("animationstart",this.handleAnimationStart),e.addEventListener("animationend",this.handleAnimationEnd),e.addEventListener("animationcancel",this.handleAnimationEnd),this.syncElement(e,y),y}startPolling(e){const t=this.tracked.get(e);if(!t||t.polling)return;t.polling=!0;const s=()=>{t.polling&&(this.syncElement(e,t.panel),requestAnimationFrame(s))};requestAnimationFrame(s)}stopPolling(e){const t=this.tracked.get(e);t&&(t.polling=!1,this.updatePanelGeometry(e,t))}untrack(e){var s,a;const t=this.tracked.get(e);t&&(t.polling=!1,(s=this.resizeObserver)==null||s.unobserve(e),(a=this.intersectionObserver)==null||a.unobserve(e),e.removeEventListener("transitionrun",this.handleAnimationStart),e.removeEventListener("transitionend",this.handleAnimationEnd),e.removeEventListener("transitioncancel",this.handleAnimationEnd),e.removeEventListener("animationstart",this.handleAnimationStart),e.removeEventListener("animationend",this.handleAnimationEnd),e.removeEventListener("animationcancel",this.handleAnimationEnd),this.system.removePanel(t.panel),this.tracked.delete(e))}update(){var e;if((e=this.lightFollowParams)!=null&&e.followCursor){const s=1-(this.lightFollowParams.delay??.5)*.97;this.delayedLightDir[0]+=(this.targetLightDir[0]-this.delayedLightDir[0])*s,this.delayedLightDir[1]+=(this.targetLightDir[1]-this.delayedLightDir[1])*s,this.delayedLightDir[2]+=(this.targetLightDir[2]-this.delayedLightDir[2])*s;const o=1-(this.lightFollowParams.smoothing??.9)*.97;this.currentLightDir[0]+=(this.delayedLightDir[0]-this.currentLightDir[0])*o,this.currentLightDir[1]+=(this.delayedLightDir[1]-this.currentLightDir[1])*o,this.currentLightDir[2]+=(this.delayedLightDir[2]-this.currentLightDir[2])*o;for(const[,n]of this.tracked)n.panel.glassMaterial.lightDir=[...this.currentLightDir]}for(const[t,s]of this.tracked)this.syncElement(t,s.panel);this.system.render()}resize(){this.update()}setPositionTransform(e){this.positionTransform=e}cleanup(){for(const[e]of this.tracked)document.body.contains(e)||this.untrack(e)}destroy(){var e,t,s;this.boundMouseMove&&(window.removeEventListener("mousemove",this.boundMouseMove),this.boundMouseMove=void 0),(e=this.observer)==null||e.disconnect(),(t=this.resizeObserver)==null||t.disconnect(),(s=this.intersectionObserver)==null||s.disconnect(),this.system.destroy(),this.tracked.clear()}syncElement(e,t){const s=this.tracked.get(e),a=e.getBoundingClientRect(),o=a.left+a.width/2,n=a.top+a.height/2;let c=a.width,l=a.height;if(s!=null&&s.isCircle){const u=Math.floor(Math.min(a.width,a.height));c=u,l=u}if(this.positionTransform){const u=this.positionTransform(o,n,c,l);t.position.set(u.x,u.y),t.scale.set(c*u.scaleX,l*u.scaleY),t.rotation=u.rotation}else t.position.set(o,n),t.scale.set(c,l),t.rotation=0}parseBorderRadius(e,t){const s=window.getComputedStyle(e),a=s.borderTopLeftRadius,o=s.borderTopRightRadius,n=s.borderBottomRightRadius,c=s.borderBottomLeftRadius,l=(m,r)=>m.endsWith("%")?parseFloat(m)/100*r:parseFloat(m)||0,u=m=>m.split(" ")[0],d=(t.width+t.height)/2;return[l(u(a),d),l(u(o),d),l(u(n),d),l(u(c),d)].reduce((m,r)=>m+r,0)/4||20}isCssVisible(e){if(e.hidden)return!1;const t=window.getComputedStyle(e);return t.display!=="none"&&t.visibility!=="hidden"}updatePanelGeometry(e,t){const s=e.getBoundingClientRect(),a=t.config.isCircle||e.classList.contains("glass-circle")||e.hasAttribute("data-glass-circle");let o;if(a)o=Math.min(s.width,s.height)/2;else{const p=this.parseBorderRadius(e,s);o=t.config.cornerRadius??p}const n=t.config.bevelSize??12,c=t.config.surfaceShape??"squircle",l=t.config.flipX??!1,u=t.config.flipY??!1,d=t.config.bezierCurve,f=Math.floor(Math.min(s.width,s.height)),g=a?f:s.width,m=a?f:s.height,r=j(g,m,o,n,c,l,u,d);t.panel.setTextures({normalMap:r}),t.lastRect=s,t.lastRadius=o}}function J(i){return Math.sqrt(Math.max(0,2*i-i*i))}function ce(i){const e=Math.sqrt(Math.max(1e-4,2*i-i*i));return(1-i)/e}function G(i){const e=1-Math.pow(1-i,4);return Math.pow(Math.max(0,e),.25)}function q(i){const e=1-Math.pow(1-i,4);return e<=1e-4?0:Math.pow(1-i,3)/Math.pow(e,.75)}function K(i){const e=Math.max(0,Math.min(1,i));return e*e*e*(e*(e*6-15)+10)}function ue(i){const e=Math.max(0,Math.min(1,i));return 30*e*e*(e-1)*(e-1)}function he(i,e,t,s,a){const o=1-i;return o*o*o*e+3*o*o*i*t+3*o*i*i*s+i*i*i*a}function de(i,e,t,s,a){const o=1-i;return 3*o*o*(t-e)+6*o*i*(s-t)+3*i*i*(a-s)}function Z(i,e){const t=he(i,0,e[1],e[3],1),s=de(i,0,e[1],e[3],1);return{height:t,derivative:s}}function W(i,e,t){if(t)return Z(i,t);switch(e){case"circle":return{height:J(i),derivative:ce(i)};case"squircle":return{height:G(i),derivative:q(i)};case"concave":{const s=G(i),a=q(i);return{height:1-s,derivative:-a}}case"lip":{const s=G(i),a=q(i),o=1-s,n=-a,c=K(i),l=ue(i),u=s*(1-c)+o*c,d=a*(1-c)+n*c+(o-s)*l;return{height:u,derivative:d}}case"dome":{const s=Math.sqrt(Math.max(0,1-i*i)),a=i>.001?-i/s:0;return{height:s,derivative:a}}case"ridge":{const s=1-Math.sqrt(Math.max(0,1-i*i)),a=i>.001?i/Math.sqrt(Math.max(.001,1-i*i)):0;return{height:s,derivative:a}}case"wave":{const s=(1-Math.cos(i*Math.PI))/2,a=Math.PI*Math.sin(i*Math.PI)/2;return{height:s,derivative:a}}case"flat":return{height:0,derivative:0}}}function j(i,e,t,s,a,o=!1,n=!1,c){const l=Math.ceil(i),u=Math.ceil(e),d=new Uint8Array(l*u*4);for(let f=0;f<u;f++)for(let g=0;g<l;g++){let m=0,r=0,p=1,w=255;const D=(l-1)/2,y=(u-1)/2,b=Math.abs(g-D),M=Math.abs(f-y),S=l/2-t,E=u/2-t;let T=0,O=0,V=0,U=b,R=M;if(b<=S&&M<=E){const k=S+t,P=E+t;k-b<P-M?(U=S+t,R=M):(U=b,R=E+t),T=Math.min(k-b,P-M)}else if(b>S&&M<=E)U=S+t,R=M,T=t-(b-S);else if(M>E&&b<=S)U=b,R=E+t,T=t-(M-E);else{const k=b-S,P=M-E,I=Math.sqrt(k*k+P*P);T=t-I,I>0&&(U=S+k/I*t,R=E+P/I*t)}T<0&&(w=0);const L=U-b,x=R-M,C=Math.sqrt(L*L+x*x);if(C>.001&&(O=(g>D?1:-1)*(L/C),V=(f>y?1:-1)*(x/C)),s>0&&T<s&&T>=0){let k=1-T/s;n&&(k=1-k);const{derivative:P}=W(k,a,c),I=n?-1:1;m=O*P*.5*I,r=V*P*.5*I,o&&(m=-m,r=-r)}const A=Math.sqrt(m*m+r*r+p*p);m/=A,r/=A,p/=A;const F=(f*l+g)*4;d[F]=(m*.5+.5)*255|0,d[F+1]=(r*.5+.5)*255|0,d[F+2]=(p*.5+.5)*255|0,d[F+3]=w}return h.Texture.from({resource:d,width:l,height:u})}function fe(i,e=0,t=32){const s=e/2,a=1+t,o=new Float32Array(a*2),n=new Float32Array(a*2),c=i*2+e,l=i*2;o[0]=0,o[1]=0,n[0]=.5,n[1]=.5;for(let f=0;f<t;f++){const g=f/t*Math.PI*2-Math.PI/2,m=(f+1)*2;let r,p;g>=-Math.PI/2&&g<=Math.PI/2?(r=Math.cos(g)*i+s,p=Math.sin(g)*i):(r=Math.cos(g)*i-s,p=Math.sin(g)*i),o[m]=r/c,o[m+1]=p/l,n[m]=r/c+.5,n[m+1]=p/l+.5}const u=t,d=new Uint32Array(u*3);for(let f=0;f<t;f++){const g=f*3;d[g]=0,d[g+1]=f+1,d[g+2]=(f+1)%t+1}return new h.MeshGeometry({positions:o,uvs:n,indices:d})}function ge(i,e,t,s=32){const a=i.getAttribute("aPosition"),o=i.getAttribute("aUV");if(!a||!o)return;const n=a.buffer.data,c=o.buffer.data,l=t/2,u=e*2+t,d=e*2;for(let f=0;f<s;f++){const g=f/s*Math.PI*2-Math.PI/2,m=(f+1)*2;let r,p;g>=-Math.PI/2&&g<=Math.PI/2?(r=Math.cos(g)*e+l,p=Math.sin(g)*e):(r=Math.cos(g)*e-l,p=Math.sin(g)*e),n[m]=r/u,n[m+1]=p/d,c[m]=r/u+.5,c[m+1]=p/d+.5}a.buffer.update(),o.buffer.update()}function me(i,e,t,s,a,o=!1,n=!1){const c=Math.ceil(i),l=Math.ceil(e),u=new Uint8Array(c*l*4),d=l/2,f=t/2;for(let g=0;g<l;g++)for(let m=0;m<c;m++){let r=0,p=0,w=1,D=255;const y=(c-1)/2,b=(l-1)/2,M=m-y,S=g-b;let E=0,T=0,O=0;const V=Math.abs(M),U=Math.abs(S);if(V<=f)E=d-U,T=0,O=S>0?1:-1;else{const x=M>0?f:-f,C=M-x,A=S,F=Math.sqrt(C*C+A*A);E=d-F,F>.001&&(T=C/F,O=A/F)}if(E<0&&(D=0),s>0&&E<s&&E>=0){let x=1-E/s;n&&(x=1-x);const{derivative:C}=W(x,a),A=n?-1:1;r=T*C*.5*A,p=O*C*.5*A,o&&(r=-r,p=-p)}const R=Math.sqrt(r*r+p*p+w*w);r/=R,p/=R,w/=R;const L=(g*c+m)*4;u[L]=(r*.5+.5)*255|0,u[L+1]=(p*.5+.5)*255|0,u[L+2]=(w*.5+.5)*255|0,u[L+3]=D}return h.Texture.from({resource:u,width:c,height:l})}function H(i){return[(i>>16&255)/255,(i>>8&255)/255,(i&255)/255]}function B(i){return{enabled:!1,rangeStart:0,rangeEnd:.3,strength:1,opacity:1,...i}}function pe(i){return{cutoff:.001,blur:0,invert:!1,smoothing:B({rangeEnd:.3,strength:1}),contrast:B({rangeEnd:.3,strength:.7}),alpha:B({rangeEnd:.2,strength:1}),tint:B({rangeEnd:.5,strength:.5}),darken:B({rangeEnd:.3,strength:.3}),desaturate:B({rangeEnd:.4,strength:.5}),...i}}class ve extends h.Filter{constructor(){const e=`
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
          `,fragment:e}),resources:{uSceneColor:h.Texture.WHITE.source,uNormalMap:h.Texture.WHITE.source,uniforms:{uInvResolution:{value:[1,1],type:"vec2<f32>"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uDisplacementScale:{value:.01,type:"f32"},uTint:{value:[1,1,1],type:"vec3<f32>"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"}}}})}}class ye{constructor(e){this.renderer=e,this.id="webgl1",this.filter=new ve,this.rtManager=new z(e,!1),this.blitSprite=new h.Sprite(h.Texture.WHITE)}setup(){}render(e){const{renderer:t,panels:s,quality:a,drawOpaqueScene:o}=e,n=this.rtManager.ensure(t.screen.width,t.screen.height,a.renderScale);o(n.sceneColor),this.blitSprite.texture=n.sceneColor,this.blitSprite.width=t.screen.width,this.blitSprite.height=t.screen.height,t.render({container:this.blitSprite,clear:!0});const c=[...s].sort((l,u)=>(l.zIndex??0)-(u.zIndex??0));for(const l of c)this.applyFilter(l,n.sceneColor,a),t.render({container:l})}dispose(){this.rtManager.dispose()}applyFilter(e,t,s){if(!(!!(e.normalMap||e.dudvMap)||e.glassMaterial.dispersion>.001||e.glassMaterial.roughness>.001)){e.filters=null;return}const o=this.filter.resources;o.uSceneColor=t.source,o.uNormalMap=(e.normalMap??e.dudvMap??h.Texture.WHITE).source;const n=o.uniforms;n.uInvResolution=[1/t.width,1/t.height],n.uDispersion=e.glassMaterial.dispersion,n.uRoughness=e.glassMaterial.roughness,n.uDisplacementScale=e.glassMaterial.thickness*.1,n.uTint=H(e.glassMaterial.tint??16777215),n.uOpacity=e.glassMaterial.opacity,n.uEnableDispersion=s.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,e.filters=[this.filter]}}const be=`
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
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
`,Me=`
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

  // Calculate edge distance (0 at edges, 1 at center)
  float edgeDist = calculateEdgeMask(vUv, uNormalMap);

  // Optionally blur the edge distance
  if (uEdgeMaskBlur > 0.0) {
    float blurredDist = 0.0;
    float blurWeight = 0.0;
    float blurSize = uEdgeMaskBlur * 0.01;
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 offset = vec2(float(x), float(y)) * blurSize;
        float sampleDist = calculateEdgeMask(vUv + offset, uNormalMap);
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
`,Se=`
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
`,we=new h.MeshGeometry({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])});class Te{constructor(e,t){this.renderer=e,this.id="webgl2",this.rtManager=new z(e,t);const s=new h.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uInvResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uIOR:{value:1,type:"f32"},uThickness:{value:1,type:"f32"},uDispersion:{value:0,type:"f32"},uRoughness:{value:0,type:"f32"},uOpacity:{value:1,type:"f32"},uEnableDispersion:{value:0,type:"f32"},uEnableCaustics:{value:0,type:"f32"},uTint:{value:new Float32Array([1,1,1]),type:"vec3<f32>"},uSpecular:{value:0,type:"f32"},uShininess:{value:32,type:"f32"},uShadow:{value:0,type:"f32"},uLightDir:{value:new Float32Array([.5,.5,1]),type:"vec3<f32>"},uBlurSamples:{value:8,type:"f32"},uBlurSpread:{value:4,type:"f32"},uBlurAngle:{value:0,type:"f32"},uBlurAnisotropy:{value:0,type:"f32"},uBlurGamma:{value:1,type:"f32"},uAberrationR:{value:1,type:"f32"},uAberrationB:{value:1,type:"f32"},uAO:{value:0,type:"f32"},uAORadius:{value:.5,type:"f32"},uNoiseScale:{value:20,type:"f32"},uNoiseIntensity:{value:0,type:"f32"},uNoiseRotation:{value:0,type:"f32"},uNoiseThreshold:{value:0,type:"f32"},uEdgeSupersampling:{value:1,type:"f32"},uGlassSupersampling:{value:1,type:"f32"},uPanelSize:{value:new Float32Array([200,200]),type:"vec2<f32>"},uEdgeMaskCutoff:{value:.001,type:"f32"},uEdgeMaskBlur:{value:0,type:"f32"},uEdgeMaskInvert:{value:0,type:"f32"},uEdgeSmoothing:{value:new Float32Array([0,.3,1,1]),type:"vec4<f32>"},uEdgeContrast:{value:new Float32Array([0,.3,.7,1]),type:"vec4<f32>"},uEdgeAlpha:{value:new Float32Array([0,.2,1,1]),type:"vec4<f32>"},uEdgeTint:{value:new Float32Array([0,.5,.5,1]),type:"vec4<f32>"},uEdgeDarken:{value:new Float32Array([0,.3,.3,1]),type:"vec4<f32>"},uEdgeDesaturate:{value:new Float32Array([0,.4,.5,1]),type:"vec4<f32>"},uEnableSmoothing:{value:0,type:"f32"},uEnableContrast:{value:0,type:"f32"},uEnableAlpha:{value:0,type:"f32"},uEnableTint:{value:0,type:"f32"},uEnableDarken:{value:0,type:"f32"},uEnableDesaturate:{value:0,type:"f32"},uDebugMode:{value:0,type:"f32"}});this.refractShader=h.Shader.from({gl:{vertex:ee,fragment:Me},resources:{uSceneColor:h.Texture.WHITE.source,uNormalMap:h.Texture.WHITE.source,uCausticsMap:h.Texture.WHITE.source,panelUniforms:s}});const a=new h.UniformGroup({uPosition:{value:new Float32Array([0,0]),type:"vec2<f32>"},uScale:{value:new Float32Array([1,1]),type:"vec2<f32>"},uResolution:{value:new Float32Array([1,1]),type:"vec2<f32>"},uOpacity:{value:1,type:"f32"}});this.revealageShader=h.Shader.from({gl:{vertex:ee,fragment:Se},resources:{uNormalMap:h.Texture.WHITE.source,panelUniforms:a}}),this.compositeShader=h.Shader.from({gl:{vertex:be,fragment:Ee},resources:{uSceneColor:h.Texture.WHITE.source,uAccum:h.Texture.WHITE.source,uReveal:h.Texture.WHITE.source}}),this.fullScreenQuad=new h.Mesh({geometry:we,shader:this.compositeShader}),this.fullScreenQuad.state=h.State.for2d(),this.fullScreenQuad.state.culling=!1,this.shadowSprite=new h.Sprite(h.Texture.WHITE),this.panelParent=new h.Container,this.panelParent.alpha=1,this.compositeSprite=new h.Sprite(h.Texture.EMPTY),this.compositeSprite.position.set(0,0),this.compositeSprite.visible=!0,this.compositeSprite.alpha=1,this.compositeSprite.zIndex=9999}setup(){}render(e){var u,d;const{renderer:t,panels:s,quality:a,drawOpaqueScene:o}=e,n=t.screen.width,c=t.screen.height,l=this.rtManager.ensure(n,c,a.renderScale);this.ensureAccumTargets(n,c),this.ensureCompositeTarget(n,c),o(l.sceneColor),this.clearTarget(this.accumRT,0,0,0,0),this.clearTarget(this.revealRT,1,1,1,1);for(const f of s)this.renderPanel(f,a,l.sceneColor);this.fullScreenQuad.shader=this.compositeShader,this.compositeShader.resources.uSceneColor=l.sceneColor.source,this.compositeShader.resources.uAccum=(u=this.accumRT)==null?void 0:u.source,this.compositeShader.resources.uReveal=(d=this.revealRT)==null?void 0:d.source,this.fullScreenQuad.width=t.screen.width,this.fullScreenQuad.height=t.screen.height,this.fullScreenQuad.updateLocalTransform(),this.fullScreenQuad.worldTransform.copyFrom(this.fullScreenQuad.localTransform),t.render({container:this.fullScreenQuad,target:this.compositeRT,clear:!0}),this.compositeRT&&(this.compositeSprite.texture=this.compositeRT,this.compositeSprite.width=n,this.compositeSprite.height=c,this.compositeSprite.visible=!0),this.renderContactShadows(s,a)}dispose(){var e,t,s;this.rtManager.dispose(),(e=this.accumRT)==null||e.destroy(!0),(t=this.revealRT)==null||t.destroy(!0),(s=this.compositeRT)==null||s.destroy(!0)}ensureAccumTargets(e,t){var a,o;const s=this.renderer.resolution;(!this.accumRT||this.accumRT.width!==e||this.accumRT.height!==t||this.accumRT.source.resolution!==s)&&((a=this.accumRT)==null||a.destroy(!0),this.accumRT=h.RenderTexture.create({width:e,height:t,resolution:s})),(!this.revealRT||this.revealRT.width!==e||this.revealRT.height!==t||this.revealRT.source.resolution!==s)&&((o=this.revealRT)==null||o.destroy(!0),this.revealRT=h.RenderTexture.create({width:e,height:t,resolution:s}))}clearTarget(e,t,s,a,o){if(!e)return;const n=new h.Container;this.renderer.render({container:n,target:e,clear:!0,clearColor:[t,s,a,o]})}renderPanel(e,t,s){var d,f,g,m;if(!this.accumRT||!this.revealRT)return;const a=e.normalMap??h.Texture.WHITE,o=this.renderer.screen.width,n=this.renderer.screen.height,c=this.refractShader.resources;if(c){c.uSceneColor=s.source,c.uNormalMap=a.source,c.uCausticsMap=(e.causticsAtlas??h.Texture.WHITE).source;const r=(d=c.panelUniforms)==null?void 0:d.uniforms;if(r){const p=((g=(f=this.accumRT)==null?void 0:f.source)==null?void 0:g._resolution)??this.renderer.resolution;r.uPosition[0]=e.position.x,r.uPosition[1]=e.position.y,r.uScale[0]=e.scale.x,r.uScale[1]=e.scale.y,r.uResolution[0]=o,r.uResolution[1]=n,r.uInvResolution[0]=1/(o*p),r.uInvResolution[1]=1/(n*p),r.uIOR=e.glassMaterial.ior,r.uThickness=e.glassMaterial.thickness,r.uDispersion=e.glassMaterial.dispersion,r.uRoughness=e.glassMaterial.roughness,r.uOpacity=e.glassMaterial.opacity??1,r.uEnableDispersion=t.enableDispersion&&e.glassMaterial.dispersion>.001?1:0,r.uEnableCaustics=t.enableCaustics&&e.causticsAtlas?1:0;const w=H(e.glassMaterial.tint??16777215);r.uTint[0]=w[0],r.uTint[1]=w[1],r.uTint[2]=w[2],r.uSpecular=e.glassMaterial.specular??0,r.uShininess=e.glassMaterial.shininess??32,r.uShadow=e.glassMaterial.shadow??0;const D=e.glassMaterial.lightDir??[.5,.5,1];r.uLightDir[0]=D[0],r.uLightDir[1]=D[1],r.uLightDir[2]=D[2],r.uBlurSamples=e.glassMaterial.blurSamples??8,r.uBlurSpread=e.glassMaterial.blurSpread??4,r.uBlurAngle=(e.glassMaterial.blurAngle??0)*Math.PI/180,r.uBlurAnisotropy=e.glassMaterial.blurAnisotropy??0,r.uBlurGamma=e.glassMaterial.blurGamma??1,r.uAberrationR=e.glassMaterial.aberrationR??1,r.uAberrationB=e.glassMaterial.aberrationB??1,r.uAO=e.glassMaterial.ao??0,r.uAORadius=e.glassMaterial.aoRadius??.5,r.uNoiseScale=e.glassMaterial.noiseScale??20,r.uNoiseIntensity=e.glassMaterial.noiseIntensity??0,r.uNoiseRotation=e.glassMaterial.noiseRotation??0,r.uNoiseThreshold=e.glassMaterial.noiseThreshold??0,r.uEdgeSupersampling=t.edgeSupersampling??1,r.uGlassSupersampling=e.glassMaterial.glassSupersampling??1,r.uPanelSize[0]=e.scale.x,r.uPanelSize[1]=e.scale.y;const y=e.glassMaterial.edgeMask;if(y){r.uEdgeMaskCutoff=y.cutoff,r.uEdgeMaskBlur=y.blur,r.uEdgeMaskInvert=y.invert?1:0;const b=(M,S)=>{M[0]=S.rangeStart,M[1]=S.rangeEnd,M[2]=S.strength,M[3]=S.opacity};b(r.uEdgeSmoothing,y.smoothing),b(r.uEdgeContrast,y.contrast),b(r.uEdgeAlpha,y.alpha),b(r.uEdgeTint,y.tint),b(r.uEdgeDarken,y.darken),b(r.uEdgeDesaturate,y.desaturate),r.uEnableSmoothing=y.smoothing.enabled?1:0,r.uEnableContrast=y.contrast.enabled?1:0,r.uEnableAlpha=y.alpha.enabled?1:0,r.uEnableTint=y.tint.enabled?1:0,r.uEnableDarken=y.darken.enabled?1:0,r.uEnableDesaturate=y.desaturate.enabled?1:0,r.uDebugMode=y.debugMode??0}else r.uEdgeMaskCutoff=e.glassMaterial.edgeMaskCutoff??.001,r.uEdgeMaskBlur=e.glassMaterial.edgeBlur??0,r.uEdgeMaskInvert=0,r.uEnableSmoothing=0,r.uEnableContrast=0,r.uEnableAlpha=0,r.uEnableTint=0,r.uEnableDarken=0,r.uEnableDesaturate=0}}const l=e.shader;e.shader=this.refractShader,this.drawPanelToTarget(e,this.accumRT),e.shader=this.revealageShader;const u=this.revealageShader.resources;if(u){u.uNormalMap=a.source;const r=(m=u.panelUniforms)==null?void 0:m.uniforms;r&&(r.uPosition[0]=e.position.x,r.uPosition[1]=e.position.y,r.uScale[0]=e.scale.x,r.uScale[1]=e.scale.y,r.uResolution[0]=o,r.uResolution[1]=n,r.uOpacity=e.glassMaterial.opacity)}this.drawPanelToTarget(e,this.revealRT),e.shader=l}renderContactShadows(e,t){if(t.enableContactShadows)for(const s of e)s.sdfShadow&&(this.shadowSprite.texture=s.sdfShadow,this.shadowSprite.position.copyFrom(s.position),this.shadowSprite.scale.copyFrom(s.scale),this.shadowSprite.rotation=s.rotation,this.shadowSprite.alpha=Math.min(s.glassMaterial.opacity+.2,.9),this.renderer.render(this.shadowSprite))}getCompositeDisplay(){return this.compositeSprite}drawPanelToTarget(e,t){const s=this.renderer,a=s.gl;this.panelParent.removeChildren(),this.panelParent.addChild(e),e.updateLocalTransform(),e.worldTransform.copyFrom(e.localTransform),a&&(a.enable(a.BLEND),a.blendFunc(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA)),s.render({container:this.panelParent,target:t,clear:!1}),a&&a.blendFunc(a.ONE,a.ONE_MINUS_SRC_ALPHA)}ensureCompositeTarget(e,t){var a;const s=this.renderer.resolution;(!this.compositeRT||this.compositeRT.width!==e||this.compositeRT.height!==t||this.compositeRT.source.resolution!==s)&&((a=this.compositeRT)==null||a.destroy(!0),this.compositeRT=h.RenderTexture.create({width:e,height:t,resolution:s}),this.compositeSprite.texture=this.compositeRT)}}class te{constructor(e,t={}){this.renderer=e,this.panels=[],this.quality=new Q,this.drawOpaqueScene=()=>{},this.events=new Y;const s=e.gl,a=new X(s).run();this.pipeline=a.tier==="webgl2"?new Te(e,!0):new ye(e),a.tier==="webgl1"&&this.emitFallback("webgl","MRT unavailable, using compatibility pipeline")}setOpaqueSceneCallback(e){this.drawOpaqueScene=e}createPanel(e){const t=new $(e);return this.panels.push(t),t}removePanel(e){const t=this.panels.indexOf(e);t>=0&&(this.panels.splice(t,1),e.destroy({children:!0,texture:!1,textureSource:!1}))}render(){const e=performance.now(),t=this.quality.getQuality();this.pipeline.render({renderer:this.renderer,panels:this.panels,quality:t,drawOpaqueScene:this.drawOpaqueScene});const s=performance.now()-e;this.quality.record({cpuMs:s,timestamp:e});const a=this.quality.evaluate();a&&this.events.emit("quality:decision",a)}setQuality(e){this.quality.setOverrides(e)}destroy(){for(const e of this.panels)e.destroy({children:!0,texture:!1,textureSource:!1});this.panels.length=0,this.pipeline.dispose(),this.events.removeAll()}on(e,t){this.events.on(e,t)}off(e,t){this.events.off(e,t)}getPipelineId(){return this.pipeline.id}getCompositeDisplay(){if(typeof this.pipeline.getCompositeDisplay=="function")return this.pipeline.getCompositeDisplay()}emitFallback(e,t){const s={target:e,message:t,timestamp:performance.now()};console.warn(`GlassSystem fallback: ${e} - ${t}`),this.events.emit("fallback",s)}}class De{constructor(e){this.renderer=e,this.container=new h.Container,this.visible=!1,this.panel=new h.Graphics().beginFill(0,.65).drawRoundedRect(0,0,260,120,8).endFill(),this.text=new h.Text("Glass HUD",{fontSize:12,fill:16777215}),this.text.position.set(12,10),this.container.addChild(this.panel,this.text),this.container.visible=this.visible,this.container.position.set(12,12)}setVisible(e){this.visible=e,this.container.visible=e}update(e){if(!this.visible)return;const{quality:t,fps:s,lastDecision:a}=e,o=[`FPS: ${s.toFixed(1)}`,`Scale: ${(t.renderScale*100).toFixed(0)}%`,`Blur taps: ${t.maxBlurTaps}`,`Dispersion: ${t.enableDispersion?"on":"off"}`,`Caustics: ${t.enableCaustics?"on":"off"}`];a&&o.push(`Action: ${a.action}`),this.text.text=o.join(`
`)}}v.AdaptiveQualityController=Q,v.CapabilityProbe=X,v.EventBus=Y,v.GlassHUD=De,v.GlassOverlay=le,v.GlassPanel=$,v.GlassPresets=_,v.GlassSystem=te,v.SceneRTManager=z,v.createDefaultEdgeMask=pe,v.createDefaultEdgeTactic=B,v.createPillGeometry=fe,v.createPillNormalMap=me,v.getBezierHeightAndDerivative=Z,v.getHeightAndDerivative=W,v.heightCircle=J,v.heightSquircle=G,v.hexToVec3=H,v.smootherstep=K,v.updatePillGeometry=ge,Object.defineProperty(v,Symbol.toStringTag,{value:"Module"})});
//# sourceMappingURL=pixi-adaptive-glass.umd.js.map
