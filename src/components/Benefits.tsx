import { BENEFITS } from '../data';
import { Users, Zap, MessageCircle, ShieldCheck, Lock, CreditCard, HelpCircle } from 'lucide-react';

export default function Benefits() {
  
  const getIcon = (iconName: string, className = "h-8 w-8 text-primary") => {
    switch (iconName) {
      case 'Users': return <Users className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'MessageCircle': return <MessageCircle className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Lock': return <Lock className={className} />;
      case 'CreditCard': return <CreditCard className={className} />;
      default: return <HelpCircle className={className} />;
    }
  };

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
            Diferenciais de Autoridade
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
            Por Que Escolher a ImpulsioneGram?
          </h2>
          <p className="text-slate-500 mt-3 text-sm font-semibold max-w-xl mx-auto leading-relaxed">
            Entregamos resultados tangíveis de crescimento combinando máxima segurança de dados, alta fidelidade e suporte instantâneo.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BENEFITS.map((benefit, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary/50 transition-all duration-200 relative group"
            >
              {/* Icon Container */}
              <div className="mb-4 bg-slate-50 p-3 rounded-lg inline-block border border-slate-200 group-hover:scale-105 transition-transform duration-300">
                {getIcon(benefit.icon, "h-6 w-6 text-primary")}
              </div>

              {/* Text */}
              <h3 className="font-display font-bold text-slate-800 text-lg mb-2.5 group-hover:text-primary transition-colors">
                {benefit.title}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                {benefit.description}
              </p>
              
              {/* Absolute Corner Deco */}
              <div className="absolute top-4 right-4 text-slate-200/60 font-mono font-black text-lg transition-colors select-none">
                0{index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Confidence Banner */}
        <div className="mt-16 bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-display font-black text-slate-800 text-lg">Garantia Blindada ImpulsioneGram</h4>
            <p className="text-slate-500 text-xs font-semibold">Seus seguidores estão protegidos por lei. Transações asseguradas nos termos integrais de sigilo e LGPD.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Certificado SSL 256-bit
            </div>
            <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700">
              <Lock className="h-4 w-4 text-primary" />
              100% Livre de Risco
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
