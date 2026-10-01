# Veloce Commerce — Full-Stack E-Commerce Engine

Production-grade full-stack e-commerce application built with TypeScript, Node.js, Express, React, and Tailwind CSS.

---

## 1. Architectural Overview

- **Single-Port Full-Stack Service**: Express HTTP server running on port `3000` with Vite middlewares in development and static bundle serving in production.
- **Authoritative Server Pricing**: The frontend never calculates authoritative prices or order totals; prices, coupon discounts, delivery fees, and taxes are strictly verified from the database at checkout.
- **Atomic Stock Management**: Inventory counts are verified and deducted atomically on order placement; out-of-stock items cannot be ordered.
- **Idempotency Protection**: Duplicate order submissions are safely intercepted using cryptographic client idempotency keys.
- **Verified-Purchase Reviews**: Review submissions require a completed, delivered purchase order by the authenticated user; reviews cannot be forged.
- **PCI-DSS Compliant Payment Flow**: Card CVV and raw PAN numbers are never stored in database records or server logs; only tokenized references and masked last-4 digits are preserved.
- **Zero Secrets Exposure**: Payment secret keys (`STRIPE_SECRET_KEY`) and media storage secrets (`CLOUDINARY_API_SECRET`) reside exclusively in server memory; clients interact via signed parameters and ephemeral client tokens.
- **Role-Based Access Control (RBAC)**: Strict separation between `customer` and `admin` roles. Customer data is isolated, and administrative endpoints enforce authorization.

---

## 2. API Route Specifications

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a customer account with bcrypt salted hash (min 8 chars password).
- `POST /api/auth/login` — Authenticate credentials and issue signed JWT.
- `GET /api/auth/me` — Retrieve authenticated user profile.
- `PUT /api/auth/profile` — Update user profile.
- `POST /api/auth/logout` — End user session.

### Products & Reviews (`/api/products`)
- `GET /api/products` — Retrieve products with category, search query, and sorting parameters.
- `GET /api/products/:id` — Retrieve product details with customer reviews.
- `GET /api/products/:id/reviews` — Retrieve customer reviews for a product.
- `POST /api/products/:id/reviews` — Submit a review. Strictly enforces delivered-purchase verification.

### Cart & Pricing (`/api/cart`)
- `POST /api/cart/validate` — Authoritative price calculation, stock validation, and coupon evaluation.

### Orders (`/api/orders`)
- `POST /api/orders` — Create order with authoritative server recalculation, idempotency check, and stock deduction.
- `GET /api/orders/my-orders` — Retrieve private order history for authenticated user.
- `GET /api/orders/:id` — Retrieve specific order (isolated to owner or administrator).

### Admin Portal (`/api/admin`)
- `GET /api/admin/stats` — Revenue, order counts, product metrics, and low-stock alerts.
- `GET /api/admin/products` — Product catalog management.
- `POST /api/admin/products` — Create new SKU.
- `PUT /api/admin/products/:id` — Update existing SKU and inventory.
- `DELETE /api/admin/products/:id` — Remove SKU.
- `GET /api/admin/orders` — View orders across all customers.
- `PUT /api/admin/orders/:id/status` — Advance order status (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).
- `GET /api/admin/coupons` — View discount coupons.
- `POST /api/admin/coupons` — Create discount coupon.
- `DELETE /api/admin/coupons/:id` — Delete discount coupon.

### Payments & Uploads
- `POST /api/payments/create-intent` — Generate ephemeral payment intent token without exposing private keys.
- `POST /api/payments/confirm` — Validate payment transaction.
- `POST /api/uploads/sign` — Generate Cloudinary SHA-1 signed payload server-side without leaking `CLOUDINARY_API_SECRET`.
- `GET /api/categories` — Product category listing.
- `POST /api/categories/validate-coupon` — Pre-validate discount coupons.

---

## 3. Seed Accounts for Testing

| Role | Email | Password | Pre-configured Data |
| :--- | :--- | :--- | :--- |
| **Customer** | `alex@example.com` | `password123` | Past delivered order `VEL-2026-1042` with H1 Headphones (eligible for verified review) |
| **Admin** | `admin@veloce.com` | `admin123` | Full access to Admin Portal, SKU inventory, coupon creation, and order status updates |

---

## 4. Setup & Running Instructions

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
