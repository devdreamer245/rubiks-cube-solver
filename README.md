# Rubik's Cube Solver 🧩

An interactive 3D Rubik's Cube Solver built with React, TypeScript, Three.js, and Kociemba's Two-Phase Algorithm. Features a guided webcam scanner, multi-layer physical state validator, and interactive step-by-step 3D playback.

## ✨ Features

- **Optimal Solving Engine:** Powered by Kociemba's Two-Phase Algorithm ($\le 20$ moves) running in a dedicated Web Worker for zero UI latency.
- **Interactive 3D Visualizer:** Real-time 3D cube rendered with Three.js / React Three Fiber, featuring smooth layer turn animations and step-by-step playback controls.
- **Physical Legality Validator:** Validates 54-facelet configurations, detecting center piece conflicts, impossible edge/corner combinations, and parity violations.
- **Interactive 2D Net Editor:** Click-and-paint unfolded cube net for manual state entry and scan verification.
- **Guided Webcam Scanner:** Built with HTML5 Canvas and WebRTC for browser-based facelet color recognition using center-calibrated HSV clustering.

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **3D Graphics:** Three.js / `@react-three/fiber` / `@react-three/drei`
- **Solving Core:** Kociemba Two-Phase Algorithm (`min2phase` / `cubejs`) via Web Workers
- **Vision:** WebRTC (`getUserMedia`) + HTML5 Canvas 2D + HSV Color Clustering
- **Testing:** Vitest

## 📋 Architecture & Plan

For complete technical specifications, mathematical foundations, and milestone roadmaps, see the project architectural plan.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit and permutation tests
npm run test
```

## 📄 License

MIT
