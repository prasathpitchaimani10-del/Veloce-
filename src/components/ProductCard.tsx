import React from 'react';
import { Star, Plus, Check } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, items } = useCart();
  const cartItem = items.find((i) => i.product._id === product._id);
  const isInCart = Boolean(cartItem);
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group flex flex-col bg-white rounded-xl border border-neutral-200/80 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Visual Slot */}
      <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-neutral-400">
            Image Unavailable
          </div>
        )}

        {/* Subtle Text Tag (Rule: max 1 subtle text tag, never badge sandwich) */}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[11px] font-mono font-medium px-2 py-0.5 rounded text-neutral-800 shadow-2xs">
            {product.badge}
          </span>
        )}

        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) {
              addToCart(product, 1);
            }
          }}
          disabled={isOutOfStock}
          className={`absolute bottom-3 right-3 p-2 rounded-lg shadow-sm transition-all ${
            isOutOfStock
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : isInCart
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-white text-neutral-900 hover:bg-neutral-900 hover:text-white'
          }`}
          aria-label={isOutOfStock ? 'Out of stock' : 'Quick add to bag'}
          title={isOutOfStock ? 'Sold Out' : 'Quick Add to Bag'}
        >
          {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Metadata & Pricing Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & Rating Line */}
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1 font-mono">
            <span>{product.category}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-neutral-400">({product.numReviews})</span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1 group-hover:text-neutral-700">
            {product.title}
          </h3>

          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Price and Stock Baseline */}
        <div className="flex items-baseline justify-between pt-2 border-t border-neutral-100">
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-base font-semibold text-neutral-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-neutral-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <span
            className={`text-[11px] font-mono ${
              isOutOfStock
                ? 'text-red-600 font-semibold'
                : product.stock <= 5
                ? 'text-amber-600 font-medium'
                : 'text-neutral-500'
            }`}
          >
            {isOutOfStock
              ? 'Sold Out'
              : product.stock <= 5
              ? `${product.stock} Left`
              : 'In Stock'}
          </span>
        </div>
      </div>
    </div>
  );
};
