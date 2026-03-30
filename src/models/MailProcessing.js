const mongoose = require('mongoose');

const mailProcessingSchema = new mongoose.Schema({
    mailId: {
        type: String,
        required: true,
        ref: 'Mail'
    },
    trackingNumber: {
        type: String,
        required: true,
    },
    processingStage: {
        type: String,
        enum: ['received', 'verified', 'processed', 'completed', 'failed'],
        default: 'received',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    assignedTo: {
        type: String,
    },
    processingSteps: [{
        step: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'failed'],
            default: 'pending',
        },
        completedAt: {
            type: Date,
        },
        completedBy: {
            type: String,
        },
        notes: {
            type: String,
        }
    }],
    documents: [{
        documentType: {
            type: String,
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        uploadedBy: {
            type: String,
        }
    }],
    issues: [{
        type: {
            type: String,
            enum: ['missing_info', 'payment_issue', 'address_error', 'customs_issue', 'other'],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open',
        },
        reportedAt: {
            type: Date,
            default: Date.now,
        },
        reportedBy: {
            type: String,
        },
        resolvedAt: {
            type: Date,
        },
        resolvedBy: {
            type: String,
        },
        resolution: {
            type: String,
        }
    }],
    estimatedCompletionTime: {
        type: Date,
    },
    actualCompletionTime: {
        type: Date,
    },
    processingNotes: {
        type: String,
    },
    createdBy: {
        type: String,
        required: true,
    },
    lastModifiedBy: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('MailProcessing', mailProcessingSchema);
