import { ZodError } from 'zod';

/**
 * Middleware factory for validating incoming request (body, query, params) against a Zod schema.
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (validatedData.body !== undefined) req.body = validatedData.body;
    if (validatedData.query !== undefined) req.query = validatedData.query;
    if (validatedData.params !== undefined) req.params = validatedData.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((e) => ({
        field: e.path.join('.').replace(/^(body|query|params)\./, ''),
        message: e.message
      }));

      const errorMessage = formattedErrors.map((e) => `${e.field}: ${e.message}`).join(', ');

      return res.status(400).json({
        success: false,
        error: `Validation error: ${errorMessage}`,
        details: formattedErrors
      });
    }
    next(error);
  }
};
