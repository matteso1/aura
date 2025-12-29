'use client';

import { useRef, ChangeEvent, useState } from 'react';
import { colorThemes, ColorTheme } from '@/lib/themes';

interface ControlsProps {
    isPlaying: boolean;
    isPaused: boolean;
    currentSource: 'none' | 'mic' | 'file';
    fileName?: string;
    onMicrophoneClick: () => void;
    onFileSelect: (file: File) => void;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    currentTheme: ColorTheme;
    onThemeChange: (theme: ColorTheme) => void;
    audioData: {
        bass: number;
        mid: number;
        treble: number;
    };
}

// SVG Icons - consistent white style
const Icons = {
    music: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
    ),
    mic: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
        </svg>
    ),
    folder: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
    ),
    play: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
        </svg>
    ),
    pause: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
    ),
    stop: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
        </svg>
    ),
    close: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    palette: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
        </svg>
    ),
    trails: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
    ),
};

export function Controls({
    isPlaying,
    isPaused,
    currentSource,
    fileName,
    onMicrophoneClick,
    onFileSelect,
    onStop,
    onPause,
    onResume,
    currentTheme,
    onThemeChange,
    audioData
}: ControlsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showThemes, setShowThemes] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            setIsExpanded(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            onFileSelect(file);
        }
    };

    return (
        <>
            {/* Modern minimal side panel */}
            <div
                className="fixed right-6 top-1/2 -translate-y-1/2 z-20"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                {/* Collapsed state */}
                {!isExpanded && !isPlaying && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10
                                   flex items-center justify-center text-white/60 
                                   hover:bg-white/10 hover:text-white hover:border-white/20
                                   transition-all duration-300"
                    >
                        {Icons.music}
                    </button>
                )}

                {/* Expanded or playing controls */}
                {(isExpanded || isPlaying) && (
                    <div className="flex flex-col gap-3 items-center p-3 rounded-2xl 
                                    bg-black/40 backdrop-blur-xl border border-white/10">

                        {/* Frequency bars */}
                        <div className="flex gap-1 h-12 items-end px-2">
                            <div
                                className="w-1 rounded-full bg-white/60 transition-all duration-100"
                                style={{ height: `${Math.max(15, audioData.bass * 100)}%` }}
                            />
                            <div
                                className="w-1 rounded-full bg-white/40 transition-all duration-100"
                                style={{ height: `${Math.max(15, audioData.mid * 100)}%` }}
                            />
                            <div
                                className="w-1 rounded-full bg-white/30 transition-all duration-100"
                                style={{ height: `${Math.max(15, audioData.treble * 100)}%` }}
                            />
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-white/10" />

                        {!isPlaying ? (
                            <>
                                {/* Mic button */}
                                <button
                                    onClick={() => { onMicrophoneClick(); setIsExpanded(false); }}
                                    className="w-10 h-10 rounded-xl bg-white/5 text-white/70
                                               flex items-center justify-center 
                                               hover:bg-white/15 hover:text-white
                                               transition-all duration-200"
                                    title="Use Microphone"
                                >
                                    {Icons.mic}
                                </button>

                                {/* File button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-10 h-10 rounded-xl bg-white/5 text-white/70
                                               flex items-center justify-center 
                                               hover:bg-white/15 hover:text-white
                                               transition-all duration-200"
                                    title="Open Audio File"
                                >
                                    {Icons.folder}
                                </button>

                                {/* Theme button */}
                                <button
                                    onClick={() => setShowThemes(!showThemes)}
                                    className={`w-10 h-10 rounded-xl text-white/70
                                               flex items-center justify-center 
                                               hover:bg-white/15 hover:text-white
                                               transition-all duration-200
                                               ${showThemes ? 'bg-white/15 text-white' : 'bg-white/5'}`}
                                    title="Color Theme"
                                >
                                    {Icons.palette}
                                </button>

                                {/* Divider */}
                                <div className="w-full h-px bg-white/10" />

                                {/* Close */}
                                <button
                                    onClick={() => { setIsExpanded(false); setShowThemes(false); }}
                                    className="w-8 h-8 rounded-lg bg-white/5 text-white/40
                                               flex items-center justify-center 
                                               hover:bg-white/10 hover:text-white/60
                                               transition-all duration-200"
                                >
                                    {Icons.close}
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Now playing info */}
                                {fileName && (
                                    <div className="text-white/40 text-[10px] uppercase tracking-wider 
                                                    max-w-[80px] truncate text-center">
                                        {fileName}
                                    </div>
                                )}

                                {/* Play/Pause */}
                                <button
                                    onClick={isPaused ? onResume : onPause}
                                    className="w-10 h-10 rounded-xl bg-white/10 text-white
                                               flex items-center justify-center 
                                               hover:bg-white/20
                                               transition-all duration-200"
                                    title={isPaused ? "Resume" : "Pause"}
                                >
                                    {isPaused ? Icons.play : Icons.pause}
                                </button>

                                {/* Change track */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-10 h-10 rounded-xl bg-white/5 text-white/70
                                               flex items-center justify-center 
                                               hover:bg-white/15 hover:text-white
                                               transition-all duration-200"
                                    title="Change Track"
                                >
                                    {Icons.folder}
                                </button>

                                {/* Theme button */}
                                <button
                                    onClick={() => setShowThemes(!showThemes)}
                                    className={`w-10 h-10 rounded-xl text-white/70
                                               flex items-center justify-center 
                                               hover:bg-white/15 hover:text-white
                                               transition-all duration-200
                                               ${showThemes ? 'bg-white/15 text-white' : 'bg-white/5'}`}
                                    title="Color Theme"
                                >
                                    {Icons.palette}
                                </button>

                                {/* Divider */}
                                <div className="w-full h-px bg-white/10" />

                                {/* Stop */}
                                <button
                                    onClick={onStop}
                                    className="w-8 h-8 rounded-lg bg-white/5 text-white/40
                                               flex items-center justify-center 
                                               hover:bg-red-500/30 hover:text-red-400
                                               transition-all duration-200"
                                    title="Stop"
                                >
                                    {Icons.stop}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Theme picker popup */}
                {showThemes && (
                    <div className="absolute right-16 top-0 p-3 rounded-2xl 
                                    bg-black/60 backdrop-blur-xl border border-white/10
                                    flex flex-col gap-2 min-w-[140px]">
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                            Color Theme
                        </div>
                        {colorThemes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => { onThemeChange(theme); setShowThemes(false); }}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-all
                                           ${currentTheme.id === theme.id
                                        ? 'bg-white/15 text-white'
                                        : 'hover:bg-white/10 text-white/70'}`}
                            >
                                <div
                                    className="w-5 h-5 rounded-full border border-white/20"
                                    style={{ background: theme.preview }}
                                />
                                <span className="text-xs">{theme.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Drag & drop hint */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-wider z-10">
                DROP AUDIO FILE ANYWHERE
            </div>
        </>
    );
}
