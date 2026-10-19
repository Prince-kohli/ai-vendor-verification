const { sendError } = require('../utils/responseHelper');

const errorHandler = (err, req, res, next) => {
  console.error('🔥 [Global Error Handler]:', err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return sendError(res, 'Validation Error', 400, errors);
  }

  // Mongoose Duplicate Key Error
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue);
    return sendError(res, `Duplicate field value entered for: ${field}`, 400);
  }

  // Cast Error (Invalid MongoDB ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, `Resource not found with ID: ${err.value}`, 404);
  }

  return sendError(res, err.message || 'Internal Server Error', err.statusCode || 500);
};

module.exports = errorHandler;