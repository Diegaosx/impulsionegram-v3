// Grid de serviços do tema "Turbo".
//
// O seletor de redes é o carrossel de bolinhas da referência (rolagem com
// encaixe + setas que herdam o gradiente da rede ativa). Os cards seguem o
// vocabulário do tema: branco, raio 30, sombra única, preço em peso 900.
//
// Regras de negócio idênticas às dos outros temas: "Comprar" abre o checkout
// já no pacote que o card anunciou e "Detalhes" leva à página do serviço com
// ?pacote=<id>, para a calculadora abrir no mesmo pacote.

import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformName, platformsWithServices, useCatalog } from '../../../utils/catalog';
import { ServiceItem, SocialPlatform } from '../../../types';
import { serviceSlug } from '../../../utils/storage';
import { sellablePackages } from '../../../site/pricing';
import PlatformIcon, { platformGradient } from '../chrome/PlatformIcon';
import { Check, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface ServicesGridProps {
  services: ServiceItem[];
  platform: SocialPlatform | 'todos';
  onPlatformChange: (platform: SocialPlatform | 'todos') => void;
  /** Abre o checkout direto, já no pacote que o card anunciou. */
  onBuy: (service: ServiceItem, packageId?: string) => void;
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TurboServicesGrid({ services, platform, onPlatformChange, onBuy }: ServicesGridProps) {
  const navigate = useNavigate();
  // Redes cadastradas no painel.
  const catalog = useCatalog();
  const railRef = useRef<HTMLDivElement>(null);

  const availablePlatforms = useMemo(
    () => platformsWithServices(catalog, services),
    [catalog, services]
  );

  const visible = useMemo(
    () => (platform === 'todos' ? services : services.filter(s => s.platform === platform)),
    [services, platform]
  );

  // O pacote anunciado é o mais barato: é ele que abre no checkout e o que já
  // vem selecionado na página de detalhes.
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

  const scrollRail = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <section id="servicos" className="tb-wrap py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="tb-kicker">Catálogo</span>
        <h2 className="tb-title mt-2.5">Escolha a sua rede</h2>
        <p className="tb-lead mt-3.5">
          Selecione a rede social e o serviço. Entrega automática, pagamento por PIX e reposição garantida.
        </p>
      </div>

      {availablePlatforms.length > 1 && (
        <div className="flex items-center gap-3 mt-9">
          <button className="tb-arrow hidden md:grid" aria-label="Rolar para a esquerda" onClick={() => scrollRail(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div ref={railRef} className="tb-rail flex-1 justify-start md:justify-center" role="group" aria-label="Filtrar por rede social">
            <button className="tb-net" aria-pressed={platform === 'todos'} onClick={() => onPlatformChange('todos')}>
              <span className="tb-net-icon"><Layers className="h-6 w-6" /></span>
              <span className="tb-net-label">Todas</span>
            </button>
            {availablePlatforms.map(p => (
              <button key={p.id} className="tb-net" aria-pressed={platform === p.id} onClick={() => onPlatformChange(p.id)}>
                <span className="tb-net-icon" style={{ background: platformGradient(p.id) }}>
                  <PlatformIcon item={p} />
                </span>
                <span className="tb-net-label">{p.name.split('/')[0]}</span>
              </button>
            ))}
          </div>

          <button className="tb-arrow hidden md:grid" aria-label="Rolar para a direita" onClick={() => scrollRail(1)}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-center mt-12 tb-lead">Nenhum serviço disponível para esta rede no momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {visible.map(s => {
            const platName = platformName(catalog, s.platform);
            return (
              <article key={s.id} className="tb-card p-7 flex flex-col">
                <div className="flex items-center gap-3">
                  <span
                    className="w-12 h-12 rounded-full grid place-items-center text-white shrink-0"
                    style={{ background: platformGradient(s.platform) }}
                  >
                    <PlatformIcon item={catalog.platforms.find(x => x.id === s.platform)} id={s.platform} className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--tb-muted)' }}>
                    {platName.split('/')[0]}
                  </span>
                </div>

                <h3 className="text-[22px] font-black mt-4" style={{ color: 'var(--tb-ink)', lineHeight: 1.2 }}>{s.label}</h3>

                <p className="mt-2 text-[15px]" style={{ color: 'var(--tb-body)', lineHeight: 1.6 }}>
                  Entrega {s.deliverySpeed?.toLowerCase() || 'rápida'} · a partir de {s.minQuantity?.toLocaleString('pt-BR')} un.
                </p>

                {s.benefits?.length > 0 && (
                  <ul className="mt-4 space-y-2 flex-1">
                    {s.benefits.slice(0, 3).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15px]" style={{ color: 'var(--tb-body)' }}>
                        <Check className="h-4 w-4 shrink-0 mt-1" style={{ color: 'var(--tb-success)' }} /> {b}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--tb-line)' }}>
                  <span className="tb-kicker">A partir de</span>
                  <p className="text-[32px] font-black mt-1" style={{ color: 'var(--tb-ink)' }}>{money(startingPrice(s))}</p>
                </div>

                <div className="flex flex-wrap gap-2.5 mt-5">
                  <button onClick={() => onBuy(s, startingPackage(s)?.id)} className="tb-btn flex-1 !min-h-[46px] !px-5">
                    Comprar
                  </button>
                  <button onClick={() => navigate(detailsHref(s))} className="tb-btn tb-btn-ghost !min-h-[46px] !px-5">
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
