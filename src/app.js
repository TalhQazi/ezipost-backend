const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const mailRoutes = require('./routes/mailRoutes');
// const escrowRoutes = require('./routes/escrow.routes');
const auditRoutes = require('./routes/audit.routes');
const bankRoutes = require('./routes/bank.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const escrowAccountRoutes = require('./routes/escrowAccount.routes');
const mailProcessingRoutes = require('./routes/mailProcessing.routes');
const rateConfigRoutes = require('./routes/rateConfig.routes');
const reportRoutes = require('./routes/report.routes');
const transactionRoutes = require('./routes/transaction.routes');
const settingRoutes = require('./routes/setting.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/dashboard',
      '/api/mail',
      '/api/escrow',
      '/api/audit',
      '/api/bank',
      '/api/audit-logs',
      '/api/escrow-accounts',
      '/api/mail-processing',
      '/api/rate-config',
      '/api/reports',
      '/api/transactions',
      '/api/settings'
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/mails', mailRoutes);
// app.use('/api/escrow', escrowRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/escrow-accounts', escrowAccountRoutes);
app.use('/api/mail-processing', mailProcessingRoutes);
app.use('/api/rate-config', rateConfigRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/settings', settingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    availableEndpoints: [
      '/health',
      '/api/mail',
      '/api/escrow',
      '/api/audit',
      '/api/bank',
      '/api/audit-logs',
      '/api/escrow-accounts',
      '/api/mail-processing',
      '/api/rate-config',
      '/api/reports',
      '/api/transactions',
      '/api/settings'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;