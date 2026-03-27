# 3D Split-Flap Display Dashboard & Editor 3.0 🚀

A professional-grade, highly realistic 3D Split-Flap display simulator and control dashboard built with **React**, **Three.js (R3F)**, and **Framer Motion**. This project transforms a simple simulator into a powerful data visualization tool with real-time API integrations and an advanced grid editor.

## ✨ Key Features (v3.0)

- **Advanced Template System**: Each screen in your playlist can be customized independently:
  - ✈️ **Flights**: Real-time mock departure board.
  - 🎵 **Spotify**: Dynamic layout for music playback via Spotify API.
  - 🌦️ **Weather**: Live weather fetching via *OpenWeatherMap API* with custom API key support.
  - 🔗 **External API**: Fetch custom messages from *any* JSON endpoint with automated polling.
  - 📻 **Last.fm Sync**: Real-time "Now Playing" synchronization from your Last.fm profile.
- **Excel-Style Visual Editor**: 
  - **Sidebar Grid**: A dedicated, high-density editor moved to the sidebar for a clean 3D workspace.
  - **Area Movement**: Drag & drop selected text blocks across the grid like in a spreadsheet.
  - **Multi-Selection**: Selection ranges via mouse drag or **Shift + Click**.
  - **Keyboard Mastery**: **Shift + Arrows** to shift content, **Delete/Backspace** to clear areas.
- **Live Radio & Audio Engine**:
  - **Radio Browser**: Search and stream thousands of global radio stations directly within the dashboard.
  - **Procedural Audio**: Realistic mechanical "flap" sounds with volume control and dynamic speed matching.
- **Hyper-Realistic 3D Rendering**: 
  - **Free Look Mode**: Unlock the camera to rotate and explore the mechanical board in 3D.
  - **Smart Rendering**: Adaptive lighting and theme-aware UI (Light/Dark modes).
- **Kiosk & Immersive Mode**: 
  - **Auto-Hide UI**: Panels automatically disappear in Fullscreen after 2 seconds of inactivity.
  - **Carousel Previews**: Larger bottom navigation with real-time grid state visualizations.

## 🧰 Tech Stack

- **Graphics**: React Three Fiber (R3F) + Three.js
- **Animations**: Framer Motion & GSAP
- **UI**: TailwindCSS 4.0 + Lucide Icons
- **APIs**: OpenWeatherMap, Radio-Browser.info, Spotify, Last.fm
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

- **Custom Editor**: Select the **CUSTOM** template and use the sidebar grid to type manually.
- **Move Content**: Select a block of text and drag it with the mouse or use **Shift + Arrow Keys**.
- **Config Panels**: Enter your own API keys for **Weather**, **Spotify**, or **Last.fm** directly in the sidebar; they are saved locally in your browser.
- **Physics (Psychic)**: Tweak 'Flip Speed' and 'Stagger' in the settings to change how the mechanical board behaves.
- **Fullscreen**: Click the expand icon to enter immersive mode where the UI auto-hides for a pure display experience.

## 📝 License
MIT License. Feel free to fork, remix, and use for both personal and commercial projects.
