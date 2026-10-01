import React, { useState, useEffect } from 'react';
import { X, Star, ShieldCheck, Check, ShoppingBag, AlertCircle } from 'lucide-react';
import { Product, Review } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/client.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onProductUpdated?: (updated: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenAuth,
  onProductUpdated,
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setAddedSuccess(false);
      setShowReviewForm(false);
      setReviewError(null);
      setReviewSuccess(null);
      loadReviews(product._id);
    }
  }, [product]);

  const loadReviews = async (productId: string) => {
    setLoadingReviews(true);
    try {
      const res = await api.getProductById(productId);
      if (res.success && res.data) {
        setReviews(res.data.reviews || []);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await api.submitReview(
        product._id,
        reviewRating,
        reviewTitle,
        reviewComment
      );

      if (res.success && res.data) {
        setReviews((prev) => [res.data!.review, ...prev]);
        setReviewSuccess('Your verified purchase review has been posted.');
        setReviewTitle('');
        setReviewComment('');
        setShowReviewForm(false);
        if (res.data.product && onProductUpdated) {
          onProductUpdated(res.data.product);
        }
      } else {
        setReviewError(res.message || 'Unable to submit review.');
      }
    } catch (err: any) {
      setReviewError(err.message || 'Submission error.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Gallery Column */}
            <div className="space-y-4">
              <div className="aspect-4/3 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Specifications Table */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 text-xs">
                  <h4 className="font-semibold text-neutral-900 mb-2 font-mono uppercase tracking-wider text-[11px]">
                    Technical Specifications
                  </h4>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key}>
                        <dt className="text-neutral-500 font-mono">{key}</dt>
                        <dd className="font-medium text-neutral-900">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* Purchase & Info Column */}
            <div className="flex flex-col space-y-5">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-1">
                  <span>{product.category}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-neutral-900">
                      {product.rating.toFixed(1)}
                    </span>
                    <span>({product.numReviews} verified reviews)</span>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  {product.title}
                </h2>

                <div className="mt-3 flex items-baseline gap-3 font-mono tabular-nums">
                  <span className="text-2xl font-bold text-neutral-900">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed">
                {product.description}
              </p>

              {/* Stock status indicator */}
              <div className="text-xs font-mono">
                {isOutOfStock ? (
                  <span className="text-red-600 font-bold">
                    Sold Out — Authoritative checkout prevents backorders
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    In Stock: {product.stock} units available in warehouse
                  </span>
                )}
              </div>

              {/* Purchase Controls */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden bg-neutral-50">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="px-3 py-2 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-sm font-mono font-semibold text-neutral-900 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      disabled={quantity >= product.stock || isOutOfStock}
                      className="px-3 py-2 text-sm font-semibold hover:bg-neutral-200 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      isOutOfStock
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : addedSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add {quantity} to Bag</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews & Verified Purchase Validation (Requirement 18) */}
          <div className="mt-12 pt-8 border-t border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-display font-bold text-neutral-900 flex items-center gap-2">
                  <span>Customer Reviews</span>
                  <span className="text-xs font-mono text-neutral-500 font-normal">
                    ({reviews.length})
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verified owner feedback. Only customers with delivered orders can submit.
                </p>
              </div>

              {!showReviewForm && (
                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAuth();
                    } else {
                      setShowReviewForm(true);
                      setReviewError(null);
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors"
                >
                  Write a Verified Review
                </button>
              )}
            </div>

            {/* Review Status Banners */}
            {reviewSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            {reviewError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            {/* Write Review Form */}
            {showReviewForm && (
              <form
                onSubmit={handleReviewSubmit}
                className="mb-8 p-5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase font-bold text-neutral-900">
                    Write Product Review
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-600">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-neutral-500 ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Pristine acoustic resolution and comfortable fit"
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Review Details (Minimum 10 characters)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe build quality, real-world acoustic performance, ergonomics, etc."
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-neutral-500">
                    * Backend checks your order history for a completed delivered purchase.
                  </p>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="py-8 text-center text-xs font-mono text-neutral-500">
                Loading verified reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-8 text-center bg-neutral-50 rounded-xl border border-neutral-200">
                <p className="text-xs font-mono text-neutral-500">
                  No verified purchase reviews yet for this product.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-neutral-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-neutral-900">
                          {r.title}
                        </span>
                      </div>

                      {/* Verified Purchase Badge */}
                      {r.verifiedPurchase && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified Purchase</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">{r.comment}</p>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 pt-1">
                      <span>{r.userName}</span>
                      <span>·</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
