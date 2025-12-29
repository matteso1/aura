'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { particleVertexShader, particleFragmentShader } from '@/shaders/particles';
import { ColorTheme, getDefaultTheme } from '@/lib/themes';

interface ShaderParticlesProps {
    audioData: {
        bass: number;
        mid: number;
        treble: number;
        averageFrequency: number;
        frequencyData: Uint8Array;
        kick?: number;
        snare?: number;
        hihat?: number;
        impact?: number;
    };
    count?: number;
    theme?: ColorTheme;
    trailsEnabled?: boolean;
}

export function ShaderParticles({ audioData, count = 10000, theme, trailsEnabled = false }: ShaderParticlesProps) {
    const meshRef = useRef<THREE.Points>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const currentTheme = theme || getDefaultTheme();

    const { positions, sizes, randoms } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const randoms = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const shell = Math.floor(Math.random() * 3);
            const radius = 1.5 + shell * 0.8 + Math.random() * 0.5;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            sizes[i] = 0.5 + Math.random() * 1.5;
            randoms[i] = Math.random();
        }

        return { positions, sizes, randoms };
    }, [count]);

    const shaderMaterial = useMemo(() => {
        const defaultTheme = getDefaultTheme();
        return new THREE.ShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uBass: { value: 0 },
                uMid: { value: 0 },
                uTreble: { value: 0 },
                uEnergy: { value: 0 },
                uKick: { value: 0 },
                uSnare: { value: 0 },
                uImpact: { value: 0 },
                uTrailsEnabled: { value: 0 },
                // Theme uniforms
                uHue1: { value: defaultTheme.colors.stops[0] },
                uHue2: { value: defaultTheme.colors.stops[1] },
                uHue3: { value: defaultTheme.colors.stops[2] },
                uHue4: { value: defaultTheme.colors.stops[3] },
                uHue5: { value: defaultTheme.colors.stops[4] },
                uSaturation: { value: defaultTheme.colors.saturation },
                uBaseLightness: { value: defaultTheme.colors.baseLightness },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }, []);

    // Update theme uniforms when theme changes
    useEffect(() => {
        if (!materialRef.current) return;
        const uniforms = materialRef.current.uniforms;
        uniforms.uHue1.value = currentTheme.colors.stops[0];
        uniforms.uHue2.value = currentTheme.colors.stops[1];
        uniforms.uHue3.value = currentTheme.colors.stops[2];
        uniforms.uHue4.value = currentTheme.colors.stops[3];
        uniforms.uHue5.value = currentTheme.colors.stops[4];
        uniforms.uSaturation.value = currentTheme.colors.saturation;
        uniforms.uBaseLightness.value = currentTheme.colors.baseLightness;
    }, [currentTheme]);

    // Update trails uniform when toggle changes
    useEffect(() => {
        if (!materialRef.current) return;
        materialRef.current.uniforms.uTrailsEnabled.value = trailsEnabled ? 1.0 : 0.0;
    }, [trailsEnabled]);

    useFrame((state) => {
        if (!materialRef.current) return;

        const { bass, mid, treble, averageFrequency, kick = 0, snare = 0, impact = 0 } = audioData;

        const uniforms = materialRef.current.uniforms;

        uniforms.uTime.value = state.clock.elapsedTime;

        // VERY smooth - physical, weighted motion
        const smoothFactor = 0.06;
        uniforms.uBass.value += (bass - uniforms.uBass.value) * smoothFactor;
        uniforms.uMid.value += (mid - uniforms.uMid.value) * smoothFactor;
        uniforms.uTreble.value += (treble - uniforms.uTreble.value) * smoothFactor;
        uniforms.uEnergy.value += (averageFrequency - uniforms.uEnergy.value) * smoothFactor;

        // Transients slightly faster but still smooth
        const punchFactor = 0.15;
        uniforms.uKick.value += (kick - uniforms.uKick.value) * punchFactor;
        uniforms.uSnare.value += (snare - uniforms.uSnare.value) * punchFactor;
        uniforms.uImpact.value += (impact - uniforms.uImpact.value) * punchFactor;

        if (meshRef.current) {
            // Smooth organic rotation
            meshRef.current.rotation.y += 0.002 + averageFrequency * 0.006;
            meshRef.current.rotation.x += 0.0008;
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-aSize"
                    args={[sizes, 1]}
                />
                <bufferAttribute
                    attach="attributes-aRandom"
                    args={[randoms, 1]}
                />
            </bufferGeometry>
            <primitive object={shaderMaterial} ref={materialRef} attach="material" />
        </points>
    );
}
