const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    resource: {
        type: String,
        required: true,
    },
    resourceId: {
        type: String,
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['success', 'failure', 'warning'],
        default: 'success',
    }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
