// Rodapé do tema "Cristal": faixa única, sem colunas, separada por um filete.
// Marca à esquerda, nav horizontal no meio, aviso legal à direita; empilha por
// flex-wrap no mobile.
//
// Diferente da referência, os links levam às nossas páginas de verdade — lá os
// quatro apontavam todos para a mesma rota da aplicação.

import { useNavigate } from 'react-router-dom';
import { CompanySettings } from '../../../utils/storage';

interface FooterProps {
  siteName?: string;
  company?: CompanySettings | null;
  onNavigate: (sectionId: string) => void;
}

export default function GlassFooter({ siteName, company, onNavigate }: FooterProps) {
  const navigate = useNavigate();
  const brand = siteName || 'ImpulsioneGram';
  const year = new Date().getFullYear();

  const links = [
    { label: 'Serviços', go: () => onNavigate('servicos') },
    { label: 'Blog', go: () => navigate('/blog') },
    { label: 'Ajuda', go: () => navigate('/ajuda') },
    { label: 'Termos', go: () => navigate('/termos') },
    { label: 'Privacidade', go: () => navigate('/privacidade') },
    { label: 'Garantia', go: () => navigate('/garantia') }
  ];

  return (
    <footer className="gl-wrap">
      <div className="pt-7 pb-10" style={{ borderTop: '1px solid var(--gl-line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-[18px] text-sm" style={{ color: 'var(--gl-body)' }}>
          <strong className="font-black" style={{ color: 'var(--gl-ink)' }}>{brand}</strong>

          <nav className="flex flex-wrap gap-[18px]">
            {links.map(l => (
              <button key={l.label} onClick={l.go} className="cursor-pointer hover:text-[var(--gl-pink)]">
                {l.label}
              </button>
            ))}
          </nav>

          <span>{company?.copyrightText || `© ${year} ${brand}`}</span>
        </div>

        {(company?.footerDescription || company?.footerDisclaimer) && (
          <div className="mt-6 space-y-2 text-xs leading-relaxed" style={{ color: 'var(--gl-body)' }}>
            {company?.footerDescription && <p>{company.footerDescription}</p>}
            {company?.footerDisclaimer && <p>{company.footerDisclaimer}</p>}
          </div>
        )}
      </div>
    </footer>
  );
}
