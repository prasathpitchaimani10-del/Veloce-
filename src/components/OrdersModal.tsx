import React, { useState, useEffect } from 'react';
import { X, Package, Clock, Truck, CheckCircle2, AlertCircle, Star } from 'lucide-react';
import { Order, Product } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductForReview: (productId: string) => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  onSelectProductForReview,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadOrders();
    }
  }, [isOpen, user]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // REQUIREMENT 9: Customers cannot access other customers' private data
      // /api/orders/my-orders only returns records belonging to the authenticated token
      const res = await api.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data.orders);
      } else {
        setError(res.message || 'Failed to retrieve order history.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error loading orders.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
            <Truck className="w-3 h-3" />
            Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-800 bg-red-100 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-neutral-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-neutral-900" />
            <h2 className="text-base font-display font-bold text-neutral-900">
              My Order History
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              Authenticated: {user?.email}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-neutral-500">
              Fetching private order archive...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-sm font-semibold text-neutral-800">No orders placed yet</p>
              <p className="text-xs text-neutral-500">
                Any orders you complete will appear here with live tracking and receipt status.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="bg-neutral-50 rounded-xl p-5 border border-neutral-200/80 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-neutral-900">
                      {order.orderNumber}
                    </span>
                    <p className="text-[11px] font-mono text-neutral-400">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.orderStatus)}
                    <span className="text-sm font-mono font-bold text-neutral-900 tabular-nums">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-10 h-10 object-cover rounded bg-white border border-neutral-200"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-neutral-900">{item.title}</p>
                          <p className="text-[11px] font-mono text-neutral-500">
                            Qty: {item.quantity} · ${item.price.toFixed(2)} ea
                          </p>
                        </div>
                      </div>

                      {/* Verified review action for delivered orders */}
                      {order.orderStatus === 'delivered' && (
                        <button
                          onClick={() => {
                            onClose();
                            onSelectProductForReview(item.productId);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded flex items-center gap-1 shadow-2xs"
                        >
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shipping & Payment Meta */}
                <div className="pt-2 border-t border-neutral-200/60 flex flex-wrap justify-between text-[11px] font-mono text-neutral-500">
                  <span>
                    Delivering to: {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </span>
                  <span>
                    Payment: {order.paymentMethod.toUpperCase()}{' '}
                    {order.paymentDetails?.last4 ? `(•• ${order.paymentDetails.last4})` : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
