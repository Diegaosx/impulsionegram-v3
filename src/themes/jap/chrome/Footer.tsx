// Rodapé do tema "Painel": faixa única em azul-bebê, links na horizontal,
// régua e aviso de copyright.
//
// Diferente da referência, o logo continua visível no desktop — lá ele existe
// no DOM mas é renderizado com width:0, o que parece um bug do tema.

import { useNavigate } from 'react-router-dom';
import { CompanySettings } from '../../../utils/storage';

interface FooterProps {
  siteName?: string;
  logoUrl?: string;
  company?: CompanySettings | null;
  onNavigate: (sectionId: string) => void;
}

export default function JapFooter({ siteName, logoUrl, company, onNavigate }: FooterProps) {
  const navigate = useNavigate();
  const year = new Date().getFullYear();
  const brand = siteName || 'ImpulsioneGram';

  const links: { label: string; go: () => void }[] = [
    { label: 'Serviços', go: () => onNavigate('servicos') },
    { label: 'Blog', go: () => navigate('/blog') },
    { label: 'Ajuda', go: () => navigate('/ajuda') },
    { label: 'Termos de Uso', go: () => navigate('/termos') },
    { label: 'Privacidade', go: () => navigate('/privacidade') },
    { label: 'Garantia', go: () => navigate('/garantia') }
  ];

  return (
    <footer style={{ background: 'var(--jap-surface-tint)' }}>
      <div className="max-w-[1320px] mx-auto px-6 lg:px-3 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <button onClick={() => navigate('/')} className="self-center md:self-auto cursor-pointer" aria-label="Ir para a página inicial">
            {logoUrl
              ? <img src={logoUrl} alt={brand} className="h-9 w-auto object-contain" />
              : <span className="text-lg font-bold" style={{ color: 'var(--jap-ink)' }}>{brand}</span>}
          </button>

          <ul className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {links.map(l => (
              <li key={l.label}>
                <button
                  onClick={l.go}
                  className="text-sm hover:underline cursor-pointer"
                  style={{ color: 'var(--jap-footer-link)' }}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {company?.footerDescription && (
          <p className="text-sm mt-6 max-w-3xl mx-auto md:mx-0 text-center md:text-left" style={{ color: 'var(--jap-body)' }}>
            {company.footerDescription}
          </p>
        )}

        <hr className="mt-6" style={{ borderColor: 'var(--jap-border-footer)' }} />

        <div className="pt-10 pb-4 text-center space-y-3">
          <p className="text-xs" style={{ color: 'var(--jap-body)' }}>
            {company?.copyrightText || `© ${year} ${brand}. Todos os direitos reservados.`}
          </p>
          {company?.footerDisclaimer && (
            <p className="text-xs max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--jap-body)' }}>
              {company.footerDisclaimer}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
