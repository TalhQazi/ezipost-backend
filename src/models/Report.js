const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportName: {
        type: String,
        required: true,
    },
    reportType: {
        type: String,
        enum: ['financial', 'operational', 'audit', 'performance', 'custom'],
        required: true,
    },
    description: {
        type: String,
    },
    parameters: {
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        filters: [{
            field: {
                type: String,
                required: true,
            },
            operator: {
                type: String,
                enum: ['equals', 'contains', 'greater_than', 'less_than', 'between'],
                required: true,
            },
            value: {
                type: mongoose.Schema.Types.Mixed,
                required: true,
            }
        }],
        groupBy: [{
            type: String,
        }],
        sortBy: {
            field: {
                type: String,
            },
            order: {
                type: String,
                enum: ['asc', 'desc'],
                default: 'desc'
            }
        }
    },
    dataSource: {
        type: String,
        enum: ['mail', 'transactions', 'audit_logs', 'escrow_accounts', 'rate_configs', 'mail_processing'],
        required: true,
    },
    schedule: {
        enabled: {
            type: Boolean,
            default: false,
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        },
        nextRun: {
            type: Date,
        },
        recipients: [{
            email: {
                type: String,
                required: true,
            },
            name: {
                type: String,
            }
        }]
    },
    format: {
        type: String,
        enum: ['json', 'csv', 'pdf', 'excel'],
        default: 'json',
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft'],
        default: 'active',
    },
    lastRun: {
        runAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['success', 'failed', 'running'],
        },
        recordCount: {
            type: Number,
        },
        errorMessage: {
            type: String,
        },
        executionTime: {
            type: Number,
        }
    },
    createdBy: {
        type: String,
        required: true,
    },
    lastModifiedBy: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
