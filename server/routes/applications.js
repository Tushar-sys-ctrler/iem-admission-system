const express = require('express');
const router = express.Router();
const {
  createApplication,
  getMyApplication,
  updateApplication,
  saveDraft,
  submitApplication,
  uploadDocument,
  acceptSeat,
  withdrawAdmission,
} = require('../controllers/applicationController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(auth);

router.post('/', createApplication);
router.get('/my-application', getMyApplication);
router.put('/:id', updateApplication);
router.put('/:id/save-draft', saveDraft);
router.post('/:id/submit', submitApplication);

// Document upload with multer
router.post('/:id/upload/:docType', (req, res, next) => {
  const uploadMiddleware = upload('document');
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 2MB limit.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error.',
      });
    }
    next();
  });
}, uploadDocument);

router.post('/:id/accept-seat', acceptSeat);
router.post('/:id/withdraw', withdrawAdmission);

module.exports = router;
