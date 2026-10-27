const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/mailer');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !mobile || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide name, email, mobile, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User with this email already exists.' });
    }

    // Generate a 6-digit OTP upon registration
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password, // hashed by pre-save hook
      role: role || 'applicant',
      otp,
      otpExpiry,
      isVerified: false,
    });

    console.log(`\n📧 [Simulated Email / SMS Gateway]`);
    console.log(`To: ${user.email} (${user.mobile})`);
    console.log(`Subject: Your IEM Admission Verification Code`);
    console.log(`OTP: ${otp} (Universal Master OTP: 123456)\n`);

    // Dual-Delivery: attempt real Gmail SMTP if configured
    const emailResult = await sendOTPEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    res.status(201).json({
      success: true,
      message: emailResult.success
        ? 'User registered successfully. Real OTP email dispatched to your inbox!'
        : 'User registered successfully. Simulated OTP generated.',
      otp,
      emailDispatched: Boolean(emailResult.success),
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isVerified: user.isVerified,
        otp,
        emailDispatched: Boolean(emailResult.success),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Send OTP to user (demo: returns OTP in response)
 * @route   POST /api/auth/send-otp
 */
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Generate a 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    console.log(`\n📧 [Simulated Email / SMS Gateway]`);
    console.log(`To: ${user.email} (${user.mobile})`);
    console.log(`Subject: Your IEM Admission Verification Code`);
    console.log(`OTP: ${otp} (Universal Master OTP: 123456)\n`);

    // Dual-Delivery: attempt real Gmail SMTP if configured
    const emailResult = await sendOTPEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    res.json({
      success: true,
      message: emailResult.success
        ? 'Real OTP email dispatched to your inbox!'
        : 'OTP generated successfully (simulated mode).',
      otp,
      emailDispatched: Boolean(emailResult.success),
      data: { otp, emailDispatched: Boolean(emailResult.success) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Accept 123456 as universal master OTP for demo/testing
    const MASTER_OTP = '123456';
    const isValidOtp =
      otp === MASTER_OTP ||
      (user.otp === otp && user.otpExpiry && user.otpExpiry > new Date());

    if (!isValidOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Account verified successfully.',
      data: { isVerified: true },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'iem_admission_secret_key_2026_devsphere',
      { expiresIn: '7d' }
    );

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      isVerified: user.isVerified,
    };

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userData,
      data: {
        token,
        user: userData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get current user's profile
 * @route   GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { register, sendOTP, verifyOTP, login, getProfile };
