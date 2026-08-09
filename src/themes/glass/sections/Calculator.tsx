// Calculadora + checkout do tema "Cristal".
//
// Toda a lógica vem dos hooks compartilhados: preço, faixas de desconto,
// validação, conta-na-hora e criação do pedido são idênticos aos dos outros
// temas. Aqui só existe marcação.
//
// A referência não tem calculadora nem catálogo público. O que ela deixou
// prontos e órfãos no CSS foram justamente as duas peças que faltavam: o campo
// de 54px (.field) e o diálogo de 520px com raio 28 (.modal-box). A seção foi
// montada em cima deles.

import { ReactNode, useEffect, useRef } from 'react';
import { AuthUser } from '../../../utils/storage';
import { ServiceItem, SocialPlatform } from '../../../types';
import { platformsWithServices, useCatalog } from '../../../utils/catalog';
import { useServiceSelection } from '../../../site/hooks/useServiceSelection';
import { useCheckout } from '../../../site/hooks/useCheckout';
import { useProfilePreview } from '../../../site/hooks/useProfilePreview';
import OrderConfirmation from '../../../components/OrderConfirmation';
import TargetHint from '../../../components/TargetHint';
import { Minus, Plus, X, Loader2, AlertCircle } from 'lucide-react';

interface CalculatorProps {
  services?: ServiceItem[];
  initialPlatform?: SocialPlatform;
  initialType?: string;
  restrictServiceId?: string;
  initialPackageId?: string;
  currentUser?: AuthUser | null;
  onAuthSuccess?: (user: AuthUser) => void;
  onOrderCreated?: () => void;
  embedded?: boolean;
  /** Só o modal, sem o painel — usado pelo botão "Comprar" dos cards. */
  modalOnly?: boolean;
  autoOpen?: boolean;
  onClose?: () => void;
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function GlassCalculator({
  services, initialPlatform, initialType, restrictServiceId, initialPackageId,
  currentUser, onAuthSuccess, onOrderCreated, embedded, modalOnly, autoOpen, onClose
}: CalculatorProps) {
  const sel = useServiceSelection({
    services, initialPlatform, initialType, restrictServiceId, initialPackageId,
    // Abre no mínimo do serviço, para bater com o "a partir de" dos cards.
    preferMinimumQuantity: true
  });
  const { platform, serviceType, quantity, activeService, activePackages, hasPackages, selectedPackageId, price } = sel;

  const privateProfileRef = useRef(false);
  const checkout = useCheckout({
    platform, serviceType, service: activeService, quantity, price: price.finalPrice,
    currentUser, onAuthSuccess, onOrderCreated,
    isTargetProfilePrivate: () => privateProfileRef.current
  });

  const lookupEnabled = platform === 'instagram' && serviceType === 'followers';
  const preview = useProfilePreview({ handle: checkout.fields.username, enabled: checkout.isOpen && lookupEnabled });
  useEffect(() => {
    privateProfileRef.current = preview.status === 'found' && !!preview.profile?.isPrivate;
  }, [preview]);

  const opened = useRef(false);
  useEffect(() => {
    if (autoOpen && !opened.current && activeService) {
      opened.current = true;
      checkout.open();
    }
  }, [autoOpen, activeService, checkout]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (checkout.isOpen) wasOpen.current = true;
    else if (wasOpen.current) { wasOpen.current = false; onClose?.(); }
  }, [checkout.isOpen, onClose]);

  const { fields, fieldErrors } = checkout;
  // Redes vêm do catálogo do painel: uma rede nova aparece sem tocar em código.
  const catalog = useCatalog();
  const availablePlatforms = platformsWithServices(catalog, services || []);
  // Vem do catálogo, via useCheckout: um tipo novo já aparece certo.
  const needsPostUrl = checkout.needsPost;

  const stepLabel = (n: number) => (restrictServiceId ? `${n - 2}.` : `${n}.`);

  const panel = (
    <div className="gl-card p-[26px]">
      {!restrictServiceId && availablePlatforms.length > 0 && (
        <>
          <p className="text-sm font-black mb-3" style={{ color: 'var(--gl-muted)' }}>1. Rede social</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {availablePlatforms.map(p => (
              <button key={p.id} className="gl-chip" aria-pressed={platform === p.id} onClick={() => sel.setPlatform(p.id)}>
                {p.name.split('/')[0]}
              </button>
            ))}
          </div>

          <p className="text-sm font-black mb-3" style={{ color: 'var(--gl-muted)' }}>2. Serviço</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {sel.categoriesList.map(c => (
              <button key={c.type} className="gl-chip" aria-pressed={serviceType === c.type} onClick={() => sel.setServiceType(c.type)}>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      {hasPackages ? (
        <>
          <p className="text-sm font-black mb-3" style={{ color: 'var(--gl-muted)' }}>{stepLabel(3)} Escolha o pacote</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {activePackages.map(pkg => {
              const on = pkg.id === selectedPackageId;
              return (
                <button
                  key={pkg.id}
                  onClick={() => sel.selectPackage(pkg)}
                  aria-pressed={on}
                  className="text-left p-3.5 cursor-pointer transition-transform hover:-translate-y-0.5"
                  style={{
                    background: on ? 'rgba(123,22,216,.06)' : '#fff',
                    border: `1px solid ${on ? 'var(--gl-purple)' : 'var(--gl-line)'}`,
                    borderRadius: 'var(--gl-r-field)'
                  }}
                >
                  <span className="block text-sm font-bold" style={{ color: 'var(--gl-ink)' }}>
                    {pkg.label || `${pkg.quantity.toLocaleString('pt-BR')} un.`}
                  </span>
                  <span className="block text-lg font-black mt-1" style={{ color: 'var(--gl-purple)' }}>{money(pkg.price)}</span>
                  {pkg.isPopular && (
                    <span className="inline-block mt-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white"
                      style={{ background: 'var(--gl-grad-brand)' }}>Popular</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : activeService ? (
        <>
          <p className="text-sm font-black mb-3" style={{ color: 'var(--gl-muted)' }}>{stepLabel(3)} Quantidade</p>

          {sel.presets.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {sel.presets.map(q => (
                <button key={q} className="gl-chip" aria-pressed={quantity === q} onClick={() => sel.applyQuantity(q)}>
                  {q.toLocaleString('pt-BR')}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => sel.decrementQuantity(100)} className="gl-btn gl-btn-ghost !min-h-[46px] !px-3.5" aria-label="Diminuir quantidade">
              <Minus className="h-4 w-4" />
            </button>
            <input
              className="gl-field text-center font-black"
              value={sel.customInput}
              onChange={e => sel.setCustomInput(e.target.value)}
              onBlur={sel.commitCustomInput}
              inputMode="numeric"
              aria-label="Quantidade"
            />
            <button onClick={() => sel.incrementQuantity(100)} className="gl-btn gl-btn-ghost !min-h-[46px] !px-3.5" aria-label="Aumentar quantidade">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <input
            type="range"
            min={activeService.minQuantity}
            max={activeService.maxQuantity}
            step={100}
            value={quantity}
            onChange={e => sel.applyQuantity(parseInt(e.target.value, 10))}
            className="w-full mb-6 accent-[var(--gl-purple)]"
            aria-label="Selecionar quantidade"
          />
        </>
      ) : null}

      <div
        className="p-5 flex flex-wrap items-end justify-between gap-4"
        style={{ background: 'rgba(255,255,255,.55)', border: '1px solid var(--gl-line)', borderRadius: 'var(--gl-r-field)' }}
      >
        <div>
          <p className="text-sm" style={{ color: 'var(--gl-muted)' }}>Total</p>
          <p className="text-3xl font-black" style={{ color: 'var(--gl-ink)' }}>{money(price.finalPrice)}</p>
          {price.discountPercent > 0 && (
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--gl-success)' }}>
              {price.discountPercent}% de desconto por volume
            </p>
          )}
        </div>
        <button onClick={checkout.open} disabled={!activeService || price.finalPrice <= 0} className="gl-btn">
          Comprar agora
        </button>
      </div>
    </div>
  );

  return (
    <>
      {modalOnly ? null : embedded ? panel : (
        <section id="calculadora" className="gl-wrap py-8 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-9">
            <h2 className="font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
              Monte seu <span className="gl-accent">pedido</span>
            </h2>
            <p className="mt-3 text-lg" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>
              Escolha a rede, o serviço e a quantidade. O valor aparece na hora.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">{panel}</div>
        </section>
      )}

      {checkout.isOpen && (
        <div
          className="fixed inset-0 z-[20] flex items-start justify-center p-[22px] overflow-y-auto"
          style={{ background: 'rgba(16,35,61,.42)', backdropFilter: 'blur(10px)' }}
        >
          <div
            className="relative w-full mt-6 mb-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
            style={{ maxWidth: 520, background: '#fff', borderRadius: 'var(--gl-r-modal)', boxShadow: 'var(--gl-sh-modal)' }}
          >
            <button
              onClick={checkout.close}
              aria-label="Fechar"
              className="absolute right-[18px] top-[14px] cursor-pointer"
              style={{ color: 'var(--gl-muted)' }}
            >
              <X className="h-6 w-6" />
            </button>

            <div className="p-7">
              <h2 className="text-[30px] font-bold mb-2" style={{ color: 'var(--gl-ink)' }}>
                {checkout.step === 'done' ? 'Pedido criado' : 'Finalizar pedido'}
              </h2>

              {checkout.error && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-2xl mb-4"
                  style={{ background: 'rgba(217,43,107,.08)', color: 'var(--gl-danger)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {checkout.error}
                </div>
              )}

              {checkout.step === 'processing' && (
                <div className="py-10 flex flex-col items-center gap-3" style={{ color: 'var(--gl-body)' }}>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="font-bold">Processando…</p>
                </div>
              )}

              {checkout.step === 'info' && (
                <form onSubmit={checkout.submitInfo} className="space-y-4 mt-5">
                  <Field label="Perfil de destino" error={fieldErrors.username}>
                    <input className="gl-field" value={fields.username} placeholder="seuperfil"
                      onChange={e => checkout.setField('username', e.target.value)} />
                    <TargetHint result={checkout.normalizedProfile} raw={fields.username} />
                  </Field>

                  {preview.status === 'found' && preview.profile && (
                    <div className="flex items-center gap-3 p-3" style={{ background: 'rgba(8,114,216,.06)', borderRadius: 'var(--gl-r-field)' }}>
                      {preview.profile.profilePicUrl && (
                        <img src={preview.profile.profilePicUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div className="text-sm" style={{ color: 'var(--gl-body)' }}>
                        <p className="font-bold" style={{ color: 'var(--gl-ink)' }}>{preview.profile.fullName || preview.profile.username}</p>
                        <p>{preview.profile.followers?.toLocaleString('pt-BR')} seguidores</p>
                      </div>
                    </div>
                  )}

                  {!currentUser && (
                    <Field label="Seu nome" error={fieldErrors.fullName}>
                      <input className="gl-field" value={fields.fullName} onChange={e => checkout.setField('fullName', e.target.value)} />
                    </Field>
                  )}
                  <Field label="E-mail" error={fieldErrors.email}>
                    <input className="gl-field" type="email" value={fields.email} onChange={e => checkout.setField('email', e.target.value)} />
                  </Field>
                  <Field label="Telefone com DDD" error={fieldErrors.phone}>
                    <input className="gl-field" type="tel" value={fields.phone} onChange={e => checkout.setField('phone', e.target.value)} />
                  </Field>
                  {needsPostUrl && (
                    <Field label="Link da publicação" error={fieldErrors.postUrl}>
                      <input className="gl-field" value={fields.postUrl} onChange={e => checkout.setField('postUrl', e.target.value)} />
                      <TargetHint result={checkout.normalizedPost} raw={fields.postUrl} />
                    </Field>
                  )}
                  <Field label="Cupom (opcional)">
                    <input className="gl-field" value={fields.coupon} onChange={e => checkout.setField('coupon', e.target.value)} />
                  </Field>

                  {/* Mini calculadora: permite ajustar o pedido sem fechar o
                      checkout. Usa a mesma seleção do painel, então o total
                      acompanha na hora. */}
                  <div className="p-4 space-y-3" style={{ background: 'rgba(123,22,216,.05)', borderRadius: 'var(--gl-r-field)' }}>
                    <p className="text-sm font-black" style={{ color: 'var(--gl-muted)' }}>Personalizar pedido</p>

                    {hasPackages ? (
                      <div className="flex flex-wrap gap-2">
                        {activePackages.map(pkg => (
                          <button
                            key={pkg.id}
                            type="button"
                            className="gl-chip"
                            aria-pressed={pkg.id === selectedPackageId}
                            onClick={() => sel.selectPackage(pkg)}
                          >
                            {pkg.quantity.toLocaleString('pt-BR')} · {money(pkg.price)}
                          </button>
                        ))}
                      </div>
                    ) : activeService ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={activeService.minQuantity}
                          max={activeService.maxQuantity}
                          step={100}
                          value={quantity}
                          onChange={e => sel.applyQuantity(parseInt(e.target.value, 10))}
                          className="flex-1 accent-[var(--gl-purple)]"
                          aria-label="Quantidade"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => sel.decrementQuantity(100)}
                            className="gl-btn gl-btn-ghost !min-h-[34px] !px-2" aria-label="Diminuir quantidade">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-black min-w-[4.5rem] text-center" style={{ color: 'var(--gl-ink)' }}>
                            {quantity.toLocaleString('pt-BR')}
                          </span>
                          <button type="button" onClick={() => sel.incrementQuantity(100)}
                            className="gl-btn gl-btn-ghost !min-h-[34px] !px-2" aria-label="Aumentar quantidade">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <span className="font-black block" style={{ color: 'var(--gl-ink)' }}>Total</span>
                        <span className="text-sm" style={{ color: 'var(--gl-muted)' }}>
                          {quantity.toLocaleString('pt-BR')} un.
                          {price.discountPercent > 0 && ` · -${price.discountPercent}%`}
                        </span>
                      </div>
                      <span className="text-2xl font-black" style={{ color: 'var(--gl-purple)' }}>{money(price.finalPrice)}</span>
                    </div>
                  </div>

                  <button type="submit" className="gl-btn w-full">Avançar</button>
                </form>
              )}

              {checkout.step === 'account' && (
                <form onSubmit={checkout.submitAccount} className="space-y-4 mt-5">
                  <p style={{ color: 'var(--gl-body)' }}>Crie uma senha para acompanhar seu pedido.</p>
                  <Field label="Senha">
                    <input className="gl-field" type="password" value={fields.password}
                      onChange={e => checkout.setField('password', e.target.value)} />
                  </Field>
                  <Field label="Confirmar senha">
                    <input className="gl-field" type="password" value={fields.confirmPassword}
                      onChange={e => checkout.setField('confirmPassword', e.target.value)} />
                  </Field>
                  <button type="submit" className="gl-btn w-full">Criar conta e finalizar</button>
                </form>
              )}

              {checkout.step === 'login_prompt' && (
                <div className="space-y-3 mt-5 text-center">
                  <p style={{ color: 'var(--gl-body)' }}>Já existe uma conta com esses dados. Entre para concluir o pedido.</p>
                  <a href="/login" className="gl-btn w-full">Entrar</a>
                  <button onClick={() => checkout.setStep('info')} className="gl-btn gl-btn-ghost w-full">Voltar</button>
                </div>
              )}

              {checkout.step === 'done' && checkout.order && (
                <div className="mt-5">
                  <OrderConfirmation
                    order={checkout.order}
                    onGoToOrders={() => { window.location.href = '/minha-conta'; }}
                    onBuyMore={checkout.close}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-black block mb-1.5" style={{ color: 'var(--gl-muted)' }}>{label}</span>
      {children}
      {error && <span className="text-sm font-bold block mt-1" style={{ color: 'var(--gl-danger)' }}>{error}</span>}
    </label>
  );
}
