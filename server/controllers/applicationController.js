const Application = require('../models/Application');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

/**
 * @desc    Create a new application for the authenticated user
 * @route   POST /api/applications
 */
const createApplication = async (req, res) => {
  try {
    // Check if user already has an application
    const existing = await Application.findOne({ applicant: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an application. Only one application is allowed per user.',
        data: existing,
      });
    }

    const application = await Application.create({
      applicant: req.user._id,
      status: 'Draft',
      currentStep: 1,
      lastSavedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Application created successfully.',
      data: application,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Get current user's application
 * @route   GET /api/applications/my-application
 */
const getMyApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ applicant: req.user._id })
      .populate('coursePreferences.course')
      .populate('allottedCourse')
      .populate('applicant', 'name email mobile');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found. Please create one first.',
      });
    }

    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * Helper: Compute PCM percentage and check eligibility
 */
const computeEligibility = async (application) => {
  // Compute PCM percentage from individual marks
  const ad = application.academicDetails;
  if (
    ad &&
    ad.physicsMarks != null &&
    ad.chemistryMarks != null &&
    ad.mathMarks != null
  ) {
    ad.pcmPercentage = parseFloat(
      ((ad.physicsMarks + ad.chemistryMarks + ad.mathMarks) / 3).toFixed(2)
    );
  }

  // Auto-check eligibility for each course preference
  if (application.coursePreferences && application.coursePreferences.length > 0 && ad && ad.pcmPercentage != null) {
    let anyEligible = false;
    for (const pref of application.coursePreferences) {
      let course = pref.course;
      // If not populated, fetch it
      if (course && !course.minCutoff && course._id) {
        course = await Course.findById(course._id || course);
      } else if (typeof course === 'string' || (course && !course.minCutoff)) {
        course = await Course.findById(course);
      }
      if (course) {
        pref.isEligible = ad.pcmPercentage >= course.minCutoff;
        if (pref.isEligible) anyEligible = true;
      }
    }

    if (!anyEligible) {
      application.eligibilityFlag =
        'PCM percentage below minimum cutoff for preferred courses';
    } else {
      application.eligibilityFlag = '';
    }
  }

  return application;
};

/**
 * @desc    Update application fields (partial update for auto-save)
 * @route   PUT /api/applications/:id
 */
const updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (!['Draft', 'Submitted'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update application in "${application.status}" status.`,
      });
    }

    const { personalDetails, academicDetails, coursePreferences, currentStep } = req.body;

    if (personalDetails) {
      application.personalDetails = {
        ...application.personalDetails?.toObject?.() || {},
        ...personalDetails,
      };
    }

    if (academicDetails) {
      application.academicDetails = {
        ...application.academicDetails?.toObject?.() || {},
        ...academicDetails,
      };
    }

    if (coursePreferences) {
      application.coursePreferences = coursePreferences;
    }

    if (currentStep != null) {
      application.currentStep = currentStep;
    }

    application.lastSavedAt = new Date();

    // Compute eligibility
    await computeEligibility(application);

    await application.save();

    const updated = await Application.findById(application._id)
      .populate('coursePreferences.course')
      .populate('allottedCourse');

    res.json({
      success: true,
      message: 'Application updated successfully.',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Save current form state as draft
 * @route   PUT /api/applications/:id/save-draft
 */
const saveDraft = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const { personalDetails, academicDetails, coursePreferences, currentStep } = req.body;

    if (personalDetails) {
      application.personalDetails = {
        ...application.personalDetails?.toObject?.() || {},
        ...personalDetails,
      };
    }
    if (academicDetails) {
      application.academicDetails = {
        ...application.academicDetails?.toObject?.() || {},
        ...academicDetails,
      };
    }
    if (coursePreferences) {
      application.coursePreferences = coursePreferences;
    }
    if (currentStep != null) {
      application.currentStep = currentStep;
    }

    application.lastSavedAt = new Date();
    application.status = 'Draft';

    await application.save();

    res.json({
      success: true,
      message: 'Draft saved successfully.',
      data: { lastSavedAt: application.lastSavedAt, currentStep: application.currentStep },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Submit application with validation
 * @route   POST /api/applications/:id/submit
 */
const submitApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (application.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been submitted.',
      });
    }

    // Validate required fields
    const errors = [];
    const pd = application.personalDetails;
    if (!pd || !pd.dob || !pd.gender || !pd.category || !pd.guardianName || !pd.address) {
      errors.push('Personal details are incomplete.');
    }

    const ad = application.academicDetails;
    if (
      !ad ||
      !ad.tenthBoard ||
      ad.tenthPercentage == null ||
      !ad.twelfthBoard ||
      ad.physicsMarks == null ||
      ad.chemistryMarks == null ||
      ad.mathMarks == null
    ) {
      errors.push('Academic details are incomplete.');
    }

    if (!application.coursePreferences || application.coursePreferences.length === 0) {
      errors.push('At least one course preference is required.');
    }

    // Check documents
    const docs = application.documents;
    if (!docs) {
      errors.push('Documents are required.');
    } else {
      const requiredDocs = ['tenthMarkSheet', 'twelfthMarkSheet', 'idProof', 'photo', 'signature'];
      for (const docName of requiredDocs) {
        if (!docs[docName] || !docs[docName].url) {
          errors.push(`${docName} document is required.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please complete all required fields.',
        errors,
      });
    }

    // Generate unique application ID (IEM-2026-XXXX)
    const count = await Application.countDocuments({
      applicationId: { $exists: true, $ne: null },
    });
    const seqNum = String(count + 1).padStart(4, '0');
    application.applicationId = `IEM-2026-${seqNum}`;
    application.status = 'Submitted';
    application.lastSavedAt = new Date();

    // Compute eligibility before submit
    await computeEligibility(application);

    await application.save();

    // Create a notification
    await Notification.create({
      user: req.user._id,
      type: 'in_app',
      subject: 'Application Submitted',
      message: `Your application ${application.applicationId} has been submitted successfully.`,
    });

    res.json({
      success: true,
      message: 'Application submitted successfully.',
      data: {
        applicationId: application.applicationId,
        status: application.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Upload a document for the application
 * @route   POST /api/applications/:id/upload/:docType
 */
const uploadDocument = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const { docType } = req.params;
    const validDocTypes = ['tenthMarkSheet', 'twelfthMarkSheet', 'idProof', 'photo', 'signature'];
    if (!validDocTypes.includes(docType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid document type. Must be one of: ${validDocTypes.join(', ')}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    if (!application.documents) {
      application.documents = {};
    }

    application.documents[docType] = {
      url: fileUrl,
      status: 'Pending',
      rejectionReason: '',
    };

    application.lastSavedAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: `${docType} uploaded successfully.`,
      data: { docType, url: fileUrl, status: 'Pending' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Accept allotted seat
 * @route   POST /api/applications/:id/accept-seat
 */
const acceptSeat = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (application.status !== 'Shortlisted') {
      return res.status(400).json({
        success: false,
        message: 'Only shortlisted applications can accept seats.',
      });
    }

    if (!application.allottedCourse) {
      return res.status(400).json({
        success: false,
        message: 'No course allotted to this application.',
      });
    }

    application.status = 'Admitted';
    await application.save();

    // Increment filled seats for allotted course
    await Course.findByIdAndUpdate(application.allottedCourse, {
      $inc: { filledSeats: 1 },
    });

    // Create notification
    await Notification.create({
      user: req.user._id,
      type: 'in_app',
      subject: 'Seat Accepted',
      message: `Congratulations! You have accepted your seat. Your admission is confirmed.`,
    });

    res.json({
      success: true,
      message: 'Seat accepted. Admission confirmed.',
      data: { status: 'Admitted' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

/**
 * @desc    Withdraw admission
 * @route   POST /api/applications/:id/withdraw
 */
const withdrawAdmission = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('allottedCourse');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (!['Admitted', 'Shortlisted'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only admitted or shortlisted students can withdraw.',
      });
    }

    const { reason } = req.body;

    // Calculate refund: enrollment fee minus 10% processing fee
    let refundAmount = 0;
    if (application.status === 'Admitted' && application.allottedCourse) {
      const course = application.allottedCourse;
      const enrollmentFee = course.enrollmentFee || 50000;
      refundAmount = Math.round(enrollmentFee * 0.9); // 90% refund (10% deduction)

      // Release seat
      await Course.findByIdAndUpdate(course._id, {
        $inc: { filledSeats: -1 },
      });
    }

    application.status = 'Withdrawn';
    application.withdrawalReason = reason || 'No reason provided';
    application.withdrawalDate = new Date();
    application.refundAmount = refundAmount;
    await application.save();

    // Create refund payment record if applicable
    if (refundAmount > 0) {
      await Payment.create({
        user: req.user._id,
        application: application._id,
        type: 'refund',
        amount: refundAmount,
        status: 'success',
        receiptNumber: `RCPT-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
        transactionDate: new Date(),
      });
    }

    // Notification
    await Notification.create({
      user: req.user._id,
      type: 'in_app',
      subject: 'Admission Withdrawn',
      message: `Your admission has been withdrawn. Refund amount: ₹${refundAmount}.`,
    });

    res.json({
      success: true,
      message: 'Admission withdrawn successfully.',
      data: {
        status: 'Withdrawn',
        refundAmount,
        withdrawalDate: application.withdrawalDate,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.', error: err.message });
  }
};

module.exports = {
  createApplication,
  getMyApplication,
  updateApplication,
  saveDraft,
  submitApplication,
  uploadDocument,
  acceptSeat,
  withdrawAdmission,
};
