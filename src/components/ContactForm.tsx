import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquareCode, CheckCircle2 } from 'lucide-react';
import { CompanySettings } from '../utils/storage';

interface ContactFormProps {
  company?: CompanySettings | null;
}

export default function ContactForm({ company }: ContactFormProps) {
  const contactEmail = company?.contactEmail || 'contato@impulsionegram.com.br';
  const whatsappNumber = company?.whatsappNumber || '5511999999999';
  const whatsappDisplay = company?.whatsappDisplay || '(11) 99999-9999';
  const address = company?.address || 'Av. Paulista, 1000 - Bela Vista - São Paulo / SP';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Mensagem).');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setErrorMsg('');
      
      setTimeout(() => setSubmitted(false), 3500);
    }, 1500);
  };

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

          {/* Form Card Block (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            
            {submitted ? (
              <div className="text-center py-16 space-y-4 animate-scale-up">
                <div className="mx-auto bg-green-50 text-green-750 p-3 rounded-full inline-block">
                  <CheckCircle2 className="h-10 w-10 fill-current text-white bg-green-500 rounded-full" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">Mensagem Enviada!</h3>
                <p className="text-slate-500 text-xs font-semibold max-w-sm mx-auto">
                  Sua mensagem foi recebida por nossa fila central de atendimento. Retornaremos em breve no e-mail informado.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 font-semibold text-slate-700">
                
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2.5 font-bold">
                    ⚠ {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase block font-mono">Seu Nome *</label>
                    <input
                      type="text"
                      placeholder="Ex: Pedro Henrique"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs rounded py-2.5 px-3 focus:outline-none focus:border-primary text-slate-800"
                      id="contact-name-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase block font-mono">Seu E-mail *</label>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs rounded py-2.5 px-3 focus:outline-none focus:border-primary text-slate-800"
                      id="contact-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase block font-bold font-mono">Assunto</label>
                  <input
                    type="text"
                    placeholder="Ex: Parcerias ou Pacote customizado"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs rounded py-2.5 px-3 focus:outline-none focus:border-primary text-slate-800"
                    id="contact-subject-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase block font-bold font-mono">Sua Mensagem *</label>
                  <textarea
                    placeholder="Escreva sua solicitação com riqueza de detalhes se desejar que nossos gestores criem um projeto personalizado..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs rounded py-2.5 px-3 focus:outline-none focus:border-primary text-slate-800"
                    id="contact-message-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all duration-200"
                  id="contact-submit-btn"
                >
                  {submitting ? 'Enviando...' : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
