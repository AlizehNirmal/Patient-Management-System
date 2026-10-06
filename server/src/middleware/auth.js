const jwt = require('jsonwebtoken');
const HttpError = require('../utils/httpError');

// Reads the token from the Authorization header and sets req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again');
  }
  next();
}

// Use after authenticate: requireRole('DOCTOR') or requireRole('PATIENT', 'DOCTOR')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'You are not allowed to do this');
    next();
  };
}

module.exports = { authenticate, requireRole };
