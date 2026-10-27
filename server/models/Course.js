const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    minCutoff: {
      type: Number,
      required: [true, 'Minimum cutoff percentage is required'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
    },
    filledSeats: {
      type: Number,
      default: 0,
    },
    applicationFee: {
      type: Number,
      default: 1500,
    },
    enrollmentFee: {
      type: Number,
      default: 50000,
    },
    semesterFee: {
      type: Number,
      default: 75000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', courseSchema);
