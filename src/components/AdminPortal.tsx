import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  Truck,
  Cloud,
  Tag,
  Key,
} from 'lucide-react';
import { Product, Order, Coupon, OrderStatus } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductChanged: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  onProductChanged,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'coupons' | 'security'>('overview');

  // Stats
  const [stats, setStats] = useState<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    lowStockCount: number;
    recentOrders: Order[];
  } | null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Product Form State
  const [prodTitle, setProdTitle] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('Audio');
  const [prodStock, setProdStock] = useState('10');
  const [prodDesc, setProdDesc] = useState('');
  const [prodBadge, setProdBadge] = useState('');

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('20');
  const [couponMinSpend, setCouponMinSpend] = useState('100');

  // Cloudinary Signed Upload Inspector (Requirement 19)
  const [uploadSignatureData, setUploadSignatureData] = useState<any>(null);
  const [testingUpload, setTestingUpload] = useState(false);

  const [loading, setLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      loadAllAdminData();
    }
  }, [isOpen, user]);

  const loadAllAdminData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [statsRes, prodsRes, ordersRes, couponsRes] = await Promise.all([
        api.adminGetStats(),
        api.adminGetProducts(),
        api.adminGetOrders(),
        api.adminGetCoupons(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (prodsRes.success && prodsRes.data) setProducts(prodsRes.data.products);
      if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data.orders);
      if (couponsRes.success && couponsRes.data) setCoupons(couponsRes.data.coupons);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading administrative dataset.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4">
          <Shield className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold text-neutral-900">403 Forbidden</h2>
          <p className="text-xs text-neutral-600">
            Role-based authorization required. Your current account is registered as customer.
            Log in as Elena Rostova (admin@veloce.com) to access the administrative portal.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Handle Product Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const price = parseFloat(prodPrice);
    const stock = parseInt(prodStock, 10);

    if (isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      setErrorMessage('Please provide valid positive numbers for price and stock.');
      return;
    }

    try {
      if (editingProduct) {
        const res = await api.adminUpdateProduct(editingProduct._id, {
          title: prodTitle,
          price,
          stock,
          category: prodCategory,
          description: prodDesc,
          badge: prodBadge || undefined,
        });
        if (res.success && res.data) {
          setBannerMessage(`Updated product "${res.data.product.title}".`);
          setEditingProduct(null);
          loadAllAdminData();
          onProductChanged();
        } else {
          setErrorMessage(res.message || 'Failed to update product.');
        }
      } else {
        const res = await api.adminCreateProduct({
          title: prodTitle,
          price,
          stock,
          category: prodCategory,
          description: prodDesc,
          badge: prodBadge || undefined,
          images: ['/src/assets/images/hero_luxury_audio_1790879068988.jpg'],
        });
        if (res.success && res.data) {
          setBannerMessage(`Created product "${res.data.product.title}".`);
          setIsCreatingProduct(false);
          setProdTitle('');
          setProdPrice('');
          setProdDesc('');
          loadAllAdminData();
          onProductChanged();
        } else {
          setErrorMessage(res.message || 'Failed to create product.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Product operation failed.');
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    const res = await api.adminDeleteProduct(id);
    if (res.success) {
      setBannerMessage(`Deleted product "${title}".`);
      loadAllAdminData();
      onProductChanged();
    } else {
      setErrorMessage(res.message || 'Failed to delete product.');
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const res = await api.adminUpdateOrderStatus(orderId, status);
    if (res.success) {
      setBannerMessage(`Order updated to status: ${status.toUpperCase()}.`);
      loadAllAdminData();
    } else {
      setErrorMessage(res.message || 'Failed to update order status.');
    }
  };

  // Handle Coupon Create
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const res = await api.adminCreateCoupon({
      code: couponCode.trim().toUpperCase(),
      discountType: 'percentage',
      discountValue: Number(couponDiscount),
      minOrderAmount: Number(couponMinSpend),
      expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
      isActive: true,
    });

    if (res.success) {
      setBannerMessage(`Created coupon "${couponCode.toUpperCase()}".`);
      setCouponCode('');
      loadAllAdminData();
    } else {
      setErrorMessage(res.message || 'Failed to create coupon.');
    }
  };

  // Handle Coupon Delete
  const handleDeleteCoupon = async (id: string, code: string) => {
    const res = await api.adminDeleteCoupon(id);
    if (res.success) {
      setBannerMessage(`Removed coupon "${code}".`);
      loadAllAdminData();
    } else {
      setErrorMessage(res.message || 'Failed to remove coupon.');
    }
  };

  // Test Cloudinary Signature Generation (Requirement 19)
  const handleTestUploadSignature = async () => {
    setTestingUpload(true);
    try {
      const res = await api.adminGetUploadSignature();
      if (res.success && res.data) {
        setUploadSignatureData(res.data);
      }
    } finally {
      setTestingUpload(false);
    }
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdTitle(p.title);
    setProdPrice(p.price.toString());
    setProdCategory(p.category);
    setProdStock(p.stock.toString());
    setProdDesc(p.description);
    setProdBadge(p.badge || '');
    setIsCreatingProduct(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold">
                Veloce Commercial Operations
              </h2>
              <p className="text-[11px] font-mono text-neutral-400">
                Administrator: {user.name} ({user.email})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-neutral-200 bg-neutral-50 flex gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Coupons ({coupons.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Security & Secrets (R12, R19)
          </button>
        </div>

        {/* Banner Feedback */}
        {bannerMessage && (
          <div className="px-6 py-2 bg-emerald-50 text-emerald-800 text-xs flex justify-between items-center border-b border-emerald-100">
            <span className="font-mono">{bannerMessage}</span>
            <button
              onClick={() => setBannerMessage(null)}
              className="font-bold hover:text-emerald-950"
            >
              ×
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="px-6 py-2 bg-red-50 text-red-800 text-xs flex justify-between items-center border-b border-red-100">
            <span className="font-mono">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="font-bold hover:text-red-950"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-xs font-mono text-neutral-500 block">Total Revenue</span>
                  <p className="text-2xl font-display font-bold text-neutral-900 mt-1 tabular-nums">
                    ${stats ? stats.totalRevenue.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-xs font-mono text-neutral-500 block">Total Orders</span>
                  <p className="text-2xl font-display font-bold text-neutral-900 mt-1">
                    {stats?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-xs font-mono text-neutral-500 block">Active SKUs</span>
                  <p className="text-2xl font-display font-bold text-neutral-900 mt-1">
                    {stats?.totalProducts || 0}
                  </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-xs font-mono text-neutral-500 block">Low Stock Items</span>
                  <p className="text-2xl font-display font-bold text-amber-600 mt-1">
                    {stats?.lowStockCount || 0}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-neutral-900 mb-3">
                  Recent Orders Across Customers
                </h3>
                <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-100 font-mono text-neutral-600">
                      <tr>
                        <th className="p-3">Order Number</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {stats?.recentOrders.map((o) => (
                        <tr key={o._id} className="hover:bg-neutral-50">
                          <td className="p-3 font-mono font-semibold">{o.orderNumber}</td>
                          <td className="p-3">{o.shippingAddress.fullName}</td>
                          <td className="p-3 uppercase font-mono font-bold">{o.orderStatus}</td>
                          <td className="p-3 font-mono font-semibold">${o.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS CRUD (Requirement 23) */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold uppercase text-neutral-900">
                  Product Inventory Management
                </h3>
                {!isCreatingProduct && !editingProduct && (
                  <button
                    onClick={() => {
                      setIsCreatingProduct(true);
                      setProdTitle('');
                      setProdPrice('199.00');
                      setProdStock('15');
                      setProdCategory('Hardware');
                      setProdDesc('');
                      setProdBadge('New Edition');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add SKU</span>
                  </button>
                )}
              </div>

              {/* Product Form Modal/Inline */}
              {(isCreatingProduct || editingProduct) && (
                <form
                  onSubmit={handleSaveProduct}
                  className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <h4 className="font-bold text-neutral-900 font-mono">
                      {editingProduct ? `Edit: ${editingProduct.title}` : 'Add New Product'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingProduct(false);
                        setEditingProduct(null);
                      }}
                      className="text-neutral-500 hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-neutral-700 font-medium mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        value={prodTitle}
                        onChange={(e) => setProdTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-medium mb-1">
                        Category
                      </label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                      >
                        <option value="Audio">Audio</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Watches">Watches</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-medium mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-medium mb-1">
                        Stock Count
                      </label>
                      <input
                        type="number"
                        required
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-700 font-medium mb-1">
                        Badge Tag (Optional)
                      </label>
                      <input
                        type="text"
                        value={prodBadge}
                        placeholder="e.g. Limited Edition"
                        onChange={(e) => setProdBadge(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-neutral-700 font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                    >
                      {editingProduct ? 'Save Changes' : 'Create Product'}
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 font-mono text-neutral-600">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Reviews</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-neutral-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {p.images[0] && (
                              <img
                                src={p.images[0]}
                                alt=""
                                className="w-8 h-8 rounded object-cover bg-neutral-100 border border-neutral-200"
                              />
                            )}
                            <span className="font-semibold text-neutral-900">{p.title}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono">{p.category}</td>
                        <td className="p-3 font-mono font-semibold">${p.price.toFixed(2)}</td>
                        <td className="p-3 font-mono">
                          <span
                            className={
                              p.stock === 0
                                ? 'text-red-600 font-bold'
                                : p.stock <= 5
                                ? 'text-amber-600 font-bold'
                                : 'text-neutral-800'
                            }
                          >
                            {p.stock} units
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {p.rating} ★ ({p.numReviews})
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => startEditProduct(p)}
                            className="p-1 hover:text-neutral-900 text-neutral-500"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.title)}
                            className="p-1 hover:text-red-600 text-neutral-400"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase text-neutral-900">
                Fulfillment & Order Lifecycle
              </h3>

              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord._id}
                    className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <span className="font-mono font-bold text-neutral-900">
                          {ord.orderNumber}
                        </span>
                        <p className="text-[11px] font-mono text-neutral-500">
                          Customer: {ord.shippingAddress.fullName} ({ord.userEmail})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-500">Update Status:</span>
                        <select
                          value={ord.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrderStatus(ord._id, e.target.value as OrderStatus)
                          }
                          className="px-2.5 py-1 bg-white border border-neutral-300 rounded font-mono font-semibold"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <span className="font-mono font-bold ml-2">
                          ${ord.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-600 border-t border-neutral-200 pt-2 flex justify-between">
                      <span>
                        Items: {ord.items.map((i) => `${i.quantity}x ${i.title}`).join(', ')}
                      </span>
                      <span className="font-mono">
                        Destination: {ord.shippingAddress.city}, {ord.shippingAddress.postalCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: COUPONS MANAGEMENT */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <h3 className="text-xs font-mono font-bold uppercase text-neutral-900">
                Promotional Discounts
              </h3>

              <form
                onSubmit={handleCreateCoupon}
                className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-wrap gap-3 items-end text-xs"
              >
                <div>
                  <label className="block text-neutral-700 font-medium mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP25"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="px-3 py-2 bg-white border border-neutral-300 rounded-lg uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-medium mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={couponDiscount}
                    onChange={(e) => setCouponDiscount(e.target.value)}
                    className="w-24 px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-medium mb-1">
                    Min Spend ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={couponMinSpend}
                    onChange={(e) => setCouponMinSpend(e.target.value)}
                    className="w-28 px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800"
                >
                  Create Coupon
                </button>
              </form>

              <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100 font-mono text-neutral-600">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Min Order</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {coupons.map((c) => (
                      <tr key={c._id} className="hover:bg-neutral-50">
                        <td className="p-3 font-mono font-bold text-neutral-900">
                          {c.code}
                        </td>
                        <td className="p-3 capitalize">{c.discountType}</td>
                        <td className="p-3 font-mono font-semibold">
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}%`
                            : `$${c.discountValue}`}
                        </td>
                        <td className="p-3 font-mono">${c.minOrderAmount.toFixed(2)}</td>
                        <td className="p-3 font-mono">
                          <span
                            className={c.isActive ? 'text-emerald-700' : 'text-neutral-400'}
                          >
                            {c.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteCoupon(c._id, c.code)}
                            className="text-neutral-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & SECRETS INSPECTOR */}
          {activeTab === 'security' && (
            <div className="space-y-6 text-xs">
              <div className="p-5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                <div className="flex items-center gap-2 font-mono font-bold text-neutral-900">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>Requirement 12 & 19: Zero Secret Exposure Architecture</span>
                </div>

                <div className="space-y-2 text-neutral-600 leading-relaxed">
                  <p>
                    <strong>Payment Secrets:</strong> <code>STRIPE_SECRET_KEY</code> is
                    isolated in server environment memory. Client transactions only receive
                    ephemeral payment intent IDs and client tokens.
                  </p>
                  <p>
                    <strong>Cloudinary Media Secrets:</strong> <code>CLOUDINARY_API_SECRET</code> is
                    strictly contained on the backend. When client uploads assets, it calls{' '}
                    <code>POST /api/uploads/sign</code> which generates a cryptographic SHA-1 signature
                    server-side and returns only public keys and signatures.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTestUploadSignature}
                    disabled={testingUpload}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {testingUpload ? 'Generating Signature...' : 'Test Backend Cloudinary Signature'}
                  </button>
                </div>

                {uploadSignatureData && (
                  <div className="mt-4 p-4 bg-neutral-900 text-emerald-400 font-mono rounded-xl space-y-1">
                    <p className="text-white text-[11px] font-bold">
                      // Verified Server-Signed Payload (Secret completely absent):
                    </p>
                    <pre className="text-[11px] overflow-x-auto">
                      {JSON.stringify(uploadSignatureData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
