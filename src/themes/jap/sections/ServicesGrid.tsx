// Grid de serviços.
//
// Seção nossa: a referência de layout não expõe catálogo nenhum publicamente,
// então ela foi montada com o vocabulário que a referência usa — chips de
// plataforma como filtro, cards brancos raio 16 com sombra suave, e o botão
// laranja uppercase.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platformName, platformsWithServices, useCatalog } from '../../../utils/catalog';
import { ServiceItem, SocialPlatform } from '../../../types';
import { serviceSlug } from '../../../utils/storage';
import { sellablePackages } from '../../../site/pricing';
import { Check } from 'lucide-react';

interface ServicesGridProps {
  services: ServiceItem[];
  /** Abre o checkout direto, já no pacote que o card anunciou. */
  onBuy: (service: ServiceItem, packageId?: string) => void;
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function JapServicesGrid({ services, onBuy }: ServicesGridProps) {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<SocialPlatform | 'todos'>('todos');
  // Redes cadastradas no painel.
  const catalog = useCatalog();

  // Só mostramos chips de plataformas que realmente têm serviço cadastrado.
  const availablePlatforms = useMemo(
    () => platformsWithServices(catalog, services),
    [catalog, services]
  );

  const visible = useMemo(
    () => (platform === 'todos' ? services : services.filter(s => s.platform === platform)),
    [services, platform]
  );

  // O pacote que o card anuncia: o mais barato. É ele que abre no checkout e
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

  // Leva o pacote na URL, para a página de detalhes abrir já nele (e o link
  // continuar compartilhável).
  const detailsHref = (s: ServiceItem) => {
    const pkg = startingPackage(s);
    return `/servico/${serviceSlug(s)}${pkg ? `?pacote=${encodeURIComponent(pkg.id)}` : ''}`;
  };

  return (
    <section id="servicos" className="py-[30px] md:py-[50px] lg:py-[90px]">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-3">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(24px, 3vw, 48px)', lineHeight: 1.2 }}>
            Nossos serviços
          </h2>
          <p className="mt-3 text-base" style={{ color: 'var(--jap-body)' }}>
            Escolha a rede e o tipo de engajamento. Entrega automática e reposição garantida.
          </p>
        </div>

        {availablePlatforms.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mt-8" role="group" aria-label="Filtrar por rede social">
            <button className="jap-chip" aria-pressed={platform === 'todos'} onClick={() => setPlatform('todos')}>
              Todas
            </button>
            {availablePlatforms.map(p => (
              <button key={p.id} className="jap-chip" aria-pressed={platform === p.id} onClick={() => setPlatform(p.id)}>
                {p.name.split('/')[0]}
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="text-center mt-10 text-sm" style={{ color: 'var(--jap-body)' }}>
            Nenhum serviço disponível para esta rede no momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {visible.map(s => {
              const platName = platformName(catalog, s.platform);
              return (
                <article key={s.id} className="jap-card p-5 md:p-10 flex flex-col">
                  <span className="jap-chip self-start" aria-hidden="true">{platName.split('/')[0]}</span>

                  <h3 className="font-bold mt-4 text-xl" style={{ color: 'var(--jap-ink)' }}>{s.label}</h3>

                  <p className="text-sm mt-2" style={{ color: 'var(--jap-body)' }}>
                    Entrega {s.deliverySpeed?.toLowerCase() || 'rápida'} · a partir de {s.minQuantity?.toLocaleString('pt-BR')} un.
                  </p>

                  {s.benefits?.length > 0 && (
                    <ul className="mt-4 space-y-2 flex-1">
                      {s.benefits.slice(0, 3).map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--jap-body)' }}>
                          <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--jap-success)' }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 pt-5" style={{ borderTop: `1px solid var(--jap-border-soft)` }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--jap-muted)' }}>A partir de</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--jap-ink)' }}>{money(startingPrice(s))}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5">
                    <button
                      onClick={() => onBuy(s, startingPackage(s)?.id)}
                      className="jap-btn jap-btn-sm jap-btn-primary flex-1"
                    >
                      Comprar
                    </button>
                    <button onClick={() => navigate(detailsHref(s))} className="jap-btn jap-btn-sm jap-btn-outline">
                      Detalhes
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
