import { useEffect, useState } from 'react';
import { Cookie, Shield, X, Check } from 'lucide-react';
import { recordCookieConsent, CookieChoices } from '../utils/storage';

const STORAGE_KEY = 'cookie_consent_v1';

interface StoredConsent {
  id: string;
  choices: CookieChoices;
  ts: string;
}

function readStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.choices) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `cc-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      setAnalytics(stored.choices.analytics);
      setMarketing(stored.choices.marketing);
    } else {
      setVisible(true);
    }
  }, []);

  const persist = (choices: CookieChoices) => {
    const stored = readStored();
    const id = stored?.id || newId();
    const record: StoredConsent = { id, choices, ts: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* ignore */
    }
    recordCookieConsent(id, choices);
    setVisible(false);
    setShowPrefs(false);
  };

  const acceptAll = () => persist({ necessary: true, analytics: true, marketing: true });
  const rejectNonEssential = () => persist({ necessary: true, analytics: false, marketing: false });
  const savePrefs = () => persist({ necessary: true, analytics, marketing });

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      {!showPrefs && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900/95 backdrop-blur shadow-2xl border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-3xl w-11/12 text-white animate-slide-up">
          <div className="flex items-start gap-3">
            <Cookie className="h-6 w-6 text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-300 leading-normal font-semibold text-left">
              Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência, otimizar a velocidade de carregamento dos planos e personalizar ofertas. Você pode escolher quais aceitar. Saiba mais na nossa <a href="#privacidade" className="text-secondary hover:underline">Política de Privacidade de Dados</a> (LGPD).
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <button
              onClick={() => setShowPrefs(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] py-2.5 px-4 rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
            >
              Personalizar
            </button>
            <button
              onClick={rejectNonEssential}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] py-2.5 px-4 rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
            >
              Recusar
            </button>
            <button
              onClick={acceptAll}
              className="bg-primary hover:bg-purple-700 text-white font-bold text-[11px] py-2.5 px-5 rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
              id="accept-cookies-btn"
            >
              Aceitar Todos
            </button>
          </div>
        </div>
      )}

      {/* Preferences modal */}
      {showPrefs && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-display font-black text-base">Preferências de Cookies</h3>
              </div>
              <button onClick={() => setShowPrefs(false)} className="text-slate-400 hover:text-white p-1 rounded cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Necessary (locked) */}
              <div className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4 bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Necessários</h4>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">Essenciais para o funcionamento do site. Sempre ativos.</p>
                </div>
                <span className="text-[10px] font-black uppercase text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-full shrink-0">Sempre ativo</span>
              </div>

              {/* Analytics */}
              <label className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Análise & Desempenho</h4>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">Ajudam a entender o uso do site para melhorar a experiência.</p>
                </div>
                <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="h-5 w-5 rounded text-primary focus:ring-primary border-slate-300 mt-0.5 shrink-0" />
              </label>

              {/* Marketing */}
              <label className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Marketing & Personalização</h4>
                  <p className="text-slate-500 text-xs font-semibold mt-0.5">Usados para personalizar ofertas e medir campanhas.</p>
                </div>
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="h-5 w-5 rounded text-primary focus:ring-primary border-slate-300 mt-0.5 shrink-0" />
              </label>
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button onClick={rejectNonEssential} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transition-colors">
                Recusar não essenciais
              </button>
              <button onClick={savePrefs} className="bg-primary hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Check className="h-4 w-4" /> Salvar preferências
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
