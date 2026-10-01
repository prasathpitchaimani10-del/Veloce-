import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

const router = Router();

// GET /api/categories
router.get('/', (_req: Request, res: Response): void => {
  const categories = db.getCategories();
  res.status(200).json({
    success: true,
    data: { categories },
  });
});

// POST /api/coupons/validate - Public coupon validation for checkout pre-checks
router.post('/validate-coupon', (req: Request, res: Response): void => {
  const { code, subtotal = 0 } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Coupon code is required.',
    });
    return;
  }

  const coupon = db.findCouponByCode(code);
  if (!coupon) {
    res.status(404).json({
      success: false,
      message: `Coupon code "${code.toUpperCase()}" does not exist.`,
    });
    return;
  }

  if (!coupon.isActive) {
    res.status(400).json({
      success: false,
      message: `Coupon code "${coupon.code}" is inactive.`,
    });
    return;
  }

  if (new Date(coupon.expiresAt).getTime() < Date.now()) {
    res.status(400).json({
      success: false,
      message: `Coupon code "${coupon.code}" has expired.`,
    });
    return;
  }

  if (subtotal < coupon.minOrderAmount) {
    res.status(400).json({
      success: false,
      message: `Coupon requires minimum cart subtotal of $${coupon.minOrderAmount.toFixed(2)}.`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" is valid.`,
    data: {
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
      },
    },
  });
});

export default router;
