import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Render runs behind a proxy. Trust the expected proxy hop.
app.set('trust proxy', 1);

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

const allowedOrigins = CLIENT_URL
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// 1. Security headers
app.use(helmet());

// 2. CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g. curl).
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/+$/, '');

      if (
        allowedOrigins.includes(normalizedOrigin) ||
        process.env.NODE_ENV === 'development'
      ) {
        return callback(null, true);
      }

      console.error('[CORS] Rejected origin:', JSON.stringify(origin));
      console.error('[CORS] Allowed origins:', allowedOrigins);

      return callback(
        new Error(
          `CORS policy does not allow access from origin ${origin}`
        )
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ]
  })
);

// 3. Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 4. Rate limiting for API endpoints
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', apiLimiter);
}

// 5. API routes
app.use('/api', apiRoutes);

// 6. 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// 7. Central error handler
app.use(errorHandler);

export default app;