import React, { useState } from 'react';
import { Mail, MessageCircle, HelpCircle, Send, Check, AlertCircle } from 'lucide-react';
import { HomeContent, CompanySettings, submitContactMessage } from '../utils/storage';
import { getRecaptchaToken } from '../utils/recaptcha';

interface HelpFormProps {
  homeContent: HomeContent | null;
  company?: CompanySettings | null;
  onGoFaq?: () => void;
}

// Reusable help/contact block (quick channels + message form) shared by the
// public help page and the client dashboard tab.
export default function HelpForm({ homeContent, company, onGoFaq }: HelpFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const whats = company?.whatsappNumber || homeContent?.companyWhatsApp || '5511999999999';
  const mail = company?.contactEmail || homeContent?.companyEmail || 'contato@impulsionegram.com.br';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Preencha nome, e-mail e mensagem.');
      return;
    }
    setSubmitting(true);
    const token = await getRecaptchaToken('contact');
    const res = await submitContactMessage({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }, token);
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } else {
      setError(res.error || 'Falha ao enviar a mensagem.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href={`https://api.whatsapp.com/send?phone=${whats}`} target="_blank" rel="noopener noreferrer"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-green-300 transition-colors text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-green-50 text-green-600"><MessageCircle className="h-5 w-5" /></div>
          <h3 className="font-bold text-slate-800 text-sm mt-3">WhatsApp</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Atendimento rápido</p>
        </a>
        <a href={`mailto:${mail}`}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-purple-50 text-primary"><Mail className="h-5 w-5" /></div>
          <h3 className="font-bold text-slate-800 text-sm mt-3">E-mail</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5 break-all">{mail}</p>
        </a>
        <button onClick={() => onGoFaq && onGoFaq()}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-sky-50 text-sky-600"><HelpCircle className="h-5 w-5" /></div>
          <h3 className="font-bold text-slate-800 text-sm mt-3">Perguntas frequentes</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Ver o FAQ</p>
        </button>
      </div>

      {/* Contact form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {submitted ? (
          <div className="text-center py-8 space-y-3" id="help-success">
            <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-lg text-slate-900">Mensagem enviada!</h3>
            <p className="text-slate-500 text-xs font-semibold">Recebemos sua mensagem e nossa equipe responderá no e-mail informado em breve.</p>
            <button onClick={() => setSubmitted(false)} className="text-primary text-xs font-bold hover:underline">Enviar outra mensagem</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-display font-black text-lg text-slate-900">Envie sua mensagem</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-2.5 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" id="help-name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" id="help-email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Assunto</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sobre o que você precisa de ajuda?"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" id="help-subject" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Mensagem</label>
              <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Descreva sua dúvida ou solicitação..."
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" id="help-message" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all" id="help-submit">
              {submitting ? 'Enviando...' : (<><Send className="h-4 w-4" /> Enviar mensagem</>)}
            </button>
            <p className="text-[10px] text-slate-400 text-center font-medium">Protegido por reCAPTCHA.</p>
          </form>
        )}
      </div>
    </div>
  );
}
