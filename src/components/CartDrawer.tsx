import React, { useState } from 'react';
import { X, Trash2, Tag, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    items,
    itemCount,
    updateQuantity,
    removeFromCart,
    pricing,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    isValidating,
    validationError,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = await applyCoupon(inputCoupon);
    setCouponFeedback({
      success: res.success,
      message: res.message || '',
    });
    if (res.success) {
      setInputCoupon('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neutral-900" />
            <h2 className="text-base font-display font-bold text-neutral-900">
              Shopping Bag
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <ShoppingBag className="w-12 h-12 text-neutral-300 stroke-[1.5]" />
              <p className="text-sm font-semibold text-neutral-800">Your bag is empty</p>
              <p className="text-xs text-neutral-500 max-w-xs">
                Explore our acoustics, mechanical hardware, and precision timepieces.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(({ product, quantity }) => {
                const isOverStock = quantity > product.stock;
                return (
                  <div
                    key={product._id}
                    className="flex gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200/70"
                  >
                    <div className="w-18 h-18 rounded-lg overflow-hidden bg-white shrink-0 border border-neutral-200">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-neutral-900 truncate">
                            {product.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(product._id)}
                            className="text-neutral-400 hover:text-red-600 p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-mono text-neutral-500">
                          ${product.price.toFixed(2)} each
                        </p>
                      </div>

                      {isOverStock && (
                        <p className="text-[11px] text-red-600 font-mono font-medium">
                          Only {product.stock} available in warehouse
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center border border-neutral-300 rounded bg-white">
                          <button
                            onClick={() => updateQuantity(product._id, quantity - 1)}
                            className="px-2 py-0.5 text-xs hover:bg-neutral-100"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-mono font-semibold tabular-nums">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product._id, quantity + 1)}
                            disabled={quantity >= product.stock}
                            className="px-2 py-0.5 text-xs hover:bg-neutral-100 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-mono font-bold text-neutral-900 tabular-nums">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Coupon Code Section */}
              <div className="pt-2 border-t border-neutral-200">
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-3" />
                      <input
                        type="text"
                        placeholder="Coupon code (e.g. WELCOME15)"
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                        className="w-full text-xs pl-8 pr-2 py-2 border border-neutral-300 rounded-lg uppercase font-mono focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!inputCoupon.trim() || isValidating}
                      className="px-3 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>

                  {couponFeedback && (
                    <div
                      className={`text-xs p-2 rounded-lg ${
                        couponFeedback.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {couponFeedback.message}
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-emerald-900">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Coupon Active: <strong>{appliedCoupon}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Authoritative Price Recalculation (Requirement 14 & 15) */}
        {items.length > 0 && (
          <div className="p-4 sm:p-6 bg-neutral-50 border-t border-neutral-200 space-y-3">
            <div className="space-y-1.5 text-xs text-neutral-600 font-mono">
              <div className="flex justify-between">
                <span>Subtotal (Authoritative)</span>
                <span className="font-semibold text-neutral-900 tabular-nums">
                  ${pricing ? pricing.subtotal.toFixed(2) : '...'}
                </span>
              </div>

              {pricing && pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({pricing.couponApplied?.code})</span>
                  <span className="tabular-nums">-${pricing.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {pricing?.deliveryFee === 0 ? (
                    <span className="text-emerald-700 font-semibold">Complimentary</span>
                  ) : (
                    `$${pricing?.deliveryFee?.toFixed(2) || '15.00'}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Sales Tax (8%)</span>
                <span className="tabular-nums">
                  ${pricing ? pricing.tax.toFixed(2) : '...'}
                </span>
              </div>

              <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold text-neutral-900">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums">
                  ${pricing ? pricing.total.toFixed(2) : '...'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              disabled={isValidating || Boolean(validationError)}
              className="w-full py-3 px-4 bg-neutral-900 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
