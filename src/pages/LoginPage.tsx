import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle, ArrowLeft, Settings } from 'lucide-react';
import { loginUser, AuthUser } from '../utils/storage';

interface LoginPageProps {
  onAuthSuccess: (user: AuthUser) => void;
  siteName?: string;
}

export default function LoginPage({ onAuthSuccess, siteName }: LoginPageProps) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const result = await loginUser(identifier.trim(), password);
      if (result.ok && result.user) {
        onAuthSuccess(result.user);
        navigate(result.user.role === 'admin' ? '/dashboard' : '/minha-conta', { replace: true });
      } else {
        setLoginError(result.error || 'Autenticação recusada pelo servidor.');
      }
    } catch (err) {
      setLoginError('Falha de conexão com a API.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-slate-500 hover:text-primary text-xs font-bold transition-colors z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao site
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-md space-y-6 relative z-10 transition-all duration-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-purple-50 rounded-xl text-primary border border-primary/10">
            <Settings className="h-6 w-6" />
          </div>
          <h3 className="font-display font-black text-xl text-slate-900">Entrar — {siteName || 'ImpulsioneGram'}</h3>
          <p className="text-slate-500 text-xs font-semibold">Acesse sua conta para gerenciar seus pedidos</p>
        </div>

        {loginError && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">E-mail</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="voce@email.com"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Senha</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-primary hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs py-3.5 rounded-lg shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isLoggingIn ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-slate-500">
          Ainda não tem conta?{' '}
          <button onClick={() => navigate('/cadastro')} className="text-primary font-bold hover:underline cursor-pointer">
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
