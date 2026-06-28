import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Phone, AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { registerAccount, AuthUser } from '../utils/storage';

interface RegisterPageProps {
  onAuthSuccess: (user: AuthUser) => void;
  siteName?: string;
}

export default function RegisterPage({ onAuthSuccess, siteName }: RegisterPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha nome, e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerAccount({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
      if (result.ok && result.user) {
        onAuthSuccess(result.user);
        navigate('/perfil', { replace: true });
      } else {
        setError(result.error || 'Não foi possível criar a conta.');
      }
    } finally {
      setSubmitting(false);
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

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-md space-y-5 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-purple-50 rounded-xl text-primary border border-primary/10">
            <UserPlus className="h-6 w-6" />
          </div>
          <h3 className="font-display font-black text-xl text-slate-900">Criar conta — {siteName || 'ImpulsioneGram'}</h3>
          <p className="text-slate-500 text-xs font-semibold">Acompanhe seus pedidos e compre direto pelo painel</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome completo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User className="h-4 w-4" /></span>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">E-mail</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="h-4 w-4" /></span>
                <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Telefone</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Phone className="h-4 w-4" /></span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Senha</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="h-4 w-4" /></span>
                <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mín. 6 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Confirmar senha</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="h-4 w-4" /></span>
                <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-primary hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs py-3.5 rounded-lg shadow-md hover:scale-[1.01] transition-all cursor-pointer">
            {submitting ? 'Criando conta...' : 'Criar minha conta'}
          </button>
        </form>

        <div className="text-center text-xs font-semibold text-slate-500">
          Já tem conta?{' '}
          <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline cursor-pointer">
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
