const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    sectionName: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
      },
    ],
    maxStrength: {
      type: Number,
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Section', sectionSchema);
