// Checkout state machine for engagement orders.
//
// Owns every rule of the money path: field validation, the guest-vs-logged-in
// branch, account creation during checkout, coupon validation against the live
// flash offer, and order creation. A theme supplies the markup and calls these
// handlers; it never decides what is valid or what an order costs.
//
// Steps:
//   info         → profile + contact form
//   login_prompt → an account already exists for this e-mail/phone
//   account      → guest picks a password, account is created, then the order
//   processing   → a request is in flight
//   done         → order created; `order` carries the PIX payload when enabled

import { useCallback, useEffect, useState } from 'react';
import { SocialPlatform, ServiceItem } from '../../types';
import {
  AdminOrder, AuthUser,
  checkAccountExists, createMyOrder, registerAccount
} from '../../utils/storage';
import { useOffer } from '../../utils/useOffer';
import { normalizeProfile, normalizePostUrl, targetKindFor } from '../../utils/socialTarget';

export type CheckoutStep = 'info' | 'account' | 'login_prompt' | 'processing' | 'done';

export interface CheckoutFields {
  fullName: string;
  username: string; // target profile (@handle)
  email: string;
  phone: string;
  postUrl: string;
  password: string;
  confirmPassword: string;
  coupon: string;
}

const EMPTY_FIELDS: CheckoutFields = {
  fullName: '', username: '', email: '', phone: '',
  postUrl: '', password: '', confirmPassword: '', coupon: ''
};

export interface UseCheckoutInput {
  platform: SocialPlatform;
  serviceType: string;
  service?: ServiceItem;
  quantity: number;
  price: number;
  currentUser?: AuthUser | null;
  onAuthSuccess?: (user: AuthUser) => void;
  onOrderCreated?: () => void;
  // Blocks submission while the typed profile is known to be private, since the
  // delivery would silently fail. It is a getter rather than a value because the
  // profile preview is driven by the username this hook owns — reading it at
  // submit time breaks the cycle and can never see a stale result.
  isTargetProfilePrivate?: () => boolean;
}

export function useCheckout({
  platform, serviceType, service, quantity, price,
  currentUser, onAuthSuccess, onOrderCreated, isTargetProfilePrivate
}: UseCheckoutInput) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('info');
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [fields, setFields] = useState<CheckoutFields>(EMPTY_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const paymentMethod: 'PIX' | 'Card' = 'PIX'; // PIX only for now

  const setField = useCallback(<K extends keyof CheckoutFields>(key: K, value: CheckoutFields[K]) => {
    setFields(prev => ({ ...prev, [key]: value }));
  }, []);

  // Flash offer + coupon. The coupon auto-fills while an offer is running, but
  // the client can clear it, so validity is always re-derived from the input.
  const { offer, active: offerActive, remaining: offerRemaining } = useOffer();
  useEffect(() => {
    if (offerActive && offer?.couponCode) {
      setFields(prev => (prev.coupon ? prev : { ...prev, coupon: offer.couponCode }));
    }
  }, [offerActive, offer?.couponCode]);

  const couponValid = !!(
    offerActive && offer && fields.coupon.trim() &&
    fields.coupon.trim().toLowerCase() === offer.couponCode.toLowerCase()
  );
  const couponPercent = couponValid ? (offer?.discountPercent || 0) : 0;

  const open = useCallback(() => {
    setFieldErrors({});
    setError('');
    setOrder(null);
    setFields(prev => ({
      ...prev,
      // Prefill from the logged-in user when available.
      fullName: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      username: '',
      postUrl: '',
      password: '',
      confirmPassword: ''
    }));
    setStep('info');
    setIsOpen(true);
  }, [currentUser]);

  const close = useCallback(() => setIsOpen(false), []);

  // Close on ESC and lock the page scroll while the checkout is open.
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKeyDown, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // O alvo é normalizado aqui, não montado com um "@" na frente. O cliente cola
  // o que o botão "compartilhar" do aplicativo gera, e é isto que transforma
  // isso no nome de usuário puro que o painel SMM consegue usar.
  const normalizedProfile = normalizeProfile(platform, fields.username);
  const needsPost = targetKindFor(serviceType) === 'post';
  const normalizedPost = needsPost ? normalizePostUrl(platform, fields.postUrl) : null;

  const targetProfile = useCallback(
    () => normalizeProfile(platform, fields.username).value || fields.username.trim(),
    [platform, fields.username]
  );

  const createOrder = useCallback(async () => {
    setStep('processing');
    setError('');
    const res = await createMyOrder({
      platform,
      serviceType,
      serviceLabel: service ? service.label : 'Serviço Personalizado',
      quantity,
      price,
      paymentMethod,
      targetProfile: targetProfile(),
      postUrl: normalizedPost?.ok ? normalizedPost.value : fields.postUrl.trim(),
      couponCode: couponValid ? fields.coupon.trim() : ''
    });
    if (res.ok && res.order) {
      onOrderCreated?.();
      setOrder(res.order);
      setStep('done');
    } else {
      setError(res.error || 'Falha ao criar o pedido.');
      setStep(currentUser ? 'info' : 'account');
    }
  }, [platform, serviceType, service, quantity, price, targetProfile,
      fields.postUrl, fields.coupon, couponValid, currentUser, onOrderCreated,
      normalizedPost?.ok, normalizedPost?.value]);

  // Step 1 → validate profile/contact, then branch on account existence.
  const submitInfo = useCallback(async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const errors: Record<string, string> = {};

    // O perfil precisa ser reconhecível ANTES de virar pedido: um link colado
    // do "compartilhar" que passasse daqui quebraria a entrega automática lá na
    // frente, quando já não há mais o cliente para corrigir.
    if (!normalizedProfile.ok) {
      errors.username = normalizedProfile.error || 'Informe o perfil de destino';
    } else if (isTargetProfilePrivate?.()) {
      errors.username = 'O perfil informado está privado. Deixe-o público para receber a entrega.';
    }
    if (!currentUser && !fields.fullName.trim()) {
      errors.fullName = 'Informe seu nome';
    }
    if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errors.email = 'Insira um e-mail válido';
    }
    if (!fields.phone.replace(/\D/g, '').trim() || fields.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Insira um telefone com DDD';
    }
    if (needsPost && normalizedPost && !normalizedPost.ok) {
      errors.postUrl = normalizedPost.error || 'Informe o link da publicação';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    // Already logged in → create the order directly.
    if (currentUser) {
      await createOrder();
      return;
    }

    // Guest → does an account already exist for this e-mail/phone?
    setStep('processing');
    const check = await checkAccountExists(fields.email.trim(), fields.phone.trim());
    setStep(check.exists ? 'login_prompt' : 'account');
  }, [fields, service, currentUser, isTargetProfilePrivate, createOrder,
      needsPost, normalizedProfile.ok, normalizedProfile.error,
      normalizedPost?.ok, normalizedPost?.error]);

  // Guest creates the account (password) then the order.
  const submitAccount = useCallback(async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    setError('');
    if (fields.password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); return; }
    if (fields.password !== fields.confirmPassword) { setError('As senhas não coincidem.'); return; }
    setStep('processing');
    const reg = await registerAccount({
      name: fields.fullName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      password: fields.password
    });
    if (!reg.ok || !reg.user) {
      setError(reg.error || 'Não foi possível criar a conta.');
      setStep('account');
      return;
    }
    onAuthSuccess?.(reg.user);
    await createOrder();
  }, [fields, onAuthSuccess, createOrder]);

  return {
    // modal
    isOpen, open, close,
    // machine
    step, setStep, order,
    // form
    fields, setField, fieldErrors, error, setError,
    // offer / coupon
    offer, offerActive, offerRemaining, couponValid, couponPercent,
    // actions
    submitInfo, submitAccount,
    targetProfile,
    // Alvo normalizado, para o tema mostrar ao cliente o que será usado de fato.
    normalizedProfile, normalizedPost, needsPost
  };
}
