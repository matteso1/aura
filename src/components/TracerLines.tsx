'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TracerLinesProps {
    audioData: {
        bass: number;
        averageFrequency: number;
    };
    count?: number;
}

// Vertex shader for tracer lines
const tracerVertexShader = `
  uniform float uTime;
  uniform float uBass;
  uniform float uEnergy;
  
  attribute float aOpacity;
  
  varying float vOpacity;
  varying float vProgress;
  
  void main() {
    vOpacity = aOpacity;
    
    // Get progress along line (0 = center, 1 = outer)
    float len = length(position);
    vProgress = len / 4.0;
    
    // Pulse effect
    vec3 pos = position;
    float pulse = 1.0 + uBass * 0.3;
    pos *= pulse;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader for tracer lines
const tracerFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  
  varying float vOpacity;
  varying float vProgress;
  
  void main() {
    // Fade from center to edge
    float alpha = (1.0 - vProgress) * vOpacity * 0.15;
    
    // Animated shimmer
    float shimmer = sin(vProgress * 20.0 - uTime * 3.0) * 0.5 + 0.5;
    alpha *= 0.5 + shimmer * 0.5;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function TracerLines({ audioData, count = 200 }: TracerLinesProps) {
    const linesRef = useRef<THREE.LineSegments>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // Generate line geometry - from center to random outer points
    const { positions, opacities } = useMemo(() => {
        const positions = new Float32Array(count * 6); // 2 points per line, 3 coords each
        const opacities = new Float32Array(count * 2);

        for (let i = 0; i < count; i++) {
            // Random direction
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            // Random length
            const length = 2.0 + Math.random() * 2.5;

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);

            // Start point (near center)
            positions[i * 6] = x * 0.3;
            positions[i * 6 + 1] = y * 0.3;
            positions[i * 6 + 2] = z * 0.3;

            // End point (outer)
            positions[i * 6 + 3] = x * length;
            positions[i * 6 + 4] = y * length;
            positions[i * 6 + 5] = z * length;

            // Opacity
            opacities[i * 2] = Math.random();
            opacities[i * 2 + 1] = Math.random() * 0.5;
        }

        return { positions, opacities };
    }, [count]);

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: tracerVertexShader,
            fragmentShader: tracerFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uBass: { value: 0 },
                uEnergy: { value: 0 },
                uColor: { value: new THREE.Color('#ffffff') },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }, []);

    useFrame((state) => {
        if (!materialRef.current) return;

        const uniforms = materialRef.current.uniforms;
        uniforms.uTime.value = state.clock.elapsedTime;
        uniforms.uBass.value += (audioData.bass - uniforms.uBass.value) * 0.1;
        uniforms.uEnergy.value += (audioData.averageFrequency - uniforms.uEnergy.value) * 0.1;

        if (linesRef.current) {
            linesRef.current.rotation.y += 0.001;
            linesRef.current.rotation.x += 0.0005;
        }
    });

    return (
        <lineSegments ref={linesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-aOpacity"
                    args={[opacities, 1]}
                />
            </bufferGeometry>
            <primitive object={shaderMaterial} ref={materialRef} attach="material" />
        </lineSegments>
    );
}
