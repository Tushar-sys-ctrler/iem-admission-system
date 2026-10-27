const Application = require('../models/Application');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    // Total applications count
    const totalApplications = await Application.countDocuments();

    // Count by status
    const statusCounts = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus = {};
    statusCounts.forEach((s) => {
      byStatus[s._id] = s.count;
    });

    // Seats filled per course
    const courses = await Course.find({ isActive: true }).select(
      'name code totalSeats filledSeats'
    );
    const seatsByCoourse = courses.map((c) => ({
      name: c.name,
      code: c.code,
      totalSeats: c.totalSeats,
      filledSeats: c.filledSeats,
      availableSeats: c.totalSeats - c.filledSeats,
    }));

    // Total revenue
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'success', type: { $ne: 'refund' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Withdrawal count
    const withdrawals = await Application.countDocuments({ status: 'Withdrawn' });

    // Total users
    const totalUsers = await User.countDocuments({ role: 'applicant' });

    res.json({
      success: true,
      data: {
        totalApplications,
        totalUsers,
        byStatus,
        seatsByCoourse,
        totalRevenue,
        withdrawals,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get all applications with filtering, search, and pagination
 * @route   GET /api/admin/applications
 */
const getAllApplications = async (req, res) => {
  try {
    const {
      status,
      course,
      dateFrom,
      dateTo,
      eligibility,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (course) {
      filter['coursePreferences.course'] = course;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (eligibility === 'eligible') {
      filter.eligibilityFlag = { $in: [null, '', undefined] };
    } else if (eligibility === 'not_eligible') {
      filter.eligibilityFlag = { $exists: true, $ne: '', $ne: null };
    }

    // Build aggregation for search by name or applicationId
    let applications;
    let total;

    if (search) {
      // Search by applicationId or by applicant name
      const nameRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({ name: nameRegex }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { applicationId: new RegExp(search, 'i') },
        { applicant: { $in: userIds } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    total = await Application.countDocuments(filter);

    applications = await Application.find(filter)
      .populate('applicant', 'name email mobile')
      .populate('coursePreferences.course', 'name code')
      .populate('allottedCourse', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get full application detail with documents
 * @route   GET /api/admin/applications/:id
 */
const getApplicationDetail = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('applicant', 'name email mobile role isVerified')
      .populate('coursePreferences.course')
      .populate('allottedCourse');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Get associated payments
    const payments = await Payment.find({ application: application._id }).sort({
      transactionDate: -1,
    });

    res.json({
      success: true,
      data: { application, payments },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Verify or reject a specific document
 * @route   PUT /api/admin/applications/:id/verify-document
 */
const verifyDocument = async (req, res) => {
  try {
    const { docType, status, rejectionReason } = req.body;

    const validDocTypes = ['tenthMarkSheet', 'twelfthMarkSheet', 'idProof', 'photo', 'signature'];
    if (!validDocTypes.includes(docType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid document type. Must be one of: ${validDocTypes.join(', ')}`,
      });
    }

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "Verified" or "Rejected".',
      });
    }

    if (status === 'Rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is mandatory when rejecting a document.',
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!application.documents || !application.documents[docType]) {
      return res.status(400).json({
        success: false,
        message: `Document "${docType}" has not been uploaded yet.`,
      });
    }

    application.documents[docType].status = status;
    application.documents[docType].rejectionReason =
      status === 'Rejected' ? rejectionReason : '';

    await application.save();

    // Notify applicant
    await Notification.create({
      user: application.applicant,
      type: 'in_app',
      subject: `Document ${status}`,
      message: `Your ${docType} has been ${status.toLowerCase()}.${
        status === 'Rejected' ? ` Reason: ${rejectionReason}` : ''
      }`,
    });

    res.json({
      success: true,
      message: `Document ${docType} marked as ${status}.`,
      data: application.documents[docType],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Update application status
 * @route   PUT /api/admin/applications/:id/status
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'Under Review',
      'Shortlisted',
      'Rejected',
      'Not Eligible',
      'Admitted',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    application.status = status;
    await application.save();

    // Notify applicant
    await Notification.create({
      user: application.applicant,
      type: 'in_app',
      subject: 'Application Status Update',
      message: `Your application ${application.applicationId || ''} status has been updated to "${status}".`,
    });

    res.json({
      success: true,
      message: `Application status updated to "${status}".`,
      data: { applicationId: application.applicationId, status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Shortlist applicant and allot seat for highest eligible preference
 * @route   POST /api/admin/applications/:id/shortlist
 */
const shortlistApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      'coursePreferences.course'
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (!['Submitted', 'Under Review'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot shortlist application with status "${application.status}".`,
      });
    }

    // Find the highest-priority eligible course with available seats
    const sortedPrefs = [...application.coursePreferences].sort(
      (a, b) => a.priority - b.priority
    );

    let allottedCourse = null;
    for (const pref of sortedPrefs) {
      if (pref.isEligible && pref.course) {
        const course = await Course.findById(pref.course._id || pref.course);
        if (course && course.isActive && course.filledSeats < course.totalSeats) {
          allottedCourse = course;
          break;
        }
      }
    }

    if (!allottedCourse) {
      return res.status(400).json({
        success: false,
        message:
          'No eligible course with available seats found for this applicant.',
      });
    }

    application.status = 'Shortlisted';
    application.allottedCourse = allottedCourse._id;
    application.allotmentRound = req.body.round || 1;
    application.enrollmentDeadline = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ); // 7 days from now

    await application.save();

    // Notify applicant
    await Notification.create({
      user: application.applicant,
      type: 'in_app',
      subject: 'Seat Allotted - Congratulations!',
      message: `You have been allotted a seat in ${allottedCourse.name} (${allottedCourse.code}). Please accept within 7 days and pay the enrollment fee.`,
    });

    res.json({
      success: true,
      message: `Application shortlisted. Seat allotted for ${allottedCourse.name}.`,
      data: {
        applicationId: application.applicationId,
        status: 'Shortlisted',
        allottedCourse: {
          name: allottedCourse.name,
          code: allottedCourse.code,
        },
        allotmentRound: application.allotmentRound,
        enrollmentDeadline: application.enrollmentDeadline,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get all notifications (admin view)
 * @route   GET /api/admin/notifications
 */
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Notification.countDocuments();
    const notifications = await Notification.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllApplications,
  getApplicationDetail,
  verifyDocument,
  updateApplicationStatus,
  shortlistApplication,
  getAllNotifications,
};
