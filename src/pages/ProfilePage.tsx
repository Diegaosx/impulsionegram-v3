import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { AuthUser } from '../utils/storage';
import ProfileForm from '../components/ProfileForm';

interface ProfilePageProps {
  user: AuthUser;
  onUserUpdate: (user: AuthUser) => void;
  onLogout: () => void;
  siteName?: string;
  logoUrl?: string;
}

export default function ProfilePage({ user, onUserUpdate, onLogout, siteName, logoUrl }: ProfilePageProps) {
  const navigate = useNavigate();

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

        <ProfileForm user={user} onUserUpdate={onUserUpdate} />
      </main>
    </div>
  );
}
