const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { auth, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourse);

// Admin-only routes
router.post('/', auth, isAdmin, createCourse);
router.put('/:id', auth, isAdmin, updateCourse);
router.delete('/:id', auth, isAdmin, deleteCourse);

module.exports = router;
