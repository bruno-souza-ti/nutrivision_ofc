import React, { useEffect, useRef } from 'react';

interface HistogramChartProps {
  data: number[]; // 256 levels
}

export const HistogramChart: React.FC<HistogramChartProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find max value for scaling
    const maxVal = Math.max(...data);
    if (maxVal === 0) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Draw background
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#3b82f6'; // Tailwind blue-500 from the snippet
    
    const barWidth = width / 256;
    
    for (let i = 0; i < 256; i++) {
        const value = data[i];
        const barHeight = (value / maxVal) * (height - 20); // 20px padding at top
        
        ctx.fillRect(
          i * barWidth, 
          height - barHeight, 
          barWidth, 
          barHeight
        );
    }
    
    // Grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 1);
    ctx.lineTo(width, height - 1);
    ctx.stroke();

  }, [data]);

  return (
    <div className="w-full">
      <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Histograma de Frequência</h3>
      <canvas 
        ref={canvasRef} 
        width={512} 
        height={150} 
        className="w-full h-auto bg-slate-800 rounded border border-slate-700"
      />
    </div>
  );
};
