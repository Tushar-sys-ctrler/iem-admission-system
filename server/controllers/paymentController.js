const Payment = require('../models/Payment');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { sendPaymentReceiptEmail } = require('../utils/mailer');

/**
 * @desc    Initiate a new payment (creates a pending record)
 * @route   POST /api/payments/initiate
 */
const initiatePayment = async (req, res) => {
  try {
    const { applicationId, type, amount, method, semester } = req.body;

    if (!type || amount == null) {
      return res.status(400).json({
        success: false,
        message: 'Payment type and amount are required.',
      });
    }

    const paymentData = {
      user: req.user._id,
      type,
      amount,
      method: method || 'UPI',
      status: 'pending',
    };

    if (applicationId) {
      paymentData.application = applicationId;
    }

    if (semester != null) {
      paymentData.semester = semester;
    }

    const payment = await Payment.create(paymentData);

    res.status(201).json({
      success: true,
      message: 'Payment initiated. Proceed to process.',
      data: payment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Simulate payment processing (success/failure)
 * @route   POST /api/payments/process
 */
const processPayment = async (req, res) => {
  try {
    const { paymentId, simulateSuccess } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID is required.' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payment already processed with status: ${payment.status}`,
      });
    }

    // Default to success if not specified
    const isSuccess = simulateSuccess !== false;

    if (isSuccess) {
      // Generate receipt number: RCPT-2026-XXXX
      const randomNum = String(Math.floor(1000 + Math.random() * 9000));
      payment.receiptNumber = `RCPT-2026-${randomNum}`;
      payment.status = 'success';
      payment.transactionDate = new Date();
      await payment.save();

      // Create notification with receipt details
      await Notification.create({
        user: req.user._id,
        type: 'in_app',
        subject: 'Payment Successful',
        message: `Your ${payment.type.replace(/_/g, ' ')} of ₹${payment.amount} was successful. Receipt: ${payment.receiptNumber}`,
      });

      // Dual-Delivery: trigger non-blocking real receipt email if Gmail SMTP configured
      try {
        const appRef = await Application.findById(payment.application);
        sendPaymentReceiptEmail({
          to: req.user.email,
          name: req.user.name,
          applicationId: appRef ? appRef.applicationId : 'IEM-2026',
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          feeType: payment.type,
          paymentMethod: payment.method,
          transactionDate: payment.transactionDate,
        }).catch((err) => console.warn('[Mailer] Payment email background notice:', err.message));
      } catch (emailErr) {
        // Non-blocking
      }

      res.json({
        success: true,
        message: 'Payment processed successfully.',
        data: {
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          type: payment.type,
          status: 'success',
          transactionDate: payment.transactionDate,
        },
      });
    } else {
      payment.status = 'failed';
      payment.transactionDate = new Date();
      await payment.save();

      res.json({
        success: false,
        message: 'Payment failed.',
        data: { status: 'failed', type: payment.type, amount: payment.amount },
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get all payments for the current user
 * @route   GET /api/payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('application', 'applicationId status')
      .sort({ transactionDate: -1 });

    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get specific payment receipt details
 * @route   GET /api/payments/receipt/:id
 */
const getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email mobile')
      .populate('application', 'applicationId status');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    // Allow user to see their own receipt, or admin to see any
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Process semester fee payment for admitted students
 * @route   POST /api/payments/semester-fee
 */
const processSemesterFee = async (req, res) => {
  try {
    const { applicationId, semester, method } = req.body;

    if (!applicationId || semester == null) {
      return res.status(400).json({
        success: false,
        message: 'Application ID and semester number are required.',
      });
    }

    const application = await Application.findById(applicationId).populate('allottedCourse');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (application.status !== 'Admitted') {
      return res.status(400).json({
        success: false,
        message: 'Only admitted students can pay semester fees.',
      });
    }

    // Check for duplicate semester payment
    const existingPayment = await Payment.findOne({
      application: applicationId,
      type: 'semester_fee',
      semester,
      status: 'success',
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Semester ${semester} fee has already been paid.`,
      });
    }

    const course = application.allottedCourse;
    const semFee = course ? course.semesterFee : 75000;

    // Create and process payment
    const randomNum = String(Math.floor(1000 + Math.random() * 9000));
    const payment = await Payment.create({
      user: req.user._id,
      application: applicationId,
      type: 'semester_fee',
      amount: semFee,
      method: method || 'UPI',
      status: 'success',
      semester,
      receiptNumber: `RCPT-2026-${randomNum}`,
      transactionDate: new Date(),
    });

    // Notification
    await Notification.create({
      user: req.user._id,
      type: 'in_app',
      subject: 'Semester Fee Paid',
      message: `Semester ${semester} fee of ₹${semFee} paid successfully. Receipt: ${payment.receiptNumber}`,
    });

    // Dual-Delivery: trigger non-blocking real receipt email if Gmail SMTP configured
    sendPaymentReceiptEmail({
      to: req.user.email,
      name: req.user.name,
      applicationId: application.applicationId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      feeType: `Semester ${semester} Fee`,
      paymentMethod: payment.method,
      transactionDate: payment.transactionDate,
    }).catch((err) => console.warn('[Mailer] Semester fee email background notice:', err.message));

    res.json({
      success: true,
      message: `Semester ${semester} fee paid successfully.`,
      data: payment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = {
  initiatePayment,
  processPayment,
  getPaymentHistory,
  getReceipt,
  processSemesterFee,
};
