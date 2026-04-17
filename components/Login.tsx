import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, User, Lock, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PROFILES = [
    { label: 'Selecione seu Perfil', value: '', email: '' },
    { label: 'Administrador', value: 'admin', email: 'admin@swm.local' },
    { label: 'Manutenção', value: 'manutencao', email: 'manutencao@swm.local' },
    { label: 'MP01', value: 'mp01', email: 'mp01@swm.local' },
    { label: 'MP03', value: 'mp03', email: 'mp03@swm.local' },
    { label: 'MP06', value: 'mp06', email: 'mp06@swm.local' },
    { label: 'SBOB', value: 'sbob', email: 'sbob@swm.local' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, selecione um perfil.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Senha incorreta para este perfil.' : err.message || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#e5ebf7] rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#f0f9ff] rounded-full blur-[100px] opacity-60" />

      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(23,28,143,0.08)] border border-slate-100 p-8 md:p-12 relative z-10">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-sm border border-slate-50 mb-6 flex items-center justify-center">
              <img src="/swm-logo.png" alt="SWM Logo" className="w-full h-auto object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-[#171C8F] uppercase tracking-tighter mb-1">
                ARP
              </h1>
              <p className="text-[8px] font-bold text-[#13aff0] uppercase tracking-[0.2em] opacity-90">
                Análise e Resolução de Problemas
              </p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">
                SWM Brasil • Liderança Opex
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
              <AlertCircle size={18} className="text-red-500" />
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#13aff0] transition-colors" />
                <select
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#13aff0]/10 focus:border-[#13aff0] transition-all appearance-none cursor-pointer"
                >
                  {PROFILES.map(p => (
                    <option key={p.value} value={p.email}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#13aff0] transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#13aff0]/10 focus:border-[#13aff0] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#171C8F] text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-900/10 hover:bg-black transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group mt-8"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
              Célula de IA SWM Brasil, por Bruno Cariello
            </p>
          </div>
        </div>
        
        <p className="text-center mt-6 text-[10px] font-medium text-slate-400">
          Problemas com o acesso? Contate a Engenharia de Manutenção
        </p>
      </div>
    </div>
  );
};

export default Login;
