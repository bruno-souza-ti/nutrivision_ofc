import React, { useRef, useEffect, useState, useCallback, DragEvent } from 'react';
import { Camera, Image as ImageIcon, Upload } from 'lucide-react';

interface CameraFeedProps {
  onCapture: (canvas: HTMLCanvasElement, base64: string) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const startCamera = async () => {
      if (mode !== 'camera') return;
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current && mode === 'camera') {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(canvas, base64Image);
      }
    }
  }, [mode, onCapture]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const base64Image = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(canvas, base64Image);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4">
      
      <div className="flex w-full bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${mode === 'camera' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Camera size={16} className="mr-2" />
          Câmera
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ImageIcon size={16} className="mr-2" />
          Upload
        </button>
      </div>

      <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-xl ring-1 ring-gray-900/5 flex items-center justify-center">
        
        {mode === 'camera' ? (
          <>
            {error ? (
              <div className="text-center text-red-400 p-6">{error}</div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            )}
            {!error && (
              <div className="absolute inset-x-0 bottom-6 flex justify-center">
                <button 
                  onClick={handleCapture}
                  className="flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg hover:bg-gray-100 active:scale-95 transition-all outline-none ring-4 ring-white/50"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-gray-800 flex items-center justify-center">
                     <Camera size={24} className="text-gray-800" />
                  </div>
                </button>
              </div>
            )}
          </>
        ) : (
          <div 
            className={`w-full h-full flex flex-col items-center justify-center p-8 transition-colors ${
              isDragging ? 'bg-indigo-900/40 border-indigo-400' : 'bg-gray-900 border-gray-700'
            } border-2 border-dashed rounded-2xl cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-400'}`}>
              <Upload size={32} />
            </div>
            <p className="text-gray-300 font-medium text-center">Clique para escolher uma imagem<br/>ou arraste e solte aqui</p>
            <p className="text-gray-500 text-sm mt-2">Suporta JPG, PNG, WEBP</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
