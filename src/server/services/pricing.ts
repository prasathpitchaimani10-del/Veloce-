import { db } from '../db.ts';
import { PriceCalculationResult } from '../../types/index.ts';

export function calculateAuthoritativePricing(
  requestedItems: Array<{ productId: string; quantity: number }>,
  couponCode?: string
): PriceCalculationResult {
  const errors: string[] = [];
  const processedItems: PriceCalculationResult['items'] = [];
  let subtotal = 0;

  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
      isValid: false,
      errors: ['Cart is empty. Please add items before calculating checkout.'],
    };
  }

  for (const item of requestedItems) {
    if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Invalid cart item entry.`);
      continue;
    }

    const product = db.findProductById(item.productId);
    if (!product) {
      errors.push(`Product with ID "${item.productId}" no longer exists.`);
      continue;
    }

    // REQUIREMENT 16: Checkout cannot create orders for unavailable stock
    if (product.stock < item.quantity) {
      errors.push(
        `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}.`
      );
    }

    // REQUIREMENT 15: Authoritative pricing - strictly from database
    const lineTotal = parseFloat((product.price * item.quantity).toFixed(2));
    subtotal += lineTotal;

    processedItems.push({
      productId: product._id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      availableStock: product.stock,
      lineTotal,
      image: product.images[0] || '',
    });
  }

  subtotal = parseFloat(subtotal.toFixed(2));

  // Authoritative Coupon Validation
  let discount = 0;
  let couponApplied: PriceCalculationResult['couponApplied'] = undefined;

  if (couponCode && couponCode.trim()) {
    const code = couponCode.trim().toUpperCase();
    const coupon = db.findCouponByCode(code);

    if (!coupon) {
      errors.push(`Coupon code "${code}" is invalid.`);
    } else if (!coupon.isActive) {
      errors.push(`Coupon code "${code}" is currently deactivated.`);
    } else if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      errors.push(`Coupon code "${code}" has expired.`);
    } else if (subtotal < coupon.minOrderAmount) {
      errors.push(
        `Coupon "${code}" requires a minimum order amount of $${coupon.minOrderAmount.toFixed(
          2
        )} (current subtotal: $${subtotal.toFixed(2)}).`
      );
    } else {
      if (coupon.discountType === 'percentage') {
        discount = parseFloat(((subtotal * coupon.discountValue) / 100).toFixed(2));
      } else {
        discount = Math.min(coupon.discountValue, subtotal);
      }
      couponApplied = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      };
    }
  }

  // Delivery Fee calculation: Free if subtotal >= 150, else $15
  const deliveryFee = subtotal >= 150 || subtotal === 0 ? 0 : 15.0;

  // Authoritative 8% tax calculation on post-discount subtotal
  const taxableBase = Math.max(0, subtotal - discount);
  const tax = parseFloat((taxableBase * 0.08).toFixed(2));

  const total = parseFloat((taxableBase + deliveryFee + tax).toFixed(2));

  return {
    items: processedItems,
    subtotal,
    discount,
    tax,
    deliveryFee,
    total,
    couponApplied,
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
