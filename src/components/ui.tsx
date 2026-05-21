import React from 'react';
import { motion } from 'motion/react';

export const StatCard = ({ title, value, icon, valueSub }: any) => (
  <motion.div whileHover={{ y: -4 }} className="bg-white/80 backdrop-blur p-6 border border-white rounded-3xl shadow-xl shadow-gray-200/50 flex flex-col justify-between">
    <div className="flex items-center text-gray-500 mb-4 text-sm font-bold uppercase tracking-wider">
      {icon && <span className="mr-3 p-2 bg-gray-50 rounded-xl">{icon}</span>} {title}
    </div>
    <div className="text-4xl font-black text-gray-900 tracking-tight">
      {value}
      {valueSub && <span className="text-lg font-bold text-gray-400 ml-2">{valueSub}</span>}
    </div>
  </motion.div>
);

export const Bar = ({ label, value, max = 100, color = "bg-emerald-500" }: any) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2 font-bold text-gray-700">
        <span>{label}</span>
        <span className="text-gray-900">{value}g</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, type: "spring" }}
          className={`${color} h-full rounded-full`} 
        />
      </div>
    </div>
  );
};
