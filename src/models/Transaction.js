const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    mailId: {
        type: String,
        required: true,
        ref: 'Mail'
    },
    trackingNumber: {
        type: String,
        required: true,
    },
    transactionType: {
        type: String,
        enum: ['payment', 'refund', 'escrow_deposit', 'escrow_withdrawal', 'fee', 'penalty', 'adjustment'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'cash', 'check', 'other'],
    },
    paymentDetails: {
        cardLastFour: String,
        cardType: String,
        bankAccount: String,
        transactionReference: String,
        authorizationCode: String,
        processor: String,
    },
    escrowAccount: {
        accountId: {
            type: String,
            ref: 'EscrowAccount'
        },
        accountNumber: String,
        accountName: String,
    },
    parties: {
        payer: {
            name: String,
            email: String,
            phone: String,
            address: {
                street: String,
                city: String,
                state: String,
                zipCode: String,
                country: String,
            }
        },
        payee: {
            name: String,
            email: String,
            phone: String,
            address: {
                street: String,
                city: String,
                state: String,
                zipCode: String,
                country: String,
            }
        }
    },
    fees: [{
        feeType: {
            type: String,
            enum: ['processing', 'service', 'late_payment', 'escrow', 'other'],
            required: true,
        },
        feeAmount: {
            type: Number,
            required: true,
        },
        feeDescription: String,
        calculatedAt: {
            type: Date,
            default: Date.now,
        }
    }],
    timeline: [{
        status: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        notes: String,
        updatedBy: String,
    }],
    documents: [{
        documentType: {
            type: String,
            enum: ['invoice', 'receipt', 'proof_of_payment', 'refund_request', 'other'],
            required: true,
        },
        fileName: String,
        fileUrl: String,
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        uploadedBy: String,
    }],
    notes: {
        type: String,
    },
    internalNotes: {
        type: String,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    assignedTo: {
        type: String,
    },
    dueDate: {
        type: Date,
    },
    completedDate: {
        type: Date,
    },
    failureReason: {
        type: String,
    },
    refundDetails: {
        refundAmount: Number,
        refundReason: String,
        refundDate: Date,
        refundMethod: String,
        refundReference: String,
    },
    createdBy: {
        type: String,
        required: true,
    },
    lastModifiedBy: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
