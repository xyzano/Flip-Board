export const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?@/'-*".split("");

export function createFlapTexture(theme: 'light' | 'dark' = 'dark', isFlat: boolean = false, customTextColor?: string) {
  const canvas = document.createElement("canvas");
  const size = 256;
  const cols = 8;
  const rows = 8; // Max 64 slots, we have 44 chars here

  canvas.width = size * cols;
  canvas.height = size * rows;

  const ctx = canvas.getContext("2d")!;
  
  const bgColor = theme === 'light' ? '#ffffff' : '#111111'; // Pure contrast for flat
  const textColor = customTextColor || (theme === 'light' ? '#000000' : '#ffffff');
  const splitLineColor = theme === 'light' ? '#dddddd' : '#222222';

  // Base background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!isFlat) {
    const noiseCanvas = document.createElement("canvas");
    noiseCanvas.width = 64; 
    noiseCanvas.height = 64;
    const nCtx = noiseCanvas.getContext("2d")!;
    const imgData = nCtx.createImageData(64, 64);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = (Math.random() - 0.5) * (theme === 'light' ? 15 : 20);
      imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = val > 0 ? 255 : 0;
      imgData.data[i+3] = Math.abs(val);
    }
    nCtx.putImageData(imgData, 0, 0);
    
    const pattern = ctx.createPattern(noiseCanvas, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${size * 0.85}px 'Inter', sans-serif`;

  for (let i = 0; i < FLAP_CHARS.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = col * size;
    const cy = row * size;
    
    const char = FLAP_CHARS[i];

    if (char === '*') {
      // Solid orange marker card
      ctx.fillStyle = '#ea580c'; // Vibrant Orange
      ctx.fillRect(cx, cy, size, size);
      
      // Still need split line
      ctx.fillStyle = isFlat ? '#ea580c' : '#9a3412'; // Darker orange split if 3D, invisible if flat
      if (!isFlat) {
         ctx.fillRect(cx, cy + size / 2 - 1.5, size, 3);
      }
      continue; // Skip text rendering for orange card
    }

    if (!isFlat) {
      // Standard card inner shadow/vignette
      const vGrad = ctx.createLinearGradient(cx, cy, cx, cy + size);
      vGrad.addColorStop(0, theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.6)');
      vGrad.addColorStop(0.15, 'rgba(0,0,0,0)');
      vGrad.addColorStop(0.85, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.9)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(cx, cy, size, size);
    }

    // Draw text
    const x = cx + size / 2;
    const y = cy + size / 2 + size * 0.05;

    if (!isFlat) {
      ctx.shadowColor = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = theme === 'light' ? 2 : 4;
      ctx.shadowOffsetY = 2;
    }
    
    ctx.fillStyle = textColor;
    ctx.fillText(char, x, y);
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    if (!isFlat) {
      ctx.fillStyle = splitLineColor;
      ctx.fillRect(cx, cy + size / 2 - 1.5, size, 3);
    } else {
      ctx.fillStyle = splitLineColor;
      ctx.fillRect(cx, cy + size / 2 - 0.5, size, 1);
    }
  }

  return { canvas, cols, rows };
}
