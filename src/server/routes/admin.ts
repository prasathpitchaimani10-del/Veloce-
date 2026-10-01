import { Router, Response } from 'express';
import { db } from '../db.ts';
import {
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.ts';
import { OrderStatus } from '../../types/index.ts';

const router = Router();

// Enforce admin authorization on all routes in this router (Requirement 8 & 10)
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', (_req: AuthenticatedRequest, res: Response): void => {
  const orders = db.getOrders();
  const products = db.getProducts();

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const lowStockProducts = products.filter((p) => p.stock <= 5);

  res.status(200).json({
    success: true,
    data: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders: orders.length,
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      recentOrders: orders.slice(0, 5),
    },
  });
});

// GET /api/admin/products
router.get('/products', (_req: AuthenticatedRequest, res: Response): void => {
  const products = db.getProducts();
  res.status(200).json({
    success: true,
    data: { products },
  });
});

// POST /api/admin/products - Create product (Requirement 23)
router.post('/products', (req: AuthenticatedRequest, res: Response): void => {
  const { title, description, price, category, stock, images, specs, badge, isFeatured } =
    req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    res.status(400).json({ success: false, message: 'Valid title is required.' });
    return;
  }

  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
    return;
  }

  const numStock = Number(stock);
  if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
    res.status(400).json({
      success: false,
      message: 'Stock must be a non-negative integer.',
    });
    return;
  }

  if (!category || typeof category !== 'string') {
    res.status(400).json({ success: false, message: 'Category is required.' });
    return;
  }

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const newProduct = db.createProduct({
    title: title.trim(),
    slug,
    description: description?.trim() || '',
    price: parseFloat(numPrice.toFixed(2)),
    category: category.trim(),
    stock: numStock,
    images: Array.isArray(images) && images.length ? images : ['/src/assets/images/hero_luxury_audio_1790879068988.jpg'],
    specs: specs || {},
    badge: badge?.trim() || undefined,
    isFeatured: Boolean(isFeatured),
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    data: { product: newProduct },
  });
});

// PUT /api/admin/products/:id - Update product (Requirement 23)
router.put('/products/:id', (req: AuthenticatedRequest, res: Response): void => {
  const product = db.findProductById(req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  const updates: any = {};
  if (req.body.title !== undefined) updates.title = req.body.title.trim();
  if (req.body.description !== undefined) updates.description = req.body.description.trim();
  if (req.body.price !== undefined) {
    const p = Number(req.body.price);
    if (isNaN(p) || p <= 0) {
      res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
      return;
    }
    updates.price = parseFloat(p.toFixed(2));
  }
  if (req.body.stock !== undefined) {
    const s = Number(req.body.stock);
    if (isNaN(s) || s < 0 || !Number.isInteger(s)) {
      res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer.',
      });
      return;
    }
    updates.stock = s;
  }
  if (req.body.category !== undefined) updates.category = req.body.category.trim();
  if (req.body.badge !== undefined) updates.badge = req.body.badge.trim() || undefined;
  if (req.body.images !== undefined && Array.isArray(req.body.images)) {
    updates.images = req.body.images;
  }
  if (req.body.isFeatured !== undefined) updates.isFeatured = Boolean(req.body.isFeatured);
  if (req.body.specs !== undefined) updates.specs = req.body.specs;

  const updatedProduct = db.updateProduct(product._id, updates);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully.',
    data: { product: updatedProduct },
  });
});

// DELETE /api/admin/products/:id - Delete product (Requirement 23)
router.delete('/products/:id', (req: AuthenticatedRequest, res: Response): void => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully.',
  });
});

// GET /api/admin/orders - View all customer orders
router.get('/orders', (_req: AuthenticatedRequest, res: Response): void => {
  const orders = db.getOrders();
  res.status(200).json({
    success: true,
    data: { orders },
  });
});

// PUT /api/admin/orders/:id/status - Update order lifecycle status
router.put('/orders/:id/status', (req: AuthenticatedRequest, res: Response): void => {
  const { status } = req.body;
  const validStatuses: OrderStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`,
    });
    return;
  }

  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}.`,
    data: { order: updated },
  });
});

// GET /api/admin/coupons
router.get('/coupons', (_req: AuthenticatedRequest, res: Response): void => {
  const coupons = db.getCoupons();
  res.status(200).json({
    success: true,
    data: { coupons },
  });
});

// POST /api/admin/coupons
router.post('/coupons', (req: AuthenticatedRequest, res: Response): void => {
  const { code, discountType, discountValue, minOrderAmount, expiresAt, isActive } =
    req.body;

  if (!code || typeof code !== 'string' || code.trim().length < 3) {
    res.status(400).json({
      success: false,
      message: 'Coupon code must be at least 3 characters.',
    });
    return;
  }

  const existing = db.findCouponByCode(code.trim());
  if (existing) {
    res.status(409).json({
      success: false,
      message: 'A coupon with this code already exists.',
    });
    return;
  }

  if (discountType !== 'percentage' && discountType !== 'fixed') {
    res.status(400).json({
      success: false,
      message: 'Discount type must be either "percentage" or "fixed".',
    });
    return;
  }

  const val = Number(discountValue);
  if (isNaN(val) || val <= 0) {
    res.status(400).json({
      success: false,
      message: 'Discount value must be greater than 0.',
    });
    return;
  }

  if (discountType === 'percentage' && val > 100) {
    res.status(400).json({
      success: false,
      message: 'Percentage discount cannot exceed 100%.',
    });
    return;
  }

  const newCoupon = db.createCoupon({
    code: code.trim().toUpperCase(),
    discountType,
    discountValue: val,
    minOrderAmount: Number(minOrderAmount) || 0,
    expiresAt: expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
    isActive: isActive !== false,
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully.',
    data: { coupon: newCoupon },
  });
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', (req: AuthenticatedRequest, res: Response): void => {
  const deleted = db.deleteCoupon(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Coupon not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Coupon removed successfully.',
  });
});

export default router;
