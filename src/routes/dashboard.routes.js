const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getDashboardCharts
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth.middleware');

// Fetch dashboard statistics
router.get('/stats', protect, getDashboardStats);

// Fetch dashboard charts (e.g., mail volume charts)
router.get('/charts', protect, getDashboardCharts);

module.exports = router;
