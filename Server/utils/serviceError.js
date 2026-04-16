/**
 * ServiceError — structured error for business logic failures.
 * Throw from services, catch in controllers via handleServiceError.
 */
export class ServiceError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status (400, 403, 404, 409, etc.)
   * @param {object} [details] - Optional extra data for the client
   */
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Translate ServiceError → HTTP response.
 * Call in every controller catch block.
 */
export const handleServiceError = (res, err) => {
  if (err instanceof ServiceError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }
  // Unexpected error — log and return 500
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
};
