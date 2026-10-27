const Section = require('../models/Section');
const Application = require('../models/Application');
const Course = require('../models/Course');

/**
 * @desc    Generate sections for a given course from admitted students
 * @route   POST /api/sections/generate
 */
const generateSections = async (req, res) => {
  try {
    const { courseId, maxStrength } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    // Get all admitted students for this course
    const admittedApps = await Application.find({
      allottedCourse: courseId,
      status: 'Admitted',
    }).sort({ createdAt: 1 });

    if (admittedApps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No admitted students found for this course.',
      });
    }

    // Delete existing sections for this course to regenerate
    await Section.deleteMany({ course: courseId });

    const sectionSize = maxStrength || 60;
    const totalSections = Math.ceil(admittedApps.length / sectionSize);
    const createdSections = [];

    for (let i = 0; i < totalSections; i++) {
      const sectionLetter = String.fromCharCode(65 + i); // A, B, C...
      const sectionName = `${course.code}-Sec-${sectionLetter}`;
      const start = i * sectionSize;
      const end = Math.min(start + sectionSize, admittedApps.length);
      const sectionStudents = admittedApps.slice(start, end);

      // Assign roll numbers: IEM2026CSE001 format
      for (let j = 0; j < sectionStudents.length; j++) {
        const rollSeq = String(start + j + 1).padStart(3, '0');
        const rollNumber = `IEM2026${course.code}${rollSeq}`;
        sectionStudents[j].rollNumber = rollNumber;
        sectionStudents[j].allottedSection = sectionName;
        await sectionStudents[j].save();
      }

      const section = await Section.create({
        course: courseId,
        sectionName,
        students: sectionStudents.map((s) => s._id),
        maxStrength: sectionSize,
      });

      createdSections.push(section);
    }

    res.status(201).json({
      success: true,
      message: `${createdSections.length} section(s) created for ${course.name}.`,
      data: {
        course: { name: course.name, code: course.code },
        totalStudents: admittedApps.length,
        sections: createdSections.map((s) => ({
          sectionName: s.sectionName,
          studentCount: s.students.length,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get all sections, optionally filtered by course
 * @route   GET /api/sections
 */
const getSections = async (req, res) => {
  try {
    const filter = {};
    if (req.query.course) {
      filter.course = req.query.course;
    }

    const sections = await Section.find(filter)
      .populate('course', 'name code')
      .select('sectionName course maxStrength students createdAt')
      .sort({ sectionName: 1 });

    // Add student count without fetching all student data
    const result = sections.map((s) => ({
      _id: s._id,
      sectionName: s.sectionName,
      course: s.course,
      maxStrength: s.maxStrength,
      studentCount: s.students.length,
      createdAt: s.createdAt,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get detailed roster for a specific section
 * @route   GET /api/sections/:id/roster
 */
const getSectionRoster = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('course', 'name code')
      .populate({
        path: 'students',
        populate: {
          path: 'applicant',
          select: 'name email mobile',
        },
        select: 'applicationId rollNumber allottedSection personalDetails applicant',
      });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    res.json({ success: true, data: section });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { generateSections, getSections, getSectionRoster };
