#!/usr/bin/env node
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./src/app');

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing from .env file");
  process.exit(1);
}

// Connect to MongoDB and then start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Ezipost Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Available endpoints:`);
      console.log(`   - /api/auth`);
      console.log(`   - /api/dashboard`);
      console.log(`   - /api/mail`);
      console.log(`   - /api/audit-logs`);
      console.log(`   - /api/escrow-accounts`);
      console.log(`   - /api/mail-processing`);
      console.log(`   - /api/rate-config`);
      console.log(`   - /api/reports`);
      console.log(`   - /api/transactions`);
      console.log(`   - /api/settings`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB', err.message);
    process.exit(1);
  });
