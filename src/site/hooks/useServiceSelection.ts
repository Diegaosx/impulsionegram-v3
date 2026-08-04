// What the client is buying: platform, engagement type, quantity or package —
// and what that costs.
//
// Headless, so a theme can render this as cards, a slider, a dropdown or
// anything else while the catalogue rules and the price stay identical.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SERVICES } from '../../data';
import { ServiceItem, ServicePackage, SocialPlatform } from '../../types';
import { PriceBreakdown, computePrice, sellablePackages } from '../pricing';

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
}

export function useServiceSelection({
  services, initialPlatform, initialType, restrictServiceId, initialPackageId
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
      setCustomInput(preferred.quantity.toString());
    } else {
      setSelectedPackageId('');
      const defaultQty = Math.max(activeService.minQuantity, Math.min(1000, activeService.maxQuantity));
      setQuantity(defaultQty);
      setCustomInput(defaultQty.toString());
    }
  }, [activeService, activePackages, initialPackageId]);

  const selectPackage = useCallback((pkg: Pick<ServicePackage, 'id' | 'quantity'>) => {
    setSelectedPackageId(pkg.id);
    setQuantity(pkg.quantity);
    setCustomInput(pkg.quantity.toString());
  }, []);

  const applyQuantity = useCallback((value: number) => {
    setQuantity(value);
    setCustomInput(value.toString());
  }, []);

  // Commit a free-typed quantity, clamped to what the service sells.
  const commitCustomInput = useCallback(() => {
    if (!activeService) return;
    let val = parseInt(customInput.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = activeService.minQuantity;
    applyQuantity(Math.max(activeService.minQuantity, Math.min(activeService.maxQuantity, val)));
  }, [activeService, customInput, applyQuantity]);

  const incrementQuantity = useCallback((amount: number) => {
    if (!activeService) return;
    applyQuantity(Math.min(activeService.maxQuantity, quantity + amount));
  }, [activeService, quantity, applyQuantity]);

  const decrementQuantity = useCallback((amount: number) => {
    if (!activeService) return;
    applyQuantity(Math.max(activeService.minQuantity, quantity - amount));
  }, [activeService, quantity, applyQuantity]);

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
    price
  };
}
