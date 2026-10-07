import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import rough from 'roughjs';

/**
 * Returns a deterministic 32-bit integer hash from a string.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Creates a seeded pseudo-random number generator (Mulberry32).
 * Returns floats in [0, 1).
 */
function createSeededRng(seed) {
  let s = seed >>> 0 || 123456789;
  return function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Exported utility that returns a canvas as a PNG data URL.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {string|null} PNG data URL or null if canvas is not provided
 */
export function getPostcardPngUrl(canvas) {
  if (!canvas || typeof canvas.toDataURL !== 'function') {
    return null;
  }
  return canvas.toDataURL('image/png');
}

/**
 * Determines a contrasting caption color based on background hex luminance.
 */
function getContrastColor(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') return '#222222';
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#222222' : '#f8f8f8';
}

/**
 * PostcardCanvas component
 * Renders hand-sketched generative art onto an HTML canvas using rough.js.
 */
const PostcardCanvas = forwardRef(function PostcardCanvas({ postcard, text = '' }, ref) {
  const canvasRef = useRef(null);

  // Expose canvas helper methods via forwarded ref if used
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    toDataURL: () => getPostcardPngUrl(canvasRef.current),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !postcard) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Extract postcard parameters
    const {
      palette = ['#ffffff', '#333333', '#666666', '#999999'],
      shapes = 'waves',
      density = 0.5,
      caption = '',
    } = postcard;

    // Palette: 1st color is background, other 3 colors for shapes
    const bgColor = palette[0] || '#ffffff';
    const shapeColors = [
      palette[1] || '#444444',
      palette[2] || '#777777',
      palette[3] || '#aaaaaa',
    ];

    // Seeded random generator based on input text
    const seedValue = hashString(text || caption || 'postcard-seed');
    const rng = createSeededRng(seedValue);

    // Helper to generate positive integer seeds for rough.js shape calls
    const nextRoughSeed = () => Math.floor(rng() * 1000000) + 1;

    // Helper to pick random shape color from the remaining 3 palette colors
    const pickColor = () => shapeColors[Math.floor(rng() * shapeColors.length)];

    // Initialize rough.js canvas wrapper
    const rc = rough.canvas(canvas);

    // 1. Clear and fill background with 1st palette color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Sketchy background border
    rc.rectangle(12, 12, width - 24, height - 24, {
      stroke: pickColor(),
      strokeWidth: 2,
      roughness: 1.2,
      seed: nextRoughSeed(),
    });

    // Clamp density between 0 and 1
    const clampedDensity = Math.max(0, Math.min(1, typeof density === 'number' ? density : 0.5));

    // 2. Draw generative art based on the shapes mode
    switch (shapes) {
      case 'waves': {
        // Density controls number of wavy ribbon layers (3 to 14 layers)
        const waveCount = Math.floor(3 + clampedDensity * 11);
        const ySpacing = (height - 80) / waveCount;

        for (let i = 0; i < waveCount; i++) {
          const color = pickColor();
          const baseY = 50 + i * ySpacing;
          const amplitude = 20 + rng() * 35;
          const points = [];
          const step = 45;

          for (let x = 20; x <= width - 20; x += step) {
            const waveY = baseY + Math.sin((x / (width - 40)) * Math.PI * (2 + (i % 3))) * amplitude;
            points.push([x, waveY]);
          }

          rc.curve(points, {
            stroke: color,
            strokeWidth: 2 + rng() * 2,
            roughness: 1.5,
            seed: nextRoughSeed(),
          });

          // Draw fill beneath alternate waves
          if (i % 2 === 0 && points.length > 2) {
            const polygonPoints = [
              [points[0][0], height - 30],
              ...points,
              [points[points.length - 1][0], height - 30],
            ];
            rc.polygon(polygonPoints, {
              fill: color,
              stroke: 'transparent',
              fillStyle: 'hachure',
              fillWeight: 1,
              hachureGap: 12 - clampedDensity * 6,
              roughness: 1.8,
              seed: nextRoughSeed(),
            });
          }
        }
        break;
      }

      case 'circles': {
        // Density controls number of circles (5 to 40 circles)
        const count = Math.floor(5 + clampedDensity * 35);
        for (let i = 0; i < count; i++) {
          const cx = 50 + rng() * (width - 100);
          const cy = 50 + rng() * (height - 130);
          const diameter = 30 + rng() * (70 + (1 - clampedDensity) * 60);
          const color = pickColor();
          const fillStyles = ['hachure', 'dots', 'cross-hatch', 'zigzag'];
          const fillStyle = fillStyles[Math.floor(rng() * fillStyles.length)];

          rc.circle(cx, cy, diameter, {
            fill: color,
            stroke: color,
            strokeWidth: 1.5,
            fillStyle,
            fillWeight: 1.2,
            hachureAngle: rng() * 180,
            hachureGap: 6 + rng() * 8,
            roughness: 1.6,
            seed: nextRoughSeed(),
          });
        }
        break;
      }

      case 'mountains': {
        // Density controls number of overlapping mountain ridges (3 to 8 ridges)
        const ridges = Math.floor(3 + clampedDensity * 5);
        for (let r = 0; r < ridges; r++) {
          const color = pickColor();
          const baseY = 200 + (r / ridges) * (height - 260);
          const peakCount = Math.floor(3 + rng() * 4);
          const ridgePoints = [[20, height - 30]];

          for (let p = 0; p <= peakCount; p++) {
            const px = 20 + (p / peakCount) * (width - 40);
            const py = p % 2 === 1 ? baseY - (40 + rng() * 80) : baseY + (10 + rng() * 20);
            ridgePoints.push([px, py]);
          }

          ridgePoints.push([width - 20, height - 30]);

          rc.polygon(ridgePoints, {
            fill: color,
            stroke: color,
            strokeWidth: 2,
            fillStyle: r % 2 === 0 ? 'hachure' : 'cross-hatch',
            fillWeight: 1.2,
            hachureAngle: 60 - r * 15,
            hachureGap: 7 + r * 2,
            roughness: 1.7,
            seed: nextRoughSeed(),
          });
        }
        break;
      }

      case 'stars': {
        // Density controls count of starry bursts and shapes (8 to 45 stars)
        const starCount = Math.floor(8 + clampedDensity * 37);

        for (let i = 0; i < starCount; i++) {
          const cx = 50 + rng() * (width - 100);
          const cy = 40 + rng() * (height - 120);
          const outerR = 12 + rng() * 26;
          const innerR = outerR * (0.35 + rng() * 0.15);
          const points = [];
          const color = pickColor();
          const spikes = 5;

          for (let s = 0; s < spikes * 2; s++) {
            const r = s % 2 === 0 ? outerR : innerR;
            const angle = (s * Math.PI) / spikes - Math.PI / 2;
            points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
          }

          rc.polygon(points, {
            fill: color,
            stroke: color,
            strokeWidth: 1.5,
            fillStyle: 'solid',
            roughness: 1.4,
            seed: nextRoughSeed(),
          });

          // Add subtle sparkle cross lines
          if (rng() > 0.4) {
            rc.line(cx - outerR * 1.4, cy, cx + outerR * 1.4, cy, {
              stroke: color,
              strokeWidth: 1,
              roughness: 1.2,
              seed: nextRoughSeed(),
            });
            rc.line(cx, cy - outerR * 1.4, cx, cy + outerR * 1.4, {
              stroke: color,
              strokeWidth: 1,
              roughness: 1.2,
              seed: nextRoughSeed(),
            });
          }
        }
        break;
      }

      case 'grid': {
        // Density controls grid granularity (columns 4-16, rows 3-12)
        const cols = Math.floor(4 + clampedDensity * 12);
        const rows = Math.floor(3 + clampedDensity * 9);
        const cellW = (width - 60) / cols;
        const cellH = (height - 110) / rows;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = 30 + col * cellW;
            const y = 30 + row * cellH;
            const color = pickColor();

            // Draw sketchy cell border
            rc.rectangle(x, y, cellW, cellH, {
              stroke: color,
              strokeWidth: 1.2,
              roughness: 1.4,
              seed: nextRoughSeed(),
            });

            // Fill select cells with hatching based on random chance
            if (rng() > 0.45) {
              rc.rectangle(x + 3, y + 3, cellW - 6, cellH - 6, {
                fill: color,
                stroke: 'transparent',
                fillStyle: rng() > 0.5 ? 'hachure' : 'cross-hatch',
                fillWeight: 1,
                hachureGap: 6,
                roughness: 1.5,
                seed: nextRoughSeed(),
              });
            }
          }
        }
        break;
      }

      default:
        break;
    }

    // 3. Draw caption in the bottom corner using handwriting-style font
    if (caption && caption.trim()) {
      const textColor = getContrastColor(bgColor);
      ctx.save();
      ctx.font = 'italic 24px "Caveat", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(caption.trim(), 35, height - 25);
      ctx.restore();
    }
  }, [postcard, text]);

  return (
    <div className="postcard-canvas-container" style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '3 / 2',
          display: 'block',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
});

export default PostcardCanvas;
