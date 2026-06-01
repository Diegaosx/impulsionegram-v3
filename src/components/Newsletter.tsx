import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setSubscribed(true);
    setEmail('');
    setErrorMsg('');
    setTimeout(() => setSubscribed(false), 4500);
  };

  return (
    <section className="py-16 bg-slate-950 text-white relative border-b border-slate-900/60">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {subscribed ? (
          <div className="space-y-4 animate-scale-up">
            <div className="mx-auto bg-white/10 text-white p-2.5 rounded inline-block">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-display font-bold text-xl">Parabéns! Inscrição Confirmada.</h3>
            <p className="text-slate-400 text-xs font-semibold max-w-sm mx-auto">
              Você agora receberá cupons relâmpago exclusivos e descontos de até 50% de seguidores brasileiros diretamente no e-mail.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-accent text-[9px] uppercase font-black tracking-widest block bg-white/10 px-2.5 py-1 rounded w-fit mx-auto font-mono">
                📬 Ofertas Relâmpago
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight mt-3">
                Receba Ofertas Exclusivas
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-lg mx-auto leading-relaxed">
                Cadastre seu melhor e-mail e fique por dentro das melhores promoções e bônus de curtidas grátis!
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/50 text-red-300 text-xs rounded p-2.5 font-bold max-w-md mx-auto">
                ⚠ {errorMsg}
              </div>
            )}

            {/* Newsletter input form */}
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
              <input
                type="email"
                placeholder="Insira seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 placeholder-slate-500 border border-slate-800 text-white text-xs rounded py-3 px-4 focus:outline-none focus:border-white flex-grow font-semibold outline-none"
                id="newsletter-email-input"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-blue-700 text-white font-bold px-6 py-3 rounded text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                id="newsletter-subscribe-btn"
              >
                Inscrever-se
              </button>
            </form>

            <p className="text-[10px] text-slate-500 font-semibold block font-mono">
              🛡️ Nunca enviamos spam. Seus dados estão protegidos de acordo com a LGPD.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
