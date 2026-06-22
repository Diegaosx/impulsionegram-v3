import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Search, Sparkles, Settings, ChevronDown } from 'lucide-react';
import { SocialPlatform } from '../types';

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onSearch: (term: string) => void;
  onOpenAdmin?: () => void;
}

export default function Header({ onNavigate, cartCount, onOpenCart, onSearch, onOpenAdmin }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainMenuItems = [
    { label: 'Início', id: 'inicio' },
    { label: 'Serviços', id: 'servicos' },
    { label: 'Calculadora', id: 'calculadora' },
    { label: 'Planos', id: 'planos' },
  ];

  const dropdownMenuItems = [
    { label: 'Como Funciona', id: 'como-funciona' },
    { label: 'Depoimentos', id: 'depoimentos' },
    { label: 'FAQ', id: 'faq' },
    { label: 'Contato', id: 'contato' },
  ];

  const menuItems = [...mainMenuItems, ...dropdownMenuItems];

  const handleMenuClick = (id: string) => {
    setIsOpen(false);
    onNavigate(id);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm);
      onNavigate('servicos');
    }
  };

  return (
    <header className={`fixed top-12 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white/80 backdrop-blur-sm py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <button 
              onClick={() => handleMenuClick('inicio')}
              className="flex items-center gap-2 font-display text-2xl font-black tracking-tight cursor-pointer"
              id="header-logo-btn"
            >
              <div className="relative flex items-center font-display text-2xl font-extrabold tracking-tight">
                <span className="text-primary mr-0.5">Impulsione</span>
                <span className="text-slate-900 font-light">Gram</span>
                <span className="absolute -top-1 -right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1 xl:space-x-2 items-center">
            {mainMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="text-slate-600 hover:text-primary hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                id={`nav-${item.id}`}
              >
                {item.label}
              </button>
            ))}

            {/* Dropdown 'MAIS' */}
            <div 
              className="relative py-2"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1 text-slate-600 hover:text-primary hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer"
                id="nav-dropdown-trigger"
              >
                <span>MAIS</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {dropdownMenuItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        handleMenuClick(subItem.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left text-slate-600 hover:text-primary hover:bg-slate-50 px-4 py-2 text-sm font-semibold transition-colors cursor-pointer block"
                      id={`nav-sub-${subItem.id}`}
                    >
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Search Toggle */}
            <div className="relative">
              {showSearch ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Buscar serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary w-44 transition-all"
                    id="search-input-desktop"
                  />
                  <button 
                    type="submit"
                    className="bg-primary hover:bg-purple-700 text-white rounded-r-lg p-2 transition-colors cursor-pointer"
                    id="search-submit-btn"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowSearch(false)}
                    className="text-slate-400 hover:text-slate-600 ml-1 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="Buscar Serviços"
                  id="search-toggle-btn"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Instant Calc Trigger (cart-like) */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-600 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Ver Calculadora"
              id="active-cart-btn"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Toggle Panel (Desktop) */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 text-slate-700 hover:text-primary hover:bg-slate-50 text-xs font-bold px-3 py-2.5 rounded-lg border border-slate-100 transition-all cursor-pointer"
                title="Painel de Produtos e Vendas"
                id="header-admin-btn"
              >
                <Settings className="h-4 w-4 text-primary animate-spin-slow" />
                <span>Painel</span>
              </button>
            )}

            {/* Action CTAs */}
            <button
              onClick={() => handleMenuClick('calculadora')}
              className="flex items-center gap-1.5 bg-primary hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg border border-primary/10 tracking-tight cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
              id="cta-buy-header-btn"
            >
              <Sparkles className="h-4 w-4 text-accent animate-spin" />
              Comprar Agora
            </button>
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex items-center lg:hidden gap-2">
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-600 rounded-lg"
              id="mobile-cart-btn"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-primary rounded-lg cursor-pointer"
              id="mobile-hamburger-btn"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 shadow-xl py-4 px-4 space-y-3 animate-fade-in">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="flex">
            <input
              type="text"
              placeholder="Encontre seguidores, likes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-slate-200 bg-slate-50 w-full text-sm rounded-l-lg py-2 px-3 focus:outline-none"
              id="search-input-mobile"
            />
            <button 
              type="submit" 
              className="bg-primary hover:bg-purple-700 text-white px-4 rounded-r-lg"
              id="search-btn-mobile"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Menu Items */}
          <div className="flex flex-col gap-1 py-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="text-left font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 py-3 px-3 rounded-lg text-sm transition-colors cursor-pointer"
                id={`mobile-nav-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
            {onOpenAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdmin();
                }}
                className="w-full text-center py-2.5 text-xs font-bold text-primary hover:bg-slate-50 border border-primary/20 rounded-lg flex items-center justify-center gap-1.5"
                id="mobile-admin-btn"
              >
                <Settings className="h-4 w-4 animate-spin-slow" />
                Painel
              </button>
            )}
            <button
              onClick={() => handleMenuClick('faq')}
              className="w-full text-center py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
              id="mobile-login-btn"
            >
              Como Funciona & Garantia
            </button>
            <button
              onClick={() => handleMenuClick('calculadora')}
              className="w-full text-center py-3 text-sm font-semibold bg-primary hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              id="mobile-cta-btn"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              Impulsionar Meu Perfil
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
