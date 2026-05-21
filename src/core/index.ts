import { RGB } from '../types';

export function getCanvasPixels(canvas: HTMLCanvasElement): ImageData | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function generateGrayscaleImage(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  const canvasGray = document.createElement('canvas');
  canvasGray.width = canvas.width;
  canvasGray.height = canvas.height;
  const ctxGray = canvasGray.getContext('2d');
  
  if (!ctxGray) return '';

  for (let i = 0; i < data.length; i += 4) {
    const avg = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = avg; // R
    data[i + 1] = avg; // G
    data[i + 2] = avg; // B
    // alpha remains same
  }
  
  ctxGray.putImageData(imageData, 0, 0);
  return canvasGray.toDataURL('image/jpeg', 0.8);
}

export function calculateHistogram(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Array(256).fill(0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const histogram = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[avg]++;
  }
  
  return histogram;
}

export function extractDominantColors(canvas: HTMLCanvasElement, count: number = 3): RGB[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Simple color quantization/bucketing approach
  const colorCounts: Record<string, number> = {};
  
  // Downsample to avoid massive loops
  const step = 4 * 10; 
  for (let i = 0; i < data.length; i += step) {
    // Quantize by dividing by 32 and multiplying back to group similar colors
    const r = Math.floor(data[i] / 32) * 32;
    const g = Math.floor(data[i + 1] / 32) * 32;
    const b = Math.floor(data[i + 2] / 32) * 32;
    const rgb = `${r},${g},${b}`;
    
    if (colorCounts[rgb]) {
      colorCounts[rgb]++;
    } else {
      colorCounts[rgb] = 1;
    }
  }
  
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(entry => {
      const parts = entry[0].split(',').map(Number);
      return { r: parts[0], g: parts[1], b: parts[2] };
    });
    
  return sortedColors;
}
