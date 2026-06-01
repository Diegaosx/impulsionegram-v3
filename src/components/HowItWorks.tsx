import { STEP_PROCESS } from '../data';
import { MousePointerClick, UserCheck, Shield, TrendingUp, HelpCircle } from 'lucide-react';

export default function HowItWorks() {
  
  const getIcon = (iconName: string, className = "h-6 w-6 text-primary") => {
    switch (iconName) {
      case 'MousePointerClick': return <MousePointerClick className={className} />;
      case 'UserCheck': return <UserCheck className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  return (
    <section id="como-funciona" className="py-20 bg-slate-50 relative overflow-hidden border-b border-slate-200">
      
      {/* Visual styling background elements */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 z-0 pointer-events-none hidden lg:block -translate-y-12" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
            Simplicidade no Fluxo
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
            Como Funciona Nosso Serviço?
          </h2>
          <p className="text-slate-500 mt-3 text-sm font-semibold max-w-xl mx-auto leading-relaxed">
            Em menos de 1 minuto você configura sua entrega e nosso algoritmo inteligente inicia o impulsionamento sem riscos.
          </p>
        </div>

        {/* 4 Steps Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEP_PROCESS.map((proc, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg p-6 border border-slate-200 relative text-center hover:border-primary/50 transition-all duration-200 group"
            >
              {/* Number Circle Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded bg-primary font-mono font-black text-white text-xs flex items-center justify-center border border-primary shadow-sm">
                0{proc.step}
              </div>

              {/* Icon Container */}
              <div className="mt-4 mb-4 bg-slate-50 p-3.5 rounded border border-slate-200 inline-block transition-all">
                {getIcon(proc.icon, "h-6 w-6 text-primary")}
              </div>

              {/* Text */}
              <h3 className="font-display font-bold text-slate-800 text-sm mb-2">
                {proc.title}
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                {proc.description}
              </p>

              {/* Connecting indicators for desktop */}
              {index < 3 && (
                <div className="hidden lg:block absolute top-[44%] -right-4 translate-x-1.5 z-20 text-slate-300 pointer-events-none text-base font-black font-mono">
                  ➜
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
