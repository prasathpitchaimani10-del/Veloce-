import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Product, Order, Coupon, Review, SafeUser } from '../types/index.ts';

// MongoDB ObjectId simulator (24 hex characters)
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + random).substring(0, 24);
}

export function sanitizeUser(user: User): SafeUser {
  const { password, ...safe } = user;
  return safe;
}

interface DatabaseSchema {
  users: User[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  reviews: Review[];
}

const DB_FILE = path.resolve(process.cwd(), '.db_store.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    users: [],
    products: [],
    orders: [],
    coupons: [],
    reviews: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        if (!this.data.users) this.data.users = [];
        if (!this.data.products) this.data.products = [];
        if (!this.data.orders) this.data.orders = [];
        if (!this.data.coupons) this.data.coupons = [];
        if (!this.data.reviews) this.data.reviews = [];
        return;
      } catch (e) {
        console.error('Error loading db file, re-seeding:', e);
      }
    }
    this.seed();
    this.persist();
  }

  public persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private seed() {
    const salt = bcrypt.genSaltSync(10);
    const customerPasswordHash = bcrypt.hashSync('password123', salt);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);

    const customerUser: User = {
      _id: '66a100000000000000000001',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      role: 'customer',
      password: customerPasswordHash,
      createdAt: '2026-01-15T10:00:00.000Z',
      updatedAt: '2026-01-15T10:00:00.000Z',
    };

    const adminUser: User = {
      _id: '66a100000000000000000002',
      name: 'Elena Rostova',
      email: 'admin@veloce.com',
      role: 'admin',
      password: adminPasswordHash,
      createdAt: '2026-01-10T08:30:00.000Z',
      updatedAt: '2026-01-10T08:30:00.000Z',
    };

    const products: Product[] = [
      {
        _id: '66b200000000000000000001',
        title: 'Veloce H1 Reference Wireless Headphones',
        slug: 'veloce-h1-reference-wireless-headphones',
        description:
          'Acoustically tuned custom 45mm beryllium drivers with hybrid active noise cancellation, aptX Lossless transmission, and precision machined aluminum pivot joints.',
        price: 349.0,
        originalPrice: 399.0,
        category: 'Audio',
        images: ['/src/assets/images/product_matte_headphones_1790879078207.jpg'],
        stock: 14,
        rating: 4.9,
        numReviews: 8,
        specs: {
          Driver: '45mm Beryllium',
          Battery: '42 Hours with ANC',
          Weight: '278g',
          Connectivity: 'Bluetooth 5.4 / USB-C Lossless',
        },
        badge: 'Staff Pick',
        isFeatured: true,
        createdAt: '2026-02-01T12:00:00.000Z',
        updatedAt: '2026-02-01T12:00:00.000Z',
      },
      {
        _id: '66b200000000000000000002',
        title: 'Veloce K7 Anodized Custom Keyboard',
        slug: 'veloce-k7-anodized-custom-keyboard',
        description:
          'Gasket-mounted 65% chassis carved from 6063 aerospace aluminum, paired with factory-lubed linear switches and double-shot PBT botanical profile caps.',
        price: 280.0,
        originalPrice: 310.0,
        category: 'Hardware',
        images: ['/src/assets/images/product_mechanical_keyboard_1790879089678.jpg'],
        stock: 9,
        rating: 4.8,
        numReviews: 6,
        specs: {
          Chassis: 'CNC 6063 Aluminum',
          Mounting: 'Isolated Poron Gasket',
          Switches: 'Veloce Linear Silents (45g)',
          Keycaps: 'Dye-sub PBT Cherry Profile',
        },
        badge: 'Limited Run',
        isFeatured: true,
        createdAt: '2026-02-05T14:00:00.000Z',
        updatedAt: '2026-02-05T14:00:00.000Z',
      },
      {
        _id: '66b200000000000000000003',
        title: 'Veloce Chrono-T Titanium Watch',
        slug: 'veloce-chrono-t-titanium-watch',
        description:
          'Grade-5 brushed titanium case housing an automatic column-wheel chronograph calibre, double-domed anti-reflective sapphire crystal, and vegetable-tanned bridle leather strap.',
        price: 460.0,
        originalPrice: 520.0,
        category: 'Watches',
        images: ['/src/assets/images/product_titanium_chronograph_1790879100478.jpg'],
        stock: 6,
        rating: 5.0,
        numReviews: 5,
        specs: {
          Case: 'Grade-5 Brushed Titanium (39mm)',
          Movement: 'Swiss Mechanical Automatic',
          Glass: 'AR-Coated Sapphire',
          WaterResistance: '100m / 10 ATM',
        },
        badge: 'Collector Edition',
        isFeatured: true,
        createdAt: '2026-02-10T10:00:00.000Z',
        updatedAt: '2026-02-10T10:00:00.000Z',
      },
      {
        _id: '66b200000000000000000004',
        title: 'Veloce Studio Reference Sound Stage',
        slug: 'veloce-studio-reference-sound-stage',
        description:
          'Compact bi-amplified active studio acoustic monitor with ribbon tweeters and rear boundary equalizer tuning for transparent spatial depth.',
        price: 640.0,
        originalPrice: 699.0,
        category: 'Audio',
        images: ['/src/assets/images/hero_luxury_audio_1790879068988.jpg'],
        stock: 4,
        rating: 4.7,
        numReviews: 3,
        specs: {
          Amplifier: 'Class-D 120W Bi-Amp',
          Frequency: '38Hz - 28kHz',
          Inputs: 'XLR Balanced / Optical / USB-C',
          Dimensions: '280 x 180 x 210 mm',
        },
        isFeatured: true,
        createdAt: '2026-02-15T09:00:00.000Z',
        updatedAt: '2026-02-15T09:00:00.000Z',
      },
      {
        _id: '66b200000000000000000005',
        title: 'Veloce Tuscan Full-Grain Desk Blotter',
        slug: 'veloce-tuscan-full-grain-desk-blotter',
        description:
          'Hand-finished Italian vegetable-tanned leather desk mat with burnished waxed edges, non-slip natural suede backing, and integrated brass pen groove.',
        price: 85.0,
        category: 'Accessories',
        images: ['/src/assets/images/product_mechanical_keyboard_1790879089678.jpg'],
        stock: 22,
        rating: 4.9,
        numReviews: 4,
        specs: {
          Material: 'Italian Full-Grain Leather',
          Backing: 'Natural Micro-Suede',
          Dimensions: '900 x 400 x 3.5 mm',
          Finish: 'Natural Waxed Edge',
        },
        isFeatured: false,
        createdAt: '2026-02-18T16:00:00.000Z',
        updatedAt: '2026-02-18T16:00:00.000Z',
      },
      {
        _id: '66b200000000000000000006',
        title: 'Veloce Precision Billet Rotary Dial',
        slug: 'veloce-precision-billet-rotary-dial',
        description:
          'Heavy solid brass rotary controller with stepped magnetic haptic feedback and programmable USB-C macro assignments. Currently sold out.',
        price: 110.0,
        category: 'Hardware',
        images: ['/src/assets/images/product_matte_headphones_1790879078207.jpg'],
        stock: 0, // Explicitly out of stock to test stock constraint
        rating: 4.6,
        numReviews: 2,
        specs: {
          Body: 'Solid Brass 240g',
          Encoder: 'Magnetic Hall-Effect',
          Detents: '24 Steps per Revolution',
          Cable: 'Braided Paracord USB-C',
        },
        badge: 'Sold Out',
        isFeatured: false,
        createdAt: '2026-02-20T11:00:00.000Z',
        updatedAt: '2026-02-20T11:00:00.000Z',
      },
    ];

    const coupons: Coupon[] = [
      {
        _id: '66c300000000000000000001',
        code: 'WELCOME15',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 100,
        expiresAt: '2027-12-31T23:59:59.000Z',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: '66c300000000000000000002',
        code: 'FLAT50',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 300,
        expiresAt: '2027-12-31T23:59:59.000Z',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: '66c300000000000000000003',
        code: 'EXPIRED10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 50,
        expiresAt: '2025-01-01T00:00:00.000Z',
        isActive: false,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    // Seed past delivered order for Alex Morgan to allow verified purchase review testing
    const deliveredOrder: Order = {
      _id: '66d400000000000000000001',
      orderNumber: 'VEL-2026-1042',
      userId: customerUser._id,
      userEmail: customerUser.email,
      items: [
        {
          productId: products[0]._id, // H1 Headphones
          title: products[0].title,
          price: 349.0,
          quantity: 1,
          image: products[0].images[0],
        },
      ],
      shippingAddress: {
        fullName: 'Alex Morgan',
        address: '742 Evergreen Terrace',
        city: 'Seattle',
        postalCode: '98101',
        country: 'United States',
        phone: '+1 206 555 0192',
      },
      paymentMethod: 'card',
      paymentStatus: 'paid',
      paymentDetails: {
        brand: 'Visa',
        last4: '4242',
        status: 'paid',
        transactionId: 'txn_mock_88192019',
      },
      subtotal: 349.0,
      discount: 0,
      tax: 27.92,
      deliveryFee: 0,
      total: 376.92,
      orderStatus: 'delivered',
      idempotencyKey: 'idemp_seed_delivered_01',
      createdAt: '2026-02-10T14:30:00.000Z',
      updatedAt: '2026-02-14T10:00:00.000Z',
    };

    const initialReviews: Review[] = [
      {
        _id: '66e500000000000000000001',
        productId: products[0]._id,
        userId: customerUser._id,
        userName: 'Alex Morgan',
        rating: 5,
        title: 'Exceptional noise floor and acoustic transparency',
        comment:
          'Having auditioned dozens of planar and dynamic closed-back sets, the H1 is remarkably balanced. Low-end extension is tight without boominess, and the aluminum joints exhibit zero creaking.',
        verifiedPurchase: true,
        createdAt: '2026-02-15T18:20:00.000Z',
      },
      {
        _id: '66e500000000000000000002',
        productId: products[1]._id,
        userId: '66a100000000000000000099',
        userName: 'David Chen',
        rating: 5,
        title: 'Outstanding gasket dampening',
        comment:
          'The acoustic foam sandwich and factory-lubed switches provide a deep, marbly thock right out of the box with zero metallic pinging.',
        verifiedPurchase: true,
        createdAt: '2026-02-12T11:05:00.000Z',
      },
    ];

    this.data.users = [customerUser, adminUser];
    this.data.products = products;
    this.data.coupons = coupons;
    this.data.orders = [deliveredOrder];
    this.data.reviews = initialReviews;
  }

  // --- Users Operations ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u._id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      _id: generateObjectId(),
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return user;
  }

  // --- Products Operations ---
  public getProducts(filter?: {
    category?: string;
    search?: string;
    featured?: boolean;
    sort?: string;
  }): Product[] {
    let result = [...this.data.products];

    if (filter?.category && filter.category !== 'all') {
      result = result.filter(
        (p) => p.category.toLowerCase() === filter.category!.toLowerCase()
      );
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (filter?.featured !== undefined) {
      result = result.filter((p) => p.isFeatured === filter.featured);
    }

    if (filter?.sort) {
      switch (filter.sort) {
        case 'price-asc':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          result.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
        default:
          result.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
      }
    }

    return result;
  }

  public findProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p._id === id);
  }

  public createProduct(
    productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt' | 'rating' | 'numReviews'>
  ): Product {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      _id: generateObjectId(),
      rating: 0,
      numReviews: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.data.products.push(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const product = this.findProductById(id);
    if (!product) return undefined;
    Object.assign(product, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return product;
  }

  public deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex((p) => p._id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Orders Operations ---
  public getOrders(userId?: string): Order[] {
    if (userId) {
      return this.data.orders.filter((o) => o.userId === userId);
    }
    return [...this.data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public findOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o._id === id);
  }

  public findOrderByIdempotencyKey(key: string, userId: string): Order | undefined {
    return this.data.orders.find(
      (o) => o.idempotencyKey === key && o.userId === userId
    );
  }

  public createOrder(orderData: Omit<Order, '_id' | 'createdAt' | 'updatedAt'>): Order {
    const now = new Date().toISOString();
    const newOrder: Order = {
      ...orderData,
      _id: generateObjectId(),
      createdAt: now,
      updatedAt: now,
    };
    this.data.orders.push(newOrder);
    this.persist();
    return newOrder;
  }

  public updateOrderStatus(
    orderId: string,
    status: Order['orderStatus']
  ): Order | undefined {
    const order = this.findOrderById(orderId);
    if (!order) return undefined;
    order.orderStatus = status;
    order.updatedAt = new Date().toISOString();
    this.persist();
    return order;
  }

  // --- Coupons Operations ---
  public getCoupons(): Coupon[] {
    return [...this.data.coupons];
  }

  public findCouponByCode(code: string): Coupon | undefined {
    return this.data.coupons.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase()
    );
  }

  public createCoupon(
    couponData: Omit<Coupon, '_id' | 'createdAt'>
  ): Coupon {
    const newCoupon: Coupon = {
      ...couponData,
      code: couponData.code.trim().toUpperCase(),
      _id: generateObjectId(),
      createdAt: new Date().toISOString(),
    };
    this.data.coupons.push(newCoupon);
    this.persist();
    return newCoupon;
  }

  public deleteCoupon(id: string): boolean {
    const idx = this.data.coupons.findIndex((c) => c._id === id);
    if (idx === -1) return false;
    this.data.coupons.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Reviews Operations ---
  public getReviewsForProduct(productId: string): Review[] {
    return this.data.reviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public userHasDeliveredPurchase(userId: string, productId: string): boolean {
    return this.data.orders.some(
      (order) =>
        order.userId === userId &&
        order.orderStatus === 'delivered' &&
        order.items.some((item) => item.productId === productId)
    );
  }

  public hasUserReviewedProduct(userId: string, productId: string): boolean {
    return this.data.reviews.some(
      (r) => r.userId === userId && r.productId === productId
    );
  }

  public createReview(
    reviewData: Omit<Review, '_id' | 'createdAt'>
  ): Review {
    const newReview: Review = {
      ...reviewData,
      _id: generateObjectId(),
      createdAt: new Date().toISOString(),
    };
    this.data.reviews.push(newReview);

    // Recalculate product rating & numReviews
    const allForProduct = this.getReviewsForProduct(reviewData.productId);
    const avg =
      allForProduct.reduce((acc, r) => acc + r.rating, 0) / allForProduct.length;
    this.updateProduct(reviewData.productId, {
      rating: parseFloat(avg.toFixed(1)),
      numReviews: allForProduct.length,
    });

    this.persist();
    return newReview;
  }

  // Categories helper
  public getCategories() {
    const categoriesMap: Record<string, number> = {};
    for (const p of this.data.products) {
      categoriesMap[p.category] = (categoriesMap[p.category] || 0) + 1;
    }
    return Object.keys(categoriesMap).map((cat) => ({
      id: cat.toLowerCase(),
      name: cat,
      itemCount: categoriesMap[cat],
      description: `Premium curated ${cat.toLowerCase()} collection.`,
    }));
  }
}

export const db = new DatabaseEngine();
