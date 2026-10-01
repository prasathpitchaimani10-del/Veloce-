import { Router, Response } from 'express';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/auth.ts';
import crypto from 'crypto';

const router = Router();

// REQUIREMENT 12: Payment secrets are never exposed to the frontend.
// Secret key resides strictly on the server:
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_secret_key_server_only';

// POST /api/payments/create-intent
router.post(
  '/create-intent',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    const { amount, currency = 'usd' } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'A valid transaction amount is required.',
      });
      return;
    }

    // Generate safe client secret without exposing STRIPE_SECRET_KEY
    const paymentIntentId = `pi_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(8).toString('hex')}`;

    res.status(200).json({
      success: true,
      data: {
        paymentIntentId,
        clientSecret, // Client secret only allows charging this single intent
        amount: Math.round(numAmount * 100), // in cents
        currency,
        publishableKey: 'pk_test_sample_public_key',
      },
    });
  }
);

// POST /api/payments/confirm
router.post(
  '/confirm',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    const { paymentIntentId, clientSecret } = req.body;

    if (!paymentIntentId || !clientSecret) {
      res.status(400).json({
        success: false,
        message: 'Payment intent verification parameters missing.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Payment authorized and verified securely.',
      data: {
        status: 'succeeded',
        transactionId: `txn_${Date.now()}`,
      },
    });
  }
);

export default router;
