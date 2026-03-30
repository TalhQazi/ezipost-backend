const mongoose = require('mongoose');

const rateConfigSchema = new mongoose.Schema({
    rateType: {
        type: String,
        enum: ['domestic', 'international', 'express', 'standard', 'bulk'],
        required: true,
    },
    serviceName: {
        type: String,
        required: true,
    },
    baseRate: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    weightRanges: [{
        minWeight: {
            type: Number,
            required: true,
        },
        maxWeight: {
            type: Number,
            required: true,
        },
        ratePerUnit: {
            type: Number,
            required: true,
        }
    }],
    zoneRates: [{
        zone: {
            type: String,
            required: true,
        },
        rate: {
            type: Number,
            required: true,
        },
        deliveryTime: {
            type: String,
        }
    }],
    additionalCharges: [{
        chargeType: {
            type: String,
            enum: ['fuel', 'insurance', 'customs', 'handling', 'special_delivery'],
            required: true,
        },
        chargeName: {
            type: String,
            required: true,
        },
        chargeAmount: {
            type: Number,
            required: true,
        },
        chargeType: {
            type: String,
            enum: ['fixed', 'percentage'],
            default: 'fixed',
        }
    }],
    discounts: [{
        discountType: {
            type: String,
            enum: ['volume', 'loyalty', 'promotional', 'seasonal'],
            required: true,
        },
        discountName: {
            type: String,
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
        },
        discountType: {
            type: String,
            enum: ['fixed', 'percentage'],
            default: 'percentage',
        },
        minVolume: {
            type: Number,
        },
        maxVolume: {
            type: Number,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        validUntil: {
            type: Date,
        }
    }],
    restrictions: [{
        restrictionType: {
            type: String,
            enum: ['weight', 'dimension', 'destination', 'prohibited_items'],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
        }
    }],
    effectiveDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    expiryDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'draft', 'expired'],
        default: 'active',
    },
    priority: {
        type: Number,
        default: 1,
    },
    createdBy: {
        type: String,
        required: true,
    },
    lastModifiedBy: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('RateConfig', rateConfigSchema);
