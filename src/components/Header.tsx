import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, Shield, Menu, X, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCart,
  onOpenAuth,
  onOpenOrders,
  onOpenAdmin,
  activeCategory,
  onSelectCategory,
}) => {
  const { user, logout, quickLogin } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectCategory('all')}
              className="text-xl font-display font-extrabold tracking-tight text-neutral-900 uppercase hover:opacity-80 transition-opacity"
            >
              VELOCE
            </button>
            <span className="hidden sm:inline-block text-xs font-mono text-neutral-400">
              EST. 2026
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <button
              onClick={() => onSelectCategory('all')}
              className={`transition-colors hover:text-neutral-900 ${
                activeCategory === 'all' ? 'text-neutral-900 font-semibold' : ''
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => onSelectCategory('audio')}
              className={`transition-colors hover:text-neutral-900 ${
                activeCategory === 'audio' ? 'text-neutral-900 font-semibold' : ''
              }`}
            >
              Audio
            </button>
            <button
              onClick={() => onSelectCategory('hardware')}
              className={`transition-colors hover:text-neutral-900 ${
                activeCategory === 'hardware' ? 'text-neutral-900 font-semibold' : ''
              }`}
            >
              Hardware
            </button>
            <button
              onClick={() => onSelectCategory('watches')}
              className={`transition-colors hover:text-neutral-900 ${
                activeCategory === 'watches' ? 'text-neutral-900 font-semibold' : ''
              }`}
            >
              Watches
            </button>
            <button
              onClick={() => onSelectCategory('accessories')}
              className={`transition-colors hover:text-neutral-900 ${
                activeCategory === 'accessories' ? 'text-neutral-900 font-semibold' : ''
              }`}
            >
              Leather
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Selector for Evaluators */}
            {!user && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-100 p-1 rounded-lg">
                <span className="px-2 font-mono">Demo:</span>
                <button
                  onClick={() => quickLogin('customer')}
                  className="px-2 py-1 bg-white rounded shadow-xs font-medium text-neutral-800 hover:bg-neutral-50"
                  title="Login as Alex (Customer)"
                >
                  Customer
                </button>
                <button
                  onClick={() => quickLogin('admin')}
                  className="px-2 py-1 bg-neutral-900 text-white rounded shadow-xs font-medium hover:bg-neutral-800"
                  title="Login as Elena (Admin)"
                >
                  Admin
                </button>
              </div>
            )}

            {/* Admin Badge/Action */}
            {user?.role === 'admin' && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Portal</span>
              </button>
            )}

            {/* Orders Shortcut */}
            {user && (
              <button
                onClick={onOpenOrders}
                className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="My Orders"
              >
                <Package className="w-5 h-5" />
              </button>
            )}

            {/* User Account / Profile */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-500" />
                    <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-mono px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600">
                          Role: {user.role}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                      >
                        <Package className="w-3.5 h-3.5" />
                        My Orders
                      </button>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 font-medium"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Admin Console
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Shopping Bag Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-900 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-100 text-xs">
            <button
              onClick={() => {
                onSelectCategory('all');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left rounded-md bg-neutral-50 hover:bg-neutral-100 font-medium"
            >
              Catalog (All)
            </button>
            <button
              onClick={() => {
                onSelectCategory('audio');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left rounded-md bg-neutral-50 hover:bg-neutral-100 font-medium"
            >
              Audio
            </button>
            <button
              onClick={() => {
                onSelectCategory('hardware');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left rounded-md bg-neutral-50 hover:bg-neutral-100 font-medium"
            >
              Hardware
            </button>
            <button
              onClick={() => {
                onSelectCategory('watches');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-left rounded-md bg-neutral-50 hover:bg-neutral-100 font-medium"
            >
              Watches
            </button>
          </div>

          {!user && (
            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs text-neutral-500">Quick Test:</span>
              <button
                onClick={() => {
                  quickLogin('customer');
                  setMobileMenuOpen(false);
                }}
                className="text-xs px-2.5 py-1 bg-neutral-100 rounded font-medium"
              >
                Alex (Customer)
              </button>
              <button
                onClick={() => {
                  quickLogin('admin');
                  setMobileMenuOpen(false);
                }}
                className="text-xs px-2.5 py-1 bg-neutral-900 text-white rounded font-medium"
              >
                Elena (Admin)
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
