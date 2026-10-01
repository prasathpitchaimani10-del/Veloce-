import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, Package, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Header } from './components/Header.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderConfirmationModal } from './components/OrderConfirmationModal.tsx';
import { OrdersModal } from './components/OrdersModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { Product, Order } from './types/index.ts';
import { api } from './api/client.ts';

function StorefrontContent() {
  const { user } = useAuth();

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal / Drawer States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Load Products from backend
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        category: activeCategory,
        search: searchQuery,
        sort: sortBy,
      });
      if (res.success && res.data) {
        setProducts(res.data.products);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeCategory, sortBy]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectProductForReview = async (productId: string) => {
    const res = await api.getProductById(productId);
    if (res.success && res.data?.product) {
      setSelectedProduct(res.data.product);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans">
      {/* Top Bar Header */}
      <Header
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Banner Section */}
        <HeroBanner
          onExplore={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Catalog Section */}
        <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Controls Bar: Search, Category Segmented Buttons, Sorting */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-8 border-b border-neutral-200">
            {/* Category Segmented Control (Allowed as functional buttons) */}
            <div className="flex items-center gap-1 p-1 bg-neutral-200/70 rounded-xl overflow-x-auto">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'audio', label: 'Audio' },
                { id: 'hardware', label: 'Hardware' },
                { id: 'watches', label: 'Watches' },
                { id: 'accessories', label: 'Leather' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeCategory === tab.id
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-2 bg-white border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-xs text-neutral-400 hover:text-neutral-700"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs py-2 px-2.5 bg-white border border-neutral-300 rounded-xl font-medium text-neutral-800 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="newest">Featured & Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="pt-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse h-80"
                  >
                    <div className="aspect-4/3 bg-neutral-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-neutral-200 rounded w-3/4" />
                      <div className="h-3 bg-neutral-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 space-y-3 bg-white rounded-2xl border border-neutral-200">
                <Package className="w-12 h-12 text-neutral-300 mx-auto" />
                <h3 className="text-base font-semibold text-neutral-900">
                  No matching products found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Try adjusting your search criteria, clear keywords, or switch categories.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onSelect={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-lg font-display font-bold tracking-tight text-neutral-900 uppercase">
                VELOCE
              </span>
              <p className="text-xs text-neutral-500 mt-1 max-w-md">
                Full-stack storefront architecture with authoritative backend calculations,
                atomic inventory tracking, PCI-DSS tokenized payment flow, and verified reviews.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs font-medium text-neutral-600">
              <span>Complimentary Delivery &gt; $150</span>
              <span>·</span>
              <span>Encrypted Checkout</span>
              <span>·</span>
              <span>3-Year Studio Warranty</span>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-mono gap-2">
            <span>© 2026 Veloce Commerce. All rights reserved.</span>
            <span>REST API Core · Express & Vite Single-Port Host</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenAuth={() => setAuthOpen(true)}
        onProductUpdated={(updated) => {
          setSelectedProduct(updated);
          loadProducts();
        }}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onProceedToCheckout={() => {
          if (!user) {
            setAuthOpen(true);
          } else {
            setCheckoutOpen(true);
          }
        }}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={(order) => setConfirmedOrder(order)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewOrders={() => {
          setConfirmedOrder(null);
          setOrdersOpen(true);
        }}
      />

      <OrdersModal
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        onSelectProductForReview={handleSelectProductForReview}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />

      <AdminPortal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onProductChanged={loadProducts}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontContent />
      </CartProvider>
    </AuthProvider>
  );
}
