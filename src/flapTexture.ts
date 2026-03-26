export const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?@/'".split("");

export function createFlapTexture(theme: 'light' | 'dark' = 'dark') {
  const canvas = document.createElement("canvas");
  const size = 256;
  const cols = 8;
  const rows = 8; // Force Power-Of-Two texture: 2048x2048

  canvas.width = size * cols;
  canvas.height = size * rows;

  const ctx = canvas.getContext("2d")!;
  
  const bgColor = theme === 'light' ? '#f4f4f5' : '#1a1a1a';
  const textColor = theme === 'light' ? '#111111' : '#f0f0f0';
  const splitLineColor = theme === 'light' ? '#c4c4c8' : '#000000';

  // Base background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Generate subtle noise pattern for plastic texture
  const noiseCanvas = document.createElement("canvas");
  noiseCanvas.width = 64; 
  noiseCanvas.height = 64;
  const nCtx = noiseCanvas.getContext("2d")!;
  const imgData = nCtx.createImageData(64, 64);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const val = (Math.random() - 0.5) * (theme === 'light' ? 15 : 20);
    imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = val > 0 ? 255 : 0;
    imgData.data[i+3] = Math.abs(val); // opacity
  }
  nCtx.putImageData(imgData, 0, 0);
  
  const pattern = ctx.createPattern(noiseCanvas, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${size * 0.75}px 'Inter', sans-serif`;

  for (let i = 0; i < FLAP_CHARS.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const cx = col * size;
    const cy = row * size;

    // Draw inner shadow/vignette using linear gradient (top/bottom)
    const vGrad = ctx.createLinearGradient(cx, cy, cx, cy + size);
    vGrad.addColorStop(0, theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.6)');
    vGrad.addColorStop(0.15, 'rgba(0,0,0,0)');
    vGrad.addColorStop(0.85, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.9)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(cx, cy, size, size);

    // Draw text
    const x = cx + size / 2;
    const y = cy + size / 2 + size * 0.05;

    // Soft text shadow for realism
    ctx.shadowColor = theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = theme === 'light' ? 2 : 4;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = textColor;
    ctx.fillText(FLAP_CHARS[i], x, y);
    
    // Clear shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Horizontal split line simulation (thick)
    ctx.fillStyle = splitLineColor;
    ctx.fillRect(cx, cy + size / 2 - 4, size, 8);
  }

  return { canvas, cols, rows };
}
