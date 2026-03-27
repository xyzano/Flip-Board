# 3D Split-Flap Display Dashboard & Editor 2.0 🚀

A professional-grade, highly realistic 3D Split-Flap display simulator and control dashboard built with **React**, **Three.js (R3F)**, and **Framer Motion**. This project transforms a simple simulator into a powerful data visualization tool with real-time API integrations.

## ✨ Key Features

- **Advanced Template System**: Each screen in your playlist can be customized independently:
  - ✈️ **Flights**: Real-time mock departure board.
  - 🎵 **Spotify**: Dynamic layout for music playback.
  - 🌦️ **Weather**: Live weather fetching via *Open-Meteo API* for any city.
  - 🔗 **External API**: Fetch custom messages from any JSON endpoint (supports polling).
- **Interactive Visual Editor**: 
  - **Sidebar Settings**: A new dedicated panel for screen templates, radio modes, and physics overrides (Flip Speed, Stagger).
  - **Bottom Filmstrip**: Horizontal navigation with drag & drop reordering using *Framer Motion*.
  - **Global Controls**: High-density bottom bar for loop timing, master volume, and view modes.
- **Live Radio & Audio engine**:
  - **Radio Browser**: Search and stream thousands of global radio stations directly within the dashboard.
  - **Procedural Audio**: Realistic mechanical "flap" sounds with volume control and dynamic speed matching.
- **Hyper-Realistic 3D Rendering**: 
  - Switch between **Realistic 3D** (R3F) and **Flat Isometric** (Canvas-like) views.
  - Smart camera autofitting and adaptive lighting for Light/Dark modes.
- **Kiosk & Fullscreen Ready**: Hide the editor entirely for a pure, distraction-free display loop.

## 🧰 Tech Stack

- **Graphics**: React Three Fiber (R3F) + Three.js
- **Animations**: Framer Motion & GSAP
- **UI**: TailwindCSS 4.0 + Lucide Icons
- **APIs**: Open-Meteo, Radio-Browser.info, Custom JSON Fetcher
- **Build**: Vite + TypeScript

## 🛠️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run locally**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## 🎮 Dashboard Controls

- **Open/Close Editor**: Toggle the slide-up modal using the button at the bottom center.
- **Screen Navigation**: Click on any slide in the bottom filmstrip to flip the board to that screen. Drag to reorder.
- **Templates**: Select a template in the right sidebar to instantly populate the board with live data.
- **Radio Mode**: Search for tags like "lofi" or "jazz" and hit play to stream live audio.
- **Physics**: Tweak 'Flip Speed' and 'Stagger' in the settings to change how the mechanical board behaves.

## 📝 License
MIT License. Feel free to fork, remix, and use for both personal and commercial projects.
