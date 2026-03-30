const Mail = require('../models/Mail');
const Transaction = require('../models/Transaction');
const EscrowAccount = require('../models/EscrowAccount');
const MailProcessing = require('../models/MailProcessing');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        // Parallel aggregation for performance
        const [
            mailStats,
            transactionStats,
            escrowStats,
            processingStats
        ] = await Promise.all([
            // Mail statistics
            Mail.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        processed: { $sum: { $cond: [{ $eq: ["$status", "Processed"] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] } }
                    }
                }
            ]),
            
            // Transaction statistics
            Transaction.aggregate([
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" },
                        count: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
                    }
                }
            ]),

            // Escrow statistics
            EscrowAccount.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBalance: { $sum: "$balance" },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Mail Processing statistics
            MailProcessing.aggregate([
                {
                    $group: {
                        _id: null,
                        activeProcessing: { 
                            $sum: { 
                                $cond: [
                                    { $in: ["$processingStage", ["received", "verified", "processed"]] }, 
                                    1, 
                                    0
                                ] 
                            } 
                        }
                    }
                }
            ])
        ]);

        const dashboardData = {
            mails: mailStats[0] || { total: 0, processed: 0, pending: 0, failed: 0 },
            transactions: transactionStats[0] || { totalAmount: 0, count: 0, completed: 0 },
            escrow: escrowStats[0] || { totalBalance: 0, count: 0 },
            processing: processingStats[0] || { activeProcessing: 0 },
            lastUpdated: new Date()
        };

        res.json(dashboardData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get chart data (e.g., mail volume over time)
// @route   GET /api/dashboard/charts
// @access  Private
exports.getDashboardCharts = async (req, res) => {
    try {
        const mailVolume = await Mail.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } },
            { $limit: 30 }
        ]);

        res.json({ mailVolume });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
