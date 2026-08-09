// Ícone de uma rede social do catálogo.
//
// Como as redes viraram cadastro, uma rede criada no painel precisa aparecer
// nos quatro temas sem alteração de código. A resolução é sempre a mesma:
//
//   imagem própria → ícone do conjunto → ícone genérico
//
// Concentrar isso aqui evita que cada tema invente o seu fallback e que uma
// rede nova apareça como um buraco em três lugares e certa no quarto.

import { ReactElement } from 'react';
import {
  Facebook, Flame, Ghost, Globe, Instagram, Layers, Linkedin, MessageCircle,
  Music2, Send, Twitch, Twitter, Youtube
} from 'lucide-react';
import { TikTokIcon, XIcon, KwaiIcon } from './icons/BrandIcons';
import { SocialPlatformItem } from '../utils/catalog';

// Conjunto oferecido no seletor do painel. A chave é o que fica gravado em
// `platform.icon`.
export const PLATFORM_ICONS: Record<string, (props: { className?: string }) => ReactElement> = {
  Instagram: ({ className }) => <Instagram className={className} />,
  TikTok: ({ className }) => <TikTokIcon className={className} />,
  Youtube: ({ className }) => <Youtube className={className} />,
  Twitter: ({ className }) => <Twitter className={className} />,
  X: ({ className }) => <XIcon className={className} />,
  Facebook: ({ className }) => <Facebook className={className} />,
  Kwai: ({ className }) => <KwaiIcon className={className} />,
  Flame: ({ className }) => <Flame className={className} />,
  Twitch: ({ className }) => <Twitch className={className} />,
  Linkedin: ({ className }) => <Linkedin className={className} />,
  Telegram: ({ className }) => <Send className={className} />,
  WhatsApp: ({ className }) => <MessageCircle className={className} />,
  Music: ({ className }) => <Music2 className={className} />,
  Snapchat: ({ className }) => <Ghost className={className} />,
  Globe: ({ className }) => <Globe className={className} />,
  Layers: ({ className }) => <Layers className={className} />
};

export const PLATFORM_ICON_NAMES = Object.keys(PLATFORM_ICONS);

interface PlatformGlyphProps {
  platform?: SocialPlatformItem | null;
  /** Usado quando a rede não está no catálogo (pedido antigo, por exemplo). */
  fallbackIcon?: string;
  className?: string;
}

export default function PlatformGlyph({ platform, fallbackIcon, className = 'h-6 w-6' }: PlatformGlyphProps) {
  if (platform?.imageUrl) {
    return (
      <img
        src={platform.imageUrl}
        alt=""
        aria-hidden="true"
        className={`${className} object-contain`}
      />
    );
  }
  const name = platform?.icon || fallbackIcon || 'Layers';
  const Icon = PLATFORM_ICONS[name] || PLATFORM_ICONS.Layers;
  return <Icon className={className} />;
}
