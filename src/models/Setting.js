const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['general', 'security', 'notifications', 'integrations', 'billing', 'system', 'ui'],
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    dataType: {
        type: String,
        enum: ['string', 'number', 'boolean', 'object', 'array'],
        required: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    defaultValue: {
        type: mongoose.Schema.Types.Mixed,
    },
    validationRules: {
        required: {
            type: Boolean,
            default: false,
        },
        minLength: Number,
        maxLength: Number,
        min: Number,
        max: Number,
        pattern: String,
        options: [String],
        customValidation: String,
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    isEditable: {
        type: Boolean,
        default: true,
    },
    requiresRestart: {
        type: Boolean,
        default: false,
    },
    lastModifiedBy: {
        type: String,
    },
    version: {
        type: Number,
        default: 1,
    }
}, { 
    timestamps: true,
    indexes: [
        { category: 1, key: 1 },
        { isPublic: 1 }
    ]
});

module.exports = mongoose.model('Setting', settingSchema);
