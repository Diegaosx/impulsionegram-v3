// Header do tema "Cristal": barra flutuante em pílula, sticky com respiro
// lateral, fundo branco translúcido com blur. Não muda ao rolar — o efeito de
// "colar" vem do sticky + blur, como na referência.
//
// Diferença deliberada: abaixo de 680px a referência simplesmente esconde os
// itens de menu, sem nenhum substituto. Aqui há um menu de verdade, com
// aria-expanded e fechamento por ESC.

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

const LINKS = [
  { label: 'Serviços', section: 'servicos' },
  { label: 'Como funciona', section: 'como-funciona' },
  { label: 'Dúvidas', section: 'faq' }
];

export default function GlassHeader({ siteName, logoUrl, currentUser, onNavigate }: HeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (section: string) => { setMenuOpen(false); onNavigate(section); };

  // Quem já entrou vai direto ao painel que lhe cabe.
  const accountHref = currentUser
    ? (currentUser.role === 'admin' ? '/dashboard' : '/minha-conta')
    : '/login';
  const accountLabel = currentUser ? 'Painel' : 'Entrar';
  const AccountIcon = currentUser ? LayoutDashboard : LogIn;
  const goToAccount = () => { setMenuOpen(false); navigate(accountHref); };

  // A marca renderiza a última palavra em azul, como na referência.
  const brand = siteName || 'ImpulsioneGram';
  const words = brand.trim().split(/\s+/);
  const brandHead = words.length > 1 ? words.slice(0, -1).join(' ') : brand;
  const brandTail = words.length > 1 ? words[words.length - 1] : '';

  return (
    <div className="gl-wrap sticky top-2 md:top-3 z-10">
      <header
        className="flex items-center justify-between gap-4 px-4 py-3 md:px-[18px]"
        style={{
          minHeight: 74,
          background: 'var(--gl-surface)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--gl-hairline)',
          borderRadius: 'var(--gl-r-pill)',
          boxShadow: 'var(--gl-sh-nav)'
        }}
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer" aria-label="Ir para a página inicial">
          {logoUrl ? (
            <span className="w-[42px] h-[42px] rounded-[14px] bg-white p-1 grid place-items-center shrink-0" style={{ boxShadow: 'var(--gl-sh-tile)' }}>
              <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" />
            </span>
          ) : null}
          <span className="text-lg md:text-[21px] font-black" style={{ color: 'var(--gl-ink)' }}>
            {brandHead}
            {brandTail && <span style={{ color: 'var(--gl-blue)' }}>{brandTail}</span>}
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map(l => (
            <button
              key={l.section}
              onClick={() => go(l.section)}
              className="text-base font-bold cursor-pointer hover:text-[var(--gl-pink)]"
              style={{ color: 'var(--gl-nav)' }}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={goToAccount} className="gl-btn !min-h-[44px] !px-5 !text-sm">
            <AccountIcon className="h-4 w-4" /> {accountLabel}
          </button>
          <button
            className="md:hidden w-11 h-11 rounded-full grid place-items-center cursor-pointer"
            style={{ background: 'var(--gl-surface-chip)', border: '1px solid var(--gl-line)', color: menuOpen ? 'var(--gl-pink)' : 'var(--gl-ink)' }}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav
          className="md:hidden mt-2 p-4 flex flex-col gap-1"
          style={{
            background: 'var(--gl-surface)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--gl-hairline)',
            borderRadius: 'var(--gl-r-card)',
            boxShadow: 'var(--gl-sh-nav)'
          }}
        >
          {LINKS.map(l => (
            <button
              key={l.section}
              onClick={() => go(l.section)}
              className="text-left text-base font-bold py-3 px-2 rounded-xl cursor-pointer hover:text-[var(--gl-pink)]"
              style={{ color: 'var(--gl-nav)' }}
            >
              {l.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
