import { Instagram, Youtube, Twitter, Facebook, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { SocialPlatform } from '../types';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onSetPlatformFilter: (platform: SocialPlatform | 'todos') => void;
}

export default function Footer({ onNavigate, onSetPlatformFilter }: FooterProps) {
  
  const handleServiceClick = (p: SocialPlatform) => {
    onSetPlatformFilter(p);
    onNavigate('servicos');
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 font-semibold text-xs border-t border-slate-800 relative z-30">
      
      {/* Upper Footer: Multi-column grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Column 1: Logo & Brief (4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            <button 
              onClick={() => onNavigate('inicio')}
              className="flex items-center gap-1 font-display text-lg font-bold tracking-tight cursor-pointer"
            >
              <span className="text-primary font-black">Impulsione</span>
              <span className="text-white font-light">Gram</span>
            </button>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm font-semibold">
              Especialistas em marketing de alta performance de redes sociais desde 2018. Líderes nacionais no provimento de engajamento acelerado estável com contas reais brasileiras.
            </p>
            {/* Quick social links */}
            <div className="flex gap-2 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white p-2 rounded transition-colors" title="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white p-2 rounded transition-colors" title="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white p-2 rounded transition-colors" title="TikTok">
                <Flame className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (2 columns) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-slate-200 text-xs font-black uppercase tracking-widest">Navegação</h4>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => onNavigate('inicio')} className="text-left hover:text-white transition-colors cursor-pointer">Início</button>
              <button onClick={() => onNavigate('servicos')} className="text-left hover:text-white transition-colors cursor-pointer">Serviços Premium</button>
              <button onClick={() => onNavigate('calculadora')} className="text-left hover:text-white transition-colors cursor-pointer">Calculadora</button>
              <button onClick={() => onNavigate('planos')} className="text-left hover:text-white transition-colors cursor-pointer">Planos Populares</button>
              <button onClick={() => onNavigate('como-funciona')} className="text-left hover:text-white transition-colors cursor-pointer">Como Funciona</button>
              <button onClick={() => onNavigate('depoimentos')} className="text-left hover:text-white transition-colors cursor-pointer">Depoimentos</button>
            </div>
          </div>

          {/* Column 3: Platform Services (2 columns) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-slate-200 text-xs font-black uppercase tracking-widest">Serviços</h4>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => handleServiceClick('instagram')} className="text-left hover:text-white transition-colors cursor-pointer">Instagram BR</button>
              <button onClick={() => handleServiceClick('tiktok')} className="text-left hover:text-white transition-colors cursor-pointer">TikTok</button>
              <button onClick={() => handleServiceClick('youtube')} className="text-left hover:text-white transition-colors cursor-pointer">YouTube</button>
              <button onClick={() => handleServiceClick('twitter')} className="text-left hover:text-white transition-colors cursor-pointer">Twitter/X</button>
              <button onClick={() => handleServiceClick('facebook')} className="text-left hover:text-white transition-colors cursor-pointer">Facebook</button>
              <button onClick={() => handleServiceClick('kwai')} className="text-left hover:text-white transition-colors cursor-pointer">Kwai</button>
            </div>
          </div>

          {/* Column 4: Legal & Support (2 columns) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-slate-200 text-xs font-black uppercase tracking-widest">Suporte</h4>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => onNavigate('contato')} className="text-left hover:text-white transition-colors cursor-pointer">Fale Conosco</button>
              <button onClick={() => onNavigate('faq')} className="text-left hover:text-white transition-colors cursor-pointer">Perguntas Frequentes</button>
              <a href="#termos" className="hover:text-white transition-colors">Termos de Serviço</a>
              <a href="#privacidade" className="hover:text-white transition-colors">Política de Privacidade</a>
              <a href="#garantia" className="hover:text-white transition-colors">Garantia Integrada</a>
            </div>
          </div>

          {/* Column 5: Payment & Office (2 columns) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-slate-200 text-xs font-black uppercase tracking-widest">Atendimento</h4>
            <div className="space-y-4">
              <div>
                <span className="text-slate-500 font-bold block mb-1">E-mail:</span>
                <a href="mailto:contato@impulsionegram.com.br" className="text-slate-300 hover:text-white block font-bold break-all">
                  contato@impulsionegram.com.br
                </a>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">WhatsApp:</span>
                <a href="https://api.whatsapp.com/send?phone=5511999999999" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white block font-bold">
                  (11) 99999-9999
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Middle Footer: Payment Partners & Certifications */}
      <div className="bg-slate-950 border-t border-slate-800 py-8 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-slate-500 font-bold uppercase block text-[10px]">Gateways integrados seguros parceiros de pagamento:</span>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 opacity-60">
              <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-white font-black font-mono">🇧🇷 PIX</span>
              <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-white font-bold font-mono">VISA</span>
              <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-white font-bold font-mono">MASTERCARD</span>
              <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-white font-bold font-mono">ELO</span>
              <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded text-white font-bold font-mono">BOLETO</span>
            </div>
          </div>

          <div className="space-y-1.5 text-center md:text-right">
            <span className="text-slate-500 font-bold uppercase block text-[10px]">Certificados de Segurança Ativos:</span>
            <div className="flex gap-2 justify-center md:justify-end opacity-65">
              <span className="bg-slate-900 border border-slate-800 text-green-400 font-black text-[10px] px-2.5 py-1 rounded">🛡️ SSL CRIPTOGRAFADO</span>
              <span className="bg-slate-900 border border-slate-800 text-primary font-black text-[10px] px-2.5 py-1 rounded font-mono">🔒 COMPLIANCE LGPD</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Footer: Copyright and legal notes */}
      <div className="bg-slate-950 border-t border-slate-800/50 py-6 text-center text-slate-500 text-[10px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p>© {currentYear} ImpulsioneGram. Todos os direitos reservados. CNPJ: 00.322.155/0001-99.</p>
          <p className="max-w-3xl mx-auto opacity-75 leading-relaxed font-semibold">
            Isenção de responsabilidade: ImpulsioneGram é uma assessoria privada independente de engajamento social. Não possuímos representação oficial, patrocínio ou vínculo com as marcas registradas Instagram, TikTok, Facebook, YouTube, Twitter/X ou parentes correlatos. Todas as marcas nominadas servem meramente como caráter descritivo técnico informacional.
          </p>
        </div>
      </div>

    </footer>
  );
}
