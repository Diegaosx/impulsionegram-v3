import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, Upload, Save, LogOut, ArrowLeft, LayoutDashboard, Check, AlertCircle, ShieldCheck
} from 'lucide-react';
import { AuthUser, updateProfile, changePassword, uploadAsset } from '../utils/storage';

interface ProfilePageProps {
  user: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
  onLogout: () => void;
  siteName?: string;
  logoUrl?: string;
}

export default function ProfilePage({ user, onUserUpdate, onLogout, siteName, logoUrl }: ProfilePageProps) {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone, avatar: user.avatar });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const flash = (kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAvatar = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAsset(file, 'avatars');
      setForm((p) => ({ ...p, avatar: url }));
      flash('ok', 'Foto enviada. Clique em "Salvar perfil" para aplicar.');
    } catch (e: any) {
      flash('err', e?.message || 'Falha no upload da foto.');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      flash('err', 'Nome e e-mail são obrigatórios.');
      return;
    }
    setSavingProfile(true);
    const res = await updateProfile(form);
    setSavingProfile(false);
    if (res.ok && res.user) {
      onUserUpdate(res.user);
      flash('ok', 'Perfil atualizado com sucesso!');
    } else {
      flash('err', res.error || 'Falha ao salvar o perfil.');
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next.length < 6) { flash('err', 'A nova senha deve ter ao menos 6 caracteres.'); return; }
    if (pwd.next !== pwd.confirm) { flash('err', 'As senhas não coincidem.'); return; }
    setSavingPwd(true);
    const res = await changePassword(pwd.current, pwd.next);
    setSavingPwd(false);
    if (res.ok) {
      setPwd({ current: '', next: '', confirm: '' });
      flash('ok', 'Senha alterada com sucesso!');
    } else {
      flash('err', res.error || 'Falha ao trocar a senha.');
    }
  };

  const initials = (form.name || user.email || '?').trim().slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName || 'Logo'} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-xl font-black text-primary">{siteName || 'ImpulsioneGram'}</span>
            )}
          </button>
          <div className="flex items-center gap-2">
            {user.role === 'admin' ? (
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 rounded-lg px-3 py-2">
                <LayoutDashboard className="h-4 w-4" /> Painel
              </button>
            ) : (
              <button onClick={() => navigate('/minha-conta')} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 rounded-lg px-3 py-2">
                <LayoutDashboard className="h-4 w-4" /> Minha Conta
              </button>
            )}
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 rounded-lg px-3 py-2">
              <ArrowLeft className="h-4 w-4" /> Site
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display font-black text-2xl text-slate-900">Meu Perfil</h1>
          <p className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Você está logado como <strong className="text-slate-700">{user.role === 'admin' ? 'Administrador' : 'Cliente'}</strong>
          </p>
        </div>

        {toast && (
          <div className={`rounded-xl p-3 text-xs font-bold flex items-center gap-2 ${toast.kind === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {toast.kind === 'ok' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.msg}
          </div>
        )}

        {/* Profile card */}
        <form onSubmit={saveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-slate-800 text-sm">Dados da conta</h2>

          <div className="flex items-center gap-4">
            {form.avatar ? (
              <img src={form.avatar} alt="" className="w-16 h-16 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 text-primary flex items-center justify-center font-black text-lg">{initials}</div>
            )}
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2 cursor-pointer transition-colors">
              <Upload className="h-4 w-4" />
              {uploading ? 'Enviando...' : 'Trocar foto'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatar(e.target.files?.[0])} />
            </label>
            {form.avatar && (
              <button type="button" onClick={() => setForm((p) => ({ ...p, avatar: '' }))} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User className="h-4 w-4" /></span>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">E-mail</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="h-4 w-4" /></span>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Telefone</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Phone className="h-4 w-4" /></span>
                <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile}
              className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01]">
              <Save className="h-4 w-4" /> {savingProfile ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>

        {/* Password card */}
        <form onSubmit={savePassword} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-slate-800 text-sm">Alterar senha</h2>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Senha atual</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="h-4 w-4" /></span>
              <input type="password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nova senha</label>
              <input type="password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))} placeholder="Mín. 6 caracteres"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Confirmar nova senha</label>
              <input type="password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={savingPwd}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01]">
              <Lock className="h-4 w-4" /> {savingPwd ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
