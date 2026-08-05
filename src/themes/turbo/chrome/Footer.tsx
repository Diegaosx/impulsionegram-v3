// Rodapé do tema "Turbo": faixa enxuta sobre o próprio fundo da página.
//
// Três blocos, como a referência: marca + redes à esquerda, links legais e
// selos no meio, copyright fechando embaixo de um filete.

import { useNavigate } from 'react-router-dom';
import { CompanySettings } from '../../../utils/storage';
import { Facebook, Instagram, Lock, MessageCircle, ShieldCheck, Youtube, Zap } from 'lucide-react';

interface FooterProps {
  siteName?: string;
  logoUrl?: string;
  company?: CompanySettings | null;
  onNavigate: (sectionId: string) => void;
}

const SEALS = [
  { icon: <Lock className="h-4 w-4" />, label: 'Site seguro' },
  { icon: <ShieldCheck className="h-4 w-4" />, label: 'Reposição 30 dias' },
  { icon: <Zap className="h-4 w-4" />, label: 'Entrega automática' }
];

export default function TurboFooter({ siteName, logoUrl, company, onNavigate }: FooterProps) {
  const navigate = useNavigate();
  const brand = siteName || 'ImpulsioneGram';
  const year = new Date().getFullYear();

  const legal = [
    { label: 'Termos de Uso', go: () => navigate('/termos') },
    { label: 'Privacidade', go: () => navigate('/privacidade') },
    { label: 'Garantia', go: () => navigate('/garantia') },
    { label: 'Ajuda', go: () => navigate('/ajuda') },
    { label: 'Blog', go: () => navigate('/blog') },
    { label: 'Serviços', go: () => onNavigate('servicos') }
  ];

  const socials = [
    { href: company?.socialInstagram, icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
    { href: company?.socialFacebook, icon: <Facebook className="h-4 w-4" />, label: 'Facebook' },
    { href: company?.socialYoutube, icon: <Youtube className="h-4 w-4" />, label: 'YouTube' }
  ].filter(s => !!s.href);

  return (
    <footer style={{ background: 'var(--tb-bg)' }}>
      <div className="tb-wrap pt-10 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              {logoUrl && (
                <span className="w-10 h-10 rounded-full bg-white grid place-items-center p-1 shrink-0" style={{ boxShadow: 'var(--tb-shadow)' }}>
                  <img src={logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                </span>
              )}
              <span className="text-lg font-black" style={{ color: 'var(--tb-ink)' }}>{brand}</span>
            </div>

            {socials.length > 0 && (
              <div className="flex items-center gap-2.5 mt-4">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-10 h-10 rounded-full grid place-items-center text-white"
                    style={{ background: 'var(--tb-brand)' }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="min-w-[240px]">
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
              {legal.map(l => (
                <button key={l.label} onClick={l.go} className="cursor-pointer hover:text-[var(--tb-brand)]" style={{ color: 'var(--tb-body)' }}>
                  {l.label}
                </button>
              ))}
            </nav>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-sm font-bold" style={{ color: 'var(--tb-muted)' }}>
              {SEALS.map(s => (
                <span key={s.label} className="inline-flex items-center gap-1.5">{s.icon} {s.label}</span>
              ))}
            </div>
          </div>

          {company?.whatsappNumber && (
            <a
              href={`https://wa.me/${company.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tb-btn !min-h-[44px] !px-5 !text-sm"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          )}
        </div>

        {(company?.footerDescription || company?.footerDisclaimer) && (
          <div className="mt-8 space-y-2 text-xs leading-relaxed" style={{ color: 'var(--tb-muted)' }}>
            {company?.footerDescription && <p>{company.footerDescription}</p>}
            {company?.footerDisclaimer && <p>{company.footerDisclaimer}</p>}
          </div>
        )}

        <p className="mt-8 pt-6 text-sm" style={{ borderTop: '1px solid var(--tb-line)', color: 'var(--tb-muted)' }}>
          {company?.copyrightText || `© ${year} ${brand}. Todos os direitos reservados.`}
        </p>
      </div>
    </footer>
  );
}
