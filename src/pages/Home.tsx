import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Flame, Leaf, ArrowRight, Lightbulb, Droplets, Plus, Trash2, X, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { MealHistoryItem } from '../types';

export const Home = () => {
  const navigate = useNavigate();
  const { dailyStats, mealHistory, deleteMeal } = useAppContext();
  const { user, token } = useAuthContext();
  const [tips, setTips] = useState<string[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [deleteModalMealId, setDeleteModalMealId] = useState<string | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualMeal, setManualMeal] = useState({
    foodName: '', calories: 0, protein: 0, carbs: 0, fat: 0
  });

  const [hydration, setHydration] = useState(() => {
    const saved = localStorage.getItem('hydration_' + new Date().toDateString());
    return saved ? parseInt(saved, 10) : 0;
  });
  const hydrationGoal = 2000; // ml

  const addWater = (amount: number) => {
    setHydration(prev => {
      const newVal = prev + amount;
      localStorage.setItem('hydration_' + new Date().toDateString(), newVal.toString());
      return newVal;
    });
  };

  useEffect(() => {
    const fetchTips = async () => {
      if (!user) return;
      setLoadingTips(true);
      try {
        const res = await fetch('/api/tips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            calorieTarget: user.preferences.calorieTarget,
            proteinTarget: user.preferences.proteinTarget,
            currentCalories: dailyStats.totalCalories,
            currentProtein: dailyStats.totalProtein
          })
        });
        const data = await res.json();
        if (data && data.tips) {
          setTips(data.tips);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTips(false);
      }
    };

    fetchTips();
  }, [user, dailyStats.totalMeals, token, dailyStats.totalCalories, dailyStats.totalProtein]);

  const recentMeals = mealHistory.slice(0, 3);
  const calorieTarget = user?.preferences?.calorieTarget || 2000;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-[2.5rem] p-8 md:p-14 text-white shadow-2xl shadow-teal-600/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-sm">
            Olá, {user?.name ? user.name.split(' ')[0] : 'Usuário'}!
          </h1>
          <p className="text-teal-50 text-lg md:text-xl mb-10 max-w-lg font-medium leading-relaxed">
            Pronto para registrar suas refeições de hoje? Tire uma foto e nossa IA cuida dos cálculos para você.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/scanner')}
              className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center shadow-xl shadow-teal-900/20 hover:bg-emerald-50 transition-colors flex-1 sm:flex-none"
            >
              <Camera className="mr-3" size={24} />
              Escanear
              <ArrowRight className="ml-3 opacity-50" size={20} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowManualAdd(true)}
              className="bg-teal-700/50 text-white border border-teal-500/50 backdrop-blur-sm px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center shadow-xl hover:bg-teal-600/50 transition-colors flex-1 sm:flex-none"
            >
              <Edit3 className="mr-3" size={24} />
              Adicionar Refeição
            </motion.button>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quick Stats */}
        <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white">
          <h2 className="text-2xl font-black mb-8 text-gray-800 flex items-center">
             <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mr-4 shadow-inner">
               <Flame className="text-orange-500" size={24} />
             </div>
             Resumo do Dia
          </h2>
          <div className="flex flex-col items-center justify-center py-4">
             <div className="relative w-48 h-48 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-cyan-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"/>
                <svg className="w-full h-full transform -rotate-90 relative z-10 filter drop-shadow-sm">
                  <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-100" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 528 }}
                    animate={{ strokeDashoffset: 528 - (528 * Math.min(dailyStats.totalCalories / calorieTarget, 1)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="96" cy="96" r="84" stroke="url(#gradient)" strokeWidth="16" fill="transparent" 
                    strokeDasharray={528} 
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-5xl font-black text-gray-800 tracking-tighter">
                    {dailyStats.totalCalories}
                  </motion.span>
                  <span className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">kcal</span>
                </div>
             </div>
             <p className="mt-8 text-sm text-gray-500 font-bold bg-gray-100/80 px-4 py-2 rounded-full border border-gray-200">Meta recomendada: {calorieTarget} kcal</p>
          </div>
        </motion.section>

        {/* Recent Meals */}
        <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white">
          <h2 className="text-2xl font-black mb-8 text-gray-800 flex items-center">
             <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mr-4 shadow-inner">
               <Leaf className="text-emerald-600" size={24} />
             </div>
             Histórico de Refeições
          </h2>
          
          {recentMeals.length > 0 ? (
            <div className="space-y-4">
              {recentMeals.map((meal, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                  key={meal.id} 
                  className="group flex items-center space-x-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-emerald-100 hover:shadow-sm"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    <img src={meal.image} alt={meal.foodName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-lg">{meal.foodName}</h3>
                    <p className="text-emerald-600 font-bold">{meal.calories} kcal</p>
                  </div>
                  <div className="text-right flex-shrink-0 bg-gray-50 px-3 py-2 rounded-xl group-hover:bg-white transition-colors border border-gray-100 flex items-center space-x-3">
                    <div className="flex flex-col items-end mr-2">
                       <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">PROT</div>
                       <div className="font-black text-emerald-700">{meal.macronutrients.protein}g</div>
                    </div>
                    <button 
                       onClick={() => setDeleteModalMealId(meal.id)}
                       className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                       aria-label="Deletar refeição"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                <Camera className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-semibold">Nenhuma refeição hoje.</p>
             </div>
          )}
        </motion.section>
      </div>

      {/* Hydration Goal */}
      <motion.section variants={itemVariants} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white">
        <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center">
           <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mr-4 shadow-inner">
             <Droplets className="text-blue-500" size={24} />
           </div>
           Meta de Hidratação
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-between">
           <div className="flex-1 w-full md:pr-8 mb-6 md:mb-0">
             <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
               <span>{hydration} ml</span>
               <span>{hydrationGoal} ml</span>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden shadow-inner border border-gray-200">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min((hydration / hydrationGoal) * 100, 100)}%` }}
                 transition={{ type: 'spring', duration: 1 }}
                 className="bg-gradient-to-r from-blue-400 to-cyan-400 h-6 rounded-full relative"
               >
                 <div className="absolute inset-0 bg-white/20 w-full h-1/2 rounded-t-full"></div>
               </motion.div>
             </div>
           </div>
           <button 
             onClick={() => addWater(200)}
             className="w-full md:w-auto bg-blue-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center shadow-sm hover:shadow-md hover:bg-blue-100 hover:scale-105 transition-all"
           >
             <Plus size={20} className="mr-2" /> 200ml
           </button>
        </div>
      </motion.section>

      {(loadingTips || tips.length > 0) && (
        <motion.section variants={itemVariants} className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-[2rem] border border-orange-100 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
          <h2 className="text-2xl font-black mb-6 text-gray-800 flex items-center relative z-10">
             <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mr-4 shadow-inner">
               <Lightbulb className="text-orange-500" size={24} />
             </div>
             Dicas do Dia
          </h2>
          {loadingTips ? (
             <div className="animate-pulse space-y-4">
                <div className="h-4 bg-orange-200/50 rounded w-3/4"></div>
                <div className="h-4 bg-orange-200/50 rounded w-1/2"></div>
             </div>
          ) : (
            <ul className="space-y-4 relative z-10">
              {tips.map((tip, index) => (
                <motion.li 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: index * 0.1 }}
                  key={index} 
                  className="flex items-start bg-white/60 p-4 rounded-xl shadow-sm border border-orange-50"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-orange-400 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-700 font-medium leading-relaxed">{tip}</p>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      )}

      <AnimatePresence>
        {deleteModalMealId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
              <button 
                onClick={() => setDeleteModalMealId(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full"
              >
                 <X size={16} />
              </button>
              <div className="mb-6 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                   <Trash2 className="text-red-500" size={32} />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2">Excluir Refeição</h3>
                 <p className="text-gray-500 font-medium">Tem certeza que deseja remover esta refeição? Ela será excluída do seu histórico e as calorias serão recalculadas.</p>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setDeleteModalMealId(null)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (deleteModalMealId) {
                      deleteMeal(deleteModalMealId);
                      setDeleteModalMealId(null);
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:-translate-y-0.5"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showManualAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowManualAdd(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 hover:bg-gray-200 p-2 rounded-full z-10"
              >
                 <X size={16} />
              </button>
              <h3 className="text-2xl font-black text-gray-900 mb-6">Adição Manual</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Alimento</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" placeholder="Ex: Arroz com Feijão" value={manualMeal.foodName} onChange={e => setManualMeal({...manualMeal, foodName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Calorias (kcal)</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" placeholder="0" value={manualMeal.calories || ''} onChange={e => setManualMeal({...manualMeal, calories: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Proteínas (g)</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" placeholder="0" value={manualMeal.protein || ''} onChange={e => setManualMeal({...manualMeal, protein: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Carboidratos (g)</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" placeholder="0" value={manualMeal.carbs || ''} onChange={e => setManualMeal({...manualMeal, carbs: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Gorduras (g)</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" placeholder="0" value={manualMeal.fat || ''} onChange={e => setManualMeal({...manualMeal, fat: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const mealItem = {
                      foodName: manualMeal.foodName || 'Refeição Manual',
                      calories: manualMeal.calories,
                      macronutrients: {
                        protein: manualMeal.protein,
                        carbohydrates: manualMeal.carbs,
                        fat: manualMeal.fat
                      },
                      image: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?w=500&q=80',
                      detailedAnalysis: 'Registro manual.'
                    };
                    addMeal(mealItem);
                    setShowManualAdd(false);
                    setManualMeal({ foodName: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
                  }}
                  className="w-full pt-4 mt-2 py-3 bg-emerald-500 text-white font-black text-lg rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
                >
                  Salvar Refeição
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
