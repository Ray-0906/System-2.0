/**
 * Standardized error constants for consistent API responses.
 */
export const Errors = {
  UNAUTHORIZED: { status: 401, message: 'Unauthorized' },
  FORBIDDEN: { status: 403, message: 'Forbidden' },
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  VALIDATION: { status: 400, message: 'Validation failed' },
  CONFLICT: { status: 409, message: 'Resource conflict' },
  RATE_LIMIT: { status: 429, message: 'Too many requests' },
  SERVER_ERROR: { status: 500, message: 'Internal server error' },
};

/**
 * Send a standardized error response.
 * @param {Object} res - Express response object
 * @param {Object} error - Error from Errors constant
 * @param {string} [detail] - Optional override message
 */
export const sendError = (res, error, detail) => {
  return res.status(error.status).json({
    error: detail || error.message,
  });
};
