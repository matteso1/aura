'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAudio } from '@/hooks/useAudio';
import { Controls } from '@/components/Controls';
import { ColorTheme, getDefaultTheme } from '@/lib/themes';

// Dynamic import to avoid SSR issues with Three.js
const Scene = dynamic(() => import('@/components/Scene').then(mod => ({ default: mod.Scene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e]">
      <div className="text-white/50 text-lg animate-pulse">Loading Aura...</div>
    </div>
  ),
});

export default function Home() {
  const {
    audioData,
    isPlaying,
    isPaused,
    currentSource,
    fileName,
    startMicrophone,
    startFile,
    pause,
    resume,
    stop
  } = useAudio();

  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(getDefaultTheme());

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Canvas */}
      <Scene
        audioData={audioData}
        theme={currentTheme}
        isPlaying={isPlaying}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-rose-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
              AURA
            </span>
          </h1>
          <p className="text-white/40 text-sm tracking-widest uppercase">
            Audio-Reactive AI Universe
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <Controls
        isPlaying={isPlaying}
        isPaused={isPaused}
        currentSource={currentSource}
        fileName={fileName}
        onMicrophoneClick={startMicrophone}
        onFileSelect={startFile}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        audioData={audioData}
      />
    </main>
  );
}
