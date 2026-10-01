import React from 'react';
import { X, CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Order } from '../types/index.ts';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrders: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewOrders,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-neutral-900">
            Order Confirmed
          </h2>
          <p className="text-xs font-mono text-neutral-500">
            Reference: {order.orderNumber}
          </p>
        </div>

        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <span className="font-mono text-neutral-500">Status</span>
            <span className="font-mono font-semibold uppercase text-neutral-900">
              {order.orderStatus}
            </span>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-neutral-500 block">Items Purchased:</span>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="font-medium text-neutral-800 truncate max-w-[240px]">
                  {item.quantity}x {item.title}
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-200 pt-2 space-y-1 font-mono">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span className="tabular-nums">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="tabular-nums">-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Shipping:</span>
              <span className="tabular-nums">
                {order.deliveryFee === 0 ? 'Free' : `$${order.deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Tax (8%):</span>
              <span className="tabular-nums">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-neutral-900 pt-1 text-sm">
              <span>Total Paid:</span>
              <span className="tabular-nums">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-neutral-500 font-mono">
          <span>Shipping to: </span>
          <span className="font-semibold text-neutral-800">
            {order.shippingAddress.fullName}, {order.shippingAddress.address},{' '}
            {order.shippingAddress.city} {order.shippingAddress.postalCode}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              onViewOrders();
            }}
            className="flex-1 py-3 px-4 bg-neutral-900 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>View All My Orders</span>
          </button>
        </div>
      </div>
    </div>
  );
};
