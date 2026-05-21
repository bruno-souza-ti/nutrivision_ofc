import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Flame, Utensils, Droplet, Download, Target, Beef, PieChart as PieChartIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuthContext } from '../context/AuthContext';
import { StatCard } from '../components/ui';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Dashboard = () => {
  const { dailyStats, mealHistory } = useAppContext();
  const { user } = useAuthContext();

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Relatório Nutricional - NutriVision', 14, 22);
    
    // Add stats summary
    doc.setFontSize(12);
    doc.text(`Total de Refeições: ${dailyStats.totalMeals}`, 14, 32);
    doc.text(`Total de Calorias: ${dailyStats.totalCalories} kcal`, 14, 38);
    doc.text(`Total de Proteínas: ${dailyStats.totalProtein} g`, 14, 44);
    doc.text(`Total de Gorduras: ${dailyStats.totalFat} g`, 14, 50);
    doc.text(`Total de Carboidratos: ${dailyStats.totalCarbs} g`, 14, 56);

    // Prepare table data
    const tableData = mealHistory.map(meal => [
      new Date(meal.timestamp).toLocaleString(),
      meal.foodName,
      `${meal.calories} kcal`,
      `${meal.macronutrients.protein}g`,
      `${meal.macronutrients.carbohydrates}g`,
      `${meal.macronutrients.fat}g`,
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Data/Hora', 'Alimento', 'Calorias', 'Proteínas', 'Carboidratos', 'Gorduras']],
      body: tableData,
    });

    doc.save('relatorio-nutricional.pdf');
  };

  // Create chart data based on meal history
  const chartData = [...mealHistory].reverse().map((meal, idx) => ({
    name: `Refeição ${idx + 1}`,
    calorias: meal.calories,
    proteina: meal.macronutrients.protein
  }));

  // Make dummy padding if not enough data
  if (chartData.length < 5 && chartData.length > 0) {
    for (let i = chartData.length; i < 5; i++) {
        chartData.push({ name: `...`, calorias: 0, proteina: 0 });
    }
  }

  const pieData = [
    { name: 'Proteínas', value: dailyStats.totalProtein, color: '#10b981' },
    { name: 'Carboidratos', value: dailyStats.totalCarbs, color: '#3b82f6' },
    { name: 'Gorduras', value: dailyStats.totalFat, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Analítico</h2>
          <p className="text-gray-500 mt-2 font-medium">Acompanhe seu progresso e histórico nutricional com precisão.</p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm hover:shadow font-bold text-sm"
        >
          <Download size={18} className="mr-2 text-emerald-600" />
          Baixar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Refeições" value={dailyStats.totalMeals} icon={<Utensils size={20} className="text-indigo-500" />} />
        <StatCard title="Calorias" value={dailyStats.totalCalories} valueSub="kcal" icon={<Flame size={20} className="text-orange-500" />} />
        <StatCard title="Proteínas" value={dailyStats.totalProtein} valueSub="g" icon={<Utensils size={20} className="text-emerald-500" />} />
        <StatCard title="Gorduras" value={dailyStats.totalFat} valueSub="g" icon={<Droplet size={20} className="text-amber-500" />} />
      </div>

      {user?.preferences && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calorias Goal */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white">
            <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center">
               <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mr-4 shadow-inner">
                 <Target className="text-orange-500" size={20} />
               </div>
               Minha Meta de Calorias
            </h3>
            <div className="flex flex-col items-center justify-center py-2">
               <div className="relative w-48 h-48 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-amber-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"/>
                  <svg className="w-full h-full transform -rotate-90 relative z-10 filter drop-shadow-sm">
                    <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-100" />
                    <motion.circle 
                      initial={{ strokeDashoffset: 528 }}
                      animate={{ strokeDashoffset: 528 - (528 * Math.min(dailyStats.totalCalories / user.preferences.calorieTarget, 1)) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      cx="96" cy="96" r="84" stroke="url(#calGradient)" strokeWidth="16" fill="transparent" 
                      strokeDasharray={528} 
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="calGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-4xl font-black text-gray-800 tracking-tighter">
                      {Math.round((dailyStats.totalCalories / user.preferences.calorieTarget) * 100)}%
                    </motion.span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">da meta</span>
                  </div>
               </div>
               <p className="mt-6 text-sm text-gray-500 font-bold bg-gray-100/80 px-4 py-2 rounded-full border border-gray-200">
                 {dailyStats.totalCalories} / {user.preferences.calorieTarget} kcal
               </p>
            </div>
          </div>

          {/* Proteina Goal */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white">
            <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center">
               <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mr-4 shadow-inner">
                 <Beef className="text-emerald-500" size={20} />
               </div>
               Minha Meta de Proteínas
            </h3>
            <div className="flex flex-col items-center justify-center py-2">
               <div className="relative w-48 h-48 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-teal-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"/>
                  <svg className="w-full h-full transform -rotate-90 relative z-10 filter drop-shadow-sm">
                    <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-100" />
                    <motion.circle 
                      initial={{ strokeDashoffset: 528 }}
                      animate={{ strokeDashoffset: 528 - (528 * Math.min(dailyStats.totalProtein / user.preferences.proteinTarget, 1)) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      cx="96" cy="96" r="84" stroke="url(#proteinGradient)" strokeWidth="16" fill="transparent" 
                      strokeDasharray={528} 
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="text-4xl font-black text-gray-800 tracking-tighter">
                      {Math.round((dailyStats.totalProtein / user.preferences.proteinTarget) * 100)}%
                    </motion.span>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">da meta</span>
                  </div>
               </div>
               <p className="mt-6 text-sm text-gray-500 font-bold bg-gray-100/80 px-4 py-2 rounded-full border border-gray-200">
                 {dailyStats.totalProtein} / {user.preferences.proteinTarget} g
               </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white">
          <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center mr-4 shadow-inner">
                 <Activity className="text-cyan-500" size={20} />
              </div>
              Evolução de Consumo
          </h3>
          
          {chartData.length > 0 ? (
            <div className="h-80 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }} dx={-10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    labelStyle={{ color: '#374151', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="calorias" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCal)" activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
               <Activity className="w-12 h-12 mb-4 text-gray-300" />
               <p className="font-semibold text-lg text-gray-500">Nenhum dado analítico disponível ainda.</p>
               <p className="text-sm mt-1">Faça um escaneamento para ativar os gráficos.</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-white">
          <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mr-4 shadow-inner">
                 <PieChartIcon className="text-indigo-500" size={20} />
              </div>
              Distribuição de Macros
          </h3>
          
          {pieData.length > 0 ? (
            <div className="h-80 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                     formatter={(value: number) => [`${Math.round(value)}g`, 'Quantidade']}
                     contentStyle={{ borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                     itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200 h-80">
               <PieChartIcon className="w-12 h-12 mb-4 text-gray-300" />
               <p className="font-semibold text-lg text-gray-500">Sem dados de macros.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
