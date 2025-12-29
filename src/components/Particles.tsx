'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
    audioData: {
        bass: number;
        mid: number;
        treble: number;
        averageFrequency: number;
        frequencyData: Uint8Array;
    };
    count?: number;
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b];
}

export function Particles({ audioData, count = 8000 }: ParticlesProps) {
    const meshRef = useRef<THREE.Points>(null);
    const originalPositions = useRef<Float32Array | null>(null);
    const velocities = useRef<Float32Array | null>(null);
    const hueOffset = useRef(0);

    const { positions, colors, sizes } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Spherical distribution with varying density
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 1.5 + Math.random() * 2;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Initial colors - vibrant cyan/magenta
            colors[i * 3] = 0.8;
            colors[i * 3 + 1] = 0.2;
            colors[i * 3 + 2] = 1.0;

            // Random sizes for depth
            sizes[i] = 0.02 + Math.random() * 0.04;
        }

        return { positions, colors, sizes };
    }, [count]);

    // Initialize refs
    useEffect(() => {
        originalPositions.current = positions.slice();
        velocities.current = new Float32Array(count * 3);
    }, [positions, count]);

    useFrame((state) => {
        if (!meshRef.current || !originalPositions.current || !velocities.current) return;

        const geometry = meshRef.current.geometry;
        const positionAttr = geometry.attributes.position;
        const colorAttr = geometry.attributes.color;
        const sizeAttr = geometry.attributes.size;

        const time = state.clock.elapsedTime;
        const { bass, mid, treble, averageFrequency, frequencyData } = audioData;

        // MUCH stronger reactivity multipliers
        const bassStrength = bass * 3.0;
        const midStrength = mid * 2.5;
        const trebleStrength = treble * 2.0;
        const totalEnergy = averageFrequency * 4;

        // Rotate hue based on audio energy
        hueOffset.current += totalEnergy * 0.02;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const ox = originalPositions.current[i3];
            const oy = originalPositions.current[i3 + 1];
            const oz = originalPositions.current[i3 + 2];

            const dist = Math.sqrt(ox * ox + oy * oy + oz * oz);
            const normalizedDist = dist / 3.5;

            // Get frequency bin for this particle based on its position
            const freqIndex = Math.floor((i / count) * (frequencyData.length - 1));
            const freqValue = frequencyData[freqIndex] / 255;

            // EXPLOSIVE bass response
            const bassExplosion = Math.pow(bassStrength, 1.5) * (1 - normalizedDist) * 1.5;

            // Rippling mid waves
            const midWave = Math.sin(time * 6 + dist * 3) * midStrength * 0.8;

            // Sparkly treble jitter
            const trebleJitter = (Math.random() - 0.5) * trebleStrength * 0.4;

            // Frequency-specific displacement
            const freqDisplacement = freqValue * 0.5;

            // Combined displacement - particles explode outward with bass
            const displacement = 1 + bassExplosion + midWave + trebleJitter + freqDisplacement;

            // Smooth velocity-based movement
            const targetX = ox * displacement;
            const targetY = oy * displacement;
            const targetZ = oz * displacement;

            const currentX = positionAttr.array[i3] as number;
            const currentY = positionAttr.array[i3 + 1] as number;
            const currentZ = positionAttr.array[i3 + 2] as number;

            // Lerp towards target for smooth movement
            const lerpFactor = 0.15;
            positionAttr.array[i3] = currentX + (targetX - currentX) * lerpFactor;
            positionAttr.array[i3 + 1] = currentY + (targetY - currentY) * lerpFactor;
            positionAttr.array[i3 + 2] = currentZ + (targetZ - currentZ) * lerpFactor;

            // DYNAMIC COLORS - HSL based on audio
            // Hue: cycles with music, bass shifts to red, treble shifts to blue
            const baseHue = (hueOffset.current + normalizedDist * 0.3) % 1;
            const hueShift = bassStrength * -0.15 + trebleStrength * 0.1;
            const hue = (baseHue + hueShift + 1) % 1;

            // Saturation: higher with more energy
            const saturation = 0.7 + totalEnergy * 0.3;

            // Lightness: pulses with bass
            const lightness = 0.4 + bassStrength * 0.3 + freqValue * 0.2;

            const [r, g, b] = hslToRgb(hue, Math.min(saturation, 1), Math.min(lightness, 0.8));
            colorAttr.array[i3] = r;
            colorAttr.array[i3 + 1] = g;
            colorAttr.array[i3 + 2] = b;

            // Size pulsing with bass
            const baseSize = sizes[i];
            sizeAttr.array[i] = baseSize * (1 + bassStrength * 0.8 + freqValue * 0.5);
        }

        positionAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;

        // Rotate based on audio - faster with more energy
        meshRef.current.rotation.y += 0.002 + totalEnergy * 0.01;
        meshRef.current.rotation.x += 0.001 + totalEnergy * 0.005;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    args={[sizes, 1]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                vertexColors
                transparent
                opacity={0.95}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}
