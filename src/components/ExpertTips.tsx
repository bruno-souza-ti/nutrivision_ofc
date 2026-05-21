import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';

export const ExpertTips = () => {
  const { dailyStats, mealHistory } = useAppContext();
  const { user, token } = useAuthContext();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = async () => {
    if (mealHistory.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/expert-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mealHistory,
          dailyStats,
          preferences: user?.preferences
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar dicas');
      
      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao conectar com o nutricionista virtual.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mealHistory.length > 0 && recommendations.length === 0 && !loading) {
      fetchTips();
    }
  }, [mealHistory]);

  if (mealHistory.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-emerald-100 mt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-emerald-900 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mr-4 shadow-inner">
            <Lightbulb className="text-emerald-600" size={20} />
          </div>
          Dicas de Especialista (IA)
        </h3>
        <button 
          onClick={fetchTips}
          disabled={loading}
          className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-full transition-colors disabled:opacity-50"
          aria-label="Atualizar dicas"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-4">
        {loading && recommendations.length === 0 ? (
          <div className="flex items-center space-x-3 text-emerald-600 font-bold p-4">
            <RefreshCw size={20} className="animate-spin" />
            <span>Analisando perfil metabólico e histórico nutricional...</span>
          </div>
        ) : error && recommendations.length === 0 ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center shadow-sm border border-red-100">
            <AlertCircle className="mr-3" size={20} />
            <span className="font-semibold">{error}</span>
          </div>
        ) : recommendations.length > 0 ? (
          <AnimatePresence>
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-start"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black mr-4 flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700 font-medium leading-relaxed">{rec}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-emerald-700 font-medium p-4">Nenhuma dica gerada no momento.</div>
        )}
      </div>
    </motion.div>
  );
};
