import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product, PriceCalculationResult } from '../types/index.ts';
import { api } from '../api/client.ts';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  couponCode: string;
  appliedCoupon: string | null;
  pricing: PriceCalculationResult | null;
  isValidating: boolean;
  validationError: string | null;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  refreshPricing: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'veloce_cart_items';
const COUPON_STORAGE_KEY = 'veloce_applied_coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    return localStorage.getItem(COUPON_STORAGE_KEY) || null;
  });

  const [couponCode, setCouponCode] = useState<string>(appliedCoupon || '');
  const [pricing, setPricing] = useState<PriceCalculationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, appliedCoupon);
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon]);

  // Recalculate authoritative server-side pricing whenever items or coupon change
  const refreshPricing = useCallback(async () => {
    if (items.length === 0) {
      setPricing(null);
      setValidationError(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const payload = items.map((i) => ({
        productId: i.product._id,
        quantity: i.quantity,
      }));

      const res = await api.validateCart(payload, appliedCoupon || undefined);

      if (res.data) {
        setPricing(res.data);
        if (!res.data.isValid && res.data.errors?.length) {
          setValidationError(res.data.errors[0]);
        } else {
          setValidationError(null);
        }
      }
    } catch (err: any) {
      console.error('Cart calculation failed:', err);
    } finally {
      setIsValidating(false);
    }
  }, [items, appliedCoupon]);

  useEffect(() => {
    refreshPricing();
  }, [refreshPricing]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponCode('');
    setPricing(null);
  };

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      return { success: false, message: 'Please enter a coupon code.' };
    }

    const payload = items.map((i) => ({
      productId: i.product._id,
      quantity: i.quantity,
    }));

    const res = await api.validateCart(payload, trimmed);
    if (res.data && res.data.couponApplied) {
      setAppliedCoupon(trimmed);
      setCouponCode(trimmed);
      setPricing(res.data);
      return {
        success: true,
        message: `Coupon "${trimmed}" applied: $${res.data.discount.toFixed(2)} off!`,
      };
    }

    const firstErr = Array.isArray(res.errors)
      ? res.errors[0]
      : res.errors
      ? Object.values(res.errors)[0]
      : undefined;
    const err = firstErr || res.message || 'Invalid coupon code.';
    return { success: false, message: err };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        couponCode,
        appliedCoupon,
        pricing,
        isValidating,
        validationError,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshPricing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
