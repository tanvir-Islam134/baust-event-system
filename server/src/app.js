import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, AppError } from './middlewares/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS with configured client origin
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError('Blocked by CORS policy', 403));
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

