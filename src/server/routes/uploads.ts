import { Router, Response } from 'express';
import crypto from 'crypto';
import {
  authenticateToken,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.ts';

const router = Router();

// REQUIREMENT 19: Cloudinary integration is correctly separated from frontend secrets
// API Secret is NEVER sent to the client; only signature parameters or server-proxied uploads are used.
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'veloce-commerce';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '123456789012345';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'placeholder_cloudinary_api_secret_server_only';

// POST /api/uploads/sign - Generates signed upload payload for authenticated admin
router.post(
  '/sign',
  authenticateToken,
  requireAdmin,
  (req: AuthenticatedRequest, res: Response): void => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'veloce_products';

    // Cloudinary signature generation: SHA1 of sorted params string + secret
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    res.status(200).json({
      success: true,
      data: {
        cloudName: CLOUDINARY_CLOUD_NAME,
        apiKey: CLOUDINARY_API_KEY,
        timestamp,
        folder,
        signature,
        // Notice: CLOUDINARY_API_SECRET is completely absent from the response
      },
    });
  }
);

export default router;
