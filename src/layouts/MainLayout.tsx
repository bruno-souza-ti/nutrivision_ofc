import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Home, User, PieChart, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthContext } from '../context/AuthContext';

export const MainLayout: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const navItems = [
    { to: "/", icon: <Home size={24} />, label: "Início" },
    { to: "/scanner", icon: <Camera size={24} />, label: "Scanner" },
    { to: "/dashboard", icon: <PieChart size={24} />, label: "Nutriboard" },
    { to: "/profile", icon: <User size={24} />, label: "Meu Perfil" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-emerald-200">
      {/* Sidebar Desktop / Bottom Nav Mobile */}
      <nav 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 transition-all duration-300 ease-in-out md:relative md:border-t-0 md:border-r md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          isHovered ? 'md:w-64' : 'md:w-20'
        }`}
      >
        <div className={`p-4 hidden md:flex items-center border-b border-gray-100 mb-4 h-20 transition-all duration-300 ${
          isHovered ? 'justify-start px-6 space-x-3' : 'justify-center px-0'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
            <Activity className="text-white w-6 h-6" />
          </div>
          <h1 className={`text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-800 whitespace-nowrap transition-opacity duration-300 ${
            isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
          }`}>NutriVision</h1>
        </div>
        
        <div className="flex md:flex-col justify-around md:justify-start flex-1 px-2 md:px-3 py-2 md:py-0 md:space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center md:px-3 py-2 md:py-3 rounded-xl transition-all relative overflow-hidden group ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50'
                } ${!isHovered ? 'md:justify-center' : 'md:justify-start'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`mb-1 md:mb-0 relative z-10 transition-transform duration-300 group-hover:scale-110 ${isHovered ? 'md:mr-4 ml-1' : ''}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] md:text-[15px] relative z-10 whitespace-nowrap transition-all duration-300 ${
                    isHovered ? 'md:opacity-100 md:translate-x-0' : 'md:opacity-0 md:-translate-x-4 md:hidden'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute inset-0 bg-emerald-100/50 rounded-xl hidden md:block" 
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden bg-gradient-to-br from-gray-50 to-slate-100">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 hidden md:flex items-center justify-end h-16 px-8 shadow-sm">
           <motion.div 
             whileHover={{ scale: 1.05 }} 
             whileTap={{ scale: 0.95 }} 
             onClick={() => navigate('/profile')}
             className="w-10 h-10 bg-gradient-to-tr from-emerald-100 to-teal-100 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold shadow-sm cursor-pointer overflow-hidden"
           >
             {user?.avatarUrl ? (
               <img src={user.avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
             ) : (
               user?.name?.charAt(0).toUpperCase() || 'U'
             )}
           </motion.div>
        </header>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
};
