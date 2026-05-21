import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Activity, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        if (isLogin) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data.session) {
             navigate('/');
          }
        } else {
          const { data, error } = await supabase.auth.signUp({ 
            email, 
            password, 
            options: { data: { name } } 
          });
          if (error) throw error;
          if (data.session) {
             navigate('/');
          } else {
             // Email Confirmation Required fallback
             setError("Por favor, verifique sua caixa de entrada para confirmar o email.");
          }
        }
      } else {
        // LOCAL MOCK
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin ? { email, password } : { name, email, password };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to authenticate');

        login(data.token, data.user);
        navigate('/');
      }
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        setError("Limite de envios excedido no Supabase. Para testar sem limites, acesse o painel do Supabase > Authentication > Providers > Email e desabilite 'Confirm email'.");
      } else {
        setError(err.message || 'Ocorreu um erro ao autenticar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 p-8 border border-white"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
            <Activity className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">NutriPath</h2>
          <p className="text-gray-500 font-medium mt-1">
            {isLogin ? 'Faça login na sua conta' : 'Crie sua conta acadêmica'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center mb-6 border border-red-100">
            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nome Completo</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                placeholder="aluno@instituicao.edu.br"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-600/30 mt-6 disabled:opacity-50"
          >
            {isLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-gray-500 font-bold hover:text-emerald-600 text-sm"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
