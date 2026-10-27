require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static serving for uploads ──
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ── Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/reports', require('./routes/reports'));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'IEM Admission System API is running.' });
});

// ── Auto-seed if database is empty ──
const autoSeed = async () => {
  try {
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] Database is empty. Running auto-seed with full demo dataset...');
      const { seed } = require('./seed/seed');
      await seed(true);
      console.log('[Seed] Auto-seed complete: 1 admin + 5 applicants + 4 courses created.');
    }
  } catch (err) {
    console.warn('[Seed] Auto-seed warning:', err.message);
  }
};

// ── Start Server ──
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await autoSeed();

    app.listen(PORT, () => {
      console.log(`\n🚀 IEM Admission System API running on http://localhost:${PORT}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(`\n── Available Routes ──`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/send-otp`);
      console.log(`  POST   /api/auth/verify-otp`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  GET    /api/auth/profile`);
      console.log(`  GET    /api/courses`);
      console.log(`  POST   /api/applications`);
      console.log(`  GET    /api/applications/my-application`);
      console.log(`  GET    /api/admin/dashboard`);
      console.log(`  GET    /api/reports/revenue`);
      console.log(`  GET    /api/health`);
      console.log(`  ... and more\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
