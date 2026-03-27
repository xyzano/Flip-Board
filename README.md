# 🎞️ Split-Flap Display Dashboard v3.0 🚀


A professional-grade, hyper-realistic **3D Split-Flap Display** simulator and data dashboard. This project transforms a classic mechanical sign into a modern, interactive Control Center with real-time API integrations and a powerful visual editor.

---

## 🔥 Key Features

### 🛠️ Advanced Grid Editor (Excel-Style)
- **Fluid Movement**: Drag and drop selected text blocks across the grid just like in a spreadsheet.
- **Range Selection**: Select multiple cells using **Shift + Click** or mouse dragging.
- **Keyboard Mastery**: Use **Shift + Arrow Keys** to shift content, and **Delete/Backspace** to clear entire sections.
- **Sidebar Integration**: The editor is tucked into the sidebar for a focused, distraction-free 3D workspace.

### 🌐 Live Service Integrations
- **🎵 Spotify Live**: Synchronize with your Spotify account to display current track and artist.
- **📻 Last.fm Sync**: Real-time "Now Playing" updates directly on the mechanical boards.
- **🌦️ Smart Weather**: Live weather fetching for any city via OpenWeatherMap (with custom API key support).
- **🔗 Custom JSON API**: Connect to any external endpoint and poll data automatically every 10 seconds.
- **✈️ Classic Flight Board**: Pre-built templates for that iconic airport departure feel.

### 🎮 Visuals & Physics
- ** Realistic 3D Rendering**: Powered by **Three.js (R3F)** with realistic mechanical animations and lighting.
- **👁️ View Toggles**: Instantly switch between **3D Realistic** and **Flat Isometric** modes.
- **🕹️ Free Look Mode**: Unlock the camera to rotate and inspect the mechanical components from any angle.
- **⚡ Physics Control**: Tweak **Flip Speed** and **Stagger** (delay between flaps) in real-time.

### 🔊 Interactive Audio
- **🌍 Global Radio Browser**: Search and stream thousands of live stations (lofi, jazz, news).
- **⚙️ Procedural Sound**: Realistic mechanical "flap" audio that dynamically adjusts its frequency to match rotation speed.

### 📺 Kiosk & Immersion
- **🧛 Auto-Hide UI**: In Fullscreen mode, the interface vanishes after 2 seconds of inactivity—perfect for wall-mounted displays.
- **📱 Smart Playlist**: Drag and drop carousel items to reorder your dashboard screens.
- **🌗 Theme Engine**: Seamless transition between **Sleek Dark** and **Premium Light** modes with matched typography.

---

## 🧰 Tech Stack

- **Graphics**: React Three Fiber (R3F) + Three.js
- **UI/UX**: TailwindCSS 4.0 + Framer Motion + GSAP
- **Icons**: Lucide-React
- **Build**: Vite + TypeScript

---

## 🎮 How to Control

1. **Custom Mode**: Select the **CUSTOM** template to manually type on the board.
2. **Move Content**: Highlight a region and drag it, or use **Shift + Arrows**.
3. **API Keys**: Enter your OpenWeather, Spotify, or Last.fm keys in the sidebar. They are saved in your **local browser storage** for privacy.
4. **Fullscreen**: Press the Maximize icon to hide the OS UI and enjoy the mechanical simulation.

---

## 📝 License
MIT License. Feel free to fork and build your own mechanical signs!
