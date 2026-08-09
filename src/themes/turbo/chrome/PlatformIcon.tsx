// Ícone e gradiente de cada rede social.
//
// O tema troca o gradiente do topo e das setas por rede, então o mapa de
// gradientes é token do tema (theme.css) e este arquivo só resolve o nome da
// variável. Redes que a referência lista mas que o catálogo ainda não vende
// continuam mapeadas: assim, cadastrar um serviço novo já sai com a cor certa.

import { SocialPlatform } from '../../../types';
import PlatformGlyph from '../../../components/PlatformGlyph';
import { SocialPlatformItem } from '../../../utils/catalog';

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

export default function PlatformIcon(
  { id, item, className = 'h-6 w-6' }: { id?: SocialPlatform; item?: SocialPlatformItem | null; className?: string }
) {
  // `item` vem do catálogo e honra o ícone/imagem escolhidos no painel; `id`
  // atende quem só tem o identificador (um pedido antigo, por exemplo).
  return <PlatformGlyph platform={item || (id ? { id, name: id, color: '', icon: DEFAULT_ICONS[id] || 'Layers' } : null)} className={className} />;
}

// Ícone padrão das redes embutidas, para quando só se tem o id.
const DEFAULT_ICONS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'Youtube',
  twitter: 'Twitter', facebook: 'Facebook', kwai: 'Kwai'
};
