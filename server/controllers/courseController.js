const Course = require('../models/Course');

/**
 * @desc    Get all active courses
 * @route   GET /api/courses
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get single course by ID
 * @route   GET /api/courses/:id
 */
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Create a new course (Admin only)
 * @route   POST /api/courses
 */
const createCourse = async (req, res) => {
  try {
    const { name, code, minCutoff, totalSeats, applicationFee, enrollmentFee, semesterFee } = req.body;

    if (!name || !code || minCutoff == null || totalSeats == null) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, minCutoff, and totalSeats are required.',
      });
    }

    const existingCourse = await Course.findOne({
      $or: [{ name }, { code: code.toUpperCase() }],
    });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'A course with this name or code already exists.',
      });
    }

    const course = await Course.create({
      name,
      code: code.toUpperCase(),
      minCutoff,
      totalSeats,
      applicationFee: applicationFee || 1500,
      enrollmentFee: enrollmentFee || 50000,
      semesterFee: semesterFee || 75000,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: course,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Update course details (Admin only)
 * @route   PUT /api/courses/:id
 */
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const allowedFields = [
      'name', 'code', 'minCutoff', 'totalSeats', 'applicationFee',
      'enrollmentFee', 'semesterFee', 'isActive',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    }

    await course.save();
    res.json({ success: true, message: 'Course updated successfully.', data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Deactivate course (Admin only)
 * @route   DELETE /api/courses/:id
 */
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    course.isActive = false;
    await course.save();

    res.json({ success: true, message: 'Course deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getAllCourses, getCourse, createCourse, updateCourse, deleteCourse };
