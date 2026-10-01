import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, Banknote, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/client.ts';
import { Order } from '../types/index.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
  onOpenAuth: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { items, appliedCoupon, pricing, clearCart } = useCart();

  // Shipping Form State
  const [fullName, setFullName] = useState(user?.name || 'Alex Morgan');
  const [address, setAddress] = useState('742 Evergreen Terrace');
  const [city, setCity] = useState('Seattle');
  const [postalCode, setPostalCode] = useState('98101');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('+1 206 555 0192');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'digital_wallet'>('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardBrand, setCardBrand] = useState('Visa');

  // Processing & Idempotency
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Generate unique idempotency key when opening checkout session (Requirement 17)
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      setCheckoutError(null);
      if (user) {
        setFullName(user.name);
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      onOpenAuth();
      return;
    }

    if (items.length === 0) {
      setCheckoutError('Your bag is empty.');
      return;
    }

    if (!fullName.trim() || !address.trim() || !city.trim() || !postalCode.trim() || !phone.trim()) {
      setCheckoutError('Please fill in all required shipping address fields.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      // REQUIREMENT 15: Client only sends item IDs and quantities, NEVER prices!
      // REQUIREMENT 13: Client never transmits raw card/CVV data to server!
      const res = await api.createOrder({
        items: items.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
        })),
        shippingAddress: {
          fullName,
          address,
          city,
          postalCode,
          country,
          phone,
        },
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        idempotencyKey,
        paymentDetails:
          paymentMethod === 'card'
            ? {
                brand: cardBrand,
                last4: cardNumber.replace(/\D/g, '').slice(-4) || '4242',
              }
            : undefined,
      });

      if (res.success && res.data?.order) {
        clearCart();
        onClose();
        onOrderSuccess(res.data.order);
      } else {
        setCheckoutError(res.message || 'Checkout failed. Please inspect order requirements.');
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Network error while finalizing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            <h2 className="text-base font-display font-bold text-neutral-900">
              Encrypted Checkout
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              Idempotency: {idempotencyKey.slice(0, 14)}...
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">
          {/* User Sign-in Status Prompt */}
          {!user && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>You must be authenticated to associate your private order receipt.</span>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800"
              >
                Sign In
              </button>
            </div>
          )}

          {checkoutError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Section 1: Delivery Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              1. Delivery Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                2. Payment Method
              </h3>
              <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                PCI-DSS Compliant (No raw CVV stored)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('digital_wallet')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'digital_wallet'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Digital Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash on Delivery</span>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    readOnly
                    className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Tokenized Card
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                      Network Brand
                    </label>
                    <select
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-lg"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="American Express">American Express</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Authoritative Breakdown */}
          <div className="p-4 bg-neutral-100/70 rounded-xl border border-neutral-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-neutral-600">
              <span>Authoritative Subtotal:</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                ${pricing ? pricing.subtotal.toFixed(2) : '0.00'}
              </span>
            </div>

            {pricing && pricing.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon ({pricing.couponApplied?.code}):</span>
                <span className="tabular-nums">-${pricing.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-600">
              <span>Courier Delivery:</span>
              <span className="tabular-nums">
                {pricing?.deliveryFee === 0 ? 'Free' : `$${pricing?.deliveryFee?.toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>Estimated Tax (8%):</span>
              <span className="tabular-nums">${pricing ? pricing.tax.toFixed(2) : '0.00'}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-neutral-900">
              <span>Grand Total:</span>
              <span className="tabular-nums">${pricing ? pricing.total.toFixed(2) : '0.00'}</span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !user}
              className="w-full py-3.5 px-4 bg-neutral-900 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? (
                <span>Validating & Authorizing Transaction...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Place Order (${pricing?.total.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
