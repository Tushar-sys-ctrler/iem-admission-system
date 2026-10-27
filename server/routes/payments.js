const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  processPayment,
  getPaymentHistory,
  getReceipt,
  processSemesterFee,
} = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// All routes are protected
router.use(auth);

router.post('/initiate', initiatePayment);
router.post('/process', processPayment);
router.get('/history', getPaymentHistory);
router.get('/receipt/:id', getReceipt);
router.post('/semester-fee', processSemesterFee);

module.exports = router;
