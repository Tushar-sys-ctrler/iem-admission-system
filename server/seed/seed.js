require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Course = require('../models/Course');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const Section = require('../models/Section');
const Notification = require('../models/Notification');

const seed = async (isAutoSeed = false) => {
  try {
    if (!mongoose.connection.readyState) {
      await connectDB();
    }
    console.log('\n🌱 Starting seed process...\n');

    // ── Clear all collections ──
    await User.deleteMany({});
    await Course.deleteMany({});
    await Application.deleteMany({});
    await Payment.deleteMany({});
    await Section.deleteMany({});
    await Notification.deleteMany({});
    console.log('✓ All collections cleared.');

    // ── 1. Create Courses ──
    const coursesData = [
      {
        name: 'B.Tech CSE',
        code: 'CSE',
        minCutoff: 75,
        totalSeats: 120,
        filledSeats: 0,
        applicationFee: 1500,
        enrollmentFee: 50000,
        semesterFee: 75000,
      },
      {
        name: 'B.Tech CSE (AI & ML)',
        code: 'CSE-AIML',
        minCutoff: 80,
        totalSeats: 60,
        filledSeats: 0,
        applicationFee: 1500,
        enrollmentFee: 60000,
        semesterFee: 80000,
      },
      {
        name: 'B.Tech ECE',
        code: 'ECE',
        minCutoff: 70,
        totalSeats: 90,
        filledSeats: 0,
        applicationFee: 1500,
        enrollmentFee: 45000,
        semesterFee: 70000,
      },
      {
        name: 'BCA',
        code: 'BCA',
        minCutoff: 60,
        totalSeats: 120,
        filledSeats: 0,
        applicationFee: 1000,
        enrollmentFee: 30000,
        semesterFee: 50000,
      },
    ];

    const courses = await Course.insertMany(coursesData);
    const courseMap = {};
    courses.forEach((c) => {
      courseMap[c.code] = c;
    });
    console.log(`✓ ${courses.length} courses created.`);

    // ── 2. Create Admin ──
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@iem.edu.in',
      mobile: '9000000000',
      password: adminPassword,
      role: 'admin',
      isVerified: true,
    });
    console.log('✓ Admin user created (admin@iem.edu.in / Admin@123).');

    // ── Helper: hash password (bypass pre-save hook by using direct password) ──
    const applicantPassword = await bcrypt.hash('Test@1234', 10);

    // Common document set (dummy paths)
    const verifiedDocs = {
      tenthMarkSheet: { url: '/uploads/sample_marksheet.pdf', status: 'Verified', rejectionReason: '' },
      twelfthMarkSheet: { url: '/uploads/sample_12th_marksheet.pdf', status: 'Verified', rejectionReason: '' },
      idProof: { url: '/uploads/sample_id_proof.pdf', status: 'Verified', rejectionReason: '' },
      photo: { url: '/uploads/sample_photo.jpg', status: 'Verified', rejectionReason: '' },
      signature: { url: '/uploads/sample_signature.png', status: 'Verified', rejectionReason: '' },
    };

    const pendingDocs = {
      tenthMarkSheet: { url: '/uploads/sample_marksheet.pdf', status: 'Pending', rejectionReason: '' },
      twelfthMarkSheet: { url: '/uploads/sample_12th_marksheet.pdf', status: 'Pending', rejectionReason: '' },
      idProof: { url: '/uploads/sample_id_proof.pdf', status: 'Pending', rejectionReason: '' },
      photo: { url: '/uploads/sample_photo.jpg', status: 'Pending', rejectionReason: '' },
      signature: { url: '/uploads/sample_signature.png', status: 'Pending', rejectionReason: '' },
    };

    // ── 3. Applicant 1 - Rahul Sharma (Under Review) ──
    const user1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      mobile: '9876543210',
      password: applicantPassword,
      role: 'applicant',
      isVerified: true,
    });

    const app1 = await Application.create({
      applicant: user1._id,
      applicationId: 'IEM-2026-0001',
      status: 'Under Review',
      personalDetails: {
        dob: new Date('2004-03-15'),
        gender: 'Male',
        category: 'General',
        guardianName: 'Rajesh Sharma',
        guardianPhone: '9876543200',
        address: '45 Park Street, Kolkata, WB 700016',
        aadhaarNumber: '123456789012',
      },
      academicDetails: {
        tenthBoard: 'CBSE',
        tenthYear: 2022,
        tenthPercentage: 89,
        twelfthBoard: 'CBSE',
        twelfthYear: 2024,
        physicsMarks: 88,
        chemistryMarks: 82,
        mathMarks: 85,
        twelfthPercentage: 85,
        pcmPercentage: 85,
        entranceExam: 'JEE Main',
        entranceRank: 5420,
      },
      coursePreferences: [
        { course: courseMap['CSE']._id, priority: 1, isEligible: true },
        { course: courseMap['CSE-AIML']._id, priority: 2, isEligible: true },
        { course: courseMap['ECE']._id, priority: 3, isEligible: true },
      ],
      documents: pendingDocs,
      currentStep: 4,
      lastSavedAt: new Date(),
    });

    // App fee payment for Rahul
    const payment1 = await Payment.create({
      user: user1._id,
      application: app1._id,
      receiptNumber: 'RCPT-2026-1001',
      type: 'application_fee',
      amount: 1500,
      method: 'UPI',
      status: 'success',
      transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    console.log('✓ Applicant 1 created: Rahul Sharma (Under Review)');

    // ── 4. Applicant 2 - Priya Patel (Not Eligible) ──
    const user2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      mobile: '9876543211',
      password: applicantPassword,
      role: 'applicant',
      isVerified: true,
    });

    const app2 = await Application.create({
      applicant: user2._id,
      applicationId: 'IEM-2026-0002',
      status: 'Not Eligible',
      personalDetails: {
        dob: new Date('2004-07-22'),
        gender: 'Female',
        category: 'OBC',
        guardianName: 'Manoj Patel',
        guardianPhone: '9876543201',
        address: '12 Salt Lake, Sector V, Kolkata, WB 700091',
        aadhaarNumber: '234567890123',
      },
      academicDetails: {
        tenthBoard: 'ICSE',
        tenthYear: 2022,
        tenthPercentage: 72,
        twelfthBoard: 'ISC',
        twelfthYear: 2024,
        physicsMarks: 55,
        chemistryMarks: 60,
        mathMarks: 59,
        twelfthPercentage: 58,
        pcmPercentage: 58,
        entranceExam: 'None',
        entranceRank: null,
      },
      coursePreferences: [
        { course: courseMap['CSE']._id, priority: 1, isEligible: false },
        { course: courseMap['ECE']._id, priority: 2, isEligible: false },
        { course: courseMap['BCA']._id, priority: 3, isEligible: true },
      ],
      documents: pendingDocs,
      eligibilityFlag: 'PCM percentage below minimum cutoff for preferred courses',
      currentStep: 4,
      lastSavedAt: new Date(),
    });

    console.log('✓ Applicant 2 created: Priya Patel (Not Eligible)');

    // ── 5. Applicant 3 - Amit Kumar (Shortlisted) ──
    const user3 = await User.create({
      name: 'Amit Kumar',
      email: 'amit@example.com',
      mobile: '9876543212',
      password: applicantPassword,
      role: 'applicant',
      isVerified: true,
    });

    const enrollmentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const app3 = await Application.create({
      applicant: user3._id,
      applicationId: 'IEM-2026-0003',
      status: 'Shortlisted',
      personalDetails: {
        dob: new Date('2004-01-10'),
        gender: 'Male',
        category: 'General',
        guardianName: 'Suresh Kumar',
        guardianPhone: '9876543202',
        address: '78 New Town, Action Area II, Kolkata, WB 700161',
        aadhaarNumber: '345678901234',
      },
      academicDetails: {
        tenthBoard: 'CBSE',
        tenthYear: 2022,
        tenthPercentage: 95,
        twelfthBoard: 'CBSE',
        twelfthYear: 2024,
        physicsMarks: 95,
        chemistryMarks: 90,
        mathMarks: 91,
        twelfthPercentage: 92,
        pcmPercentage: 92,
        entranceExam: 'JEE Main',
        entranceRank: 1250,
      },
      coursePreferences: [
        { course: courseMap['CSE-AIML']._id, priority: 1, isEligible: true },
        { course: courseMap['CSE']._id, priority: 2, isEligible: true },
      ],
      documents: verifiedDocs,
      allottedCourse: courseMap['CSE-AIML']._id,
      allotmentRound: 1,
      enrollmentDeadline,
      currentStep: 4,
      lastSavedAt: new Date(),
    });

    // App fee for Amit
    await Payment.create({
      user: user3._id,
      application: app3._id,
      receiptNumber: 'RCPT-2026-1003',
      type: 'application_fee',
      amount: 1500,
      method: 'Card',
      status: 'success',
      transactionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    console.log('✓ Applicant 3 created: Amit Kumar (Shortlisted, CSE-AIML allotted)');

    // ── 6. Applicant 4 - Sneha Das (Admitted) ──
    const user4 = await User.create({
      name: 'Sneha Das',
      email: 'sneha@example.com',
      mobile: '9876543213',
      password: applicantPassword,
      role: 'applicant',
      isVerified: true,
    });

    const app4 = await Application.create({
      applicant: user4._id,
      applicationId: 'IEM-2026-0004',
      status: 'Admitted',
      personalDetails: {
        dob: new Date('2004-05-18'),
        gender: 'Female',
        category: 'General',
        guardianName: 'Tapan Das',
        guardianPhone: '9876543203',
        address: '23 Gariahat Road, Kolkata, WB 700029',
        aadhaarNumber: '456789012345',
      },
      academicDetails: {
        tenthBoard: 'WBBSE',
        tenthYear: 2022,
        tenthPercentage: 91,
        twelfthBoard: 'WBCHSE',
        twelfthYear: 2024,
        physicsMarks: 90,
        chemistryMarks: 85,
        mathMarks: 89,
        twelfthPercentage: 88,
        pcmPercentage: 88,
        entranceExam: 'JEE Main',
        entranceRank: 3100,
      },
      coursePreferences: [
        { course: courseMap['CSE']._id, priority: 1, isEligible: true },
        { course: courseMap['ECE']._id, priority: 2, isEligible: true },
      ],
      documents: verifiedDocs,
      allottedCourse: courseMap['CSE']._id,
      rollNumber: 'IEM2026CSE001',
      allotmentRound: 1,
      currentStep: 4,
      lastSavedAt: new Date(),
    });

    // Increment CSE filled seats
    await Course.findByIdAndUpdate(courseMap['CSE']._id, { $inc: { filledSeats: 1 } });

    // App fee for Sneha
    await Payment.create({
      user: user4._id,
      application: app4._id,
      receiptNumber: 'RCPT-2026-1004',
      type: 'application_fee',
      amount: 1500,
      method: 'UPI',
      status: 'success',
      transactionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    // Enrollment fee for Sneha
    await Payment.create({
      user: user4._id,
      application: app4._id,
      receiptNumber: 'RCPT-2026-2004',
      type: 'enrollment_fee',
      amount: 50000,
      method: 'NetBanking',
      status: 'success',
      transactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    console.log('✓ Applicant 4 created: Sneha Das (Admitted, CSE, roll IEM2026CSE001)');

    // ── 7. Applicant 5 - Arjun Roy (Draft) ──
    const user5 = await User.create({
      name: 'Arjun Roy',
      email: 'arjun@example.com',
      mobile: '9876543214',
      password: applicantPassword,
      role: 'applicant',
      isVerified: true,
    });

    const app5 = await Application.create({
      applicant: user5._id,
      status: 'Draft',
      personalDetails: {
        dob: new Date('2005-02-28'),
        gender: 'Male',
        category: 'SC',
        guardianName: '',
        guardianPhone: '',
        address: '',
        aadhaarNumber: '',
      },
      currentStep: 1,
      lastSavedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    });

    console.log('✓ Applicant 5 created: Arjun Roy (Draft, Step 1 incomplete)');

    // ── 8. Create sample notifications ──
    const notifications = [
      {
        user: user1._id,
        type: 'in_app',
        subject: 'Payment Successful',
        message: `Your application fee of ₹1500 was successful. Receipt: RCPT-2026-1001`,
      },
      {
        user: user3._id,
        type: 'in_app',
        subject: 'Payment Successful',
        message: `Your application fee of ₹1500 was successful. Receipt: RCPT-2026-1003`,
      },
      {
        user: user3._id,
        type: 'in_app',
        subject: 'Seat Allotted - Congratulations!',
        message: `You have been allotted a seat in B.Tech CSE (AI & ML). Please accept within 7 days.`,
      },
      {
        user: user4._id,
        type: 'in_app',
        subject: 'Payment Successful',
        message: `Your application fee of ₹1500 was successful. Receipt: RCPT-2026-1004`,
      },
      {
        user: user4._id,
        type: 'in_app',
        subject: 'Enrollment Fee Paid',
        message: `Your enrollment fee of ₹50000 was successful. Receipt: RCPT-2026-2004`,
      },
      {
        user: user4._id,
        type: 'in_app',
        subject: 'Admission Confirmed',
        message: `Your admission to B.Tech CSE has been confirmed. Roll Number: IEM2026CSE001`,
      },
      {
        user: user2._id,
        type: 'in_app',
        subject: 'Eligibility Update',
        message: `Your application has been reviewed. Your PCM percentage is below the minimum cutoff for B.Tech courses.`,
      },
    ];

    await Notification.insertMany(notifications);
    console.log(`✓ ${notifications.length} notifications created.`);

    // ── Summary ──
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║        SEED COMPLETE - SUMMARY            ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log(`║  Courses:       ${courses.length}                         ║`);
    console.log(`║  Users:         6 (1 admin + 5 applicants)║`);
    console.log(`║  Applications:  5                         ║`);
    console.log(`║  Payments:      4                         ║`);
    console.log(`║  Notifications: ${notifications.length}                         ║`);
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║  Admin Login:                             ║');
    console.log('║    Email:    admin@iem.edu.in             ║');
    console.log('║    Password: Admin@123                    ║');
    console.log('║                                          ║');
    console.log('║  Applicant Login (any):                   ║');
    console.log('║    Password: Test@1234                    ║');
    console.log('║    Emails:   rahul@example.com            ║');
    console.log('║             priya@example.com             ║');
    console.log('║             amit@example.com              ║');
    console.log('║             sneha@example.com             ║');
    console.log('║             arjun@example.com             ║');
    console.log('╚═══════════════════════════════════════════╝');

    if (!isAutoSeed) {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Seed error:', err);
    if (!isAutoSeed) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed };
