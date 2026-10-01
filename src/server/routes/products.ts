import { Router, Response } from 'express';
import { db } from '../db.ts';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/auth.ts';

const router = Router();

// GET /api/products
router.get('/', (req, res: Response): void => {
  const { category, search, featured, sort } = req.query;

  const isFeatured =
    featured === 'true' ? true : featured === 'false' ? false : undefined;

  const products = db.getProducts({
    category: category as string,
    search: search as string,
    featured: isFeatured,
    sort: sort as string,
  });

  res.status(200).json({
    success: true,
    data: {
      products,
      total: products.length,
    },
  });
});

// GET /api/products/:id
router.get('/:id', (req, res: Response): void => {
  const product = db.findProductById(req.params.id);
  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found.',
    });
    return;
  }

  const reviews = db.getReviewsForProduct(product._id);

  res.status(200).json({
    success: true,
    data: {
      product,
      reviews,
    },
  });
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', (req, res: Response): void => {
  const product = db.findProductById(req.params.id);
  if (!product) {
    res.status(404).json({
      success: false,
      message: 'Product not found.',
    });
    return;
  }

  const reviews = db.getReviewsForProduct(product._id);
  res.status(200).json({
    success: true,
    data: {
      reviews,
    },
  });
});

// POST /api/products/:id/reviews (Requirement 18: Verified-purchase reviews cannot be forged)
router.post(
  '/:id/reviews',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const productId = req.params.id;
    const product = db.findProductById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const { rating, title, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
      res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'Review headline must be at least 3 characters.',
      });
      return;
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'Review text must be at least 10 characters long.',
      });
      return;
    }

    // REQUIREMENT 18: Verified-purchase reviews cannot be forged
    const hasPurchased = db.userHasDeliveredPurchase(req.user.id, productId);
    if (!hasPurchased) {
      res.status(403).json({
        success: false,
        message:
          'Review forbidden: Only customers who have completed a delivered purchase of this product are authorized to post a verified review.',
      });
      return;
    }

    // Prevent duplicate reviews
    const alreadyReviewed = db.hasUserReviewedProduct(req.user.id, productId);
    if (alreadyReviewed) {
      res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this product.',
      });
      return;
    }

    const newReview = db.createReview({
      productId,
      userId: req.user.id,
      userName: req.user.name,
      rating: numRating,
      title: title.trim(),
      comment: comment.trim(),
      verifiedPurchase: true,
    });

    res.status(201).json({
      success: true,
      message: 'Verified review submitted successfully.',
      data: {
        review: newReview,
        product: db.findProductById(productId),
      },
    });
  }
);

export default router;
