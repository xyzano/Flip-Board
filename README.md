# 3D Split-Flap Display Board & Visual Editor

A stunning, highly realistic 3D Split-Flap display simulator built with React, React Three Fiber (R3F), and Framer Motion. This project provides a fully interactive Visual Board Editor for creating custom messages, managing playlists, and tweaking visual themes in real time.

## 🚀 Features

- **Hyper-Realistic 3D Rendering**: True physical flap rotation, physics-based shadow calculations, customized lighting, and physical thick bezels mimicking true wall-mounted airport boards.
- **Flat 2D Isometric Mode**: Switch instantly to an engineer's "Flat Mode" giving you a clear, shadowless overview of the letters.
- **Visual Board Editor**: Interactive 8x24 matrix for typing and modifying characters in real time.
- **Drag & Drop Playlist Reordering**: Powered by `framer-motion` for fluid, Apple-like smooth drag-and-drop animation when reorganizing the display loop.
- **Customizable Themes**: Quickly toggle between beautiful Light & Dark aesthetic modes without interrupting flipping sequences.
- **Responsive Layouts**: Smart camera autofitting mechanism to keep everything centered and edge-to-edge perfect.

## 🧰 Tech Stack
- React 18
- React Three Fiber (R3F)
- Three.js
- Framer Motion (for playlist fluid reordering)
- TailwindCSS (Visual Editor UI)
- Vite

## 🛠️ Usage

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development sever:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`. Start designing!

## 💡 Controls

- **Click inside the Visual Board Editor**: Drag the mouse horizontally to select custom blocks.
- **Copy/Trash UI**: Click on the copy button to clone a slide, or the trash to remove it from the loop loop. 
- **View Toggles (Bottom Panel)**: Switch between *Flat Mode* & *3D Mode* and *Light* & *Dark* theme.
- **Fullscreen Button**: Hide the editor entirely and use the simulator strictly as a kiosk / showcase looping display!

## 📝 License
MIT License. Feel free to fork, remix, and use for both personal and commercial projects.
