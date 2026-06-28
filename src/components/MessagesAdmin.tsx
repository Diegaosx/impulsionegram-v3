import { useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2, Inbox } from 'lucide-react';
import { ContactMessage, fetchContactMessages, setContactMessageStatus, deleteContactMessage } from '../utils/storage';
import { formatDateTime } from '../utils/datetime';

interface MessagesAdminProps {
  triggerSuccess: (msg: string) => void;
  triggerError: (msg: string) => void;
}

export default function MessagesAdmin({ triggerSuccess, triggerError }: MessagesAdminProps) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMessages(await fetchContactMessages());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  const toggleOpen = async (m: ContactMessage) => {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && m.status === 'unread') {
      try {
        await setContactMessageStatus(m.id, 'read');
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: 'read' } : x)));
      } catch { /* ignore */ }
    }
  };

  const markUnread = async (m: ContactMessage) => {
    try {
      await setContactMessageStatus(m.id, 'unread');
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: 'unread' } : x)));
    } catch { triggerError('Falha ao atualizar a mensagem.'); }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Excluir esta mensagem permanentemente?')) return;
    try {
      await deleteContactMessage(id);
      setMessages((prev) => prev.filter((x) => x.id !== id));
      triggerSuccess('Mensagem excluída.');
    } catch { triggerError('Falha ao excluir a mensagem.'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-black text-xl text-slate-900">Mensagens de Contato</h3>
        <p className="text-slate-500 text-xs font-semibold">
          Recebidas pelo formulário de "Fale Conosco" e pela Central de Ajuda.
          {unreadCount > 0 && <span className="text-primary font-bold"> {unreadCount} não lida(s).</span>}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : messages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
          <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" /> Nenhuma mensagem ainda.
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((m) => (
            <div key={m.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${m.status === 'unread' ? 'border-primary/30' : 'border-slate-200'}`}>
              <button onClick={() => toggleOpen(m)} className="w-full flex items-center gap-3 p-4 text-left">
                <div className={`shrink-0 p-2 rounded-lg ${m.status === 'unread' ? 'bg-purple-50 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                  {m.status === 'unread' ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm ${m.status === 'unread' ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{m.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{m.email}</span>
                    {m.status === 'unread' && <span className="text-[9px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-full">Novo</span>}
                  </div>
                  <p className="text-xs text-slate-500 font-semibold truncate">{m.subject || '(sem assunto)'}</p>
                </div>
                <span className="text-[10px] text-slate-300 font-mono shrink-0 hidden sm:block">{formatDateTime(m.createdAt)}</span>
              </button>
              {openId === m.id && (
                <div className="px-4 pb-4 -mt-1">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{m.message}</div>
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Sua mensagem'))}`}
                      className="flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-purple-50 border border-purple-200 rounded px-2 py-1 transition-colors">
                      <Mail className="h-3 w-3" /> Responder por e-mail
                    </a>
                    <button onClick={() => markUnread(m)} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors">
                      <Mail className="h-3 w-3" /> Marcar não lida
                    </button>
                    <button onClick={() => remove(m.id)} className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:bg-red-50 border border-red-200 rounded px-2 py-1 transition-colors">
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
