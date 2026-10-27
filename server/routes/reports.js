const express = require('express');
const router = express.Router();
const {
  getApplicationsReport,
  getSeatsReport,
  getRevenueReport,
} = require('../controllers/reportController');
const { auth, isAdmin } = require('../middleware/auth');

// All routes require auth + admin
router.use(auth, isAdmin);

router.get('/applications', getApplicationsReport);
router.get('/seats', getSeatsReport);
router.get('/revenue', getRevenueReport);

module.exports = router;
