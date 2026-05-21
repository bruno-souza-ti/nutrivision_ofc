import React from 'react';
import { Database, Key, Settings, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const SupabaseSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4 selection:bg-emerald-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 p-10 border border-white"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 group hover:scale-105 transition-transform duration-300">
            <Database className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4">Conecte seu Banco de Dados</h1>
          <p className="text-lg text-gray-600 font-medium max-w-lg">
            Estamos prontos para usar o <strong className="text-emerald-700">Supabase</strong>. Siga os passos abaixo para configurar suas chaves de acesso.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-black text-gray-400 mt-1 flex-shrink-0">1</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                 Adicione as Chaves de API <Key className="ml-2 w-5 h-5 text-amber-500" />
              </h3>
              <p className="text-gray-500 mt-2 font-medium leading-relaxed">
                Abra o menu de <strong>Settings</strong> do AI Studio e adicione duas Secrets para o seu ambiente:
              </p>
              <div className="bg-gray-50 mt-4 rounded-xl p-4 font-mono text-sm border border-gray-200 shadow-inner">
                <div className="text-emerald-700 font-bold">VITE_SUPABASE_URL</div>
                <div className="text-gray-500 mb-3 ml-2 text-xs">Ex: https://[PROJETO].supabase.co</div>
                
                <div className="text-emerald-700 font-bold">VITE_SUPABASE_ANON_KEY</div>
                <div className="text-gray-500 ml-2 text-xs">A chave pública "anon" do seu projeto Supabase</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-black text-gray-400 mt-1 flex-shrink-0">2</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                 Execute o Schema SQL <Database className="ml-2 w-5 h-5 text-indigo-500" />
              </h3>
              <p className="text-gray-500 mt-2 font-medium leading-relaxed">
                Para que a autenticação e histórico funcionem perfeitamente, copie o conteúdo do arquivo <code className="bg-gray-100 px-2 py-0.5 rounded text-indigo-600 font-bold">supabase-schema.sql</code> e execute no <strong>SQL Editor</strong> do painel do seu projeto no Supabase.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-center gap-3">
           <Settings className="text-gray-400 animate-spin-slow" />
           <span className="text-gray-500 font-bold">O aplicativo reiniciará automaticamente assim que as chaves forem adicionadas.</span>
        </div>
      </motion.div>
    </div>
  );
};
