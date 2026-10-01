import {
  ApiResponse,
  Product,
  Order,
  Review,
  Coupon,
  Category,
  PriceCalculationResult,
  SafeUser,
  OrderStatus,
} from '../types/index.ts';

const TOKEN_KEY = 'veloce_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await res.json();

    if (!res.ok) {
      if (res.status === 401 && endpoint !== '/api/auth/login') {
        // If expired or unauthorized, clear token
        setStoredToken(null);
      }
      return {
        success: false,
        message: data.message || `Request failed with status ${res.status}`,
        errors: data.errors,
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network connection error. Please check your internet.',
    };
  }
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    request<{ user: SafeUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ user: SafeUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<{ user: SafeUser }>('/api/auth/me'),

  updateProfile: (name: string) =>
    request<{ user: SafeUser }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  // Products
  getProducts: (params?: {
    category?: string;
    search?: string;
    featured?: boolean;
    sort?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.featured !== undefined) query.set('featured', String(params.featured));
    if (params?.sort) query.set('sort', params.sort);
    return request<{ products: Product[]; total: number }>(
      `/api/products?${query.toString()}`
    );
  },

  getProductById: (id: string) =>
    request<{ product: Product; reviews: Review[] }>(`/api/products/${id}`),

  submitReview: (
    productId: string,
    rating: number,
    title: string,
    comment: string
  ) =>
    request<{ review: Review; product: Product }>(
      `/api/products/${productId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify({ rating, title, comment }),
      }
    ),

  // Cart & Pricing
  validateCart: (
    items: Array<{ productId: string; quantity: number }>,
    couponCode?: string
  ) =>
    request<PriceCalculationResult>('/api/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items, couponCode }),
    }),

  // Orders
  createOrder: (payload: {
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: {
      fullName: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      phone: string;
    };
    paymentMethod: 'card' | 'cod' | 'digital_wallet';
    couponCode?: string;
    idempotencyKey?: string;
    paymentDetails?: {
      brand?: string;
      last4?: string;
    };
  }) =>
    request<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => request<{ orders: Order[] }>('/api/orders/my-orders'),

  getOrderById: (id: string) =>
    request<{ order: Order }>(`/api/orders/${id}`),

  // Categories & Coupons
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),

  validateCoupon: (code: string, subtotal: number) =>
    request<{ coupon: Coupon }>('/api/categories/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),

  // Admin
  adminGetStats: () =>
    request<{
      totalRevenue: number;
      totalOrders: number;
      totalProducts: number;
      lowStockCount: number;
      recentOrders: Order[];
    }>('/api/admin/stats'),

  adminGetProducts: () =>
    request<{ products: Product[] }>('/api/admin/products'),

  adminCreateProduct: (data: Partial<Product>) =>
    request<{ product: Product }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminUpdateProduct: (id: string, data: Partial<Product>) =>
    request<{ product: Product }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  adminDeleteProduct: (id: string) =>
    request(`/api/admin/products/${id}`, { method: 'DELETE' }),

  adminGetOrders: () => request<{ orders: Order[] }>('/api/admin/orders'),

  adminUpdateOrderStatus: (id: string, status: OrderStatus) =>
    request<{ order: Order }>(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  adminGetCoupons: () => request<{ coupons: Coupon[] }>('/api/admin/coupons'),

  adminCreateCoupon: (data: Partial<Coupon>) =>
    request<{ coupon: Coupon }>('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminDeleteCoupon: (id: string) =>
    request(`/api/admin/coupons/${id}`, { method: 'DELETE' }),

  // Media upload signed payload (Requirement 19)
  adminGetUploadSignature: () =>
    request<{
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      signature: string;
    }>('/api/uploads/sign', { method: 'POST' }),
};
