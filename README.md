# 🌌 Aura - 3D Audio-Reactive Visualizer

A real-time 3D audio visualizer that transforms music into an immersive particle universe. Built with Next.js, Three.js, and the Web Audio API.

![Aura Demo](./demo.png)

## ✨ Features

- **Real-time Audio Analysis** - FFT-powered frequency decomposition into bass, mid, and treble bands
- **Reactive 3D Particles** - 6,000 particles that pulse, wave, and shift color based on the music
- **Microphone Input** - Visualize live audio from your mic
- **File Upload** - Drop in your favorite MP3s
- **Smooth 60fps** - Optimized with React Three Fiber and additive blending
- **Glassmorphism UI** - Modern, translucent control panel

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [Three.js](https://threejs.org/) | 3D WebGL rendering |
| [React Three Fiber](https://r3f.docs.pmnd.rs/) | React renderer for Three.js |
| [@react-three/drei](https://drei.pmnd.rs/) | Useful helpers (OrbitControls, Stars) |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Real-time audio analysis |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx         # Main entry point
│   ├── layout.tsx       # Root layout with metadata
│   └── globals.css      # Global styles
├── components/
│   ├── Scene.tsx        # R3F Canvas wrapper
│   ├── Particles.tsx    # Reactive particle system
│   └── Controls.tsx     # UI control panel
└── hooks/
    └── useAudio.ts      # Web Audio API hook
```

## 🎨 How It Works

1. **Audio Input** → User provides audio via microphone or file upload
2. **FFT Analysis** → `useAudio` hook runs real-time frequency analysis
3. **Data Mapping** → Bass, mid, and treble values are extracted
4. **3D Reactivity** → Particles displace and change color based on frequency bands
5. **Rendering** → Three.js renders at 60fps with additive blending

## 📦 Deploy to Vercel

```bash
npm run build
vercel deploy
```

## 📝 License

MIT
