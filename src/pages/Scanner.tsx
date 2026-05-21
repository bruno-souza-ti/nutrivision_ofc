import React, { useState } from 'react';
import { Flame, Loader2, Code, Camera, CheckCircle } from 'lucide-react';
import { CameraFeed } from '../components/camera/index';
import { generateGrayscaleImage, calculateHistogram, extractDominantColors } from '../core/index';
import { analyzeFoodImage } from '../services/api';
import { AnalysisResult, RGB } from '../types';
import { HistogramChart } from '../components/dashboard/index';
import { Bar } from '../components/ui';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export const Scanner = () => {
  const [devMode, setDevMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null);
  
  // PDI Data
  const [grayImage, setGrayImage] = useState<string | null>(null);
  const [histogramData, setHistogramData] = useState<number[]>([]);
  const [dominantColors, setDominantColors] = useState<RGB[]>([]);
  
  // App Data
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const { addMeal } = useAppContext();

  const handleCapture = async (canvas: HTMLCanvasElement, base64: string) => {
    setLastImage(base64);
    setErrorMsg(null);
    setCurrentResult(null);
    
    // Process PDI features immediately
    const gray = generateGrayscaleImage(canvas);
    setGrayImage(gray);
    
    const hist = calculateHistogram(canvas);
    setHistogramData(hist);
    
    const colors = extractDominantColors(canvas, 3);
    setDominantColors(colors);
    
    // API Call
    setIsAnalyzing(true);
    try {
      const result = await analyzeFoodImage(base64);
      setCurrentResult(result);
      
      // Update global context
      addMeal({
        ...result,
        image: base64
      });

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao analisar a imagem.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Escanear Alimento</h2>
          <p className="text-gray-500 font-medium mt-1">Posicione o alimento ou faça um upload para inferência.</p>
        </div>
        <button 
          onClick={() => setDevMode(!devMode)}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-black transition-all ${devMode ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'bg-white text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-gray-900'}`}
        >
          <Code size={18} className="mr-2" />
          Dev Mode {devMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Camera Scanner */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <CameraFeed onCapture={handleCapture} />
          </section>
        </div>

        {/* RIGHT COLUMN: Results & Dev Mode */}
        <div className="lg:col-span-7 space-y-6">
          
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-medium">
              {errorMsg}
            </motion.div>
          )}
          
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[400px]">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-6" />
              <p className="text-gray-600 font-bold text-lg">Processando imagem...</p>
              <p className="text-gray-400 text-sm mt-2 text-center max-w-sm">Estamos extraindo as features, processando o buffer e inferindo propriedades nutricionais 😋.</p>
            </motion.div>
          )}

          <AnimatePresence>
            {!isAnalyzing && currentResult && lastImage && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 border border-emerald-100 overflow-hidden"
              >
                {/* Visualizer header with image */}
                <div className="flex flex-col md:flex-row border-b border-gray-100">
                  <div className="w-full md:w-1/3 bg-gray-100 flex-shrink-0 relative">
                     <img src={lastImage} alt="Food scanned" className="w-full h-56 md:h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:bg-none" />
                  </div>
                  <div className="p-8 md:w-2/3 flex flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-black text-gray-900 leading-tight">{currentResult.foodName}</h2>
                        <div className="flex items-center mt-4">
                           <div className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-4 py-1.5 rounded-xl text-sm font-black flex items-center shadow-lg shadow-emerald-500/30">
                             <Flame size={16} className="mr-2" />
                             {currentResult.calories} kcal
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="font-black text-xl mb-6 text-gray-800 tracking-tight">Distribuição de Macronutrientes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4 border-r border-gray-100 pr-0 md:pr-6">
                        <Bar label="Proteína (Builder)" value={currentResult.macronutrients.protein} max={50} color="bg-rose-500" />
                        <Bar label="Carboidratos (Energy)" value={currentResult.macronutrients.carbohydrates} max={100} color="bg-amber-500" />
                        <Bar label="Gordura (Reserve)" value={currentResult.macronutrients.fat} max={50} color="bg-yellow-500" />
                     </div>
                     <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center border border-emerald-100 shadow-inner">
                        <div className="text-emerald-400 mb-3"><Flame size={40} /></div>
                        <div className="text-sm font-black text-emerald-600 uppercase tracking-widest opacity-80">Impacto Calórico</div>
                        <div className="text-5xl font-black text-emerald-900 mt-2 tracking-tighter">{currentResult.calories} <span className="text-xl text-emerald-700/60 font-black">kcal</span></div>
                     </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
          
          {!isAnalyzing && !currentResult && !errorMsg && (
              <div className="flex flex-col items-center justify-center p-12 bg-white/50 rounded-2xl border border-dashed border-gray-300 min-h-[400px] text-gray-400">
                <Camera className="w-16 h-16 mb-4 opacity-30 text-green-700" />
                <p className="font-bold text-lg text-gray-500">Aguardando captura da imagem</p>
                <p className="text-sm mt-2">Utilize o painel à esquerda para carregar ou tirar uma foto.</p>
              </div>
          )}

          {/* DEV MODE PANEL */}
          {devMode && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-700"
            >
              <div className="bg-black/40 px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center">
                   <Code className="w-5 h-5 text-indigo-400 mr-3" />
                   <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Academic PDI / Computer Vision Toolset</h3>
                </div>
              </div>
              <div className="p-6 space-y-8">
                
                {lastImage ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                        <h4 className="text-[10px] font-mono text-slate-400 mb-3 uppercase tracking-widest flex items-center"><span className="w-2 h-2 rounded-full bg-slate-500 mr-2"></span>Espaço RGB de Origem</h4>
                        <img src={lastImage!} alt="Original" className="rounded w-full object-contain aspect-square bg-black border border-slate-700" />
                      </div>
                      <div className="bg-black/50 p-3 rounded-lg border border-slate-800">
                        <h4 className="text-[10px] font-mono text-slate-400 mb-3 uppercase tracking-widest flex items-center"><span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>Transformação Luminância (Y)</h4>
                        <img src={grayImage!} alt="Gray" className="rounded w-full object-contain aspect-square bg-black border border-slate-700" />
                      </div>
                    </div>
                    
                    <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                      <HistogramChart data={histogramData} />
                    </div>
                    
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-800">
                      <h4 className="text-[10px] font-mono text-slate-400 mb-4 uppercase tracking-widest">K-Means Approx (Quantização)</h4>
                      <div className="flex justify-around">
                        {dominantColors.map((color, i) => (
                          <div key={i} className="flex flex-col items-center space-y-2">
                            <div 
                              className="w-16 h-16 rounded-2xl shadow-inner border border-white/10" 
                              style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                            />
                            <span className="text-[11px] font-mono text-slate-300 font-medium">
                              {color.r},{color.g},{color.b}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-500 font-mono text-sm opacity-50 flex flex-col items-center">
                    <Camera className="w-8 h-8 mb-4" />
                    BUFFER DE IMAGEM VAZIO.<br/>Aguardando syscall do hardware da câmera.
                  </div>
                )}

              </div>
            </motion.section>
          )}

        </div>
      </div>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 w-auto z-[100] bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center space-x-4 border border-emerald-400/50"
          >
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-black text-lg leading-tight">Sucesso!</h4>
              <p className="text-emerald-50 font-medium text-sm">Refeição mapeada no histórico.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
