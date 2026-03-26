# 3D Split-Flap Board Simulator

A highly realistic, fully interactive 3D mechanical split-flap display built with **React**, **Three.js** (via react-three-fiber), and physics-based **Web Audio API** synthesis.

## Core Features

- **3D Mechanical Rendering:** Every single character is a simulated mechanical module equipped with a drum, an axle, dynamic casing, and "louvers" simulating the stack of paper flaps. High-resolution shadows complete the deep, realistic look.
- **Physics-Informed Flap Mechanics:** The animation operates non-linearly (`Math.pow(progress, 4)`), mimicking the mechanical resistance and sudden snap-release effect of a real card falling over. The rotary speed dynamically accelerates and decelerates according to distance precisely simulating a DC motor. 
- **Percussive Flap Sound Synthesis:** There are NO static sound files used! The plastic click is synthetically generated via the Web Audio API utilizing bandpass-filtered Noise Bursts coupled with deep frequency Triangle thumps for maximum realism and non-repeating acoustic behavior. The sounds are routed into a polyphonic mixer bounded to prevent digital clipping when large arrays overlap. 
- **Dark/Light Themes:** The board supports dynamically rendering characters against bright airport aesthetics or deep black cinematic backgrounds, mapping the text vignette and background noise accurately.
- **Gridded Macro-Editor:** Replaces mundane text fields with a 6x20 matrix editor. Easily type globally using full keyboard navigation, select sweeping blocks using Shift + Click, mass-delete or drag-and-drop chunks of text directly inside the editor like modern spreadsheet software.
- **Slide Playlist Mode:** Each created slide is visualized in a "control drawer" using dynamic miniature projections of the active slide. Quickly drop, drag, delete, or jump to custom slides in real time.
- **Automatic Camera Framing:** Never worry about responsiveness. The orthographic camera automatically measures viewport dimensions relative to the grid extent and calibrates its FoV distance dynamically.

## Technology Stack
- Vite
- React
- React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- Three.js
- TailwindCSS
- Lucide React (Icons)

## Quick Start Configuration
```bash
npm install
npm run dev
```

Designed to look naturally chaotic yet strictly beautiful. 
> Perfect for background kiosks or large displays. Uses native pointer locks and requests Fullscreen implicitly based on interaction.
