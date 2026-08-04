// Header do tema "Painel": fixo, fundo da própria superfície da página, borda
// inferior fina e sombra que só aparece ao rolar. Logo à esquerda, nada no
// centro, botões outline pequenos à direita.
//
// Abaixo de 576px os botões viram um overlay de tela cheia. Diferente da
// referência, o gatilho tem aria-expanded e aria-label — lá não tinha.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { AuthUser } from '../../../utils/storage';

interface HeaderProps {
  siteName?: string;
  logoUrl?: string;
  currentUser?: AuthUser | null;
  onNavigate: (sectionId: string) => void;
}

const LINKS: { label: string; section: string }[] = [
  { label: 'Serviços', section: 'servicos' },
  { label: 'Calculadora', section: 'calculadora' },
  { label: 'Dúvidas', section: 'faq' }
];

export default function JapHeader({ siteName, logoUrl, currentUser, onNavigate }: HeaderProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fecha o menu ao trocar de rota ou apertar ESC.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (section: string) => { setMenuOpen(false); onNavigate(section); };

  // Quem já está logado vai direto para o painel que lhe cabe; visitante vai
  // para o login. Sem isso o botão pediria login de novo a quem já entrou.
  const accountHref = currentUser
    ? (currentUser.role === 'admin' ? '/dashboard' : '/minha-conta')
    : '/login';
  const accountLabel = currentUser ? 'Painel' : 'Entrar';
  const AccountIcon = currentUser ? LayoutDashboard : LogIn;
  const goToAccount = () => { setMenuOpen(false); navigate(accountHref); };

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-[1000] border-b transition-shadow"
        style={{
          background: 'var(--jap-bg-app)',
          borderColor: 'var(--jap-border)',
          boxShadow: scrolled ? 'var(--jap-shadow-header)' : 'none'
        }}
      >
        <div className="max-w-[1320px] mx-auto px-6 lg:px-3 h-[71px] md:h-[91px] lg:h-[111px] flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer" aria-label="Ir para a página inicial">
            {logoUrl
              ? <img src={logoUrl} alt={siteName || 'Logo'} className="h-9 lg:h-11 w-auto object-contain" />
              : <span className="text-xl lg:text-2xl font-bold" style={{ color: 'var(--jap-ink)' }}>{siteName || 'ImpulsioneGram'}</span>}
          </button>

          <nav className="hidden sm:flex items-center gap-2.5">
            {LINKS.map(l => (
              <button key={l.section} onClick={() => go(l.section)} className="jap-btn jap-btn-sm jap-btn-outline">
                {l.label}
              </button>
            ))}
            <button onClick={goToAccount} className="jap-btn jap-btn-sm jap-btn-primary">
              <AccountIcon className="h-4 w-4" /> {accountLabel}
            </button>
          </nav>

          <button
            className="sm:hidden w-12 h-9 rounded border flex items-center justify-center cursor-pointer"
            style={{
              background: 'var(--jap-surface)',
              borderColor: 'var(--jap-border)',
              color: menuOpen ? 'var(--jap-orange)' : 'var(--jap-ink)'
            }}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[100] flex flex-col gap-5 px-4 pt-24"
          style={{ background: 'var(--jap-bg-app)' }}
        >
          {LINKS.map(l => (
            <button key={l.section} onClick={() => go(l.section)} className="jap-btn jap-btn-sm jap-btn-outline w-[200px]">
              {l.label}
            </button>
          ))}
          <button onClick={goToAccount} className="jap-btn jap-btn-sm jap-btn-primary w-[200px]">
            <AccountIcon className="h-4 w-4" /> {accountLabel}
          </button>
        </div>
      )}
    </>
  );
}
