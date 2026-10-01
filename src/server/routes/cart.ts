import { Router, Request, Response } from 'express';
import { calculateAuthoritativePricing } from '../services/pricing.ts';

const router = Router();

// POST /api/cart/validate - Authoritative recalculation of prices, stock, taxes, discount, shipping
router.post('/validate', (req: Request, res: Response): void => {
  const { items, couponCode } = req.body;

  if (!items || !Array.isArray(items)) {
    res.status(400).json({
      success: false,
      message: 'Items array is required.',
    });
    return;
  }

  const result = calculateAuthoritativePricing(items, couponCode);

  res.status(200).json({
    success: result.isValid,
    data: result,
    message: result.isValid
      ? 'Cart pricing calculated successfully.'
      : 'Some items in cart failed validation.',
    errors: result.errors,
  });
});

export default router;
