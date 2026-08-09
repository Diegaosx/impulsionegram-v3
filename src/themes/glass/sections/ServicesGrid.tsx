// Grid de serviços do tema "Cristal".
//
// A referência não expõe catálogo nenhum, mas define um chip circular de rede
// social (78px, ladrilho de ícone com gradiente) que ela usa como seletor de
// plataforma. É exatamente o que precisamos aqui, então o filtro do grid usa
// esse componente, e os cards usam o .card de vidro.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformName, platformsWithServices, useCatalog } from '../../../utils/catalog';
import { ServiceItem, SocialPlatform } from '../../../types';
import { serviceSlug } from '../../../utils/storage';
import { sellablePackages } from '../../../site/pricing';
import PlatformGlyph from '../../../components/PlatformGlyph';
import { Check, Layers } from 'lucide-react';

interface ServicesGridProps {
  services: ServiceItem[];
  /** Abre o checkout direto, já no pacote que o card anunciou. */
  onBuy: (service: ServiceItem, packageId?: string) => void;
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Cores de marca por rede, como a referência faz nos ladrilhos de ícone.
const BRAND_BG: Record<string, string> = {
  instagram: 'linear-gradient(135deg, #ee2f87, #ff8a00)',
  tiktok: '#111',
  youtube: '#ff1d1d',
  facebook: '#1977f3',
  twitter: '#5b8dff',
  kwai: '#ff8a00'
};


export default function GlassServicesGrid({ services, onBuy }: ServicesGridProps) {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<SocialPlatform | 'todos'>('todos');
  // Redes cadastradas no painel.
  const catalog = useCatalog();

  const availablePlatforms = useMemo(
    () => platformsWithServices(catalog, services),
    [catalog, services]
  );

  const visible = useMemo(
    () => (platform === 'todos' ? services : services.filter(s => s.platform === platform)),
    [services, platform]
  );

  // O pacote que o card anuncia é o mais barato: é ele que abre no checkout e
  // que já vem selecionado na página de detalhes.
  const startingPackage = (s: ServiceItem) => {
    const pkgs = sellablePackages(s);
    if (!pkgs.length) return undefined;
    return pkgs.reduce((cheapest, p) => (p.price < cheapest.price ? p : cheapest), pkgs[0]);
  };

  const startingPrice = (s: ServiceItem) => {
    const pkg = startingPackage(s);
    if (pkg) return pkg.price;
    return Math.round(s.pricePerItem * (s.minQuantity || 1000) * 100) / 100;
  };

  const detailsHref = (s: ServiceItem) => {
    const pkg = startingPackage(s);
    return `/servico/${serviceSlug(s)}${pkg ? `?pacote=${encodeURIComponent(pkg.id)}` : ''}`;
  };

  return (
    <section id="servicos" className="gl-wrap py-8 md:py-16">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
          Escolha o seu <span className="gl-accent">serviço</span>
        </h2>
        <p className="mt-3 text-lg" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>
          Selecione a rede social e o tipo de engajamento. Entrega automática e reposição garantida.
        </p>
      </div>

      {availablePlatforms.length > 1 && (
        <div className="flex flex-wrap justify-center gap-4 md:gap-[22px] mt-9" role="group" aria-label="Filtrar por rede social">
          <button className="gl-net" aria-pressed={platform === 'todos'} onClick={() => setPlatform('todos')} title="Todas as redes">
            <span className="gl-net-icon"><Layers className="h-6 w-6" /></span>
            <span className="sr-only">Todas as redes</span>
          </button>
          {availablePlatforms.map(p => (
            <button
              key={p.id}
              className="gl-net"
              aria-pressed={platform === p.id}
              onClick={() => setPlatform(p.id)}
              title={p.name}
            >
              <span className="gl-net-icon" style={{ background: BRAND_BG[p.id] || 'var(--gl-grad-brand)' }}>
                <PlatformGlyph platform={p} />
              </span>
              <span className="sr-only">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center mt-10" style={{ color: 'var(--gl-body)' }}>
          Nenhum serviço disponível para esta rede no momento.
        </p>
      ) : (
        // A referência pula de 1 para 3 colunas em 981px, deixando o tablet com
        // cards larguíssimos. Aqui há um estágio de 2 colunas.
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-9">
          {visible.map(s => {
            const platName = platformName(catalog, s.platform);
            return (
              <article key={s.id} className="gl-card p-[26px] flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="gl-tile" style={{ background: BRAND_BG[s.platform] || 'var(--gl-grad-brand)' }}>
                    <PlatformGlyph platform={catalog.platforms.find(p => p.id === s.platform)} />
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--gl-muted)' }}>{platName.split('/')[0]}</span>
                </div>

                <h3 className="text-[22px] font-bold mt-4" style={{ color: 'var(--gl-ink)' }}>{s.label}</h3>

                <p className="mt-2 text-base" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>
                  Entrega {s.deliverySpeed?.toLowerCase() || 'rápida'} · a partir de {s.minQuantity?.toLocaleString('pt-BR')} un.
                </p>

                {s.benefits?.length > 0 && (
                  <ul className="mt-4 space-y-2 flex-1">
                    {s.benefits.slice(0, 3).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-base" style={{ color: 'var(--gl-body)' }}>
                        <Check className="h-4 w-4 shrink-0 mt-1" style={{ color: 'var(--gl-success)' }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--gl-line)' }}>
                  <p className="text-sm" style={{ color: 'var(--gl-muted)' }}>A partir de</p>
                  <p className="text-3xl font-black" style={{ color: 'var(--gl-ink)' }}>{money(startingPrice(s))}</p>
                </div>

                <div className="flex flex-wrap gap-2.5 mt-5">
                  <button onClick={() => onBuy(s, startingPackage(s)?.id)} className="gl-btn flex-1 !min-h-[46px] !px-5">
                    Comprar
                  </button>
                  <button onClick={() => navigate(detailsHref(s))} className="gl-btn gl-btn-ghost !min-h-[46px] !px-5">
                    Detalhes
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
