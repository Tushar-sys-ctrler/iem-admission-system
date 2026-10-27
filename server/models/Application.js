const mongoose = require('mongoose');

const documentSubSchema = {
  url: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending',
  },
  rejectionReason: { type: String, default: '' },
};

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicationId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Under Review',
        'Shortlisted',
        'Admitted',
        'Not Eligible',
        'Rejected',
        'Withdrawn',
      ],
      default: 'Draft',
    },

    // Step 1 - Personal Details
    personalDetails: {
      dob: { type: Date },
      gender: { type: String, enum: ['Male', 'Female', 'Other'] },
      category: { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
      guardianName: { type: String },
      guardianPhone: { type: String },
      address: { type: String },
      aadhaarNumber: { type: String },
    },

    // Step 2 - Academic History
    academicDetails: {
      tenthBoard: { type: String },
      tenthYear: { type: Number },
      tenthPercentage: { type: Number },
      twelfthBoard: { type: String },
      twelfthYear: { type: Number },
      physicsMarks: { type: Number },
      chemistryMarks: { type: Number },
      mathMarks: { type: Number },
      twelfthPercentage: { type: Number },
      pcmPercentage: { type: Number },
      entranceExam: {
        type: String,
        enum: ['WBJEE', 'JEE Main', 'None'],
      },
      entranceRank: { type: Number },
    },

    // Step 3 - Course Preferences (ordered array)
    coursePreferences: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        priority: { type: Number },
        isEligible: { type: Boolean, default: true },
      },
    ],

    // Step 4 - Documents
    documents: {
      tenthMarkSheet: documentSubSchema,
      twelfthMarkSheet: documentSubSchema,
      idProof: documentSubSchema,
      photo: documentSubSchema,
      signature: documentSubSchema,
    },

    // Seat Allotment
    allottedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    allottedSection: { type: String },
    rollNumber: { type: String },
    allotmentRound: { type: Number },
    enrollmentDeadline: { type: Date },

    // Withdrawal
    withdrawalReason: { type: String },
    withdrawalDate: { type: Date },
    refundAmount: { type: Number },

    // Auto-save
    lastSavedAt: { type: Date },
    currentStep: { type: Number, default: 1 },

    // Eligibility
    eligibilityFlag: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Application', applicationSchema);
