export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'password'>;

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  stock: number;
  rating: number;
  numReviews: number;
  specs: Record<string, string>;
  badge?: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderPaymentDetails {
  brand?: string;
  last4?: string;
  status: 'paid' | 'pending' | 'failed';
  transactionId?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'card' | 'cod' | 'digital_wallet';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentDetails?: OrderPaymentDetails;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  orderStatus: OrderStatus;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string> | string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PriceCalculationRequest {
  items: Array<{ productId: string; quantity: number }>;
  couponCode?: string;
}

export interface PriceCalculationResult {
  items: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
    availableStock: number;
    lineTotal: number;
    image: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  couponApplied?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  };
  isValid: boolean;
  errors?: string[];
}
