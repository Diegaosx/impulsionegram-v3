import { Mail, Phone, MapPin } from 'lucide-react';
import { CompanySettings } from '../../../utils/storage';
import SupportCta from '../../../components/SupportCta';

interface ContactFormProps {
  company?: CompanySettings | null;
}

// Seção "Fale Conosco" da home.
//
// O formulário aberto saiu: o atendimento passou a ser por ticket, e ticket
// exige conta — é o que dá histórico ao cliente e um dono à mensagem. Os canais
// diretos (e-mail, WhatsApp, endereço) continuam, porque para uma dúvida rápida
// abrir um ticket é burocracia demais.
export default function ContactForm({ company }: ContactFormProps) {
  const contactEmail = company?.contactEmail || 'contato@impulsionegram.com.br';
  const whatsappNumber = company?.whatsappNumber || '5511999999999';
  const whatsappDisplay = company?.whatsappDisplay || '(11) 99999-9999';
  const address = company?.address || 'Av. Paulista, 1000 - Bela Vista - São Paulo / SP';
  return (
    <section id="contato" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
            Atendimento Exclusivo
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
            Fale Conosco
          </h2>
          <p className="text-slate-500 mt-3 text-sm font-semibold">
            Tire suas dúvidas ou solicite um pacote de grande escala corporativa. Respondemos em até 2 horas.
          </p>
        </div>

        {/* 2 Column Layout (Info vs Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
          
          {/* Info Card Block (5 cols) */}
          <div className="lg:col-span-12 lg:lg:col-span-5 bg-slate-900 text-white rounded-lg p-8 relative overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.1),transparent_60%)]" />

            <div className="space-y-6 relative z-10">
              <h3 className="font-display font-bold text-lg text-white">Canais Oficiais</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Caso prefira suporte humanizado instantâneo, utilize nosso número de WhatsApp ou envie uma correspondência eletrônica.
              </p>

              {/* Contacts info */}
              <div className="space-y-5 pt-4">
                <div className="flex items-start gap-3.5">
                  <div className="bg-slate-800 p-2 rounded text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block font-mono">E-mail Corporativo</span>
                    <a href={`mailto:${contactEmail}`} className="text-sm font-bold text-white hover:text-primary block mt-0.5">
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="bg-slate-800 p-2 rounded text-green-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block font-mono">WhatsApp de Vendas</span>
                    <a href={`https://api.whatsapp.com/send?phone=${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white hover:text-green-400 block mt-0.5">
                      {whatsappDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="bg-slate-800 p-2 rounded text-accent">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block font-mono">Escritório Central (Apenas Adm)</span>
                    <p className="text-xs text-slate-300 font-semibold block mt-0.5 leading-relaxed">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick security claim */}
            <div className="border-t border-slate-800 pt-6 mt-8 relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">Segurança de Dados</span>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal font-medium">
                Seus segredos comerciais e ordens de compra estão protegidos de acordos jurídicos sob sigilo corporativo absoluto.
              </p>
            </div>

          </div>

          {/* Atendimento por ticket (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm flex items-center">
            <SupportCta className="w-full" />
          </div>

        </div>

      </div>
    </section>
  );
}
