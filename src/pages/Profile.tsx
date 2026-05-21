import React, { useRef, useState } from 'react';
import { User as UserIcon, Settings, Shield, Bell, Check, LogOut, Camera, Save, Activity, Trophy, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Profile = () => {
  const { user, token, updateUser, logout } = useAuthContext();
  const { mealHistory, dailyStats } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Local state for form
  const [preferences, setPreferences] = useState(user?.preferences || {
    calorieTarget: 2000,
    proteinTarget: 150,
    notifications: true,
    dataSharing: false,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem não pode ter mais que 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsUploading(true);
        try {
          if (isSupabaseConfigured && supabase && user) {
             const { error } = await supabase.from('profiles').update({ avatar_url: reader.result }).eq('id', user.id);
             if (error) throw error;
             updateUser({...user, avatarUrl: reader.result as string});
          } else {
            const res = await fetch('/api/user/me', {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ avatarUrl: reader.result as string })
            });
            const data = await res.json();
            if (res.ok && data.user) {
              updateUser(data.user);
            }
          }
        } catch(err) {
          console.error(err);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePreferences = async () => {
    try {
      if (isSupabaseConfigured && supabase && user) {
        const { error } = await supabase.from('profiles').update({
          calorie_target: preferences.calorieTarget,
          protein_target: preferences.proteinTarget,
          notifications: preferences.notifications,
          data_sharing: preferences.dataSharing
        }).eq('id', user.id);
        if (error) throw error;
        updateUser({...user, preferences});
        alert('Configurações salvas com sucesso!');
      } else {
        const res = await fetch('/api/user/me', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ preferences })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          updateUser(data.user);
          alert('Configurações salvas com sucesso!');
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Meu Perfil</h2>
          <p className="text-gray-500 mt-2 font-medium">Configurações e preferências.</p>
        </div>
        <button onClick={logout} className="flex items-center text-red-500 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors">
          <LogOut size={18} className="mr-2" />
          Sair
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-white overflow-hidden mt-8">
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-48 relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
           <div className="absolute -bottom-16 left-10 group">
              <div className="w-32 h-32 bg-white rounded-3xl p-2 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                 {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                 ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-5xl">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                 )}
                 <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center cursor-pointer">
                    <Camera className="text-white" size={32} />
                 </div>
                 <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
              </div>
           </div>
        </div>
        
        <div className="pt-24 pb-12 px-10">
           <h3 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h3>
           <p className="text-emerald-600 font-bold text-lg">{user.email}</p>

           <div className="mt-10 space-y-8">
             
             {/* ATIVIDADE E ESTATISTICAS */}
             <div>
               <h4 className="text-sm font-black tracking-widest text-gray-400 uppercase mb-6 flex items-center"><span className="w-8 h-[2px] bg-gray-200 mr-3"></span>Atividade Recente</h4>
               <div className="grid grid-cols-3 gap-4">
                 <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 flex flex-col items-center text-center justify-center shadow-sm">
                   <Activity className="text-emerald-500 mb-2" size={28} />
                   <div className="text-3xl font-black text-emerald-900 leading-none mb-1">{mealHistory.length}</div>
                   <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Refeições</div>
                 </div>
                 <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-amber-100 flex flex-col items-center text-center justify-center shadow-sm">
                   <Flame className="text-amber-500 mb-2" size={28} />
                   <div className="text-3xl font-black text-amber-900 leading-none mb-1">{dailyStats.totalCalories}</div>
                   <div className="text-xs font-bold text-amber-700 uppercase tracking-widest">Kcal Hoje</div>
                 </div>
                 <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center justify-center shadow-sm">
                   <Trophy className="text-blue-500 mb-2" size={28} />
                   <div className="text-3xl font-black text-blue-900 leading-none mb-1">
                     {mealHistory.length > 5 ? 'Nvl 2' : 'Nvl 1'}
                   </div>
                   <div className="text-xs font-bold text-blue-700 uppercase tracking-widest">Nível</div>
                 </div>
               </div>
             </div>

             {/* CONFIGURACOES CLINICAS */}
             <div>
               <h4 className="text-sm font-black tracking-widest text-gray-400 uppercase mb-6 flex items-center"><span className="w-8 h-[2px] bg-gray-200 mr-3"></span>Metas Nutricionais</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-gray-50 hover:bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-all shadow-sm">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest block mb-2">Meta Diária (kcal)</label>
                    <div className="flex items-center">
                      <input 
                         type="number"
                         value={preferences.calorieTarget}
                         onChange={(e) => setPreferences({...preferences, calorieTarget: Number(e.target.value)})}
                         className="bg-transparent text-3xl font-black text-gray-900 w-24 focus:outline-none"
                      />
                      <span className="text-base text-gray-400 font-bold ml-1">kcal</span>
                    </div>
                 </div>
                 <div className="bg-gray-50 hover:bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-all shadow-sm">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest block mb-2">Proteínas (g)</label>
                    <div className="flex items-center">
                      <input 
                         type="number"
                         value={preferences.proteinTarget}
                         onChange={(e) => setPreferences({...preferences, proteinTarget: Number(e.target.value)})}
                         className="bg-transparent text-3xl font-black text-gray-900 w-24 focus:outline-none"
                      />
                      <span className="text-base text-gray-400 font-bold ml-1">g</span>
                    </div>
                 </div>
               </div>
             </div>

             {/* SISTEMA E PRIVACIDADE */}
             <div>
               <h4 className="text-sm font-black tracking-widest text-gray-400 uppercase mb-6 flex items-center"><span className="w-8 h-[2px] bg-gray-200 mr-3"></span>Sistema</h4>
               <ul className="space-y-3">
                 <li className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl transition-all border border-transparent">
                   <div className="flex items-center text-gray-700 font-bold">
                     <Bell className="text-gray-400 mr-4" size={24} /> Alertas & Notificações
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={preferences.notifications} onChange={(e) => setPreferences({...preferences, notifications: e.target.checked})} />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                   </label>
                 </li>
                 <li className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl transition-all border border-transparent">
                   <div className="flex items-center text-gray-700 font-bold">
                     <Shield className="text-gray-400 mr-4" size={24} /> Compartilhar Dados
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={preferences.dataSharing} onChange={(e) => setPreferences({...preferences, dataSharing: e.target.checked})} />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                   </label>
                 </li>
               </ul>

               <div className="mt-8 flex justify-end">
                  <button onClick={handleSavePreferences} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-emerald-600/30 transition-colors">
                    <Save className="mr-2" size={20} />
                    Salvar Preferências
                  </button>
               </div>
             </div>

           </div>
        </div>
      </div>
    </motion.div>
  );
};
