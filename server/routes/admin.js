const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllApplications,
  getApplicationDetail,
  verifyDocument,
  updateApplicationStatus,
  shortlistApplication,
  getAllNotifications,
} = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require auth + admin
router.use(auth, isAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/applications', getAllApplications);
router.get('/applications/:id', getApplicationDetail);
router.put('/applications/:id/verify-document', verifyDocument);
router.put('/applications/:id/status', updateApplicationStatus);
router.post('/applications/:id/shortlist', shortlistApplication);
router.get('/notifications', getAllNotifications);

module.exports = router;
