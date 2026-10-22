import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // Limit mutating requests (creates/updates)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many mutation attempts, please slow down.'
  }
});
