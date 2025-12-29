// Vertex shader - LOCALIZED BUMPS with theme support
export const particleVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uEnergy;
  uniform float uKick;
  uniform float uSnare;
  uniform float uImpact;
  
  // Theme colors
  uniform float uHue1;
  uniform float uHue2;
  uniform float uHue3;
  uniform float uHue4;
  uniform float uHue5;
  uniform float uSaturation;
  uniform float uBaseLightness;
  
  attribute float aSize;
  attribute float aRandom;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vTrailStrength;
  varying float vDistance;
  
  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Curl noise for organic flow
  vec3 curlNoise(vec3 p) {
    float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    float n1 = snoise(p + dy) - snoise(p - dy);
    float n2 = snoise(p + dz) - snoise(p - dz);
    float n3 = snoise(p + dz) - snoise(p - dz);
    float n4 = snoise(p + dx) - snoise(p - dx);
    float n5 = snoise(p + dx) - snoise(p - dx);
    float n6 = snoise(p + dy) - snoise(p - dy);
    return normalize(vec3(n1 - n2, n3 - n4, n5 - n6));
  }
  
  // LOCALIZED BUMP with per-particle height variation
  float localizedBump(vec3 particleDir, vec3 pokeDir, float pokeStrength, float radius, float particleRandom) {
    float closeness = dot(normalize(particleDir), pokeDir);
    // Softer falloff
    float bump = smoothstep(1.0 - radius * 1.5, 1.0, closeness);
    bump = pow(bump, 0.7);
    // PER-PARTICLE height variation within the bump!
    // Each particle has slightly different peak height
    float individualHeight = 0.6 + particleRandom * 0.8;
    return bump * pokeStrength * individualHeight;
  }
  
  void main() {
    vec3 pos = position;
    float dist = length(pos);
    float normalizedDist = dist / 4.0;
    vec3 particleDir = normalize(pos);
    
    float slowTime = uTime * 0.2;
    
    // Per-particle variation values
    float particleOffset = aRandom * 0.5;
    float particlePhase = aRandom * 6.28318;
    
    // ========================================
    // SPIKY ORGANIC BASE SHAPE (breaks the sphere!)
    // ========================================
    // Large-scale noise for organic spikes
    float spikeNoise = snoise(particleDir * 3.0 + slowTime * 0.3);
    spikeNoise += snoise(particleDir * 6.0 - slowTime * 0.2) * 0.5;
    spikeNoise += snoise(particleDir * 12.0 + slowTime * 0.1) * 0.25;
    
    // Per-particle variation in spike height
    float spikeAmount = (spikeNoise * 0.5 + 0.5) * (0.5 + aRandom * 0.8);
    
    // Apply spikes - makes it NOT a sphere
    pos += particleDir * spikeAmount * 0.8;
    
    // ========================================
    // ORGANIC BACKGROUND FLOW (subtle)
    // ========================================
    vec3 noisePos = pos * 0.4 + slowTime;
    vec3 flow = curlNoise(noisePos);
    float flowStrength = 0.15 + uEnergy * 0.2;
    pos += flow * flowStrength * normalizedDist;
    
    // ========================================
    // MANY LOCALIZED FREQUENCY BUMPS
    // 12 poke points distributed across sphere
    // ========================================
    
    // (particleOffset and particlePhase already defined above)
    
    // 12 poke directions distributed across the sphere (like vertices of icosahedron)
    vec3 dir1 = normalize(vec3(0.0, -1.0, 0.0));
    vec3 dir2 = normalize(vec3(0.0, 1.0, 0.0));
    vec3 dir3 = normalize(vec3(1.0, 0.0, 0.0));
    vec3 dir4 = normalize(vec3(-1.0, 0.0, 0.0));
    vec3 dir5 = normalize(vec3(0.0, 0.0, 1.0));
    vec3 dir6 = normalize(vec3(0.0, 0.0, -1.0));
    vec3 dir7 = normalize(vec3(0.577, 0.577, 0.577));
    vec3 dir8 = normalize(vec3(-0.577, 0.577, 0.577));
    vec3 dir9 = normalize(vec3(0.577, -0.577, 0.577));
    vec3 dir10 = normalize(vec3(0.577, 0.577, -0.577));
    vec3 dir11 = normalize(vec3(-0.577, -0.577, 0.577));
    vec3 dir12 = normalize(vec3(0.577, -0.577, -0.577));
    
    // Larger radius for more overlap/blending
    float r = 0.4;
    
    // Per-particle random for individual heights
    float pRand = aRandom;
    float pRand2 = fract(aRandom * 7.13);
    float pRand3 = fract(aRandom * 13.37);
    
    // EXPLOSIVE displacement - particles shoot outward on beats
    float bump1 = localizedBump(particleDir, dir1, uKick * 8.0, r, pRand);
    float bump2 = localizedBump(particleDir, dir2, uTreble * 4.0, r, pRand2);
    float bump3 = localizedBump(particleDir, dir3, uSnare * 7.0, r, pRand3);
    float bump4 = localizedBump(particleDir, dir4, uBass * 6.0, r, pRand);
    float bump5 = localizedBump(particleDir, dir5, uMid * 4.0, r, pRand2);
    float bump6 = localizedBump(particleDir, dir6, uKick * 6.0, r, pRand3);
    float bump7 = localizedBump(particleDir, dir7, uSnare * 5.0, r, pRand);
    float bump8 = localizedBump(particleDir, dir8, uBass * 4.0, r, pRand2);
    float bump9 = localizedBump(particleDir, dir9, uMid * 3.0, r, pRand3);
    float bump10 = localizedBump(particleDir, dir10, uTreble * 3.0, r, pRand);
    float bump11 = localizedBump(particleDir, dir11, uImpact * 6.0, r, pRand2);
    float bump12 = localizedBump(particleDir, dir12, uImpact * 5.0, r, pRand3);
    
    // Total displacement
    float totalBump = bump1 + bump2 + bump3 + bump4 + bump5 + bump6 + 
                      bump7 + bump8 + bump9 + bump10 + bump11 + bump12;
    
    // EXPLOSIVE BURST - some particles shoot way out during peaks!
    float burstThreshold = 0.3;
    float burstAmount = max(0.0, (uKick + uSnare * 0.8 + uImpact * 0.6) - burstThreshold);
    float particleBurst = burstAmount * pRand * 3.0;
    
    // Apply displacement + burst
    pos += particleDir * (totalBump + particleBurst);
    
    // Asymmetric breathing - expands more in kick direction
    float breathe = 1.0 + uEnergy * 0.6 + uBass * 0.4;
    pos *= breathe;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size pulses with audio - gets BIGGER during peaks
    float sizePulse = 1.0 + uKick * 0.5 + uSnare * 0.3 + uBass * 0.2;
    float size = aSize * (1.0 + totalBump * 0.3 + aRandom * 0.1) * sizePulse;
    gl_PointSize = size * (200.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
    
    vDistance = normalizedDist;
    vAlpha = 0.7 + uEnergy * 0.2 + totalBump * 0.2;
    
    // ========================================
    // COLOR - theme-based multi-stop gradient
    // ========================================
    
    // Time-based hue rotation for trippy effect
    float timeShift = slowTime * 0.15;
    
    // Multi-stop gradient based on distance AND angle
    float angleFactor = (atan(pos.y, pos.x) + 3.14159) / 6.28318;
    float distFactor = clamp(normalizedDist, 0.0, 1.0);
    
    // Combine position with time for flowing colors
    float gradientPos = distFactor * 0.6 + angleFactor * 0.4 + timeShift;
    gradientPos = mod(gradientPos, 1.0);
    
    // 5-color theme stops
    float hue;
    if (gradientPos < 0.2) {
      hue = mix(uHue1, uHue2, gradientPos * 5.0);
    } else if (gradientPos < 0.4) {
      hue = mix(uHue2, uHue3, (gradientPos - 0.2) * 5.0);
    } else if (gradientPos < 0.6) {
      hue = mix(uHue3, uHue4, (gradientPos - 0.4) * 5.0);
    } else if (gradientPos < 0.8) {
      hue = mix(uHue4, uHue5, (gradientPos - 0.6) * 5.0);
    } else {
      hue = mix(uHue5, uHue1, (gradientPos - 0.8) * 5.0);
    }
    
    // Audio influence
    hue += uBass * 0.03;
    hue = mod(hue, 1.0);
    
    float h = hue * 6.0;
    float s = uSaturation;
    float l = uBaseLightness + uEnergy * 0.06 + totalBump * 0.05;
    
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
    float m = l - c / 2.0;
    
    vec3 rgb;
    if (h < 1.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    
    vColor = rgb + m;
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDistance;
  varying float vTrailStrength;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    
    // Trail effect: stretch in y direction when enabled
    float stretchY = 1.0 + vTrailStrength * 2.0;
    vec2 stretchedCoord = vec2(center.x, center.y * stretchY);
    
    float dist = length(stretchedCoord);
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Trail fade toward bottom
    float trailFade = 1.0 - vTrailStrength * center.y;
    alpha *= trailFade;
    
    float glow = exp(-dist * 4.0) * 0.2;
    alpha += glow;
    float core = exp(-dist * 8.0);
    vec3 color = vColor + vec3(core * 0.2);
    gl_FragColor = vec4(color, alpha * vAlpha * 0.8);
  }
`;

export const bloomVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bloomFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float uBloomStrength;
  uniform float uBloomRadius;
  uniform vec2 uResolution;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(tDiffuse, vUv);
  }
`;

export const volumetricVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const volumetricFragmentShader = `
  uniform sampler2D tDiffuse;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(tDiffuse, vUv);
  }
`;

