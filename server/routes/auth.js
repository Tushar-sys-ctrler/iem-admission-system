const express = require('express');
const router = express.Router();
const { register, sendOTP, verifyOTP, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

// Protected routes
router.get('/profile', auth, getProfile);

module.exports = router;
