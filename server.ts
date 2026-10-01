import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import authRouter from './src/server/routes/auth.ts';
import productsRouter from './src/server/routes/products.ts';
import cartRouter from './src/server/routes/cart.ts';
import ordersRouter from './src/server/routes/orders.ts';
import adminRouter from './src/server/routes/admin.ts';
import paymentsRouter from './src/server/routes/payments.ts';
import uploadsRouter from './src/server/routes/uploads.ts';
import categoriesRouter from './src/server/routes/categories.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsing with strict size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logging in development
app.use((req, _res, next) => {
  const start = Date.now();
  next();
  if (process.env.NODE_ENV !== 'production' && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules')) {
    console.log(`${req.method} ${req.url} - ${Date.now() - start}ms`);
  }
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Veloce Commerce Core API',
  });
});

// Backend API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/categories', categoriesRouter);

// REQUIREMENT 20: Consistent JSON Error Handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]:', err);
  const status = err.status || err.statusCode || 500;
  const message =
    err.message || 'An unexpected internal server error occurred. Please try again.';

  res.status(status).json({
    success: false,
    message,
    errors: err.errors || undefined,
  });
});

// Vite Middleware for Full-Stack Development / Static Serving in Production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Veloce Commerce] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
