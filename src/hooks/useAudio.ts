'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface AudioData {
  frequencyData: Uint8Array;
  averageFrequency: number;
  bass: number;
  mid: number;
  treble: number;
  kick: number;
  snare: number;
  hihat: number;
  impact: number;
}

interface UseAudioReturn {
  audioData: AudioData;
  isPlaying: boolean;
  isPaused: boolean;
  currentSource: 'none' | 'mic' | 'file';
  fileName?: string;
  startMicrophone: () => Promise<void>;
  startFile: (file: File) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const FFT_SIZE = 2048; // Higher resolution for better frequency separation

export function useAudio(): UseAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Previous frame data for transient detection
  const prevBassRef = useRef(0);
  const prevMidRef = useRef(0);
  const prevTrebleRef = useRef(0);
  const prevEnergyRef = useRef(0);

  // AUTOMATIC GAIN CONTROL - tracks average levels over time
  const avgLevelRef = useRef(0.1);
  const peakLevelRef = useRef(0.3);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [currentSource, setCurrentSource] = useState<'none' | 'mic' | 'file'>('none');
  const [audioData, setAudioData] = useState<AudioData>({
    frequencyData: new Uint8Array(FFT_SIZE / 2),
    averageFrequency: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    kick: 0,
    snare: 0,
    hihat: 0,
    impact: 0,
  });

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      // Very low smoothing for maximum transient sensitivity
      analyserRef.current.smoothingTimeConstant = 0.3;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
    }
    return {
      audioContext: audioContextRef.current,
      analyser: analyserRef.current!,
    };
  }, []);

  const analyze = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // With 2048 FFT at 44.1kHz, each bin is ~21.5Hz
    const kickEnd = 8;       // 0-172Hz (sub bass, kick)
    const bassEnd = 16;      // 172-344Hz (bass)
    const lowMidEnd = 40;    // 344-860Hz (low mids)
    const midEnd = 100;      // 860-2150Hz (mids, snare body)
    const highMidEnd = 240;  // 2150-5160Hz (high mids, snare crack)
    const trebleEnd = 400;   // 5160-8600Hz (highs, hats)

    let kickSum = 0, bassSum = 0, snareSum = 0, trebleSum = 0, total = 0;

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i];
      total += value;

      if (i < kickEnd) {
        kickSum += value;
      } else if (i < bassEnd) {
        bassSum += value;
      } else if (i < midEnd) {
        snareSum += value;
      } else if (i < trebleEnd) {
        trebleSum += value;
      }
    }

    // Raw normalized values
    const rawKick = kickSum / kickEnd / 255;
    const rawBass = (kickSum + bassSum) / bassEnd / 255;
    const rawMid = snareSum / (midEnd - bassEnd) / 255;
    const rawTreble = trebleSum / (trebleEnd - midEnd) / 255;
    const rawEnergy = total / bufferLength / 255;

    // ========================================
    // AUTOMATIC GAIN CONTROL
    // Adapts to track loudness over time
    // ========================================

    // Slowly track average level (very slow adaptation)
    avgLevelRef.current = avgLevelRef.current * 0.995 + rawEnergy * 0.005;

    // Track peak level (medium adaptation)
    if (rawEnergy > peakLevelRef.current) {
      peakLevelRef.current = rawEnergy;
    } else {
      peakLevelRef.current = peakLevelRef.current * 0.999 + rawEnergy * 0.001;
    }

    // Calculate dynamic gain based on track loudness
    const avgLevel = Math.max(0.08, avgLevelRef.current);
    const peakLevel = Math.max(0.15, peakLevelRef.current);
    const dynamicGain = 0.2 / avgLevel; // Lower target - less sensitive
    const gainCap = 0.8 / peakLevel;
    const gain = Math.min(dynamicGain, gainCap, 3.5); // Lower max gain

    // Apply automatic gain
    const normalizedKick = rawKick * gain;
    const normalizedBass = rawBass * gain;
    const normalizedMid = rawMid * gain;
    const normalizedTreble = rawTreble * gain;
    const normalizedEnergy = rawEnergy * gain;

    // ========================================
    // TRANSIENT DETECTION - more sensitive
    // ========================================
    const kickTransient = Math.max(0, normalizedKick - prevBassRef.current * 0.6);
    const snareTransient = Math.max(0, normalizedMid - prevMidRef.current * 0.5);
    const hihatTransient = Math.max(0, normalizedTreble - prevTrebleRef.current * 0.4);
    const impactTransient = Math.max(0, normalizedEnergy - prevEnergyRef.current * 0.5);

    // Update previous values - SLOWER for smoother motion
    prevBassRef.current = prevBassRef.current * 0.4 + normalizedKick * 0.6;
    prevMidRef.current = prevMidRef.current * 0.4 + normalizedMid * 0.6;
    prevTrebleRef.current = prevTrebleRef.current * 0.4 + normalizedTreble * 0.6;
    prevEnergyRef.current = prevEnergyRef.current * 0.4 + normalizedEnergy * 0.6;

    // Final values with stricter caps
    const bass = Math.min(normalizedBass * 0.7, 0.4);
    const mid = Math.min(normalizedMid * 0.6, 0.35);
    const treble = Math.min(normalizedTreble * 0.5, 0.3);

    // Transients - higher threshold, less sensitive
    const kickThresh = Math.max(0, kickTransient - 0.08);
    const snareThresh = Math.max(0, snareTransient - 0.06);
    const hihatThresh = Math.max(0, hihatTransient - 0.05);
    const impactThresh = Math.max(0, impactTransient - 0.06);

    const kick = Math.min(kickThresh * 3.0, 0.5);
    const snare = Math.min(snareThresh * 2.5, 0.45);
    const hihat = Math.min(hihatThresh * 2.0, 0.35);
    const impact = Math.min(impactThresh * 2.0, 0.45);

    setAudioData({
      frequencyData: dataArray,
      averageFrequency: Math.min(normalizedEnergy, 0.5),
      bass,
      mid,
      treble,
      kick,
      snare,
      hihat,
      impact,
    });

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, []);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    // Reset AGC on stop
    avgLevelRef.current = 0.1;
    peakLevelRef.current = 0.3;
  }, []);

  const startMicrophone = useCallback(async () => {
    try {
      cleanup();
      const { audioContext, analyser } = initAudioContext();

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      sourceRef.current = audioContext.createMediaStreamSource(stream);
      sourceRef.current.connect(analyser);

      setIsPlaying(true);
      setCurrentSource('mic');
      analyze();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  }, [initAudioContext, analyze, cleanup]);

  const startFile = useCallback((file: File) => {
    cleanup();
    const { audioContext, analyser } = initAudioContext();

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audioElementRef.current = audio;

    audio.addEventListener('canplay', async () => {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audio);
        sourceRef.current.connect(analyser);
        analyser.connect(audioContext.destination);
      }

      audio.play();
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentSource('file');
      setFileName(file.name);
      analyze();
    });
  }, [initAudioContext, analyze, cleanup]);

  const pause = useCallback(() => {
    if (audioElementRef.current && !isPaused) {
      audioElementRef.current.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  const resume = useCallback(() => {
    if (audioElementRef.current && isPaused) {
      audioElementRef.current.play();
      setIsPaused(false);
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSource('none');
    setFileName(undefined);
    setAudioData({
      frequencyData: new Uint8Array(FFT_SIZE / 2),
      averageFrequency: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      kick: 0,
      snare: 0,
      hihat: 0,
      impact: 0,
    });
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [cleanup]);

  return { audioData, isPlaying, isPaused, currentSource, fileName, startMicrophone, startFile, pause, resume, stop };
}
