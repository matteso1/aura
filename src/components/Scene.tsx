'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Preload } from '@react-three/drei';
import { ShaderParticles } from './ShaderParticles';
import { Suspense, useEffect, useRef } from 'react';
import { ColorTheme } from '@/lib/themes';
import * as THREE from 'three';

interface SceneProps {
    audioData: {
        bass: number;
        mid: number;
        treble: number;
        averageFrequency: number;
        frequencyData: Uint8Array;
    };
    theme?: ColorTheme;
    isPlaying?: boolean;
}

// Camera controller for zoom animations
// CameraController removed to prevent fighting with user controls

// Simple static star field using points
function SimpleStars({ count = 500 }: { count?: number }) {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        // Distribute in a sphere
        const radius = 40 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                color="#ffffff"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

// Inner scene content
function SceneContent({ audioData, theme, isPlaying = false }: SceneProps) {
    return (
        <>
            {/* Dim ambient */}
            <ambientLight intensity={0.02} />

            {/* Colored accent lights */}
            <pointLight position={[10, 10, 10]} intensity={0.4} color="#ff6b9d" />
            <pointLight position={[-10, -10, -10]} intensity={0.35} color="#00d4ff" />
            <pointLight position={[0, 10, -10]} intensity={0.25} color="#a855f7" />

            {/* Central core glow */}
            <pointLight
                position={[0, 0, 0]}
                intensity={0.2 + audioData.bass * 0.6}
                color="#ffffff"
                distance={8}
                decay={2}
            />

            {/* Particles with theme */}
            <ShaderParticles
                audioData={audioData}
                count={4000}
                theme={theme}
            />

            {/* Camera controls */}
            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={3}
                maxDistance={25}
                autoRotate
                autoRotateSpeed={0.12 + audioData.averageFrequency * 1.2}
            />
        </>
    );
}

export function Scene({ audioData, theme, isPlaying }: SceneProps) {
    return (
        <Canvas
            camera={{ position: [0, 0, 6], fov: 75 }}
            style={{
                background: '#000000'
            }}
            gl={{
                antialias: false,
                alpha: false,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true,
            }}
            dpr={1}
            performance={{ min: 0.5 }}
        >
            <Suspense fallback={null}>
                <SceneContent
                    audioData={audioData}
                    theme={theme}
                    isPlaying={isPlaying}
                />
                <Preload all />
            </Suspense>
        </Canvas>
    );
}
