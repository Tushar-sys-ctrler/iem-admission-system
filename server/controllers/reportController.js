const Application = require('../models/Application');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Section = require('../models/Section');

/**
 * @desc    Get applications report filtered by course/date range
 * @route   GET /api/reports/applications
 */
const getApplicationsReport = async (req, res) => {
  try {
    const { course, dateFrom, dateTo, status } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (course) filter['coursePreferences.course'] = course;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const applications = await Application.find(filter)
      .populate('applicant', 'name email mobile')
      .populate('coursePreferences.course', 'name code')
      .populate('allottedCourse', 'name code')
      .sort({ createdAt: -1 });

    // Format data suitable for CSV/PDF export
    const reportData = applications.map((app) => ({
      applicationId: app.applicationId || 'N/A',
      applicantName: app.applicant ? app.applicant.name : 'N/A',
      email: app.applicant ? app.applicant.email : 'N/A',
      mobile: app.applicant ? app.applicant.mobile : 'N/A',
      status: app.status,
      category: app.personalDetails?.category || 'N/A',
      pcmPercentage: app.academicDetails?.pcmPercentage || 'N/A',
      entranceExam: app.academicDetails?.entranceExam || 'N/A',
      entranceRank: app.academicDetails?.entranceRank || 'N/A',
      preferences: app.coursePreferences
        .map((p) => (p.course ? `${p.course.code} (P${p.priority})` : 'N/A'))
        .join(', '),
      allottedCourse: app.allottedCourse ? app.allottedCourse.name : 'N/A',
      rollNumber: app.rollNumber || 'N/A',
      createdAt: app.createdAt,
    }));

    res.json({
      success: true,
      data: {
        totalRecords: reportData.length,
        report: reportData,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get seats report - filled vs capacity per course with section details
 * @route   GET /api/reports/seats
 */
const getSeatsReport = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ name: 1 });

    const report = [];
    for (const course of courses) {
      const sections = await Section.find({ course: course._id }).select(
        'sectionName students maxStrength'
      );

      report.push({
        courseName: course.name,
        courseCode: course.code,
        totalSeats: course.totalSeats,
        filledSeats: course.filledSeats,
        availableSeats: course.totalSeats - course.filledSeats,
        occupancyRate: course.totalSeats > 0
          ? parseFloat(((course.filledSeats / course.totalSeats) * 100).toFixed(1))
          : 0,
        sections: sections.map((s) => ({
          sectionName: s.sectionName,
          studentCount: s.students.length,
          maxStrength: s.maxStrength,
        })),
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get revenue report - breakdown by type with totals
 * @route   GET /api/reports/revenue
 */
const getRevenueReport = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchFilter = { status: 'success' };
    if (dateFrom || dateTo) {
      matchFilter.transactionDate = {};
      if (dateFrom) matchFilter.transactionDate.$gte = new Date(dateFrom);
      if (dateTo) matchFilter.transactionDate.$lte = new Date(dateTo);
    }

    // Revenue by type
    const revenueByType = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total revenue (excluding refunds)
    const totalRevenueResult = await Payment.aggregate([
      { $match: { ...matchFilter, type: { $ne: 'refund' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    // Total refunds
    const totalRefundResult = await Payment.aggregate([
      { $match: { ...matchFilter, type: 'refund' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRefunds = totalRefundResult.length > 0 ? totalRefundResult[0].total : 0;

    // Recent payments
    const recentPayments = await Payment.find({ status: 'success' })
      .populate('user', 'name email')
      .sort({ transactionDate: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        revenueByType: revenueByType.map((r) => ({
          type: r._id,
          totalAmount: r.totalAmount,
          transactionCount: r.count,
        })),
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        recentPayments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = { getApplicationsReport, getSeatsReport, getRevenueReport };
