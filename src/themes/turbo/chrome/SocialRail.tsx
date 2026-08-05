// Barra social fixa na borda esquerda (60px, roxo, cantos 0 20px 20px 0).
//
// É uma assinatura visual da referência. Só aparece a partir de 768px — abaixo
// disso a faixa roubaria a lateral inteira da tela — e some por completo se o
// painel não cadastrou nenhuma rede.

import { CompanySettings } from '../../../utils/storage';
import { TikTokIcon, XIcon, KwaiIcon } from '../../../components/icons/BrandIcons';
import { Facebook, Instagram, Youtube } from 'lucide-react';

export default function TurboSocialRail({ company }: { company?: CompanySettings | null }) {
  const links = [
    { href: company?.socialInstagram, label: 'Instagram', icon: <Instagram className="h-5 w-5" /> },
    { href: company?.socialTiktok, label: 'TikTok', icon: <TikTokIcon className="h-5 w-5" /> },
    { href: company?.socialYoutube, label: 'YouTube', icon: <Youtube className="h-5 w-5" /> },
    { href: company?.socialFacebook, label: 'Facebook', icon: <Facebook className="h-5 w-5" /> },
    { href: company?.socialTwitter, label: 'Twitter/X', icon: <XIcon className="h-5 w-5" /> },
    { href: company?.socialKwai, label: 'Kwai', icon: <KwaiIcon className="h-5 w-5" /> }
  ].filter(l => !!l.href);

  if (links.length === 0) return null;

  return (
    <nav className="tb-rail-social" aria-label="Nossas redes sociais">
      {links.map(l => (
        <a key={l.label} href={l.href as string} target="_blank" rel="noopener noreferrer" aria-label={l.label}>
          {l.icon}
        </a>
      ))}
    </nav>
  );
}
