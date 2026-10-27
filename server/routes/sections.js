const express = require('express');
const router = express.Router();
const {
  generateSections,
  getSections,
  getSectionRoster,
} = require('../controllers/sectionController');
const { auth, isAdmin } = require('../middleware/auth');

// Protected for read
router.get('/', auth, getSections);
router.get('/:id/roster', auth, getSectionRoster);

// Admin-only for write
router.post('/generate', auth, isAdmin, generateSections);

module.exports = router;
