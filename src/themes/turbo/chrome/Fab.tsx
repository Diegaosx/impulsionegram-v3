// Botão flutuante de atendimento (64x64) com halo pulsante.
//
// Na referência ele abre uma janela de 400x620. Aqui a janela existe e é
// alimentada pelos canais que o painel cadastrou — WhatsApp, e-mail e a página
// de ajuda —, em vez de um chat de terceiros que o dashboard não controla.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Mail, MessageCircle, X } from 'lucide-react';
import { CompanySettings } from '../../../utils/storage';

export default function TurboFab({ company }: { company?: CompanySettings | null }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const digits = (company?.whatsappNumber || '').replace(/\D/g, '');
  const whats = digits ? `https://wa.me/${digits.length > 11 ? digits : '55' + digits}` : null;
  const email = company?.contactEmail || '';

  return (
    <>
      {open && (
        <div className="tb-chatbox" role="dialog" aria-label="Fale com a gente">
          <div className="p-5 text-white" style={{ background: 'var(--tb-grad-brand)', borderRadius: 'var(--tb-r-card) var(--tb-r-card) 0 0' }}>
            <p className="text-lg font-black">Fale com a gente</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,.85)' }}>
              Atendimento em português, todos os dias.
            </p>
          </div>

          <div className="p-4 space-y-2.5">
            {whats && (
              <a href={whats} target="_blank" rel="noopener noreferrer" className="tb-mega-item">
                <span className="w-10 h-10 rounded-full grid place-items-center text-white shrink-0" style={{ background: 'var(--tb-success)' }}>
                  <MessageCircle className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-black" style={{ color: 'var(--tb-ink)' }}>WhatsApp</span>
                  <span className="block text-sm" style={{ color: 'var(--tb-muted)' }}>{company?.whatsappDisplay || 'Resposta rápida'}</span>
                </span>
              </a>
            )}

            {email && (
              <a href={`mailto:${email}`} className="tb-mega-item">
                <span className="w-10 h-10 rounded-full grid place-items-center text-white shrink-0" style={{ background: 'var(--tb-brand)' }}>
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-black" style={{ color: 'var(--tb-ink)' }}>E-mail</span>
                  <span className="block text-sm break-all" style={{ color: 'var(--tb-muted)' }}>{email}</span>
                </span>
              </a>
            )}

            <button className="tb-mega-item" onClick={() => { setOpen(false); navigate('/ajuda'); }}>
              <span className="w-10 h-10 rounded-full grid place-items-center text-white shrink-0" style={{ background: 'var(--tb-light)' }}>
                <HelpCircle className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-black" style={{ color: 'var(--tb-ink)' }}>Central de ajuda</span>
                <span className="block text-sm" style={{ color: 'var(--tb-muted)' }}>Dúvidas frequentes e formulário</span>
              </span>
            </button>
          </div>
        </div>
      )}

      <button
        className="tb-fab"
        aria-expanded={open}
        aria-label={open ? 'Fechar atendimento' : 'Abrir atendimento'}
        onClick={() => setOpen(o => !o)}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
