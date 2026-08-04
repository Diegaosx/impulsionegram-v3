// What the client is buying: platform, engagement type, quantity or package —
// and what that costs.
//
// Headless, so a theme can render this as cards, a slider, a dropdown or
// anything else while the catalogue rules and the price stay identical.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SERVICES } from '../../data';
import { ServiceItem, ServicePackage, SocialPlatform } from '../../types';
import { PriceBreakdown, computePrice, quantityPresets, sellablePackages } from '../pricing';

export interface UseServiceSelectionInput {
  services?: ServiceItem[];
  initialPlatform?: SocialPlatform;
  initialType?: string;
  // Locks the selection to a single service (used by the service page, where
  // the platform/type pickers are hidden).
  restrictServiceId?: string;
  // Pré-seleciona um pacote específico, para o cliente cair já no pacote que
  // ele clicou (ex.: vindo de um card do grid de serviços).
  initialPackageId?: string;
  // Abre na quantidade mínima do serviço em vez do padrão de 1.000. É o que
  // deixa a calculadora bater com o "a partir de" anunciado nos cards.
  preferMinimumQuantity?: boolean;
}

export function useServiceSelection({
  services, initialPlatform, initialType, restrictServiceId, initialPackageId, preferMinimumQuantity
}: UseServiceSelectionInput) {
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [serviceType, setServiceType] = useState<string>('followers');
  const [quantity, setQuantity] = useState<number>(1000);
  const [customInput, setCustomInput] = useState<string>('1000');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  const catalogue = services || SERVICES;

  // Outside triggers (e.g. a service card on the home page).
  useEffect(() => {
    if (initialPlatform) setPlatform(initialPlatform);
    if (initialType) setServiceType(initialType);
  }, [initialPlatform, initialType]);

  // When locked to a single service, force its platform + type.
  const restrictedService = useMemo(
    () => (restrictServiceId ? catalogue.find(s => s.id === restrictServiceId) : undefined),
    [restrictServiceId, catalogue]
  );
  useEffect(() => {
    if (restrictedService) {
      setPlatform(restrictedService.platform);
      setServiceType(restrictedService.type);
    }
  }, [restrictedService]);

  // Engagement types available for the current platform.
  const categoriesList = useMemo(
    () => catalogue.filter(s => s.platform === platform).map(m => ({ type: m.type, label: m.label })),
    [platform, catalogue]
  );

  // Keep the type valid when the platform changes.
  useEffect(() => {
    const isAvailable = categoriesList.some(c => c.type === serviceType);
    if (!isAvailable && categoriesList.length > 0) setServiceType(categoriesList[0].type);
  }, [platform, categoriesList, serviceType]);

  const activeService = useMemo<ServiceItem | undefined>(
    () => catalogue.find(s => s.platform === platform && s.type === serviceType),
    [platform, serviceType, catalogue]
  );

  const activePackages = useMemo(() => sellablePackages(activeService), [activeService]);
  const hasPackages = activePackages.length > 0;
  const selectedPackage = useMemo(
    () => activePackages.find(p => p.id === selectedPackageId),
    [activePackages, selectedPackageId]
  );

  // On service change: default-select a package or reset the slider quantity
  // for the legacy pricing mode. Um pacote pedido explicitamente vence o
  // "popular", para o cliente cair no pacote que ele clicou.
  useEffect(() => {
    if (!activeService) return;
    if (activePackages.length > 0) {
      const requested = initialPackageId ? activePackages.find(p => p.id === initialPackageId) : undefined;
      const preferred = requested || activePackages.find(p => p.isPopular) || activePackages[0];
      setSelectedPackageId(preferred.id);
      setQuantity(preferred.quantity);
    } else {
      setSelectedPackageId('');
      setQuantity(preferMinimumQuantity
        ? activeService.minQuantity
        : Math.max(activeService.minQuantity, Math.min(1000, activeService.maxQuantity)));
    }
  }, [activeService, activePackages, initialPackageId, preferMinimumQuantity]);

  const selectPackage = useCallback((pkg: Pick<ServicePackage, 'id' | 'quantity'>) => {
    setSelectedPackageId(pkg.id);
    setQuantity(pkg.quantity);
  }, []);

  const applyQuantity = useCallback((value: number) => setQuantity(value), []);

  // O campo de texto acompanha a quantidade. Digitar livremente só mexe no
  // texto; é o commit que move a quantidade, e então o texto volta ao valor
  // já limitado ao que o serviço vende.
  useEffect(() => {
    setCustomInput(String(quantity));
  }, [quantity]);

  // Commit a free-typed quantity, clamped to what the service sells.
  const commitCustomInput = useCallback(() => {
    if (!activeService) return;
    let val = parseInt(customInput.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = activeService.minQuantity;
    applyQuantity(Math.max(activeService.minQuantity, Math.min(activeService.maxQuantity, val)));
  }, [activeService, customInput, applyQuantity]);

  // Atualização funcional: cliques rápidos no +/- se acumulam em vez de
  // sobrescreverem uns aos outros lendo o mesmo valor antigo.
  const incrementQuantity = useCallback((amount: number) => {
    if (!activeService) return;
    setQuantity(prev => Math.min(activeService.maxQuantity, prev + amount));
  }, [activeService]);

  const decrementQuantity = useCallback((amount: number) => {
    if (!activeService) return;
    setQuantity(prev => Math.max(activeService.minQuantity, prev - amount));
  }, [activeService]);

  // Atalhos de quantidade (modo régua). Vazio quando o serviço vende pacotes.
  const presets = useMemo(
    () => (!activeService || activePackages.length > 0
      ? []
      : quantityPresets(activeService.minQuantity, activeService.maxQuantity)),
    [activeService, activePackages]
  );

  const price: PriceBreakdown = useMemo(
    () => computePrice({ service: activeService, quantity, packages: activePackages, selectedPackage }),
    [activeService, quantity, activePackages, selectedPackage]
  );

  return {
    platform, setPlatform,
    serviceType, setServiceType,
    quantity, applyQuantity,
    customInput, setCustomInput, commitCustomInput,
    incrementQuantity, decrementQuantity,
    categoriesList,
    activeService, restrictedService,
    activePackages, hasPackages, selectedPackage, selectedPackageId, selectPackage,
    presets,
    price
  };
}
