// Calculadora + checkout do tema "Turbo".
//
// Preço, faixas de desconto, validação, conta-na-hora e criação do pedido vêm
// inteiros dos hooks compartilhados — aqui só existe marcação. É o que garante
// que trocar de tema não muda um centavo do que o cliente paga.
//
// A referência não expõe calculadora nenhuma; o que ela define e que serve de
// base aqui é o cartão branco de raio 30 com linhas de 56px, os chips-pílula e
// o par de estados #E1D9F5 / roxo para "selecionado".

import { ReactNode, useEffect, useRef } from 'react';
import { AuthUser } from '../../../utils/storage';
import { ServiceItem, SocialPlatform } from '../../../types';
import { platformsWithServices, useCatalog } from '../../../utils/catalog';
import { useServiceSelection } from '../../../site/hooks/useServiceSelection';
import { useCheckout } from '../../../site/hooks/useCheckout';
import { useProfilePreview } from '../../../site/hooks/useProfilePreview';
import OrderConfirmation from '../../../components/OrderConfirmation';
import TargetHint from '../../../components/TargetHint';
import { AlertCircle, Loader2, Minus, Plus, X } from 'lucide-react';

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

export default function TurboCalculator({
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

  const stepLabel = (n: number) => (restrictServiceId ? `${n - 2}` : `${n}`);

  const panel = (
    <div className="tb-card p-6 md:p-7">
      {!restrictServiceId && availablePlatforms.length > 0 && (
        <>
          <span className="tb-kicker">1 · Rede social</span>
          <div className="flex flex-wrap gap-2 mt-3 mb-6">
            {availablePlatforms.map(p => (
              <button key={p.id} className="tb-chip" aria-pressed={platform === p.id} onClick={() => sel.setPlatform(p.id)}>
                {p.name.split('/')[0]}
              </button>
            ))}
          </div>

          <span className="tb-kicker">2 · Serviço</span>
          <div className="flex flex-wrap gap-2 mt-3 mb-6">
            {sel.categoriesList.map(c => (
              <button key={c.type} className="tb-chip" aria-pressed={serviceType === c.type} onClick={() => sel.setServiceType(c.type)}>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      {hasPackages ? (
        <>
          <span className="tb-kicker">{stepLabel(3)} · Escolha o pacote</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 mb-6">
            {activePackages.map(pkg => {
              const on = pkg.id === selectedPackageId;
              return (
                <button
                  key={pkg.id}
                  onClick={() => sel.selectPackage(pkg)}
                  aria-pressed={on}
                  className="text-left p-4 cursor-pointer transition-transform hover:-translate-y-0.5"
                  style={{
                    background: on ? 'var(--tb-active)' : '#fff',
                    boxShadow: on ? 'inset 0 0 0 2px var(--tb-brand)' : 'inset 0 0 0 1px var(--tb-line)',
                    borderRadius: 'var(--tb-r-sm)'
                  }}
                >
                  <span className="block text-sm font-bold" style={{ color: 'var(--tb-body)' }}>
                    {pkg.label || `${pkg.quantity.toLocaleString('pt-BR')} un.`}
                  </span>
                  <span className="block text-xl font-black mt-1" style={{ color: 'var(--tb-ink)' }}>{money(pkg.price)}</span>
                  {pkg.isPopular && (
                    <span
                      className="inline-block mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--tb-grad-amber)', color: 'var(--tb-ink)' }}
                    >
                      Popular
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : activeService ? (
        <>
          <span className="tb-kicker">{stepLabel(3)} · Quantidade</span>

          {sel.presets.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3 mb-3">
              {sel.presets.map(q => (
                <button key={q} className="tb-chip" aria-pressed={quantity === q} onClick={() => sel.applyQuantity(q)}>
                  {q.toLocaleString('pt-BR')}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 mb-3">
            <button onClick={() => sel.decrementQuantity(100)} className="tb-btn tb-btn-ghost !min-h-[48px] !px-3.5" aria-label="Diminuir quantidade">
              <Minus className="h-4 w-4" />
            </button>
            <input
              className="tb-field text-center font-black"
              value={sel.customInput}
              onChange={e => sel.setCustomInput(e.target.value)}
              onBlur={sel.commitCustomInput}
              inputMode="numeric"
              aria-label="Quantidade"
            />
            <button onClick={() => sel.incrementQuantity(100)} className="tb-btn tb-btn-ghost !min-h-[48px] !px-3.5" aria-label="Aumentar quantidade">
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
            className="w-full mb-6 accent-[var(--tb-brand)]"
            aria-label="Selecionar quantidade"
          />
        </>
      ) : null}

      <div
        className="p-5 flex flex-wrap items-end justify-between gap-4"
        style={{ background: 'var(--tb-bg)', borderRadius: 'var(--tb-r-sm)' }}
      >
        <div>
          <span className="tb-kicker">Total</span>
          <p className="text-[32px] font-black" style={{ color: 'var(--tb-ink)' }}>{money(price.finalPrice)}</p>
          {price.discountPercent > 0 && (
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--tb-success)' }}>
              {price.discountPercent}% de desconto por volume
            </p>
          )}
        </div>
        <button onClick={checkout.open} disabled={!activeService || price.finalPrice <= 0} className="tb-btn">
          Comprar agora
        </button>
      </div>
    </div>
  );

  return (
    <>
      {modalOnly ? null : embedded ? panel : (
        <section id="calculadora" className="tb-wrap py-12 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-9">
            <span className="tb-kicker">Simulador</span>
            <h2 className="tb-title mt-2.5">Monte seu pedido</h2>
            <p className="tb-lead mt-3.5">Escolha a rede, o serviço e a quantidade. O valor aparece na hora.</p>
          </div>
          <div className="max-w-3xl mx-auto">{panel}</div>
        </section>
      )}

      {checkout.isOpen && (
        <div
          className="fixed inset-0 z-[20] flex items-start justify-center p-5 overflow-y-auto"
          style={{ background: 'rgba(51,1,119,.45)' }}
        >
          <div
            className="relative w-full mt-6 mb-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
            style={{ maxWidth: 520, background: '#fff', borderRadius: 'var(--tb-r-card)', boxShadow: '0 24px 70px rgba(51,1,119,.3)' }}
          >
            <button
              onClick={checkout.close}
              aria-label="Fechar"
              className="absolute right-5 top-4 cursor-pointer"
              style={{ color: 'var(--tb-muted)' }}
            >
              <X className="h-6 w-6" />
            </button>

            <div className="p-6 md:p-7">
              <h2 className="text-[28px] font-black" style={{ color: 'var(--tb-ink)', lineHeight: 1.15 }}>
                {checkout.step === 'done' ? 'Pedido criado' : 'Finalizar pedido'}
              </h2>
              {activeService && checkout.step !== 'done' && (
                <p className="mt-1 text-sm font-bold" style={{ color: 'var(--tb-muted)' }}>
                  {activeService.label} · {quantity.toLocaleString('pt-BR')} un. · {money(price.finalPrice)}
                </p>
              )}

              {checkout.error && (
                <div
                  className="flex items-start gap-2 text-sm p-3 mt-4"
                  style={{ background: 'rgba(214,31,91,.08)', color: 'var(--tb-danger)', borderRadius: 'var(--tb-r-field)' }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {checkout.error}
                </div>
              )}

              {checkout.step === 'processing' && (
                <div className="py-10 flex flex-col items-center gap-3" style={{ color: 'var(--tb-body)' }}>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="font-black">Processando…</p>
                </div>
              )}

              {checkout.step === 'info' && (
                <form onSubmit={checkout.submitInfo} className="space-y-4 mt-5">
                  <Field label="Perfil de destino" error={fieldErrors.username}>
                    <input className="tb-field" value={fields.username} placeholder="seuperfil"
                      onChange={e => checkout.setField('username', e.target.value)} />
                    <TargetHint result={checkout.normalizedProfile} raw={fields.username} />
                  </Field>

                  {preview.status === 'found' && preview.profile && (
                    <div className="flex items-center gap-3 p-3" style={{ background: 'var(--tb-active)', borderRadius: 'var(--tb-r-field)' }}>
                      {preview.profile.profilePicUrl && (
                        <img src={preview.profile.profilePicUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div className="text-sm" style={{ color: 'var(--tb-body)' }}>
                        <p className="font-black" style={{ color: 'var(--tb-ink)' }}>{preview.profile.fullName || preview.profile.username}</p>
                        <p>{preview.profile.followers?.toLocaleString('pt-BR')} seguidores</p>
                      </div>
                    </div>
                  )}

                  {!currentUser && (
                    <Field label="Seu nome" error={fieldErrors.fullName}>
                      <input className="tb-field" value={fields.fullName} onChange={e => checkout.setField('fullName', e.target.value)} />
                    </Field>
                  )}
                  <Field label="E-mail" error={fieldErrors.email}>
                    <input className="tb-field" type="email" value={fields.email} onChange={e => checkout.setField('email', e.target.value)} />
                  </Field>
                  <Field label="Telefone com DDD" error={fieldErrors.phone}>
                    <input className="tb-field" type="tel" value={fields.phone} onChange={e => checkout.setField('phone', e.target.value)} />
                  </Field>
                  {needsPostUrl && (
                    <Field label="Link da publicação" error={fieldErrors.postUrl}>
                      <input className="tb-field" value={fields.postUrl} onChange={e => checkout.setField('postUrl', e.target.value)} />
                      <TargetHint result={checkout.normalizedPost} raw={fields.postUrl} />
                    </Field>
                  )}
                  <Field label="Cupom (opcional)">
                    <input className="tb-field" value={fields.coupon} onChange={e => checkout.setField('coupon', e.target.value)} />
                  </Field>

                  {/* Mini calculadora: ajusta o pedido sem fechar o checkout.
                      Usa a mesma seleção do painel, então o total acompanha. */}
                  <div className="p-4 space-y-3" style={{ background: 'var(--tb-bg)', borderRadius: 'var(--tb-r-sm)' }}>
                    <span className="tb-kicker">Personalizar pedido</span>

                    {hasPackages ? (
                      <div className="flex flex-wrap gap-2">
                        {activePackages.map(pkg => (
                          <button
                            key={pkg.id}
                            type="button"
                            className="tb-chip"
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
                          className="flex-1 accent-[var(--tb-brand)]"
                          aria-label="Quantidade"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => sel.decrementQuantity(100)}
                            className="tb-btn tb-btn-ghost !min-h-[34px] !px-2" aria-label="Diminuir quantidade">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-black min-w-[4.5rem] text-center" style={{ color: 'var(--tb-ink)' }}>
                            {quantity.toLocaleString('pt-BR')}
                          </span>
                          <button type="button" onClick={() => sel.incrementQuantity(100)}
                            className="tb-btn tb-btn-ghost !min-h-[34px] !px-2" aria-label="Aumentar quantidade">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-end justify-between pt-1">
                      <div>
                        <span className="font-black block" style={{ color: 'var(--tb-ink)' }}>Total</span>
                        <span className="text-sm" style={{ color: 'var(--tb-muted)' }}>
                          {quantity.toLocaleString('pt-BR')} un.
                          {price.discountPercent > 0 && ` · -${price.discountPercent}%`}
                        </span>
                      </div>
                      <span className="text-2xl font-black" style={{ color: 'var(--tb-brand)' }}>{money(price.finalPrice)}</span>
                    </div>
                  </div>

                  <button type="submit" className="tb-btn w-full">Avançar</button>
                </form>
              )}

              {checkout.step === 'account' && (
                <form onSubmit={checkout.submitAccount} className="space-y-4 mt-5">
                  <p style={{ color: 'var(--tb-body)' }}>Crie uma senha para acompanhar seu pedido.</p>
                  <Field label="Senha">
                    <input className="tb-field" type="password" value={fields.password}
                      onChange={e => checkout.setField('password', e.target.value)} />
                  </Field>
                  <Field label="Confirmar senha">
                    <input className="tb-field" type="password" value={fields.confirmPassword}
                      onChange={e => checkout.setField('confirmPassword', e.target.value)} />
                  </Field>
                  <button type="submit" className="tb-btn w-full">Criar conta e finalizar</button>
                </form>
              )}

              {checkout.step === 'login_prompt' && (
                <div className="space-y-3 mt-5 text-center">
                  <p style={{ color: 'var(--tb-body)' }}>Já existe uma conta com esses dados. Entre para concluir o pedido.</p>
                  <a href="/login" className="tb-btn w-full">Entrar</a>
                  <button onClick={() => checkout.setStep('info')} className="tb-btn tb-btn-ghost w-full">Voltar</button>
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
      <span className="tb-kicker mb-1.5">{label}</span>
      {children}
      {error && <span className="text-sm font-bold block mt-1" style={{ color: 'var(--tb-danger)' }}>{error}</span>}
    </label>
  );
}
