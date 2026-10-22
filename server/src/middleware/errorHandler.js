export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Postgres / Supabase specific codes
  if (err.code === '23505') {
    // Unique violation
    message = 'A record with these unique details already exists.';
  } else if (err.code === '23503') {
    // Foreign key violation
    message = 'Referenced resource was not found.';
  } else if (err.code === '22P02') {
    // Invalid UUID format or data type
    message = 'Invalid identifier format.';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error(`[Error 500] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
