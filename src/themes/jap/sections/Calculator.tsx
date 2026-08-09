// Calculadora + checkout do tema "Painel".
//
// Toda a lógica vem de hooks compartilhados (src/site/hooks): preço, faixas de
// desconto, validação, conta-na-hora e criação do pedido são exatamente os
// mesmos do tema padrão. Aqui só existe marcação.
//
// A referência de layout não expõe calculadora nenhuma publicamente, então a
// seção foi montada com o vocabulário dela: card branco raio 16, chips de
// plataforma, campos de 50px e o botão laranja uppercase.

import { AuthUser } from '../../../utils/storage';
import { ServiceItem, SocialPlatform } from '../../../types';
import { SOCIAL_PLATFORMS } from '../../../data';
import { useServiceSelection } from '../../../site/hooks/useServiceSelection';
import { useCheckout } from '../../../site/hooks/useCheckout';
import { useProfilePreview } from '../../../site/hooks/useProfilePreview';
import OrderConfirmation from '../../../components/OrderConfirmation';
import TargetHint from '../../../components/TargetHint';
import { ReactNode, useEffect, useRef } from 'react';
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
  // Renderiza só o modal de checkout, sem o painel da calculadora. Usado pelo
  // botão "Comprar" dos cards do grid, que compra direto sem passar pela
  // seção da calculadora.
  modalOnly?: boolean;
  // Abre o checkout assim que monta (combina com modalOnly).
  autoOpen?: boolean;
  onClose?: () => void;
}

const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function JapCalculator({
  services, initialPlatform, initialType, restrictServiceId, initialPackageId,
  currentUser, onAuthSuccess, onOrderCreated, embedded, modalOnly, autoOpen, onClose
}: CalculatorProps) {
  const sel = useServiceSelection({
    services, initialPlatform, initialType, restrictServiceId, initialPackageId,
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

  // Abre o checkout na montagem quando o cliente já escolheu o que comprar.
  const opened = useRef(false);
  useEffect(() => {
    if (autoOpen && !opened.current && activeService) {
      opened.current = true;
      checkout.open();
    }
  }, [autoOpen, activeService, checkout]);

  // Avisa o pai quando o modal fecha, para ele desmontar este componente.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (checkout.isOpen) wasOpen.current = true;
    else if (wasOpen.current) { wasOpen.current = false; onClose?.(); }
  }, [checkout.isOpen, onClose]);

  const { fields, fieldErrors } = checkout;
  const availablePlatforms = SOCIAL_PLATFORMS.filter(p => (services || []).some(s => s.platform === p.id));
  const needsPostUrl = activeService && activeService.type !== 'followers';

  const body = (
    <div className="jap-card p-5 md:p-10">
      {!restrictServiceId && availablePlatforms.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wide font-bold mb-3" style={{ color: 'var(--jap-muted)' }}>1. Rede social</p>
          <div className="flex flex-wrap gap-2 mb-7">
            {availablePlatforms.map(p => (
              <button key={p.id} className="jap-chip" aria-pressed={platform === p.id} onClick={() => sel.setPlatform(p.id)}>
                {p.name.split('/')[0]}
              </button>
            ))}
          </div>

          <p className="text-xs uppercase tracking-wide font-bold mb-3" style={{ color: 'var(--jap-muted)' }}>2. Serviço</p>
          <div className="flex flex-wrap gap-2 mb-7">
            {sel.categoriesList.map(c => (
              <button key={c.type} className="jap-chip" aria-pressed={serviceType === c.type} onClick={() => sel.setServiceType(c.type)}>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      {hasPackages ? (
        <>
          <p className="text-xs uppercase tracking-wide font-bold mb-3" style={{ color: 'var(--jap-muted)' }}>
            {restrictServiceId ? '1.' : '3.'} Escolha o pacote
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-7">
            {activePackages.map(pkg => {
              const on = pkg.id === selectedPackageId;
              return (
                <button
                  key={pkg.id}
                  onClick={() => sel.selectPackage(pkg)}
                  aria-pressed={on}
                  className="text-left p-3 rounded-lg border transition-all cursor-pointer"
                  style={{
                    background: on ? 'var(--jap-surface-tint)' : 'var(--jap-surface)',
                    borderColor: on ? 'var(--jap-orange)' : 'var(--jap-border)'
                  }}
                >
                  <span className="block text-sm font-bold" style={{ color: 'var(--jap-ink)' }}>
                    {pkg.label || `${pkg.quantity.toLocaleString('pt-BR')} un.`}
                  </span>
                  <span className="block text-lg font-bold mt-1" style={{ color: 'var(--jap-orange-ink)' }}>{money(pkg.price)}</span>
                  {pkg.isPopular && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                      style={{ background: 'var(--jap-blue-08)', color: 'var(--jap-blue)' }}>Popular</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : activeService ? (
        <>
          <p className="text-xs uppercase tracking-wide font-bold mb-3" style={{ color: 'var(--jap-muted)' }}>
            {restrictServiceId ? '1.' : '3.'} Quantidade
          </p>
          {sel.presets.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {sel.presets.map(q => (
                <button
                  key={q}
                  className="jap-chip"
                  aria-pressed={quantity === q}
                  onClick={() => sel.applyQuantity(q)}
                >
                  {q.toLocaleString('pt-BR')}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => sel.decrementQuantity(500)} className="jap-btn jap-btn-sm jap-btn-outline !px-3" aria-label="Diminuir quantidade">
              <Minus className="h-4 w-4" />
            </button>
            <input
              className="jap-input text-center font-bold"
              value={sel.customInput}
              onChange={e => sel.setCustomInput(e.target.value)}
              onBlur={sel.commitCustomInput}
              inputMode="numeric"
              aria-label="Quantidade"
            />
            <button onClick={() => sel.incrementQuantity(500)} className="jap-btn jap-btn-sm jap-btn-outline !px-3" aria-label="Aumentar quantidade">
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
            className="w-full mb-7 accent-[var(--jap-orange)]"
            aria-label="Selecionar quantidade"
          />
        </>
      ) : null}

      <div className="jap-card-tint p-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--jap-muted)' }}>Total</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--jap-ink)' }}>{money(price.finalPrice)}</p>
          {price.discountPercent > 0 && (
            <p className="text-xs font-bold mt-1" style={{ color: 'var(--jap-success)' }}>
              {price.discountPercent}% de desconto por volume aplicado
            </p>
          )}
        </div>
        <button onClick={checkout.open} disabled={!activeService || price.finalPrice <= 0} className="jap-btn jap-btn-primary disabled:opacity-50">
          Comprar agora
        </button>
      </div>
    </div>
  );

  return (
    <>
      {modalOnly ? null : embedded ? body : (
        <section id="calculadora" className="py-[30px] md:py-[50px] lg:py-[90px]" style={{ background: 'var(--jap-surface-tint)' }}>
          <div className="max-w-[1320px] mx-auto px-6 lg:px-3">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(24px, 3vw, 48px)', lineHeight: 1.2 }}>
                Monte seu pedido
              </h2>
              <p className="mt-3 text-base" style={{ color: 'var(--jap-body)' }}>
                Escolha a rede, o serviço e a quantidade. O valor aparece na hora.
              </p>
            </div>
            <div className="max-w-3xl mx-auto">{body}</div>
          </div>
        </section>
      )}

      {checkout.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-start justify-center p-4 overflow-y-auto" style={{ background: 'rgba(2,14,33,.55)' }}>
          <div className="jap-card w-full max-w-lg mt-8 mb-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--jap-border)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--jap-ink)' }}>
                {checkout.step === 'done' ? 'Pedido criado' : 'Finalizar pedido'}
              </h3>
              <button onClick={checkout.close} aria-label="Fechar" className="cursor-pointer" style={{ color: 'var(--jap-body)' }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {checkout.error && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg mb-4"
                  style={{ background: 'rgba(216,80,72,.08)', color: 'var(--jap-danger)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {checkout.error}
                </div>
              )}

              {checkout.step === 'processing' && (
                <div className="py-10 flex flex-col items-center gap-3" style={{ color: 'var(--jap-body)' }}>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm font-bold">Processando...</p>
                </div>
              )}

              {checkout.step === 'info' && (
                <form onSubmit={checkout.submitInfo} className="space-y-4">
                  <Field label="Perfil de destino" error={fieldErrors.username}>
                    <input className="jap-input" value={fields.username} placeholder="seuperfil"
                      onChange={e => checkout.setField('username', e.target.value)} />
                    <TargetHint result={checkout.normalizedProfile} raw={fields.username} />
                  </Field>

                  {preview.status === 'found' && preview.profile && (
                    <div className="jap-card-tint p-3 flex items-center gap-3">
                      {preview.profile.profilePicUrl && (
                        <img src={preview.profile.profilePicUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div className="text-xs" style={{ color: 'var(--jap-body)' }}>
                        <p className="font-bold" style={{ color: 'var(--jap-ink)' }}>{preview.profile.fullName || preview.profile.username}</p>
                        <p>{preview.profile.followers?.toLocaleString('pt-BR')} seguidores</p>
                      </div>
                    </div>
                  )}

                  {!currentUser && (
                    <Field label="Seu nome" error={fieldErrors.fullName}>
                      <input className="jap-input" value={fields.fullName} onChange={e => checkout.setField('fullName', e.target.value)} />
                    </Field>
                  )}
                  <Field label="E-mail" error={fieldErrors.email}>
                    <input className="jap-input" type="email" value={fields.email} onChange={e => checkout.setField('email', e.target.value)} />
                  </Field>
                  <Field label="Telefone com DDD" error={fieldErrors.phone}>
                    <input className="jap-input" type="tel" value={fields.phone} onChange={e => checkout.setField('phone', e.target.value)} />
                  </Field>
                  {needsPostUrl && (
                    <Field label="Link da publicação" error={fieldErrors.postUrl}>
                      <input className="jap-input" value={fields.postUrl} onChange={e => checkout.setField('postUrl', e.target.value)} />
                      <TargetHint result={checkout.normalizedPost} raw={fields.postUrl} />
                    </Field>
                  )}
                  <Field label="Cupom (opcional)">
                    <input className="jap-input" value={fields.coupon} onChange={e => checkout.setField('coupon', e.target.value)} />
                  </Field>

                  {/* Mini calculadora: deixa o cliente ajustar o pedido sem
                      fechar o checkout. Usa a mesma seleção da calculadora, então
                      o total abaixo acompanha na hora. */}
                  <div className="jap-card-tint p-4 space-y-3">
                    <p className="text-xs uppercase tracking-wide font-bold" style={{ color: 'var(--jap-muted)' }}>
                      Personalizar pedido
                    </p>

                    {hasPackages ? (
                      <div className="flex flex-wrap gap-2">
                        {activePackages.map(pkg => (
                          <button
                            key={pkg.id}
                            type="button"
                            className="jap-chip"
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
                          className="flex-1 accent-[var(--jap-orange)]"
                          aria-label="Quantidade"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => sel.decrementQuantity(100)}
                            className="jap-btn jap-btn-sm jap-btn-outline !px-2 !py-1" aria-label="Diminuir quantidade">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-bold min-w-[4.5rem] text-center" style={{ color: 'var(--jap-ink)' }}>
                            {quantity.toLocaleString('pt-BR')}
                          </span>
                          <button type="button" onClick={() => sel.incrementQuantity(100)}
                            className="jap-btn jap-btn-sm jap-btn-outline !px-2 !py-1" aria-label="Aumentar quantidade">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <span className="text-sm font-bold block" style={{ color: 'var(--jap-ink)' }}>Total</span>
                        <span className="text-xs" style={{ color: 'var(--jap-muted)' }}>
                          {quantity.toLocaleString('pt-BR')} un.
                          {price.discountPercent > 0 && ` · -${price.discountPercent}%`}
                        </span>
                      </div>
                      <span className="text-xl font-bold" style={{ color: 'var(--jap-orange-ink)' }}>{money(price.finalPrice)}</span>
                    </div>
                  </div>

                  <button type="submit" className="jap-btn jap-btn-primary w-full">Avançar</button>
                </form>
              )}

              {checkout.step === 'account' && (
                <form onSubmit={checkout.submitAccount} className="space-y-4">
                  <p className="text-sm" style={{ color: 'var(--jap-body)' }}>
                    Crie uma senha para acompanhar seu pedido.
                  </p>
                  <Field label="Senha">
                    <input className="jap-input" type="password" value={fields.password}
                      onChange={e => checkout.setField('password', e.target.value)} />
                  </Field>
                  <Field label="Confirmar senha">
                    <input className="jap-input" type="password" value={fields.confirmPassword}
                      onChange={e => checkout.setField('confirmPassword', e.target.value)} />
                  </Field>
                  <button type="submit" className="jap-btn jap-btn-primary w-full">Criar conta e finalizar</button>
                </form>
              )}

              {checkout.step === 'login_prompt' && (
                <div className="space-y-4 text-center">
                  <p className="text-sm" style={{ color: 'var(--jap-body)' }}>
                    Já existe uma conta com esses dados. Entre para concluir o pedido.
                  </p>
                  <a href="/login" className="jap-btn jap-btn-primary w-full">Entrar</a>
                  <button onClick={() => checkout.setStep('info')} className="jap-btn jap-btn-sm jap-btn-outline w-full">Voltar</button>
                </div>
              )}

              {checkout.step === 'done' && checkout.order && (
                <OrderConfirmation order={checkout.order} onGoToOrders={() => { window.location.href = '/minha-conta'; }} onBuyMore={checkout.close} />
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
      <span className="text-xs uppercase tracking-wide font-bold block mb-1.5" style={{ color: 'var(--jap-muted)' }}>{label}</span>
      {children}
      {error && <span className="text-xs font-bold block mt-1" style={{ color: 'var(--jap-danger)' }}>{error}</span>}
    </label>
  );
}
