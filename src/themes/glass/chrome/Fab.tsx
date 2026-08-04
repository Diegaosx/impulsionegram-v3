// Botão flutuante de contato. Na referência é um círculo verde fixo no canto
// que aponta para a aplicação; aqui ele abre o WhatsApp configurado no painel
// e, sem WhatsApp cadastrado, cai para a página de ajuda.

import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { CompanySettings } from '../../../utils/storage';

export default function GlassFab({ company }: { company?: CompanySettings | null }) {
  const navigate = useNavigate();
  const digits = (company?.whatsappNumber || '').replace(/\D/g, '');
  const href = digits ? `https://wa.me/${digits.length > 11 ? digits : '55' + digits}` : null;

  const common = {
    className: 'fixed right-[22px] bottom-[22px] w-[58px] h-[58px] rounded-full grid place-items-center z-[12] cursor-pointer',
    style: { background: 'var(--gl-success)', color: '#fff', boxShadow: 'var(--gl-sh-fab)' },
    'aria-label': href ? 'Falar no WhatsApp' : 'Ir para a ajuda'
  } as const;

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...common}>
      <MessageCircle className="h-6 w-6" />
    </a>
  ) : (
    <button onClick={() => navigate('/ajuda')} {...common}>
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
