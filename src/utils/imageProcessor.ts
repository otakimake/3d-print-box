/**
 * Utilities for processing deboss / emboss graphics onto the 3D lid surface
 */

export interface HeightmapResult {
  width: number;
  height: number;
  data: Float32Array; // values between 0 (flat) and 1 (fully debossed)
}

// Preset vector symbols rendered cleanly onto 2D canvas
export const PRESET_ICONS = [
  { id: 'bambu', name: 'Bambu Lab Logo', category: '3D Printing' },
  { id: 'voronoi', name: 'Hexagon Honeycomb', category: 'Patterns' },
  { id: 'gear', name: 'Precision Gear', category: 'Mechanical' },
  { id: 'sd-card', name: 'MicroSD / SD Vault', category: 'Tech' },
  { id: 'biohazard', name: 'Hazard / Warning', category: 'Symbols' },
  { id: 'carbon', name: 'Carbon Fiber Weave', category: 'Patterns' },
  { id: 'star', name: 'Geometric Star', category: 'Symbols' },
  { id: 'tool', name: 'Wrench & Screws', category: 'Hardware' },
  { id: 'circuit', name: 'Cyberpunk Circuit', category: 'Tech' },
];

export async function generateHeightmap(
  type: 'image' | 'preset' | 'text',
  resolution: number,
  options: {
    imageDataUrl?: string;
    presetId?: string;
    text?: string;
    fontFamily?: string;
    invert?: boolean;
  }
): Promise<HeightmapResult> {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    return { width: resolution, height: resolution, data: new Float32Array(resolution * resolution) };
  }

  // Base background: black (0)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, resolution, resolution);

  if (type === 'preset' && options.presetId) {
    drawPreset(ctx, options.presetId, resolution);
  } else if (type === 'text' && options.text) {
    drawText(ctx, options.text, options.fontFamily || 'sans-serif', resolution);
  } else if (type === 'image' && options.imageDataUrl) {
    await drawImage(ctx, options.imageDataUrl, resolution);
  }

  const imgData = ctx.getImageData(0, 0, resolution, resolution);
  const rawData = imgData.data;
  const heightmap = new Float32Array(resolution * resolution);

  for (let i = 0; i < heightmap.length; i++) {
    const r = rawData[i * 4];
    const g = rawData[i * 4 + 1];
    const b = rawData[i * 4 + 2];
    const a = rawData[i * 4 + 3] / 255;
    
    // Convert to luminance
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255 * a;
    heightmap[i] = Math.max(0, Math.min(1, lum));
  }

  return {
    width: resolution,
    height: resolution,
    data: heightmap,
  };
}

function drawPreset(ctx: CanvasRenderingContext2D, presetId: string, size: number) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  const c = size / 2;
  const r = size * 0.4;

  ctx.save();
  if (presetId === 'bambu') {
    // Bambu Lab inspired leaf / geometric logo
    const s = size * 0.15;
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw 4 distinct angled bamboo segments
    const drawBlock = (x: number, y: number, w: number, h: number, skew: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.transform(1, 0, skew, 1, 0, 0);
      ctx.fillRect(-w/2, -h/2, w, h);
      ctx.restore();
    };

    drawBlock(c - s * 1.1, c - s * 1.2, s * 0.8, s * 1.4, -0.2);
    drawBlock(c + s * 1.1, c - s * 1.2, s * 0.8, s * 1.4, 0.2);
    drawBlock(c - s * 1.1, c + s * 1.2, s * 0.8, s * 1.4, 0.2);
    drawBlock(c + s * 1.1, c + s * 1.2, s * 0.8, s * 1.4, -0.2);
  } else if (presetId === 'voronoi') {
    // Hexagonal honeycomb grid
    const hexRadius = size * 0.09;
    const dx = hexRadius * 1.732;
    const dy = hexRadius * 1.5;
    ctx.lineWidth = size * 0.025;

    for (let y = -size * 0.2; y < size * 1.2; y += dy) {
      const row = Math.round(y / dy);
      const xOffset = (row % 2 === 0) ? 0 : dx / 2;
      for (let x = -size * 0.2; x < size * 1.2; x += dx) {
        drawHexagon(ctx, x + xOffset, y, hexRadius * 0.85);
      }
    }
  } else if (presetId === 'gear') {
    // Mechanical gear
    const teeth = 8;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const radius = i % 2 === 0 ? r : r * 0.75;
      const x = c + Math.cos(angle) * radius;
      const y = c + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Center hole
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(c, c, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  } else if (presetId === 'sd-card') {
    // SD Card icon
    const w = size * 0.55;
    const h = size * 0.7;
    const x = c - w / 2;
    const y = c - h / 2;
    const cut = size * 0.15;

    ctx.beginPath();
    ctx.moveTo(x, y + cut);
    ctx.lineTo(x + cut, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    // Pin notches
    ctx.globalCompositeOperation = 'destination-out';
    const pinW = w * 0.1;
    const pinH = h * 0.25;
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(x + w * 0.2 + i * (pinW + w * 0.05), y + h * 0.08, pinW, pinH);
    }
    ctx.globalCompositeOperation = 'source-over';
  } else if (presetId === 'biohazard') {
    // Caution biohazard symbol
    ctx.lineWidth = size * 0.06;
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      const cx = c + Math.cos(angle) * r * 0.45;
      const cy = c + Math.sin(angle) * r * 0.45;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(c, c, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (presetId === 'circuit') {
    // Cyberpunk circuit lines
    ctx.lineWidth = size * 0.04;
    ctx.lineCap = 'round';
    const lines = [
      [[c - r, c], [c - r*0.3, c], [c, c - r*0.3], [c + r, c - r*0.3]],
      [[c - r*0.7, c - r*0.5], [c - r*0.2, c - r*0.5], [c + r*0.3, c], [c + r*0.8, c]],
      [[c - r*0.6, c + r*0.5], [c, c + r*0.5], [c + r*0.4, c + r*0.1], [c + r*0.8, c + r*0.1]],
    ];
    lines.forEach(path => {
      ctx.beginPath();
      path.forEach(([x, y], idx) => {
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      const last = path[path.length - 1];
      ctx.beginPath();
      ctx.arc(last[0], last[1], size * 0.05, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // Default Star / Diamond
    ctx.beginPath();
    ctx.moveTo(c, c - r);
    ctx.lineTo(c + r, c);
    ctx.lineTo(c, c + r);
    ctx.lineTo(c - r, c);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawText(ctx: CanvasRenderingContext2D, text: string, font: string, size: number) {
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Calculate best font size
  const fontSize = Math.min(size * 0.28, (size * 0.8) / Math.max(1, text.length * 0.45));
  ctx.font = `bold ${fontSize}px ${font}, system-ui, sans-serif`;
  ctx.fillText(text, size / 2, size / 2);
}

function drawImage(ctx: CanvasRenderingContext2D, src: string, size: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw centered with aspect ratio containment
      const hRatio = (size * 0.85) / img.width;
      const vRatio = (size * 0.85) / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = (size - img.width * ratio) / 2;
      const centerShiftY = (size - img.height * ratio) / 2;
      
      ctx.drawImage(img, 0, 0, img.width, img.height,
        centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      resolve();
    };
    img.onerror = () => {
      // Fallback text if image fails to load
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5);
      resolve();
    };
    img.src = src;
  });
}
