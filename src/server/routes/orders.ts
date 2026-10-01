import { Router, Response } from 'express';
import { db } from '../db.ts';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/auth.ts';
import { calculateAuthoritativePricing } from '../services/pricing.ts';

const router = Router();

// POST /api/orders - Create new order with authoritative backend calculation & stock deduction
router.post(
  '/',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const {
      items,
      shippingAddress,
      paymentMethod,
      couponCode,
      idempotencyKey,
      paymentDetails,
    } = req.body;

    // REQUIREMENT 17: Duplicate order creation handled safely via idempotency check
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const existingOrder = db.findOrderByIdempotencyKey(
        idempotencyKey,
        req.user.id
      );
      if (existingOrder) {
        res.status(200).json({
          success: true,
          message: 'Order already processed (idempotent response).',
          data: {
            order: existingOrder,
          },
        });
        return;
      }
    }

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.phone
    ) {
      res.status(400).json({
        success: false,
        message: 'Complete shipping address is required.',
      });
      return;
    }

    // REQUIREMENT 14 & 15: Authoritative pricing and backend validation
    const pricing = calculateAuthoritativePricing(items, couponCode);

    if (!pricing.isValid || !pricing.items.length) {
      res.status(400).json({
        success: false,
        message: 'Order creation rejected due to pricing or stock validation failure.',
        errors: pricing.errors,
      });
      return;
    }

    // REQUIREMENT 16: Checkout cannot create orders for unavailable stock
    for (const item of pricing.items) {
      const p = db.findProductById(item.productId);
      if (!p || p.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Product "${item.title}" is out of stock or insufficient quantity remains.`,
        });
        return;
      }
    }

    // Deduct stock atomically
    for (const item of pricing.items) {
      const p = db.findProductById(item.productId)!;
      db.updateProduct(item.productId, {
        stock: p.stock - item.quantity,
      });
    }

    // REQUIREMENT 13: Raw card/CVV data is NEVER stored
    // Only safe tokens or masked last-4 digits are preserved
    const sanitizedPaymentDetails =
      paymentMethod === 'cod'
        ? undefined
        : {
            brand: paymentDetails?.brand || 'Visa',
            last4: paymentDetails?.last4 || '4242',
            status: 'paid' as const,
            transactionId: `txn_sec_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          };

    const orderNumber = `VEL-${new Date().getFullYear()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    const newOrder = db.createOrder({
      orderNumber,
      userId: req.user.id,
      userEmail: req.user.email,
      items: pricing.items.map((i) => ({
        productId: i.productId,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country?.trim() || 'United States',
        phone: shippingAddress.phone.trim(),
      },
      paymentMethod: paymentMethod || 'card',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      paymentDetails: sanitizedPaymentDetails,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      tax: pricing.tax,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,
      couponCode: pricing.couponApplied?.code,
      orderStatus: 'pending',
      idempotencyKey,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: {
        order: newOrder,
      },
    });
  }
);

// GET /api/orders/my-orders - Current authenticated user's orders
router.get(
  '/my-orders',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const orders = db.getOrders(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        orders,
      },
    });
  }
);

// GET /api/orders/:id - Customer isolation (Requirement 9: Customers cannot access other customers' private data)
router.get(
  '/:id',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const order = db.findOrderById(req.params.id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
      return;
    }

    // REQUIREMENT 9: Strict customer data isolation
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message:
          'Forbidden: You are not authorized to view another customer’s order.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  }
);

export default router;
