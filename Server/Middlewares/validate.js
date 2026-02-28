/**
 * Zod validation middleware.
 * Validates req.body against a Zod schema, returning 400 with detailed errors if invalid.
 */
import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    next(err);
  }
};
