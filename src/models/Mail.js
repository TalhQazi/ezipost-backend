const mongoose = require('mongoose');

const mailSchema = new mongoose.Schema({
        id: {
            type: String,
            required: true,
        },
        tracking: {
            type: String,
            required: true,
        },
        time: {
            type:String,
        },
        mailClass: {
            type: String,
        },
        paid: {
            type: String,
        },
        required: {type: Number},
        shortfall: {type: Number},
        escrow: {type: String, default: null},
        status: {type: String, 
            enum: ["Processed", "Pending", "Failed", "Escrow Used"],
            default: "Pending",
        },

    }, {timestamps: true});

    module.exports = mongoose.model('Mail', mailSchema);