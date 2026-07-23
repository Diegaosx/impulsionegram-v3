import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICES, SOCIAL_PLATFORMS } from '../data';
import { SocialPlatform, ServiceItem } from '../types';
import { serviceSlug } from '../utils/storage';
import { Instagram, Youtube, Twitter, Facebook, Check, HelpCircle } from 'lucide-react';
import { TikTokIcon, KwaiIcon } from './icons/BrandIcons';

interface ServicesGridProps {
  onSelectService: (platform: SocialPlatform, type: string) => void;
  searchTerm?: string;
  onNavigate: (sectionId: string) => void;
  services?: ServiceItem[];
}

export default function ServicesGrid({ onSelectService, searchTerm = '', onNavigate, services }: ServicesGridProps) {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState<SocialPlatform | 'todos'>('todos');
  // Suppress unused-prop warnings: these remain part of the public API but the
  // card now navigates to a dedicated service page instead of scrolling.
  void onSelectService; void onNavigate;

  // Map platform string IDs to Lucide components
  const getIcon = (platform: SocialPlatform, className = "h-5 w-5") => {
    switch (platform) {
      case 'instagram': return <Instagram className={className} />;
      case 'youtube': return <Youtube className={className} />;
      case 'twitter': return <Twitter className={className} />;
      case 'facebook': return <Facebook className={className} />;
      case 'kwai': return <KwaiIcon className={className} />;
      case 'tiktok': return <TikTokIcon className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  // Filter services dynamically based on active tab and search query
  const filteredServices = useMemo(() => {
    const listToFilter = services || SERVICES;
    return listToFilter.filter((service) => {
      const matchPlatform = activePlatform === 'todos' || service.platform === activePlatform;
      const cleanSearch = searchTerm.toLowerCase().trim();
      if (!cleanSearch) return matchPlatform;

      const matchSearch = 
        service.label.toLowerCase().includes(cleanSearch) || 
        service.platform.toLowerCase().includes(cleanSearch) || 
        service.type.toLowerCase().includes(cleanSearch);

      return matchPlatform && matchSearch;
    });
  }, [activePlatform, searchTerm, services]);

  // Each card now opens the service's dedicated page.
  const goToService = (service: ServiceItem) => {
    navigate(`/servico/${serviceSlug(service)}`);
  };

  return (
    <section id="servicos" className="py-20 bg-slate-50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Nossos Serviços Premium
          </h2>
          <p className="text-slate-600 mt-3 text-lg font-medium">
            Soluções completas e seguras para alavancar autoridade digital nas maiores redes sociais do mundo.
          </p>
        </div>

        {/* Platform Categories Navigation Bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 overflow-x-auto pb-2">
          <button
            onClick={() => setActivePlatform('todos')}
            className={`px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer hover:bg-slate-200 ${
              activePlatform === 'todos'
                ? 'bg-primary! text-white border border-primary'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
            id="platform-tab-todos"
          >
            🌟 Ver Todos
          </button>
          
          {SOCIAL_PLATFORMS.map((plat) => (
            <button
              key={plat.id}
              onClick={() => setActivePlatform(plat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer hover:bg-slate-50 ${
                activePlatform === plat.id
                  ? 'bg-primary text-white border border-primary'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
              id={`platform-tab-${plat.id}`}
            >
              {getIcon(plat.id, "h-3.5 w-3.5")}
              {plat.name}
            </button>
          ))}
        </div>

        {/* Search Status */}
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-8 flex mb-8 items-center justify-between text-sm">
            <span>Resultados para a busca: <strong>"{searchTerm}"</strong> ({filteredServices.length} encontrados)</span>
            <button onClick={() => {}} className="text-blue-600 underline font-semibold invisible">Limpar</button>
          </div>
        )}

        {/* Empty state when no service matches */}
        {filteredServices.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm max-w-md mx-auto border border-slate-200">
            <HelpCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-lg">Nenhum serviço encontrado</h4>
            <p className="text-slate-500 text-sm mt-1">
              Não encontramos serviços para esta categoria ou busca. Tente buscar termos como "seguidores", "curtidas" ou mude o filtro para visualizar tudo.
            </p>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => {
            const platformConfig = SOCIAL_PLATFORMS.find(p => p.id === service.platform);
            const isInstagram = service.platform === 'instagram';
            const unitPriceStr = (service.pricePerItem * 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            let typeLabel = "Serviço";
            if (service.type === 'followers') typeLabel = "Seguidores";
            if (service.type === 'likes') typeLabel = "Curtidas";
            if (service.type === 'views') typeLabel = "Visualizações";
            if (service.type === 'stories') typeLabel = "Views Stories";

            return (
              <div 
                key={service.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full"
              >
                {/* Visual Header */}
                <div className="p-5 pb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="inline-flex items-center gap-1 bg-slate-900 text-white text-[9px] font-black tracking-wider uppercase px-2 py-1 rounded">
                      {getIcon(service.platform, "h-3 w-3")}
                      {platformConfig?.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      Ref: {service.type}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-slate-950 text-lg group-hover:text-primary transition-colors">
                    {service.label}
                  </h3>

                  <div className="mt-3.5 flex items-baseline">
                    <span className="text-slate-400 text-[10px] font-bold uppercase mr-1.5">A partir de</span>
                    <span className="font-display font-black text-slate-900 text-xl">R$ {unitPriceStr}</span>
                    <span className="text-slate-400 text-[10px] font-bold ml-1">/ 1.000 un.</span>
                  </div>

                  {/* Delivery Indicator */}
                  <div className="mt-3 bg-slate-50 text-slate-600 text-[10px] font-semibold py-1.5 px-3 rounded border border-slate-200/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span>{service.deliverySpeed}</span>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="px-5 py-3 border-t border-b border-slate-200 bg-slate-50/50 space-y-2 flex-grow">
                  {service.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-500 font-semibold">
                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Selection Action Button */}
                <div className="p-5">
                  <button
                    onClick={() => goToService(service)}
                    className="w-full text-center py-2.5 rounded border border-primary text-primary hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    id={`btn-select-${service.id}`}
                  >
                    Simular e Comprar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
