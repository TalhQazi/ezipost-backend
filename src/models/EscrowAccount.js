const mongoose = require('mongoose');

const escrowAccountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: true,
        unique: true,
    },
    accountName: {
        type: String,
        required: true,
    },
    bankName: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
        enum: ['checking', 'savings', 'business'],
        default: 'business',
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'frozen'],
        default: 'active',
    },
    minimumBalance: {
        type: Number,
        default: 0,
    },
    maximumBalance: {
        type: Number,
    },
    routingNumber: {
        type: String,
    },
    swiftCode: {
        type: String,
    },
    contactEmail: {
        type: String,
    },
    contactPhone: {
        type: String,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    notes: {
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

module.exports = mongoose.model('EscrowAccount', escrowAccountSchema);
