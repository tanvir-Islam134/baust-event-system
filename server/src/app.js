import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, AppError } from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS with configured client origins and local development hosts
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim());

const staticAllowedOrigins = [
  ...configuredOrigins,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://192.168.0.186:5173',
  'http://192.168.0.186:5174',
];

const isOriginAllowed = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return true;

  if (staticAllowedOrigins.includes(origin)) return true;

  // In development, allow any localhost port or local network LAN IP (Wi-Fi testing)
  if (process.env.NODE_ENV !== 'production') {
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isLAN = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
    if (isLocalhost || isLAN) return true;
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(`Blocked by CORS policy: origin ${origin} is not allowed`, 403));
    },
    credentials: true,
  })
);

// Apply rate limiting to all requests under /api
app.use('/api', apiLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root health check convenience alias
app.get('/health', (req, res) => {
  res.redirect('/api/v1/health');
});

// Mount API routes
app.use('/api', apiRouter);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Not Found`, 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

