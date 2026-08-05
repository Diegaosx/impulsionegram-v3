// Ícone e gradiente de cada rede social.
//
// O tema troca o gradiente do topo e das setas por rede, então o mapa de
// gradientes é token do tema (theme.css) e este arquivo só resolve o nome da
// variável. Redes que a referência lista mas que o catálogo ainda não vende
// continuam mapeadas: assim, cadastrar um serviço novo já sai com a cor certa.

import { SocialPlatform } from '../../../types';
import { TikTokIcon, KwaiIcon } from '../../../components/icons/BrandIcons';
import { Facebook, Instagram, Layers, Twitter, Youtube } from 'lucide-react';

const GRADIENTS: Record<string, string> = {
  instagram: 'var(--tb-grad-instagram)',
  youtube: 'var(--tb-grad-youtube)',
  facebook: 'var(--tb-grad-facebook)',
  twitter: 'var(--tb-grad-twitter)',
  twitch: 'var(--tb-grad-twitch)',
  tiktok: 'var(--tb-grad-tiktok)',
  linkedin: 'var(--tb-grad-linkedin)',
  telegram: 'var(--tb-grad-telegram)',
  kwai: 'var(--tb-grad-kwai)',
  spotify: 'var(--tb-theme-spotify)'
};

export function platformGradient(id?: string): string {
  return (id && GRADIENTS[id]) || 'var(--tb-grad-brand)';
}

export default function PlatformIcon({ id, className = 'h-6 w-6' }: { id?: SocialPlatform; className?: string }) {
  switch (id) {
    case 'instagram': return <Instagram className={className} />;
    case 'youtube': return <Youtube className={className} />;
    case 'twitter': return <Twitter className={className} />;
    case 'facebook': return <Facebook className={className} />;
    case 'tiktok': return <TikTokIcon className={className} />;
    case 'kwai': return <KwaiIcon className={className} />;
    default: return <Layers className={className} />;
  }
}
