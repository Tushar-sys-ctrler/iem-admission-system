const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT verification middleware.
 * Extracts user from Bearer token and adds to req.user.
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ success: false, message: 'No token provided. Authorization denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iem_admission_secret_key_2026_devsphere');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Token is invalid. User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ success: false, message: 'Token has expired. Please log in again.' });
    }
    return res
      .status(401)
      .json({ success: false, message: 'Token is invalid. Authorization denied.' });
  }
};

/**
 * Admin role check middleware.
 * Must be used after the auth middleware.
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { auth, isAdmin };
