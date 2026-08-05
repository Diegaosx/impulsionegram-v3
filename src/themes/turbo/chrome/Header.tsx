// Header do tema "Turbo" — três camadas, como a referência.
//
//  1. topbar de 30px, só a partir de 768px;
//  2. header transparente sobre o gradiente do topo;
//  3. estado "colado": fundo branco, 92px, marca e links invertidos.
//
// "Serviços" abre um mega-menu de 930px em duas colunas com as redes. Abaixo
// de 768px vira um menu de tela cheia com acordeão.
//
// Diferenças deliberadas da referência: o mega-menu abre também por foco de
// teclado e fecha com ESC, e o menu mobile é um diálogo de verdade.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogIn, Mail, Menu, ShieldCheck, X } from 'lucide-react';
import { AuthUser } from '../../../utils/storage';
import { SOCIAL_PLATFORMS } from '../../../data';
import { SocialPlatform } from '../../../types';
import PlatformIcon, { platformGradient } from './PlatformIcon';

interface HeaderProps {
  siteName?: string;
  logoUrl?: string;
  currentUser?: AuthUser | null;
  onNavigate: (sectionId: string) => void;
  /** Redes que o catálogo realmente vende; sem isso, mostra todas. */
  platforms?: SocialPlatform[];
  /** Contato do topbar (vem das configurações do painel). */
  contactEmail?: string;
  /** Na home, filtra o grid sem recarregar a página. */
  onSelectPlatform?: (platform: SocialPlatform) => void;
}

const LINKS = [
  { label: 'Como funciona', section: 'como-funciona' },
  { label: 'Vantagens', section: 'vantagens' },
  { label: 'Dúvidas', section: 'faq' }
];

export default function TurboHeader({
  siteName, logoUrl, currentUser, onNavigate, platforms, contactEmail, onSelectPlatform
}: HeaderProps) {
  const navigate = useNavigate();
  const [stuck, setStuck] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNets, setMobileNets] = useState(false);
  // Fechar o mega-menu tem um respiro: um trajeto rápido do ponteiro entre o
  // link e o painel não pode derrubá-lo no meio do caminho.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const openMega = () => { cancelClose(); setMegaOpen(true); };
  const scheduleCloseMega = () => { cancelClose(); closeTimer.current = setTimeout(() => setMegaOpen(false), 180); };
  useEffect(() => cancelClose, []);

  // O estado "colado" é o que troca o header transparente pelo branco.
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!megaOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMegaOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [megaOpen, menuOpen]);

  // O menu de tela cheia trava a rolagem do fundo enquanto está aberto.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [menuOpen]);

  const netList = (platforms && platforms.length
    ? SOCIAL_PLATFORMS.filter(p => platforms.includes(p.id))
    : SOCIAL_PLATFORMS);

  const go = (section: string) => { setMenuOpen(false); setMegaOpen(false); onNavigate(section); };

  const pickPlatform = (id: SocialPlatform) => {
    setMenuOpen(false);
    setMegaOpen(false);
    if (onSelectPlatform) {
      onSelectPlatform(id);
      onNavigate('servicos');
    } else {
      // Fora da home, a rede viaja na URL e a home a lê ao montar.
      navigate(`/?rede=${id}#servicos`);
    }
  };

  const accountHref = currentUser
    ? (currentUser.role === 'admin' ? '/dashboard' : '/minha-conta')
    : '/login';
  const accountLabel = currentUser ? 'Painel' : 'Entrar';
  const AccountIcon = currentUser ? LayoutDashboard : LogIn;
  const goToAccount = () => { setMenuOpen(false); navigate(accountHref); };

  const brand = siteName || 'ImpulsioneGram';

  return (
    <>
      {/* As três camadas moram no mesmo elemento fixo: topbar, barra principal
          e o estado colado, que esconde a topbar e pinta o fundo de branco. */}
      <header className="tb-header" data-stuck={stuck}>
        {/* 1 — topbar */}
        <div className="tb-topbar">
          <div className="tb-wrap flex items-center justify-between w-full">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Pagamento seguro · reposição garantida
            </span>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3.5 w-3.5" /> {contactEmail}
              </a>
            )}
          </div>
        </div>

        {/* 2/3 — barra principal, transparente até colar */}
        <div className="tb-wrap tb-header-inner relative">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer" aria-label="Ir para a página inicial">
            {logoUrl && (
              <span className="w-10 h-10 rounded-full bg-white grid place-items-center p-1 shrink-0">
                <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" />
              </span>
            )}
            <span className="tb-brandtext text-lg md:text-xl font-black tracking-tight">{brand}</span>
          </button>

          {/* O painel é filho do <nav>: assim o ponteiro continua "dentro" da
              área do menu ao descer do link para o painel, e o onMouseLeave
              não dispara no meio do caminho. */}
          {/* self-stretch: o <nav> ocupa a altura inteira do header, de modo que
              descer do link até o painel nunca sai da área do menu. */}
          <nav className="hidden lg:flex items-center gap-7 ml-4 self-stretch" onMouseLeave={scheduleCloseMega}>
            <button
              className="tb-navlink"
              aria-expanded={megaOpen}
              aria-haspopup="true"
              onMouseEnter={openMega}
              onFocus={openMega}
              onClick={() => (megaOpen ? setMegaOpen(false) : openMega())}
            >
              Serviços <ChevronDown className="h-4 w-4" />
            </button>
            {LINKS.map(l => (
              <button key={l.section} className="tb-navlink" onClick={() => go(l.section)}>{l.label}</button>
            ))}
            <button className="tb-navlink" onClick={() => navigate('/blog')}>Blog</button>

            {megaOpen && (
              <div className="tb-mega grid" onMouseEnter={cancelClose}>
                {netList.map(p => (
                  <button key={p.id} className="tb-mega-item" onClick={() => pickPlatform(p.id)}>
                    <span
                      className="w-11 h-11 rounded-full grid place-items-center text-white shrink-0"
                      style={{ background: platformGradient(p.id) }}
                    >
                      <PlatformIcon id={p.id} className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-black" style={{ color: 'var(--tb-ink)' }}>{p.name}</span>
                      <span className="block text-sm" style={{ color: 'var(--tb-muted)' }}>
                        Seguidores, curtidas e visualizações
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={goToAccount} className="tb-btn !min-h-[42px] !px-5 !text-sm">
              <AccountIcon className="h-4 w-4" /> {accountLabel}
            </button>
            <button
              className="lg:hidden w-11 h-11 rounded-full grid place-items-center cursor-pointer"
              style={{ background: stuck ? 'var(--tb-bg)' : 'rgba(255,255,255,.18)', color: stuck ? 'var(--tb-ink)' : '#fff' }}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Repõe no fluxo a altura que o header fixo deixou de ocupar. */}
      <div className="tb-header-spacer" aria-hidden="true" />

      {/* Menu de tela cheia (mobile) */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[15] overflow-y-auto"
          style={{ background: 'var(--tb-bg)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="tb-wrap py-5">
            <div className="flex items-center justify-between">
              <span className="text-xl font-black" style={{ color: 'var(--tb-ink)' }}>{brand}</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
                className="w-11 h-11 rounded-full grid place-items-center cursor-pointer"
                style={{ background: '#fff', color: 'var(--tb-ink)', boxShadow: 'var(--tb-shadow)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 tb-card-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left font-black cursor-pointer"
                style={{ color: 'var(--tb-ink)' }}
                aria-expanded={mobileNets}
                onClick={() => setMobileNets(o => !o)}
              >
                Serviços
                <ChevronDown className="h-5 w-5" style={{ color: 'var(--tb-light)' }} />
              </button>
              {mobileNets && (
                <div className="px-3 pb-3">
                  {netList.map(p => (
                    <button key={p.id} className="tb-mega-item" onClick={() => pickPlatform(p.id)}>
                      <span
                        className="w-9 h-9 rounded-full grid place-items-center text-white shrink-0"
                        style={{ background: platformGradient(p.id) }}
                      >
                        <PlatformIcon id={p.id} className="h-4 w-4" />
                      </span>
                      <span className="font-bold" style={{ color: 'var(--tb-ink)' }}>{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 tb-card-sm p-2">
              {LINKS.map(l => (
                <button
                  key={l.section}
                  onClick={() => go(l.section)}
                  className="w-full text-left px-3 py-3.5 font-black cursor-pointer"
                  style={{ color: 'var(--tb-ink)' }}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => { setMenuOpen(false); navigate('/blog'); }}
                className="w-full text-left px-3 py-3.5 font-black cursor-pointer"
                style={{ color: 'var(--tb-ink)' }}
              >
                Blog
              </button>
            </div>

            <button onClick={goToAccount} className="tb-btn w-full mt-4">
              <AccountIcon className="h-4 w-4" /> {accountLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
