export const fullscreenVertex = `
precision mediump float;
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUv;
void main(void){
  vUv = aUV;
  vec2 pos = aPosition * 2.0 - 1.0;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

// JFA Seed shader - identifies edge pixels from shape mask
export const jfaSeedFragment = `
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
`;

// JFA Flood shader - propagates nearest seed positions
export const jfaFloodFragment = `
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
`;

// JFA Distance shader - converts seed positions to actual distances
export const jfaDistanceFragment = `
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
`;

export const panelVertex = `
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
`;

export const refractionFragment = `
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
`;

export const revealageFragment = `
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
`;

export const compositeFragment = `
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
`;
