const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iem_admissions';
    console.log(`[DB] Attempting connection to: ${uri}`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[DB] MongoDB connected successfully: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Primary MongoDB connection failed: ${err.message}`);
    console.log('[DB] Falling back to MongoMemoryServer...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[DB] MongoMemoryServer connected: ${memUri}`);
    } catch (fallbackErr) {
      console.error(`[DB] MongoMemoryServer fallback also failed: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
